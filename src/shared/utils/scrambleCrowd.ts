export function canTriggerSpiritWave(
	charges: number,
	activeSpiritWaves: number,
	maxConcurrentSpiritWaves: number,
): boolean {
	return charges > 0 && activeSpiritWaves < maxConcurrentSpiritWaves;
}
