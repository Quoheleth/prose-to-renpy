// Scan backwards from position i, skipping over Ren'Py markup tags {…} but
// stopping at the first real character (including whitespace).
// Returns '' if nothing precedes the position.
// Whitespace is intentionally NOT skipped: "said 'hello'" has whitespace
// before the opening quote, and that whitespace is what makes it opening.
function prevContextChar(str: string, i: number): string {
  let j = i - 1
  while (j >= 0) {
    if (str[j] === '}') {
      // Skip back over a complete {tag} or {/tag} sequence.
      while (j >= 0 && str[j] !== '{') j--
      j--  // step past the opening {
      continue
    }
    return str[j]
  }
  return ''
}

// A quote is opening when preceded by: start-of-string, whitespace, or an
// opening bracket/quote.  Everything else (word chars, punctuation, closing
// bracket/quote) is a closing context.
function isOpening(prev: string): boolean {
  return prev === '' || /[\s(\['"«\u201C\u2018]/.test(prev)
}

// Convert ASCII straight quotes in an assembled Ren'Py line to typographic
// curly quotes.  Intended to run AFTER escapeText and inline-mark processing
// so it has full paragraph context, and BEFORE the line is wrapped in the
// outer character "…" delimiter.
//
// Rules:
//   "  →  " (U+201C) when preceded by start / whitespace / opening punctuation
//      →  " (U+201D) otherwise
//   '  →  ' (U+2019) when it sits between two \w characters (apostrophe /
//              possessive — e.g. "don't", "bob's")
//      →  ' (U+2018) when preceded by start / whitespace / opening punctuation
//      →  ' (U+2019) otherwise (closing single quote)
export function normalizeQuotes(text: string): string {
  let result = text.replace(/"/g, (_, offset: number, str: string) => {
    return isOpening(prevContextChar(str, offset)) ? '\u201C' : '\u201D'
  })

  result = result.replace(/'/g, (_, offset: number, str: string) => {
    const prevChar = offset > 0 ? str[offset - 1] : ''
    const nextChar = offset < str.length - 1 ? str[offset + 1] : ''
    // Apostrophe / possessive: flanked by word characters on both sides.
    if (/\w/.test(prevChar) && /\w/.test(nextChar)) return '\u2019'
    return isOpening(prevContextChar(str, offset)) ? '\u2018' : '\u2019'
  })

  return result
}
