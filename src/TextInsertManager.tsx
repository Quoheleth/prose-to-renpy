import { useState } from 'react'
import type { TextInsertDef } from './textInserts'
import './CharacterManager.css'

const EMPTY_FORM: TextInsertDef = {
  name: '',
  text: '',
  inline: false,
  shortcut: '',
}

interface Props {
  textInserts: TextInsertDef[]
  onChange: (inserts: TextInsertDef[]) => void
  onClose: () => void
}

type View = { mode: 'list' } | { mode: 'add' } | { mode: 'edit'; originalName: string }

export default function TextInsertManager({ textInserts, onChange, onClose }: Props) {
  const [view, setView] = useState<View>({ mode: 'list' })
  const [form, setForm] = useState<TextInsertDef>({ ...EMPTY_FORM })

  function openAdd() {
    setForm({ ...EMPTY_FORM })
    setView({ mode: 'add' })
  }

  function openEdit(ti: TextInsertDef) {
    setForm({ ...ti })
    setView({ mode: 'edit', originalName: ti.name })
  }

  function closeForm() {
    setView({ mode: 'list' })
  }

  function setField<K extends keyof TextInsertDef>(key: K, value: TextInsertDef[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleSave() {
    const name = form.name.trim()
    const text = form.text.trim()
    if (!name || !text) return

    if (view.mode === 'add') {
      if (textInserts.some(ti => ti.name === name)) return  // name collision
      onChange([...textInserts, { ...form, name, text }])
    } else if (view.mode === 'edit') {
      // Allow renaming as long as new name doesn't collide with a different entry
      if (name !== view.originalName && textInserts.some(ti => ti.name === name)) return
      onChange(textInserts.map(ti =>
        ti.name === view.originalName ? { ...form, name, text } : ti
      ))
    }
    closeForm()
  }

  function handleDelete(ti: TextInsertDef) {
    if (!window.confirm(`Delete "${ti.name}"?`)) return
    onChange(textInserts.filter(t => t.name !== ti.name))
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  const isForm = view.mode === 'add' || view.mode === 'edit'
  const formTitle = view.mode === 'add'
    ? 'Add Text Insert'
    : view.mode === 'edit' ? `Edit: ${view.originalName}` : ''

  return (
    <div className="cm-backdrop" onClick={handleBackdropClick}>
      <div className="cm-modal">
        <div className="cm-header">
          <span className="cm-title">Manage Text Inserts</span>
          <button className="cm-close" onClick={onClose} title="Close">✕</button>
        </div>

        {!isForm ? (
          <>
            <div className="cm-bar">
              <button className="cm-add-btn" onClick={openAdd}>+ Add Insert</button>
            </div>
            <div className="cm-list">
              {textInserts.map(ti => (
                <div key={ti.name} className="cm-row">
                  <span className="cm-display-name">{ti.name}</span>
                  <span className="cm-label">{ti.text}</span>
                  <span className="cm-shortcut" style={{ visibility: ti.inline ? 'visible' : 'hidden', border: 'none', background: 'none', fontSize: '10px', color: 'var(--text-muted)' }}>
                    {ti.inline ? 'inline' : ''}
                  </span>
                  {ti.shortcut && (
                    <span className="cm-shortcut">{ti.shortcut}</span>
                  )}
                  <button className="cm-row-btn" onClick={() => openEdit(ti)}>Edit</button>
                  <button
                    className="cm-row-btn cm-delete-btn"
                    onClick={() => handleDelete(ti)}
                  >Delete</button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="cm-form">
            <div className="cm-form-title">{formTitle}</div>

            <label className="cm-field">
              <span>Name</span>
              <input
                type="text"
                value={form.name}
                onChange={e => setField('name', e.target.value)}
                placeholder="e.g. show Evelyn happy"
              />
            </label>

            <label className="cm-field">
              <span>Text</span>
              <input
                type="text"
                value={form.text}
                onChange={e => setField('text', e.target.value)}
                placeholder="verbatim Ren'Py text to insert"
              />
            </label>

            <label className="cm-field" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={form.inline}
                onChange={e => setField('inline', e.target.checked)}
                style={{ width: 'auto' }}
              />
              <span style={{ textTransform: 'none', letterSpacing: 'normal', fontSize: '13px', color: 'var(--text)' }}>
                Inline — insert at cursor rather than as a new paragraph
              </span>
            </label>

            <label className="cm-field">
              <span>Keyboard Shortcut</span>
              <input
                type="text"
                value={form.shortcut ?? ''}
                onChange={e => setField('shortcut', e.target.value)}
                placeholder="e.g. ctrl+shift+e"
              />
            </label>

            <div className="cm-form-actions">
              <button className="cm-save-btn" onClick={handleSave}>Save</button>
              <button className="cm-cancel-btn" onClick={closeForm}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
