export interface KnowledgeItem {
  id: string;
  patterns: string[]; // Keywords or phrases to match
  answer: {
    en: string;
    hi: string; // Hindi or Hinglish
  };
  suggestedTools?: string[]; // IDs of tools to recommend
}

export const customKnowledge: KnowledgeItem[] = [
  {
    id: 'greeting',
    patterns: ['hello', 'hi', 'hey', 'namaste', 'kaise ho', 'how are you'],
    answer: {
      en: "Hello! I’m your AI assistant for Calculator Loop. Ask me about any category—finance, health, math, education, construction, technology, and more.",
      hi: "Namaste! Main Calculator Loop ka AI assistant hoon. Aap kisi bhi category (finance, health, math, education, construction, technology, etc.) ke calculator ya formula ke baare mein pooch sakte hain."
    }
  },
  {
    id: 'who_are_you',
    patterns: ['who are you', 'tum kaun ho', 'kya karte ho', 'what do you do'],
    answer: {
      en: "I’m the AI assistant for Calculator Loop. I help you find the right calculator, explain formulas, and calculate results when you share the values.",
      hi: "Main Calculator Loop ka AI assistant hoon. Main aapko sahi calculator dhoondhne, formulas samjhane, aur values dene par calculation karke result batane mein madad karta hoon."
    }
  },
  {
    id: 'sip_definition',
    patterns: ['what is sip', 'sip kya hai', 'sip meaning'],
    answer: {
      en: "SIP (Systematic Investment Plan) allows you to invest small amounts regularly in mutual funds. It helps in rupee cost averaging and compounding.",
      hi: "SIP (Systematic Investment Plan) aapko mutual funds mein niyamit roop se choti rakam nivesh karne ki suvidha deta hai. Ye lambe samay mein wealth create karne mein madad karta hai."
    },
    suggestedTools: ['sip-calculator', 'advanced-sip-calculator']
  },
  {
    id: 'loan_process',
    patterns: ['how to get loan', 'loan kaise le', 'loan process'],
    answer: {
      en: "To get a loan, you typically need a good credit score, income proof, and KYC documents. Check your eligibility first.",
      hi: "Loan lene ke liye aapka credit score accha hona chahiye aur income proof documents zaroori hain. Pehle apni eligibility check karein."
    },
    suggestedTools: ['personal-loan-eligibility', 'home-loan-eligibility']
  },
  {
    id: 'math_tutor_class_12',
    patterns: ['12th math', '12th maths', 'class 12 math', 'class 12 maths', 'board math', 'ganit 12', 'math formula bata', 'maths formula bata'],
    answer: {
      en: "Yes — I can help with Class 9–12 level math: formulas, step-by-step solutions, derivatives, integrals (numeric), equations, AP/GP, binomial theorem, permutations/combination, coordinate geometry, vectors, matrices basics, and more.\n\nBest way to ask:\n1) Write the exact question OR\n2) Write: \"solve: ...\" / \"simplify: ...\" / \"derivative of ...\" / \"integrate ... from a to b\" OR\n3) Ask: \"<topic> formula\" (example: \"quadratic formula\", \"AP sum formula\", \"nCr formula\").\n\nIf you share your steps, I can also verify them.",
      hi: "Haan — main Class 9–12 level maths me help kar sakta hoon: formulas, step-by-step solution, equations solve, derivative, integral (numeric), AP/GP, binomial theorem, permutation/combination, coordinate geometry, vectors, matrices basics, etc.\n\nBest tareeqa:\n1) Exact question likho OR\n2) Aise likho: \"solve: ...\" / \"simplify: ...\" / \"derivative of ...\" / \"integrate ... from a to b\" OR\n3) Aise poochho: \"<topic> formula\" (jaise: \"quadratic formula\", \"AP sum formula\", \"nCr formula\").\n\nAap apne steps bhej doge to main verify bhi kar dunga."
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 19. संख्याएँ (Numbers) — Sum formulas, division rules
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'numbers_sum_formulas',
    patterns: [
      'lagatar prakrit sankhya ka yog',
      'consecutive natural numbers sum',
      'sum of natural numbers',
      'natural numbers ka yog',
      'prakrit sankhya yog',
      '1 se n tak ka yog',
      'sum of first n numbers',
      'sum of consecutive numbers',
      'lagatar sankhya ka yog',
      'sankhya ka yog formula',
      'numbers sum formula',
      'sum of squares formula',
      'varg ka yog',
      'sum of cubes formula',
      'ghan ka yog',
      'sam sankhya ka yog',
      'sum of even numbers',
      'vishm sankhya ka yog',
      'sum of odd numbers',
      'sankhyaen formula',
      'numbers formula hindi'
    ],
    answer: {
      en: "## Numbers (संख्याएँ) — Sum Formulas\n\n**1. Sum of first n consecutive natural numbers:**\n`= n(n+1)/2`\n\n**2. Sum of consecutive even numbers:**\n`= n(n/2 + 1)/2`\n\n**3. Sum of consecutive odd numbers:**\n`= (n/2 + 1)²`\n\n**4. When common difference is equal (AP):**\n`Sum = (Number of terms / 2) × (First term + Last term)`\n\n**5. Sum of squares of first n natural numbers:**\n`= n(n+1)(2n+1)/6`\n\n**6. Sum of cubes of first n natural numbers:**\n`= [n(n+1)/2]²`\n\n**7. Sum of first n even numbers:**\n`= n(n+1)`\n\n**8. Sum of first n odd numbers:**\n`= n²`\n\nExample: Sum of 1 to 100 = 100×101/2 = **5050**",
      hi: "## संख्याएँ — योग के सूत्र\n\n**1. लगातार प्राकृत संख्याओं का योग:**\n`= n(n+1)/2`\n\n**2. लगातार सम संख्याओं का योग:**\n`= n(n/2 + 1)/2`\n\n**3. लगातार विषम संख्याओं का योग:**\n`= (n/2 + 1)²`\n\n**4. दो क्रमागत पदों का अन्तर समान हो तो:**\n`योग = (पदों की संख्या / 2) × (पहला पद + अन्तिम पद)`\n\n**5. प्राकृत संख्याओं के वर्गों का योग:**\n`= n(n+1)(2n+1)/6`\n\n**6. प्राकृत संख्याओं के घनों का योग:**\n`= [n(n+1)/2]²`\n\n**7. प्रथम n सम संख्याओं का योग:**\n`= n(n+1)`\n\n**8. प्रथम n विषम संख्याओं का योग:**\n`= n²`\n\nExample: 1 se 100 tak ka yog = 100×101/2 = **5050**"
    }
  },
  {
    id: 'division_rules',
    patterns: [
      'bhagfal formula',
      'bhajya bhajak',
      'division formula hindi',
      'quotient remainder formula',
      'bhajya bhajak bhagfal',
      'vibhajan formula',
      'division rules',
      'poorn vibhajan',
      'apoorn vibhajan',
      'sheshfal formula',
      'remainder formula'
    ],
    answer: {
      en: "## Division Rules (विभाजन के नियम)\n\n### Complete Division (पूर्ण विभाजन):\n- **Quotient** = Dividend ÷ Divisor\n- **Dividend** = Quotient × Divisor\n- **Divisor** = Dividend ÷ Quotient\n\n### Incomplete Division (अपूर्ण विभाजन):\n- **Quotient** = (Dividend − Remainder) ÷ Divisor\n- **Dividend** = Quotient × Divisor + Remainder\n- **Divisor** = (Dividend − Remainder) ÷ Quotient\n\nExample: 17 ÷ 5 → Quotient=3, Remainder=2\nCheck: 3×5 + 2 = **17** ✓",
      hi: "## विभाजन के नियम\n\n### पूर्ण विभाजन:\n- **भागफल** = भाज्य ÷ भाजक\n- **भाज्य** = भागफल × भाजक\n- **भाजक** = भाज्य ÷ भागफल\n\n### अपूर्ण विभाजन:\n- **भागफल** = (भाज्य − शेषफल) ÷ भाजक\n- **भाज्य** = भागफल × भाजक + शेषफल\n- **भाजक** = (भाज्य − शेषफल) ÷ भागफल\n\nExample: 17 ÷ 5 → भागफल=3, शेषफल=2\nJanch: 3×5 + 2 = **17** ✓"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 20. HCF & LCM (म.स. और ल.स.)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'hcf_lcm_formulas',
    patterns: [
      'hcf lcm formula',
      'hcf and lcm',
      'lcm hcf',
      'mahatam samapvartak',
      'laghutam samapvartya',
      'mas aur las',
      'hcf lcm relation',
      'lcm of fractions',
      'hcf of fractions',
      'bhinnon ka lcm',
      'bhinnon ka hcf',
      'lcm formula',
      'hcf formula',
      'lcm kaise nikale',
      'hcf kaise nikale',
      'las mas formula',
      'lcm hcf ka sambandh',
      'product of two numbers lcm hcf'
    ],
    answer: {
      en: "## HCF & LCM Formulas (म.स. और ल.स.)\n\n**1. LCM of Fractions:**\n`LCM = LCM of Numerators / HCF of Denominators`\n\n**2. HCF of Fractions:**\n`HCF = HCF of Numerators / LCM of Denominators`\n\n**3. Important Relation:**\n`LCM × HCF = First Number × Second Number`\n\n**4. Find LCM:**\n`LCM = (First Number × Second Number) / HCF`\n\n**5. Find HCF:**\n`HCF = (First Number × Second Number) / LCM`\n\n**6. Find First Number:**\n`= (LCM × HCF) / Second Number`\n\n**7. Find Second Number:**\n`= (LCM × HCF) / First Number`\n\nExample: Two numbers are 12 and 18\nHCF = 6, LCM = 36\nCheck: 6 × 36 = 216 = 12 × 18 ✓",
      hi: "## म.स. और ल.स. के सूत्र (HCF & LCM)\n\n**1. भिन्नों का ल.स. (LCM):**\n`= अंशों का ल.स. / हरों का म.स.`\n\n**2. भिन्नों का म.स. (HCF):**\n`= अंशों का म.स. / हरों का ल.स.`\n\n**3. महत्वपूर्ण सम्बन्ध:**\n`ल.स. × म.स. = पहली संख्या × दूसरी संख्या`\n\n**4. ल.स. निकालें:**\n`= (पहली संख्या × दूसरी संख्या) / म.स.`\n\n**5. म.स. निकालें:**\n`= (पहली संख्या × दूसरी संख्या) / ल.स.`\n\n**6. पहली संख्या:**\n`= (ल.स. × म.स.) / दूसरी संख्या`\n\n**7. दूसरी संख्या:**\n`= (ल.स. × म.स.) / पहली संख्या`\n\nExample: Do sankhyayen 12 aur 18\nm.s. = 6, l.s. = 36\nJanch: 6 × 36 = 216 = 12 × 18 ✓"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 21. अनुपात और समानुपात (Ratio & Proportion)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'ratio_proportion_formulas',
    patterns: [
      'ratio and proportion',
      'anupat aur samanupat',
      'ratio formula',
      'proportion formula',
      'anupat formula',
      'samanupat formula',
      'madhyanupat',
      'mean proportional',
      'trityanupat',
      'third proportional',
      'vilomanupat',
      'inverse ratio',
      'a b c d proportion',
      'ad bc formula',
      'anupat kya hota hai',
      'ratio kya hota hai'
    ],
    answer: {
      en: "## Ratio & Proportion (अनुपात और समानुपात)\n\n**1. Ratio:** x : y = x/y\n\n**2. Compound Ratio:**\nA:D = (A/B) × (B/C) × (C/D)\n\n**3. If A : B :: C : D (Proportion), then:**\n- (a) AD = BC (Product of extremes = Product of means)\n- (b) A = BC/D\n- (c) B = AD/C\n- (d) C = AD/B\n- (e) D = BC/A\n\n**4. Mean Proportional of x and y:**\n`= √(x × y)`\n\n**5. Third Proportional of x and y:**\n`= y²/x`\n\n**6. Inverse Ratio:**\n`x:y ka inverse = (1/x) : (1/y) = y : x`\n\nExample: If 2:3 :: 4:x, then x = (3×4)/2 = **6**",
      hi: "## अनुपात और समानुपात (Ratio & Proportion)\n\n**1. अनुपात:** x : y = x/y\n\n**2. मिश्र अनुपात:**\nA:D = (A/B) × (B/C) × (C/D)\n\n**3. यदि A : B :: C : D (समानुपात), तो:**\n- (a) AD = BC (बाह्य पदों का गुणनफल = मध्य पदों का गुणनफल)\n- (b) A = BC/D\n- (c) B = AD/C\n- (d) C = AD/B\n- (e) D = BC/A\n\n**4. x तथा y के बीच मध्यानुपात:**\n`= √(x × y)`\n\n**5. x तथा y के बीच तृतीयानुपात:**\n`= y²/x`\n\n**6. x तथा y का विलोमानुपात:**\n`= (1/x) : (1/y) = y : x`\n\nExample: Agar 2:3 :: 4:x, toh x = (3×4)/2 = **6**"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 22. औसत (Average)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'average_formulas',
    patterns: [
      'average formula',
      'ausat formula',
      'average kaise nikale',
      'ausat kaise nikale',
      'average of natural numbers',
      'prakrit sankhya ki ausat',
      'average of even numbers',
      'sam sankhya ki ausat',
      'average of odd numbers',
      'vishm sankhya ki ausat',
      'average speed formula',
      'ausat chal formula',
      'ausat gati',
      'average of consecutive numbers',
      'lagatar sankhya ki ausat',
      'mean formula',
      'arithmetic mean'
    ],
    answer: {
      en: "## Average (औसत) Formulas\n\n**Basic Formula:**\n`Average = Sum of all values / Number of values`\n\n**1. Average of first n natural numbers:**\n`= (n+1)/2`\n\n**2. Average of first n whole numbers (0 to n):**\n`= n/2`\n\n**3. Average of first n even numbers:**\n`= n + 1`\n\n**4. Average of first n odd numbers:**\n`= n`\n\n**5. Average of consecutive numbers with equal difference:**\n`= (First number + Last number) / 2`\n\n### Average Speed:\n**6. Two equal distances at different speeds (a, b):**\n`Average Speed = 2ab / (a + b)`\n\n**7. Three equal distances at speeds (a, b, c):**\n`Average Speed = 3abc / (ab + bc + ac)`\n\nExample: Average of 1 to 50 = (50+1)/2 = **25.5**\nExample: Speed 40 km/h going, 60 km/h returning → Avg = 2×40×60/(40+60) = **48 km/h**",
      hi: "## औसत (Average) के सूत्र\n\n**मूल सूत्र:**\n`औसत = राशियों का योग / राशियों की संख्या`\n\n**1. लगातार n प्राकृत संख्याओं की औसत:**\n`= (n+1)/2`\n\n**2. लगातार n पूर्ण संख्याओं की औसत (0 se n):**\n`= n/2`\n\n**3. लगातार n सम संख्याओं की औसत:**\n`= n + 1`\n\n**4. लगातार n विषम संख्याओं की औसत:**\n`= n`\n\n**5. क्रमागत संख्याओं/पदों (समान अन्तर) की औसत:**\n`= (पहली संख्या + अन्तिम संख्या) / 2`\n\n### औसत चाल:\n**6. दो समान दूरियाँ अलग-अलग चाल (a, b) से:**\n`औसत चाल = 2ab / (a + b)`\n\n**7. तीन समान दूरियाँ अलग-अलग चाल (a, b, c) से:**\n`औसत चाल = 3abc / (ab + bc + ac)`\n\nExample: 1 se 50 ki ausat = (50+1)/2 = **25.5**\nExample: Jaate waqt 40 km/h, aate waqt 60 km/h → Avg = 2×40×60/(40+60) = **48 km/h**"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 23. प्रतिशत (Percentage)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'percentage_formulas',
    patterns: [
      'percentage formula',
      'pratishat formula',
      'pratishat kaise nikale',
      'percent kaise nikale',
      'percentage increase formula',
      'percentage decrease formula',
      'pratishat vriddhi',
      'pratishat kami',
      'x ka y percent',
      'fraction to percentage',
      'percentage to fraction',
      'bhinn ko pratishat mein',
      'pratishat ko bhinn mein',
      'percent badha hua man',
      'percent ghata hua man',
      'increase decrease percentage'
    ],
    answer: {
      en: "## Percentage (प्रतिशत) Formulas\n\n**1. Fraction to Percentage:**\n`= (x/y) × 100%`\n\n**2. x as percentage of y:**\n`= (x × 100) / y %`\ny as percentage of x: `= (y × 100) / x %`\n\n**3. Percentage to Fraction:**\n`Divide by 100 and remove % sign`\n\n**4. x% of y:**\n`= (x × y) / 100`\n\n**5. If x is increased by a%:**\n`New value = x + (x × a)/100 = x(1 + a/100)`\n\n**6. If x is decreased by a%:**\n`New value = x − (x × a)/100 = x(1 − a/100)`\n\nExample: 25% of 800 = (25×800)/100 = **200**\nExample: 500 increased by 20% = 500×(1+20/100) = 500×1.2 = **600**\nExample: 500 decreased by 20% = 500×(1−20/100) = 500×0.8 = **400**",
      hi: "## प्रतिशत (Percentage) के सूत्र\n\n**1. साधारण भिन्न को प्रतिशत में:**\n`= (x/y) × 100%`\n\n**2. x को y के प्रतिशत रूप में:**\n`= (x × 100) / y %`\ny को x के रूप में: `= (y × 100) / x %`\n\n**3. प्रतिशत को भिन्न में:**\n`100 से भाग दो और % हटा दो`\n\n**4. x का y%:**\n`= (x × y) / 100`\n\n**5. यदि x में a% की वृद्धि हो:**\n`बढ़ा हुआ मान = x + (x × a)/100 = x(1 + a/100)`\n\n**6. यदि x में a% की कमी हो:**\n`घटा हुआ मान = x − (x × a)/100 = x(1 − a/100)`\n\nExample: 800 ka 25% = (25×800)/100 = **200**\nExample: 500 mein 20% vriddhi = 500×1.2 = **600**\nExample: 500 mein 20% kami = 500×0.8 = **400**"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 24. लाभ और हानि (Profit & Loss)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'profit_loss_formulas',
    patterns: [
      'profit and loss formula',
      'labh aur hani',
      'labh hani formula',
      'profit loss formula',
      'selling price formula',
      'cost price formula',
      'vikray mulya formula',
      'kray mulya formula',
      'labh pratishat',
      'hani pratishat',
      'profit percentage formula',
      'loss percentage formula',
      'cp sp formula',
      'profit kaise nikale',
      'loss kaise nikale',
      'labh kaise nikale',
      'hani kaise nikale',
      'selling price from profit',
      'cost price from loss'
    ],
    answer: {
      en: "## Profit & Loss (लाभ और हानि) Formulas\n\n**Basic:**\n1. **Profit** = SP − CP (when SP > CP)\n2. **Loss** = CP − SP (when SP < CP)\n3. **SP** = CP + Profit (when SP > CP)\n4. **SP** = CP − Loss (when SP < CP)\n5. **CP** = SP − Profit\n6. **CP** = Loss + SP\n\n**Percentage:**\n7. **Profit%** = (Profit × 100) / CP\n8. **Loss%** = (Loss × 100) / CP\n\n**SP from Profit%:**\n9. `SP = CP × (1 + Profit%/100)`\n\n**SP from Loss%:**\n10. `SP = CP × (1 − Loss%/100)`\n\n**CP from SP & Profit%:**\n11. `CP = SP / (1 + Profit%/100)`\n\n**CP from SP & Loss%:**\n12. `CP = SP / (1 − Loss%/100)`\n\nExample: CP=500, SP=600 → Profit=100, Profit%=(100×100)/500 = **20%**\nExample: CP=800, Loss 10% → SP=800×(1−10/100) = **₹720**",
      hi: "## लाभ और हानि (Profit & Loss) के सूत्र\n\n**मूल सूत्र:**\n1. **लाभ** = विक्रय मूल्य − क्रय मूल्य (जब SP > CP)\n2. **हानि** = क्रय मूल्य − विक्रय मूल्य (जब SP < CP)\n3. **विक्रय मूल्य** = क्रय मूल्य + लाभ\n4. **विक्रय मूल्य** = क्रय मूल्य − हानि\n5. **क्रय मूल्य** = विक्रय मूल्य − लाभ\n6. **क्रय मूल्य** = हानि + विक्रय मूल्य\n\n**प्रतिशत:**\n7. **लाभ%** = (लाभ × 100) / क्रय मूल्य\n8. **हानि%** = (हानि × 100) / क्रय मूल्य\n\n**विक्रय मूल्य (लाभ% से):**\n9. `SP = CP × (1 + लाभ%/100)`\n\n**विक्रय मूल्य (हानि% से):**\n10. `SP = CP × (1 − हानि%/100)`\n\n**क्रय मूल्य (SP और लाभ% से):**\n11. `CP = SP / (1 + लाभ%/100)`\n\n**क्रय मूल्य (SP और हानि% से):**\n12. `CP = SP / (1 − हानि%/100)`\n\nExample: CP=500, SP=600 → Labh=100, Labh%=(100×100)/500 = **20%**\nExample: CP=800, Hani 10% → SP=800×0.9 = **₹720**"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // 25. साधारण ब्याज (Simple Interest)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'simple_interest_formulas',
    patterns: [
      'simple interest formula',
      'sadharan byaj',
      'sadharan byaj formula',
      'si formula',
      'simple interest kaise nikale',
      'byaj kaise nikale',
      'mooldhani formula',
      'mishradhan formula',
      'principal from interest',
      'rate from interest',
      'time from interest',
      'byaj dar formula',
      'samay formula',
      'amount formula simple interest',
      'mishradhan kaise nikale',
      'prt/100',
      'si = prt'
    ],
    answer: {
      en: "## Simple Interest (साधारण ब्याज) Formulas\n\n**1. Simple Interest:**\n`SI = (P × R × T) / 100`\nwhere P = Principal, R = Rate%, T = Time (years)\n\n**2. Principal:**\n`P = (SI × 100) / (R × T)`\n\n**3. Rate:**\n`R = (SI × 100) / (P × T)`\n\n**4. Time:**\n`T = (SI × 100) / (P × R)`\n\n**5. Amount (Mishradan):**\n`A = P + SI = P + (P×R×T)/100`\n`A = P × (100 + R×T) / 100`\n\n**6. Principal from Amount:**\n`P = A − SI`\n\n**7. SI from Amount:**\n`SI = A − P`\n\nExample: P=₹10,000, R=8%, T=3 years\nSI = (10000×8×3)/100 = **₹2,400**\nAmount = 10000 + 2400 = **₹12,400**",
      hi: "## साधारण ब्याज (Simple Interest) के सूत्र\n\n**1. साधारण ब्याज:**\n`ब्याज = (मूलधन × दर × समय) / 100`\n\n**2. मूलधन:**\n`मूलधन = (ब्याज × 100) / (दर × समय)`\n\n**3. दर:**\n`दर = (ब्याज × 100) / (मूलधन × समय)`\n\n**4. समय:**\n`समय = (ब्याज × 100) / (मूलधन × दर)`\n\n**5. मिश्रधन (Amount):**\n`मिश्रधन = मूलधन + ब्याज`\n`= मूलधन × (100 + दर×समय) / 100`\n\n**6. मूलधन (मिश्रधन से):**\n`मूलधन = मिश्रधन − ब्याज`\n\n**7. ब्याज (मिश्रधन से):**\n`ब्याज = मिश्रधन − मूलधन`\n\nExample: मूलधन=₹10,000, दर=8%, समय=3 साल\nब्याज = (10000×8×3)/100 = **₹2,400**\nमिश्रधन = 10000 + 2400 = **₹12,400**"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // Combined quick-reference: All basic math formulas
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'all_basic_math_formulas',
    patterns: [
      'all math formula',
      'sabhi ganit sutra',
      'basic math formulas',
      'math ke sare formula',
      'ganit ke formula',
      'competitive math formula',
      'ssc math formula',
      'bank exam math formula',
      'railway math formula',
      'math shortcut formula'
    ],
    answer: {
      en: "## All Basic Math Formulas (Quick Reference)\n\n**Numbers:** Sum of 1 to n = n(n+1)/2 | Squares sum = n(n+1)(2n+1)/6 | Cubes sum = [n(n+1)/2]²\n\n**HCF & LCM:** LCM×HCF = Num1×Num2 | LCM(fractions) = LCM(num)/HCF(den)\n\n**Average:** Avg = Sum/Count | Avg speed (2 dist) = 2ab/(a+b)\n\n**Percentage:** x% of y = xy/100 | Increase a% → x(1+a/100) | Decrease a% → x(1−a/100)\n\n**Profit & Loss:** Profit% = (Profit×100)/CP | SP = CP(1+P%/100) | Loss: SP = CP(1−L%/100)\n\n**Simple Interest:** SI = PRT/100 | Amount = P + SI\n\n**Ratio:** If A:B::C:D → AD=BC | Mean proportional = √(xy)\n\nAsk me any specific topic for detailed formulas with examples!",
      hi: "## Sabhi Basic Math Formulas (Quick Reference)\n\n**संख्याएँ:** 1 se n ka yog = n(n+1)/2 | Varg ka yog = n(n+1)(2n+1)/6 | Ghan ka yog = [n(n+1)/2]²\n\n**म.स. & ल.स.:** LCM×HCF = Sankhya1×Sankhya2 | Bhinnon ka LCM = ansh ka LCM / har ka HCF\n\n**औसत:** Ausat = Yog/Sankhya | Ausat chal (2 doori) = 2ab/(a+b)\n\n**प्रतिशत:** x ka y% = xy/100 | a% vriddhi → x(1+a/100) | a% kami → x(1−a/100)\n\n**लाभ-हानि:** Labh% = (Labh×100)/CP | SP = CP(1+L%/100) | Hani: SP = CP(1−H%/100)\n\n**साधारण ब्याज:** SI = PRT/100 | Mishradhan = P + SI\n\n**अनुपात:** A:B::C:D → AD=BC | Madhyanupat = √(xy)\n\nKisi bhi topic pe detail mein puchho — step-by-step samjhaunga!"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // GEOMETRY — Formulas overview (actual solving done by geometryAreaResponder)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'geometry_formulas',
    patterns: [
      'geometry formula',
      'geometry ke formula',
      'jyamiti sutra',
      'kshetramiti formula',
      'mensuration formula',
      'kshetrafal formula',
      'area volume formula',
      'all geometry formula',
      'shapes formula',
      'aakar ke formula',
      '2d 3d shapes formula',
      'geometry ke sare formula'
    ],
    answer: {
      en: "## Geometry Formulas — I can solve ALL of these!\n\n**2D:** Circle, Semicircle, Sector, Segment, Rectangle, Square, Triangle, Parallelogram, Trapezium, Rhombus, Hexagon, Ellipse, Ring\n\n**3D:** Cube, Cuboid, Cylinder, Cone, Sphere, Hemisphere, Prism, Pyramid, Frustum\n\n**I calculate:** Area, Perimeter, Volume, CSA, TSA, LSA, Diagonal, Slant Height\n\n**How to ask:** Just type shape name + values!\nExample: 'cylinder volume r=7 h=10' or 'cone area r=5 h=12' or 'rectangle perimeter l=8 b=5'",
      hi: "## Geometry Formulas — Main ye sab solve kar sakta hoon!\n\n**2D:** Circle, Semicircle, Sector, Segment, Rectangle, Square, Triangle, Parallelogram, Trapezium, Rhombus, Hexagon, Ellipse, Ring\n\n**3D:** Cube, Cuboid, Cylinder, Cone, Sphere, Hemisphere, Prism, Pyramid, Frustum\n\n**Main calculate karta hoon:** Area, Perimeter, Volume, CSA, TSA, LSA, Diagonal, Slant Height\n\n**Kaise poochein:** Shape ka naam + values likho!\nExample: 'cylinder volume r=7 h=10' ya 'cone area r=5 h=12' ya 'rectangle perimeter l=8 b=5'"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // ALGEBRA — Identity overview (actual solving by algebraIdentityResponder)
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'algebra_identity_help',
    patterns: [
      'algebra identity',
      'algebra ke sutra',
      'beejganit sutra',
      'sarvasamika',
      'sarvsamika',
      'algebra formula list',
      'identity formula',
      'pahchan formula',
      'sarvasamika formula',
      'a plus b whole square',
      'a minus b whole square',
      'a plus b ka varg',
      'algebra help'
    ],
    answer: {
      en: "## Algebra Identities — I know ALL 25+ identities!\n\n**(a+b)²**, **(a−b)²**, **a²−b²**, **(a+b)³**, **(a−b)³**, **a³+b³**, **a³−b³**, **(a+b+c)²**, **a³+b³+c³−3abc**, exponent rules, and more!\n\nI can:\n1. Expand identities with your values\n2. Solve exam problems step-by-step\n3. Show tricks for quick calculation\n\n**How to ask:** '(a+b)² a=3 b=5' or 'expand (a-b)³' or 'a²-b² a=12 b=8' or 'all identities list'",
      hi: "## Algebra Identities — Main sabhi 25+ identities jaanta hoon!\n\n**(a+b)²**, **(a−b)²**, **a²−b²**, **(a+b)³**, **(a−b)³**, **a³+b³**, **a³−b³**, **(a+b+c)²**, **a³+b³+c³−3abc**, ghaataank niyam, aur bahut kuch!\n\nMain ye kar sakta hoon:\n1. Values dein to expand karke dikhaunga\n2. Exam problems step-by-step solve karunga\n3. Quick calculation ki tricks bataunga\n\n**Kaise poochein:** '(a+b)² a=3 b=5' ya 'expand (a-b)³' ya 'a²-b² a=12 b=8' ya 'all identities list'"
    }
  },

  // ═══════════════════════════════════════════════════════════════
  // REFERENCE TABLES — Squares, Cubes, Roots, Tables
  // ═══════════════════════════════════════════════════════════════
  {
    id: 'reference_tables_help',
    patterns: [
      'square table',
      'cube table',
      'varg table',
      'ghan table',
      'pahada',
      'multiplication table',
      'tables batao',
      'square root table',
      'cube root table',
      'vargmul table',
      'ghanmul table',
      'powers of 2',
      'powers table',
      '2 ki ghat'
    ],
    answer: {
      en: "## Reference Tables — I can generate any table!\n\n📋 **Multiplication Tables:** 'table of 13' (2–200)\n📊 **Squares:** 'square table 1 to 30' (1–100)\n📊 **Cubes:** 'cube table 1 to 20' (1–50)\n📊 **Square Roots:** 'square root table 1 to 25'\n📊 **Cube Roots:** 'cube root table 1 to 15'\n📊 **Powers:** 'powers of 2' or 'powers of 3'\n\n**Single values:** 'square of 25', 'cube of 12', '√144', '∛125', '2^10'\n\nJust ask! Tables mein trick bhi bataunga! 🎯",
      hi: "## Reference Tables — Main koi bhi table bana sakta hoon!\n\n📋 **Pahade:** 'table of 13' ya '13 ka pahada' (2–200)\n📊 **Varg:** 'square table 1 to 30' (1–100 tak)\n📊 **Ghan:** 'cube table 1 to 20' (1–50 tak)\n📊 **Vargmul:** 'square root table 1 to 25'\n📊 **Ghanmul:** 'cube root table 1 to 15'\n📊 **Ghat:** 'powers of 2' ya '2 ki ghat'\n\n**Ek value:** 'square of 25', 'cube of 12', '√144', '∛125', '2^10'\n\nBas poochho! Tricks bhi milegi! 🎯"
    }
  }
];
