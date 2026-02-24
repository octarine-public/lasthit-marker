import {
	Ability,
	ATTACK_DAMAGE_STRENGTH,
	Unit
} from "github.com/octarine-public/wrapper/index"

import { GUIMarker } from "./gui"
import { MenuManager } from "./menu"

export class BaseModel {
	private static readonly minRange = 2500

	private abilities: Ability[] = []
	private readonly gui = new GUIMarker()

	constructor(public readonly Base: Unit) {}

	public get HP() {
		return this.Base.HP
	}
	public get IsDeniable() {
		return this.Base.IsDeniable
	}
	public get HasNoHealthBar() {
		return this.Base.HasNoHealthBar
	}
	public IsEnemy(ent?: BaseModel) {
		return this.Base.IsEnemy(ent?.Base)
	}
	public Draw(targets: BaseModel[], menu: MenuManager) {
		if (!this.Base.IsAlive) {
			return
		}
		for (let i = targets.length - 1; i > -1; i--) {
			const target = targets[i]
			if (target.HasNoHealthBar || this.Distance2D(target) > BaseModel.minRange) {
				continue
			}
			const size = target.Base.HealthBarSize,
				position = target.Base.HealthBarPosition()
			if (!this.gui.Update(position, size, menu.AbilitySize.value)) {
				continue
			}
			if (this.CanAttack(target)) {
				this.gui.DrawAttack(this, target, menu)
			}
			if (menu.AbilityState && target.IsEnemy() && !target.Base.IsBuilding) {
				const abilities = this.abilities.filter(x =>
					this.isValidSpell(x, target, menu)
				)
				if (abilities.length !== 0) {
					this.gui.DrawAbilities(abilities, menu)
				}
			}
			const showIndicator = target.Base.IsBuilding
				? menu.IndicatorTowers.value
				: menu.IndicatorState.value
			if (showIndicator && (target.IsEnemy() || target.IsDeniable)) {
				this.gui.DrawIndicator(this, target, menu)
			}
		}
	}
	public UnitAbilitiesChanged(abilities: Ability[]) {
		this.abilities = abilities
	}
	public MinDamage(target: BaseModel) {
		return this.Base.GetAttackDamage(target.Base, ATTACK_DAMAGE_STRENGTH.DAMAGE_MIN)
	}
	public AvgDamage(target: BaseModel) {
		return this.Base.GetAttackDamage(target.Base, ATTACK_DAMAGE_STRENGTH.DAMAGE_AVG)
	}
	protected Distance2D(target: BaseModel) {
		return this.Base.Distance2D(target.Base)
	}
	protected CanAttack(target: BaseModel) {
		return (
			this.Distance2D(target) <=
			this.Base.GetAttackRange(target.Base, BaseModel.minRange)
		)
	}
	private isValidSpell(spell: Ability, target: BaseModel, menu: MenuManager) {
		if (!menu.IsEnabledName(spell.Name)) {
			return false
		}
		return spell.CanBeCasted() && target.HP <= spell.GetDamage(target.Base)
	}
}
