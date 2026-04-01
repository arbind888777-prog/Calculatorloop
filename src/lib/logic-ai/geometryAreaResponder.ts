export type Lang = 'en' | 'hi';

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const hasAny = (s: string, parts: string[]) => parts.some((p) => s.includes(p));

const formatNumber = (n: number) => {
  if (!Number.isFinite(n)) return String(n);
  const abs = Math.abs(n);
  if (abs === 0) return '0';
  if (abs >= 1e8 || abs < 1e-6) return n.toExponential(8).replace(/0+e/, 'e').replace(/\.e/, 'e');
  return n.toLocaleString(undefined, { maximumFractionDigits: 10 });
};

const parseNumber = (raw: string) => {
  const cleaned = raw.replace(/,/g, '').trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

const extractFirst = (message: string, keywords: string[]): number | null => {
  for (const k of keywords) {
    const re = new RegExp(`(?:\\b${k}\\b)\\s*(?:[:=]|is|=)?\\s*(-?\\d+(?:\\.\\d+)?)`, 'i');
    const m = message.match(re);
    if (m?.[1]) {
      const n = parseNumber(m[1]);
      if (n !== null) return n;
    }
  }
  return null;
};

const extractAnyNumber = (message: string): number[] => {
  const out: number[] = [];
  const re = /-?\d+(?:\.\d+)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(message))) {
    const n = parseNumber(m[0]);
    if (n !== null) out.push(n);
  }
  return out;
};

const build = (title: string, formula: string, steps: string[], result: string) => {
  return [`### 📐 ${title}`, '', `**Formula:** ${formula}`, '', '**Steps:**', ...steps.map((s) => `- ${s}`), '', `**Answer:** ${result}`].join('\n');
};

const buildFull = (title: string, formula: string, steps: string[], result: string, trick?: string) => {
  const lines = [`### 📐 ${title}`, '', `**Formula:** ${formula}`, '', '**Solution (Step-by-Step):**', ...steps.map((s) => `- ${s}`), '', `**Answer:** ${result}`];
  if (trick) {
    lines.push('', `💡 **Short Trick:** ${trick}`);
  }
  return lines.join('\n');
};

const buildNeed = (lang: Lang, title: string, needed: string) => {
  if (lang === 'hi') {
    return [
      `### 📐 ${title}`,
      '',
      'Iska nikalne ke liye ye values chahiye:',
      `- ${needed}`,
      '',
      "Example: 'area of circle r=7' ya 'cylinder volume r=7 h=10'",
    ].join('\n');
  }

  return [
    `### 📐 ${title}`,
    '',
    'To calculate, please provide:',
    `- ${needed}`,
    '',
    "Example: 'area of circle r=7' or 'cylinder volume r=7 h=10'",
  ].join('\n');
};

export const tryBuildGeometryAreaResponse = (message: string, lang: Lang): string | null => {
  const q = normalize(message);
  const aboutMeasure = hasAny(q, [
    'area',
    'chhetrafal',
    'क्षेत्रफल',
    'kshetrafal',
    'kshetra',
    'prishth',
    'surface',
    'surface area',
    'aayatan',
    'ayatan',
    'आयतन',
    'volume',
    'perimeter',
    'parimiti',
    'परिमिति',
    'circumference',
    'paridhee',
    'paridhi',
    'परिधि',
    'diagonal',
    'vikarn',
    'विकर्ण',
    'slant',
    'csa',
    'tsa',
    'lsa',
    'curved surface',
    'total surface',
    'lateral surface',
  ]);
  if (!aboutMeasure) return null;

  // Special guidance: users sometimes type "ghanmool" (cube root) when they mean "ghan" (cube).
  const mentionsCubeRoot = hasAny(q, ['ghanmool', 'घनमूल', 'cube root', 'cuberoot']);
  const mentionsAreaWord = hasAny(q, ['area', 'chhetrafal', 'क्षेत्रफल', 'kshetrafal', 'surface', 'prishth']);
  if (mentionsCubeRoot && mentionsAreaWord) {
    if (lang === 'hi') {
      return [
        '### ℹ️ Clarification',
        '',
        "'घनमूल (cube root)' ek number operation hai — iska 'क्षेत्रफल' nahi hota.",
        '',
        'Aap kya poochna chahte hain?',
        "- **Cube (घन) ka क्षेत्रफल**: 'cube surface area side=5'  (Formula: 6a²)",
        "- **Cube (घन) ka आयतन (volume)**: 'cube volume side=5'  (Formula: a³)",
        "- **Cube root (घनमूल)**: 'cuberoot: 125' (Answer: 5)",
      ].join('\n');
    }

    return [
      '### ℹ️ Clarification',
      '',
      "'Cube root' is a number operation — it doesn't have an area.",
      '',
      'Did you mean:',
      "- **Cube surface area**: 'cube surface area side=5'  (6a²)",
      "- **Cube volume**: 'cube volume side=5'  (a³)",
      "- **Cube root**: 'cuberoot: 125'",
    ].join('\n');
  }

  const wantsVolume = hasAny(q, ['aayatan', 'ayatan', 'आयतन', 'volume']);
  const wantsSurfaceArea = hasAny(q, ['area', 'chhetrafal', 'क्षेत्रफल', 'kshetrafal', 'surface', 'prishth', 'csa', 'tsa', 'lsa', 'curved surface', 'total surface', 'lateral surface']);
  const wantsPerimeter = hasAny(q, ['perimeter', 'parimiti', 'परिमिति', 'circumference', 'paridhee', 'paridhi', 'परिधि']);
  const wantsDiagonal = hasAny(q, ['diagonal', 'vikarn', 'विकर्ण']);
  const wantsCSA = hasAny(q, ['csa', 'curved surface', 'vakra']);
  const wantsTSA = hasAny(q, ['tsa', 'total surface', 'sampurn prishth']);
  const wantsLSA = hasAny(q, ['lsa', 'lateral surface', 'parshva']);
  const PI = Math.PI;

  // ═══ CIRCLE ═══
  const isCircle = hasAny(q, ['circle', 'vritt', 'वृत्त', 'vartul']) && !hasAny(q, ['semi', 'ardh', 'अर्ध']);
  if (isCircle) {
    const r = extractFirst(message, ['r', 'radius', 'trijya']) ?? null;
    if (r === null) return buildNeed(lang, lang === 'hi' ? 'Vritt (Circle)' : 'Circle', 'radius (r)');
    
    if (wantsPerimeter) {
      const c = 2 * PI * r;
      return buildFull(lang === 'hi' ? 'Vritt ki Paridhi (Circumference)' : 'Circumference of Circle', 'C = 2πr', [
        `Given r = ${formatNumber(r)}`,
        `C = 2 × π × ${formatNumber(r)}`,
        `C = 2 × 3.14159 × ${formatNumber(r)}`,
        `C = ${formatNumber(c)}`,
      ], `${formatNumber(c)} units`, lang === 'hi' ? 'Radius = Circumference / (2π)' : 'Radius = C/(2π)');
    }
    
    const area = PI * r * r;
    return buildFull(lang === 'hi' ? 'Vritt (Circle) ka Chhetrafal' : 'Area of Circle', 'A = πr²', [
      `Given r = ${formatNumber(r)}`,
      `A = π × ${formatNumber(r)}²`,
      `A = π × ${formatNumber(r * r)}`,
      `A = ${formatNumber(area)}`,
    ], `${formatNumber(area)} sq units`);
  }

  // ═══ SEMICIRCLE ═══
  const isSemicircle = hasAny(q, ['semicircle', 'ardh vritt', 'अर्धवृत्त', 'ardhvritt', 'semi circle', 'half circle']);
  if (isSemicircle) {
    const r = extractFirst(message, ['r', 'radius', 'trijya']) ?? null;
    if (r === null) return buildNeed(lang, lang === 'hi' ? 'Ardhvritt (Semicircle)' : 'Semicircle', 'radius (r)');
    
    if (wantsPerimeter) {
      const p = (PI + 2) * r;
      return buildFull(lang === 'hi' ? 'Ardhvritt ki Parimiti' : 'Perimeter of Semicircle', 'P = (π+2)r', [
        `Given r = ${formatNumber(r)}`,
        `P = (π + 2) × ${formatNumber(r)}`,
        `P = ${formatNumber(PI + 2)} × ${formatNumber(r)}`,
        `P = ${formatNumber(p)}`,
      ], `${formatNumber(p)} units`);
    }
    
    const area = 0.5 * PI * r * r;
    return buildFull(lang === 'hi' ? 'Ardhvritt ka Chhetrafal' : 'Area of Semicircle', 'A = ½πr²', [
      `Given r = ${formatNumber(r)}`,
      `A = ½ × π × ${formatNumber(r)}²`,
      `A = ½ × π × ${formatNumber(r * r)}`,
      `A = ${formatNumber(area)}`,
    ], `${formatNumber(area)} sq units`);
  }

  // ═══ SECTOR ═══
  const isSector = hasAny(q, ['sector', 'triyakhand', 'त्रिज्यखंड', 'trijyakhand']);
  if (isSector) {
    const r = extractFirst(message, ['r', 'radius', 'trijya']) ?? null;
    const theta = extractFirst(message, ['theta', 'angle', 'kon', 'degree']) ?? null;
    if (r === null || theta === null) return buildNeed(lang, lang === 'hi' ? 'Triyakhand (Sector)' : 'Sector', 'radius (r) and angle θ (degrees)');
    
    if (wantsPerimeter) {
      const arcLen = (theta / 360) * 2 * PI * r;
      const p = arcLen + 2 * r;
      return buildFull(lang === 'hi' ? 'Sector ki Parimiti' : 'Perimeter of Sector', 'P = arc + 2r', [
        `Given r = ${formatNumber(r)}, θ = ${formatNumber(theta)}°`,
        `Arc length = (θ/360)×2πr = (${formatNumber(theta)}/360)×2×π×${formatNumber(r)} = ${formatNumber(arcLen)}`,
        `Perimeter = ${formatNumber(arcLen)} + 2×${formatNumber(r)} = ${formatNumber(p)}`,
      ], `${formatNumber(p)} units`);
    }
    
    const area = (theta / 360) * PI * r * r;
    return buildFull(lang === 'hi' ? 'Triyakhand (Sector) ka Chhetrafal' : 'Area of Sector', 'A = (θ/360)πr²', [
      `Given r = ${formatNumber(r)}, θ = ${formatNumber(theta)}°`,
      `A = (${formatNumber(theta)}/360) × π × ${formatNumber(r)}²`,
      `A = ${formatNumber(theta / 360)} × π × ${formatNumber(r * r)}`,
      `A = ${formatNumber(area)}`,
    ], `${formatNumber(area)} sq units`);
  }

  // ═══ SEGMENT ═══
  const isSegment = hasAny(q, ['segment', 'vrittkhand', 'वृत्तखंड', 'vrittakhand']);
  if (isSegment) {
    const r = extractFirst(message, ['r', 'radius']) ?? null;
    const theta = extractFirst(message, ['theta', 'angle', 'degree']) ?? null;
    if (r === null || theta === null) return buildNeed(lang, lang === 'hi' ? 'Vrittkhand (Segment)' : 'Segment', 'radius (r) and angle θ (degrees)');
    
    const thetaRad = (theta * PI) / 180;
    const area = (r * r / 2) * (thetaRad - Math.sin(thetaRad));
    return buildFull(lang === 'hi' ? 'Vrittkhand ka Chhetrafal' : 'Area of Segment', 'A = (r²/2)(θ − sinθ)', [
      `Given r = ${formatNumber(r)}, θ = ${formatNumber(theta)}°`,
      `θ in radians = ${formatNumber(thetaRad)}`,
      `A = (${formatNumber(r)}²/2) × (${formatNumber(thetaRad)} − sin(${formatNumber(thetaRad)}))`,
      `A = ${formatNumber(r * r / 2)} × ${formatNumber(thetaRad - Math.sin(thetaRad))}`,
      `A = ${formatNumber(area)}`,
    ], `${formatNumber(area)} sq units`);
  }

  // ═══ RING / ANNULUS ═══
  const isRing = hasAny(q, ['ring', 'valay', 'वलय', 'annulus']);
  if (isRing) {
    const R = extractFirst(message, ['r1', 'outer', 'bada', 'big']) ?? extractFirst(message, ['r', 'radius']) ?? null;
    const r = extractFirst(message, ['r2', 'inner', 'chhota', 'small']) ?? null;
    if (R === null || r === null) return buildNeed(lang, lang === 'hi' ? 'Valay (Ring)' : 'Ring', 'outer radius (R) and inner radius (r)');
    
    const area = PI * (R + r) * (R - r);
    return buildFull(lang === 'hi' ? 'Valay ka Chhetrafal' : 'Area of Ring', 'A = π(R+r)(R−r)', [
      `Given R = ${formatNumber(R)}, r = ${formatNumber(r)}`,
      `A = π × (${formatNumber(R)} + ${formatNumber(r)}) × (${formatNumber(R)} − ${formatNumber(r)})`,
      `A = π × ${formatNumber(R + r)} × ${formatNumber(R - r)}`,
      `A = ${formatNumber(area)}`,
    ], `${formatNumber(area)} sq units`);
  }

  // ═══ CYLINDER ═══
  const isCylinder = hasAny(q, ['cylinder', 'belan', 'बेलन', 'beln']);
  if (isCylinder) {
    const r = extractFirst(message, ['r', 'radius', 'trijya']) ?? null;
    const h = extractFirst(message, ['h', 'height', 'unchai', 'lambai']) ?? null;
    if (r === null || h === null) return buildNeed(lang, lang === 'hi' ? 'Belan (Cylinder)' : 'Cylinder', 'radius (r) and height (h)');
    
    if (wantsVolume && !wantsSurfaceArea) {
      const v = PI * r * r * h;
      return buildFull(lang === 'hi' ? 'Belan ka Aayatan' : 'Volume of Cylinder', 'V = πr²h', [
        `Given r = ${formatNumber(r)}, h = ${formatNumber(h)}`,
        `V = π × ${formatNumber(r)}² × ${formatNumber(h)}`,
        `V = π × ${formatNumber(r * r)} × ${formatNumber(h)}`,
        `V = ${formatNumber(v)}`,
      ], `${formatNumber(v)} cubic units`);
    }
    
    if (wantsCSA) {
      const csa = 2 * PI * r * h;
      return buildFull(lang === 'hi' ? 'Belan ka Vakra Prishth (CSA)' : 'CSA of Cylinder', 'CSA = 2πrh', [
        `Given r = ${formatNumber(r)}, h = ${formatNumber(h)}`,
        `CSA = 2 × π × ${formatNumber(r)} × ${formatNumber(h)}`,
        `CSA = ${formatNumber(csa)}`,
      ], `${formatNumber(csa)} sq units`);
    }
    
    // Default: TSA
    const tsa = 2 * PI * r * (r + h);
    const csa = 2 * PI * r * h;
    const v = PI * r * r * h;
    return buildFull(lang === 'hi' ? 'Belan (Cylinder)' : 'Cylinder', 'TSA = 2πr(r+h), V = πr²h', [
      `Given r = ${formatNumber(r)}, h = ${formatNumber(h)}`,
      `CSA = 2πrh = 2 × π × ${formatNumber(r)} × ${formatNumber(h)} = ${formatNumber(csa)} sq units`,
      `TSA = 2πr(r+h) = 2 × π × ${formatNumber(r)} × (${formatNumber(r)}+${formatNumber(h)}) = **${formatNumber(tsa)} sq units**`,
      `Volume = πr²h = π × ${formatNumber(r * r)} × ${formatNumber(h)} = **${formatNumber(v)} cubic units**`,
    ], `TSA = ${formatNumber(tsa)} sq, Volume = ${formatNumber(v)} cu`);
  }

  // ═══ CONE ═══
  const isCone = hasAny(q, ['cone', 'shanku', 'शंकु', 'shankoo']);
  if (isCone && !hasAny(q, ['frustum', 'chhinnak', 'छिन्नक'])) {
    const r = extractFirst(message, ['r', 'radius', 'trijya']) ?? null;
    const h = extractFirst(message, ['h', 'height', 'unchai']) ?? null;
    const l = extractFirst(message, ['l', 'slant', 'tirchhi']) ?? null;
    
    if (r === null) return buildNeed(lang, lang === 'hi' ? 'Shanku (Cone)' : 'Cone', 'radius (r) and height (h) or slant height (l)');
    
    // Calculate slant height if not given
    const slant = l ?? (h !== null ? Math.sqrt(r * r + h * h) : null);
    const height = h ?? (l !== null ? Math.sqrt(l * l - r * r) : null);
    
    if (slant === null || height === null) return buildNeed(lang, lang === 'hi' ? 'Shanku (Cone)' : 'Cone', 'radius (r) and height (h) or slant height (l)');
    
    if (wantsVolume && !wantsSurfaceArea) {
      const v = (1 / 3) * PI * r * r * height;
      return buildFull(lang === 'hi' ? 'Shanku ka Aayatan' : 'Volume of Cone', 'V = (1/3)πr²h', [
        `Given r = ${formatNumber(r)}, h = ${formatNumber(height)}`,
        `V = (1/3) × π × ${formatNumber(r)}² × ${formatNumber(height)}`,
        `V = (1/3) × π × ${formatNumber(r * r * height)}`,
        `V = ${formatNumber((1 / 3) * PI * r * r * height)}`,
      ], `${formatNumber((1 / 3) * PI * r * r * height)} cubic units`);
    }
    
    if (wantsCSA) {
      const csa = PI * r * slant;
      return buildFull(lang === 'hi' ? 'Shanku ka CSA' : 'CSA of Cone', 'CSA = πrl', [
        `Given r = ${formatNumber(r)}, l = ${formatNumber(slant)}`,
        `CSA = π × ${formatNumber(r)} × ${formatNumber(slant)}`,
        `CSA = ${formatNumber(csa)}`,
      ], `${formatNumber(csa)} sq units`);
    }
    
    const csa = PI * r * slant;
    const tsa = PI * r * (r + slant);
    const v = (1 / 3) * PI * r * r * height;
    return buildFull(lang === 'hi' ? 'Shanku (Cone)' : 'Cone', 'l=√(r²+h²), CSA=πrl, TSA=πr(r+l), V=(1/3)πr²h', [
      `Given r = ${formatNumber(r)}, h = ${formatNumber(height)}`,
      `Slant height l = √(r²+h²) = √(${formatNumber(r * r)}+${formatNumber(height * height)}) = ${formatNumber(slant)}`,
      `CSA = πrl = ${formatNumber(csa)} sq units`,
      `TSA = πr(r+l) = π×${formatNumber(r)}×(${formatNumber(r)}+${formatNumber(slant)}) = **${formatNumber(tsa)} sq units**`,
      `Volume = (1/3)πr²h = **${formatNumber(v)} cubic units**`,
    ], `TSA = ${formatNumber(tsa)} sq, V = ${formatNumber(v)} cu`);
  }

  // ═══ FRUSTUM ═══
  const isFrustum = hasAny(q, ['frustum', 'chhinnak', 'छिन्नक', 'chhidrak', 'frustum']);
  if (isFrustum) {
    const R = extractFirst(message, ['r1', 'bigr', 'outer', 'bada']) ?? extractFirst(message, ['r', 'radius']) ?? null;
    const r = extractFirst(message, ['r2', 'smallr', 'inner', 'chhota']) ?? null;
    const h = extractFirst(message, ['h', 'height', 'unchai']) ?? null;
    if (R === null || r === null || h === null) return buildNeed(lang, lang === 'hi' ? 'Frustum (शंकु छिन्नक)' : 'Frustum', 'big radius (R), small radius (r), height (h)');
    
    const l = Math.sqrt((R - r) * (R - r) + h * h);
    const csa = PI * l * (R + r);
    const tsa = csa + PI * (R * R + r * r);
    const v = (1 / 3) * PI * h * (R * R + r * r + R * r);
    
    return buildFull(lang === 'hi' ? 'Frustum (शंकु छिन्नक)' : 'Frustum', 'l=√((R−r)²+h²), CSA=πl(R+r), V=(1/3)πh(R²+r²+Rr)', [
      `Given R = ${formatNumber(R)}, r = ${formatNumber(r)}, h = ${formatNumber(h)}`,
      `Slant l = √((${formatNumber(R)}−${formatNumber(r)})²+${formatNumber(h)}²) = ${formatNumber(l)}`,
      `CSA = πl(R+r) = ${formatNumber(csa)} sq units`,
      `TSA = CSA + π(R²+r²) = **${formatNumber(tsa)} sq units**`,
      `Volume = (1/3)πh(R²+r²+Rr) = **${formatNumber(v)} cubic units**`,
    ], `TSA = ${formatNumber(tsa)} sq, V = ${formatNumber(v)} cu`);
  }

  // ═══ SPHERE ═══
  const isSphere = hasAny(q, ['sphere', 'gola', 'गोला', 'golakar']) && !hasAny(q, ['hemi', 'ardh', 'अर्ध', 'half']);
  if (isSphere) {
    const r = extractFirst(message, ['r', 'radius', 'trijya']) ?? null;
    if (r === null) return buildNeed(lang, lang === 'hi' ? 'Gola (Sphere)' : 'Sphere', 'radius (r)');
    
    if (wantsVolume && !wantsSurfaceArea) {
      const v = (4 / 3) * PI * r * r * r;
      return buildFull(lang === 'hi' ? 'Gola ka Aayatan' : 'Volume of Sphere', 'V = (4/3)πr³', [
        `Given r = ${formatNumber(r)}`,
        `V = (4/3) × π × ${formatNumber(r)}³`,
        `V = (4/3) × π × ${formatNumber(r * r * r)}`,
        `V = ${formatNumber(v)}`,
      ], `${formatNumber(v)} cubic units`, lang === 'hi' ? 'Radius k guna → SA k² guna, Volume k³ guna' : 'If radius × k → SA × k², Volume × k³');
    }
    
    const sa = 4 * PI * r * r;
    const v = (4 / 3) * PI * r * r * r;
    return buildFull(lang === 'hi' ? 'Gola (Sphere)' : 'Sphere', 'SA = 4πr², V = (4/3)πr³', [
      `Given r = ${formatNumber(r)}`,
      `Surface Area = 4πr² = 4 × π × ${formatNumber(r)}² = **${formatNumber(sa)} sq units**`,
      `Volume = (4/3)πr³ = (4/3) × π × ${formatNumber(r * r * r)} = **${formatNumber(v)} cubic units**`,
    ], `SA = ${formatNumber(sa)} sq, V = ${formatNumber(v)} cu`);
  }

  // ═══ HEMISPHERE ═══
  const isHemisphere = hasAny(q, ['hemisphere', 'ardhgola', 'अर्धगोला', 'half sphere', 'ardh gola']);
  if (isHemisphere) {
    const r = extractFirst(message, ['r', 'radius', 'trijya']) ?? null;
    if (r === null) return buildNeed(lang, lang === 'hi' ? 'Ardhgola (Hemisphere)' : 'Hemisphere', 'radius (r)');
    
    const csa = 2 * PI * r * r;
    const tsa = 3 * PI * r * r;
    const v = (2 / 3) * PI * r * r * r;
    
    if (wantsVolume && !wantsSurfaceArea) {
      return buildFull(lang === 'hi' ? 'Ardhgola ka Aayatan' : 'Volume of Hemisphere', 'V = (2/3)πr³', [
        `Given r = ${formatNumber(r)}`,
        `V = (2/3) × π × ${formatNumber(r)}³`,
        `V = (2/3) × π × ${formatNumber(r * r * r)}`,
        `V = ${formatNumber(v)}`,
      ], `${formatNumber(v)} cubic units`);
    }
    
    return buildFull(lang === 'hi' ? 'Ardhgola (Hemisphere)' : 'Hemisphere', 'CSA=2πr², TSA=3πr², V=(2/3)πr³', [
      `Given r = ${formatNumber(r)}`,
      `CSA = 2πr² = 2 × π × ${formatNumber(r * r)} = ${formatNumber(csa)} sq units`,
      `TSA = 3πr² = 3 × π × ${formatNumber(r * r)} = **${formatNumber(tsa)} sq units**`,
      `Volume = (2/3)πr³ = **${formatNumber(v)} cubic units**`,
    ], `TSA = ${formatNumber(tsa)} sq, V = ${formatNumber(v)} cu`);
  }

  // ═══ PRISM ═══
  const isPrism = hasAny(q, ['prism', 'prizm', 'प्रिज्म', 'prijn']);
  if (isPrism) {
    const baseArea = extractFirst(message, ['base area', 'basearea', 'ba']) ?? null;
    const perimeter = extractFirst(message, ['perimeter', 'p']) ?? null;
    const h = extractFirst(message, ['h', 'height', 'unchai']) ?? null;
    if (baseArea === null || h === null) return buildNeed(lang, lang === 'hi' ? 'Prism (प्रिज्म)' : 'Prism', 'base area (ba), base perimeter (p), height (h)');
    
    const v = baseArea * h;
    const lsa = perimeter !== null ? perimeter * h : null;
    const tsa = lsa !== null ? 2 * baseArea + lsa : null;
    
    const steps = [
      `Given base area = ${formatNumber(baseArea)}, h = ${formatNumber(h)}${perimeter !== null ? `, perimeter = ${formatNumber(perimeter)}` : ''}`,
      `Volume = Base area × h = ${formatNumber(baseArea)} × ${formatNumber(h)} = **${formatNumber(v)} cubic units**`,
    ];
    if (lsa !== null) steps.push(`LSA = Perimeter × h = ${formatNumber(perimeter!)} × ${formatNumber(h)} = ${formatNumber(lsa)} sq units`);
    if (tsa !== null) steps.push(`TSA = 2(Base area) + LSA = 2×${formatNumber(baseArea)} + ${formatNumber(lsa!)} = **${formatNumber(tsa)} sq units**`);
    
    return buildFull(lang === 'hi' ? 'Prism' : 'Prism', 'V = Base area × h', steps, `Volume = ${formatNumber(v)} cu${tsa !== null ? `, TSA = ${formatNumber(tsa)} sq` : ''}`);
  }

  // ═══ PYRAMID ═══
  const isPyramid = hasAny(q, ['pyramid', 'piramid', 'पिरामिड', 'piramidd']);
  if (isPyramid) {
    const baseArea = extractFirst(message, ['base area', 'basearea', 'ba']) ?? null;
    const perimeter = extractFirst(message, ['perimeter', 'p']) ?? null;
    const h = extractFirst(message, ['h', 'height', 'unchai']) ?? null;
    const l = extractFirst(message, ['l', 'slant', 'tirchhi']) ?? null;
    if (baseArea === null || h === null) return buildNeed(lang, lang === 'hi' ? 'Pyramid (पिरामिड)' : 'Pyramid', 'base area (ba), height (h), [slant (l), perimeter (p)]');
    
    const v = (1 / 3) * baseArea * h;
    const lsa = (l !== null && perimeter !== null) ? 0.5 * perimeter * l : null;
    const tsa = lsa !== null ? baseArea + lsa : null;
    
    const steps = [
      `Given base area = ${formatNumber(baseArea)}, h = ${formatNumber(h)}`,
      `Volume = (1/3) × Base area × h = (1/3) × ${formatNumber(baseArea)} × ${formatNumber(h)} = **${formatNumber(v)} cubic units**`,
    ];
    if (lsa !== null) steps.push(`LSA = ½ × Perimeter × l = ½ × ${formatNumber(perimeter!)} × ${formatNumber(l!)} = ${formatNumber(lsa)} sq units`);
    if (tsa !== null) steps.push(`TSA = Base area + LSA = **${formatNumber(tsa)} sq units**`);
    
    return buildFull(lang === 'hi' ? 'Pyramid (पिरामिड)' : 'Pyramid', 'V = (1/3)×Base area×h', steps, `Volume = ${formatNumber(v)} cu`);
  }

  // ═══ HEXAGON ═══
  const isHexagon = hasAny(q, ['hexagon', 'shashtbhuj', 'षट्भुज', 'shashtha']);
  if (isHexagon) {
    const a = extractFirst(message, ['a', 'side', 's']) ?? null;
    if (a === null) return buildNeed(lang, lang === 'hi' ? 'Hexagon (षट्भुज)' : 'Hexagon', 'side (a)');
    
    const area = 6 * (Math.sqrt(3) / 4) * a * a;
    const perimeter = 6 * a;
    if (wantsPerimeter) {
      return buildFull(lang === 'hi' ? 'Hexagon ki Parimiti' : 'Perimeter of Hexagon', 'P = 6a', [
        `Given a = ${formatNumber(a)}`,
        `P = 6 × ${formatNumber(a)} = ${formatNumber(perimeter)}`,
      ], `${formatNumber(perimeter)} units`);
    }
    return buildFull(lang === 'hi' ? 'Hexagon ka Chhetrafal' : 'Area of Regular Hexagon', 'A = 6×(√3/4)×a²', [
      `Given a = ${formatNumber(a)}`,
      `A = 6 × (√3/4) × ${formatNumber(a)}²`,
      `A = 6 × 0.4330 × ${formatNumber(a * a)}`,
      `A = ${formatNumber(area)}`,
    ], `${formatNumber(area)} sq units`, `Perimeter = 6a = ${formatNumber(perimeter)}`);
  }

  // ═══ CUBE ═══
  const isCube = hasAny(q, ['cube', 'ghan', 'घन', 'ghanakar', 'घनाकार']);
  if (isCube) {
    const a = extractFirst(message, ['a', 'side', 's']) ?? null;
    if (a === null) return buildNeed(lang, lang === 'hi' ? 'Ghan (Cube)' : 'Cube', 'side (a)');

    if (wantsDiagonal) {
      const d = a * Math.sqrt(3);
      return buildFull(lang === 'hi' ? 'Ghan ka Vikarn' : 'Diagonal of Cube', 'd = a√3', [
        `Given a = ${formatNumber(a)}`,
        `d = ${formatNumber(a)} × √3 = ${formatNumber(d)}`,
      ], `${formatNumber(d)} units`);
    }

    if (wantsVolume && !wantsSurfaceArea) {
      const v = a * a * a;
      return buildFull(lang === 'hi' ? 'Ghan ka Aayatan' : 'Volume of Cube', 'V = a³', [
        `Given a = ${formatNumber(a)}`,
        `V = ${formatNumber(a)}³ = ${formatNumber(v)}`,
      ], `${formatNumber(v)} cubic units`, `Diagonal = a√3 = ${formatNumber(a * Math.sqrt(3))}`);
    }

    const sa = 6 * a * a;
    const v = a * a * a;
    return buildFull(lang === 'hi' ? 'Ghan (Cube)' : 'Cube', 'SA = 6a², V = a³', [
      `Given a = ${formatNumber(a)}`,
      `Surface Area = 6 × ${formatNumber(a)}² = 6 × ${formatNumber(a * a)} = **${formatNumber(sa)} sq units**`,
      `Volume = ${formatNumber(a)}³ = **${formatNumber(v)} cubic units**`,
      `Diagonal = a√3 = ${formatNumber(a * Math.sqrt(3))} units`,
    ], `SA = ${formatNumber(sa)} sq, V = ${formatNumber(v)} cu`);
  }

  // ═══ CUBOID ═══
  const isCuboid = hasAny(q, ['cuboid', 'ghanabh', 'घनाभ', 'aayatakar', 'आयताकार', 'rectangular prism', 'box']);
  if (isCuboid) {
    const l = extractFirst(message, ['l', 'length']) ?? null;
    const w = extractFirst(message, ['w', 'width', 'breadth', 'b']) ?? null;
    const h = extractFirst(message, ['h', 'height']) ?? null;
    if (l === null || w === null || h === null) return buildNeed(lang, lang === 'hi' ? 'Ghanabh (Cuboid)' : 'Cuboid', 'length (l), width (w), height (h)');

    const v = l * w * h;
    const tsa = 2 * (l * w + w * h + l * h);
    const diag = Math.sqrt(l * l + w * w + h * h);
    const walls = 2 * h * (l + w);

    if (wantsDiagonal) {
      return buildFull(lang === 'hi' ? 'Ghanabh ka Vikarn' : 'Diagonal of Cuboid', 'd = √(l²+b²+h²)', [
        `Given l=${formatNumber(l)}, w=${formatNumber(w)}, h=${formatNumber(h)}`,
        `d = √(${formatNumber(l * l)} + ${formatNumber(w * w)} + ${formatNumber(h * h)}) = ${formatNumber(diag)}`,
      ], `${formatNumber(diag)} units`);
    }

    if (wantsVolume && !wantsSurfaceArea) {
      return buildFull(lang === 'hi' ? 'Ghanabh ka Aayatan' : 'Volume of Cuboid', 'V = l×b×h', [
        `Given l=${formatNumber(l)}, w=${formatNumber(w)}, h=${formatNumber(h)}`,
        `V = ${formatNumber(l)} × ${formatNumber(w)} × ${formatNumber(h)} = ${formatNumber(v)}`,
      ], `${formatNumber(v)} cubic units`);
    }

    return buildFull(lang === 'hi' ? 'Ghanabh (Cuboid)' : 'Cuboid', 'TSA=2(lb+bh+lh), V=lbh', [
      `Given l=${formatNumber(l)}, w=${formatNumber(w)}, h=${formatNumber(h)}`,
      `TSA = 2(${formatNumber(l * w)}+${formatNumber(w * h)}+${formatNumber(l * h)}) = **${formatNumber(tsa)} sq units**`,
      `Volume = ${formatNumber(l)}×${formatNumber(w)}×${formatNumber(h)} = **${formatNumber(v)} cubic units**`,
      `Diagonal = √(l²+b²+h²) = ${formatNumber(diag)} units`,
      `4 walls = 2h(l+b) = ${formatNumber(walls)} sq units`,
    ], `TSA = ${formatNumber(tsa)} sq, V = ${formatNumber(v)} cu`);
  }

  // ═══ RECTANGLE ═══
  const isRectangle = hasAny(q, ['rectangle', 'aayat', 'आयत']);
  if (isRectangle) {
    const l = extractFirst(message, ['l', 'length']) ?? null;
    const w = extractFirst(message, ['w', 'width', 'breadth', 'b']) ?? null;
    if (l === null || w === null) return buildNeed(lang, lang === 'hi' ? 'Aayat (Rectangle)' : 'Rectangle', 'length (l) and width (w)');
    
    const area = l * w;
    const peri = 2 * (l + w);
    const diag = Math.sqrt(l * l + w * w);
    
    if (wantsPerimeter) {
      return buildFull(lang === 'hi' ? 'Aayat ki Parimiti' : 'Perimeter of Rectangle', 'P = 2(l+b)', [
        `Given l = ${formatNumber(l)}, b = ${formatNumber(w)}`,
        `P = 2 × (${formatNumber(l)} + ${formatNumber(w)}) = 2 × ${formatNumber(l + w)} = ${formatNumber(peri)}`,
      ], `${formatNumber(peri)} units`);
    }
    if (wantsDiagonal) {
      return buildFull(lang === 'hi' ? 'Aayat ka Vikarn' : 'Diagonal of Rectangle', 'd = √(l²+b²)', [
        `Given l = ${formatNumber(l)}, b = ${formatNumber(w)}`,
        `d = √(${formatNumber(l * l)} + ${formatNumber(w * w)}) = ${formatNumber(diag)}`,
      ], `${formatNumber(diag)} units`);
    }
    
    return buildFull(lang === 'hi' ? 'Aayat (Rectangle)' : 'Rectangle', 'A = l×b', [
      `Given l = ${formatNumber(l)}, b = ${formatNumber(w)}`,
      `Area = ${formatNumber(l)} × ${formatNumber(w)} = **${formatNumber(area)} sq units**`,
      `Perimeter = 2(l+b) = ${formatNumber(peri)} units`,
      `Diagonal = √(l²+b²) = ${formatNumber(diag)} units`,
    ], `${formatNumber(area)} sq units`);
  }

  // ═══ SQUARE ═══
  const isSquare = hasAny(q, ['square', 'varg', 'वर्ग']) && !hasAny(q, ['root', 'mul', 'मूल']);
  if (isSquare) {
    const a = extractFirst(message, ['a', 'side', 's']) ?? null;
    if (a === null) return buildNeed(lang, lang === 'hi' ? 'Varg (Square)' : 'Square', 'side (a)');
    
    const area = a * a;
    const peri = 4 * a;
    const diag = a * Math.sqrt(2);
    
    if (wantsPerimeter) {
      return buildFull(lang === 'hi' ? 'Varg ki Parimiti' : 'Perimeter of Square', 'P = 4a', [
        `Given a = ${formatNumber(a)}`,
        `P = 4 × ${formatNumber(a)} = ${formatNumber(peri)}`,
      ], `${formatNumber(peri)} units`);
    }
    if (wantsDiagonal) {
      return buildFull(lang === 'hi' ? 'Varg ka Vikarn' : 'Diagonal of Square', 'd = a√2', [
        `Given a = ${formatNumber(a)}`,
        `d = ${formatNumber(a)} × √2 = ${formatNumber(diag)}`,
      ], `${formatNumber(diag)} units`);
    }
    
    return buildFull(lang === 'hi' ? 'Varg (Square)' : 'Square', 'A = a²', [
      `Given a = ${formatNumber(a)}`,
      `Area = ${formatNumber(a)}² = **${formatNumber(area)} sq units**`,
      `Perimeter = 4a = ${formatNumber(peri)} units`,
      `Diagonal = a√2 = ${formatNumber(diag)} units`,
    ], `${formatNumber(area)} sq units`);
  }

  // ═══ TRIANGLE ═══
  const isTriangle = hasAny(q, ['triangle', 'trikon', 'त्रिकोण', 'tribhuj', 'tirbhuj', 'tarbuj', 'equilateral', 'sambaahu', 'samdvibaahu', 'isosceles', 'samkon', 'right angle']);
  if (isTriangle) {
    const isEquilateral = hasAny(q, ['equilateral', 'sambaahu', 'समबाहु', 'saambahu']);
    const isIsosceles = hasAny(q, ['isosceles', 'samdvibaahu', 'समद्विबाहु']);
    const isRight = hasAny(q, ['right', 'samkon', 'समकोण']);
    
    // Equilateral triangle
    if (isEquilateral) {
      const a = extractFirst(message, ['a', 'side', 's']) ?? null;
      if (a === null) return buildNeed(lang, lang === 'hi' ? 'Sambaahu Tribhuj' : 'Equilateral Triangle', 'side (a)');
      
      const area = (Math.sqrt(3) / 4) * a * a;
      const peri = 3 * a;
      const ht = (Math.sqrt(3) / 2) * a;
      
      return buildFull(lang === 'hi' ? 'Sambaahu Tribhuj (Equilateral)' : 'Equilateral Triangle', 'A = (√3/4)a², P = 3a, h = (√3/2)a', [
        `Given a = ${formatNumber(a)}`,
        `Area = (√3/4) × ${formatNumber(a)}² = (√3/4) × ${formatNumber(a * a)} = **${formatNumber(area)} sq units**`,
        `Perimeter = 3 × ${formatNumber(a)} = ${formatNumber(peri)} units`,
        `Height = (√3/2) × ${formatNumber(a)} = ${formatNumber(ht)} units`,
      ], `Area = ${formatNumber(area)} sq, P = ${formatNumber(peri)}, h = ${formatNumber(ht)}`);
    }

    const b = extractFirst(message, ['b', 'base']) ?? null;
    const h = extractFirst(message, ['h', 'height', 'altitude']) ?? null;
    if (b !== null && h !== null) {
      const area = 0.5 * b * h;
      return buildFull(lang === 'hi' ? 'Tribhuj ka Chhetrafal' : 'Area of Triangle', 'A = ½ × base × height', [
        `Given base = ${formatNumber(b)}, height = ${formatNumber(h)}`,
        `A = ½ × ${formatNumber(b)} × ${formatNumber(h)}`,
        `A = ${formatNumber(area)}`,
      ], `${formatNumber(area)} sq units`);
    }

    // Heron's formula with 3 numbers
    const nums = extractAnyNumber(message);
    if (nums.length >= 3) {
      const [a, b2, c] = nums;
      const s = (a + b2 + c) / 2;
      const under = s * (s - a) * (s - b2) * (s - c);
      if (under > 0) {
        const area = Math.sqrt(under);
        return buildFull(lang === 'hi' ? 'Heron se Chhetrafal' : "Heron's Formula", 'A = √(s(s−a)(s−b)(s−c))', [
          `Given a=${formatNumber(a)}, b=${formatNumber(b2)}, c=${formatNumber(c)}`,
          `s = (a+b+c)/2 = ${formatNumber(s)}`,
          `A = √(${formatNumber(s)}×${formatNumber(s - a)}×${formatNumber(s - b2)}×${formatNumber(s - c)})`,
          `A = √(${formatNumber(under)}) = ${formatNumber(area)}`,
        ], `${formatNumber(area)} sq units`, `Perimeter = a+b+c = ${formatNumber(a + b2 + c)}`);
      }
    }

    return buildNeed(lang, lang === 'hi' ? 'Tribhuj' : 'Triangle', 'base+height OR 3 sides');
  }

  // ═══ PARALLELOGRAM ═══
  const isParallelogram = hasAny(q, ['parallelogram', 'samantar chaturbhuj', 'समांतर चतुर्भुज', 'samantar']);
  if (isParallelogram) {
    const b = extractFirst(message, ['b', 'base']) ?? null;
    const h = extractFirst(message, ['h', 'height']) ?? null;
    if (b === null || h === null) return buildNeed(lang, lang === 'hi' ? 'Samantar Chaturbhuj' : 'Parallelogram', 'base (b) and height (h)');
    const area = b * h;
    return buildFull(lang === 'hi' ? 'Samantar Chaturbhuj' : 'Parallelogram', 'A = base × height', [
      `Given b = ${formatNumber(b)}, h = ${formatNumber(h)}`,
      `A = ${formatNumber(b)} × ${formatNumber(h)} = ${formatNumber(area)}`,
    ], `${formatNumber(area)} sq units`);
  }

  // ═══ TRAPEZIUM ═══
  const isTrapezium = hasAny(q, ['trapezium', 'trapezoid', 'samlamb', 'समलम्ब']);
  if (isTrapezium) {
    const a = extractFirst(message, ['a', 'base1', 'a1']) ?? null;
    const b = extractFirst(message, ['b', 'base2', 'b1']) ?? null;
    const h = extractFirst(message, ['h', 'height']) ?? null;
    if (a === null || b === null || h === null) return buildNeed(lang, lang === 'hi' ? 'Samlamb (Trapezium)' : 'Trapezium', 'parallel sides (a,b) and height (h)');
    const area = 0.5 * (a + b) * h;
    return buildFull(lang === 'hi' ? 'Samlamb Chaturbhuj (Trapezium)' : 'Trapezium', 'A = ½(a+b)×h', [
      `Given a = ${formatNumber(a)}, b = ${formatNumber(b)}, h = ${formatNumber(h)}`,
      `A = ½ × (${formatNumber(a)} + ${formatNumber(b)}) × ${formatNumber(h)}`,
      `A = ½ × ${formatNumber(a + b)} × ${formatNumber(h)}`,
      `A = ${formatNumber(area)}`,
    ], `${formatNumber(area)} sq units`);
  }

  // ═══ RHOMBUS ═══
  const isRhombus = hasAny(q, ['rhombus', 'samchatur', 'समचतुर्भुज']);
  if (isRhombus) {
    const d1 = extractFirst(message, ['d1', 'diagonal1']) ?? null;
    const d2 = extractFirst(message, ['d2', 'diagonal2']) ?? null;
    if (d1 === null || d2 === null) return buildNeed(lang, lang === 'hi' ? 'Samchaturhbuj (Rhombus)' : 'Rhombus', 'diagonals d1 and d2');
    const area = 0.5 * d1 * d2;
    const side = 0.5 * Math.sqrt(d1 * d1 + d2 * d2);
    const peri = 4 * side;
    return buildFull(lang === 'hi' ? 'Samchaturhbuj (Rhombus)' : 'Rhombus', 'A = ½×d1×d2', [
      `Given d1 = ${formatNumber(d1)}, d2 = ${formatNumber(d2)}`,
      `Area = ½ × ${formatNumber(d1)} × ${formatNumber(d2)} = **${formatNumber(area)} sq units**`,
      `Side = ½√(d1²+d2²) = ${formatNumber(side)} units`,
      `Perimeter = 4 × side = ${formatNumber(peri)} units`,
    ], `Area = ${formatNumber(area)} sq, Perimeter = ${formatNumber(peri)}`);
  }

  // ═══ ELLIPSE ═══
  const isEllipse = hasAny(q, ['ellipse', 'oval', 'dirghavrtt']);
  if (isEllipse) {
    const a = extractFirst(message, ['a', 'semi major', 'semimajor', 'major']) ?? null;
    const b = extractFirst(message, ['b', 'semi minor', 'semiminor', 'minor']) ?? null;
    if (a === null || b === null) return buildNeed(lang, 'Ellipse', 'semi-major (a) and semi-minor (b)');
    const area = PI * a * b;
    const circ = PI * (3 * (a + b) - Math.sqrt((a + 3 * b) * (b + 3 * a)));
    return buildFull(lang === 'hi' ? 'Ellipse (दीर्घवृत्त)' : 'Ellipse', 'A = πab', [
      `Given a = ${formatNumber(a)}, b = ${formatNumber(b)}`,
      `Area = π × ${formatNumber(a)} × ${formatNumber(b)} = **${formatNumber(area)} sq units**`,
      `Circumference ≈ π[3(a+b)−√((a+3b)(b+3a))] ≈ ${formatNumber(circ)} units`,
    ], `Area = ${formatNumber(area)} sq`);
  }

  // ══ FALLBACK MENU — shape not recognized ══
  if (lang === 'hi') {
    return [
      '### 📐 Geometry Formulas – Shape + Values bhejo',
      '',
      '**2D Shapes:**',
      '- Circle: A=πr², C=2πr',
      '- Semicircle: A=½πr², P=(π+2)r',
      '- Rectangle: A=l×b, P=2(l+b), d=√(l²+b²)',
      '- Square: A=a², P=4a, d=a√2',
      '- Triangle: A=½bh (ya Heron), P=a+b+c',
      '- Equilateral △: A=(√3/4)a², P=3a',
      '- Parallelogram: A=b×h, P=2(a+b)',
      '- Trapezium: A=½(a+b)h',
      '- Rhombus: A=½d1×d2, P=4a',
      '- Hexagon: A=6×(√3/4)a²',
      '- Sector: A=(θ/360)πr²',
      '',
      '**3D Shapes:**',
      '- Cube: SA=6a², V=a³',
      '- Cuboid: TSA=2(lb+bh+lh), V=lbh',
      '- Cylinder: CSA=2πrh, TSA=2πr(r+h), V=πr²h',
      '- Cone: CSA=πrl, V=(1/3)πr²h',
      '- Sphere: SA=4πr², V=(4/3)πr³',
      '- Hemisphere: CSA=2πr², TSA=3πr², V=(2/3)πr³',
      '- Prism: V=Base area×h',
      '- Pyramid: V=(1/3)×Base area×h',
      '- Frustum: V=(1/3)πh(R²+r²+Rr)',
      '',
      "**Example:** 'cylinder volume r=7 h=10' ya 'cone area r=5 h=12'",
    ].join('\n');
  }

  return [
    '### 📐 Geometry Formulas – Send shape + values',
    '',
    '**2D Shapes:**',
    '- Circle: A=πr², C=2πr',
    '- Semicircle: A=½πr², P=(π+2)r',
    '- Rectangle: A=l×b, P=2(l+b), d=√(l²+b²)',
    '- Square: A=a², P=4a, d=a√2',
    '- Triangle: A=½bh (or Heron), P=a+b+c',
    '- Equilateral △: A=(√3/4)a², P=3a',
    '- Parallelogram: A=b×h',
    '- Trapezium: A=½(a+b)h',
    '- Rhombus: A=½d1×d2',
    '- Hexagon: A=6×(√3/4)a²',
    '- Sector: A=(θ/360)πr²',
    '',
    '**3D Shapes:**',
    '- Cube: SA=6a², V=a³',
    '- Cuboid: TSA=2(lb+bh+lh), V=lbh',
    '- Cylinder: CSA=2πrh, TSA=2πr(r+h), V=πr²h',
    '- Cone: CSA=πrl, V=(1/3)πr²h',
    '- Sphere: SA=4πr², V=(4/3)πr³',
    '- Hemisphere: CSA=2πr², TSA=3πr², V=(2/3)πr³',
    '- Prism: V=Base area×h',
    '- Pyramid: V=(1/3)×Base area×h',
    '- Frustum: V=(1/3)πh(R²+r²+Rr)',
    '',
    "**Example:** 'cylinder volume r=7 h=10' or 'cone area r=5 h=12'",
  ].join('\n');
};
