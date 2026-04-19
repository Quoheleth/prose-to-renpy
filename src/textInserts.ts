export interface TextInsertDef {
  name: string      // unique key + display label
  text: string      // verbatim .rpy text (paragraph mode) or inserted text (inline mode)
  inline: boolean   // false = new command paragraph; true = insert at cursor
  shortcut?: string
}

const STORAGE_KEY = 'prose-to-renpy-text-inserts'

export function loadTextInserts(): TextInsertDef[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try { return JSON.parse(raw) } catch { /* fall through */ }
  }
  return []
}

export function saveTextInserts(inserts: TextInsertDef[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inserts))
}
