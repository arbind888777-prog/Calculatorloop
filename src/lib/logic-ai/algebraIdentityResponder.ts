export type Lang = 'en' | 'hi';

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(4).replace(/0+$/, '').replace(/\.$/, ''));

/** Extract named or positional numbers from text */
const extractNums = (s: string): { a: number; b: number; c: number } => {
  const namedA = s.match(/a\s*=\s*(-?\d+(?:\.\d+)?)/);
  const namedB = s.match(/b\s*=\s*(-?\d+(?:\.\d+)?)/);
  const namedC = s.match(/c\s*=\s*(-?\d+(?:\.\d+)?)/);
  if (namedA && namedB) {
    return {
      a: Number(namedA[1]),
      b: Number(namedB[1]),
      c: namedC ? Number(namedC[1]) : 0,
    };
  }
  const all = [...s.matchAll(/(?<!\w)(-?\d+(?:\.\d+)?)(?!\w)/g)].map((m) => Number(m[1]));
  return { a: all[0] ?? NaN, b: all[1] ?? NaN, c: all[2] ?? 0 };
};

const build = (title: string, formula: string, steps: string[], result: string, trick?: string) => {
  const lines = [
    `### 🧮 ${title}`,
    '',
    `**Formula:** ${formula}`,
    '',
    '**Steps:**',
    ...steps.map((s) => `- ${s}`),
    '',
    `**✅ Answer: ${result}**`,
  ];
  if (trick) {
    lines.push('', `💡 **Short Trick:** ${trick}`);
  }
  return lines.join('\n');
};

export const tryBuildAlgebraIdentityResponse = (message: string, lang: Lang): string | null => {
  const q = normalize(message);

  // ─── Detection: does the message relate to algebra identities? ───
  const identityKeywords =
    /identity|identit|samikaran|pahchan|algebra|expand|\(a\s*[+\-]\s*b\)|\(x\s*[+\-]\s*y\)|a\s*[²³]|b\s*[²³]|a\^[23]|b\^[23]|a\s*cube|b\s*cube|a\+b\+c|factori[sz]|varg|ghan|a\s*ka\s*varg|beejganit|sarvsamik/;

  // ═══════════════════════════════════════════════
  // 1. x + 1/x = k → find x² + 1/x² or x³ + 1/x³
  // ═══════════════════════════════════════════════
  const hasXPlusInvX =
    q.includes('x + 1/x') || q.includes('x+1/x') || q.includes('x + 1 / x');
  if (hasXPlusInvX) {
    const kMatch = q.match(/=\s*(-?\d+(?:\.\d+)?)/);
    const k = kMatch ? Number(kMatch[1]) : NaN;
    if (!Number.isFinite(k)) return null;

    const wantsCube =
      q.includes('x^3') || q.includes('x³') || q.includes('x3') || q.includes('cube') || q.includes('ghan');
    const wantsSquare =
      q.includes('x^2') || q.includes('x²') || q.includes('x2') || q.includes('square') || q.includes('varg');

    if (wantsCube) {
      const val = k * k * k - 3 * k;
      return build(
        'Algebra Identity – x³ + 1/x³',
        '(x + 1/x)³ = x³ + 1/x³ + 3(x + 1/x)',
        [
          `Given: x + 1/x = ${k}`,
          `(x + 1/x)³ = ${k}³ = ${fmt(k ** 3)}`,
          `x³ + 1/x³ = ${fmt(k ** 3)} − 3×${k} = ${fmt(k ** 3)} − ${fmt(3 * k)} = **${fmt(val)}**`,
        ],
        `x³ + 1/x³ = ${fmt(val)}`,
        lang === 'hi'
          ? `Cube ke liye: k³ − 3k jahan k = x + 1/x`
          : `For cube: k³ − 3k where k = x + 1/x`,
      );
    }
    if (wantsSquare || !wantsCube) {
      const val = k * k - 2;
      return build(
        'Algebra Identity – x² + 1/x²',
        '(x + 1/x)² = x² + 1/x² + 2',
        [
          `Given: x + 1/x = ${k}`,
          `(x + 1/x)² = ${k}² = ${fmt(k * k)}`,
          `x² + 1/x² = ${fmt(k * k)} − 2 = **${fmt(val)}**`,
        ],
        `x² + 1/x² = ${fmt(val)}`,
        lang === 'hi'
          ? `Square ke liye: k² − 2 jahan k = x + 1/x`
          : `For square: k² − 2 where k = x + 1/x`,
      );
    }
  }

  // x − 1/x = k
  const hasXMinusInvX =
    q.includes('x - 1/x') || q.includes('x-1/x') || q.includes('x − 1/x');
  if (hasXMinusInvX) {
    const kMatch = q.match(/=\s*(-?\d+(?:\.\d+)?)/);
    const k = kMatch ? Number(kMatch[1]) : NaN;
    if (!Number.isFinite(k)) return null;

    const wantsCube =
      q.includes('x^3') || q.includes('x³') || q.includes('cube') || q.includes('ghan');
    if (wantsCube) {
      const val = k ** 3 + 3 * k;
      return build(
        'Algebra Identity – x³ − 1/x³',
        '(x − 1/x)³ = x³ − 1/x³ − 3(x − 1/x)',
        [
          `Given: x − 1/x = ${k}`,
          `(x − 1/x)³ = ${k}³ = ${fmt(k ** 3)}`,
          `x³ − 1/x³ = ${fmt(k ** 3)} + 3×${k} = **${fmt(val)}**`,
        ],
        `x³ − 1/x³ = ${fmt(val)}`,
      );
    }
    const val = k * k + 2;
    return build(
      'Algebra Identity – x² + 1/x²',
      '(x − 1/x)² = x² + 1/x² − 2',
      [
        `Given: x − 1/x = ${k}`,
        `(x − 1/x)² = ${k}² = ${fmt(k * k)}`,
        `x² + 1/x² = ${fmt(k * k)} + 2 = **${fmt(val)}**`,
      ],
      `x² + 1/x² = ${fmt(val)}`,
    );
  }

  // ═══════════════════════════════════════════════
  // 2. (a + b)² = a² + 2ab + b²  —  EXPAND / COMPUTE
  // ═══════════════════════════════════════════════
  const aPlusBSq =
    q.match(/\(a\s*\+\s*b\)\s*(?:\^2|²|square|ka\s*varg)/) ||
    q.match(/a\s*\+\s*b\s*(?:whole|ka|)\s*(?:square|varg|\^2|²)/) ||
    (q.includes('(a+b)2') && !q.includes('(a+b)3'));
  if (aPlusBSq) {
    const { a, b } = extractNums(q);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      const val = (a + b) ** 2;
      return build(
        lang === 'hi' ? '(a + b)² – सर्वसमिका' : '(a + b)² Identity',
        '(a + b)² = a² + 2ab + b²',
        [
          `Given: a = ${a}, b = ${b}`,
          `a² = ${fmt(a * a)}`,
          `2ab = 2 × ${a} × ${b} = ${fmt(2 * a * b)}`,
          `b² = ${fmt(b * b)}`,
          `(a + b)² = ${fmt(a * a)} + ${fmt(2 * a * b)} + ${fmt(b * b)} = **${fmt(val)}**`,
        ],
        `(${a} + ${b})² = ${fmt(val)}`,
        `Direct: (${a}+${b})² = ${fmt(a + b)}² = ${fmt(val)}`,
      );
    }
    // No numbers — just show the identity
    return build(
      lang === 'hi' ? '(a + b)² – सर्वसमिका' : '(a + b)² Identity',
      '(a + b)² = a² + 2ab + b²',
      [
        lang === 'hi'
          ? 'Yeh sabse important identity hai — hamesha a², b² aur 2ab jodo'
          : 'This is the most fundamental identity — always add a², b², and 2ab',
      ],
      '(a + b)² = a² + 2ab + b²',
      lang === 'hi'
        ? 'Last digit shortcut: (a+b)² mein 2ab bhoolna nahi!'
        : 'Remember: Don\'t forget the 2ab middle term!',
    );
  }

  // ═══════════════════════════════════════════════
  // 3. (a − b)² = a² − 2ab + b²
  // ═══════════════════════════════════════════════
  const aMinusBSq =
    q.match(/\(a\s*[\-−]\s*b\)\s*(?:\^2|²|square|ka\s*varg)/) ||
    q.match(/a\s*[\-−]\s*b\s*(?:whole|ka|)\s*(?:square|varg|\^2|²)/);
  if (aMinusBSq) {
    const { a, b } = extractNums(q);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      const val = (a - b) ** 2;
      return build(
        lang === 'hi' ? '(a − b)² – सर्वसमिका' : '(a − b)² Identity',
        '(a − b)² = a² − 2ab + b²',
        [
          `Given: a = ${a}, b = ${b}`,
          `a² = ${fmt(a * a)}`,
          `2ab = 2 × ${a} × ${b} = ${fmt(2 * a * b)}`,
          `b² = ${fmt(b * b)}`,
          `(a − b)² = ${fmt(a * a)} − ${fmt(2 * a * b)} + ${fmt(b * b)} = **${fmt(val)}**`,
        ],
        `(${a} − ${b})² = ${fmt(val)}`,
      );
    }
    return build(
      lang === 'hi' ? '(a − b)² – सर्वसमिका' : '(a − b)² Identity',
      '(a − b)² = a² − 2ab + b²',
      [lang === 'hi' ? 'a² mein se 2ab ghatao, phir b² jodo' : 'Subtract 2ab from a², then add b²'],
      '(a − b)² = a² − 2ab + b²',
    );
  }

  // ═══════════════════════════════════════════════
  // 4. a² − b² = (a + b)(a − b)  —  Difference of squares
  // ═══════════════════════════════════════════════
  const diffOfSq =
    q.match(/a\s*[²\^2]\s*[\-−]\s*b\s*[²\^2]/) ||
    q.includes('a square - b square') ||
    q.includes('a² - b²') ||
    q.includes('a^2 - b^2') ||
    q.includes('a ka varg - b ka varg');
  if (diffOfSq) {
    const { a, b } = extractNums(q);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      const val = a * a - b * b;
      return build(
        lang === 'hi' ? 'a² − b² – सर्वसमिका' : 'a² − b² Identity',
        'a² − b² = (a + b)(a − b)',
        [
          `Given: a = ${a}, b = ${b}`,
          `a + b = ${fmt(a + b)}`,
          `a − b = ${fmt(a - b)}`,
          `a² − b² = ${fmt(a + b)} × ${fmt(a - b)} = **${fmt(val)}**`,
        ],
        `${a}² − ${b}² = ${fmt(val)}`,
        lang === 'hi'
          ? 'Yeh factoring mein sabse zyada use hoti hai!'
          : 'Most used factoring identity!',
      );
    }
    return build(
      lang === 'hi' ? 'a² − b² – सर्वसमिका' : 'a² − b² Identity',
      'a² − b² = (a + b)(a − b)',
      [lang === 'hi' ? 'Do vargon ka antar = yog × antar' : 'Difference of squares = sum × difference'],
      'a² − b² = (a + b)(a − b)',
    );
  }

  // ═══════════════════════════════════════════════
  // 5. (a + b)³ = a³ + 3a²b + 3ab² + b³
  // ═══════════════════════════════════════════════
  const aPlusBCube =
    q.match(/\(a\s*\+\s*b\)\s*(?:\^3|³|cube|ka\s*ghan)/) ||
    q.match(/a\s*\+\s*b\s*(?:whole|ka|)\s*(?:cube|ghan|\^3|³)/);
  if (aPlusBCube) {
    const { a, b } = extractNums(q);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      const val = (a + b) ** 3;
      return build(
        lang === 'hi' ? '(a + b)³ – सर्वसमिका' : '(a + b)³ Identity',
        '(a + b)³ = a³ + 3a²b + 3ab² + b³',
        [
          `Given: a = ${a}, b = ${b}`,
          `a³ = ${fmt(a ** 3)}`,
          `3a²b = 3 × ${fmt(a * a)} × ${b} = ${fmt(3 * a * a * b)}`,
          `3ab² = 3 × ${a} × ${fmt(b * b)} = ${fmt(3 * a * b * b)}`,
          `b³ = ${fmt(b ** 3)}`,
          `(a + b)³ = ${fmt(a ** 3)} + ${fmt(3 * a * a * b)} + ${fmt(3 * a * b * b)} + ${fmt(b ** 3)} = **${fmt(val)}**`,
        ],
        `(${a} + ${b})³ = ${fmt(val)}`,
        `Quick: a³ + b³ + 3ab(a + b) = ${fmt(a ** 3)} + ${fmt(b ** 3)} + 3×${a}×${b}×${fmt(a + b)} = ${fmt(val)}`,
      );
    }
    return build(
      lang === 'hi' ? '(a + b)³ – सर्वसमिका' : '(a + b)³ Identity',
      '(a + b)³ = a³ + 3a²b + 3ab² + b³ = a³ + b³ + 3ab(a + b)',
      [
        lang === 'hi'
          ? 'Short form: a³ + b³ + 3ab(a+b) yaad rakho'
          : 'Short form: a³ + b³ + 3ab(a+b)',
      ],
      '(a + b)³ = a³ + b³ + 3ab(a + b)',
    );
  }

  // ═══════════════════════════════════════════════
  // 6. (a − b)³ = a³ − 3a²b + 3ab² − b³
  // ═══════════════════════════════════════════════
  const aMinusBCube =
    q.match(/\(a\s*[\-−]\s*b\)\s*(?:\^3|³|cube|ka\s*ghan)/) ||
    q.match(/a\s*[\-−]\s*b\s*(?:whole|ka|)\s*(?:cube|ghan|\^3|³)/);
  if (aMinusBCube) {
    const { a, b } = extractNums(q);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      const val = (a - b) ** 3;
      return build(
        lang === 'hi' ? '(a − b)³ – सर्वसमिका' : '(a − b)³ Identity',
        '(a − b)³ = a³ − 3a²b + 3ab² − b³',
        [
          `Given: a = ${a}, b = ${b}`,
          `a³ = ${fmt(a ** 3)}`,
          `3a²b = ${fmt(3 * a * a * b)}`,
          `3ab² = ${fmt(3 * a * b * b)}`,
          `b³ = ${fmt(b ** 3)}`,
          `(a − b)³ = ${fmt(a ** 3)} − ${fmt(3 * a * a * b)} + ${fmt(3 * a * b * b)} − ${fmt(b ** 3)} = **${fmt(val)}**`,
        ],
        `(${a} − ${b})³ = ${fmt(val)}`,
      );
    }
    return build(
      lang === 'hi' ? '(a − b)³ – सर्वसमिका' : '(a − b)³ Identity',
      '(a − b)³ = a³ − 3a²b + 3ab² − b³ = a³ − b³ − 3ab(a − b)',
      [lang === 'hi' ? 'Short form: a³ − b³ − 3ab(a−b)' : 'Short form: a³ − b³ − 3ab(a − b)'],
      '(a − b)³ = a³ − b³ − 3ab(a − b)',
    );
  }

  // ═══════════════════════════════════════════════
  // 7. a³ + b³ = (a + b)(a² − ab + b²)
  // ═══════════════════════════════════════════════
  const sumOfCubes =
    q.match(/a\s*[³\^3]\s*\+\s*b\s*[³\^3]/) ||
    q.includes('a cube + b cube') ||
    q.includes('a³ + b³') ||
    q.includes('a^3 + b^3') ||
    q.includes('a ka ghan + b ka ghan');
  const hasABC = q.includes('a + b + c'); // avoid conflict with a³+b³+c³
  if (sumOfCubes && !hasABC) {
    const { a, b } = extractNums(q);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      const val = a ** 3 + b ** 3;
      return build(
        lang === 'hi' ? 'a³ + b³ – सर्वसमिका' : 'a³ + b³ – Sum of Cubes',
        'a³ + b³ = (a + b)(a² − ab + b²)',
        [
          `Given: a = ${a}, b = ${b}`,
          `a + b = ${fmt(a + b)}`,
          `a² − ab + b² = ${fmt(a * a)} − ${fmt(a * b)} + ${fmt(b * b)} = ${fmt(a * a - a * b + b * b)}`,
          `a³ + b³ = ${fmt(a + b)} × ${fmt(a * a - a * b + b * b)} = **${fmt(val)}**`,
        ],
        `${a}³ + ${b}³ = ${fmt(val)}`,
      );
    }
    return build(
      lang === 'hi' ? 'a³ + b³ – सर्वसमिका' : 'a³ + b³ Identity',
      'a³ + b³ = (a + b)(a² − ab + b²)',
      [lang === 'hi' ? 'Yog × (vargon ka yog − gunanfal)' : 'Sum × (sum of squares − product)'],
      'a³ + b³ = (a + b)(a² − ab + b²)',
    );
  }

  // ═══════════════════════════════════════════════
  // 8. a³ − b³ = (a − b)(a² + ab + b²)
  // ═══════════════════════════════════════════════
  const diffOfCubes =
    q.match(/a\s*[³\^3]\s*[\-−]\s*b\s*[³\^3]/) ||
    q.includes('a cube - b cube') ||
    q.includes('a³ - b³') ||
    q.includes('a^3 - b^3') ||
    q.includes('a³ − b³');
  if (diffOfCubes && !hasABC) {
    const { a, b } = extractNums(q);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      const val = a ** 3 - b ** 3;
      return build(
        lang === 'hi' ? 'a³ − b³ – सर्वसमिका' : 'a³ − b³ – Difference of Cubes',
        'a³ − b³ = (a − b)(a² + ab + b²)',
        [
          `Given: a = ${a}, b = ${b}`,
          `a − b = ${fmt(a - b)}`,
          `a² + ab + b² = ${fmt(a * a)} + ${fmt(a * b)} + ${fmt(b * b)} = ${fmt(a * a + a * b + b * b)}`,
          `a³ − b³ = ${fmt(a - b)} × ${fmt(a * a + a * b + b * b)} = **${fmt(val)}**`,
        ],
        `${a}³ − ${b}³ = ${fmt(val)}`,
      );
    }
    return build(
      lang === 'hi' ? 'a³ − b³ – सर्वसमिका' : 'a³ − b³ Identity',
      'a³ − b³ = (a − b)(a² + ab + b²)',
      [lang === 'hi' ? 'Antar × (vargon ka yog + gunanfal)' : 'Difference × (sum of squares + product)'],
      'a³ − b³ = (a − b)(a² + ab + b²)',
    );
  }

  // ═══════════════════════════════════════════════
  // 9. (a + b + c)² = a² + b² + c² + 2ab + 2bc + 2ca
  // ═══════════════════════════════════════════════
  const abcSq =
    q.match(/\(a\s*\+\s*b\s*\+\s*c\)\s*(?:\^2|²|square|ka\s*varg)/) ||
    q.match(/a\s*\+\s*b\s*\+\s*c\s*(?:whole|ka|)\s*(?:square|varg|\^2|²)/);
  if (abcSq) {
    const { a, b, c } = extractNums(q);
    if (Number.isFinite(a) && Number.isFinite(b) && Number.isFinite(c)) {
      const val = (a + b + c) ** 2;
      return build(
        lang === 'hi' ? '(a+b+c)² – सर्वसमिका' : '(a+b+c)² Identity',
        '(a+b+c)² = a² + b² + c² + 2ab + 2bc + 2ca',
        [
          `Given: a=${a}, b=${b}, c=${c}`,
          `a²=${fmt(a * a)}, b²=${fmt(b * b)}, c²=${fmt(c * c)}`,
          `2ab=${fmt(2 * a * b)}, 2bc=${fmt(2 * b * c)}, 2ca=${fmt(2 * c * a)}`,
          `Sum = ${fmt(a * a)} + ${fmt(b * b)} + ${fmt(c * c)} + ${fmt(2 * a * b)} + ${fmt(2 * b * c)} + ${fmt(2 * c * a)} = **${fmt(val)}**`,
        ],
        `(${a}+${b}+${c})² = ${fmt(val)}`,
      );
    }
    return build(
      lang === 'hi' ? '(a+b+c)² – सर्वसमिका' : '(a+b+c)² Identity',
      '(a+b+c)² = a² + b² + c² + 2(ab + bc + ca)',
      [
        lang === 'hi'
          ? 'Teenon ka varg + 2 × (har pair ka gunanfal)'
          : 'Sum of squares + 2 × (sum of products of pairs)',
      ],
      '(a+b+c)² = a² + b² + c² + 2(ab+bc+ca)',
    );
  }

  // ═══════════════════════════════════════════════
  // 10. a³+b³+c³ − 3abc = (a+b+c)(a²+b²+c²−ab−bc−ca)
  //     If a+b+c=0 → a³+b³+c³ = 3abc
  // ═══════════════════════════════════════════════
  const hasSumZero = q.includes('a + b + c = 0') || q.includes('a+b+c=0') || q.includes('a+b+c =0');
  const wantsCubeSum =
    q.includes('a^3') || q.includes('a³') || q.includes('a3') ||
    q.includes('b^3') || q.includes('c^3') || q.includes('a^3+b^3+c^3') ||
    q.includes('cube');
  if (hasSumZero && wantsCubeSum) {
    return build(
      lang === 'hi' ? 'a³+b³+c³ = 3abc (जब a+b+c=0)' : 'a³+b³+c³ = 3abc (when a+b+c=0)',
      'a³+b³+c³ − 3abc = (a+b+c)(a²+b²+c²−ab−bc−ca)',
      [
        lang === 'hi' ? 'Given: a + b + c = 0' : 'Given: a + b + c = 0',
        lang === 'hi'
          ? 'Kyunki (a+b+c)=0, RHS = 0'
          : 'Since (a+b+c)=0, RHS = 0',
        'a³+b³+c³ − 3abc = 0',
        '**a³+b³+c³ = 3abc**',
      ],
      'a³+b³+c³ = 3abc',
      lang === 'hi'
        ? 'Jab teen sankhyaon ka yog 0 ho, unke ghanon ka yog = 3 × gunanfal'
        : 'When sum of three numbers is 0, sum of cubes = 3 × product',
    );
  }

  // a³+b³+c³−3abc with values
  const cubeABC =
    q.includes('a^3+b^3+c^3') || q.includes('a³+b³+c³') ||
    (q.includes('a cube') && q.includes('b cube') && q.includes('c cube'));
  if (cubeABC) {
    const { a, b, c } = extractNums(q);
    if (Number.isFinite(a) && Number.isFinite(b) && Number.isFinite(c)) {
      const cubeSum = a ** 3 + b ** 3 + c ** 3;
      const abc3 = 3 * a * b * c;
      const diff = cubeSum - abc3;
      return build(
        'a³+b³+c³ − 3abc',
        'a³+b³+c³ − 3abc = (a+b+c)(a²+b²+c²−ab−bc−ca)',
        [
          `Given: a=${a}, b=${b}, c=${c}`,
          `a³+b³+c³ = ${fmt(a ** 3)} + ${fmt(b ** 3)} + ${fmt(c ** 3)} = ${fmt(cubeSum)}`,
          `3abc = 3 × ${a} × ${b} × ${c} = ${fmt(abc3)}`,
          `a³+b³+c³ − 3abc = ${fmt(cubeSum)} − ${fmt(abc3)} = **${fmt(diff)}**`,
        ],
        `a³+b³+c³−3abc = ${fmt(diff)}`,
      );
    }
  }

  // ═══════════════════════════════════════════════
  // 11. (a+b)² + (a−b)² = 2(a²+b²)
  // ═══════════════════════════════════════════════
  if (
    q.includes('(a+b)^2 + (a-b)^2') || q.includes('(a+b)² + (a-b)²') ||
    q.includes('(a+b)2 + (a-b)2') || q.includes('(a+b)square + (a-b)square')
  ) {
    const { a, b } = extractNums(q);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      const val = 2 * (a * a + b * b);
      return build(
        '(a+b)² + (a−b)² Identity',
        '(a+b)² + (a−b)² = 2(a² + b²)',
        [
          `Given: a=${a}, b=${b}`,
          `2(a²+b²) = 2(${fmt(a * a)}+${fmt(b * b)}) = 2×${fmt(a * a + b * b)} = **${fmt(val)}**`,
        ],
        `(${a}+${b})² + (${a}−${b})² = ${fmt(val)}`,
      );
    }
    return build('Identity', '(a+b)² + (a−b)² = 2(a² + b²)', ['Dono squares ka sum = double of individual squares sum'], '(a+b)² + (a−b)² = 2(a² + b²)');
  }

  // ═══════════════════════════════════════════════
  // 12. (a+b)² − (a−b)² = 4ab
  // ═══════════════════════════════════════════════
  if (
    q.includes('(a+b)^2 - (a-b)^2') || q.includes('(a+b)² - (a-b)²') ||
    q.includes('(a+b)² − (a−b)²')
  ) {
    const { a, b } = extractNums(q);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      const val = 4 * a * b;
      return build(
        '(a+b)² − (a−b)² Identity',
        '(a+b)² − (a−b)² = 4ab',
        [
          `Given: a=${a}, b=${b}`,
          `4ab = 4 × ${a} × ${b} = **${fmt(val)}**`,
        ],
        `(${a}+${b})² − (${a}−${b})² = ${fmt(val)}`,
      );
    }
    return build('Identity', '(a+b)² − (a−b)² = 4ab', ['Difference of these two squares = 4 times the product'], '(a+b)² − (a−b)² = 4ab');
  }

  // ═══════════════════════════════════════════════
  // 13. a² + b² = (a+b)² − 2ab = (a−b)² + 2ab
  // ═══════════════════════════════════════════════
  const aSqPlusBSq =
    (q.includes('a² + b²') || q.includes('a^2 + b^2') || q.includes('a square + b square') || q.includes('a ka varg + b ka varg')) &&
    !q.includes('−') && !q.includes('(a');
  if (aSqPlusBSq) {
    const { a, b } = extractNums(q);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      const val = a * a + b * b;
      return build(
        'a² + b² Identity',
        'a² + b² = (a+b)² − 2ab  OR  (a−b)² + 2ab',
        [
          `Given: a=${a}, b=${b}`,
          `a²+b² = ${fmt(a * a)}+${fmt(b * b)} = **${fmt(val)}**`,
          `Check: (a+b)²−2ab = ${fmt((a + b) ** 2)}−${fmt(2 * a * b)} = ${fmt(val)} ✓`,
        ],
        `a²+b² = ${fmt(val)}`,
      );
    }
    return build('a² + b² Identity', 'a² + b² = (a+b)² − 2ab = (a−b)² + 2ab', ['Two ways to express sum of squares'], 'a² + b² = (a+b)² − 2ab = (a−b)² + 2ab');
  }

  // ═══════════════════════════════════════════════
  // 14. x^2 + y^2 + z^2 = xy + yz + zx → x = y = z
  // ═══════════════════════════════════════════════
  const hasXYZCondition =
    q.includes('x^2 + y^2 + z^2 = xy + yz + zx') ||
    q.includes('x² + y² + z² = xy + yz + zx') ||
    q.includes('x2 + y2 + z2 = xy + yz + zx') ||
    q.includes('x^2+y^2+z^2=xy+yz+zx');
  if (hasXYZCondition) {
    return build(
      lang === 'hi' ? 'समता शर्त (Equality Condition)' : 'Equality Condition',
      'If x²+y²+z² = xy+yz+zx then x = y = z',
      [
        '(x−y)² + (y−z)² + (z−x)² = 2(x²+y²+z² − xy − yz − zx)',
        lang === 'hi' ? 'Given se bracket = 0' : 'From the given condition, the bracket = 0',
        lang === 'hi'
          ? 'Sum of squares = 0 tabhi possible jab har term = 0'
          : 'Sum of squares = 0 only when each term = 0',
        '**x−y=0, y−z=0 ⟹ x = y = z**',
      ],
      'x = y = z',
    );
  }

  // ═══════════════════════════════════════════════
  // 15. Exponent Identities (aⁿ × aᵐ, etc.)
  // ═══════════════════════════════════════════════
  const exponentQ =
    q.includes('exponent') || q.includes('ghatak') || q.includes('power rule') ||
    q.includes('ghaatank') || q.includes('indices') || q.includes('surds') ||
    q.match(/a\s*\^\s*[mn]\s*[×\*]\s*a\s*\^\s*[mn]/) ||
    q.match(/a\s*\^\s*n\s*[\/÷]\s*a\s*\^\s*m/);
  if (exponentQ) {
    return build(
      lang === 'hi' ? 'घातांक के नियम (Exponent Rules)' : 'Exponent / Index Rules',
      'aⁿ × aᵐ = aⁿ⁺ᵐ',
      [
        '**aⁿ × aᵐ = aⁿ⁺ᵐ** (same base, add powers)',
        '**aⁿ ÷ aᵐ = aⁿ⁻ᵐ** (same base, subtract powers)',
        '**(aⁿ)ᵐ = aⁿᵐ** (power of a power)',
        '**(ab)ⁿ = aⁿ × bⁿ** (product rule)',
        '**(a/b)ⁿ = aⁿ/bⁿ** (quotient rule)',
        '**a⁰ = 1** (zero exponent)',
        '**a⁻ⁿ = 1/aⁿ** (negative exponent)',
        '**a^(1/n) = ⁿ√a** (fractional exponent = root)',
        '**a^(m/n) = (ⁿ√a)ᵐ** (fractional power)',
      ],
      lang === 'hi'
        ? 'Upar sab niyam diye gaye hain — values dein to solve karenge!'
        : 'All rules listed above — provide values to solve!',
    );
  }

  // ═══════════════════════════════════════════════
  // 16. (a+b)(a−b) = a²−b²  (reverse look-up)
  // ═══════════════════════════════════════════════
  if (
    q.match(/\(a\s*\+\s*b\)\s*\(a\s*[\-−]\s*b\)/) ||
    q.match(/\(a\s*\+\s*b\)\s*\*\s*\(a\s*[\-−]\s*b\)/)
  ) {
    const { a, b } = extractNums(q);
    if (Number.isFinite(a) && Number.isFinite(b)) {
      const val = a * a - b * b;
      return build(
        '(a+b)(a−b) Identity',
        '(a+b)(a−b) = a² − b²',
        [
          `Given: a=${a}, b=${b}`,
          `a²−b² = ${fmt(a * a)}−${fmt(b * b)} = **${fmt(val)}**`,
        ],
        `(${a}+${b})(${a}−${b}) = ${fmt(val)}`,
      );
    }
    return build('Identity', '(a+b)(a−b) = a² − b²', ['Product of sum and difference = difference of squares'], '(a+b)(a−b) = a² − b²');
  }

  // ═══════════════════════════════════════════════
  // 17. ab = [(a+b)² − (a−b)²] / 4
  // ═══════════════════════════════════════════════
  if (q.includes('ab =') && (q.includes('(a+b)') || q.includes('gunanfal'))) {
    return build(
      'ab from sum & difference',
      'ab = [(a+b)² − (a−b)²] / 4',
      ['This derives from expanding (a+b)² and (a−b)² and subtracting'],
      'ab = [(a+b)² − (a−b)²] / 4',
    );
  }

  // ═══════════════════════════════════════════════
  // 18. (a²+b²) from known (a+b) and ab
  // ═══════════════════════════════════════════════
  if (
    (q.includes('a+b') || q.includes('a + b')) &&
    q.includes('ab') &&
    (q.includes('a^2+b^2') || q.includes('a²+b²') || q.includes('a square + b square'))
  ) {
    const aPlusBMatch = q.match(/a\s*\+\s*b\s*=\s*(-?\d+(?:\.\d+)?)/);
    const abMatch = q.match(/ab\s*=\s*(-?\d+(?:\.\d+)?)/);
    if (aPlusBMatch && abMatch) {
      const s = Number(aPlusBMatch[1]);
      const p = Number(abMatch[1]);
      const val = s * s - 2 * p;
      return build(
        lang === 'hi' ? 'a²+b² nikaalein' : 'Find a²+b²',
        'a²+b² = (a+b)² − 2ab',
        [
          `Given: a+b = ${s}, ab = ${p}`,
          `(a+b)² = ${fmt(s * s)}`,
          `a²+b² = ${fmt(s * s)} − 2×${p} = ${fmt(s * s)} − ${fmt(2 * p)} = **${fmt(val)}**`,
        ],
        `a²+b² = ${fmt(val)}`,
      );
    }
  }

  // ═══════════════════════════════════════════════
  // 19. (a−b) from (a+b) and ab → (a−b)² = (a+b)² − 4ab
  // ═══════════════════════════════════════════════
  if (
    (q.includes('a+b') || q.includes('a + b')) &&
    q.includes('ab') &&
    (q.includes('a-b') || q.includes('a − b') || q.includes('a−b'))
  ) {
    const aPlusBMatch = q.match(/a\s*\+\s*b\s*=\s*(-?\d+(?:\.\d+)?)/);
    const abMatch = q.match(/ab\s*=\s*(-?\d+(?:\.\d+)?)/);
    if (aPlusBMatch && abMatch) {
      const s = Number(aPlusBMatch[1]);
      const p = Number(abMatch[1]);
      const val = s * s - 4 * p;
      const aMinusB = val >= 0 ? Math.sqrt(val) : NaN;
      return build(
        lang === 'hi' ? '(a−b) nikaalein' : 'Find (a−b)',
        '(a−b)² = (a+b)² − 4ab',
        [
          `Given: a+b = ${s}, ab = ${p}`,
          `(a−b)² = ${fmt(s * s)} − 4×${p} = ${fmt(s * s)} − ${fmt(4 * p)} = ${fmt(val)}`,
          Number.isFinite(aMinusB) ? `a−b = √${fmt(val)} = **${fmt(aMinusB)}**` : `(a−b)² = ${fmt(val)} (negative, so a−b is imaginary)`,
        ],
        Number.isFinite(aMinusB) ? `a−b = ${fmt(aMinusB)}` : `(a−b)² = ${fmt(val)}`,
      );
    }
  }

  // ═══════════════════════════════════════════════
  // 20. Quick-expand: numeric (x+y)², (x−y)², (x+y)³, (x−y)³
  // ═══════════════════════════════════════════════
  const numSqMatch = q.match(/\((\d+)\s*\+\s*(\d+)\)\s*(?:\^2|²|square)/);
  if (numSqMatch) {
    const x = Number(numSqMatch[1]);
    const y = Number(numSqMatch[2]);
    const val = (x + y) ** 2;
    return build(
      `(${x}+${y})²`,
      '(a+b)² = a² + 2ab + b²',
      [
        `a=${x}, b=${y}`,
        `a² = ${fmt(x * x)}, 2ab = ${fmt(2 * x * y)}, b² = ${fmt(y * y)}`,
        `(${x}+${y})² = ${fmt(x * x)} + ${fmt(2 * x * y)} + ${fmt(y * y)} = **${fmt(val)}**`,
      ],
      `(${x}+${y})² = ${fmt(val)}`,
      `Quick check: ${x}+${y} = ${x + y}, ${x + y}² = ${fmt(val)} ✓`,
    );
  }
  const numMinSqMatch = q.match(/\((\d+)\s*[\-−]\s*(\d+)\)\s*(?:\^2|²|square)/);
  if (numMinSqMatch) {
    const x = Number(numMinSqMatch[1]);
    const y = Number(numMinSqMatch[2]);
    const val = (x - y) ** 2;
    return build(
      `(${x}−${y})²`,
      '(a−b)² = a² − 2ab + b²',
      [
        `a=${x}, b=${y}`,
        `a² = ${fmt(x * x)}, 2ab = ${fmt(2 * x * y)}, b² = ${fmt(y * y)}`,
        `(${x}−${y})² = ${fmt(x * x)} − ${fmt(2 * x * y)} + ${fmt(y * y)} = **${fmt(val)}**`,
      ],
      `(${x}−${y})² = ${fmt(val)}`,
    );
  }
  const numCubeMatch = q.match(/\((\d+)\s*\+\s*(\d+)\)\s*(?:\^3|³|cube)/);
  if (numCubeMatch) {
    const x = Number(numCubeMatch[1]);
    const y = Number(numCubeMatch[2]);
    const val = (x + y) ** 3;
    return build(
      `(${x}+${y})³`,
      '(a+b)³ = a³ + 3a²b + 3ab² + b³',
      [
        `a=${x}, b=${y}`,
        `a³=${fmt(x ** 3)}, 3a²b=${fmt(3 * x * x * y)}, 3ab²=${fmt(3 * x * y * y)}, b³=${fmt(y ** 3)}`,
        `(${x}+${y})³ = ${fmt(x ** 3)} + ${fmt(3 * x * x * y)} + ${fmt(3 * x * y * y)} + ${fmt(y ** 3)} = **${fmt(val)}**`,
      ],
      `(${x}+${y})³ = ${fmt(val)}`,
    );
  }
  const numMinCubeMatch = q.match(/\((\d+)\s*[\-−]\s*(\d+)\)\s*(?:\^3|³|cube)/);
  if (numMinCubeMatch) {
    const x = Number(numMinCubeMatch[1]);
    const y = Number(numMinCubeMatch[2]);
    const val = (x - y) ** 3;
    return build(
      `(${x}−${y})³`,
      '(a−b)³ = a³ − 3a²b + 3ab² − b³',
      [
        `a=${x}, b=${y}`,
        `a³=${fmt(x ** 3)}, 3a²b=${fmt(3 * x * x * y)}, 3ab²=${fmt(3 * x * y * y)}, b³=${fmt(y ** 3)}`,
        `(${x}−${y})³ = ${fmt(x ** 3)} − ${fmt(3 * x * x * y)} + ${fmt(3 * x * y * y)} − ${fmt(y ** 3)} = **${fmt(val)}**`,
      ],
      `(${x}−${y})³ = ${fmt(val)}`,
    );
  }

  // ═══════════════════════════════════════════════
  // 21. Factorization of specific squares: 99² = (100−1)², 105² = (100+5)², etc.
  // ═══════════════════════════════════════════════
  const factorSqMatch = q.match(/(\d+)\s*(?:\^2|²|square|ka\s*varg)/);
  if (factorSqMatch && (q.includes('identity') || q.includes('sarvasamika') || q.includes('pahchan') || q.includes('expand') || q.includes('trick') || q.includes('shortcut'))) {
    const n = Number(factorSqMatch[1]);
    if (n > 10 && n < 10000) {
      // Find nearest round number
      const base = Math.round(n / 10) * 10;
      const diff = n - base;
      if (diff !== 0 && Math.abs(diff) <= 9) {
        const sign = diff > 0 ? '+' : '−';
        const d = Math.abs(diff);
        const val = n * n;
        return build(
          lang === 'hi' ? `${n}² – Trick se solve` : `${n}² using Identity`,
          diff > 0 ? `(a+b)² = a² + 2ab + b²` : `(a−b)² = a² − 2ab + b²`,
          [
            `${n} = ${base} ${sign} ${d}`,
            diff > 0
              ? `(${base}+${d})² = ${base}² + 2×${base}×${d} + ${d}² = ${base * base} + ${2 * base * d} + ${d * d} = **${val}**`
              : `(${base}−${d})² = ${base}² − 2×${base}×${d} + ${d}² = ${base * base} − ${2 * base * d} + ${d * d} = **${val}**`,
          ],
          `${n}² = ${fmt(val)}`,
          lang === 'hi'
            ? `Round number ke paas le jao, phir identity lagao!`
            : `Move to nearest round number, then apply identity!`,
        );
      }
    }
  }

  // ═══════════════════════════════════════════════
  // 22. List all algebra identities
  // ═══════════════════════════════════════════════
  if (
    q.includes('all identity') || q.includes('all identities') || q.includes('sab identity') ||
    q.includes('sari identity') || q.includes('sabhi sarvasamika') || q.includes('list identity') ||
    q.includes('algebra formula') || q.includes('beejganit sutra') || q.includes('algebra ke sutra') ||
    (q.includes('identity') && q.includes('list'))
  ) {
    const hi = lang === 'hi';
    return [
      hi ? '### 🧮 बीजगणित की सभी सर्वसमिकाएँ (All Algebra Identities)' : '### 🧮 All Algebra Identities',
      '',
      '**Square Identities (वर्ग):**',
      '1. (a + b)² = a² + 2ab + b²',
      '2. (a − b)² = a² − 2ab + b²',
      '3. a² − b² = (a + b)(a − b)',
      '4. a² + b² = (a+b)² − 2ab = (a−b)² + 2ab',
      '5. (a + b)² + (a − b)² = 2(a² + b²)',
      '6. (a + b)² − (a − b)² = 4ab',
      '7. ab = [(a+b)² − (a−b)²] / 4',
      '8. (a + b + c)² = a² + b² + c² + 2(ab + bc + ca)',
      '',
      '**Cube Identities (घन):**',
      '9. (a + b)³ = a³ + 3a²b + 3ab² + b³ = a³ + b³ + 3ab(a+b)',
      '10. (a − b)³ = a³ − 3a²b + 3ab² − b³ = a³ − b³ − 3ab(a−b)',
      '11. a³ + b³ = (a + b)(a² − ab + b²)',
      '12. a³ − b³ = (a − b)(a² + ab + b²)',
      '13. a³ + b³ + c³ − 3abc = (a+b+c)(a²+b²+c²−ab−bc−ca)',
      '14. If a+b+c = 0 → a³+b³+c³ = 3abc',
      '',
      '**Exponent Rules (घातांक नियम):**',
      '15. aⁿ × aᵐ = aⁿ⁺ᵐ',
      '16. aⁿ ÷ aᵐ = aⁿ⁻ᵐ',
      '17. (aⁿ)ᵐ = aⁿᵐ',
      '18. (ab)ⁿ = aⁿbⁿ',
      '19. (a/b)ⁿ = aⁿ/bⁿ',
      '20. a⁰ = 1',
      '21. a⁻ⁿ = 1/aⁿ',
      '22. a^(1/n) = ⁿ√a',
      '',
      '**Special:**',
      '23. (x + 1/x)² = x² + 1/x² + 2',
      '24. (x − 1/x)² = x² + 1/x² − 2',
      '25. (x + 1/x)³ = x³ + 1/x³ + 3(x + 1/x)',
      '',
      hi
        ? "**Koi bhi identity ke baare mein puchein — values dein, step-by-step solve karenge!** 🎯"
        : "**Ask about any identity — provide values and I'll solve step-by-step!** 🎯",
    ].join('\n');
  }

  // ═══════════════════════════════════════════════
  // FALLBACK: Generic algebra identity trigger (if keyword matches but no specific case)
  // ═══════════════════════════════════════════════
  if (!identityKeywords.test(q)) return null;

  // If we reach here, it's an algebra-related query but didn't match specific patterns
  return null;
};
