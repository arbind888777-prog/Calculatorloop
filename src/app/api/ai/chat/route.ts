import { NextResponse } from 'next/server';
import { getToolByIdWithContext, searchToolsWithContext } from '@/lib/logic-ai/rag';
import { searchBlogs } from '@/lib/logic-ai/blogSearch';
import { customKnowledge } from '@/ai-training/ai-questions-answers/customKnowledge';
import { detectLanguage, getResponseTemplate } from '@/lib/logic-ai/languageUtils';
import { tryBuildAlgebraIdentityResponse } from '@/lib/logic-ai/algebraIdentityResponder';
import { tryBuildFormulaResponse } from '@/lib/logic-ai/formulaResponder';
import { tryBuildGeometryAreaResponse } from '@/lib/logic-ai/geometryAreaResponder';
import { tryBuildMathSolveResponse } from '@/lib/logic-ai/mathSolver';
import { tryBuildNumberTutorResponse } from '@/lib/logic-ai/numberTutorResponder';
import { tryBuildTrigProofResponse } from '@/lib/logic-ai/trigProofResponder';
import { tryBuildUnitConversionResponse } from '@/lib/logic-ai/unitConverter';
import { tryBuildWordProblemResponse } from '@/lib/logic-ai/wordProblemSolver';
import { tryBuildHindiMathResponse } from '@/lib/logic-ai/hindiMathSolver';
import { findBestFinanceQA } from '@/lib/logic-ai/qaBank';
import { guardUserMessage } from '@/lib/logic-ai/inputGuard';
import { tryBuildReferenceTableResponse } from '@/lib/logic-ai/referenceTableSolver';

const SUPPORTED_LOCALES = new Set([
  'en',
  'hi',
  'ta',
  'te',
  'bn',
  'mr',
  'gu',
  // International (kept in sync with middleware)
  'es',
  'pt',
  'fr',
  'de',
  'id',
  'ar',
  'ur',
  'ja',
]);

const getCookie = (cookieHeader: string | null, name: string): string | null => {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';');
  for (const part of parts) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return null;
};

const hasSupportedLocalePrefix = (path: string) => {
  const m = path.match(/^\/([a-z]{2})(?:\/|$)/i);
  if (!m?.[1]) return false;
  return SUPPORTED_LOCALES.has(m[1].toLowerCase());
};

const prefixInternalMarkdownLinks = (markdown: string, prefix: string) => {
  if (!prefix) return markdown;

  return markdown.replace(/\]\((\/[^)\s]+)\)/g, (full, rawPath: string) => {
    const path = String(rawPath);

    if (!path.startsWith('/')) return full;
    if (hasSupportedLocalePrefix(path)) return full;

    const isInternalAppPath =
      path === '/' ||
      path.startsWith('/calculator/') ||
      path.startsWith('/category/') ||
      path.startsWith('/blog/') ||
      path.startsWith('/login') ||
      path.startsWith('/register') ||
      path.startsWith('/profile') ||
      path.startsWith('/notifications') ||
      path.startsWith('/about') ||
      path.startsWith('/contact') ||
      path.startsWith('/pricing') ||
      path.startsWith('/popular') ||
      path.startsWith('/history') ||
      path.startsWith('/favorites') ||
      path.startsWith('/privacy') ||
      path.startsWith('/terms');

    if (!isInternalAppPath) return full;
    return `](${prefix}${path})`;
  });
};

const buildNextStepSuggestion = (message: string, lang: 'en' | 'hi') => {
  const q = message.toLowerCase();
  const isHi = lang === 'hi';

  // Math tutor prompts (Class 9–12)
  if (
    q.includes('math') ||
    q.includes('maths') ||
    q.includes('ganit') ||
    q.includes('area') ||
    q.includes('chhetrafal') ||
    q.includes('kshetrafal') ||
    q.includes('क्षेत्रफल') ||
    q.includes('aayatan') ||
    q.includes('ayatan') ||
    q.includes('आयतन') ||
    q.includes('volume') ||
    q.includes('sankhya') ||
    q.includes('number') ||
    q.includes('numbers') ||
    q.includes('prime') ||
    q.includes('abhajya') ||
    q.includes('vargmul') ||
    q.includes('ghanmool') ||
    q.includes('square root') ||
    q.includes('cube root') ||
    q.includes('algebra') ||
    q.includes('trigon') ||
    q.includes('calculus') ||
    q.includes('derivative') ||
    q.includes('integral') ||
    q.includes('simplify') ||
    q.includes('solve') ||
    q.includes('equation') ||
    q.includes('formula') ||
    q.includes('sutra')
  ) {
    return isHi
      ? "Math ke liye best format:\n- 'solve: 2x^2+3x-2=0'\n- 'simplify: (x+2)^2-(x-2)^2'\n- 'derivative of x^2+sin(x)'\n- 'integrate x^2 from 0 to 1'\n- 'quadratic formula / AP sum formula / nCr formula'\n\nAgar question word-problem hai to numbers + given/asked likh do."
      : "For math, best format:\n- 'solve: 2x^2+3x-2=0'\n- 'simplify: (x+2)^2-(x-2)^2'\n- 'derivative of x^2+sin(x)'\n- 'integrate x^2 from 0 to 1'\n- 'quadratic formula / AP sum formula / nCr formula'\n\nFor word problems, share Given + Find + values.";
  }

  if (q.includes('emi') || q.includes('loan') || q.includes('interest') || q.includes('byaj')) {
    return isHi 
      ? "Behtar result ke liye batayein: loan amount, byaj dar (%), aur samay (mahine/saal). Main aapko sahi EMI bata sakta hoon."
      : "For best result, share: loan amount, interest rate (%), and tenure (months/years). Then I can suggest a better tenure or compare 2 options.";
  }

  if (q.includes('sip') || q.includes('mutual fund') || q.includes('investment') || q.includes('nivesh')) {
    return isHi
      ? "Batayein: mahine ka SIP amount, ummeed ki gayi return (%), aur kitne saal ke liye. Main aapko future value bata sakta hoon."
      : "Share: monthly SIP amount, expected annual return (%), and years. I can suggest a realistic return range and a target monthly SIP.";
  }

  if (q.includes('gst') || q.includes('tax')) {
    return isHi
      ? "Batayein: amount aur GST rate (%). Main aapko final amount bata sakta hoon."
      : "Share: amount and GST rate (%). I can tell you the tax and final amount.";
  }

  if (q.includes('bmi') || q.includes('calorie') || q.includes('bmr') || q.includes('wajan')) {
    return isHi
      ? "Batayein: kad (height), wajan (weight), umar (age), aur gender. Main aapko healthy range bata sakta hoon."
      : "Share: height, weight, age, and gender. I can suggest a healthy range and next steps.";
  }

  return isHi
    ? "Apna goal ya numbers batayein. Main aapko sahi calculator suggest karunga."
    : "Tell me your goal and your numbers (if any). I’ll recommend the best calculator and next steps.";
};

const isCalculationLikeQuery = (message: string) => {
  const m = message.toLowerCase();
  const hasNumber = /\d/.test(m);
  const hasMathCue = /%|\b(sa?al|years?)\b|\b(interest|profit|return|growth|compound)\b|\b(lakh|lac|crore)\b|₹|\bamount\b/.test(m);
  return hasNumber && hasMathCue;
};

const isCalculatorDiscoveryQuery = (message: string) => {
  const m = message.toLowerCase();
  return /\b(calculator|tool|suggest|recommend|which calculator|find calculator)\b|कैलकुलेटर|कौनसा|सुझाव/.test(m);
};

const TYPO_MAP: Record<string, string> = {
  'gkt': 'gst',
  'claculator': 'calculator',
  'calculetor': 'calculator',
  'emii': 'emi',
  'intrest': 'interest',
  'byaaj': 'byaj',
  'wajan': 'weight',
  'kad': 'height',
  'hight': 'height',
  'waight': 'weight',
  'sipp': 'sip',
  'mutul': 'mutual',
  'faund': 'fund',
};

const correctTypos = (text: string): string => {
  let corrected = text;
  // Replace whole words only to avoid partial matches ruining things
  Object.entries(TYPO_MAP).forEach(([typo, correct]) => {
    const regex = new RegExp(`\\b${typo}\\b`, 'gi');
    corrected = corrected.replace(regex, correct);
  });
  return corrected;
};

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Sanitize history for context awareness
    const chatHistory = Array.isArray(history)
      ? history
          .filter((m: any) => m && typeof m.content === 'string' && m.content.trim())
          .map((m: any) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content as string }))
          .slice(-12)
      : [];

    // --- Context Awareness Logic ---
    let effectiveMessage = correctTypos(message);
    let contextTopic = '';

    if (history && Array.isArray(history) && history.length > 0) {
      // 1. Find the last tool mentioned by the assistant
      const lastAssistantMsg = [...history].reverse().find((m: any) => m.role === 'assistant');
      if (lastAssistantMsg && typeof lastAssistantMsg.content === 'string') {
        // Look for calculator links: /calculator/some-id
        const match = lastAssistantMsg.content.match(/\/calculator\/([a-zA-Z0-9-]+)/);
        if (match && match[1]) {
          // e.g. "emi-calculator" -> "emi calculator"
          contextTopic = match[1].replace(/-/g, ' ');
        }
      }
    }

    // 2. If the current message is short, numeric, or a follow-up, inject context
    // Heuristic: < 50 chars, or starts with a number, or contains math symbols
    const isShort = message.length < 50;
    const isNumeric = /^\d/.test(message.trim()) || /^[0-9\.\+\-\*\/\(\)\s%]+$/.test(message.trim());
    
    if (contextTopic && (isShort || isNumeric)) {
      // Only prepend if the message doesn't already contain the topic
      if (!effectiveMessage.toLowerCase().includes(contextTopic.split(' ')[0])) {
        effectiveMessage = `${contextTopic} ${effectiveMessage}`;
      }
    }
    // -------------------------------

    const lang = detectLanguage(effectiveMessage);
    const templates = getResponseTemplate(lang);
    let responseContent = '';

    const calcLike = isCalculationLikeQuery(effectiveMessage);
    const wantsDiscovery = isCalculatorDiscoveryQuery(effectiveMessage);

    const reqLocaleHeader = req.headers.get('x-calculator-language')?.toLowerCase() ?? null;
    const cookieLocale = getCookie(req.headers.get('cookie'), 'calculator-language')?.toLowerCase() ?? null;
    const inferredLocale = reqLocaleHeader || cookieLocale || 'en';
    const uiLocale = SUPPORTED_LOCALES.has(inferredLocale) ? inferredLocale : 'en';
    const localePrefix = uiLocale === 'en' ? '' : `/${uiLocale}`;

    const jsonAssistant = (content: string) => {
      return NextResponse.json({
        role: 'assistant',
        content: prefixInternalMarkdownLinks(content, localePrefix),
      });
    };

    // Input guard: handle garbled/ambiguous/invalid queries with one clarification question.
    // Keeps UX friendly when user types wrong words/sentences.
    const guard = guardUserMessage(effectiveMessage, lang);
    if (guard.kind === 'clarify') {
      responseContent = guard.reply;
      responseContent += `\n\n${templates.nextStep}\n\n`;
      responseContent += `${buildNextStepSuggestion(effectiveMessage, lang)}\n`;
      return jsonAssistant(responseContent);
    }

    effectiveMessage = guard.message;

    // 0. Check Custom Knowledge Base (Manual Training) — exact pattern matches, instant
    const lowerMsg = effectiveMessage.toLowerCase();

    // Smart pattern matching: short patterns (≤3 chars like "hi","hey") use word-boundary
    // regex so they don't false-match inside words like "bechi", "machine", etc.
    const matchesPattern = (msg: string, pattern: string): boolean => {
      if (pattern.length <= 4) {
        // Word boundary match for short patterns
        const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`(?:^|\\s|[^a-zA-Z0-9\u0900-\u097F])${escaped}(?:$|\\s|[^a-zA-Z0-9\u0900-\u097F])`, 'i').test(msg)
          || msg === pattern; // exact match
      }
      return msg.includes(pattern);
    };

    const knowledgeMatch = customKnowledge.find(k => 
      k.patterns.some(p => matchesPattern(lowerMsg, p))
    );

    // If message has 2+ numbers, it's likely a calculation → let solvers handle it
    // instead of showing generic formula knowledge.
    const hasCalculationNumbers = (effectiveMessage.match(/-?\d+(?:\.\d+)?/g) || []).length >= 2;

    if (knowledgeMatch && !hasCalculationNumbers) {
      responseContent += knowledgeMatch.answer[lang] + "\n\n";
      
      // If knowledge item has suggested tools, fetch them
      if (knowledgeMatch.suggestedTools) {
        const tools = knowledgeMatch.suggestedTools
          .map(id => getToolByIdWithContext(id))
          .filter(t => t !== null);
          
        if (tools.length > 0) {
          responseContent += `${templates.toolsIntro}\n\n`;
          tools.forEach((item) => {
            if (item) {
              responseContent += `- [${item.tool.title}](/calculator/${item.tool.id})\n`;
              responseContent += `  ${item.tool.description}\n`;
            }
          });
        }
      }

      responseContent += `\n${templates.nextStep}\n\n`;
      responseContent += `${buildNextStepSuggestion(effectiveMessage, lang)}\n`;
      return jsonAssistant(responseContent);
    }

    // 0.1 Finance Q&A Bank (auto-generated, local, high confidence)
    const financeHit = findBestFinanceQA(effectiveMessage);
    if (financeHit) {
      let fullResponse = financeHit.item.a;
      fullResponse += `\n\n${templates.nextStep}\n\n`;
      fullResponse += `${buildNextStepSuggestion(effectiveMessage, lang)}\n`;
      return jsonAssistant(fullResponse);
    }

    // ─────────────────────────────────────────────────────────────
    // LOCAL SOLVERS: All questions handled locally (no external API)
    // Calculator Loop AI — fully self-contained.
    // ─────────────────────────────────────────────────────────────

    // Hindi/Hinglish/English Math Solver (comprehensive — sums, %, profit/loss, SI/CI, HCF/LCM, ratio, GST, EMI)
    const hindiMathResponse = tryBuildHindiMathResponse(effectiveMessage, lang);
    if (hindiMathResponse) {
      let fullResponse = hindiMathResponse;
      fullResponse += `\n\n${templates.nextStep}\n\n`;
      fullResponse += `${buildNextStepSuggestion(effectiveMessage, lang)}\n`;
      return jsonAssistant(fullResponse);
    }

    // Geometry area (offline)
    const areaResponse = tryBuildGeometryAreaResponse(effectiveMessage, lang);
    if (areaResponse) {
      let fullResponse = areaResponse;
      fullResponse += `\n\n${templates.nextStep}\n\n`;
      fullResponse += `${buildNextStepSuggestion(effectiveMessage, lang)}\n`;
      return jsonAssistant(fullResponse);
    }

    // Numbers tutor (types + big-int calculations)
    const numberTutorResponse = tryBuildNumberTutorResponse(effectiveMessage, lang);
    if (numberTutorResponse) {
      let fullResponse = numberTutorResponse;
      fullResponse += `\n\n${templates.nextStep}\n\n`;
      fullResponse += `${buildNextStepSuggestion(effectiveMessage, lang)}\n`;
      return jsonAssistant(fullResponse);
    }

    // Trig proof (common Class 12 identities)
    const trigProofResponse = tryBuildTrigProofResponse(effectiveMessage, lang);
    if (trigProofResponse) {
      let fullResponse = trigProofResponse;
      fullResponse += `\n\n${templates.nextStep}\n\n`;
      fullResponse += `${buildNextStepSuggestion(effectiveMessage, lang)}\n`;
      return jsonAssistant(fullResponse);
    }

    // Algebra identities (common exam patterns)
    const algebraIdentityResponse = tryBuildAlgebraIdentityResponse(effectiveMessage, lang);
    if (algebraIdentityResponse) {
      let fullResponse = algebraIdentityResponse;
      fullResponse += `\n\n${templates.nextStep}\n\n`;
      fullResponse += `${buildNextStepSuggestion(effectiveMessage, lang)}\n`;
      return jsonAssistant(fullResponse);
    }

    // Reference Tables (squares, cubes, roots, powers, multiplication tables)
    const refTableResponse = tryBuildReferenceTableResponse(effectiveMessage, lang);
    if (refTableResponse) {
      let fullResponse = refTableResponse;
      fullResponse += `\n\n${templates.nextStep}\n\n`;
      fullResponse += `${buildNextStepSuggestion(effectiveMessage, lang)}\n`;
      return jsonAssistant(fullResponse);
    }

    // Unit Conversion
    const unitResponse = tryBuildUnitConversionResponse(effectiveMessage, lang);
    if (unitResponse) {
      let fullResponse = unitResponse;
      fullResponse += `\n\n${templates.nextStep}\n\n`;
      fullResponse += `${buildNextStepSuggestion(effectiveMessage, lang)}\n`;
      return jsonAssistant(fullResponse);
    }

    // Word Problems
    const wordProblemResponse = tryBuildWordProblemResponse(effectiveMessage, lang);
    if (wordProblemResponse) {
      let fullResponse = wordProblemResponse;
      fullResponse += `\n\n${templates.nextStep}\n\n`;
      fullResponse += `${buildNextStepSuggestion(effectiveMessage, lang)}\n`;
      return jsonAssistant(fullResponse);
    }

    // Math solver (expressions + equations + steps)
    const mathSolveResponse = tryBuildMathSolveResponse(effectiveMessage, lang);
    if (mathSolveResponse) {
      let fullResponse = mathSolveResponse;
      fullResponse += `\n\n${templates.nextStep}\n\n`;
      fullResponse += `${buildNextStepSuggestion(effectiveMessage, lang)}\n`;
      return jsonAssistant(fullResponse);
    }

    // Formula Knowledge (Formula + basic calculation)
    const formulaResponse = tryBuildFormulaResponse(effectiveMessage, lang);
    if (formulaResponse) {
      let fullResponse = formulaResponse;
      fullResponse += `\n\n${templates.nextStep}\n\n`;
      fullResponse += `${buildNextStepSuggestion(effectiveMessage, lang)}\n`;
      return jsonAssistant(fullResponse);
    }

    // ─────────────────────────────────────────────────────────────
    // LAST RESORT: Tool discovery + blogs
    // ─────────────────────────────────────────────────────────────
    let relevantTools = wantsDiscovery ? searchToolsWithContext(effectiveMessage) : [];
    const relevantBlogs = calcLike ? [] : searchBlogs(effectiveMessage);

    const blogToolId = relevantBlogs[0]?.post?.toolId;
    if (blogToolId) {
      const blogTool = getToolByIdWithContext(blogToolId);
      if (blogTool) {
        const exists = relevantTools.some((t) => t.tool.id === blogTool.tool.id);
        if (!exists) {
          relevantTools = [blogTool, ...relevantTools];
        } else {
          relevantTools = [blogTool, ...relevantTools.filter((t) => t.tool.id !== blogTool.tool.id)];
        }
      }
    }

    if (relevantBlogs.length > 0) {
      const topBlog = relevantBlogs[0];
      responseContent += `${templates.blogIntro}\n\n`;
      responseContent += `${topBlog.matchingParagraph}\n\n`;
    }

    if (relevantTools.length > 0 && relevantBlogs.length === 0) {
      const topTool = relevantTools[0].tool;
      if (lang === 'hi') {
        responseContent += `Aapke sawal ke liye **${topTool.title}** sabse sahi hai. ${topTool.description}\n\n`;
      } else {
        responseContent += `Based on your request, I recommend using the **${topTool.title}**. ${topTool.description}\n\n`;
      }
    }

    if (wantsDiscovery && relevantTools.length > 0) {
      responseContent += `\n\n${templates.toolsIntro}\n\n`;
      relevantTools.slice(0, 5).forEach(({ tool, subcategoryName }) => {
        responseContent += `- [${tool.title}](/calculator/${tool.id})\n`;
        responseContent += `  ${tool.description}\n`;
        responseContent += `  _${templates.category}: ${subcategoryName}_\n`;
      });
    }

    if (!responseContent) {
      responseContent = templates.fallback;
    }

    responseContent += `\n\n${templates.nextStep}\n\n`;
    responseContent += `${buildNextStepSuggestion(effectiveMessage, lang)}\n`;

    return jsonAssistant(responseContent);

  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
