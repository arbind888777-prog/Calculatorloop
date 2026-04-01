export interface CalculatorSeoFaq {
  question: string
  answer: string
}

interface CalculatorSeoInput {
  id: string
  title: string
  description: string
  categoryId: string
  categoryName: string
}

interface CalculatorSeoProfile {
  keywords: string[]
  faqs: CalculatorSeoFaq[]
  howToSteps: string[]
  featureList: string[]
  benefitPoints: string[]
  expertTips: string[]
  applicationCategory: string
  articleSection: string
  summary: string
}

const normalizeCategory = (categoryId: string, categoryName: string) => {
  const raw = `${categoryId} ${categoryName}`.toLowerCase()
  if (raw.includes('physics') || raw.includes('scientific')) return 'physics'
  if (raw.includes('health')) return 'health'
  if (raw.includes('financial') || raw.includes('investment') || raw.includes('loan') || raw.includes('tax')) return 'finance'
  if (raw.includes('education')) return 'education'
  if (raw.includes('business')) return 'business'
  if (raw.includes('construction')) return 'construction'
  if (raw.includes('technology')) return 'technology'
  return 'general'
}

export function getCalculatorSeoProfile({ id, title, description, categoryId, categoryName }: CalculatorSeoInput): CalculatorSeoProfile {
  const bucket = normalizeCategory(categoryId, categoryName)
  const titleLower = title.toLowerCase()

  const baseKeywords = [
    title,
    `${title} calculator`,
    `${title} online`,
    `free ${titleLower}`,
    `${titleLower} with steps`,
    `${titleLower} formula`,
    `${categoryName} calculator`,
    `${categoryName} tools`,
    id,
    'free online calculator',
    'calculator loop',
  ]

  const genericFaqs: CalculatorSeoFaq[] = [
    {
      question: `Is the ${title} free to use?`,
      answer: `Yes. The ${title} is free to use on mobile and desktop with no signup required.`,
    },
    {
      question: `Can I trust the ${title} results?`,
      answer: `The ${title} uses standard formulas and consistent unit handling for fast and reliable estimates. For critical professional decisions, always verify with domain-specific standards or expert review.`,
    },
    {
      question: `Can I use the ${title} for study or project work?`,
      answer: `Yes. It is useful for homework checks, quick comparisons, revisions, and early-stage planning because it combines calculation, unit support, and explanation in one place.`,
    },
  ]

  const genericSteps = [
    `Open the ${title} and enter the known input values.`,
    'Select the correct units for each field before calculating.',
    'Review the main result, formula, and conversions shown on the page.',
    'Use the step-by-step breakdown to verify the logic and download or share the result if needed.',
  ]

  const genericFeatures = [
    'Instant calculation',
    'Step-by-step explanation',
    'Unit conversion support',
    'Mobile-friendly layout',
    'Download and share options',
  ]

  const genericBenefits = [
    'Fast answers without manual formula rearrangement',
    'Cleaner comparison of multiple scenarios',
    'Works on mobile, tablet, and desktop',
    'Useful for study, planning, and quick verification',
  ]

  const genericTips = [
    'Check that all inputs use the correct unit system before comparing values.',
    'Use the worked steps to confirm whether you entered the right known variables.',
    'If the result looks unrealistic, re-check sign convention, rounding, and assumptions.',
  ]

  if (bucket === 'physics') {
    return {
      keywords: Array.from(new Set([
        ...baseKeywords,
        'physics calculator',
        'physics calculator with steps',
        'physics formula calculator',
        'kinematics calculator',
        'motion calculator',
        'physics unit converter',
        'student physics solver',
      ])),
      faqs: [
        {
          question: `What makes this ${title} useful for students and engineers?`,
          answer: `This ${title} combines the formula, instant result, unit conversion, and worked steps in one place, so it is faster to verify than a plain formula sheet or generic search result.`,
        },
        {
          question: `Can I use the ${title} for homework and exam preparation?`,
          answer: `Yes. It is suitable for homework checking, concept revision, and practice. It is best used to validate your method after you understand the underlying formula.`,
        },
        {
          question: `Why might real-world results differ from this ${title}?`,
          answer: `Physics calculators usually assume ideal textbook conditions. Real systems may include drag, friction, losses, variable acceleration, or measurement error that changes the final result.`,
        },
        ...genericFaqs,
      ],
      howToSteps: [
        `Choose the ${title} and identify which motion values are already known.`,
        'Enter the values carefully and set the matching units for distance, time, velocity, angle, or acceleration.',
        'Read the main answer first, then confirm the formula and the step-by-step derivation.',
        'Use the conversion output, graph, related tools, or download options if you need a report or comparison.',
      ],
      featureList: [
        'Physics-specific formula solving',
        'Step-by-step derivation',
        'Multiple unit systems',
        'Projectile graph support where applicable',
        'Custom download and printable output',
      ],
      benefitPoints: [
        'Better than a plain formula page because it explains the result as well as calculates it',
        'Useful for school, college, exam practice, and quick engineering checks',
        'Helps reduce common unit-conversion mistakes',
        'Makes scenario testing faster with presets and instant recalculation',
      ],
      expertTips: [
        'Keep sign convention consistent when motion can be upward, downward, leftward, or backward.',
        'Do not mix total distance and displacement in average-velocity problems.',
        'Use the calculator for idealized models and treat real-world drag and friction as separate effects.',
      ],
      applicationCategory: 'EducationalApplication',
      articleSection: 'Physics Calculators',
      summary: `${description} Built for fast physics problem solving with step-by-step explanations, unit conversions, and practical help content.`,
    }
  }

  return {
    keywords: Array.from(new Set(baseKeywords)),
    faqs: genericFaqs,
    howToSteps: genericSteps,
    featureList: genericFeatures,
    benefitPoints: genericBenefits,
    expertTips: genericTips,
    applicationCategory: bucket === 'finance' ? 'FinanceApplication' : bucket === 'health' ? 'HealthApplication' : 'UtilitiesApplication',
    articleSection: `${categoryName} Calculators`,
    summary: `${description} Designed for fast, accurate calculation with clear outputs, explanation, and device-friendly usability.`,
  }
}