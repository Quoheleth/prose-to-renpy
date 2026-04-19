import type { JSONContent } from '@tiptap/react'
import { SCENE_COMMAND, NVL_CLEAR_COMMAND, TEXT_INSERT_COMMAND } from './extensions/CharacterMark'
import { getFontOverride } from './fontOverrides'
import { normalizeQuotes } from './quoteNormalize'

function escapeText(text: string): string {
  return text
    .replace(/\u00a0/g, ' ')     // normalize non-breaking spaces to regular spaces
    .replace(/ {2,}/g, ' ')      // collapse two or more consecutive spaces to one
    .replace(/\\/g, '\\\\')      // backslashes first
    .replace(/\{/g, '{{')        // Ren'Py tag escape: { → {{
    .replace(/\}/g, '}}')        // Ren'Py tag escape: } → }}
    .replace(/%/g, '%%')         // Python %-format escape: % → %%
    // Note: straight " and ' are NOT escaped here — normalizeQuotes converts
    // them to typographic curly quotes before the line is emitted, so no
    // ASCII " ever reaches the final output inside the dialogue string.
}

// Return the Ren'Py opening/closing tags for a font override, looked up from
// the user-managed FontOverrideDef registry. Falls back to raw {font=name}
// syntax for any id not found in the registry (e.g. legacy marks in a document
// that pre-dates the override being defined).
function fontOpenTag(fontName: string): string {
  return getFontOverride(fontName)?.openTag ?? `{font=${fontName}}`
}
function fontCloseTag(fontName: string): string {
  return getFontOverride(fontName)?.closeTag ?? `{/font}`
}

// Wrap escaped text in an inline tag, pushing trailing whitespace outside the
// closing tag so we never get {i}word {/i} — it becomes {i}word{/i} instead.
function wrapInlineTag(text: string, tag: string): string {
  const trailMatch = text.match(/(\s+)$/)
  const trail = trailMatch ? trailMatch[1] : ''
  const inner = trail ? text.slice(0, -trail.length) : text
  if (!inner) return trail
  return `{${tag}}${inner}{/${tag}}${trail}`
}

// Process a paragraph's inline content as a stream so that consecutive text
// nodes sharing the same fontOverride mark collapse into a single {font=…}
// span rather than being split into adjacent identical font tags.
function paragraphToRpy(node: JSONContent, smartQuotes: boolean): string | null {
  const character: string | null = node.attrs?.character ?? null
  const content = node.content ?? []

  // Scene (clear-screen) paragraphs: emit bare `scene`, or commented variant.
  if (character === SCENE_COMMAND) return node.attrs?.commented ? '# scene' : 'scene'

  // NVL clear paragraphs: emit bare `nvl clear`, or commented variant.
  if (character === NVL_CLEAR_COMMAND) return node.attrs?.commented ? '# nvl clear' : 'nvl clear'

  // User-defined text insert paragraphs: emit the baked-in insert text verbatim.
  if (character === TEXT_INSERT_COMMAND) {
    const text = (node.attrs?.insertText ?? '').trim()
    if (!text) return null
    return node.attrs?.commented ? `# ${text}` : text
  }

  // Comment paragraphs (null) and character paragraphs both go through the full
  // inline processing pipeline below — font spans, marks, escaping, smart quotes.
  // Comments emit as `# text` without quotes; characters emit as `label "text"`.

  let result = ''
  let openFont: string | null = null

  for (const child of content) {
    if (child.type === 'hardBreak') {
      result += '\\n'  // Shift+Enter soft break: literal \n escape, not a real newline
      continue
    }
    if (child.type !== 'text') continue

    const marks = child.marks ?? []
    const fontMark = marks.find(m => m.type === 'fontOverride')
    const fontName: string | null = fontMark?.attrs?.fontName ?? null

    // Emit font span transitions only when the active font actually changes.
    if (fontName !== openFont) {
      if (openFont !== null) {
        // Push any trailing whitespace outside the closing font tag.
        const m = result.match(/(\s+)$/)
        if (m) {
          result = result.slice(0, -m[1].length) + fontCloseTag(openFont) + m[1]
        } else {
          result += fontCloseTag(openFont)
        }
      }
      if (fontName !== null) result += fontOpenTag(fontName)
      openFont = fontName
    }

    // Apply non-font inline marks to the escaped text.
    let text = escapeText(child.text ?? '')
    for (const mark of marks) {
      if (mark.type === 'italic')         text = wrapInlineTag(text, 'i')
      else if (mark.type === 'bold')      text = wrapInlineTag(text, 'b')
      else if (mark.type === 'underline') text = wrapInlineTag(text, 'u')
      else if (mark.type === 'strike')    text = wrapInlineTag(text, 's')
    }
    result += text
  }

  // Close any font span still open at end of paragraph, trailing space outside.
  if (openFont !== null) {
    const m = result.match(/(\s+)$/)
    if (m) {
      result = result.slice(0, -m[1].length) + fontCloseTag(openFont) + m[1]
    } else {
      result += fontCloseTag(openFont)
    }
  }

  // Either normalize straight quotes to typographic curly quotes, or escape
  // them as \" for Ren'Py.  Both operate on the fully assembled result so
  // they have paragraph-level context.
  const processed = smartQuotes
    ? normalizeQuotes(result)
    : result.replace(/"/g, '\\"')
  const trimmed = processed.trimEnd()
  if (!trimmed.trim()) return null

  if (!character) return `# ${trimmed}`
  if (node.attrs?.commented) return `# ${character} "${trimmed}"`
  return `${character} "${trimmed}"`
}

export interface RpyLine {
  text: string
  // Set for character dialogue lines (not comments, commands, or plain-commented blocks).
  // Used by the preview renderer to color the dialogue portion.
  charLabel?: string
}

export function exportToRpyLines(doc: JSONContent, opts?: { smartQuotes?: boolean }): RpyLine[] {
  const smartQuotes = opts?.smartQuotes ?? false
  const lines: RpyLine[] = []
  for (const node of doc.content ?? []) {
    if (node.type !== 'paragraph') continue
    const text = paragraphToRpy(node, smartQuotes)
    if (text === null) continue
    const character: string | null = node.attrs?.character ?? null
    const isDialogue = character &&
      character !== SCENE_COMMAND &&
      character !== NVL_CLEAR_COMMAND &&
      character !== TEXT_INSERT_COMMAND &&
      !node.attrs?.commented
    lines.push({ text, charLabel: isDialogue ? character : undefined })
  }
  return lines
}

export function exportToRpy(doc: JSONContent, opts?: { smartQuotes?: boolean }): string {
  return exportToRpyLines(doc, opts).map(l => l.text).join('\n')
}
