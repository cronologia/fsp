#!/usr/bin/env node
'use strict';
/**
 * extract-declarations.js — turn the official declaration PDFs (book chapters
 * 01-19, data/declarations/pdf/) into a plain-text corpus and mine each one for
 * its closing "place, date" line (issue #28 phase 2; feeds date/edition
 * verification for #3).
 *
 * Zero-dependency: PDF text is pulled with Node's built-in zlib (FlateDecode)
 * plus a small linear content-stream scanner for the text-showing operators
 * (Tj, ', ", TJ). These declarations are text-based Distiller/Word output with
 * WinAnsi encoding, so no font/CMap machinery is needed.
 *
 * Outputs (committed, so the corpus is diffable and searchable without the
 * binaries):
 *   data/declarations/text/NN-YEAR.txt   — full extracted body, one per PDF
 *   data/declarations/text/index.json    — per-declaration: chars, closing
 *                                           place/date line, parsed date.
 *
 * Usage:  node scripts/extract-declarations.js
 * Exit 0 always (best-effort corpus build); prints a summary.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const PDF_DIR = path.join(ROOT, 'data', 'declarations', 'pdf');
const OUT_DIR = path.join(ROOT, 'data', 'declarations', 'text');
const PDF_LIST = path.join(ROOT, 'data', 'declarations', 'official-pdfs.json');

// ---- PDF text extraction ---------------------------------------------------

/** Decode a PDF literal string body (between the parens) to text. */
function decodeLiteral(bytes) {
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    const c = bytes[i];
    if (c === 0x5c) { // backslash
      const n = bytes[++i];
      if (n === 0x6e) out += '\n';
      else if (n === 0x72) out += '\r';
      else if (n === 0x74) out += '\t';
      else if (n === 0x62 || n === 0x66) out += ' ';
      else if (n >= 0x30 && n <= 0x37) { // octal, up to 3 digits
        let oct = String.fromCharCode(n);
        for (let k = 0; k < 2 && bytes[i + 1] >= 0x30 && bytes[i + 1] <= 0x37; k++) oct += String.fromCharCode(bytes[++i]);
        out += String.fromCharCode(parseInt(oct, 8));
      } else if (n === undefined) break;
      else out += String.fromCharCode(n); // \( \) \\ and literal escapes
    } else {
      out += String.fromCharCode(c);
    }
  }
  return out;
}

/**
 * Linear scan of a decoded content stream. Collects literal strings shown by
 * Tj/'/" and the string pieces inside TJ arrays. Manual paren/bracket tracking
 * avoids the catastrophic backtracking a single mega-regex hits on big streams.
 */
function scanContent(buf) {
  const pieces = [];
  const n = buf.length;
  let i = 0;
  // Read a literal string starting at buf[i] === '(' ; returns [text, nextIndex].
  const readString = (start) => {
    let depth = 0;
    let j = start;
    const bytes = [];
    for (; j < n; j++) {
      const c = buf[j];
      if (c === 0x5c) { bytes.push(c, buf[j + 1]); j++; continue; }
      if (c === 0x28) { if (depth > 0) bytes.push(c); depth++; continue; }
      if (c === 0x29) { depth--; if (depth === 0) { j++; break; } bytes.push(c); continue; }
      bytes.push(c);
    }
    return [decodeLiteral(bytes), j];
  };
  while (i < n) {
    const c = buf[i];
    if (c === 0x28) { // '(' literal string → look ahead for Tj / ' / "
      const [text, next] = readString(i);
      // skip whitespace, then expect an operator token
      let k = next;
      while (k < n && (buf[k] === 0x20 || buf[k] === 0x0a || buf[k] === 0x0d || buf[k] === 0x09)) k++;
      const op = String.fromCharCode(buf[k] || 0) + String.fromCharCode(buf[k + 1] || 0);
      if (op.startsWith('Tj') || buf[k] === 0x27 || buf[k] === 0x22) pieces.push(text);
      i = next;
      continue;
    }
    if (c === 0x5b) { // '[' array → may be TJ; collect inner strings
      let j = i + 1;
      const parts = [];
      while (j < n && buf[j] !== 0x5d) {
        if (buf[j] === 0x28) { const [t, nx] = readString(j); parts.push(t); j = nx; }
        else j++;
      }
      // after ']' expect TJ
      let k = j + 1;
      while (k < n && (buf[k] === 0x20 || buf[k] === 0x0a || buf[k] === 0x0d || buf[k] === 0x09)) k++;
      if (buf[k] === 0x54 && buf[k + 1] === 0x4a) pieces.push(parts.join('')); // 'TJ'
      i = j + 1;
      continue;
    }
    i++;
  }
  return pieces.join('');
}

// CP1252-specific mappings for the 0x80-0x9F range (smart quotes, dashes,
// ellipsis) that differ from ISO-8859-1. Everything 0xA0-0xFF is identical to
// Unicode, so decodeLiteral's String.fromCharCode already handles it.
const CP1252 = {
  0x80: '€', 0x82: '‚', 0x83: 'ƒ', 0x84: '„', 0x85: '…', 0x86: '†', 0x87: '‡',
  0x88: 'ˆ', 0x89: '‰', 0x8a: 'Š', 0x8b: '‹', 0x8c: 'Œ', 0x8e: 'Ž', 0x91: '‘',
  0x92: '’', 0x93: '“', 0x94: '”', 0x95: '•', 0x96: '–', 0x97: '—', 0x98: '˜',
  0x99: '™', 0x9a: 'š', 0x9b: '›', 0x9c: 'œ', 0x9e: 'ž', 0x9f: 'Ÿ',
};

/** Remap CP1252 high-control bytes to Unicode; leaves other code points as-is. */
function fromCp1252(str) {
  let out = '';
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    out += c >= 0x80 && c <= 0x9f && CP1252[c] ? CP1252[c] : str[i];
  }
  return out;
}

/**
 * Resolve a stream's byte length from its dictionary.
 *
 * `/Length` is normally a literal, but Distiller writes it as an indirect
 * reference (`/Length 12 0 R`) when the length is not known until the stream is
 * written. Both forms appear across these nineteen files.
 */
function streamLength(s, dict, fromIndex) {
  const direct = /\/Length\s+(\d+)(?!\s+\d+\s+R)/.exec(dict);
  if (direct) return Number(direct[1]);
  const indirect = /\/Length\s+(\d+)\s+(\d+)\s+R/.exec(dict);
  if (!indirect) return -1;
  const obj = new RegExp(`(?:^|[^0-9])${indirect[1]}\\s+${indirect[2]}\\s+obj\\s+(\\d+)`, 'g');
  const hit = obj.exec(s) || obj.exec(s.slice(0, fromIndex));
  return hit ? Number(hit[1]) : -1;
}

/**
 * Undo per-glyph doubling.
 *
 * One of the nineteen (the 1998 Mexico City declaration) emits every glyph
 * twice — "DDEECCLLAARRAACCIIOONN" — while leaving the spaces single. The text
 * is complete and reads correctly to a human skimming it, which is why it
 * survived review; but "FARC" is stored as "FFAARRCC", so every search over
 * that document silently returns nothing. Doubling is decided per token and
 * only when EVERY pair in it matches, so ordinary repeated letters ("llegó",
 * "consecuencias") are untouched. Measured background rate in the other
 * eighteen files is 1.0-1.4%; this one is 100%.
 */
function undouble(text) {
  return text.replace(/\S+/g, (w) => {
    if (w.length < 4 || w.length % 2) return w;
    for (let i = 0; i < w.length; i += 2) if (w[i] !== w[i + 1]) return w;
    let out = '';
    for (let i = 0; i < w.length; i += 2) out += w[i];
    return out;
  });
}

// Stream kinds that are never page text: embedded font programs (Type1 has
// /Length1../Length3, CFF and TrueType announce a /Subtype), images, object and
// cross-reference streams, and XMP metadata. Scanning a font program yields
// glyph-table bytes that look like text to a byte scanner and end up appended
// to the declaration.
const NON_CONTENT = /\/(?:Length1|Subtype\s*\/(?:Type1C|CIDFontType0C|TrueType|Image|XML)|Type\s*\/(?:ObjStm|XRef|Metadata|Font|FontDescriptor))/;

/** Extract all text from a PDF buffer via inflated content streams.
 *
 * Stream extents come from the dictionary's `/Length`, NOT from searching for
 * the next `endstream`. That search is what an earlier version did, and it is
 * wrong for a reason that fails silently: `endstream` occurs by chance inside
 * FlateDecode output, so the first stream would end early, the scan would
 * resume inside compressed bytes, and it never re-synced to the next real
 * object. The result was page 1 of every document and nothing after it —
 * roughly 20% of the corpus, with each file ending mid-sentence and no error
 * anywhere. A negative drawn from that corpus is not a negative about the
 * declarations, which is how a published claim-check came to be wrong.
 */
function extractPdf(buf) {
  const s = buf.toString('latin1');
  let out = '';
  let streams = 0;
  // Iterate over OBJECT headers, not over the byte sequence "stream". Two
  // earlier shapes of this loop were wrong in ways that produced plausible
  // output: searching for the next `endstream` cut every document at page one
  // (those bytes occur inside FlateDecode output), and matching
  // `obj <<dict>> stream` with a lazy quantifier let the dict expand across
  // unrelated objects until it found a `>>` that happened to precede a stream,
  // so a page's content was filtered out as if it were a font.
  const objRe = /(\d+)\s+(\d+)\s+obj\b/g;
  let m;
  while ((m = objRe.exec(s))) {
    // The dictionary is whatever sits between this header and its own stream.
    // Bounded by the next object header so a non-stream object cannot reach
    // forward and claim the following object's stream.
    const nextObj = objRe.lastIndex;
    const sm = /stream\r?\n/.exec(s.slice(nextObj, nextObj + 4000));
    if (!sm) continue;
    const dict = s.slice(nextObj, nextObj + sm.index);
    if (/\bobj\b/.test(dict)) continue; // another object intervened: not ours
    const start = nextObj + sm.index + sm[0].length;
    const len = streamLength(s, dict, m.index);
    // With no usable /Length there is nothing trustworthy to slice, and
    // guessing is what broke this before. Skip and let the audit report it.
    if (len <= 0 || start + len > buf.length) continue;
    objRe.lastIndex = start + len;
    // Only page content streams carry real text. The "does it contain a T"
    // check that used to stand alone here is not a filter: embedded font
    // programs contain 'T' too, and scanning one appends glyph-table bytes to
    // the end of the declaration. Decide from the stream's own dictionary.
    if (NON_CONTENT.test(dict)) continue;
    let inf;
    try {
      inf = zlib.inflateSync(buf.slice(start, start + len));
    } catch {
      continue;
    }
    if (inf.indexOf(0x54) === -1) continue; // no 'T' at all
    out += scanContent(inf) + '\n';
    streams++;
  }
  // The string bytes are single-byte WinAnsi (CP1252); code points 0-255 map
  // to Unicode directly except the 0x80-0x9F block, which we remap.
  const text = fromCp1252(out);
  const fixed = undouble(text);
  return { text: fixed, streams, undoubled: fixed.length < text.length };
}

// ---- closing place/date line ----------------------------------------------

const MONTHS = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7,
  agosto: 8, septiembre: 9, setiembre: 9, octubre: 10, noviembre: 11, diciembre: 12,
  janeiro: 1, fevereiro: 2, março: 3, marco: 3, abril_pt: 4, maio: 5, junho: 6,
  julho: 7, agosto_pt: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
};

const ROMAN = { I: 1, V: 5, X: 10, L: 50 };
function romanToInt(r) {
  let n = 0;
  for (let i = 0; i < r.length; i++) {
    const cur = ROMAN[r[i]];
    const nxt = ROMAN[r[i + 1]];
    n += nxt > cur ? -cur : cur;
  }
  return n;
}

/**
 * Mine the declaration header (first ~500 chars) for the meeting's own record
 * of its date and official edition. These declarations open with a dateline
 * such as "Declaración de México · Del 12 al 15 de junio de 1991 · II
 * Encuentro…" — the primary-source truth for #3 (edition renumbering / date
 * verification). Returns { line, date, editionRoman, editionNum }.
 */
function headerMeta(text, expectYear) {
  const head = text.slice(0, 500);
  const out = { line: null, date: null, editionRoman: null, editionNum: null };
  const parseDate = (m) => {
    const month = MONTHS[m[3].toLowerCase()];
    if (!month) return null;
    const day = String(m[2] || m[1]).padStart(2, '0');
    return { iso: `${m[4]}-${String(month).padStart(2, '0')}-${day}`, line: m[0].replace(/\s+/g, ' ').trim() };
  };

  // Date range: "DD [al|y|a DD] de <month> de YYYY" — take the later day.
  const dm = /(\d{1,2})(?:\s*(?:y|al|a|-)\s*(\d{1,2}))?\s+de\s+([A-Za-zçãé]+)\s+de\s+(\d{4})/.exec(head);
  const hd = dm && parseDate(dm);
  if (hd) { out.date = hd.iso; out.line = hd.line; }

  // Fallback: no header date (e.g. sign-off is at the foot). Scan the whole
  // body for a date whose YEAR equals the declaration's — this rejects
  // off-year body mentions like "11 de septiembre de 2001" in a 2002 text.
  if (!out.date && expectYear) {
    const re = /(\d{1,2})(?:\s*(?:y|al|a|-)\s*(\d{1,2}))?\s+de\s+([A-Za-zçãé]+)\s+de\s+(\d{4})/gi;
    let m;
    while ((m = re.exec(text))) {
      if (Number(m[4]) !== expectYear) continue;
      const d = parseDate(m);
      if (d) { out.date = d.iso; out.line = d.line; break; }
    }
  }

  // Official edition: a Roman numeral adjacent to "Encuentro"/"encontro".
  const em = /\b([IVXL]{1,6})\s+(?:Encuentro|Encontro)\b/i.exec(head) ||
             /\b(?:Encuentro|Encontro)\b\s+([IVXL]{1,6})\b/i.exec(head);
  if (em) {
    out.editionRoman = em[1].toUpperCase();
    out.editionNum = romanToInt(out.editionRoman);
  }
  return out;
}

// ---- provenance README for the PDF folder ----------------------------------

/**
 * Write data/declarations/pdf/README.md — a provenance table mapping every
 * official declaration PDF to its edition, meeting and Wayback source. Keeps
 * the binary folder self-documenting.
 */
function writePdfReadme(list, index) {
  const rows = list.map((p) => {
    const file = `${p.officialNumber}-${p.year}.pdf`;
    const full = path.join(PDF_DIR, file);
    const size = fs.existsSync(full) ? `${(fs.statSync(full).size / 1024).toFixed(0)} KB` : '— _missing_';
    const meta = index[p.officialNumber] || {};
    const ed = meta.headerEditionRoman || (p.officialNumber === '01' ? 'I' : '?');
    const date = meta.headerDate || '';
    const city = (p.city || '').replace(/-/g, ' ');
    return `| \`${file}\` | ${ed} | ${p.year} | ${city} | ${date} | ${size} | [snapshot](${p.snapshot}) |`;
  });
  const body = `# Official declaration PDFs (1990–2013)

The Foro de São Paulo’s own final declarations, published as the numbered book
*Declaração Final dos Encontros do Foro de São Paulo* (Fundação Perseu Abramo,
2013) — chapters 01–19. The chapter number is the official edition number and
**skips Quito 2003** (XI = Antigua 2002 → XII = São Paulo 2005). Each file was
recovered from the Internet Archive; the plain text is in \`../text/\`.
**Generated by \`scripts/extract-declarations.js\` — do not hand-edit.**

Last run: ${new Date().toISOString()}

| File | Edition | Year | City | Date | Size | Source (Wayback) |
|------|---------|------|------|------|------|------------------|
${rows.join('\n')}
`;
  fs.writeFileSync(path.join(PDF_DIR, 'README.md'), body);
}

// ---- main ------------------------------------------------------------------

function main() {
  let list;
  try {
    list = JSON.parse(fs.readFileSync(PDF_LIST, 'utf8')).pdfs || [];
  } catch {
    console.error('official-pdfs.json unreadable; nothing to extract.');
    process.exit(0);
  }
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  const index = {};
  let ok = 0;
  let missing = 0;
  for (const p of list) {
    const pdf = path.join(PDF_DIR, `${p.officialNumber}-${p.year}.pdf`);
    if (!fs.existsSync(pdf)) { missing++; index[p.officialNumber] = { year: p.year, state: 'pdf-missing' }; continue; }
    let text;
    let streams = 0;
    let undoubled = false;
    try {
      const ex = extractPdf(fs.readFileSync(pdf));
      streams = ex.streams;
      undoubled = ex.undoubled;
      text = ex.text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim() + '\n';
    } catch (err) {
      index[p.officialNumber] = { year: p.year, state: 'extract-failed', error: err.message };
      continue;
    }
    const txtFile = path.join(OUT_DIR, `${p.officialNumber}-${p.year}.txt`);
    fs.writeFileSync(txtFile, text);
    const chars = text.replace(/\s+/g, ' ').trim().length;
    const h = headerMeta(text, p.year);
    // Cross-check: does the header's Roman-numeral edition match the official
    // chapter number? A mismatch is exactly the #3 renumbering signal.
    const editionMatch = h.editionNum === null ? null : h.editionNum === Number(p.officialNumber);
    index[p.officialNumber] = {
      year: p.year,
      city: p.city,
      chars,
      // Pages recovered. A document whose page count and stream count disagree
      // is the truncation signature this extractor once shipped silently.
      contentStreams: streams,
      // True when the PDF stored every glyph twice and the extractor undid it.
      glyphDoubling: undoubled,
      headerDate: h.date,
      headerDateLine: h.line,
      headerEditionRoman: h.editionRoman,
      headerEditionNum: h.editionNum,
      editionMatchesOfficialNumber: editionMatch,
    };
    const flag = editionMatch === false ? ' ⚠ edition≠chapter' : '';
    console.log(`  ✓ ${p.officialNumber}-${p.year} — ${chars} chars · ${streams} stream(s) · ${h.date || 'date?'} · ed ${h.editionRoman || '?'}${flag}`);
    ok++;
  }

  fs.writeFileSync(
    path.join(OUT_DIR, 'index.json'),
    JSON.stringify(
      {
        _meta: {
          generatedBy: 'scripts/extract-declarations.js',
          lastRun: new Date().toISOString(),
          note: 'Plain-text extraction of the official declaration PDFs (#28 phase 2). headerDate and headerEditionRoman are mined from each declaration\'s own opening dateline — the primary source for #3 (date/edition verification). editionMatchesOfficialNumber:false flags where the header\'s Roman numeral differs from the book chapter number. Do not hand-edit.',
        },
        declarations: index,
      },
      null,
      2
    ) + '\n'
  );
  if (fs.existsSync(PDF_DIR)) writePdfReadme(list, index);
  console.log(`Done. ${ok} extracted, ${missing} PDFs missing → data/declarations/text/ (+ pdf/README.md).`);
}

main();
