[![npm version](https://flat.badgen.net/npm/v/nukenm?color=yellow)](https://npmjs.com/package/nukenm)
[![npm downloads](https://flat.badgen.net/npm/dm/nukenm?color=yellow)](https://npmjs.com/package/nukenm)

# nukenm

A CLI to nuke node_modules and reinstall dependencies with your chosen package manager.

```sh
pnpx nukenm
```

## Options

### `--cwd <cwd>`

The directory to run the command in. Defaults to the current working directory.

```sh
pnpx nukenm --cwd /path/to/project
```

### `-l, --lock-file`

Whether or not to remove lock files as well. Defaults to `false`.

```sh
pnpx nukenm --lock-file
```

### `--no-install`

Do not reinstall dependencies after nuking.

```sh
pnpx nukenm --no-install
```

### `--package-manager <packageManager>`

The package manager to use. If not specified, it will be auto-detected from the project. Available options: `npm`, `yarn`, `pnpm`, `bun`.

```sh
pnpx nukenm --package-manager pnpm
```