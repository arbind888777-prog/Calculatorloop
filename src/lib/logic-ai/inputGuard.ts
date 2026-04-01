export type InputGuardResult =
  | { kind: 'ok'; message: string }
  | { kind: 'clarify'; reply: string };

const stripNoise = (s: string) => s.replace(/\s+/g, ' ').trim();

const hasAnyLetterOrDigit = (s: string) => /[a-z0-9\u0900-\u097F]/i.test(s);

const extractNumbers = (s: string) => {
  const matches = s.match(/-?\d+(?:\.\d+)?/g);
  return matches ? matches.slice(0, 4) : [];
};

const hasOperatorSymbol = (s: string) => /[+\-*/×÷()]/.test(s);

const hasOperatorWordCue = (s: string) =>
  /\b(add|plus|sum|total|subtract|minus|difference|multiply|times|into|divide|divided|quotient|average|ausat|percentage|percent|profit|loss|interest|ratio)\b/i.test(s) ||
  /\b(jod|jodo|jodna|jod do|ghata|ghatao|minus|guna|guniya|multiply|bhag|bhaag|divide|yog|yogfal|antar|ghatav|labh|hani|byaj|pratishat|ausat|average)\b/i.test(s) ||
  /\b(se .* tak|ka yog|ka antar|ki ausat|ka labh|ka hani|ka byaj|ka pratishat)\b/i.test(s) ||
  /योग|जोड़|घट|गुणा|भाग|कुल|जमा|माइनस|प्लस|डिवाइड|अन्तर|औसत|लाभ|हानि|ब्याज|प्रतिशत/i.test(s);

const looksLikeJustPunctuation = (s: string) => {
  const cleaned = stripNoise(s);
  if (!cleaned) return true;
  if (!hasAnyLetterOrDigit(cleaned)) return true;
  // If it's mostly punctuation (e.g., "?? ???")
  const lettersDigits = cleaned.match(/[a-z0-9\u0900-\u097F]/gi)?.length ?? 0;
  return lettersDigits <= 1;
};

const endsWithOperator = (s: string) => /[+\-*/×÷]\s*$/.test(s.trim());
const startsWithOperator = (s: string) => /^\s*[+\-*/×÷]/.test(s.trim());

const hasDivideByZeroPattern = (s: string) => {
  const t = s.replace(/\s+/g, '');
  return /\/(0)(?!\d)/.test(t) || /÷0(?!\d)/.test(t) || /dividedby0\b/i.test(s) || /divide\s+by\s+0\b/i.test(s) || /0\s*se\s*bhag/i.test(s);
};

export const guardUserMessage = (rawMessage: string, lang: 'en' | 'hi'): InputGuardResult => {
  const message = stripNoise(rawMessage);

  if (looksLikeJustPunctuation(message)) {
    return {
      kind: 'clarify',
      reply:
        lang === 'hi'
          ? 'Mujhe aapka question clear nahi mila. Kripya is format me likhiye:\n- "12 + 3"\n- "GST 18% on 5000"\n- "BMI weight 70 height 175"\n\nAap apna sawal dobara likh dijiye.'
          : 'I couldn\'t understand the question. Please write it like:\n- "12 + 3"\n- "GST 18% on 5000"\n- "BMI weight 70 height 175"\n\nPlease retype your question.',
    };
  }

  if (endsWithOperator(message) || startsWithOperator(message)) {
    return {
      kind: 'clarify',
      reply:
        lang === 'hi'
          ? `Aapka expression incomplete lag raha hai (operator ke saath start/end ho raha hai). Kripya poora likhiye, jaise: "12 + 3".`
          : `Your expression looks incomplete (it starts/ends with an operator). Please write it fully, e.g., "12 + 3".`,
    };
  }

  if (hasDivideByZeroPattern(message)) {
    return {
      kind: 'clarify',
      reply:
        lang === 'hi'
          ? 'Aapke question me divide by 0 aa raha hai. Denominator 0 nahi ho sakta—kripya numbers confirm kar dijiye (e.g., "12 ÷ 3").'
          : 'Your question seems to divide by 0. The denominator can\'t be 0—please confirm the numbers (e.g., "12 ÷ 3").',
    };
  }

  const numbers = extractNumbers(message);
  const hasMathIntentWord = /\b(calculate|solve|answer|result)\b/i.test(message) || /kitna|batao|nikalo|solve/i.test(message);
  const hasPlaceValueCue =
    /place value|face value|expanded form|digit at|ones place|tens place|hundreds place|thousands place/i.test(message) ||
    /स्थानिक मान|स्थानीय मान|अंकित मान|विस्तारित रूप|इकाई|दहाई|सैकड़ा|हजार|लाख|करोड़/i.test(message);

  // If user gave one number but asks to add/subtract/etc.
  if (numbers.length === 1 && hasOperatorWordCue(message)) {
    return {
      kind: 'clarify',
      reply:
        lang === 'hi'
          ? `Aapne sirf ek number diya hai (${numbers[0]}). Kripya doosra number bhi likh dijiye—jaise "${numbers[0]} + 10".`
          : `You provided only one number (${numbers[0]}). Please add the second number—e.g., "${numbers[0]} + 10".`,
    };
  }

  // If user gave 2+ numbers but operation is unclear.
  // Skip this check if the message is a proper sentence (5+ words) — likely a valid question.
  const wordCount = message.split(/\s+/).length;
  if (numbers.length >= 2 && !hasOperatorSymbol(message) && !hasOperatorWordCue(message) && hasMathIntentWord && !hasPlaceValueCue && wordCount < 5) {
    const [a, b] = numbers;
    return {
      kind: 'clarify',
      reply:
        lang === 'hi'
          ? `Aapne numbers diye hain (${a}, ${b}), lekin operation clear nahi hai. Aap kya karna chahte hain?\n1) ${a} + ${b}\n2) ${a} - ${b}\n3) ${a} * ${b}\n4) ${a} / ${b}\n\nBas option number ya exact expression bhej dijiye.`
          : `You gave numbers (${a}, ${b}) but the operation isn\'t clear. What do you want to do?\n1) ${a} + ${b}\n2) ${a} - ${b}\n3) ${a} * ${b}\n4) ${a} / ${b}\n\nReply with the option number or the exact expression.`,
    };
  }

  return { kind: 'ok', message };
};
