import { HACHI_SLIDE_FORCE_RESTORE_DELAY } from "shared/constants";

/** Zero BodyVelocity briefly then apply Y impulse to Hachi body. */
export function applyHachiJumpImpulse(
	body: BasePart,
	velocity: number,
	guardRoundStarted?: () => boolean,
) {
	const bv = body.FindFirstChildOfClass("BodyVelocity");
	if (bv) {
		const origForce = bv.MaxForce;
		bv.MaxForce = Vector3.zero;
		body.AssemblyLinearVelocity = new Vector3(
			body.AssemblyLinearVelocity.X,
			velocity,
			body.AssemblyLinearVelocity.Z,
		);
		task.delay(HACHI_SLIDE_FORCE_RESTORE_DELAY, () => {
			if ((!guardRoundStarted || guardRoundStarted()) && bv.Parent)
				bv.MaxForce = origForce;
		});
	} else {
		body.AssemblyLinearVelocity = new Vector3(
			body.AssemblyLinearVelocity.X,
			velocity,
			body.AssemblyLinearVelocity.Z,
		);
	}
}
