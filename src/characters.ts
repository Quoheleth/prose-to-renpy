export interface CharacterDef {
  label: string       // rpy label — lowercase, underscores, no spaces
  displayName: string // button text
  color: string       // hex color
  shortcut: string    // keyboard shortcut string, e.g. 'ctrl+k', '' = none
}

const STORAGE_KEY = 'prose-to-renpy-characters'

export const DEFAULT_CHARACTERS: CharacterDef[] = []

// Mutable map used by CharacterMark's renderHTML — updated whenever the character list changes.
let _charMap: Map<string, CharacterDef> = new Map(DEFAULT_CHARACTERS.map(c => [c.label, c]))

export function updateCharMap(chars: CharacterDef[]): void {
  _charMap = new Map(chars.map(c => [c.label, c]))
}

export function charColor(label: string): string {
  return _charMap.get(label)?.color ?? '#e0e0e0'
}

export function loadCharacters(): CharacterDef[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as CharacterDef[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}
  return DEFAULT_CHARACTERS
}

export function saveCharacters(chars: CharacterDef[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(chars))
}
