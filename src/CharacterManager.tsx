import { useState } from 'react'
import type { CharacterDef } from './characters'
import './CharacterManager.css'

const FONT_OPTIONS = [
  { label: 'Crimson Pro Regular', value: 'fonts/CrimsonPro-Regular.ttf' },
  { label: 'Crimson Pro Medium',  value: 'fonts/CrimsonPro-Medium.ttf'  },
  { label: 'Raleway',             value: 'raleway'                       },
]

const EMPTY_FORM: CharacterDef = {
  label: '', displayName: '', color: '#2d2d2d',
  font: 'fonts/CrimsonPro-Regular.ttf', shortcut: '',
}

interface Props {
  characters: CharacterDef[]
  onChange: (chars: CharacterDef[]) => void
  onClose: () => void
}

type View = { mode: 'list' } | { mode: 'add' } | { mode: 'edit'; original: CharacterDef }

export default function CharacterManager({ characters, onChange, onClose }: Props) {
  const [view, setView] = useState<View>({ mode: 'list' })
  const [form, setForm] = useState<CharacterDef>({ ...EMPTY_FORM })

  function openAdd() {
    setForm({ ...EMPTY_FORM })
    setView({ mode: 'add' })
  }

  function openEdit(char: CharacterDef) {
    setForm({ ...char })
    setView({ mode: 'edit', original: char })
  }

  function closeForm() {
    setView({ mode: 'list' })
  }

  function setField<K extends keyof CharacterDef>(key: K, value: CharacterDef[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function handleSave() {
    const label = form.label.trim().toLowerCase().replace(/\s+/g, '_')
    if (!label || !form.displayName.trim()) return

    if (view.mode === 'add') {
      if (characters.some(c => c.label === label)) {
        alert(`A character with label "${label}" already exists.`)
        return
      }
      onChange([...characters, { ...form, label }])
    } else if (view.mode === 'edit') {
      onChange(characters.map(c => c.label === view.original.label ? { ...form, label } : c))
    }
    closeForm()
  }

  function handleDelete(char: CharacterDef) {
    if (!window.confirm(`Delete "${char.displayName}" (${char.label})?`)) return
    onChange(characters.filter(c => c.label !== char.label))
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  const isForm = view.mode === 'add' || view.mode === 'edit'
  const formTitle = view.mode === 'add'
    ? 'Add Character'
    : view.mode === 'edit' ? `Edit: ${view.original.displayName}` : ''

  return (
    <div className="cm-backdrop" onClick={handleBackdropClick}>
      <div className="cm-modal">
        <div className="cm-header">
          <span className="cm-title">Manage Characters</span>
          <button className="cm-close" onClick={onClose} title="Close">✕</button>
        </div>

        {!isForm ? (
          <>
            <div className="cm-bar">
              <button className="cm-add-btn" onClick={openAdd}>+ Add Character</button>
            </div>
            <div className="cm-list">
              {characters.map(char => (
                <div key={char.label} className="cm-row">
                  <span className="cm-swatch" style={{ background: char.color }} />
                  <span className="cm-display-name">{char.displayName}</span>
                  <span className="cm-label">{char.label}</span>
                  {char.shortcut && (
                    <span className="cm-shortcut">{char.shortcut}</span>
                  )}
                  <button className="cm-row-btn" onClick={() => openEdit(char)}>Edit</button>
                  <button
                    className="cm-row-btn cm-delete-btn"
                    onClick={() => handleDelete(char)}
                  >Delete</button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="cm-form">
            <div className="cm-form-title">{formTitle}</div>

            <label className="cm-field">
              <span>Label</span>
              <input
                type="text"
                value={form.label}
                onChange={e => setField('label', e.target.value)}
                placeholder="e.g. carissa"
                disabled={view.mode === 'edit'}
              />
              {view.mode === 'add' && (
                <small>Lowercase, used in .rpy export. Cannot be changed after creation.</small>
              )}
            </label>

            <label className="cm-field">
              <span>Display Name</span>
              <input
                type="text"
                value={form.displayName}
                onChange={e => setField('displayName', e.target.value)}
                placeholder="e.g. Carissa"
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
              <small>RTE display only — character colors still need to be set in Ren'Py.</small>
            </label>

            <label className="cm-field">
              <span>Font</span>
              <select
                value={form.font}
                onChange={e => setField('font', e.target.value)}
              >
                {FONT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>

            <label className="cm-field">
              <span>Keyboard Shortcut</span>
              <input
                type="text"
                value={form.shortcut}
                onChange={e => setField('shortcut', e.target.value)}
                placeholder="e.g. ctrl+k"
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
