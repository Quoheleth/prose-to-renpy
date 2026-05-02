import { Editor, useEditorState } from '@tiptap/react'
import type { CharacterDef } from './characters'
import type { FontOverrideDef } from './fontOverrides'
import type { TextInsertDef } from './textInserts'
import { SCENE_COMMAND, NVL_CLEAR_COMMAND } from './extensions/CharacterMark'
import './Toolbar.css'

interface Props {
  editor: Editor
  characters: CharacterDef[]
  fontOverrides: FontOverrideDef[]
  textInserts: TextInsertDef[]
  onSetComment: () => void
  onSetRaw: () => void
  onInsertScene: () => void
  onInsertNvlClear: () => void
  onInsertTextInsert: (ti: TextInsertDef) => void
  onManageCharacters: () => void
  onManageFontOverrides: () => void
  onManageTextInserts: () => void
}

export default function Toolbar({
  editor,
  characters,
  fontOverrides,
  textInserts,
  onSetComment,
  onSetRaw,
  onInsertScene,
  onInsertNvlClear,
  onInsertTextInsert,
  onManageCharacters,
  onManageFontOverrides,
  onManageTextInserts,
}: Props) {
  const { activeChar, isCommented, isRaw, isBold, isItalic, isUnderline, isStrike, activeFontOverrideId } = useEditorState({
    editor,
    selector: snap => {
      const foMark = snap.editor.state.selection.$from
        .marks()
        .find(m => m.type.name === 'fontOverride')
      const paraAttrs = snap.editor.getAttributes('paragraph')
      return {
        activeChar:           (paraAttrs.character ?? null) as string | null,
        isCommented:          (paraAttrs.commented ?? false) as boolean,
        isRaw:                (paraAttrs.raw ?? false) as boolean,
        isBold:               snap.editor.isActive('bold'),
        isItalic:             snap.editor.isActive('italic'),
        isUnderline:          snap.editor.isActive('underline'),
        isStrike:             snap.editor.isActive('strike'),
        activeFontOverrideId: (foMark?.attrs?.fontName as string) ?? null,
      }
    },
  })

  function assignCharacter(char: string) {
    if (activeChar === char && !isCommented) {
      ;(editor.chain().focus() as any).setCharacter(null).run()
    } else {
      ;(editor.chain().focus() as any)
        .setCharacter(char)
        .updateAttributes('paragraph', { commented: false })
        .run()
    }
  }

  function toggleFontOverride(fo: FontOverrideDef) {
    if (activeFontOverrideId === fo.id) {
      editor.chain().focus().unsetMark('fontOverride').run()
    } else {
      ;(editor.chain().focus() as any).setFontOverride(fo.id).run()
    }
  }

  return (
    <div className="toolbar">
      {/* Row 1: inline marks (left) + font override buttons (right) */}
      <div className="toolbar-section toolbar-inline">
        <button
          className={`toolbar-btn ${isBold ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Bold (Ctrl+B)"
        >
          <strong>B</strong>
        </button>
        <button
          className={`toolbar-btn italic-btn ${isItalic ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Italic (Ctrl+I)"
        >
          <em>I</em>
        </button>
        <button
          className={`toolbar-btn ${isUnderline ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          title="Underline (Ctrl+U)"
        >
          <u>U</u>
        </button>
        <button
          className={`toolbar-btn ${isStrike ? 'active' : ''}`}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          title="Strikethrough"
        >
          <s>S</s>
        </button>

        <div className="toolbar-fo-group">
          {fontOverrides.map(fo => (
            <button
              key={fo.id}
              className={`fo-btn ${activeFontOverrideId === fo.id ? 'active' : ''}`}
              style={{ '--fo-color': fo.color } as React.CSSProperties}
              onClick={() => toggleFontOverride(fo)}
              title={fo.shortcut ? `${fo.displayName} (${fo.shortcut})` : fo.displayName}
            >
              {fo.displayName}
            </button>
          ))}
          <button
            className="manage-btn"
            onClick={onManageFontOverrides}
            title="Manage font overrides"
          >
            ⚙ font overrides
          </button>
        </div>
      </div>

      {/* Row 2: text insert buttons (scene, nvl clear, user-defined) */}
      <div className="toolbar-section toolbar-inserts">
        <button
          className="manage-btn"
          onClick={onManageTextInserts}
          title="Manage text inserts"
        >
          ⚙ text inserts
        </button>
        <button
          className="insert-btn"
          onClick={onInsertScene}
          title="Insert scene command"
        >
          scene
        </button>
        <button
          className="insert-btn"
          onClick={onInsertNvlClear}
          title="Insert nvl clear command"
        >
          nvl clear
        </button>
        {textInserts.map(ti => (
          <button
            key={ti.name}
            className="insert-btn"
            onClick={() => onInsertTextInsert(ti)}
            title={ti.shortcut ? `${ti.name} (${ti.shortcut})` : ti.name}
          >
            {ti.name}
          </button>
        ))}
      </div>

      {/* Row 3: character buttons */}
      <div className="toolbar-section toolbar-chars">
        <button
          className="manage-btn"
          onClick={onManageCharacters}
          title="Manage characters"
        >
          ⚙ chars
        </button>
        <button
          className={`char-btn comment-char-btn ${activeChar === null || isCommented ? 'active' : ''}`}
          onClick={onSetComment}
          title="Comment (Ctrl+/)"
        >
          #
        </button>
        <button
          className={`char-btn raw-char-btn ${isRaw ? 'active' : ''}`}
          onClick={onSetRaw}
          title="Raw Ren'Py — emitted verbatim, no escaping or processing"
        >
          raw
        </button>
        {characters.map(char => (
          <button
            key={char.label}
            className={`char-btn ${activeChar === char.label ? 'active' : ''}`}
            style={{ '--char-color': char.color } as React.CSSProperties}
            onClick={() => assignCharacter(char.label)}
            title={char.shortcut ? `${char.label} (${char.shortcut})` : char.label}
          >
            {char.displayName}
          </button>
        ))}
      </div>
    </div>
  )
}
