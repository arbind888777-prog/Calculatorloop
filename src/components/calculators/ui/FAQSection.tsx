"use client"

import React, { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface FAQ {
  question: string
  answer: string
}

interface FAQItemProps {
  question: string
  answer: string
  isOpen: boolean
  onClick: () => void
}

const FAQItem = ({ question, answer, isOpen, onClick }: FAQItemProps) => (
  <div className="border-b border-border/50 last:border-0">
    <button
      onClick={onClick}
      className="w-full py-4 px-2 flex items-center justify-between text-left hover:bg-secondary/50 transition-colors rounded-lg"
      aria-expanded={isOpen}
    >
      <h4 className="text-base md:text-lg font-semibold text-foreground pr-4">{question}</h4>
      {isOpen ? (
        <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" />
      ) : (
        <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      )}
    </button>
    {isOpen && (
      <div className="px-2 pb-4 text-muted-foreground animate-fadeIn">
        <p>{answer}</p>
      </div>
    )}
  </div>
)

interface FAQSectionProps {
  faqs: Array<{ question: string; answer: string }>
  title?: string
}

export const FAQSection = ({ faqs, title = 'Frequently Asked Questions (FAQ)' }: FAQSectionProps) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="mt-12 border-t border-border/50 pt-10">
      <h3 className="text-2xl font-bold mb-6">{title}</h3>
      <div className="space-y-2">
        {faqs.map((faq, index) => (
          <FAQItem
            key={index}
            question={faq.question}
            answer={faq.answer}
            isOpen={openIndex === index}
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>
    </div>
  )
}

export const getBusinessFAQs = (toolId: string): Array<{ question: string; answer: string }> => {
  const commonFAQs = [
    {
      question: "Is my business data safe when using this calculator?",
      answer: "Yes, absolutely. This calculator runs 100% in your browser (client-side). We don't store, save, or transmit any data you enter. Your business information remains completely private and secure."
    },
    {
      question: "Can I use this calculator for multiple scenarios?",
      answer: "Yes, you can run unlimited calculations with different inputs to compare scenarios. This helps in strategic planning, what-if analysis, and making informed business decisions."
    },
    {
      question: "Do I need business knowledge to use this tool?",
      answer: "Basic business understanding helps, but the calculator provides clear labels and explanations. Simply enter your numbers, and the tool will calculate results with detailed step-by-step breakdowns."
    },
    {
      question: "Can I download or save my calculations?",
      answer: "Yes, you can download results in various formats including PDF, Excel, and CSV. Use the download button at the top of the page after calculating your results."
    },
    {
      question: "Is this calculator suitable for startups?",
      answer: "Absolutely. Startups can use this for business planning, investor presentations, pricing strategies, and financial projections. It's particularly useful during the planning and fundraising phases."
    },
    {
      question: "How should I use the results from this calculator?",
      answer: "Use results for planning, benchmarking, and decision-making. However, always consult with a financial advisor or business consultant for major strategic decisions that could significantly impact your business."
    },
    {
      question: "Can this replace professional business consulting?",
      answer: "No, this tool provides calculations and insights but cannot replace personalized advice from experienced business consultants who understand your specific situation, industry, and market dynamics."
    },
    {
      question: "What if my business model is unique?",
      answer: "While the calculator uses standard formulas, you can adjust inputs to fit your business model. If standard metrics don't fully apply, consider consulting with an expert for custom analysis tailored to your needs."
    },
    {
      question: "How frequently should I use this calculator?",
      answer: "Regular use helps track progress and trends. Monthly calculations are ideal for small businesses, quarterly for established companies, and whenever you're making major business decisions or strategy changes."
    },
    {
      question: "Can I share these results with investors or partners?",
      answer: "Yes, you can download and share the results. However, ensure you provide context and explain the assumptions behind your inputs to avoid misinterpretation or misunderstanding."
    },
    {
      question: "Is this calculator free to use?",
      answer: "Yes, this tool is completely free with no hidden charges, subscriptions, or usage limits. Use it as often as you need for your business planning and analysis."
    },
    {
      question: "How accurate are the calculations?",
      answer: "This calculator uses standard business formulas and best practices used by financial professionals. Results are highly accurate for planning purposes, but actual outcomes may vary based on market conditions and execution."
    }
  ]

  // Tool-specific FAQs
  if (toolId === 'profit-margin' || toolId === 'gross-profit-calculator' || toolId === 'net-profit-calculator') {
    return [
      {
        question: "What is the difference between gross profit margin and net profit margin?",
        answer: "Gross profit margin is calculated by subtracting Cost of Goods Sold (COGS) from revenue, showing profit after direct costs. Net profit margin accounts for all expenses including operating costs, taxes, and interest, representing the actual profit after all deductions."
      },
      {
        question: "What is a good profit margin for a business?",
        answer: "A good profit margin varies by industry. Generally, 5-10% is considered low, 10-20% is average, and above 20% is excellent. Tech and software companies often have 25-40% margins, while retail typically has 2-5%."
      },
      {
        question: "How can I improve my profit margins?",
        answer: "You can improve margins by: 1) Reducing COGS through better supplier negotiations, 2) Increasing prices strategically, 3) Reducing operating expenses, 4) Improving operational efficiency, 5) Focusing on higher-margin products or services."
      },
      ...commonFAQs
    ]
  }

  if (toolId === 'break-even-calculator') {
    return [
      {
        question: "What is the break-even point in business?",
        answer: "The break-even point is the sales volume at which total revenue equals total costs, resulting in zero profit or loss. It's the minimum sales needed to cover all fixed and variable costs."
      },
      {
        question: "Why is break-even analysis important?",
        answer: "Break-even analysis helps determine pricing strategies, assess business viability, plan production volumes, evaluate new product launches, and understand how changes in costs or prices affect profitability."
      },
      {
        question: "What are fixed costs?",
        answer: "Fixed costs remain constant regardless of production volume, such as rent, salaries, insurance, equipment depreciation, and license fees. They must be paid even if you produce nothing."
      },
      ...commonFAQs
    ]
  }

  if (toolId === 'markup-calculator') {
    return [
      {
        question: "What's the difference between markup and margin?",
        answer: "Markup is the percentage added to cost to determine selling price. Margin is the percentage of selling price that is profit. A 50% markup results in a 33.3% margin. They're related but mathematically different."
      },
      {
        question: "What is a typical markup percentage?",
        answer: "Typical markup varies by industry. Retail clothing: 50-100%, restaurants: 200-400%, jewelry: 50-300%, groceries: 10-20%, electronics: 15-30%. Consider your costs, competition, and market positioning."
      },
      {
        question: "How do I calculate the right markup for my product?",
        answer: "Consider your costs (including overhead), competitor pricing, perceived value, target profit margin, and market demand. A sustainable markup covers all costs, provides profit, and remains competitive."
      },
      ...commonFAQs
    ]
  }

  // Default FAQs for other business tools
  return commonFAQs
}

export const getPhysicsFAQs = (toolId: string): Array<{ question: string; answer: string }> => {
  const commonFAQs = [
    {
      question: "Is this calculator accurate for real-world applications?",
      answer: "Yes, this calculator uses standard physics formulas taught in schools and used in engineering. Results are accurate for ideal conditions, but real-world factors like friction, air resistance, and measurement errors may cause slight variations."
    },
    {
      question: "Can I use this for homework or assignments?",
      answer: "Yes, this calculator is perfect for checking your work and understanding the calculation process. However, we recommend learning the formula and solving manually first to build understanding."
    },
    {
      question: "What units should I use for inputs?",
      answer: "Always use consistent SI units unless specified otherwise. For example: meters (m), kilograms (kg), seconds (s), newtons (N), joules (J), watts (W). The calculator will specify required units for each input."
    },
    {
      question: "Why are my results different from hand calculations?",
      answer: "Differences usually arise from rounding. This calculator uses full precision internally and rounds only for display. If using different significant figures, results may vary slightly but should be very close."
    },
    {
      question: "Can I use this for engineering projects?",
      answer: "This calculator provides accurate theoretical calculations suitable for preliminary design and academic work. For critical engineering applications, verify with professional engineering software and consult with qualified engineers."
    },
    {
      question: "Do I need physics knowledge to use this?",
      answer: "Basic understanding of the concept helps, but the calculator provides clear labels and explanations. Enter your known values, and the tool will calculate the result with step-by-step formulas shown."
    },
    {
      question: "How do I interpret the results?",
      answer: "Results include the calculated value, units, and often step-by-step calculations showing the formula used. Read the explanation provided to understand what the result means in practical terms."
    },
    {
      question: "Can I calculate multiple scenarios?",
      answer: "Yes, you can run unlimited calculations with different input values. This is great for comparing scenarios, understanding how variables affect outcomes, and exploring what-if situations."
    },
    {
      question: "Are calculations stored or saved?",
      answer: "No, all calculations happen in your browser (client-side). We don't store, save, or transmit any data. Your inputs and results remain completely private on your device."
    },
    {
      question: "Is this calculator suitable for students?",
      answer: "Absolutely! Students from high school to university level can use this for learning, homework verification, exam preparation, and building intuition about physics concepts and relationships."
    },
    {
      question: "Can I download the calculation results?",
      answer: "Yes, you can download results in PDF, Excel, or CSV formats. This is useful for including in reports, assignments, or keeping records of your calculations."
    },
    {
      question: "Is this calculator free to use?",
      answer: "Yes, completely free with no hidden charges, registrations, or usage limits. Use it as many times as needed for your studies, projects, or professional work."
    }
  ]

  // Tool-specific FAQs
  if (toolId === 'velocity-calculator') {
    return [
      {
        question: "What is velocity and how is it different from speed?",
        answer: "Velocity is speed with direction (a vector quantity). Speed is just how fast something moves (scalar). For example, 50 km/h north is velocity, while 50 km/h is speed."
      },
      {
        question: "What are the units of velocity?",
        answer: "Common units include meters per second (m/s), kilometers per hour (km/h), miles per hour (mph), feet per second (ft/s). SI unit is m/s."
      },
      {
        question: "Can velocity be negative?",
        answer: "Yes, negative velocity indicates movement in the opposite direction to the positive reference direction. It's about direction, not just magnitude."
      },
      ...commonFAQs
    ]
  }

  if (toolId === 'force-calculator') {
    return [
      {
        question: "What is Newton's Second Law of Motion?",
        answer: "Newton's Second Law states that Force = Mass × Acceleration (F = ma). The force applied to an object is directly proportional to its mass and the acceleration produced."
      },
      {
        question: "What is a Newton (N)?",
        answer: "A Newton is the SI unit of force. One Newton is the force required to accelerate a 1 kg mass by 1 m/s². It's named after Isaac Newton."
      },
      {
        question: "How is force related to weight?",
        answer: "Weight is the force of gravity on an object. Weight = Mass × Gravitational acceleration (W = mg), where g ≈ 9.8 m/s² on Earth."
      },
      ...commonFAQs
    ]
  }

  if (toolId === 'kinetic-energy' || toolId === 'potential-energy') {
    return [
      {
        question: "What is the difference between kinetic and potential energy?",
        answer: "Kinetic energy is energy of motion (KE = ½mv²). Potential energy is stored energy due to position (PE = mgh). A ball thrown upward converts KE to PE and back."
      },
      {
        question: "What is the unit of energy?",
        answer: "The SI unit is the Joule (J). One Joule is the energy transferred when a force of 1 Newton moves an object 1 meter. Other units include calories and kilowatt-hours."
      },
      {
        question: "Is energy conserved?",
        answer: "Yes, according to the Law of Conservation of Energy, energy cannot be created or destroyed, only converted from one form to another. Total energy in a closed system remains constant."
      },
      ...commonFAQs
    ]
  }

  // Default physics FAQs
  return commonFAQs
}

export const getTaxFAQs = (toolId: string): FAQ[] => {
  const taxFaqs: FAQ[] = [
    {
      question: 'How is income tax calculated in India?',
      answer: 'Income tax is calculated based on your total taxable income and tax slab rates. First, calculate your gross income, subtract deductions under Section 80C, 80D, etc., then apply tax rates based on your chosen tax regime (Old or New).'
    },
    {
      question: 'What is the difference between Old and New Tax Regime?',
      answer: 'Old Tax Regime allows numerous deductions (80C, 80D, HRA, etc.) with higher tax rates. New Tax Regime has lower tax rates but minimal deductions. Choose based on your investments and deductions.'
    },
    {
      question: 'What deductions are available under Section 80C?',
      answer: 'Section 80C allows up to ₹1.5 lakh deductions for: PPF, EPF, Life Insurance premiums, ELSS, NSC, Home Loan principal, Tuition fees, Tax-saving FDs, and Sukanya Samriddhi Yojana.'
    },
    {
      question: 'How does HRA exemption work?',
      answer: 'HRA exemption is the minimum of: (1) Actual HRA received, (2) 50% of salary for metro cities or 40% for non-metros, (3) Rent paid minus 10% of salary. This reduces your taxable income significantly.'
    },
    {
      question: 'What is GST and how is it calculated?',
      answer: 'GST (Goods and Services Tax) is an indirect tax on goods and services. It has three components: CGST, SGST (for intra-state) or IGST (for inter-state). Tax is calculated as: GST Amount = Base Price × GST Rate / 100.'
    },
    {
      question: 'What are the different GST slabs in India?',
      answer: 'India has 5 GST slabs: 0% (essential items), 5% (common use items), 12% (standard goods), 18% (most goods), and 28% (luxury items). Most services are taxed at 18%.'
    },
    {
      question: 'How to calculate Standard Deduction?',
      answer: 'Standard Deduction is ₹50,000 for salaried employees (available in both Old and New regimes). It is automatically deducted from your gross salary before calculating taxable income.'
    },
    {
      question: 'What is TDS and when is it deducted?',
      answer: 'TDS (Tax Deducted at Source) is tax deducted when income is paid. Employers deduct TDS on salary if annual income exceeds ₹2.5 lakh. Banks deduct TDS on interest if it exceeds ₹40,000 (₹50,000 for senior citizens).'
    },
    {
      question: 'Can I claim both HRA and Home Loan interest?',
      answer: 'Yes, you can claim both if you live in a rented house in one city and own a house in another city. HRA exemption and home loan interest (Section 24) can be claimed simultaneously.'
    },
    {
      question: 'What is the tax benefit on home loan?',
      answer: 'You can claim: (1) Up to ₹2 lakh interest deduction under Section 24(b) for self-occupied property, (2) Entire interest if property is rented out, (3) Up to ₹1.5 lakh principal repayment under Section 80C.'
    },
    {
      question: 'How does gratuity calculation work?',
      answer: 'Gratuity = (Last drawn salary × Years of service × 15) / 26. For government employees, it is (Last drawn salary × Years of service × 15) / 30. Maximum limit is ₹20 lakh.'
    },
    {
      question: 'What is Professional Tax and who pays it?',
      answer: 'Professional Tax is a state-level tax on salaried individuals, professionals, and traders. Maximum limit is ₹2,500 per year. It is deducted monthly by employers and is deductible under Section 16(iii).'
    },
    {
      question: 'How to save tax legally in India?',
      answer: 'Invest in: (1) Section 80C options (PPF, ELSS, EPF), (2) Health insurance (80D), (3) Home loan, (4) NPS (additional ₹50k under 80CCD(1B)), (5) Claim HRA, LTA, and other allowances properly.'
    },
    {
      question: 'What is Advance Tax and who should pay it?',
      answer: 'Advance Tax is tax paid in installments during the financial year if your tax liability exceeds ₹10,000. Due dates: 15% by Jun 15, 45% by Sep 15, 75% by Dec 15, and 100% by Mar 15.'
    },
    {
      question: 'How to calculate tax on capital gains?',
      answer: 'Short-term Capital Gains (STCG): Taxed at 15% for equity, normal slab rates for others. Long-term Capital Gains (LTCG): 10% above ₹1 lakh for equity, 20% with indexation for debt/property.'
    }
  ];
  return taxFaqs;
};

export const getLoanFAQs = (toolId: string): FAQ[] => {
  const loanFaqs: FAQ[] = [
    {
      question: 'What is EMI and how is it calculated?',
      answer: 'EMI (Equated Monthly Installment) is a fixed monthly payment for loans. It is calculated using the formula: EMI = [P × R × (1+R)^N] / [(1+R)^N-1], where P is principal, R is monthly interest rate, and N is tenure in months.'
    },
    {
      question: 'How to reduce home loan EMI?',
      answer: 'You can reduce EMI by: (1) Increasing tenure (lowers EMI but increases total interest), (2) Making prepayments to reduce principal, (3) Refinancing to lower interest rates, (4) Negotiating with your bank for rate reduction.'
    },
    {
      question: 'What is the difference between reducing and flat interest rate?',
      answer: 'Reducing Rate: Interest calculated on outstanding principal (most common for home/personal loans). Flat Rate: Interest calculated on original principal throughout. Reducing rate is more borrower-friendly despite appearing higher.'
    },
    {
      question: 'Should I opt for fixed or floating interest rate?',
      answer: 'Fixed Rate: Interest remains constant (good in rising rate environment). Floating Rate: Interest changes with market (beneficial in falling rate scenario). Most home loans in India are floating rate linked to repo rate.'
    },
    {
      question: 'What is loan prepayment and are there charges?',
      answer: 'Prepayment means paying loan amount before tenure ends. For floating rate loans, no prepayment charges (RBI mandate). Fixed rate loans may have 2-5% penalty. Prepayment significantly reduces interest burden.'
    },
    {
      question: 'How much home loan can I get on my salary?',
      answer: 'Generally, banks offer home loans up to 60 times your monthly salary or where EMI does not exceed 40-50% of your monthly income. ₹50,000 salary can get ₹30-35 lakh loan at 8.5% for 20 years.'
    },
    {
      question: 'What is Top-Up Loan and how does it work?',
      answer: 'Top-Up Loan is additional loan over existing home/car loan at same interest rate. It is based on repayment track record and property value. Used for renovation, education, medical, etc. Cheaper than personal loans.'
    },
    {
      question: 'What documents are needed for personal loan?',
      answer: 'Required documents: (1) Identity proof (Aadhaar, PAN), (2) Address proof, (3) Salary slips (last 3 months), (4) Bank statements (last 6 months), (5) Employment proof, (6) Photographs, (7) Form 16 for salaried.'
    },
    {
      question: 'How does credit score affect loan approval?',
      answer: 'Credit score (CIBIL score) ranges from 300-900. Above 750 is excellent and gets quick approvals with lower interest rates. Below 650 faces rejections. Maintain good score by paying EMIs on time and keeping credit utilization below 30%.'
    },
    {
      question: 'What is Loan-to-Value (LTV) ratio?',
      answer: 'LTV is loan amount as percentage of property value. RBI allows up to 90% LTV for homes below ₹30 lakh, 80% for ₹30-75 lakh, and 75% above ₹75 lakh. Higher down payment (lower LTV) gets better interest rates.'
    },
    {
      question: 'Can I transfer my existing loan to another bank?',
      answer: 'Yes, through balance transfer. Benefits include: lower interest rate (save on interest), better loan terms, top-up facility. Calculate processing fees and compare savings. Usually beneficial if rate difference is 0.5%+ and tenure remaining is significant.'
    },
    {
      question: 'What is Step-Up EMI and when should I choose it?',
      answer: 'Step-Up EMI starts with lower EMIs that increase periodically (yearly/quarterly). Ideal for young professionals expecting salary hikes. Initial EMI is 20-30% lower than regular, increases 5-10% annually. Eases initial financial burden.'
    },
    {
      question: 'How to calculate total interest paid on a loan?',
      answer: 'Total Interest = (EMI × Number of months) - Principal Amount. For example, ₹10 lakh loan at 10% for 10 years: EMI = ₹13,215, Total Interest = (₹13,215 × 120) - ₹10,00,000 = ₹5,85,800.'
    },
    {
      question: 'What is moratorium period in education loans?',
      answer: 'Moratorium or repayment holiday is course duration + 6 months or 1 year after getting job. During this period, you can pay only interest (partial repayment) or defer everything (simple interest applies). EMI starts after moratorium.'
    },
    {
      question: 'Are home loan interest payments tax deductible?',
      answer: 'Yes, under Section 24(b): up to ₹2 lakh interest deduction for self-occupied property. For rented property, entire interest is deductible. Principal repayment up to ₹1.5 lakh under Section 80C. First-time buyers get additional ₹50k under 80EE/80EEA.'
    }
  ];
  return loanFaqs;
};

export const getInvestmentFAQs = (toolId: string): FAQ[] => {
  const investmentFaqs: FAQ[] = [
    {
      question: 'What is SIP and how does it work?',
      answer: 'SIP (Systematic Investment Plan) is investing fixed amount regularly in mutual funds. It averages out cost through market cycles (rupee cost averaging), enforces discipline, and suits salaried investors. Start with as low as ₹500/month.'
    },
    {
      question: 'How much return can I expect from SIP?',
      answer: 'Historical equity mutual fund returns: 12-15% CAGR over 10+ years. Debt funds: 7-9%. Returns vary with market conditions and fund selection. SIPs reduce volatility and timing risk through rupee cost averaging.'
    },
    {
      question: 'What is the power of compounding?',
      answer: 'Compounding is earning returns on returns. ₹10,000/month SIP at 12% for 20 years = ₹24 lakh invested becomes ₹99.9 lakh. Starting early amplifies compounding - starting at 25 vs 35 can mean 2-3x more wealth at retirement.'
    },
    {
      question: 'Should I invest in direct or regular mutual funds?',
      answer: 'Direct Plans have lower expense ratio (0.5-1% less) as no distributor commission, giving 1-2% higher returns over long term. Regular plans offer advisor guidance. For informed investors, direct plans are better for wealth creation.'
    },
    {
      question: 'What is the difference between SIP and lumpsum investment?',
      answer: 'SIP: Regular fixed investments, averages out market volatility, good for salaried. Lumpsum: One-time big investment, better in falling markets or with surplus cash. SIP reduces timing risk but lumpsum can give higher returns in bull markets.'
    },
    {
      question: 'How to choose the right mutual fund?',
      answer: 'Consider: (1) Investment goal & horizon, (2) Risk appetite (equity/debt mix), (3) Fund past performance (3-5 years), (4) Expense ratio, (5) Fund manager track record, (6) AUM size, (7) Consistency of returns. Diversify across 4-6 funds.'
    },
    {
      question: 'What is asset allocation and why is it important?',
      answer: 'Asset allocation is distributing investments across equity, debt, gold, and real estate. Reduces risk through diversification. Thumb rule: equity allocation = 100 - age (e.g., 30-year-old = 70% equity, 30% debt). Rebalance annually.'
    },
    {
      question: 'When should I book profits from mutual funds?',
      answer: 'Book profits when: (1) Goal is achieved, (2) Fund underperforms category for 2+ years, (3) Rebalancing portfolio, (4) Fund manager changes, (5) Strategy drift. Avoid frequent churning in equity funds - stay invested 5+ years for tax efficiency.'
    },
    {
      question: 'What is XIRR and how is it different from absolute return?',
      answer: 'XIRR (Extended Internal Rate of Return) measures returns for irregular cash flows like SIPs, considering timing of each investment. Absolute return is simple percentage gain. XIRR is more accurate for SIPs and shows annualized performance.'
    },
    {
      question: 'Are mutual funds better than Fixed Deposits?',
      answer: 'Mutual Funds offer higher returns (10-12% equity, 7-8% debt) but have market risk. FDs give guaranteed 6-7% returns with safety. Use FDs for emergency fund and short-term goals. Use equity funds for long-term wealth creation (5+ years).'
    },
    {
      question: 'What is the tax treatment on mutual fund returns?',
      answer: 'Equity Funds: LTCG (>1 year) - 10% above ₹1 lakh gain, STCG - 15%. Debt Funds (from Apr 2023): Taxed as per your income tax slab regardless of holding period. Dividend is also taxed as per your slab.'
    },
    {
      question: 'How much should I invest monthly in SIP?',
      answer: 'Start with 10-20% of monthly income. Increase SIP by 10-15% annually (step-up SIP). ₹10,000/month for 25 years at 12% = ₹1.89 crore. ₹20,000/month = ₹3.78 crore. Start early and increase with salary hikes.'
    },
    {
      question: 'What is rupee cost averaging in SIP?',
      answer: 'You buy more units when market is down (prices low) and fewer units when market is up (prices high). This averages out your purchase cost over time, reducing impact of volatility. Example: ₹1000/month buys 10 units at ₹100, 20 units at ₹50 - average ₹66.67.'
    },
    {
      question: 'Should I stop SIP when market is high?',
      answer: 'No, continue SIP regardless of market levels. Timing the market is difficult. SIPs work best with long-term discipline. Market highs are followed by higher highs over time. Stopping SIP means missing compounding and potential future gains.'
    },
    {
      question: 'What is the ideal investment horizon for equity mutual funds?',
      answer: 'Minimum 5 years for equity mutual funds to ride out market volatility. 7-10 years is optimal for wealth creation. Longer horizon (15-20 years) maximizes compounding benefits. Use debt funds for goals less than 3 years away.'
    }
  ];
  return investmentFaqs;
};

export const getHealthFAQs = (toolId: string): FAQ[] => {
  const healthFaqs: FAQ[] = [
    {
      question: 'What is BMI and how is it calculated?',
      answer: 'BMI (Body Mass Index) = Weight (kg) / Height² (m²). It categorizes: <18.5 Underweight, 18.5-24.9 Normal, 25-29.9 Overweight, 30+ Obese. While useful for population studies, BMI does not account for muscle mass, age, or body composition.'
    },
    {
      question: 'What is BMR and how does it differ from TDEE?',
      answer: 'BMR (Basal Metabolic Rate) is calories burned at complete rest. TDEE (Total Daily Energy Expenditure) = BMR × Activity Level multiplier. TDEE includes daily activities and exercise. Weight loss requires eating below TDEE, weight gain above TDEE.'
    },
    {
      question: 'How many calories should I eat to lose weight?',
      answer: 'Calculate your TDEE first. For safe weight loss: eat 300-500 calories below TDEE (lose 0.5-1 kg/month). Extreme deficits (>1000 cal) cause muscle loss and metabolism slowdown. Combine calorie deficit with protein intake and strength training.'
    },
    {
      question: 'What is body fat percentage and why is it important?',
      answer: 'Body fat % shows how much of your weight is fat vs lean mass (muscle, bone, water). More accurate than BMI for fitness assessment. Healthy ranges: Men 10-20%, Women 18-28%. Athletes have lower (6-13% men, 14-20% women). High body fat increases health risks.'
    },
    {
      question: 'How to calculate daily protein requirement?',
      answer: 'General: 0.8g per kg body weight. For muscle building: 1.6-2.2g/kg. For weight loss: 1.8-2.5g/kg (preserves muscle). 70kg person needs: 56-175g protein depending on goal. Distribute across meals for better absorption.'
    },
    {
      question: 'What are macros and how to calculate them?',
      answer: 'Macros are Protein, Carbs, and Fats. Typical split: Protein 30% (4 cal/g), Carbs 40% (4 cal/g), Fats 30% (9 cal/g). For 2000 cal diet: 150g protein, 200g carbs, 67g fats. Adjust based on goals (low-carb, high-protein, etc).'
    },
    {
      question: 'How much water should I drink daily?',
      answer: 'General rule: 30-35 ml per kg body weight. 70kg person = 2.1-2.5 liters. Increase with exercise, hot climate, or illness. Signs of good hydration: light yellow urine, no excessive thirst, good energy levels.'
    },
    {
      question: 'What is the ideal body fat percentage for abs to show?',
      answer: 'Men: 10-12% body fat for visible abs, 6-9% for defined six-pack. Women: 16-19% for visible abs, 14-16% for definition. Genetics also play a role. Focus on overall health first, aesthetics second. Very low body fat can affect hormones.'
    },
    {
      question: 'How to break a weight loss plateau?',
      answer: 'Strategies: (1) Recalculate TDEE (decreases as weight drops), (2) Increase activity/steps, (3) Refeed day (eat at maintenance), (4) Track calories accurately, (5) Improve sleep, (6) Manage stress, (7) Change workout routine.'
    },
    {
      question: 'What is the difference between weight loss and fat loss?',
      answer: 'Weight loss = loss of fat + muscle + water. Fat loss = specifically losing fat while preserving muscle. Focus on fat loss through: calorie deficit + high protein + strength training. Scale weight can mislead - use body composition and measurements.'
    },
    {
      question: 'How many calories does 1 kg of fat contain?',
      answer: '1 kg of body fat = approximately 7,700 calories. To lose 1 kg fat, create 7,700 calorie deficit over time. Safe rate: 500 cal deficit/day = 1 kg fat loss in 2 weeks. Faster loss often includes water and muscle.'
    },
    {
      question: 'What is ideal weight for my height?',
      answer: 'Use BMI 22 (middle of healthy range) as reference. For 170cm: ideal = 22 × (1.7)² = 63.6 kg. However, consider: body composition, muscle mass, frame size. Athletes may be "overweight" by BMI but have low body fat.'
    },
    {
      question: 'Should I do cardio or weights for fat loss?',
      answer: 'Both are beneficial. Cardio burns more calories during workout. Weights build muscle, increasing BMR (muscle burns more at rest). Optimal: combine both - 3-4 strength sessions + 2-3 cardio sessions weekly. Diet is 70% of fat loss.'
    },
    {
      question: 'How to calculate body fat percentage at home?',
      answer: 'Methods: (1) US Navy Method (using neck, waist, hip measurements), (2) Skinfold calipers, (3) Bioelectrical impedance scales. Most accurate: DEXA scan. Navy method is reasonably accurate (±3-4%) and free. Take multiple measurements for consistency.'
    },
    {
      question: 'What is metabolic adaptation and how to avoid it?',
      answer: 'Prolonged calorie deficit slows metabolism (body adapts to conserve energy). Prevent by: (1) Moderate deficits (not extreme), (2) Diet breaks (eat at maintenance for 1-2 weeks every 3 months), (3) Strength training, (4) High protein intake.'
    }
  ];
  return healthFaqs;
};

export const getRetirementFAQs = (toolId: string): FAQ[] => {
  const retirementFaqs: FAQ[] = [
    {
      question: 'How much corpus do I need for retirement?',
      answer: 'Rule of thumb: 25-30 times your annual expenses. If you need ₹50,000/month (₹6 lakh/year), corpus = ₹1.5-1.8 crore. Account for: inflation (6-7%), life expectancy (85-90 years), medical costs, lifestyle. Start early to accumulate through compounding.'
    },
    {
      question: 'What is the 4% withdrawal rule?',
      answer: '4% rule: Withdraw 4% of retirement corpus annually (adjusted for inflation). ₹1 crore corpus = ₹4 lakh/year or ₹33,333/month. Based on historical data, this ensures corpus lasts 30+ years. Conservative investors use 3-3.5%.'
    },
    {
      question: 'When should I start retirement planning?',
      answer: 'As early as possible - ideally in 20s. Starting at 25 vs 35 means 10 extra years of compounding. ₹10,000/month from 25-60 (35 years) at 12% = ₹6.43 crore. Starting at 35 (25 years) = ₹1.89 crore. Time is your biggest asset.'
    },
    {
      question: 'What is NPS and should I invest in it?',
      answer: 'NPS (National Pension System) is government retirement scheme. Benefits: Tax deduction (₹50k extra under 80CCD(1B)), low cost (0.01% fee), market-linked returns (9-11% historical). Drawback: Mandatory annuity for 40% at retirement, withdrawal restrictions.'
    },
    {
      question: 'How to calculate retirement corpus with inflation?',
      answer: 'Current monthly expense × (1 + inflation)^years to retirement × 12 × 25. Example: ₹40k/month now, retire in 30 years, 6% inflation = ₹40,000 × (1.06)^30 × 12 × 25 = ₹13.8 crore needed. Inflation significantly impacts long-term needs.'
    },
    {
      question: 'What is FIRE movement and how to achieve it?',
      answer: 'FIRE (Financial Independence, Retire Early) means saving aggressively to retire before 60. Requires: (1) 50-70% savings rate, (2) 25-30x annual expenses as corpus, (3) Frugal lifestyle, (4) Multiple income streams. Achievable in 15-20 years with discipline.'
    },
    {
      question: 'Should I take pension or lump sum at retirement?',
      answer: 'Pension (annuity): Regular monthly income, no market risk, good for risk-averse, but inflation erodes value. Lumpsum: Full control, can invest for higher returns, flexibility, but requires investment discipline. Consider: 60% lumpsum (invest in SWP) + 40% annuity for balance.'
    },
    {
      question: 'What is SWP and how does it work in retirement?',
      answer: 'SWP (Systematic Withdrawal Plan) withdraws fixed amount monthly from mutual funds. Remaining corpus grows. Tax-efficient for retirement income. ₹1 crore at 10% with ₹50k/month withdrawal can last 20+ years. Better than annuity for inflation protection.'
    },
    {
      question: 'How much EPF corpus will I have at retirement?',
      answer: 'EPF compounds at 8-8.5% annually. Employee + Employer contribution = 24% of basic salary. ₹30,000 basic salary = ₹7,200/month EPF. For 30 years at 8.5% = ₹1.32 crore. EPF is foundation - supplement with equity investments.'
    },
    {
      question: 'What is the ideal asset allocation for retirement?',
      answer: 'Pre-retirement (5+ years to retire): 60-70% equity, 30-40% debt. At retirement: 40-50% equity, 40-50% debt, 10% gold/cash. Post-retirement: Gradually shift to 30% equity, 60% debt, 10% liquid. Equity provides inflation protection even in retirement.'
    },
    {
      question: 'Are PPF returns sufficient for retirement?',
      answer: 'PPF gives 7-7.5% tax-free returns. Safe but returns barely beat inflation. Not sufficient alone for retirement. Use PPF for debt allocation (₹1.5 lakh/year limit). Primary retirement wealth should come from equity mutual funds (12-15% long-term returns).'
    },
    {
      question: 'How to plan for medical expenses in retirement?',
      answer: 'Medical inflation is 10-15% annually. By 60, health insurance premiums are high. Solutions: (1) Buy adequate health insurance early (₹10-20 lakh), (2) Top-up plans, (3) Allocate 15-20% corpus for medical emergencies, (4) Stay invested in equity for growth.'
    },
    {
      question: 'What is pension from EPF and how is it calculated?',
      answer: 'EPS (Employee Pension Scheme) provides pension from EPF. Pension = (Pensionable salary × Service years) / 70. For ₹15,000 pensionable salary and 30 years service = ₹6,428/month. Increases with cost of living adjustments. Not sufficient alone for retirement.'
    },
    {
      question: 'Should I pay off home loan before retirement?',
      answer: 'Ideally yes - reduces monthly obligations and stress. Prioritize loan closure 5 years before retirement. However, if loan is at 7% and investments return 12%, consider continuing EMI and keeping investments. Balance financial math with peace of mind.'
    },
    {
      question: 'How to generate monthly income after retirement?',
      answer: 'Options: (1) SWP from debt/hybrid funds (tax-efficient), (2) Dividend from equity (variable), (3) Rental income, (4) Bank FD interest, (5) Post Office MIS, (6) Senior Citizen Saving Scheme (8.2%), (7) Annuity (guaranteed but low). Diversify across multiple sources.'
    }
  ];
  return retirementFaqs;
};

export const getMiscFAQs = (toolId: string): FAQ[] => {
  const miscFaqs: FAQ[] = [
    {
      question: 'How to calculate percentage of a number?',
      answer: 'Percentage = (Part / Whole) × 100. To find X% of Y: (X / 100) × Y. Example: 20% of 500 = (20/100) × 500 = 100. To find what % is X of Y: (X / Y) × 100. Example: 50 is what % of 200? (50/200) × 100 = 25%.'
    },
    {
      question: 'How to calculate percentage increase or decrease?',
      answer: 'Percentage Change = [(New Value - Old Value) / Old Value] × 100. Positive = increase, Negative = decrease. Example: Price increased from ₹100 to ₹120 = [(120-100)/100] × 100 = 20% increase.'
    },
    {
      question: 'How to calculate tip amount at restaurants?',
      answer: 'Standard tip: 10% (good service), 15% (great service), 20%+ (excellent service). Quick calculation: 10% = bill / 10, 15% = 10% + half of 10%, 20% = 10% × 2. For ₹1,000 bill: 10% = ₹100, 15% = ₹150, 20% = ₹200.'
    },
    {
      question: 'How to calculate age accurately in years?',
      answer: 'Age = Current Year - Birth Year. Adjust if birthday not reached this year. Example: Born in 1990, current year 2024, birthday not reached = 33 years. Consider leap years for exact day calculations. Online calculators provide precise age in years, months, and days.'
    },
    {
      question: 'How to calculate date difference between two dates?',
      answer: 'Count total days between dates accounting for leap years. Divide by 365.25 for years, by 30.44 for months, by 7 for weeks. Most useful for: loan tenure, age calculation, project duration, relationship milestones. Use calculator for accuracy.'
    },
    {
      question: 'How to calculate fuel cost for a trip?',
      answer: 'Fuel Cost = (Distance / Mileage) × Fuel Price. Example: 500 km trip, car gives 15 km/l, petrol ₹100/l = (500/15) × 100 = ₹3,333. Account for: traffic conditions, AC usage, terrain, driving style - actual mileage may vary ±20%.'
    },
    {
      question: 'What is average vs median and when to use each?',
      answer: 'Average (Mean) = Sum / Count. Median = Middle value when sorted. Use Median for: salaries (skewed by outliers), home prices. Use Average for: test scores, daily expenses. Median is more representative when data has extreme values.'
    },
    {
      question: 'How to calculate discount percentage?',
      answer: 'Discount % = [(Original Price - Sale Price) / Original Price] × 100. Example: ₹2,000 reduced to ₹1,500 = [(2000-1500)/2000] × 100 = 25% off. To find sale price: Sale Price = Original × (1 - Discount%/100).'
    },
    {
      question: 'How to split bills equally among friends?',
      answer: 'Per Person Amount = Total Bill / Number of People. For unequal consumption, track individual orders. Include tip in total before dividing. Apps help: Splitwise, Google Pay. For ₹3,000 bill + ₹300 tip among 5 friends = ₹660 each.'
    },
    {
      question: 'How to calculate unit price for comparison?',
      answer: 'Unit Price = Total Price / Quantity. Compare products: ₹100 for 500g = ₹20/100g vs ₹180 for 1kg = ₹18/100g. Second option is cheaper despite higher total cost. Essential for: grocery shopping, bulk buying decisions.'
    },
    {
      question: 'What is the difference between ratio and percentage?',
      answer: 'Ratio compares quantities (3:2, 5:1). Percentage expresses part of 100 (30%, 75%). Convert ratio to %: (Part / Total) × 100. Example: Ratio 3:2 means 3/(3+2) = 60% and 2/(3+2) = 40%. Both show relative comparison.'
    },
    {
      question: 'How to calculate annual growth rate (CAGR)?',
      answer: 'CAGR = [(Final Value / Initial Value)^(1/Years)] - 1. Example: ₹1 lakh grows to ₹2 lakh in 5 years = [(2/1)^(1/5)] - 1 = 14.87% annual growth. Smoothens year-to-year volatility, useful for investments, salaries, revenue.'
    },
    {
      question: 'How to calculate area of common shapes?',
      answer: 'Square: side², Rectangle: length × width, Circle: π × radius², Triangle: ½ × base × height. For room flooring: measure in feet, multiply L×W. Example: 12ft × 10ft room = 120 sq ft. Convert to sq meters: divide by 10.764.'
    },
    {
      question: 'How to convert between different units?',
      answer: 'Common conversions: 1 kg = 2.205 lbs, 1 km = 0.621 miles, 1 inch = 2.54 cm, 1 liter = 0.264 gallons. Temperature: °F = (°C × 9/5) + 32, °C = (°F - 32) × 5/9. Use online converters for precision.'
    },
    {
      question: 'How to calculate time duration between two times?',
      answer: 'Convert both to 24-hour format. Subtract start from end. Example: 9:30 AM to 5:45 PM = 17:45 - 09:30 = 8 hours 15 minutes. For time across midnight, add 24 hours. Useful for: work hours, sleep tracking, travel time.'
    }
  ];
  return miscFaqs;
};
