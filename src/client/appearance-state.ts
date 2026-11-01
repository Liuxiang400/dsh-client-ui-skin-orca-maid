/** ABYSS owns its local settings. No external registration/events. */
export interface AppearanceSetting {
  key: string
  type: 'boolean'
  label: string
  labelEn: string
  description?: string
  descriptionEn?: string
  defaultValue: boolean
}
export interface AppearanceState { values: Record<string, boolean> }
export interface AppearanceDefinition {
  settings: AppearanceSetting[]
  apply(state: AppearanceState | null): void
}
/** Attribute ownership adapted from upstream skin-manager protocol (MIT; see NOTICE). */
export class SkinAttributeProjector {
  private readonly originals = new Map<string, string | null>()
  private readonly owned = new Map<string, string | null>()

  constructor(private readonly root: HTMLElement = document.documentElement) {}

  set(attribute: string, value: string): void {
    if (!this.originals.has(attribute)) this.originals.set(attribute, this.root.getAttribute(attribute))
    this.root.setAttribute(attribute, value)
    this.owned.set(attribute, value)
  }

  unset(attribute: string): void {
    if (!this.originals.has(attribute)) this.originals.set(attribute, this.root.getAttribute(attribute))
    this.root.removeAttribute(attribute)
    this.owned.set(attribute, null)
  }

  release(attribute?: string): void {
    const attributes = attribute === undefined ? [...this.originals.keys()] : [attribute]
    for (const name of attributes) {
      if (!this.originals.has(name)) continue
      const original = this.originals.get(name) ?? null
      if (this.root.getAttribute(name) === this.owned.get(name)) {
        if (original === null) this.root.removeAttribute(name)
        else this.root.setAttribute(name, original)
      }
      this.originals.delete(name)
      this.owned.delete(name)
    }
  }
}
