# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # Type-check (tsc) then build
npm run preview   # Preview production build
npx vitest        # Run tests (no test script in package.json — use npx)
npx vitest run src/export.test.ts  # Run a single test file
```

No linter is configured.

## Architecture

A single-page React app (React 19 + TypeScript + Vite) that lets writers compose Ren'Py dialogue in a rich-text editor and get a live `.rpy` export.

**Two-pane layout:**
- Left — TipTap authoring surface with toolbar (character assignment, inline formatting)
- Right — read-only `.rpy` preview, debounced 300 ms after keystrokes, with a manual Refresh button

**Header actions:** Clear (erases typed text only; characters/overrides untouched), smart-quote toggle, Refresh, Export .rpy.

**Key source files:**

| File | Responsibility |
|---|---|
| `src/App.tsx` | Root component; wires editor, toolbar, preview, keyboard shortcuts, all three manager modals |
| `src/export.ts` | Core business logic: converts TipTap `JSONContent` → Ren'Py syntax |
| `src/export.test.ts` | Vitest cases covering escaping, font merging, mark ordering, quote normalisation, etc. |
| `src/quoteNormalize.ts` | `normalizeQuotes()` — converts straight `"` / `'` to typographic curly quotes with Ren'Py-tag-aware context detection |
| `src/characters.ts` | `CharacterDef` type, `DEFAULT_CHARACTERS` (39 entries), localStorage persistence, `_charMap` module-level lookup |
| `src/fontOverrides.ts` | `FontOverrideDef` type, `DEFAULT_FONT_OVERRIDES` (Baseline + Taldane), localStorage persistence, `_fontOverrideMap` module-level lookup |
| `src/textInserts.ts` | `TextInsertDef` type, localStorage persistence |
| `src/Toolbar.tsx` | Three-row toolbar: (1) inline marks + font overrides right-aligned, (2) text inserts, (3) character buttons |
| `src/CharacterManager.tsx` | Add/edit/delete character modal |
| `src/FontOverrideManager.tsx` | Add/edit/delete font override modal; shares `.cm-*` CSS classes with CharacterManager |
| `src/TextInsertManager.tsx` | Add/edit/delete text insert modal; shares `.cm-*` CSS classes |
| `src/extensions/CharacterMark.ts` | TipTap paragraph-level extension — stores `data-character` attribute; `__scene__`, `__nvl_clear__`, and `__text_insert__` sentinels for command lines; also stores `insertText` and `commented` paragraph attributes |
| `src/extensions/FontMark.ts` | TipTap inline mark — stores `fontName` (= override id); `renderHTML` injects color from `_fontOverrideMap` |

## Export logic (`src/export.ts`)

Walks the TipTap `JSONContent` tree paragraph by paragraph. Key behaviours:

- **Streaming font spans** — tracks the currently-open `fontOverride` across text nodes so consecutive same-font nodes collapse into one span rather than splitting.
- **Tag lookup** — `fontOpenTag()`/`fontCloseTag()` look up the override's `openTag`/`closeTag` from `_fontOverrideMap`. Unknown IDs fall back to `{font=name}`/`{/font}`.
- **Trailing whitespace** — spaces at the end of an inline or font span are moved outside the closing tag before it closes.
- **Escaping** — `{`→`{{`, `}`→`}}`, `\`→`\\`, `%`→`%%`. Double spaces collapse to one. Non-breaking spaces normalised. `"` is handled after assembly (see below).
- **Quote handling** — after all text nodes are assembled, `"` is either escaped as `\"` (default) or converted to typographic curly quotes via `normalizeQuotes()` (when `opts.smartQuotes` is true). Both operate on the fully assembled paragraph string so they have correct open/close context across node boundaries.
- **Comment paragraphs** (`character === null`) — go through the full inline processing pipeline (escaping, marks, font spans, smart quotes) same as character paragraphs, but exported as `# text` with no quotes wrapping.
- **Scene paragraphs** (`character === '__scene__'`) — emit bare `scene`, ignore all text content.
- **NVL clear paragraphs** (`character === '__nvl_clear__'`) — emit bare `nvl clear`, ignore all text content.
- **Text insert paragraphs** (`character === '__text_insert__'`) — emit the verbatim text stored in `node.attrs.insertText`, ignore all inline content.
- **Commented paragraphs** (`node.attrs.commented === true`) — any typed block (character, scene, nvl clear, text insert) can be toggled into commented mode. The output is prefixed with `# ` while the block type is preserved. Character dialogue emits `# label "text"`, commands emit `# scene` / `# nvl clear` / `# insertText`. Toggled by the `#` button (or Ctrl+/) when the cursor is on a typed block; pressing again removes the prefix. Pressing `#` on an unstyled block still converts it to a plain comment (`character === null`).
- Lines are `trimEnd()`-ed before output.

`exportToRpy(doc, opts?)` accepts an optional `{ smartQuotes?: boolean }` options object. `exportToRpyLines(doc, opts?)` returns `RpyLine[]` (each with `text` and optional `charLabel`) for the preview renderer.

### % escaping

Ren'Py passes dialogue strings through Python's `%`-formatting before display. Any `%` followed by a valid format character (`s`, `d`, `o`, `x`, `f`, etc.) raises a `TypeError` at runtime. `escapeText()` replaces every `%` with `%%`; this does not apply to command paragraphs (scene, nvl clear, text insert).

## Font override system (`src/fontOverrides.ts`)

`FontOverrideDef` fields: `id` (unique key, stored as `fontName` in FontMark — never appears in `.rpy` output), `displayName`, `openTag`, `closeTag`, `color` (hex, used for editor display only), `shortcut`.

- Persisted in `localStorage` under key `'prose-to-renpy-font-overrides'`; seeded from `DEFAULT_FONT_OVERRIDES` on first load.
- **`updateFontOverrideMap()` must be called whenever the override list changes** — same pattern as `updateCharMap()`.
- Some fonts in the VN are registered in styles.rpy as custom tags that bundle font face + size (e.g. `{raleway}` = Raleway at 20pt). These use bare `{name}…{/name}` syntax rather than `{font=name}` because `{font=}` sets face only and would lose the size. The `openTag`/`closeTag` fields on each `FontOverrideDef` encode this — the export has no special cases.
- `id` is auto-generated from `displayName` on creation (slugified, collision-suffixed) and is not shown to the user.

## Character system (`src/characters.ts`)

`CharacterDef` fields: `label` (lowercase/underscores, used verbatim in `.rpy`), `displayName`, `color` (hex), `font` (Crimson Pro path, used by the Taldane override's default seed), `shortcut`.

- Persisted in `localStorage` under key `'prose-to-renpy-characters'`; seeded from `DEFAULT_CHARACTERS` on first load.
- **`updateCharMap()` must be called whenever the character list changes.**
- Label is immutable after creation (existing document nodes reference it).

## Text insert system (`src/textInserts.ts`)

`TextInsertDef` fields: `name` (unique key and display label), `text` (verbatim Ren'Py text), `inline` (boolean), `shortcut?`.

- Persisted in `localStorage` under key `'prose-to-renpy-text-inserts'`; starts empty.
- **`inline: false`** — clicking the button inserts a new command paragraph after the current block. The `text` is baked into the paragraph node as `insertText` at insert time; editing the definition later does not affect existing paragraphs. The paragraph blocks printable keyboard input (same as scene/nvl clear).
- **`inline: true`** — clicking inserts the text string at the current cursor position in the current paragraph via `editor.commands.insertContent()`. No new paragraph type involved.
- `name` serves as both unique key and display label — no separate `id` or `displayName`. Renaming is allowed as long as the new name doesn't collide with another entry.

## TipTap extension conventions

- `CharacterMark` is a **Node extension** (paragraph attribute), not a Mark — sets `data-character` on `<p>` elements. Also manages `insertText` (`data-insert-text`) for text insert paragraphs and `commented` (`data-commented="true"`) for the commented-block toggle.
- `FontMark` is an inline **Mark** — stores `fontName` attribute (`data-font` in HTML). `renderHTML` reads color from `_fontOverrideMap` and injects it as `style="color: …"` directly on the span.
- The color picker in CharacterManager and FontOverrideManager modals is the browser's native `<input type="color">` paired with a text input — no library. TextInsertManager has no color picker.
- All manager modals share `.cm-*` CSS classes from `CharacterManager.css`. Manage buttons in the toolbar share the `.manage-btn` class from `Toolbar.css`.

## Markdown shortcuts disabled

The editor intentionally disables all TipTap/StarterKit markdown input rules so the left pane behaves as plain text input:

- **Block-level** — `heading`, `blockquote`, `bulletList`, `orderedList`, `horizontalRule`, `codeBlock` are all passed `false` in `StarterKit.configure(...)`.
- **Inline marks** — `bold`, `italic`, `strike`, `code` are removed from StarterKit and re-added as module-level `…NoShortcuts` variants (`Bold.extend({ addInputRules() { return [] } })`) so toolbar buttons and keyboard shortcuts (Ctrl+B etc.) still work, but typing `**text**`, `_text_`, etc. has no effect.

## Toolbar layout

Three rows:

| Row | Left | Right |
|---|---|---|
| 1 | B I U S (inline marks) | font override buttons + ⚙ font overrides (`margin-left: auto`) |
| 2 | ⚙ text inserts \| scene \| nvl clear \| [user insert buttons…] | — |
| 3 | ⚙ chars \| # \| [character buttons…] | — |

Row 2 has a `border-bottom` separating it from the character row. All buttons on row 2 use `--color-scene` (lilac `#7a6aaa`), including the hardcoded scene and nvl clear buttons.

## Ren'Py output format

```
character_label "dialogue text with {i}inline{/i} and {s}strike{/s} tags"
# comment line (fully escaped and marked, same pipeline as character lines)
# character_label "commented-out dialogue — block type preserved, # prepended"
scene
# scene
nvl clear
# nvl clear
show Evelyn happy
# show Evelyn happy
```

Brace escaping is critical — any literal `{` or `}` in user text must become `{{` / `}}`. Any `%` must become `%%`.

## Preview coloring (`src/App.tsx` — `renderPreviewLine`)

The right-pane preview renders dialogue lines with character colors applied to the dialogue text only:

- The character label and surrounding `"…"` quotes render in the default preview color.
- Text between the quotes is split on Ren'Py tags via `/({{|}}|{[^{}]*})/g`. Tag segments (`{b}`, `{/i}`, `{font=…}`, custom tags like `{raleway}`) render uncolored; plain text segments get the character's color. Escaped braces `{{`/`}}` are treated as plain text and colored.
- `charLabel` is only set on non-commented, non-command character dialogue lines. Comments, scene/nvl clear, text inserts, and `commented` blocks all render without color.

## localStorage keys

| Key | Contents |
|---|---|
| `'prose-to-renpy-editor-content'` | Editor JSON, autosaved 500 ms after changes; restored on page load |
| `'prose-to-renpy-characters'` | User character list |
| `'prose-to-renpy-font-overrides'` | User font override list |
| `'prose-to-renpy-text-inserts'` | User text insert list |
| `'prose-to-renpy-smart-quotes'` | `'true'`/`'false'` — smart quote toggle state |

The Clear button only removes `'prose-to-renpy-editor-content'`; all other data is unaffected.

## Command paragraph insertion

The scene, nvl clear, and text insert (paragraph-mode) toolbar buttons all insert a **new** command paragraph after the current block rather than converting the current block. All use `editor.state.selection.$from.after()` to find the insertion position. Command paragraphs block printable keyboard input so they stay content-free; structural keys (Enter, Backspace, arrows) still work.

Text in command paragraphs is displayed in the editor via CSS `::before { content: … }` — scene shows `scene ▸`, nvl clear shows `nvl clear ▸`, and text insert paragraphs show their baked-in text via `content: attr(data-insert-text) ' ▸ '`.
