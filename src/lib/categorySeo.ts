export interface CategorySeoFaq {
  question: string
  answer: string
}

interface CategorySeoInput {
  categoryId: string
  categoryName: string
  calculatorsCount: number
  toolTitles: string[]
  language?: string
}

interface CategorySeoProfile {
  summary: string
  keywords: string[]
  faqs: CategorySeoFaq[]
  howToSteps: string[]
  featureList: string[]
  benefitPoints: string[]
  expertTips: string[]
  labels: {
    aboutHeading: string
    whyUseTitle: string
    howToTitle: string
    expertTipsTitle: string
    popularToolsTitle: string
    faqTitle: string
    homeLabel: string
  }
}

export function getCategorySeoProfile({ categoryId, categoryName, calculatorsCount, toolTitles, language = 'en' }: CategorySeoInput): CategorySeoProfile {
  const topTitles = toolTitles.slice(0, 8)
  const isHindi = language === 'hi'
  const baseKeywords = [
    categoryName,
    `${categoryName} online`,
    `${categoryName} free`,
    `${categoryName} tools`,
    `${categoryName} calculators`,
    `${categoryId} calculators`,
    `best ${categoryId} calculators`,
    'free online calculators',
    'calculator loop',
  ]

  const genericFaqs: CategorySeoFaq[] = isHindi
    ? [
        {
          question: `क्या इस पेज के सभी ${categoryName} फ्री हैं?`,
          answer: `हाँ। इस पेज पर दिए गए सभी ${categoryName} बिना साइनअप के फ्री हैं और मोबाइल, टैबलेट और डेस्कटॉप पर काम करते हैं।`,
        },
        {
          question: `यह ${categoryName} पेज उपयोगी क्यों है?`,
          answer: `यह पेज एक ही जगह पर जुड़े हुए टूल्स देता है, जिससे सही कैलकुलेटर जल्दी मिलता है, समान समस्याओं की तुलना आसान होती है, और बार-बार नई खोज शुरू नहीं करनी पड़ती।`,
        },
        {
          question: `क्या मैं इन ${categoryName} का उपयोग पढ़ाई या काम के लिए कर सकता हूँ?`,
          answer: `हाँ। ये टूल्स रिवीजन, क्विक चेक, प्लानिंग और अलग-अलग scenarios compare करने के लिए उपयोगी हैं। किसी critical professional decision के लिए assumptions और results को अलग से verify करना चाहिए।`,
        },
      ]
    : [
        {
          question: `Are these ${categoryName} free to use?`,
          answer: `Yes. All ${categoryName.toLowerCase()} on this page are free to use and work on mobile, tablet, and desktop without signup.`,
        },
        {
          question: `What makes this ${categoryName} page useful?`,
          answer: `This page groups relevant tools in one place so you can find the right calculator faster, compare related problems, and move between calculators without starting your search again.`,
        },
        {
          question: `Can I use these ${categoryName} for study or work?`,
          answer: `Yes. These tools are useful for revision, quick checking, planning, and scenario testing. For critical professional decisions, always verify assumptions and final outputs independently.`,
        },
      ]

  const genericSteps = isHindi
    ? [
        `इस ${categoryName} पेज को खोलें और अपनी problem के हिसाब से सही tool चुनें।`,
        'Values ध्यान से भरें और जहाँ जरूरी हो सही units चुनें।',
        'Result, explanation और related tools को देखकर output verify करें।',
        'जरूरत हो तो result को बाद में use करने के लिए download, share या print करें।',
      ]
    : [
        `Open this ${categoryName} page and choose the tool that matches your problem.`,
        'Enter your values carefully and select the proper units where available.',
        'Review the result, explanation, and any related tools suggested on the calculator page.',
        'Use download, share, or print features if you need to save the result for later.',
      ]

  const genericFeatures = isHindi
    ? [
        `एक ही category में ${calculatorsCount}+ calculators`,
        'Fast mobile और desktop experience',
        'Subcategory-wise clear navigation',
        'Step-by-step और export-friendly tools',
        'Search-friendly calculator collection',
      ]
    : [
        `${calculatorsCount}+ calculators in one category`,
        'Fast mobile and desktop experience',
        'Clear navigation by subcategory',
        'Step-by-step and export-friendly tools',
        'Search-friendly calculator collection',
      ]

  const genericBenefits = isHindi
    ? [
        'एक-एक करके search करने के बजाय relevant calculators जल्दी मिलते हैं',
        'एक ही category में related tools compare करना आसान होता है',
        'Fast results और clean layout ke saath device-friendly experience मिलता है',
        'Similar calculations के बीच switch करने में कम friction होता है',
      ]
    : [
        'Find relevant calculators faster instead of searching one by one',
        'Compare related tools from the same category in one place',
        'Use device-friendly tools with fast results and clean layouts',
        'Reduce friction when switching between similar calculations',
      ]

  const genericTips = isHindi
    ? [
        'Generic tool use karne ke bajay अपनी exact problem ke hisaab se specific calculator चुनें।',
        'Different tools के outputs compare करने से पहले units और assumptions चेक करें।',
        'सिर्फ एक result par depend karne ke bajay related calculators se result validate ya extend करें।',
      ]
    : [
        'Pick the most specific calculator for your problem instead of forcing a generic tool.',
        'Check units and assumptions before comparing outputs across tools.',
        'Use related calculators to validate or extend the result rather than relying on a single number alone.',
      ]

  const labels = isHindi
    ? {
        aboutHeading: `${categoryName} के बारे में`,
        whyUseTitle: 'यह category page क्यों useful है',
        howToTitle: 'Best result पाने का तरीका',
        expertTipsTitle: 'Expert tips',
        popularToolsTitle: `${categoryName} के popular tools`,
        faqTitle: 'अक्सर पूछे जाने वाले सवाल',
        homeLabel: 'होम',
      }
    : {
        aboutHeading: `About ${categoryName}`,
        whyUseTitle: 'Why use this category page',
        howToTitle: 'How to get the best result',
        expertTipsTitle: 'Expert tips',
        popularToolsTitle: `Popular Tools in ${categoryName}`,
        faqTitle: 'Frequently Asked Questions',
        homeLabel: 'Home',
      }

  if (categoryId === 'scientific') {
    return {
      summary: isHindi
        ? `${calculatorsCount}+ ${categoryName.toLowerCase()} explore करें जिनमें physics, electrical, chemistry, thermodynamics, astronomy और दूसरे topics शामिल हैं। यह plain formula list से बेहतर है क्योंकि यह fast solving, cleaner revision और concept support देता है।`
        : `Explore ${calculatorsCount}+ ${categoryName.toLowerCase()} for physics, electrical, chemistry, thermodynamics, astronomy, and more. Designed for fast solving, cleaner revision, and better concept support than a plain formula list.`,
      keywords: Array.from(new Set([
        ...baseKeywords,
        'science calculators',
        'physics calculators',
        'chemistry calculators',
        'scientific tools with steps',
        'student science solver',
        ...topTitles,
      ])),
      faqs: isHindi
        ? [
            {
              question: 'इस science calculators page पर मैं क्या कर सकता हूँ?',
              answer: 'आप यहाँ physics, motion, electricity, chemistry, astronomy और related science topics ke grouped tools use कर सकते हैं, ताकि हर formula ko अलग-अलग search na karna पड़े।',
            },
            {
              question: 'क्या यह science page students और exam preparation के लिए useful है?',
              answer: 'हाँ। यह students के लिए खास useful है क्योंकि इसमें fast calculators, unit handling, worked outputs और related tools ek saath milते हैं जो practice और revision दोनों में मदद करते हैं।',
            },
            {
              question: 'क्या इन science tools के results real-world systems के लिए valid हैं?',
              answer: 'ये tools textbook models, learning और first-pass estimates के लिए बहुत useful हैं। Real-world systems में friction, drag, uncertainty या domain-specific constraints होने पर advanced modelling की जरूरत पड़ सकती है।',
            },
            ...genericFaqs,
          ]
        : [
            {
              question: 'What can I do on this science calculators page?',
              answer: 'You can access grouped tools for physics, motion, electricity, chemistry, astronomy, and related science topics from one place instead of searching for each formula separately.',
            },
            {
              question: 'Is this science page useful for students and exam preparation?',
              answer: 'Yes. It is especially useful for students because it combines fast calculators, unit handling, worked outputs, and related tools that help with practice and revision.',
            },
            {
              question: 'Are these science results valid for real-world systems?',
              answer: 'These tools are very useful for textbook models, learning, and first-pass estimates. Real-world systems may need more advanced modelling when friction, drag, uncertainty, or domain-specific constraints matter.',
            },
            ...genericFaqs,
          ],
      howToSteps: isHindi
        ? [
            'Physics, Electrical, Chemistry या Thermodynamics जैसी science subcategory चुनें।',
            'वह calculator खोलें जो आपके known inputs और required output से सबसे अच्छी तरह match करता हो।',
            'Values ध्यान से भरें, units verify करें, और result के साथ steps या conversions भी पढ़ें।',
            'अगर आपकी problem दूसरे science topic तक जाती है तो related tools का उपयोग करके workflow जारी रखें।',
          ]
        : [
            'Choose a science subcategory such as Physics, Electrical, Chemistry, or Thermodynamics.',
            'Open the calculator that best matches your known inputs and required output.',
            'Enter values carefully, verify units, and read the result with its supporting steps or conversions.',
            'Use related tools to continue the workflow if your problem extends into another science topic.',
          ],
      featureList: isHindi
        ? [
            'Physics और science calculators',
            'Unit-aware solving experience',
            'Subcategory-wise problem-specific tools',
            'Mobile-friendly science workflow',
            'Helpful content और related tool discovery',
          ]
        : [
            'Physics and science calculators',
            'Unit-aware solving experience',
            'Problem-specific tools by subcategory',
            'Mobile-friendly science workflow',
            'Helpful content and related tool discovery',
          ],
      benefitPoints: isHindi
        ? [
            'Scattered formula pages browse karne se बेहतर, क्योंकि related science tools एक जगह grouped हैं',
            'Homework, revision, lab planning और quick engineering checks के लिए useful',
            'सही calculator खोजने में लगने वाला समय कम करता है',
            'Students ko ek science concept se doosre concept tak smoothly move karne में मदद करता है',
          ]
        : [
            'Better than browsing scattered formula pages because related science tools are grouped together',
            'Useful for homework, revision, lab planning, and quick engineering checks',
            'Reduces time spent searching for the right calculator',
            'Helps students move from one science concept to the next more smoothly',
          ],
      expertTips: isHindi
        ? [
            'Cleaner result और fewer assumptions के लिए सबसे topic-specific calculator use करें।',
            'हमेशा confirm करें कि tool ideal textbook conditions मान रहा है या practical real-world values।',
            'Physics और engineering calculators के बीच move करते समय unit system consistent रखें।',
          ]
        : [
            'Use the most topic-specific calculator available for cleaner results and fewer assumptions.',
            'Always confirm whether the tool expects ideal textbook conditions or practical real-world values.',
            'Keep a consistent unit system when moving across physics and engineering calculators.',
          ],
      labels,
    }
  }

  return {
    summary: isHindi
      ? `${calculatorsCount}+ ${categoryName.toLowerCase()} explore करें जो fast, accurate और mobile-friendly tools देते हैं। ये planning, learning, quick comparison और everyday use के लिए helpful हैं। Popular tools में ${topTitles.join(', ')} शामिल हैं।`
      : `Explore ${calculatorsCount}+ ${categoryName.toLowerCase()} with fast, accurate, mobile-friendly tools for everyday use, planning, learning, and quick comparisons. Popular tools include ${topTitles.join(', ')}.`,
    keywords: Array.from(new Set([...baseKeywords, ...topTitles])),
    faqs: genericFaqs,
    howToSteps: genericSteps,
    featureList: genericFeatures,
    benefitPoints: genericBenefits,
    expertTips: genericTips,
    labels,
  }
}