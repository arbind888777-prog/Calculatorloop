export type Lang = 'en' | 'hi';

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const fmt = (n: number) =>
  Number.isInteger(n) ? String(n) : n.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');

/**
 * Handles:
 * - Multiplication tables (2–30)
 * - Squares table (1–50)
 * - Cubes table (1–20)
 * - Square roots table (1–50)
 * - Cube roots table (1–30)
 * - Powers of 2, 3, etc.
 * - Individual square / cube / root queries
 */
export const tryBuildReferenceTableResponse = (
  message: string,
  lang: Lang,
): string | null => {
  const q = normalize(message);
  const hi = lang === 'hi';

  // ══════════════════════════════════════════
  // 1. MULTIPLICATION TABLE: "table of 13", "13 ka pahada", "13 ka table"
  // ══════════════════════════════════════════
  const tableMatch =
    q.match(/(?:table\s*(?:of|for)?\s*|pahad[ae]\s*(?:of|for)?\s*|ka\s*pahad[ae]\s*)(\d+)/) ||
    q.match(/(\d+)\s*(?:ka\s*(?:pahad[ae]|table)|table|times\s*table)/) ||
    q.match(/(?:multiplication\s*table)\s*(?:of|for)\s*(\d+)/);
  if (tableMatch) {
    const n = Number(tableMatch[1]);
    if (n >= 1 && n <= 200) {
      const rows = Array.from({ length: 10 }, (_, i) => {
        const m = i + 1;
        return `${n} × ${m} = **${n * m}**`;
      });
      return [
        `### 📋 ${hi ? `${n} का पहाड़ा` : `Multiplication Table of ${n}`}`,
        '',
        ...rows,
        '',
        hi
          ? `💡 **Trick:** ${n} × 11 = ${n * 11}, ${n} × 12 = ${n * 12}`
          : `💡 **Bonus:** ${n} × 11 = ${n * 11}, ${n} × 12 = ${n * 12}`,
      ].join('\n');
    }
  }

  // ══════════════════════════════════════════
  // 2. SQUARES TABLE: "squares 1 to 30", "varg table", "squares table"
  // ══════════════════════════════════════════
  const squaresTable =
    q.match(/(?:square|varg)\s*(?:table|list)\s*(?:1\s*(?:to|se)\s*(\d+))?/) ||
    q.match(/(?:square|varg)\s*(?:1\s*(?:to|se)\s*(\d+))/) ||
    q.match(/(\d+)\s*(?:tak|to)\s*(?:square|varg)\s*(?:table|list)?/);
  const isSquareTableKeyword =
    q.includes('square table') || q.includes('squares table') ||
    q.includes('varg table') || q.includes('varg list') ||
    q.includes('all squares') || q.includes('sab varg') || q.includes('sabhi varg');
  if (squaresTable || isSquareTableKeyword) {
    let limit = 30;
    if (squaresTable) {
      const parsed = Number(squaresTable[1]);
      if (parsed >= 1 && parsed <= 100) limit = parsed;
    }
    const rows: string[] = [];
    for (let i = 1; i <= limit; i++) {
      rows.push(`| ${i} | ${i * i} |`);
    }
    return [
      `### 📊 ${hi ? `1 से ${limit} तक वर्ग (Squares)` : `Squares from 1 to ${limit}`}`,
      '',
      `| ${hi ? 'संख्या' : 'Number'} | ${hi ? 'वर्ग (n²)' : 'Square (n²)'} |`,
      '|---|---|',
      ...rows,
      '',
      hi
        ? '💡 **Trick:** n² = (n-1)² + 2n - 1 (pichle varg mein 2n-1 jodo)'
        : '💡 **Trick:** n² = (n-1)² + 2n - 1 (add 2n-1 to previous square)',
    ].join('\n');
  }

  // ══════════════════════════════════════════
  // 3. CUBES TABLE: "cubes 1 to 20", "ghan table"
  // ══════════════════════════════════════════
  const cubesTable =
    q.match(/(?:cube|ghan)\s*(?:table|list)\s*(?:1\s*(?:to|se)\s*(\d+))?/) ||
    q.match(/(?:cube|ghan)\s*(?:1\s*(?:to|se)\s*(\d+))/) ||
    q.match(/(\d+)\s*(?:tak|to)\s*(?:cube|ghan)\s*(?:table|list)?/);
  const isCubeTableKeyword =
    q.includes('cube table') || q.includes('cubes table') ||
    q.includes('ghan table') || q.includes('ghan list') ||
    q.includes('all cubes') || q.includes('sab ghan') || q.includes('sabhi ghan');
  if (cubesTable || isCubeTableKeyword) {
    let limit = 20;
    if (cubesTable) {
      const parsed = Number(cubesTable[1]);
      if (parsed >= 1 && parsed <= 50) limit = parsed;
    }
    const rows: string[] = [];
    for (let i = 1; i <= limit; i++) {
      rows.push(`| ${i} | ${i * i * i} |`);
    }
    return [
      `### 📊 ${hi ? `1 से ${limit} तक घन (Cubes)` : `Cubes from 1 to ${limit}`}`,
      '',
      `| ${hi ? 'संख्या' : 'Number'} | ${hi ? 'घन (n³)' : 'Cube (n³)'} |`,
      '|---|---|',
      ...rows,
      '',
      hi
        ? '💡 **Yaad rakhein:** 1, 8, 27, 64, 125, 216, 343, 512, 729, 1000...'
        : '💡 **Remember:** 1, 8, 27, 64, 125, 216, 343, 512, 729, 1000...',
    ].join('\n');
  }

  // ══════════════════════════════════════════
  // 4. SQUARE ROOTS TABLE: "square root table", "vargmul table"
  // ══════════════════════════════════════════
  const sqrtTable =
    q.match(/(?:square\s*root|sqrt|vargmul|varg\s*mul)\s*(?:table|list)\s*(?:1\s*(?:to|se)\s*(\d+))?/) ||
    q.match(/(?:square\s*root|sqrt|vargmul)\s*(?:1\s*(?:to|se)\s*(\d+))/);
  const isSqrtTableKeyword =
    q.includes('square root table') || q.includes('sqrt table') ||
    q.includes('vargmul table') || q.includes('varg mul table') ||
    q.includes('all square root') || q.includes('sab vargmul');
  if (sqrtTable || isSqrtTableKeyword) {
    let limit = 30;
    if (sqrtTable) {
      const parsed = Number(sqrtTable[1]);
      if (parsed >= 1 && parsed <= 100) limit = parsed;
    }
    const rows: string[] = [];
    for (let i = 1; i <= limit; i++) {
      const root = Math.sqrt(i);
      const isExact = Number.isInteger(root);
      rows.push(`| ${i} | ${isExact ? root : root.toFixed(4)} |`);
    }
    return [
      `### 📊 ${hi ? `1 से ${limit} तक वर्गमूल (Square Roots)` : `Square Roots from 1 to ${limit}`}`,
      '',
      `| ${hi ? 'संख्या' : 'Number'} | ${hi ? 'वर्गमूल (√n)' : 'Square Root (√n)'} |`,
      '|---|---|',
      ...rows,
      '',
      hi
        ? '💡 **Perfect squares:** 1, 4, 9, 16, 25, 36, 49, 64, 81, 100'
        : '💡 **Perfect squares:** 1, 4, 9, 16, 25, 36, 49, 64, 81, 100',
    ].join('\n');
  }

  // ══════════════════════════════════════════
  // 5. CUBE ROOTS TABLE: "cube root table", "ghanmul table"
  // ══════════════════════════════════════════
  const cbrtTable =
    q.match(/(?:cube\s*root|cbrt|ghanmul|ghan\s*mul)\s*(?:table|list)\s*(?:1\s*(?:to|se)\s*(\d+))?/) ||
    q.match(/(?:cube\s*root|cbrt|ghanmul)\s*(?:1\s*(?:to|se)\s*(\d+))/);
  const isCbrtTableKeyword =
    q.includes('cube root table') || q.includes('cbrt table') ||
    q.includes('ghanmul table') || q.includes('ghan mul table') ||
    q.includes('all cube root');
  if (cbrtTable || isCbrtTableKeyword) {
    let limit = 20;
    if (cbrtTable) {
      const parsed = Number(cbrtTable[1]);
      if (parsed >= 1 && parsed <= 50) limit = parsed;
    }
    const rows: string[] = [];
    for (let i = 1; i <= limit; i++) {
      const root = Math.cbrt(i);
      const isExact = Number.isInteger(root);
      rows.push(`| ${i} | ${isExact ? root : root.toFixed(4)} |`);
    }
    return [
      `### 📊 ${hi ? `1 से ${limit} तक घनमूल (Cube Roots)` : `Cube Roots from 1 to ${limit}`}`,
      '',
      `| ${hi ? 'संख्या' : 'Number'} | ${hi ? 'घनमूल (∛n)' : 'Cube Root (∛n)'} |`,
      '|---|---|',
      ...rows,
      '',
      hi
        ? '💡 **Perfect cubes:** 1, 8, 27, 64, 125, 216, 343, 512, 729, 1000'
        : '💡 **Perfect cubes:** 1, 8, 27, 64, 125, 216, 343, 512, 729, 1000',
    ].join('\n');
  }

  // ══════════════════════════════════════════
  // 6. POWERS TABLE: "powers of 2", "2 ki ghat", "2^1 to 2^20"
  // ══════════════════════════════════════════
  const powersMatch =
    q.match(/(?:power|ghat|powers)\s*(?:of|ka|ki)\s*(\d+)/) ||
    q.match(/(\d+)\s*(?:ki\s*ghat|ke\s*power|ka\s*power)\s*(?:table|list)?/);
  if (powersMatch) {
    const base = Number(powersMatch[1]);
    if (base >= 2 && base <= 20) {
      const maxPow = base <= 3 ? 20 : base <= 5 ? 15 : 10;
      const rows: string[] = [];
      let val = 1;
      for (let i = 0; i <= maxPow; i++) {
        rows.push(`| ${base}^${i} | ${val.toLocaleString()} |`);
        val *= base;
      }
      return [
        `### 📊 ${hi ? `${base} की घात (Powers of ${base})` : `Powers of ${base}`}`,
        '',
        `| ${hi ? 'घात' : 'Power'} | ${hi ? 'मान' : 'Value'} |`,
        '|---|---|',
        ...rows,
        '',
        hi
          ? `💡 **Yaad rakhein:** Har baar ${base} se multiply karna hai!`
          : `💡 **Pattern:** Each row is previous × ${base}`,
      ].join('\n');
    }
  }

  // ══════════════════════════════════════════
  // 7. SINGLE SQUARE: "square of 25", "25 ka varg"
  // ══════════════════════════════════════════
  const singleSq =
    q.match(/(?:square|varg)\s*(?:of|ka)\s*(\d+)/) ||
    q.match(/(\d+)\s*(?:ka\s*varg|square)/) ||
    q.match(/(\d+)\s*(?:\^2|²)/);
  // Avoid matching if it's a table request or algebra identity
  if (singleSq && !q.includes('table') && !q.includes('list') && !q.includes('root') && !q.includes('identity') && !q.includes('a') && !q.includes('b')) {
    const n = Number(singleSq[1]);
    if (n >= 0 && n <= 100000) {
      const val = n * n;
      // Check if we can use an identity trick
      const base = Math.round(n / 10) * 10;
      const diff = n - base;
      let trick = '';
      if (Math.abs(diff) > 0 && Math.abs(diff) <= 9 && n > 10) {
        if (diff > 0) {
          trick = `💡 **Trick:** ${n}² = (${base}+${diff})² = ${base}² + 2×${base}×${diff} + ${diff}² = ${base * base} + ${2 * base * diff} + ${diff * diff} = ${val}`;
        } else {
          const d = Math.abs(diff);
          trick = `💡 **Trick:** ${n}² = (${base}−${d})² = ${base}² − 2×${base}×${d} + ${d}² = ${base * base} − ${2 * base * d} + ${d * d} = ${val}`;
        }
      }
      const lines = [
        `### 🧮 ${hi ? `${n} का वर्ग` : `Square of ${n}`}`,
        '',
        `**${hi ? 'सूत्र' : 'Formula'}:** n² = n × n`,
        '',
        `**${hi ? 'हल' : 'Solution'}:**`,
        `- ${n}² = ${n} × ${n} = **${val}**`,
        '',
        `**✅ ${hi ? 'उत्तर' : 'Answer'}: ${n}² = ${val}**`,
      ];
      if (trick) lines.push('', trick);
      return lines.join('\n');
    }
  }

  // ══════════════════════════════════════════
  // 8. SINGLE CUBE: "cube of 12", "12 ka ghan"
  // ══════════════════════════════════════════
  const singleCube =
    q.match(/(?:cube|ghan)\s*(?:of|ka)\s*(\d+)/) ||
    q.match(/(\d+)\s*(?:ka\s*ghan|cube)/) ||
    q.match(/(\d+)\s*(?:\^3|³)/);
  if (singleCube && !q.includes('table') && !q.includes('list') && !q.includes('root') && !q.includes('identity')) {
    const n = Number(singleCube[1]);
    if (n >= 0 && n <= 10000) {
      const val = n * n * n;
      return [
        `### 🧮 ${hi ? `${n} का घन` : `Cube of ${n}`}`,
        '',
        `**${hi ? 'सूत्र' : 'Formula'}:** n³ = n × n × n`,
        '',
        `**${hi ? 'हल' : 'Solution'}:**`,
        `- ${n}³ = ${n} × ${n} × ${n}`,
        `- = ${n * n} × ${n}`,
        `- = **${val}**`,
        '',
        `**✅ ${hi ? 'उत्तर' : 'Answer'}: ${n}³ = ${val}**`,
      ].join('\n');
    }
  }

  // ══════════════════════════════════════════
  // 9. SINGLE SQUARE ROOT: "square root of 144", "144 ka vargmul"
  // ══════════════════════════════════════════
  const singleSqrt =
    q.match(/(?:square\s*root|sqrt|vargmul|varg\s*mul)\s*(?:of|ka)\s*(\d+)/) ||
    q.match(/(\d+)\s*(?:ka\s*(?:vargmul|varg\s*mul)|square\s*root)/) ||
    q.match(/√(\d+)/);
  if (singleSqrt && !q.includes('table') && !q.includes('list')) {
    const n = Number(singleSqrt[1]);
    if (n >= 0 && n <= 1000000) {
      const root = Math.sqrt(n);
      const isExact = Math.abs(root - Math.round(root)) < 1e-10;
      const display = isExact ? String(Math.round(root)) : root.toFixed(4);
      return [
        `### 🧮 ${hi ? `${n} का वर्गमूल` : `Square Root of ${n}`}`,
        '',
        `**${hi ? 'सूत्र' : 'Formula'}:** √n`,
        '',
        `**${hi ? 'हल' : 'Solution'}:**`,
        `- √${n} = **${display}**`,
        isExact
          ? `- ${hi ? 'यह एक पूर्ण वर्ग है' : 'This is a perfect square'}: ${Math.round(root)}² = ${n}`
          : `- ${hi ? 'यह पूर्ण वर्ग नहीं है (approximate)' : 'Not a perfect square (approximate)'}`,
        '',
        `**✅ ${hi ? 'उत्तर' : 'Answer'}: √${n} = ${display}**`,
      ].join('\n');
    }
  }

  // ══════════════════════════════════════════
  // 10. SINGLE CUBE ROOT: "cube root of 125", "125 ka ghanmul"
  // ══════════════════════════════════════════
  const singleCbrt =
    q.match(/(?:cube\s*root|cbrt|ghanmul|ghan\s*mul)\s*(?:of|ka)\s*(\d+)/) ||
    q.match(/(\d+)\s*(?:ka\s*(?:ghanmul|ghan\s*mul)|cube\s*root)/) ||
    q.match(/∛(\d+)/);
  if (singleCbrt && !q.includes('table') && !q.includes('list')) {
    const n = Number(singleCbrt[1]);
    if (n >= 0 && n <= 1000000) {
      const root = Math.cbrt(n);
      const isExact = Math.abs(root - Math.round(root)) < 1e-10;
      const display = isExact ? String(Math.round(root)) : root.toFixed(4);
      return [
        `### 🧮 ${hi ? `${n} का घनमूल` : `Cube Root of ${n}`}`,
        '',
        `**${hi ? 'सूत्र' : 'Formula'}:** ∛n`,
        '',
        `**${hi ? 'हल' : 'Solution'}:**`,
        `- ∛${n} = **${display}**`,
        isExact
          ? `- ${hi ? 'यह एक पूर्ण घन है' : 'This is a perfect cube'}: ${Math.round(root)}³ = ${n}`
          : `- ${hi ? 'यह पूर्ण घन नहीं है (approximate)' : 'Not a perfect cube (approximate)'}`,
        '',
        `**✅ ${hi ? 'उत्तर' : 'Answer'}: ∛${n} = ${display}**`,
      ].join('\n');
    }
  }

  // ══════════════════════════════════════════
  // 11. POWER CALCULATION: "2^10", "3 to the power 5", "5 ki ghat 3"
  // ══════════════════════════════════════════
  const powerCalc =
    q.match(/(\d+)\s*\^\s*(\d+)/) ||
    q.match(/(\d+)\s*(?:to\s*the\s*power|power|ki\s*ghat|ghat)\s*(\d+)/) ||
    q.match(/(\d+)\s*(?:raised\s*to)\s*(\d+)/);
  if (powerCalc && !q.includes('table') && !q.includes('list')) {
    const base = Number(powerCalc[1]);
    const exp = Number(powerCalc[2]);
    if (base >= 0 && base <= 1000 && exp >= 0 && exp <= 30) {
      const val = Math.pow(base, exp);
      if (Number.isFinite(val)) {
        return [
          `### 🧮 ${hi ? `${base} की ${exp} घात` : `${base} to the power ${exp}`}`,
          '',
          `**${hi ? 'सूत्र' : 'Formula'}:** a^n = a × a × ... (n times)`,
          '',
          `**${hi ? 'हल' : 'Solution'}:**`,
          `- ${base}^${exp} = **${fmt(val)}**`,
          '',
          `**✅ ${hi ? 'उत्तर' : 'Answer'}: ${base}^${exp} = ${fmt(val)}**`,
        ].join('\n');
      }
    }
  }

  return null;
};
