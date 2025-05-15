import { Ability, DAMAGE_TYPES, Unit } from "github.com/octarine-public/wrapper/index"

import { MenuManager } from "./menu"

export class AbilityManager {
	constructor(private readonly menu: MenuManager) {}

	public Get(source: Unit) {
		if (!source.IsMyHero) {
			return []
		}
		const abilities: Ability[] = []
		for (let i = source.Spells.length - 1; i > -1; i--) {
			const ability = source.Spells[i]
			if (this.shouldDrawable(ability)) {
				abilities.push(ability)
				this.menu.AddItem(ability.Name)
			}
		}
		for (let i = source.Items.length - 1; i > -1; i--) {
			const item = source.Items[i]
			if (this.shouldDrawable(item)) {
				abilities.push(item)
				this.menu.AddItem(item.Name)
			}
		}
		return abilities
	}
	private shouldDrawable(abil: Nullable<Ability>): abil is Ability {
		if (abil === undefined || !abil.IsValid) {
			return false
		}
		if (!abil.IsNuke() || abil.IsUltimate || abil.IsPassive) {
			return false
		}
		return abil.ShouldBeDrawable && abil.DamageType !== DAMAGE_TYPES.DAMAGE_TYPE_NONE
	}
}
