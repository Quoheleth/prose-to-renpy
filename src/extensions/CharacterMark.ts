import { Extension } from '@tiptap/core'
import { charColor } from '../characters'

// Sentinel value used to mark a paragraph as a Ren'Py scene (clear-screen) command.
// Exports as bare `scene` with no character or text.
export const SCENE_COMMAND = '__scene__'

// Sentinel value used to mark a paragraph as a Ren'Py nvl clear command.
// Exports as bare `nvl clear` with no character or text.
export const NVL_CLEAR_COMMAND = '__nvl_clear__'

// Sentinel value used to mark a paragraph as a user-defined text insert command.
// Exports the verbatim text stored in the `insertText` paragraph attribute.
export const TEXT_INSERT_COMMAND = '__text_insert__'

const COMMAND_SENTINELS = new Set([SCENE_COMMAND, NVL_CLEAR_COMMAND, TEXT_INSERT_COMMAND])

// We store character assignment as a paragraph attribute.
export const CharacterMark = Extension.create({
  name: 'characterMark',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph'],
        attributes: {
          character: {
            default: null,
            parseHTML: el => el.getAttribute('data-character'),
            renderHTML: attrs => {
              if (!attrs.character) return {}
              if (COMMAND_SENTINELS.has(attrs.character))
                return { 'data-character': attrs.character }
              return {
                'data-character': attrs.character,
                style: `color: ${charColor(attrs.character)}`,
              }
            },
          },
          insertText: {
            default: null,
            parseHTML: el => el.getAttribute('data-insert-text') ?? null,
            renderHTML: attrs => {
              if (!attrs.insertText) return {}
              return { 'data-insert-text': attrs.insertText }
            },
          },
          insertDisplay: {
            default: null,
            parseHTML: el => el.getAttribute('data-insert-display') ?? null,
            renderHTML: attrs => {
              if (!attrs.insertDisplay) return {}
              return { 'data-insert-display': attrs.insertDisplay }
            },
          },
          commented: {
            default: false,
            parseHTML: el => el.getAttribute('data-commented') === 'true',
            renderHTML: attrs => {
              if (!attrs.commented) return {}
              return { 'data-commented': 'true' }
            },
          },
        },
      },
    ]
  },

  addCommands() {
    return {
      setCharacter:
        (character: string | null) =>
        ({ commands }: any) => {
          return commands.updateAttributes('paragraph', { character })
        },
    } as any
  },
})
