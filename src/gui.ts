import {
	Ability,
	Color,
	GUIInfo,
	Rectangle,
	RendererSDK,
	Vector2
} from "github.com/octarine-public/wrapper/index"

import { MenuManager } from "./menu"
import { BaseModel } from "./model"

export class GUIMarker {
	private static readonly border = 2
	private static readonly minSize = 17
	private static readonly allyColor = new Color(0, 100, 0)
	private static readonly allyColorKill = new Color(124, 252, 0)
	private static readonly enemyColor = new Color(139, 0, 0)
	private static readonly enemyColorKill = new Color(255, 69, 0)

	private readonly position = new Rectangle()
	private readonly size = new Vector2()

	public Update(
		position: Nullable<Vector2>,
		healthBarSize: Vector2,
		additionalSize: number
	) {
		if (position === undefined) {
			return false
		}
		const size = GUIMarker.minSize + additionalSize * 4
		this.position.pos1.CopyFrom(position)
		this.position.pos2.CopyFrom(position.Add(healthBarSize))
		this.size.CopyFrom(GUIInfo.ScaleVector(size, size))
		this.size.x -= (this.size.x + 1) % 2
		this.size.y -= (this.size.y + 1) % 2
		return true
	}

	public DrawAbilities(abilities: Ability[], menu: MenuManager) {
		const vecSize = this.size,
			rectangle = this.position,
			border = GUIInfo.ScaleHeight(GUIMarker.border + 1), // 2 + 1
			rounding = this.getRounding(menu, vecSize)
		for (let index = abilities.length - 1; index > -1; index--) {
			const spell = abilities[index]
			const vecPos = this.getPosition(
				rectangle,
				vecSize,
				border,
				index,
				abilities.length
			)
			this.image(
				spell.TexturePath,
				vecPos,
				vecSize,
				rounding,
				border + +(rounding > 0)
			)
		}
	}
	public DrawAttack(source: BaseModel, target: BaseModel, menu: MenuManager) {
		const position = this.position.Clone()
		const isAVG = menu.StateAVG.value,
			currHP = target.HP,
			minDamage = source.MinDamage(target),
			minPct = minDamage / target.Base.MaxHP,
			avgDamage = source.AvgDamage(target),
			avgPct = avgDamage / target.Base.MaxHP
		let colorBar = this.getColorBar(target)
		if (isAVG && minDamage < currHP && avgDamage >= currHP) {
			colorBar = Color.Yellow
		} else if (minDamage >= currHP && (target.IsEnemy() || target.IsDeniable)) {
			colorBar = this.getColorBar(target, true)
		}
		const totalPct = isAVG ? avgPct : minPct
		position.Width *= Math.min(totalPct, target.Base.HPPercentDecimal)
		position.Width = Math.ceil(position.Width * 20) / 20
		RendererSDK.FilledRect(position.pos1, position.Size, colorBar)
	}

	private getColorBar(entity: BaseModel, kill?: boolean) {
		const map = !entity.IsEnemy()
			? [GUIMarker.allyColor, GUIMarker.allyColorKill]
			: [GUIMarker.enemyColor, GUIMarker.enemyColorKill]
		return kill ? map[1] : map[0]
	}
	private getPosition(
		rec: Rectangle,
		size: Vector2,
		border: number,
		index: number,
		count: number = 0
	) {
		const posY = rec.y - size.y - border * 2,
			posX = rec.x + (rec.Width + border) / 2,
			center = new Vector2(posX, posY).SubtractScalarX(
				((size.x + border) * count) / 2
			)
		return center.AddScalarX(index * (size.x + border)).RoundForThis()
	}
	private image(
		texture: string,
		vecPos: Vector2,
		vecSize: Vector2,
		rounding: number,
		border: number
	) {
		RendererSDK.RectRounded(
			vecPos,
			vecSize,
			rounding,
			Color.fromUint32(0),
			Color.Green.SetA(180),
			Math.round(border)
		)
		RendererSDK.Image(texture, vecPos, rounding, vecSize, Color.White)
	}
	private getRounding(menu: MenuManager, size: Vector2): number {
		const rnd = (menu.Rounding.value / 10) * Math.min(size.x, size.y)
		return rnd === 1 ? -1 : rnd - 1
	}
}
