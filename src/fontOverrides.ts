// Font override definitions — each entry produces a toolbar button that wraps
// selected text in the specified opening/closing tag pair on export.
//
// Tags like {raleway} are registered in styles.rpy as combined font+size tags
// (e.g. {raleway} applies Raleway at 20pt). Using {font=name} would set only
// the face without size, so those fonts use bare custom tags instead.
// The RTE only stores tag strings — it has no knowledge of sizes.
export interface FontOverrideDef {
  id: string          // unique key — stored as fontName in FontMark, never appears in .rpy output
  displayName: string // toolbar button label
  openTag: string     // emitted before text, e.g. '{raleway}' or '{font=fonts/CrimsonPro-Regular.ttf}'
  closeTag: string    // emitted after text, e.g. '{/raleway}' or '{/font}'
  color: string       // hex — colors the span in the editor
  shortcut: string    // keyboard shortcut string, e.g. 'ctrl+shift+r', '' = none
}

const STORAGE_KEY = 'prose-to-renpy-font-overrides'

export const DEFAULT_FONT_OVERRIDES: FontOverrideDef[] = [
  {
    id: 'raleway',
    displayName: 'Baseline',
    openTag: '{raleway}',
    closeTag: '{/raleway}',
    color: '#2a4a7a',
    shortcut: '',
  },
  {
    id: 'fonts/CrimsonPro-Regular.ttf',
    displayName: 'Taldane',
    openTag: '{font=fonts/CrimsonPro-Regular.ttf}',
    closeTag: '{/font}',
    color: '#8a6020',
    shortcut: '',
  },
]

// Mutable map used by FontMark's renderHTML and export.ts — updated whenever the
// override list changes. The same pattern as _charMap in characters.ts.
let _fontOverrideMap: Map<string, FontOverrideDef> = new Map(
  DEFAULT_FONT_OVERRIDES.map(f => [f.id, f])
)

export function updateFontOverrideMap(overrides: FontOverrideDef[]): void {
  _fontOverrideMap = new Map(overrides.map(f => [f.id, f]))
}

export function getFontOverride(id: string): FontOverrideDef | undefined {
  return _fontOverrideMap.get(id)
}

export function loadFontOverrides(): FontOverrideDef[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as FontOverrideDef[]
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch {}
  return DEFAULT_FONT_OVERRIDES
}

export function saveFontOverrides(overrides: FontOverrideDef[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides))
}
