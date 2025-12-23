import { sleep } from "./sleep";

interface ISpinner {
	start: () => ISpinner;
	success: (message: string) => void;
	message: (message: string) => void;
	error: (message: string) => void;
}

interface SpinnerOptions {
	text: string;
	frames?: string[];
	/**
	 * The speed of the spinner 0-1
	 */
	speed?: number;
	successIcon?: string;
	errorIcon?: string;
	isTTY?: boolean;
}

export class Spinner implements ISpinner {
	readonly #incrementEvery: number;
	#frameIndex = 0;
	#currentText: string;
	#done = false;
	#started = false;
	readonly #frames: string[];
	readonly #successIcon: string;
	readonly #errorIcon: string;
	readonly #isTTY: boolean;
	constructor({
		text,
		frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
		speed = 1,
		successIcon = "✔︎",
		errorIcon = "✖︎",
		isTTY = process.stdout.isTTY,
	}: SpinnerOptions) {
		this.#incrementEvery = 100 / speed;
		this.#frameIndex = 0;
		this.#currentText = text;
		this.#frames = frames;
		this.#successIcon = successIcon;
		this.#errorIcon = errorIcon;
		this.#isTTY = isTTY;
	}

	async #start() {
		while (!this.#done) {
			this.#nextFrame();
			this.#frameIndex++;
			if (this.#frameIndex >= this.#frames.length) {
				this.#frameIndex = 0;
			}
			await sleep(this.#incrementEvery);
		}
	}

	#write(message: string) {
		process.stdout.clearLine(-1);
		process.stdout.cursorTo(0);
		process.stdout.write(message);
	}

	#getNextFrame() {
		return `${this.#frames[this.#frameIndex]} ${this.#currentText}`;
	}

	#nextFrame() {
		this.#write(this.#getNextFrame());
		this.#frameIndex++;
	}

	start(): this {
		this.#started = true;
		this.#start();
		return this;
	}

	success(message: string) {
		if (!this.#started) {
			throw new Error("Spinner not started. Call start() first.");
		}
		this.#done = true;
		this.#write(`${this.#successIcon} ${message}\n`);
	}

	message(msg: string) {
		if (!this.#started) {
			throw new Error("Spinner not started. Call start() first.");
		}
		this.#currentText = msg;
		this.#write(this.#getNextFrame());
	}

	error(message: string) {
		if (!this.#started) {
			throw new Error("Spinner not started. Call start() first.");
		}
		this.#done = true;
		this.#write(`${this.#errorIcon} ${message}\n`);
	}
}
