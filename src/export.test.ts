import { describe, it, expect } from 'vitest'
import { exportToRpy } from './export'
import { normalizeQuotes } from './quoteNormalize'
import type { JSONContent } from '@tiptap/react'
import { SCENE_COMMAND, NVL_CLEAR_COMMAND } from './extensions/CharacterMark'

function doc(...paragraphs: JSONContent[]): JSONContent {
  return { type: 'doc', content: paragraphs }
}

function para(character: string | null, ...content: JSONContent[]): JSONContent {
  return {
    type: 'paragraph',
    attrs: { character },
    content,
  }
}

function text(t: string, ...marks: NonNullable<JSONContent['marks']>): JSONContent {
  return { type: 'text', text: t, marks: marks ?? [] }
}

const italic = { type: 'italic' }
const font = (fontName = 'raleway') => ({ type: 'fontOverride', attrs: { fontName } })

// ── quote normalisation ────────────────────────────────────────────────────

describe('normalizeQuotes', () => {
  it('opening and closing double quotes', () => {
    expect(normalizeQuotes('"Hello," he said.')).toBe('\u201CHello,\u201D he said.')
  })

  it('apostrophe between word chars stays right single', () => {
    expect(normalizeQuotes("don't, it's, bob's")).toBe('don\u2019t, it\u2019s, bob\u2019s')
  })

  it('single-quoted word', () => {
    expect(normalizeQuotes("She said 'yes'.")).toBe('She said \u2018yes\u2019.')
  })

  it('double quotes around font tag content', () => {
    // " preceded by space before a markup tag → still opening
    expect(normalizeQuotes('{raleway}"yes"{/raleway}')).toBe('{raleway}\u201Cyes\u201D{/raleway}')
  })

  it('closing double quote after markup close tag', () => {
    // "{i}word{/i}" — the trailing " is preceded by the word inside the italic span
    expect(normalizeQuotes('She said "{i}something{/i}".')).toBe('She said \u201C{i}something{/i}\u201D.')
  })

  it('already-curly quotes are left untouched', () => {
    const input = '\u201CHello\u201D and don\u2019t'
    expect(normalizeQuotes(input)).toBe(input)
  })
})

// ── basic ──────────────────────────────────────────────────────────────────

describe('basic output', () => {
  it('simple character line', () => {
    expect(exportToRpy(doc(
      para('carissa', text('Hello there.')),
    ))).toBe('carissa "Hello there."')
  })

  it('empty paragraph is skipped', () => {
    expect(exportToRpy(doc(
      para('carissa', text('Hello.')),
      para('keltham'),
      para('keltham', text('Hi.')),
    ))).toBe('carissa "Hello."\nkeltham "Hi."')
  })

  it('whitespace-only paragraph is skipped', () => {
    expect(exportToRpy(doc(
      para('carissa', text('   ')),
    ))).toBe('')
  })

  it('no character → comment', () => {
    expect(exportToRpy(doc(
      para(null, text('Stage direction.')),
    ))).toBe('# Stage direction.')
  })

  it('__scene__ → bare scene', () => {
    expect(exportToRpy(doc(
      para(SCENE_COMMAND),
    ))).toBe('scene')
  })

  it('__nvl_clear__ → bare nvl clear', () => {
    expect(exportToRpy(doc(
      para(NVL_CLEAR_COMMAND),
    ))).toBe('nvl clear')
  })
})

// ── escaping ───────────────────────────────────────────────────────────────

describe('escaping', () => {
  it('normalizes double quotes to curly quotes', () => {
    expect(exportToRpy(doc(
      para('keltham', text('"Hello," he said.')),
    ), { smartQuotes: true })).toBe('keltham "\u201CHello,\u201D he said."')
  })

  it('leaves straight quotes as-is when smartQuotes is off (default)', () => {
    expect(exportToRpy(doc(
      para('keltham', text('"Hello," he said.')),
    ))).toBe('keltham "\\"Hello,\\" he said."')
  })

  it('escapes backslashes', () => {
    expect(exportToRpy(doc(
      para('carissa', text('path\\to\\file')),
    ))).toBe('carissa "path\\\\to\\\\file"')
  })

  it('escapes Renpy tag braces { and }', () => {
    expect(exportToRpy(doc(
      para('dnarrator', text('(cost: {5gp})')),
    ))).toBe('dnarrator "(cost: {{5gp}})"')
  })

  it('escapes % as %% for Python %-formatting', () => {
    expect(exportToRpy(doc(
      para('keltham', text('25% of the time')),
    ))).toBe('keltham "25%% of the time"')
    expect(exportToRpy(doc(
      para('keltham', text('100% sure')),
    ))).toBe('keltham "100%% sure"')
  })
})

// ── inline marks ───────────────────────────────────────────────────────────

describe('inline marks', () => {
  it('italic', () => {
    expect(exportToRpy(doc(
      para('carissa', text('She was '), text('very', italic), text(' sure.')),
    ))).toBe('carissa "She was {i}very{/i} sure."')
  })

  it('font override', () => {
    expect(exportToRpy(doc(
      para('carissa', text('She said '), text('"yes"', font()), text(' in Baseline.')),
    ), { smartQuotes: true })).toBe('carissa "She said {raleway}\u201Cyes\u201D{/raleway} in Baseline."')
  })

  it('custom font name', () => {
    expect(exportToRpy(doc(
      para('keltham', text('word', font('infernal'))),
    ))).toBe('keltham "{font=infernal}word{/font}"')
  })

  it('italic inside font override (both marks on same text)', () => {
    const result = exportToRpy(doc(
      para('carissa', text('word', font(), italic)),
    ))
    expect(result).toContain('{i}')
    expect(result).toContain('{/i}')
    expect(result).toContain('{raleway}')
    expect(result).toContain('{/raleway}')
    expect(result).toContain('word')
  })
})

// ── fix 1: no split font tags on italic overlap ────────────────────────────

describe('fix 1: font tag merging', () => {
  it('consecutive nodes with same font collapse into one span', () => {
    // Three adjacent nodes all with font=raleway; middle one also has italic.
    // Must produce a single {raleway}...{/raleway} span, not three separate spans.
    const result = exportToRpy(doc(
      para('carissa',
        text('"...You ', font()),
        text('died ', font(), italic),
        text('and woke up here?"', font()),
      ),
    ), { smartQuotes: true })
    // Should be exactly one open and one close font tag
    const opens = (result.match(/\{raleway\}/g) ?? []).length
    const closes = (result.match(/\{\/raleway\}/g) ?? []).length
    expect(opens).toBe(1)
    expect(closes).toBe(1)
    // Italic must be inside the font span
    expect(result).toContain('{raleway}')
    expect(result).toContain('{i}died{/i}')
    expect(result).toContain('{/raleway}')
    expect(result).toBe('carissa "{raleway}\u201C...You {i}died{/i} and woke up here?\u201D{/raleway}"')
  })

  it('font changes mid-line produce correct open/close pairs', () => {
    const result = exportToRpy(doc(
      para('carissa',
        text('normal '),
        text('raleway ', font('raleway')),
        text('normal again'),
      ),
    ))
    expect(result).toBe('carissa "normal {raleway}raleway{/raleway} normal again"')
  })
})

// ── fix 2: no trailing spaces inside inline tags ───────────────────────────

describe('fix 2: trailing space outside closing tag', () => {
  it('trailing space in italic node moves outside tag', () => {
    // "died " with italic → {i}died{/i} (space after, not before closing tag)
    expect(exportToRpy(doc(
      para('carissa', text('You '), text('died ', italic), text('here.')),
    ))).toBe('carissa "You {i}died{/i} here."')
  })

  it('no trailing space: no change', () => {
    expect(exportToRpy(doc(
      para('carissa', text('You '), text('died', italic), text(' here.')),
    ))).toBe('carissa "You {i}died{/i} here."')
  })
})

// ── fix 3: no trailing spaces at end of exported lines ────────────────────

describe('fix 3: lines have no trailing whitespace', () => {
  it('trailing space in last text node is stripped', () => {
    const result = exportToRpy(doc(
      para('carissa', text('Hello. ')),
    ))
    expect(result).toBe('carissa "Hello."')
    expect(result.endsWith(' "')).toBe(false)
  })

  it('trailing space after closing font tag is stripped', () => {
    const result = exportToRpy(doc(
      para('carissa', text('word', font()), text(' ')),
    ))
    // "word" in font, then a space-only text node with no font.
    // The space-only node has no font, so font closes, then " " is added, then trimEnd.
    expect(result).toBe('carissa "{raleway}word{/raleway}"')
  })
})

// ── fix 4: double space normalisation ─────────────────────────────────────

describe('fix 4: double space normalisation', () => {
  it('collapses double spaces anywhere', () => {
    expect(exportToRpy(doc(
      para('keltham', text('word.  Next sentence.')),
    ))).toBe('keltham "word. Next sentence."')
  })

  it('collapses three or more spaces', () => {
    expect(exportToRpy(doc(
      para('keltham', text('a   b')),
    ))).toBe('keltham "a b"')
  })
})

// ── spec example ───────────────────────────────────────────────────────────

describe('spec example', () => {
  it('matches the documented export format', () => {
    const input = doc(
      para('carissa',
        text('She casts Tongues. '),
        text('"Say that again?"', font()),
        text(' she says, in Baseline.'),
      ),
      para('keltham',
        text('"Keltham. Dath ilan. I died in a plane crash and woke up here. What\'s the correlation between the strange gesture you just did, and your ability to communicate with me when you could not do so previously?"'),
      ),
      para('dnarrator',
        text('(This sentence takes less than half as many syllables to say in Baseline as in Taldane.)'),
      ),
    )

    const result = exportToRpy(input, { smartQuotes: true })
    const lines = result.split('\n')

    expect(lines[0]).toBe('carissa "She casts Tongues. {raleway}\u201CSay that again?\u201D{/raleway} she says, in Baseline."')
    expect(lines[1]).toBe('keltham "\u201CKeltham. Dath ilan. I died in a plane crash and woke up here. What\u2019s the correlation between the strange gesture you just did, and your ability to communicate with me when you could not do so previously?\u201D"')
    expect(lines[2]).toBe('dnarrator "(This sentence takes less than half as many syllables to say in Baseline as in Taldane.)"')
  })
})

// ── session 2 spec input ───────────────────────────────────────────────────

describe('session 2 spec input', () => {
  it('line 1: font override on middle portion', () => {
    expect(exportToRpy(doc(
      para('carissa',
        text('She casts Tongues. '),
        text('"Say that again?"', font()),
        text(' she says, in Baseline.'),
      ),
    ), { smartQuotes: true })).toBe('carissa "She casts Tongues. {raleway}\u201CSay that again?\u201D{/raleway} she says, in Baseline."')
  })

  it('line 2: italic on single word, no font override, no trailing space', () => {
    const result = exportToRpy(doc(
      para('carissa',
        text('"- I cast Tongues, because it\'s a translation spell and you were speaking an unfamiliar language. You '),
        text('died', italic),
        text(' and woke up here? This isn\'t an afterlife."'),
      ),
    ), { smartQuotes: true })
    expect(result).toBe(
      'carissa "\u201C- I cast Tongues, because it\u2019s a translation spell and you were speaking an unfamiliar language. You {i}died{/i} and woke up here? This isn\u2019t an afterlife.\u201D"'
    )
    // No trailing space immediately before the final closing "
    expect(result).not.toMatch(/ "$/)  // line must not end with space+"
    // The italic tag has no trailing space inside
    expect(result).not.toContain('{i}died {/i}')
  })
})
