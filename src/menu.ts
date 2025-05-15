import { GameState, Menu } from "github.com/octarine-public/wrapper/index"

export class MenuManager {
	public readonly State: Menu.Toggle
	public readonly StateAVG: Menu.Toggle
	public readonly Rounding: Menu.Slider
	public readonly AbilitySize: Menu.Slider

	private readonly abilityState: Menu.Toggle
	private readonly abilityStateByTime: Menu.Slider

	private readonly cachedNames: string[] = []
	private readonly items: Menu.ImageSelector
	private readonly abilities: Menu.ImageSelector
	private readonly info: Menu.ShortDescription

	private readonly path = "github.com/octarine-public/lasthit-marker/scripts_files"
	private readonly entry = Menu.AddEntry("Visual")
	private readonly icon = this.path + "/icons/token.svg"
	private readonly node = this.entry.AddNode("Lasthit marker", this.icon)

	constructor() {
		this.node.SortNodes = false
		this.State = this.node.AddToggle("State", true)
		this.abilityState = this.node.AddToggle("Show (abilities)", true)
		this.StateAVG = this.node.AddToggle("Show (avg damage)", false)

		this.info = this.node.AddShortDescription(
			"Requires lobby and hero",
			"For settings abilities or items, you must be in a lobby\nand have a hero selected which support\nabilities or items (e.g dagon)"
		)

		this.abilities = this.node.AddImageSelector("Abilities", [])
		this.abilities.IsHidden = true

		this.items = this.node.AddImageSelector("Items", [])
		this.items.IsHidden = true

		const arrSize = [0, 0, 5, 0, "Ability size"] as const
		this.AbilitySize = this.node.AddSlider("Size", ...arrSize)
		this.AbilitySize.IsHidden = true

		const arrRound = [6, 0, 10, 0, "Rounding abilities (img)"] as const
		this.Rounding = this.node.AddSlider("Rounding", ...arrRound)
		this.Rounding.IsHidden = true

		const byTime = [10, 0, 120, 0, "Disable show abilities\nafter X minutes"] as const
		this.abilityStateByTime = this.node.AddSlider("Disable abilities", ...byTime)
		this.abilityStateByTime.IsHidden = true

		this.abilityState.OnValue(call => {
			this.Rounding.IsHidden = !call.value
			this.AbilitySize.IsHidden = !call.value
			this.abilityStateByTime.IsHidden = !call.value
			this.updateVisibleSelector()
		})
	}

	public get AbilityState() {
		if (!this.abilityState.value) {
			return false
		}
		const menuTime = this.abilityStateByTime.value
		return menuTime === 0 || GameState.RawGameTime / 60 < menuTime
	}
	public AddItem(name: string) {
		name = this.overrideName(name)
		if (this.cachedNames.some(n => n === name)) {
			return
		}
		this.info.IsHidden = true
		this.addItemToSelector(
			name.startsWith("item_") ? this.items : this.abilities,
			name
		)
	}
	public IsEnabledName(name: string) {
		return (
			this.items.IsEnabled(this.overrideName(name)) ||
			this.abilities.IsEnabled(this.overrideName(name))
		)
	}
	public GameStarted() {
		this.info.IsHidden = true
		this.node.Update()
	}
	public GameEnded() {
		for (let i = this.cachedNames.length - 1; i > -1; i--) {
			const name = this.overrideName(this.cachedNames[i])
			this.items.values.remove(name)
			this.abilities.values.remove(name)
			this.cachedNames.remove(name)
			this.updateVisibleSelector()
		}
		this.info.IsHidden = false
		this.node.Update()
	}
	private overrideName(name: string) {
		if (name.startsWith("item_dagon")) {
			name = "item_dagon_5"
		}
		return name
	}
	private addItemToSelector(selector: Menu.ImageSelector, name: string) {
		selector.values.push(name)
		selector.enabledValues.set(name, false)
		this.cachedNames.push(name)
		this.updateVisibleSelector()
	}
	private updateVisibleSelector() {
		const abilState = this.abilityState.value
		this.items.IsHidden = !abilState || this.items.values.length === 0
		this.abilities.IsHidden = !abilState || this.abilities.values.length === 0
		this.items.Update()
		this.abilities.Update()
		this.node.Update()
	}
}
