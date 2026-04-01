import { AnimProfile } from "shared/constants";
import { animateHachi, HachiAnimState } from "./animateHachi";

export { HachiAnimState } from "./animateHachi";

/**
 * Dispatch animation update to the correct profile handler.
 * `speedScale` adjusts animation frequency; `idleAmp` controls idle bobbing.
 */
export function animateVehicle(
	body: BasePart,
	dt: number,
	state: HachiAnimState,
	profile: AnimProfile,
	speedScale: number,
	idleAmp: number,
): HachiAnimState {
	switch (profile) {
		case AnimProfile.Quadruped:
			return animateHachi(body, dt * speedScale, state);

		case AnimProfile.Wheeled:
			return animateWheeled(body, dt, state, speedScale);

		case AnimProfile.Serpentine:
			return animateSerpentine(body, dt, state, speedScale, idleAmp);

		case AnimProfile.Static:
			return animateStatic(body, dt, state, idleAmp);
	}
}

/** Wheeled: spin wheel parts based on movement speed. */
function animateWheeled(
	body: BasePart,
	dt: number,
	state: HachiAnimState,
	speedScale: number,
): HachiAnimState {
	const spd = body.AssemblyLinearVelocity.Magnitude;
	const spinRate = spd * 0.15 * speedScale;
	const animTime = state.animTime + dt * spinRate;

	const setC1 = (name: string, cf: CFrame) => {
		const w = body.FindFirstChild(name) as Weld | undefined;
		if (w) w.C1 = cf;
	};

	// Spin all 4 wheels around their X axis
	const spinAngle = animTime;
	setC1("Anim_WheelFL", CFrame.Angles(spinAngle, 0, 0));
	setC1("Anim_WheelFR", CFrame.Angles(spinAngle, 0, 0));
	setC1("Anim_WheelBL", CFrame.Angles(spinAngle, 0, 0));
	setC1("Anim_WheelBR", CFrame.Angles(spinAngle, 0, 0));

	return { animTime, airborne: state.airborne };
}

/** Serpentine: undulate body segments with phase offset. */
function animateSerpentine(
	body: BasePart,
	dt: number,
	state: HachiAnimState,
	speedScale: number,
	idleAmp: number,
): HachiAnimState {
	const spd = body.AssemblyLinearVelocity.Magnitude;
	const freq = math.max(1, spd / 20) * 2 * speedScale;
	const animTime = state.animTime + dt * freq;
	const amp = spd > 5 ? 0.4 : idleAmp;

	const setC1 = (name: string, cf: CFrame) => {
		const w = body.FindFirstChild(name) as Weld | undefined;
		if (w) w.C1 = cf;
	};

	// Undulate up to 6 segments with phase offset
	for (let i = 1; i <= 6; i++) {
		const phase = i * 0.8;
		const yaw = math.sin(animTime + phase) * amp;
		const pitch = math.sin(animTime * 0.5 + phase) * amp * 0.3;
		setC1(`Anim_Segment${i}`, CFrame.Angles(pitch, yaw, 0));
	}

	// Whiskers and horns sway
	setC1("Anim_EarL", CFrame.Angles(0, math.sin(animTime * 1.5) * 0.2, 0));
	setC1("Anim_EarR", CFrame.Angles(0, -math.sin(animTime * 1.5) * 0.2, 0));

	return { animTime, airborne: state.airborne };
}

/** Static: gentle bobbing only (Daruma, Maneki-neko). */
function animateStatic(
	body: BasePart,
	dt: number,
	state: HachiAnimState,
	idleAmp: number,
): HachiAnimState {
	const animTime = state.animTime + dt * 2;

	const setC1 = (name: string, cf: CFrame) => {
		const w = body.FindFirstChild(name) as Weld | undefined;
		if (w) w.C1 = cf;
	};

	// Gentle rock/wobble
	const rock = math.sin(animTime) * idleAmp;
	const tilt = math.sin(animTime * 0.7) * idleAmp * 0.5;
	setC1("Anim_Body", CFrame.Angles(tilt, 0, rock));

	// Maneki-neko waving paw
	const pawWave = math.sin(animTime * 3) * 0.6;
	setC1("Anim_Paw", CFrame.Angles(pawWave, 0, 0));

	return { animTime, airborne: state.airborne };
}
