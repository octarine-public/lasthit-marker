/**
 * What the marker reads off the unit it is drawn over. The model answers it as itself; naming
 * the questions here rather than in the model is what keeps the drawing off the model's own
 * module, which holds a marker of its own.
 */
export interface MarkerTarget {
	readonly Base: Unit
	readonly HP: number
	readonly IsDeniable: boolean
	IsEnemy(ent?: MarkerTarget): boolean
	MinDamage(target: MarkerTarget): number
	AvgDamage(target: MarkerTarget): number
}
