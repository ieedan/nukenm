import fs from "node:fs/promises";
import path from "node:path";
import { Command, Option } from "commander";
import {
	AGENTS,
	detect,
	type ResolvedCommand,
	resolveCommand,
} from "package-manager-detector";
import pc from "picocolors";
import { x } from "tinyexec";
import { z } from "zod";
import { Spinner } from "./spinner";
import { formatDuration, type Milliseconds } from "./utils/time";

const IGNORE_DIRS = [".next", ".svelte-kit"];

const PM_LOCK_FILES = {
	npm: ["package-lock.json"],
	yarn: ["yarn.lock"],
	pnpm: ["pnpm-lock.yaml"],
	bun: ["bun.lockb", "bun.lock"],
};

const OptionsSchema = z.object({
	packageManager: z.enum(AGENTS.map((agent) => agent)).optional(),
	lockFile: z.boolean(),
	install: z.boolean(),
	cwd: z.string(),
});

type Options = z.infer<typeof OptionsSchema>;

export const cli = new Command()
	.option("--cwd <cwd>", "The directory to run the command in", process.cwd())
	.option(
		"-l, --lock-file",
		"Whether or not to remove lock files as well",
		false
	)
	.option("--no-install", "Do not reinstall dependencies after nuking")
	.addOption(
		new Option(
			"--package-manager <packageManager>",
			"The package manager to use"
		).choices(AGENTS)
	)
	.action(async (options) => {
		const parsed = OptionsSchema.parse(options);
		await run(parsed);
	});

async function run(options: Options) {
    

	const startedAt = Date.now();
	const foundModules: string[] = [];
	const spinner = new Spinner({
		text: "Searching for node_modules",
		successIcon: "🍄‍🟫",
	}).start();

	function handleFound(dir: string) {
		foundModules.push(dir);
		spinner.message(`Found ${pc.green(foundModules.length)}`);
	}

	await find(options.cwd, {
		onFound: handleFound,
		findLockFiles: options.lockFile,
	});

	spinner.message(`Nuking ${pc.green(foundModules.length)}`);

	const nukedModules: string[] = [];

	function handleNuked(dir: string) {
		nukedModules.push(dir);
		spinner.message(`Nuked ${pc.green(nukedModules.length)}`);
	}

	await nuke(foundModules, { onNuked: handleNuked });

	const elapsed = Date.now() - startedAt;

	spinner.success(
		`Nuked ${pc.green(foundModules.length)} in ${pc.green(formatDuration(elapsed as Milliseconds))}`
	);

	if (options.install) {
		// Add a newline to separate the output
		process.stdout.write("\n");
		await reinstall(options);
	}

	process.exit(0);
}

async function find(
	dir: string,
	{
		onFound,
		findLockFiles,
	}: { onFound: (dir: string) => void; findLockFiles: boolean }
) {
	const lockFiles = Object.values(PM_LOCK_FILES).flat();
	const dirs = await fs.readdir(dir);

	for (const subDir of dirs) {
		if (
			subDir === "node_modules" ||
			(findLockFiles && lockFiles.includes(subDir))
		) {
			onFound(path.join(dir, subDir));
			continue;
		}

		if (IGNORE_DIRS.includes(subDir)) {
			continue;
		}

		const stats = await fs.stat(path.join(dir, subDir));

		if (stats.isFile()) {
			continue;
		}

		await find(path.join(dir, subDir), { onFound, findLockFiles });
	}
}

async function nuke(
	dirs: string[],
	{ onNuked }: { onNuked: (dir: string) => void }
) {
	for (const dir of dirs) {
		await fs.rm(dir, { recursive: true, force: true });
		onNuked(dir);
	}
}

async function reinstall(options: Options) {
	const pm =
		options.packageManager ??
		(await detect({ cwd: options.cwd }))?.agent ??
		"npm";
	const installCommand =
		resolveCommand(pm, "install", []) ??
		({ command: "npm", args: ["install"] } satisfies ResolvedCommand);

	process.stdout.write(
		`Installing dependencies with ${pc.cyan(`${installCommand.command} ${installCommand.args.join(" ")}`)}\n`
	);

	const proc = x(installCommand.command, installCommand.args);

	for await (const line of proc) {
		process.stdout.write(pc.dim(`${line}\n`));
	}
}
