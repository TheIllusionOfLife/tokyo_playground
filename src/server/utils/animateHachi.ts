/** Procedural leg/ear/tail animation for Hachi models (server-side, replicated). */
export function animateHachi(
	body: BasePart,
	dt: number,
	animTime: number,
): number {
	const spd = body.AssemblyLinearVelocity.Magnitude;
	const freq = math.max(1, spd / 15) * 3;
	animTime += dt * freq;

	const setC1 = (name: string, cf: CFrame) => {
		const w = body.FindFirstChild(name) as Weld | undefined;
		if (w) w.C1 = cf;
	};

	// Detect airborne: vertical velocity well above ground noise
	const airborne = body.AssemblyLinearVelocity.Y > 30;

	if (airborne) {
		// Jump pose: tuck front legs forward, back legs backward
		setC1("Anim_LegFL", CFrame.Angles(-0.6, 0, 0));
		setC1("Anim_LegFR", CFrame.Angles(-0.6, 0, 0));
		setC1("Anim_LegBL", CFrame.Angles(0.6, 0, 0));
		setC1("Anim_LegBR", CFrame.Angles(0.6, 0, 0));
		// Ears flattened back, tail up
		setC1("Anim_EarL", CFrame.Angles(-0.4, 0, 0));
		setC1("Anim_EarR", CFrame.Angles(-0.4, 0, 0));
		setC1("Anim_Tail", CFrame.Angles(-0.3, 0, 0));
	} else {
		// Running animation with increased amplitudes
		const frontSwing = math.sin(animTime) * 0.8;
		const backSwing = math.sin(animTime + math.pi) * 0.8;
		setC1("Anim_LegFL", CFrame.Angles(frontSwing, 0, 0));
		setC1("Anim_LegFR", CFrame.Angles(frontSwing, 0, 0));
		setC1("Anim_LegBL", CFrame.Angles(backSwing, 0, 0));
		setC1("Anim_LegBR", CFrame.Angles(backSwing, 0, 0));
		setC1("Anim_EarL", CFrame.Angles(0, math.sin(os.clock() * 2.5) * 0.3, 0));
		setC1("Anim_EarR", CFrame.Angles(0, -math.sin(os.clock() * 2.5) * 0.3, 0));
		setC1("Anim_Tail", CFrame.Angles(0, math.sin(os.clock() * 3) * 0.5, 0));
	}

	return animTime;
}
