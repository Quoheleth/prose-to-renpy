export interface CharacterDef {
  label: string       // rpy label — lowercase, underscores, no spaces
  displayName: string // button text
  color: string       // hex color
  font: string        // font file path for Taldane button, e.g. 'fonts/CrimsonPro-Regular.ttf'
  shortcut: string    // keyboard shortcut string, e.g. 'ctrl+k', '' = none
}

const STORAGE_KEY = 'prose-to-renpy-characters'

export const DEFAULT_CHARACTERS: CharacterDef[] = [
  { label: 'keltham',       displayName: 'Keltham',       color: '#2a4a7a', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
  { label: 'carissa',       displayName: 'Carissa',       color: '#651e1e', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
  { label: 'pilar',         displayName: 'Pilar',         color: '#940e57', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
  { label: 'snack_service', displayName: 'Snack Service', color: '#b5006a', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
  { label: 'asmodia',       displayName: 'Asmodia',       color: '#390900', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
  { label: 'ione',          displayName: 'Ione',          color: '#34044d', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
  { label: 'peranza',       displayName: 'Peranza',       color: '#542d3a', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
  { label: 'meritxell',     displayName: 'Meritxell',     color: '#6b1a2a', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
  { label: 'yaisa',         displayName: 'Yaisa',         color: '#7a4a3a', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
  { label: 'pl_girls',      displayName: 'PL Girls',      color: '#8b4a4a', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
  { label: 'abrogail',      displayName: 'Abrogail',      color: '#8b1a1a', font: 'fonts/CrimsonPro-Medium.ttf',  shortcut: '' },
  { label: 'aspexia',       displayName: 'Aspexia',       color: '#b60000', font: 'fonts/CrimsonPro-Medium.ttf',  shortcut: '' },
  { label: 'maillol',       displayName: 'Maillol',       color: '#6b3030', font: 'fonts/CrimsonPro-Medium.ttf',  shortcut: '' },
  { label: 'subirachs',     displayName: 'Subirachs',     color: '#7a3535', font: 'fonts/CrimsonPro-Medium.ttf',  shortcut: '' },
  { label: 'abarco',        displayName: 'Abarco',        color: '#5a2020', font: 'fonts/CrimsonPro-Medium.ttf',  shortcut: '' },
  { label: 'gorthoklek',    displayName: 'Gorthoklek',    color: '#4a1a1a', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
  { label: 'khemet',        displayName: 'Khemet',        color: '#b0861f', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
  { label: 'fe_anar',       displayName: 'Fe Anar',       color: '#8a6a20', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
  { label: 'merenre',       displayName: 'Merenre',       color: '#9a7a30', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
  { label: 'nefreti',       displayName: 'Nefreti',       color: '#4a2a6a', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
  { label: 'derrina',       displayName: 'Derrina',       color: '#2d2d2d', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
  { label: 'temos',         displayName: 'Temos',         color: '#2d2d2d', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
  { label: 'asmodeus',      displayName: 'Asmodeus',      color: '#c01a1a', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
  { label: 'abadar',        displayName: 'Abadar',        color: '#b0861f', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
  { label: 'otolmens',      displayName: 'Otolmens',      color: '#0a0a0a', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
  { label: 'cayden',        displayName: 'Cayden',        color: '#783f04', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
  { label: 'milani',        displayName: 'Milani',        color: '#590808', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
  { label: 'nethys',        displayName: 'Nethys',        color: '#6b389f', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
  { label: 'irori',         displayName: 'Irori',         color: '#4a91b3', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
  { label: 'iomedae',       displayName: 'Iomedae',       color: '#666666', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
  { label: 'zon_kuthon',    displayName: 'Zon-Kuthon',    color: '#1a3a2a', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
  { label: 'erecura',       displayName: 'Erecura',       color: '#3c7461', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
  { label: 'dispater',      displayName: 'Dispater',      color: '#b60000', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
  { label: 'cheliax',       displayName: 'Cheliax',       color: '#8b4a4a', font: 'fonts/CrimsonPro-Medium.ttf',  shortcut: '' },
  { label: 'devils',        displayName: 'Devils',        color: '#8b4a4a', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
  { label: 'osirian',       displayName: 'Osirian',       color: '#2d2d2d', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
  { label: 'gods',          displayName: 'Gods',          color: '#2d2d2d', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
  { label: 'gnarrator',     displayName: 'Gnarrator',     color: '#2d2d2d', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
  { label: 'dnarrator',     displayName: 'Dnarrator',     color: '#2d2d2d', font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '' },
]

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
