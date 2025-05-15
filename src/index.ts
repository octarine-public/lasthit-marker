import "./translations"

import {
	DOTAGameState,
	DOTAGameUIState,
	Entity,
	EventsSDK,
	GameRules,
	GameState,
	Lantern,
	Miniboss,
	Outpost,
	TwinGate,
	Unit
} from "github.com/octarine-public/wrapper/index"

import { AbilityManager } from "./manager"
import { MenuManager } from "./menu"
import { BaseModel } from "./model"

new (class CLastHitMarker {
	private LocalHero: Nullable<BaseModel>
	private readonly units: BaseModel[] = []
	private readonly menu = new MenuManager()
	private readonly abilityManager = new AbilityManager(this.menu)

	constructor() {
		EventsSDK.on("Draw", this.Draw.bind(this))
		EventsSDK.on("EntityCreated", this.EntityCreated.bind(this))
		EventsSDK.on("EntityDestroyed", this.EntityDestroyed.bind(this))
		EventsSDK.on("UnitItemsChanged", this.UnitItemsChanged.bind(this))
		EventsSDK.on("UnitAbilitiesChanged", this.UnitAbilitiesChanged.bind(this))
		EventsSDK.on("LifeStateChanged", this.LifeStateChanged.bind(this))
		EventsSDK.on("EntityVisibleChanged", this.EntityVisibleChanged.bind(this))
		EventsSDK.on("UnitPropertyChanged", this.UnitPropertyChanged.bind(this))
		EventsSDK.on("GameEnded", this.GameEnded.bind(this))
	}
	private get state() {
		return this.menu.State.value
	}
	private get isPostGame() {
		return (
			GameRules === undefined ||
			GameRules.GameState === DOTAGameState.DOTA_GAMERULES_STATE_POST_GAME
		)
	}
	private isValid(entity: Unit) {
		return entity.IsValid && entity.IsAlive && entity.IsVisible && entity.IsSpawned
	}
	protected Draw() {
		if (GameState.UIState !== DOTAGameUIState.DOTA_GAME_UI_DOTA_INGAME) {
			return
		}
		if (this.state && !this.isPostGame) {
			this.LocalHero?.Draw(this.units, this.menu)
		}
	}
	protected EntityCreated(entity: Entity) {
		if (entity instanceof Unit && entity.IsMyHero) {
			this.LocalHero = new BaseModel(entity)
			this.menu.GameStarted()
		}
		if (this.shouldUnit(entity) && this.isValid(entity)) {
			this.addModel(entity)
		}
	}
	protected EntityDestroyed(entity: Entity) {
		if (this.LocalHero?.Base === entity) {
			this.LocalHero = undefined
		}
		if (this.shouldUnit(entity)) {
			this.units.removeCallback(x => x.Base === entity)
		}
	}
	protected LifeStateChanged(entity: Entity) {
		if (this.shouldUnit(entity) && !entity.IsAlive) {
			this.units.removeCallback(x => x.Base === entity)
		}
	}
	protected EntityVisibleChanged(entity: Entity) {
		if (!this.shouldUnit(entity)) {
			return
		}
		if (this.isValid(entity)) {
			this.addModel(entity)
			return
		}
		this.units.removeCallback(x => x.Base === entity)
	}
	protected UnitItemsChanged(entity: Unit) {
		if (this.LocalHero?.Base === entity) {
			this.LocalHero.UnitAbilitiesChanged(this.abilityManager.Get(entity))
		}
	}
	protected UnitAbilitiesChanged(entity: Unit) {
		if (this.LocalHero?.Base === entity) {
			this.LocalHero.UnitAbilitiesChanged(this.abilityManager.Get(entity))
		}
	}
	protected UnitPropertyChanged(entity: Unit) {
		if (!this.shouldUnit(entity)) {
			return
		}
		if (this.isValid(entity)) {
			this.addModel(entity)
			return
		}
		this.units.removeCallback(x => x.Base === entity)
	}
	protected GameEnded() {
		this.menu.GameEnded()
	}
	private addModel(entity: Unit) {
		if (!this.units.some(x => x.Base === entity)) {
			this.units.push(new BaseModel(entity))
		}
	}
	private shouldUnit(entity: Entity): entity is Unit {
		if (!(entity instanceof Unit) || entity.IsRoshan) {
			return false
		}
		if (entity instanceof Miniboss || entity instanceof Outpost) {
			return false
		}
		if (entity instanceof TwinGate || entity instanceof Lantern) {
			return false
		}
		if (entity.Name.startsWith("npc_dota_brewmaster_")) {
			return false
		}
		return entity.IsCreep || entity.IsBuilding
	}
})()
