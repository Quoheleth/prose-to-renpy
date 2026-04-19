import { useState } from 'react'
import type { FontOverrideDef } from './fontOverrides'
import './CharacterManager.css'
import './FontOverrideManager.css'

const EMPTY_FORM: Omit<FontOverrideDef, 'id'> = {
  displayName: '',
  openTag: '',
  closeTag: '',
  color: '#2d2d2d',
  shortcut: '',
}

interface Props {
  fontOverrides: FontOverrideDef[]
  onChange: (overrides: FontOverrideDef[]) => void
  onClose: () => void
}

type View = { mode: 'list' } | { mode: 'add' } | { mode: 'edit'; original: FontOverrideDef }

function makeId(displayName: string, existing: FontOverrideDef[]): string {
  const base = displayName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'override'
  if (!existing.some(f => f.id === base)) return base
  for (let i = 2; i < 100; i++) {
    const candidate = `${base}-${i}`
    if (!existing.some(f => f.id === candidate)) return candidate
  }
  return `${base}-${Date.now()}`
}

export default function FontOverrideManager({ fontOverrides, onChange, onClose }: Props) {
  const [view, setView] = useState<View>({ mode: 'list' })
  const [form, setForm] = useState<Omit<FontOverrideDef, 'id'>>({ ...EMPTY_FORM })

  function openAdd() {
    setForm({ ...EMPTY_FORM })
    setView({ mode: 'add' })
  }

  function openEdit(fo: FontOverrideDef) {
    const { id: _id, ...rest } = fo
    setForm({ ...rest })
    setView({ mode: 'edit', original: fo })
  }

  function closeForm() {
    setView({ mode: 'list' })
  }

  function setField<K extends keyof Omit<FontOverrideDef, 'id'>>(key: K, value: Omit<FontOverrideDef, 'id'>[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleSave() {
    if (!form.displayName.trim() || !form.openTag.trim() || !form.closeTag.trim()) return

    if (view.mode === 'add') {
      const id = makeId(form.displayName, fontOverrides)
      onChange([...fontOverrides, { id, ...form, displayName: form.displayName.trim() }])
    } else if (view.mode === 'edit') {
      onChange(fontOverrides.map(f =>
        f.id === view.original.id ? { ...f, ...form, displayName: form.displayName.trim() } : f
      ))
    }
    closeForm()
  }

  function handleDelete(fo: FontOverrideDef) {
    if (!window.confirm(`Delete "${fo.displayName}"?`)) return
    onChange(fontOverrides.filter(f => f.id !== fo.id))
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  const isForm = view.mode === 'add' || view.mode === 'edit'
  const formTitle = view.mode === 'add'
    ? 'Add Font Override'
    : view.mode === 'edit' ? `Edit: ${view.original.displayName}` : ''

  return (
    <div className="cm-backdrop" onClick={handleBackdropClick}>
      <div className="cm-modal">
        <div className="cm-header">
          <span className="cm-title">Manage Font Overrides</span>
          <button className="cm-close" onClick={onClose} title="Close">✕</button>
        </div>

        {!isForm ? (
          <>
            <div className="cm-bar">
              <button className="cm-add-btn" onClick={openAdd}>+ Add Override</button>
            </div>
            <div className="cm-list">
              {fontOverrides.map(fo => (
                <div key={fo.id} className="cm-row">
                  <span className="cm-swatch" style={{ background: fo.color }} />
                  <span className="cm-display-name">{fo.displayName}</span>
                  <span className="cm-label fo-tags">{fo.openTag} … {fo.closeTag}</span>
                  {fo.shortcut && (
                    <span className="cm-shortcut">{fo.shortcut}</span>
                  )}
                  <button className="cm-row-btn" onClick={() => openEdit(fo)}>Edit</button>
                  <button
                    className="cm-row-btn cm-delete-btn"
                    onClick={() => handleDelete(fo)}
                  >Delete</button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="cm-form">
            <div className="cm-form-title">{formTitle}</div>
            <p className="cm-form-note">The matching text tag must be registered in your Ren'Py project (e.g. in styles.rpy) before it will work in the built game.</p>

            <label className="cm-field">
              <span>Display Name</span>
              <input
                type="text"
                value={form.displayName}
                onChange={e => setField('displayName', e.target.value)}
                placeholder="e.g. flashback/whisper/thoughts/alien language"
              />
            </label>

            <label className="cm-field">
              <span>Opening Tag</span>
              <input
                type="text"
                value={form.openTag}
                onChange={e => setField('openTag', e.target.value)}
                placeholder="e.g. {font=fonts/MyFont.ttf}"
              />
            </label>

            <label className="cm-field">
              <span>Closing Tag</span>
              <input
                type="text"
                value={form.closeTag}
                onChange={e => setField('closeTag', e.target.value)}
                placeholder="e.g. {/font}"
              />
            </label>

            <label className="cm-field">
              <span>Color</span>
              <div className="cm-color-row">
                <input
                  type="color"
                  value={form.color}
                  onChange={e => setField('color', e.target.value)}
                />
                <input
                  type="text"
                  value={form.color}
                  onChange={e => setField('color', e.target.value)}
                  placeholder="#2d2d2d"
                  className="cm-color-text"
                />
              </div>
              <small>RTE display only — does not affect Ren'Py output.</small>
            </label>

            <label className="cm-field">
              <span>Keyboard Shortcut</span>
              <input
                type="text"
                value={form.shortcut}
                onChange={e => setField('shortcut', e.target.value)}
                placeholder="e.g. ctrl+shift+r"
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
