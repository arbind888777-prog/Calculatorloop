/**
 * hindiMathSolver.ts
 * 
 * A comprehensive LOCAL math solver with Hindi/Hinglish/English support.
 * Handles: Numbers, HCF/LCM, Ratio, Average, Percentage, Profit/Loss,
 * Simple Interest, Compound Interest, and general arithmetic.
 * 
 * NO external API calls. Everything runs locally.
 */

export type Lang = 'en' | 'hi';

// ─── Number extraction helpers ───────────────────────────────────

const extractAllNumbers = (text: string): number[] => {
  const matches = text.match(/-?\d+(?:\.\d+)?/g);
  return matches ? matches.map(Number).filter(n => Number.isFinite(n)) : [];
};

const extractN = (text: string): number | null => {
  // Try to find n from patterns like "1 se 100", "first 50", "pehle 20", "n=25", "1 to 200"
  const patterns = [
    /1\s*(?:se|to|tak)\s*(\d+)/i,
    /(?:first|pehle|pratham)\s+(\d+)/i,
    /(?:lagatar|consecutive)\s+(\d+)/i,
    /n\s*=\s*(\d+)/i,
    /(\d+)\s*(?:tak|numbers?|sankhya)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m?.[1]) return parseInt(m[1]);
  }
  const nums = extractAllNumbers(text);
  if (nums.length === 1 && nums[0] > 0) return nums[0];
  if (nums.length === 2 && nums[0] === 1) return nums[1];
  return null;
};

const fmt = (n: number): string => {
  if (!Number.isFinite(n)) return String(n);
  if (Number.isInteger(n)) return n.toLocaleString('en-IN');
  return n.toLocaleString('en-IN', { maximumFractionDigits: 4 });
};

// ─── GCD / LCM helpers ───────────────────────────────────────────

const gcd = (a: number, b: number): number => {
  a = Math.abs(a); b = Math.abs(b);
  while (b) { [a, b] = [b, a % b]; }
  return a;
};

const lcm = (a: number, b: number): number => (a / gcd(a, b)) * b;

// ─── Topic detection helpers ─────────────────────────────────────

const lower = (s: string) => s.toLowerCase();

const has = (text: string, ...words: string[]) => {
  const t = lower(text);
  return words.some(w => t.includes(w));
};

const hasWord = (text: string, ...words: string[]) => {
  const t = ` ${lower(text)} `;
  return words.some(w => t.includes(` ${w} `) || t.startsWith(`${w} `) || t.endsWith(` ${w}`));
};

// ─── MAIN solver function ─────────────────────────────────────────

export const tryBuildHindiMathResponse = (message: string, lang: Lang): string | null => {
  const q = lower(message);
  const nums = extractAllNumbers(message);

  // ═══════════════════════════════════════════════════════════════
  // 1. SUM OF NATURAL NUMBERS (1 se n tak ka yog)
  // ═══════════════════════════════════════════════════════════════
  if (has(q, 'yog', 'sum') && (has(q, 'prakrit', 'natural', 'sankhya', 'number', 'consecutive', 'lagatar', '1 se', '1 to') || has(q, 'tak'))
      && !has(q, 'varg', 'square', 'ghan', 'cube', 'sam', 'even', 'vishm', 'visham', 'odd')) {
    const n = extractN(q);
    if (n && n > 0) {
      const result = (n * (n + 1)) / 2;
      return buildStepByStep(lang, {
        title: lang === 'hi' ? `1 से ${n} तक प्राकृत संख्याओं का योग` : `Sum of Natural Numbers (1 to ${n})`,
        formula: 'n(n+1)/2',
        steps: [
          lang === 'hi' ? `n = ${n} रखते हैं` : `Put n = ${n}`,
          `= ${n} × (${n} + 1) / 2`,
          `= ${n} × ${n + 1} / 2`,
          `= ${fmt(n * (n + 1))} / 2`,
          `= **${fmt(result)}**`,
        ],
        answer: fmt(result),
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. SUM OF SQUARES
  // ═══════════════════════════════════════════════════════════════
  if ((has(q, 'varg', 'square') && has(q, 'yog', 'sum')) || has(q, 'sum of squares')) {
    const n = extractN(q);
    if (n && n > 0) {
      const result = (n * (n + 1) * (2 * n + 1)) / 6;
      return buildStepByStep(lang, {
        title: lang === 'hi' ? `1 से ${n} तक वर्गों का योग` : `Sum of Squares (1² to ${n}²)`,
        formula: 'n(n+1)(2n+1)/6',
        steps: [
          lang === 'hi' ? `n = ${n} रखते हैं` : `Put n = ${n}`,
          `= ${n} × ${n + 1} × ${2 * n + 1} / 6`,
          `= ${fmt(n * (n + 1) * (2 * n + 1))} / 6`,
          `= **${fmt(result)}**`,
        ],
        answer: fmt(result),
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. SUM OF CUBES
  // ═══════════════════════════════════════════════════════════════
  if ((has(q, 'ghan', 'cube') && has(q, 'yog', 'sum')) || has(q, 'sum of cubes')) {
    const n = extractN(q);
    if (n && n > 0) {
      const s = (n * (n + 1)) / 2;
      const result = s * s;
      return buildStepByStep(lang, {
        title: lang === 'hi' ? `1 से ${n} तक घनों का योग` : `Sum of Cubes (1³ to ${n}³)`,
        formula: '[n(n+1)/2]²',
        steps: [
          lang === 'hi' ? `n = ${n} रखते हैं` : `Put n = ${n}`,
          `= [${n} × ${n + 1} / 2]²`,
          `= [${fmt(s)}]²`,
          `= **${fmt(result)}**`,
        ],
        answer: fmt(result),
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. SUM OF EVEN NUMBERS
  // ═══════════════════════════════════════════════════════════════
  if (has(q, 'sam', 'even') && has(q, 'yog', 'sum')) {
    const n = extractN(q);
    if (n && n > 0) {
      const result = n * (n + 1);
      return buildStepByStep(lang, {
        title: lang === 'hi' ? `प्रथम ${n} सम संख्याओं का योग` : `Sum of First ${n} Even Numbers`,
        formula: 'n(n+1)',
        steps: [
          lang === 'hi' ? `n = ${n} (सम संख्याएँ: 2, 4, 6, ..., ${2 * n})` : `n = ${n} (even: 2, 4, 6, ..., ${2 * n})`,
          `= ${n} × (${n} + 1)`,
          `= ${n} × ${n + 1}`,
          `= **${fmt(result)}**`,
        ],
        answer: fmt(result),
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. SUM OF ODD NUMBERS
  // ═══════════════════════════════════════════════════════════════
  if (has(q, 'vishm', 'visham', 'odd') && has(q, 'yog', 'sum')) {
    const n = extractN(q);
    if (n && n > 0) {
      const result = n * n;
      return buildStepByStep(lang, {
        title: lang === 'hi' ? `प्रथम ${n} विषम संख्याओं का योग` : `Sum of First ${n} Odd Numbers`,
        formula: 'n²',
        steps: [
          lang === 'hi' ? `n = ${n} (विषम संख्याएँ: 1, 3, 5, ..., ${2 * n - 1})` : `n = ${n} (odd: 1, 3, 5, ..., ${2 * n - 1})`,
          `= ${n}²`,
          `= **${fmt(result)}**`,
        ],
        answer: fmt(result),
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 6. AVERAGE (Ausat)
  // ═══════════════════════════════════════════════════════════════
  if (has(q, 'ausat', 'average', 'avg', 'mean', 'औसत') && !has(q, 'proportional', 'madhyanupat', 'मध्यानुपात', 'trityanupat', 'तृतीयानुपात')) {
    // Average of 1 to n
    if (has(q, 'prakrit', 'natural', '1 se', '1 to', 'tak')) {
      const n = extractN(q);
      if (n && n > 0) {
        const result = (n + 1) / 2;
        return buildStepByStep(lang, {
          title: lang === 'hi' ? `1 से ${n} तक प्राकृत संख्याओं की औसत` : `Average of Natural Numbers (1 to ${n})`,
          formula: '(n+1)/2',
          steps: [
            lang === 'hi' ? `n = ${n} रखते हैं` : `Put n = ${n}`,
            `= (${n} + 1) / 2`,
            `= ${n + 1} / 2`,
            `= **${fmt(result)}**`,
          ],
          answer: fmt(result),
        });
      }
    }

    // Average speed (2 speeds)
    if (has(q, 'speed', 'chal', 'gati', 'chalte')) {
      if (nums.length >= 2) {
        const [a, b] = nums;
        const result = (2 * a * b) / (a + b);
        return buildStepByStep(lang, {
          title: lang === 'hi' ? 'औसत चाल' : 'Average Speed',
          formula: '2ab / (a+b)',
          steps: [
            `a = ${a}, b = ${b}`,
            `= 2 × ${a} × ${b} / (${a} + ${b})`,
            `= ${fmt(2 * a * b)} / ${fmt(a + b)}`,
            `= **${fmt(result)}**`,
          ],
          answer: fmt(result),
        });
      }
    }

    // General average of given numbers
    if (nums.length >= 2) {
      const sum = nums.reduce((a, b) => a + b, 0);
      const avg = sum / nums.length;
      return buildStepByStep(lang, {
        title: lang === 'hi' ? 'औसत' : 'Average',
        formula: lang === 'hi' ? 'औसत = राशियों का योग / राशियों की संख्या' : 'Average = Sum / Count',
        steps: [
          lang === 'hi' ? `संख्याएँ: ${nums.join(', ')}` : `Numbers: ${nums.join(', ')}`,
          lang === 'hi' ? `योग = ${nums.join(' + ')} = ${fmt(sum)}` : `Sum = ${nums.join(' + ')} = ${fmt(sum)}`,
          lang === 'hi' ? `कुल संख्याएँ = ${nums.length}` : `Count = ${nums.length}`,
          `= ${fmt(sum)} / ${nums.length}`,
          `= **${fmt(avg)}**`,
        ],
        answer: fmt(avg),
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 7. PERCENTAGE (Pratishat) — but NOT when profit/loss/interest keywords present
  // ═══════════════════════════════════════════════════════════════
  const hasProfitLossKeyword = has(q, 'profit', 'loss', 'labh', 'hani', 'munafa', 'nuksan', 'bechi', 'becha', 'kharida',
    'selling price', 'sp', 'cp', 'cost price', 'vikray', 'kray');
  const hasInterestKeyword = has(q, 'interest', 'byaj', 'compound', 'chakravridhi', 'sadharan');

  if (has(q, 'percent', 'pratishat', '%', 'प्रतिशत') && !hasProfitLossKeyword && !hasInterestKeyword) {
    // "x ka y%" or "y% of x"
    const pctOf = q.match(/(\d+(?:\.\d+)?)\s*%\s*(?:of|ka)\s*(\d+(?:\.\d+)?)/i)
      || q.match(/(\d+(?:\.\d+)?)\s*(?:ka|of)\s*(\d+(?:\.\d+)?)\s*%/i);
    if (pctOf) {
      const pct = parseFloat(pctOf[1]);
      const val = parseFloat(pctOf[2]);
      // Determine which is the percentage
      const result = (pct * val) / 100;
      return buildStepByStep(lang, {
        title: lang === 'hi' ? `${pct}% of ${val}` : `${pct}% of ${val}`,
        formula: 'x% of y = (x × y) / 100',
        steps: [
          `= (${pct} × ${val}) / 100`,
          `= ${fmt(pct * val)} / 100`,
          `= **${fmt(result)}**`,
        ],
        answer: fmt(result),
      });
    }

    // Increase by a%
    if (has(q, 'badha', 'increase', 'vriddhi', 'बढ़')) {
      if (nums.length >= 2) {
        const [val, pct] = nums;
        const result = val * (1 + pct / 100);
        const increase = val * pct / 100;
        return buildStepByStep(lang, {
          title: lang === 'hi' ? `${val} में ${pct}% की वृद्धि` : `${val} Increased by ${pct}%`,
          formula: lang === 'hi' ? 'बढ़ा हुआ मान = x(1 + a/100)' : 'New Value = x(1 + a/100)',
          steps: [
            `x = ${val}, a = ${pct}%`,
            `= ${val} × (1 + ${pct}/100)`,
            `= ${val} × ${fmt(1 + pct / 100)}`,
            lang === 'hi' ? `वृद्धि = ${fmt(increase)}` : `Increase = ${fmt(increase)}`,
            lang === 'hi' ? `बढ़ा हुआ मान = **${fmt(result)}**` : `New Value = **${fmt(result)}**`,
          ],
          answer: fmt(result),
        });
      }
    }

    // Decrease by a%
    if (has(q, 'ghata', 'decrease', 'kami', 'घट', 'kam')) {
      if (nums.length >= 2) {
        const [val, pct] = nums;
        const result = val * (1 - pct / 100);
        const decrease = val * pct / 100;
        return buildStepByStep(lang, {
          title: lang === 'hi' ? `${val} में ${pct}% की कमी` : `${val} Decreased by ${pct}%`,
          formula: lang === 'hi' ? 'घटा हुआ मान = x(1 − a/100)' : 'New Value = x(1 − a/100)',
          steps: [
            `x = ${val}, a = ${pct}%`,
            `= ${val} × (1 − ${pct}/100)`,
            `= ${val} × ${fmt(1 - pct / 100)}`,
            lang === 'hi' ? `कमी = ${fmt(decrease)}` : `Decrease = ${fmt(decrease)}`,
            lang === 'hi' ? `घटा हुआ मान = **${fmt(result)}**` : `New Value = **${fmt(result)}**`,
          ],
          answer: fmt(result),
        });
      }
    }

    // Simple percentage calculation with 2 numbers
    if (nums.length >= 2) {
      const [a, b] = nums;
      // If one of them has % nearby, that's the percentage
      const idxPct = q.indexOf('%');
      const idxA = q.indexOf(String(a));
      const idxB = q.indexOf(String(b));
      
      let pct: number, val: number;
      if (Math.abs(idxPct - (idxA + String(a).length)) < 3) {
        pct = a; val = b;
      } else if (Math.abs(idxPct - (idxB + String(b).length)) < 3) {
        pct = b; val = a;
      } else {
        pct = a; val = b; // default
      }

      const result = (pct * val) / 100;
      return buildStepByStep(lang, {
        title: `${pct}% of ${val}`,
        formula: '(x × y) / 100',
        steps: [
          `= (${pct} × ${val}) / 100`,
          `= ${fmt(pct * val)} / 100`,
          `= **${fmt(result)}**`,
        ],
        answer: fmt(result),
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 8. PROFIT & LOSS (Labh aur Hani)
  // ═══════════════════════════════════════════════════════════════
  if (has(q, 'profit', 'loss', 'labh', 'hani', 'लाभ', 'हानि', 'selling price', 'sp', 'cp', 'cost price', 
         'kray', 'vikray', 'bechi', 'becha', 'kharida', 'kharid', 'munafa', 'nuksan')) {

    // SP from CP and Profit%
    if (has(q, 'selling price', 'sp', 'vikray', 'selling', 'bechi', 'becha', 'bechne') && has(q, '%', 'percent', 'pratishat')) {
      if (nums.length >= 2) {
        const cp = nums[0];
        const pct = nums[1];
        if (has(q, 'profit', 'labh', 'munafa', 'लाभ')) {
          const sp = cp * (1 + pct / 100);
          const profit = sp - cp;
          return buildStepByStep(lang, {
            title: lang === 'hi' ? 'विक्रय मूल्य (लाभ% से)' : 'Selling Price (from Profit%)',
            formula: 'SP = CP × (1 + Profit%/100)',
            steps: [
              `CP = ₹${fmt(cp)}, ${lang === 'hi' ? 'लाभ' : 'Profit'}% = ${pct}%`,
              `SP = ${fmt(cp)} × (1 + ${pct}/100)`,
              `SP = ${fmt(cp)} × ${fmt(1 + pct / 100)}`,
              `${lang === 'hi' ? 'लाभ' : 'Profit'} = ₹${fmt(profit)}`,
              `**SP = ₹${fmt(sp)}**`,
            ],
            answer: `₹${fmt(sp)}`,
          });
        }
        if (has(q, 'loss', 'hani', 'nuksan', 'हानि')) {
          const sp = cp * (1 - pct / 100);
          const loss = cp - sp;
          return buildStepByStep(lang, {
            title: lang === 'hi' ? 'विक्रय मूल्य (हानि% से)' : 'Selling Price (from Loss%)',
            formula: 'SP = CP × (1 − Loss%/100)',
            steps: [
              `CP = ₹${fmt(cp)}, ${lang === 'hi' ? 'हानि' : 'Loss'}% = ${pct}%`,
              `SP = ${fmt(cp)} × (1 − ${pct}/100)`,
              `SP = ${fmt(cp)} × ${fmt(1 - pct / 100)}`,
              `${lang === 'hi' ? 'हानि' : 'Loss'} = ₹${fmt(loss)}`,
              `**SP = ₹${fmt(sp)}**`,
            ],
            answer: `₹${fmt(sp)}`,
          });
        }
        // Default: treat as profit
        const sp = cp * (1 + pct / 100);
        return buildStepByStep(lang, {
          title: lang === 'hi' ? 'विक्रय मूल्य' : 'Selling Price',
          formula: 'SP = CP × (1 + P%/100)',
          steps: [
            `CP = ₹${fmt(cp)}, Profit% = ${pct}%`,
            `SP = ${fmt(cp)} × (1 + ${pct}/100)`,
            `**SP = ₹${fmt(sp)}**`,
          ],
          answer: `₹${fmt(sp)}`,
        });
      }
    }

    // Profit% from CP and SP
    if (has(q, 'profit%', 'profit percent', 'labh pratishat', 'labh%', 'kitna profit', 'kitna labh', 'profit kitna')) {
      if (nums.length >= 2) {
        const cp = Math.min(...nums);
        const sp = Math.max(...nums);
        const profit = sp - cp;
        const profitPct = (profit * 100) / cp;
        return buildStepByStep(lang, {
          title: lang === 'hi' ? 'लाभ प्रतिशत' : 'Profit Percentage',
          formula: 'Profit% = (Profit × 100) / CP',
          steps: [
            `CP = ₹${fmt(cp)}, SP = ₹${fmt(sp)}`,
            `${lang === 'hi' ? 'लाभ' : 'Profit'} = SP − CP = ${fmt(sp)} − ${fmt(cp)} = ₹${fmt(profit)}`,
            `${lang === 'hi' ? 'लाभ' : 'Profit'}% = (${fmt(profit)} × 100) / ${fmt(cp)}`,
            `= **${fmt(profitPct)}%**`,
          ],
          answer: `${fmt(profitPct)}%`,
        });
      }
    }

    // Basic profit/loss with CP and SP
    if (nums.length >= 2) {
      // Figure out CP and SP from context
      let cp: number, sp: number;
      if (has(q, 'cp') || has(q, 'cost') || has(q, 'kray') || has(q, 'kharid')) {
        cp = nums[0]; sp = nums[1];
      } else if (has(q, 'sp') || has(q, 'sell') || has(q, 'vikray') || has(q, 'bech')) {
        sp = nums[0]; cp = nums[1];
      } else {
        cp = nums[0]; sp = nums[1];
      }

      if (sp > cp) {
        const profit = sp - cp;
        const pct = (profit * 100) / cp;
        return buildStepByStep(lang, {
          title: lang === 'hi' ? 'लाभ की गणना' : 'Profit Calculation',
          formula: lang === 'hi' ? 'लाभ = SP − CP, लाभ% = (लाभ×100)/CP' : 'Profit = SP − CP, Profit% = (Profit×100)/CP',
          steps: [
            `CP = ₹${fmt(cp)}, SP = ₹${fmt(sp)}`,
            `${lang === 'hi' ? 'लाभ' : 'Profit'} = ${fmt(sp)} − ${fmt(cp)} = **₹${fmt(profit)}**`,
            `${lang === 'hi' ? 'लाभ' : 'Profit'}% = (${fmt(profit)} × 100) / ${fmt(cp)} = **${fmt(pct)}%**`,
          ],
          answer: `₹${fmt(profit)} (${fmt(pct)}%)`,
        });
      } else {
        const loss = cp - sp;
        const pct = (loss * 100) / cp;
        return buildStepByStep(lang, {
          title: lang === 'hi' ? 'हानि की गणना' : 'Loss Calculation',
          formula: lang === 'hi' ? 'हानि = CP − SP, हानि% = (हानि×100)/CP' : 'Loss = CP − SP, Loss% = (Loss×100)/CP',
          steps: [
            `CP = ₹${fmt(cp)}, SP = ₹${fmt(sp)}`,
            `${lang === 'hi' ? 'हानि' : 'Loss'} = ${fmt(cp)} − ${fmt(sp)} = **₹${fmt(loss)}**`,
            `${lang === 'hi' ? 'हानि' : 'Loss'}% = (${fmt(loss)} × 100) / ${fmt(cp)} = **${fmt(pct)}%**`,
          ],
          answer: `₹${fmt(loss)} (${fmt(pct)}%)`,
        });
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 9. SIMPLE INTEREST (Sadharan Byaj)
  // ═══════════════════════════════════════════════════════════════
  if (has(q, 'simple interest', 'sadharan byaj', 'si', 'साधारण ब्याज', 'sadharan', 'byaj') && !has(q, 'compound')) {
    if (nums.length >= 3) {
      // Try to identify P, R, T
      let P = nums[0], R = nums[1], T = nums[2];

      // Smart detection from keywords
      const pIdx = findKeywordNearNumber(q, nums, ['principal', 'mooldhani', 'muldhani', 'amount', 'rupay', 'rs', '₹']);
      const rIdx = findKeywordNearNumber(q, nums, ['rate', 'dar', 'percent', 'pratishat']);
      const tIdx = findKeywordNearNumber(q, nums, ['time', 'samay', 'saal', 'year', 'month']);

      if (pIdx >= 0) P = nums[pIdx];
      if (rIdx >= 0) R = nums[rIdx];
      if (tIdx >= 0) T = nums[tIdx];

      // Heuristic: largest number is usually principal
      const sorted = [...nums].sort((a, b) => b - a);
      if (pIdx < 0) P = sorted[0];
      if (rIdx < 0) R = sorted.length > 1 ? (sorted[1] <= 30 ? sorted[1] : nums[1]) : nums[1];
      if (tIdx < 0) T = sorted.length > 2 ? (sorted[2] <= 50 ? sorted[2] : nums[2]) : nums[2];

      const si = (P * R * T) / 100;
      const amount = P + si;

      return buildStepByStep(lang, {
        title: lang === 'hi' ? 'साधारण ब्याज (Simple Interest)' : 'Simple Interest',
        formula: 'SI = (P × R × T) / 100',
        steps: [
          lang === 'hi'
            ? `मूलधन (P) = ₹${fmt(P)}, दर (R) = ${R}%, समय (T) = ${T} ${T === 1 ? 'साल' : 'साल'}`
            : `Principal (P) = ₹${fmt(P)}, Rate (R) = ${R}%, Time (T) = ${T} year${T !== 1 ? 's' : ''}`,
          `SI = (${fmt(P)} × ${R} × ${T}) / 100`,
          `SI = ${fmt(P * R * T)} / 100`,
          `**SI = ₹${fmt(si)}**`,
          '',
          lang === 'hi'
            ? `मिश्रधन (Amount) = मूलधन + ब्याज = ${fmt(P)} + ${fmt(si)} = **₹${fmt(amount)}**`
            : `Amount = P + SI = ${fmt(P)} + ${fmt(si)} = **₹${fmt(amount)}**`,
        ],
        answer: `SI = ₹${fmt(si)}, Amount = ₹${fmt(amount)}`,
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 10. COMPOUND INTEREST (Chakravridhi Byaj)
  // ═══════════════════════════════════════════════════════════════
  if (has(q, 'compound interest', 'chakravridhi', 'ci', 'compound', 'चक्रवृद्धि')) {
    if (nums.length >= 3) {
      const sorted = [...nums].sort((a, b) => b - a);
      const P = sorted[0]; // largest is principal
      const R = sorted[1] <= 30 ? sorted[1] : nums[1]; // rate usually ≤30
      const T = sorted[2] <= 50 ? sorted[2] : nums[2]; // time

      const amount = P * Math.pow(1 + R / 100, T);
      const ci = amount - P;

      return buildStepByStep(lang, {
        title: lang === 'hi' ? 'चक्रवृद्धि ब्याज (Compound Interest)' : 'Compound Interest',
        formula: 'A = P(1 + R/100)^T, CI = A − P',
        steps: [
          lang === 'hi'
            ? `मूलधन (P) = ₹${fmt(P)}, दर (R) = ${R}%, समय (T) = ${T} साल`
            : `Principal (P) = ₹${fmt(P)}, Rate (R) = ${R}%, Time (T) = ${T} year${T !== 1 ? 's' : ''}`,
          `A = ${fmt(P)} × (1 + ${R}/100)^${T}`,
          `A = ${fmt(P)} × (${fmt(1 + R / 100)})^${T}`,
          `A = ${fmt(P)} × ${fmt(Math.pow(1 + R / 100, T))}`,
          `**A = ₹${fmt(Math.round(amount * 100) / 100)}**`,
          '',
          `CI = A − P = ${fmt(Math.round(amount * 100) / 100)} − ${fmt(P)}`,
          `**CI = ₹${fmt(Math.round(ci * 100) / 100)}**`,
        ],
        answer: `CI = ₹${fmt(Math.round(ci * 100) / 100)}, Amount = ₹${fmt(Math.round(amount * 100) / 100)}`,
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 11. HCF & LCM
  // ═══════════════════════════════════════════════════════════════
  if (has(q, 'hcf', 'lcm', 'mas', 'las', 'ल.स', 'म.स', 'gcd', 'mahattam', 'laghutam', 'highest common', 'least common')) {
    if (nums.length >= 2) {
      const [a, b] = nums;
      const hcfVal = gcd(a, b);
      const lcmVal = lcm(a, b);

      // Check if BOTH HCF and LCM are asked
      const wantsHcf = has(q, 'hcf', 'mas', 'म.स', 'mahattam', 'gcd', 'highest common');
      const wantsLcm = has(q, 'lcm', 'las', 'ल.स', 'laghutam', 'least common');

      if (wantsHcf && wantsLcm) {
        // Both HCF and LCM
        return buildStepByStep(lang, {
          title: lang === 'hi' ? `${a} और ${b} का म.स. और ल.स.` : `HCF & LCM of ${a} and ${b}`,
          formula: 'LCM × HCF = a × b',
          steps: [
            ...buildHcfSteps(a, b, lang),
            '',
            `LCM = (${a} × ${b}) / HCF = ${fmt(a * b)} / ${hcfVal} = **${fmt(lcmVal)}**`,
            '',
            lang === 'hi'
              ? `✅ जाँच: LCM × HCF = ${fmt(lcmVal)} × ${hcfVal} = ${fmt(lcmVal * hcfVal)} = ${a} × ${b} ✓`
              : `✅ Verify: LCM × HCF = ${fmt(lcmVal)} × ${hcfVal} = ${fmt(lcmVal * hcfVal)} = ${a} × ${b} ✓`,
          ],
          answer: `HCF = ${hcfVal}, LCM = ${fmt(lcmVal)}`,
        });
      }

      if (wantsLcm) {
        return buildStepByStep(lang, {
          title: lang === 'hi' ? `${a} और ${b} का ल.स. (LCM)` : `LCM of ${a} and ${b}`,
          formula: 'LCM = (a × b) / HCF(a,b)',
          steps: [
            `a = ${a}, b = ${b}`,
            `HCF(${a}, ${b}) = ${hcfVal}`,
            `LCM = (${a} × ${b}) / ${hcfVal}`,
            `LCM = ${fmt(a * b)} / ${hcfVal}`,
            `**LCM = ${fmt(lcmVal)}**`,
          ],
          answer: fmt(lcmVal),
        });
      }

      if (has(q, 'hcf', 'mas', 'म.स', 'mahattam', 'gcd', 'highest common')) {
        return buildStepByStep(lang, {
          title: lang === 'hi' ? `${a} और ${b} का म.स. (HCF)` : `HCF of ${a} and ${b}`,
          formula: lang === 'hi' ? 'यूक्लिड विधि से' : 'Euclidean Algorithm',
          steps: buildHcfSteps(a, b, lang),
          answer: fmt(hcfVal),
        });
      }

      // Both HCF and LCM
      return buildStepByStep(lang, {
        title: lang === 'hi' ? `${a} और ${b} का म.स. और ल.स.` : `HCF & LCM of ${a} and ${b}`,
        formula: 'LCM × HCF = a × b',
        steps: [
          ...buildHcfSteps(a, b, lang),
          '',
          `LCM = (${a} × ${b}) / HCF = ${fmt(a * b)} / ${hcfVal} = **${fmt(lcmVal)}**`,
          '',
          lang === 'hi'
            ? `✅ जाँच: LCM × HCF = ${fmt(lcmVal)} × ${hcfVal} = ${fmt(lcmVal * hcfVal)} = ${a} × ${b} ✓`
            : `✅ Verify: LCM × HCF = ${fmt(lcmVal)} × ${hcfVal} = ${fmt(lcmVal * hcfVal)} = ${a} × ${b} ✓`,
        ],
        answer: `HCF = ${hcfVal}, LCM = ${fmt(lcmVal)}`,
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 12. RATIO & PROPORTION
  // ═══════════════════════════════════════════════════════════════
  if (has(q, 'ratio', 'anupat', 'proportion', 'samanupat', 'अनुपात', 'समानुपात', 'madhyanupat', 'mean proportional')) {
    // Mean proportional
    if (has(q, 'mean proportional', 'madhyanupat', 'मध्यानुपात', 'geometric mean')) {
      if (nums.length >= 2) {
        const [a, b] = nums;
        const result = Math.sqrt(a * b);
        return buildStepByStep(lang, {
          title: lang === 'hi' ? `${a} और ${b} का मध्यानुपात` : `Mean Proportional of ${a} and ${b}`,
          formula: '√(a × b)',
          steps: [
            `a = ${a}, b = ${b}`,
            `= √(${a} × ${b})`,
            `= √${fmt(a * b)}`,
            `= **${fmt(result)}**`,
          ],
          answer: fmt(result),
        });
      }
    }

    // Third proportional
    if (has(q, 'third proportional', 'trityanupat', 'तृतीयानुपात')) {
      if (nums.length >= 2) {
        const [a, b] = nums;
        const result = (b * b) / a;
        return buildStepByStep(lang, {
          title: lang === 'hi' ? `${a} और ${b} का तृतीयानुपात` : `Third Proportional of ${a} and ${b}`,
          formula: 'b²/a',
          steps: [
            `a = ${a}, b = ${b}`,
            `= ${b}² / ${a}`,
            `= ${fmt(b * b)} / ${a}`,
            `= **${fmt(result)}**`,
          ],
          answer: fmt(result),
        });
      }
    }

    // Simple ratio
    if (nums.length >= 2) {
      const [a, b] = nums;
      const g = gcd(a, b);
      return buildStepByStep(lang, {
        title: lang === 'hi' ? `${a} और ${b} का अनुपात` : `Ratio of ${a} and ${b}`,
        formula: 'a : b (simplest form)',
        steps: [
          `${a} : ${b}`,
          `GCD(${a}, ${b}) = ${g}`,
          lang === 'hi' ? `सरल रूप: ${a / g} : ${b / g}` : `Simplified: ${a / g} : ${b / g}`,
          `**${a / g} : ${b / g}**`,
        ],
        answer: `${a / g} : ${b / g}`,
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 13. GST CALCULATION
  // ═══════════════════════════════════════════════════════════════
  if (has(q, 'gst')) {
    if (nums.length >= 2) {
      let rate = nums.find(n => n <= 28) ?? nums[1];
      let amount = nums.find(n => n > 28) ?? nums[0];
      if (nums[0] <= 28 && nums[1] > 28) { rate = nums[0]; amount = nums[1]; }
      else if (nums[1] <= 28 && nums[0] > 28) { rate = nums[1]; amount = nums[0]; }

      const gstAmount = (amount * rate) / 100;
      const total = amount + gstAmount;
      const cgst = gstAmount / 2;
      const sgst = gstAmount / 2;

      return buildStepByStep(lang, {
        title: lang === 'hi' ? 'GST गणना' : 'GST Calculation',
        formula: 'GST = Amount × Rate/100',
        steps: [
          lang === 'hi' ? `राशि = ₹${fmt(amount)}, GST दर = ${rate}%` : `Amount = ₹${fmt(amount)}, GST Rate = ${rate}%`,
          `GST = ${fmt(amount)} × ${rate}/100 = **₹${fmt(gstAmount)}**`,
          `CGST (${rate / 2}%) = ₹${fmt(cgst)}`,
          `SGST (${rate / 2}%) = ₹${fmt(sgst)}`,
          '',
          lang === 'hi' ? `**कुल राशि = ₹${fmt(amount)} + ₹${fmt(gstAmount)} = ₹${fmt(total)}**` : `**Total = ₹${fmt(amount)} + ₹${fmt(gstAmount)} = ₹${fmt(total)}**`,
        ],
        answer: `₹${fmt(total)}`,
      });
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 14. EMI CALCULATION
  // ═══════════════════════════════════════════════════════════════
  if (has(q, 'emi')) {
    if (nums.length >= 3) {
      const sorted = [...nums].sort((a, b) => b - a);
      const P = sorted[0]; // loan amount (largest)
      const R = sorted.find(n => n <= 30 && n !== sorted[0]) ?? nums[1]; // rate
      const N = sorted.find(n => n !== P && n !== R) ?? nums[2]; // tenure

      // Convert annual rate to monthly
      const monthlyRate = R / (12 * 100);
      // If N seems like years (≤30), convert to months
      const months = N <= 30 ? N * 12 : N;

      if (monthlyRate > 0) {
        const emi = (P * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
        const totalPayment = emi * months;
        const totalInterest = totalPayment - P;

        return buildStepByStep(lang, {
          title: 'EMI Calculation',
          formula: 'EMI = P × r × (1+r)^n / ((1+r)^n − 1)',
          steps: [
            lang === 'hi'
              ? `लोन राशि (P) = ₹${fmt(P)}, दर (R) = ${R}% yearly, अवधि = ${N <= 30 ? N + ' साल' : N + ' महीने'}`
              : `Loan (P) = ₹${fmt(P)}, Rate (R) = ${R}% yearly, Tenure = ${N <= 30 ? N + ' years' : N + ' months'}`,
            `r (monthly) = ${R}/(12×100) = ${(monthlyRate).toFixed(6)}`,
            `n (months) = ${months}`,
            `EMI = ${fmt(P)} × ${monthlyRate.toFixed(6)} × (1+${monthlyRate.toFixed(6)})^${months} / ((1+${monthlyRate.toFixed(6)})^${months} − 1)`,
            `**EMI = ₹${fmt(Math.round(emi))}** ${lang === 'hi' ? 'प्रति माह' : '/month'}`,
            '',
            lang === 'hi'
              ? `कुल भुगतान = ₹${fmt(Math.round(totalPayment))}\nकुल ब्याज = ₹${fmt(Math.round(totalInterest))}`
              : `Total Payment = ₹${fmt(Math.round(totalPayment))}\nTotal Interest = ₹${fmt(Math.round(totalInterest))}`,
          ],
          answer: `₹${fmt(Math.round(emi))}/month`,
        });
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // 15. BASIC ARITHMETIC (fallback for simple calculations)
  // ═══════════════════════════════════════════════════════════════
  // "500 ka 20%" type quick calculations
  const quickPct = q.match(/(\d+(?:\.\d+)?)\s*(?:ka|of)\s*(\d+(?:\.\d+)?)\s*%/i)
    || q.match(/(\d+(?:\.\d+)?)\s*%\s*(?:ka|of)\s*(\d+(?:\.\d+)?)/i);
  if (quickPct) {
    const a = parseFloat(quickPct[1]);
    const b = parseFloat(quickPct[2]);
    // "800 ka 25%" → 25% of 800
    // "25% of 800" → 25% of 800
    const hasPctFirst = q.indexOf('%') < q.indexOf(String(b));
    const [pct, val] = hasPctFirst ? [a, b] : [b, a];
    const result = (pct * val) / 100;
    return buildStepByStep(lang, {
      title: `${pct}% of ${val}`,
      formula: '(x × y) / 100',
      steps: [
        `= (${pct} × ${val}) / 100`,
        `= **${fmt(result)}**`,
      ],
      answer: fmt(result),
    });
  }

  return null;
};

// ─── Helper: Build HCF steps ─────────────────────────────────────

const buildHcfSteps = (a: number, b: number, lang: Lang): string[] => {
  const steps: string[] = [];
  let x = Math.abs(a), y = Math.abs(b);
  steps.push(lang === 'hi' ? `यूक्लिड विधि:` : `Euclidean Algorithm:`);
  while (y !== 0) {
    const rem = x % y;
    steps.push(`${x} = ${y} × ${Math.floor(x / y)} + ${rem}`);
    x = y;
    y = rem;
  }
  steps.push(`**HCF = ${x}**`);
  return steps;
};

// ─── Helper: Find keyword near a number ──────────────────────────

const findKeywordNearNumber = (text: string, nums: number[], keywords: string[]): number => {
  const t = lower(text);
  for (const kw of keywords) {
    const kwIdx = t.indexOf(kw);
    if (kwIdx < 0) continue;
    // Find the closest number to this keyword
    let closestIdx = -1;
    let closestDist = Infinity;
    for (let i = 0; i < nums.length; i++) {
      const numStr = String(nums[i]);
      const numIdx = t.indexOf(numStr, Math.max(0, kwIdx - 20));
      if (numIdx >= 0) {
        const dist = Math.abs(numIdx - kwIdx);
        if (dist < closestDist) {
          closestDist = dist;
          closestIdx = i;
        }
      }
    }
    if (closestIdx >= 0 && closestDist < 30) return closestIdx;
  }
  return -1;
};

// ─── Step-by-step response builder ───────────────────────────────

interface StepByStepData {
  title: string;
  formula: string;
  steps: string[];
  answer: string;
}

const buildStepByStep = (lang: Lang, data: StepByStepData): string => {
  let response = `### ${data.title}\n\n`;
  response += `**${lang === 'hi' ? 'सूत्र' : 'Formula'}:** \`${data.formula}\`\n\n`;
  response += `**${lang === 'hi' ? 'हल (Step-by-Step)' : 'Solution (Step-by-Step)'}:**\n`;
  
  for (const step of data.steps) {
    if (step === '') {
      response += '\n';
    } else if (step.startsWith('**')) {
      response += `${step}\n`;
    } else {
      response += `- ${step}\n`;
    }
  }

  response += `\n**${lang === 'hi' ? 'उत्तर' : 'Answer'}:** ${data.answer}`;
  return response;
};
