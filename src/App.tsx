import { useState, useEffect, useRef, type ReactNode } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Bold from '@tiptap/extension-bold'
import Italic from '@tiptap/extension-italic'
import Strike from '@tiptap/extension-strike'
import Code from '@tiptap/extension-code'
import { TextStyle } from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import { exportToRpy, exportToRpyLines, type RpyLine } from './export'
import { charColor } from './characters'
import { CharacterMark, SCENE_COMMAND, NVL_CLEAR_COMMAND, TEXT_INSERT_COMMAND } from './extensions/CharacterMark'
import { FontMark } from './extensions/FontMark'
import {
  loadCharacters, saveCharacters, updateCharMap,
  type CharacterDef,
} from './characters'
import {
  loadFontOverrides, saveFontOverrides, updateFontOverrideMap,
  type FontOverrideDef,
} from './fontOverrides'
import {
  loadTextInserts, saveTextInserts,
  type TextInsertDef,
} from './textInserts'
import Toolbar from './Toolbar'
import CharacterManager from './CharacterManager'
import FontOverrideManager from './FontOverrideManager'
import TextInsertManager from './TextInsertManager'
import './App.css'


function matchesShortcut(e: KeyboardEvent, shortcut: string): boolean {
  const parts = shortcut.toLowerCase().split('+')
  const key = parts[parts.length - 1]
  const ctrl  = parts.includes('ctrl')
  const alt   = parts.includes('alt')
  const shift = parts.includes('shift')
  return (
    e.ctrlKey  === ctrl  &&
    e.altKey   === alt   &&
    e.shiftKey === shift &&
    e.key.toLowerCase() === key
  )
}

// One-time migration from legacy 'planecrash-*' localStorage keys
;(function migrateStorage() {
  const migrations: [string, string][] = [
    ['planecrash-editor-content', 'prose-to-renpy-editor-content'],
    ['planecrash-characters',     'prose-to-renpy-characters'],
    ['planecrash-font-overrides', 'prose-to-renpy-font-overrides'],
    ['planecrash-text-inserts',   'prose-to-renpy-text-inserts'],
    ['planecrash-smart-quotes',   'prose-to-renpy-smart-quotes'],
  ]
  for (const [oldKey, newKey] of migrations) {
    if (!localStorage.getItem(newKey)) {
      const val = localStorage.getItem(oldKey)
      if (val !== null) {
        localStorage.setItem(newKey, val)
        localStorage.removeItem(oldKey)
      }
    }
  }
})()

const EDITOR_STORAGE_KEY = 'prose-to-renpy-editor-content'

// Inline marks without markdown input rules — keyboard shortcuts (Ctrl+B etc.)
// still work, but typing **text**, _text_, ~~text~~, `text` does nothing special.
const BoldNoShortcuts = Bold.extend({ addInputRules() { return [] } })
const ItalicNoShortcuts = Italic.extend({ addInputRules() { return [] } })
const StrikeNoShortcuts = Strike.extend({ addInputRules() { return [] } })
const CodeNoShortcuts = Code.extend({ addInputRules() { return [] } })

export default function App() {
  const [previewLines, setPreviewLines] = useState<RpyLine[]>([])
  const [showCharManager, setShowCharManager] = useState(false)
  const [showFontOverrideManager, setShowFontOverrideManager] = useState(false)
  const [showTextInsertManager, setShowTextInsertManager] = useState(false)

  const [characters, setCharacters] = useState<CharacterDef[]>(() => {
    const chars = loadCharacters()
    updateCharMap(chars)
    return chars
  })

  const [fontOverrides, setFontOverrides] = useState<FontOverrideDef[]>(() => {
    const overrides = loadFontOverrides()
    updateFontOverrideMap(overrides)
    return overrides
  })

  const [textInserts, setTextInserts] = useState<TextInsertDef[]>(() => loadTextInserts())

  const [smartQuotes, setSmartQuotes] = useState<boolean>(() => {
    return localStorage.getItem('prose-to-renpy-smart-quotes') === 'true'
  })

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autosaveRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const editorRef = useRef<ReturnType<typeof useEditor>>(null)
  const charactersRef = useRef(characters)
  const fontOverridesRef = useRef(fontOverrides)
  const textInsertsRef = useRef(textInserts)
  const smartQuotesRef = useRef(smartQuotes)
  const previewRef = useRef<HTMLPreElement>(null)

  useEffect(() => { charactersRef.current = characters }, [characters])
  useEffect(() => { fontOverridesRef.current = fontOverrides }, [fontOverrides])
  useEffect(() => { textInsertsRef.current = textInserts }, [textInserts])
  useEffect(() => { smartQuotesRef.current = smartQuotes }, [smartQuotes])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable all block-level markdown shortcuts (# heading, > blockquote,
        // - list, --- rule, ``` code block) — the editor is plain-text input only.
        heading: false,
        blockquote: false,
        bulletList: false,
        orderedList: false,
        horizontalRule: false,
        codeBlock: false,
        // Disable built-in inline marks so we can supply the no-shortcut versions.
        bold: false,
        italic: false,
        strike: false,
        code: false,
      }),
      BoldNoShortcuts,
      ItalicNoShortcuts,
      StrikeNoShortcuts,
      CodeNoShortcuts,
      TextStyle,
      Underline,
      CharacterMark,
      FontMark,
    ],
    content: (() => {
      const saved = localStorage.getItem(EDITOR_STORAGE_KEY)
      if (saved) { try { return JSON.parse(saved) } catch { /* fall through */ } }
      return '<p></p>'
    })(),
    editorProps: {
      transformPastedText(text) {
        return text.replace(/\u00a0/g, ' ').replace(/ {2,}/g, ' ')
      },
      transformPastedHTML(html) {
        return html.replace(/&nbsp;/g, ' ')
      },
      handleKeyDown(view, event) {
        const $from = view.state.selection.$from
        const ch = $from.parent.attrs.character
        if (ch !== SCENE_COMMAND && ch !== NVL_CLEAR_COMMAND && ch !== TEXT_INSERT_COMMAND) return false
        // Allow modifier combos, navigation, and editing structure
        if (event.ctrlKey || event.metaKey || event.altKey) return false
        const passThrough = ['Enter', 'Backspace', 'Delete',
          'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
          'Tab', 'Escape', 'Home', 'End']
        if (passThrough.includes(event.key)) return false
        return true  // block printable input
      },
    },
    onUpdate({ editor }) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        setPreviewLines(exportToRpyLines(editor.getJSON(), { smartQuotes: smartQuotesRef.current }))
      }, 300)

      if (autosaveRef.current) clearTimeout(autosaveRef.current)
      autosaveRef.current = setTimeout(() => {
        localStorage.setItem(EDITOR_STORAGE_KEY, JSON.stringify(editor.getJSON()))
      }, 500)
    },
  })

  ;(editorRef as React.MutableRefObject<typeof editor>).current = editor

  function handleCharactersChange(newChars: CharacterDef[]) {
    setCharacters(newChars)
    saveCharacters(newChars)
    updateCharMap(newChars)
  }

  function handleFontOverridesChange(newOverrides: FontOverrideDef[]) {
    setFontOverrides(newOverrides)
    saveFontOverrides(newOverrides)
    updateFontOverrideMap(newOverrides)
  }

  function handleTextInsertsChange(newInserts: TextInsertDef[]) {
    setTextInserts(newInserts)
    saveTextInserts(newInserts)
  }

  function insertTextInsert(ti: TextInsertDef) {
    const ed = editorRef.current
    if (!ed) return
    if (ti.inline) {
      ed.chain().focus().insertContent(ti.text).run()
    } else {
      const insertPos = ed.state.selection.$from.after()
      ed.chain().focus().command(({ tr, state, dispatch }) => {
        if (dispatch) {
          const para = state.schema.nodes.paragraph.createAndFill({
            character: TEXT_INSERT_COMMAND,
            insertText: ti.text,
            insertDisplay: ti.name,
          })!
          tr.insert(insertPos, para)
        }
        return true
      }).run()
    }
  }

  function refresh() {
    if (!editor) return
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    setPreviewLines(exportToRpyLines(editor.getJSON(), { smartQuotes }))
  }

  function handleExport() {
    const content = previewLines.length
      ? previewLines.map(l => l.text).join('\n')
      : (editor ? exportToRpy(editor.getJSON(), { smartQuotes }) : '')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'scene.rpy'
    a.click()
    URL.revokeObjectURL(url)
  }

  function renderPreviewLine(line: RpyLine): ReactNode {
    if (!line.charLabel) return line.text
    const color = charColor(line.charLabel)
    const quoteIdx = line.text.indexOf('"')
    if (quoteIdx === -1 || quoteIdx >= line.text.length - 1) return line.text
    const dialogue = line.text.slice(quoteIdx + 1, -1)
    // Split on Ren'Py tags {like_this} while treating escaped {{ and }} as plain text.
    const segments = dialogue.split(/({{|}}|{[^{}]*})/g)
    return (
      <>
        <span>{line.text.slice(0, quoteIdx + 1)}</span>
        {segments.map((seg, i) => {
          const isTag = i % 2 === 1 && seg.startsWith('{') && seg !== '{{'
          return <span key={i} style={isTag ? undefined : { color }}>{seg}</span>
        })}
        <span>{line.text.slice(-1)}</span>
      </>
    )
  }

  function insertScene() {
    const ed = editorRef.current
    if (!ed) return
    const insertPos = ed.state.selection.$from.after()
    ed.chain().focus().command(({ tr, state, dispatch }) => {
      if (dispatch) {
        const para = state.schema.nodes.paragraph.createAndFill({ character: SCENE_COMMAND })!
        tr.insert(insertPos, para)
      }
      return true
    }).run()
  }

  function insertNvlClear() {
    const ed = editorRef.current
    if (!ed) return
    const insertPos = ed.state.selection.$from.after()
    ed.chain().focus().command(({ tr, state, dispatch }) => {
      if (dispatch) {
        const para = state.schema.nodes.paragraph.createAndFill({ character: NVL_CLEAR_COMMAND })!
        tr.insert(insertPos, para)
      }
      return true
    }).run()
  }

  function setCommentMode() {
    const ed = editorRef.current
    if (!ed) return
    const attrs = ed.getAttributes('paragraph')
    const currentChar: string | null = attrs.character ?? null
    if (currentChar) {
      // Any typed block (character, scene, nvl clear, text insert): toggle commented
      const isCommented: boolean = attrs.commented ?? false
      ;(ed.chain().focus() as any).updateAttributes('paragraph', { commented: !isCommented }).run()
    } else {
      // Unstyled block: plain comment (character = null)
      ;(ed.chain().focus() as any).setCharacter(null).run()
    }
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Ctrl+/ — toggle comment
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault()
        setCommentMode()
        return
      }

      // Character, font override, and text insert shortcuts — skip if any manager modal is open
      if (showCharManager || showFontOverrideManager || showTextInsertManager) return
      const ed = editorRef.current
      if (!ed) return

      for (const ti of textInsertsRef.current) {
        if (!ti.shortcut) continue
        if (matchesShortcut(e, ti.shortcut)) {
          e.preventDefault()
          insertTextInsert(ti)
          return
        }
      }

      for (const fo of fontOverridesRef.current) {
        if (!fo.shortcut) continue
        if (matchesShortcut(e, fo.shortcut)) {
          e.preventDefault()
          const foMark = ed.state.selection.$from.marks().find(m => m.type.name === 'fontOverride')
          if (foMark?.attrs.fontName === fo.id) {
            ed.chain().focus().unsetMark('fontOverride').run()
          } else {
            ;(ed.chain().focus() as any).setFontOverride(fo.id).run()
          }
          return
        }
      }

      for (const char of charactersRef.current) {
        if (!char.shortcut) continue
        if (matchesShortcut(e, char.shortcut)) {
          e.preventDefault()
          const active = ed.getAttributes('paragraph').character ?? null
          if (active === char.label) {
            ;(ed.chain().focus() as any).setCharacter(null).run()
          } else {
            ;(ed.chain().focus() as any).setCharacter(char.label).run()
          }
          return
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCharManager, showFontOverrideManager, showTextInsertManager])

  return (
    <div className="app">
      <header className="app-header">
        <h1>
          <span style={{ fontFamily: "'Crimson Pro', serif", color: '#651e1e' }}>prose</span>
          {' to '}
          <span style={{ fontFamily: 'Raleway, sans-serif', color: '#2a4a7a' }}>Ren'Py</span>
        </h1>
        <div className="header-actions">
          <button className="clear-btn" onClick={() => {
            if (!confirm('Erase all typed text? (Characters and font overrides are kept.)')) return
            localStorage.removeItem(EDITOR_STORAGE_KEY)
            editor?.commands.setContent('<p></p>')
            setPreviewLines([])
          }} title="Erase typed text and start fresh">
            Clear
          </button>
          <button
            className={`sq-toggle-btn ${smartQuotes ? 'active' : ''}`}
            onClick={() => {
              const next = !smartQuotes
              setSmartQuotes(next)
              localStorage.setItem('prose-to-renpy-smart-quotes', String(next))
              if (editor) setPreviewLines(exportToRpyLines(editor.getJSON(), { smartQuotes: next }))
            }}
            title={smartQuotes ? 'Smart quotes on — click to use straight quotes in export' : 'Smart quotes off — click to auto-convert "" to \u201C\u201D in export'}
          >
            {smartQuotes ? '\u201C\u201D' : '""'}
          </button>
          <button className="refresh-btn" onClick={refresh} title="Regenerate output now">
            Refresh
          </button>
          <button className="export-btn" onClick={handleExport}>
            Export .rpy
          </button>
        </div>
      </header>
      <div className="panes">
        <div className="pane pane-editor">
          <div className="pane-label">Script</div>
          {editor && (
            <Toolbar
              editor={editor}
              characters={characters}
              fontOverrides={fontOverrides}
              textInserts={textInserts}
              onSetComment={setCommentMode}
              onInsertScene={insertScene}
              onInsertNvlClear={insertNvlClear}
              onInsertTextInsert={insertTextInsert}
              onManageCharacters={() => setShowCharManager(true)}
              onManageFontOverrides={() => setShowFontOverrideManager(true)}
              onManageTextInserts={() => setShowTextInsertManager(true)}
            />
          )}
          <EditorContent className="tiptap-wrapper" editor={editor} />
        </div>
        <div className="pane pane-preview">
          <div className="pane-label">Output (.rpy)</div>
          <pre
            ref={previewRef}
            className="rpy-preview"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.ctrlKey && e.key === 'a') {
                e.preventDefault()
                const el = previewRef.current
                if (!el) return
                const range = document.createRange()
                range.selectNodeContents(el)
                const sel = window.getSelection()
                if (sel) {
                  sel.removeAllRanges()
                  sel.addRange(range)
                }
              }
            }}
          >{previewLines.map((line, i) => (
            <span key={i}>
              {i > 0 && '\n'}
              {renderPreviewLine(line)}
            </span>
          ))}</pre>
        </div>
      </div>

      {showCharManager && (
        <CharacterManager
          characters={characters}
          onChange={handleCharactersChange}
          onClose={() => setShowCharManager(false)}
        />
      )}

      {showFontOverrideManager && (
        <FontOverrideManager
          fontOverrides={fontOverrides}
          onChange={handleFontOverridesChange}
          onClose={() => setShowFontOverrideManager(false)}
        />
      )}

      {showTextInsertManager && (
        <TextInsertManager
          textInserts={textInserts}
          onChange={handleTextInsertsChange}
          onClose={() => setShowTextInsertManager(false)}
        />
      )}
    </div>
  )
}
