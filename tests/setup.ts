/**
 * Polyfills for Roblox globals used in shared/ modules.
 * Loaded via bunfig.toml preload before test files are evaluated.
 */

// Lua-style math (lowercase)
(globalThis as unknown as { math: typeof Math }).math = Math;

// Roblox typeOf
(globalThis as unknown as { typeOf: (value: unknown) => string }).typeOf = (
	value,
) => typeof value;

// Minimal Vector3 polyfill for constants.ts
class Vector3Polyfill {
	constructor(
		public X: number = 0,
		public Y: number = 0,
		public Z: number = 0,
	) {}
	static zero = new Vector3Polyfill(0, 0, 0);
	add(other: Vector3Polyfill) {
		return new Vector3Polyfill(this.X + other.X, this.Y + other.Y, this.Z + other.Z);
	}
	sub(other: Vector3Polyfill) {
		return new Vector3Polyfill(this.X - other.X, this.Y - other.Y, this.Z - other.Z);
	}
	mul(scalar: number) {
		return new Vector3Polyfill(this.X * scalar, this.Y * scalar, this.Z * scalar);
	}
	get Magnitude() {
		return Math.sqrt(this.X ** 2 + this.Y ** 2 + this.Z ** 2);
	}
	get Unit() {
		const mag = this.Magnitude;
		return mag > 0 ? this.mul(1 / mag) : Vector3Polyfill.zero;
	}
	Dot(other: Vector3Polyfill) {
		return this.X * other.X + this.Y * other.Y + this.Z * other.Z;
	}
}

(globalThis as unknown as { Vector3: typeof Vector3Polyfill }).Vector3 =
	Vector3Polyfill;

// Minimal CFrame polyfill
class CFramePolyfill {
	constructor(
		public X: number = 0,
		public Y: number = 0,
		public Z: number = 0,
	) {}
	get Position() {
		return new Vector3Polyfill(this.X, this.Y, this.Z);
	}
}

(globalThis as unknown as { CFrame: typeof CFramePolyfill }).CFrame =
	CFramePolyfill;

// Minimal Enum polyfill
(globalThis as unknown as { Enum: Record<string, unknown> }).Enum = {
	Material: { Air: "Air" },
	HumanoidStateType: {},
	RaycastFilterType: { Exclude: "Exclude" },
};

// Roblox string.format polyfill (Lua-style)
(globalThis as unknown as { string: { format: typeof Intl.NumberFormat } }).string = {
	...(globalThis as unknown as { string: object }).string,
	format: (...args: unknown[]) => String(args[0]),
};

// os.clock polyfill
(globalThis as unknown as { os: { clock: () => number } }).os = {
	clock: () => performance.now() / 1000,
};
