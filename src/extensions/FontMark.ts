import { Mark, mergeAttributes } from '@tiptap/core'
import { getFontOverride } from '../fontOverrides'

// Inline font override — wraps selected text in the override's openTag/closeTag on export.
// In the editor the span is colored using the override's registered color.
export const FontMark = Mark.create({
  name: 'fontOverride',

  addAttributes() {
    return {
      fontName: {
        default: 'raleway',
        parseHTML: el => el.getAttribute('data-font') ?? 'raleway',
        renderHTML: attrs => ({ 'data-font': attrs.fontName }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-font]' }]
  },

  renderHTML({ HTMLAttributes }) {
    const fontName = HTMLAttributes['data-font']
    const color = fontName ? getFontOverride(fontName)?.color : undefined
    const extra: Record<string, string> = { class: 'font-override' }
    if (color) extra.style = `color: ${color}`
    return ['span', mergeAttributes(HTMLAttributes, extra), 0]
  },

  addCommands() {
    return {
      toggleFontOverride:
        () =>
        ({ commands }: any) =>
          commands.toggleMark('fontOverride'),
      setFontOverride:
        (fontName: string) =>
        ({ commands }: any) =>
          commands.setMark('fontOverride', { fontName }),
    } as any
  },
})
