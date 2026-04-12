"use client"

import { useMemo } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { useSettings } from '@/components/providers/SettingsProvider'
import {
  formatNumber,
  formatCurrency as formatCurrencyUtil,
  formatPercentage,
  localeConfigs,
} from '@/lib/localeUtils'

/**
 * Smart calculator i18n hook.
 * Combines translation keys + locale-aware number/currency formatting.
 * 
 * Usage:
 *   const { t, common, labels, units, business, formatValue, formatCurrency, formatPct, currency, dir } = useCalculatorI18n()
 *   <label>{common.calculate}</label>
 *   <span>{formatCurrency(12500)}</span>  →  ₹12,500 or $12,500 based on locale
 */
export function useCalculatorI18n() {
  const { t, lang } = useTranslation()
  const { currency: selectedCurrency } = useSettings()

  const dir = useMemo(() => (lang === 'ar' || lang === 'ur' ? 'rtl' : 'ltr'), [lang])

  // Currency symbol: prefer user-selected currency, fallback to locale default
  const currencySymbol = useMemo(() => {
    if (selectedCurrency?.symbol) return selectedCurrency.symbol
    return localeConfigs[lang]?.currencySymbol ?? '₹'
  }, [selectedCurrency, lang])

  // Pre-resolved common action labels
  const common = useMemo(() => ({
    calculate:           t('calculators.common.calculate'),
    reset:               t('calculators.common.reset'),
    result:              t('calculators.common.result'),
    results:             t('calculators.common.results'),
    stepByStep:          t('calculators.common.step_by_step'),
    calculationBreakdown:t('calculators.common.calculation_breakdown'),
    copyResult:          t('calculators.common.copy_result'),
    share:               t('calculators.common.share'),
    export:              t('calculators.common.export'),
    print:               t('calculators.common.print'),
    summary:             t('calculators.common.summary'),
    details:             t('calculators.common.details'),
    addRow:              t('calculators.common.add_row'),
    remove:              t('calculators.common.remove'),
    period:              t('calculators.common.period'),
    amount:              t('calculators.common.amount'),
    enterValid:          t('calculators.common.enter_valid'),
    noData:              t('calculators.common.no_data'),
    investmentAnalysis:  t('calculators.common.investment_analysis'),
    loading:             t('calculators.common.loading'),
    error:               t('calculators.common.error'),
    copied:              t('calculators.common.copied'),
  }), [t])

  // Pre-resolved unit labels
  const units = useMemo(() => ({
    years:      t('calculators.units.years'),
    year:       t('calculators.units.year'),
    months:     t('calculators.units.months'),
    month:      t('calculators.units.month'),
    days:       t('calculators.units.days'),
    day:        t('calculators.units.day'),
    percent:    t('calculators.units.percent'),
    perYear:    t('calculators.units.per_year'),
    perMonth:   t('calculators.units.per_month'),
    kg:         t('calculators.units.kg'),
    lb:         t('calculators.units.lb'),
    cm:         t('calculators.units.cm'),
    ft:         t('calculators.units.ft'),
    sqft:       t('calculators.units.sqft'),
    sqm:        t('calculators.units.sqm'),
  }), [t])

  // Pre-resolved field labels
  const labels = useMemo(() => ({
    principal:    t('calculators.labels.principal'),
    rate:         t('calculators.labels.rate'),
    interestRate: t('calculators.labels.interest_rate'),
    amount:       t('calculators.labels.amount'),
    total:        t('calculators.labels.total'),
    totalAmount:  t('calculators.labels.total_amount'),
    net:          t('calculators.labels.net'),
    gross:        t('calculators.labels.gross'),
    period:       t('calculators.labels.period'),
    duration:     t('calculators.labels.duration'),
    tenure:       t('calculators.labels.tenure'),
    income:       t('calculators.labels.income'),
    expense:      t('calculators.labels.expense'),
    profit:       t('calculators.labels.profit'),
    loss:         t('calculators.labels.loss'),
    balance:      t('calculators.labels.balance'),
    payment:      t('calculators.labels.payment'),
    investment:   t('calculators.labels.investment'),
    return:       t('calculators.labels.return'),
    revenue:      t('calculators.labels.revenue'),
    cost:         t('calculators.labels.cost'),
    savings:      t('calculators.labels.savings'),
    tax:          t('calculators.labels.tax'),
    deduction:    t('calculators.labels.deduction'),
    interest:     t('calculators.labels.interest'),
    capital:      t('calculators.labels.capital'),
    value:        t('calculators.labels.value'),
    initialValue: t('calculators.labels.initial_value'),
    finalValue:   t('calculators.labels.final_value'),
    startDate:    t('calculators.labels.start_date'),
    endDate:      t('calculators.labels.end_date'),
    name:         t('calculators.labels.name'),
    type:         t('calculators.labels.type'),
    status:       t('calculators.labels.status'),
  }), [t])

  // Pre-resolved business calculator labels
  const business = useMemo(() => ({
    calculationMethod:    t('calculators.business.calculation_method'),
    simpleRoi:            t('calculators.business.simple_roi'),
    simpleRoiDesc:        t('calculators.business.simple_roi_desc'),
    npvAnalysis:          t('calculators.business.npv_analysis'),
    npvAnalysisDesc:      t('calculators.business.npv_analysis_desc'),
    cashflowIrr:          t('calculators.business.cashflow_irr'),
    cashflowIrrDesc:      t('calculators.business.cashflow_irr_desc'),
    initialInvestment:    t('calculators.business.initial_investment'),
    finalValue:           t('calculators.business.final_value'),
    timePeriod:           t('calculators.business.time_period'),
    discountRate:         t('calculators.business.discount_rate'),
    cashFlowsByPeriod:    t('calculators.business.cash_flows_by_period'),
    addPeriod:            t('calculators.business.add_period'),
    ratePlaceholder:      t('calculators.business.rate_placeholder'),
    calculateRoi:         t('calculators.business.calculate_roi'),
    returnOnInvestment:   t('calculators.business.return_on_investment'),
    npv:                  t('calculators.business.npv'),
    irr:                  t('calculators.business.irr'),
    payback:              t('calculators.business.payback'),
    netProfit:            t('calculators.business.net_profit'),
    cashFlowsAnalysis:    t('calculators.business.cash_flows_analysis'),
    investmentNotRecovered: t('calculators.business.investment_not_recovered'),
    paybackPeriod:        t('calculators.business.payback_period'),
    annualizedRoi:        t('calculators.business.annualized_roi'),
    pvOfReturns:          t('calculators.business.pv_of_returns'),
    npvPositive:          t('calculators.business.npv_positive'),
    npvNegative:          t('calculators.business.npv_negative'),
    roiExcellent:         t('calculators.business.roi_excellent'),
    roiGood:              t('calculators.business.roi_good'),
    roiModerate:          t('calculators.business.roi_moderate'),
    roiNegative:          t('calculators.business.roi_negative'),
    npvAddsValue:         t('calculators.business.npv_adds_value'),
    npvDestroysValue:     t('calculators.business.npv_destroys_value'),
    grossMargin:          t('calculators.business.gross_margin'),
    netMargin:            t('calculators.business.net_margin'),
    breakEvenUnits:       t('calculators.business.break_even_units'),
    breakEvenRevenue:     t('calculators.business.break_even_revenue'),
    fixedCosts:           t('calculators.business.fixed_costs'),
    variableCostPerUnit:  t('calculators.business.variable_cost_per_unit'),
    sellingPricePerUnit:  t('calculators.business.selling_price_per_unit'),
    contributionMargin:   t('calculators.business.contribution_margin'),
    clv:                  t('calculators.business.clv'),
    arpu:                 t('calculators.business.arpu'),
    churnRate:            t('calculators.business.churn_rate'),
    cac:                  t('calculators.business.cac'),
    monthlyRevenue:       t('calculators.business.monthly_revenue'),
    annualRevenue:        t('calculators.business.annual_revenue'),
    irrExceeds:           (irr: string, rate: string) =>
      t('calculators.business.irr_exceeds', { irr, rate }),
    investmentRecoveredIn: (periods: string) =>
      t('calculators.business.investment_recovered_in', { periods }),
    quickPayback:         t('calculators.business.quick_payback'),
    longPayback:          t('calculators.business.long_payback'),
  }), [t])

  // Pre-resolved loan calculator labels
  const loan = useMemo(() => ({
    loanAmount:         t('calculators.loan.loan_amount'),
    emi:                t('calculators.loan.emi'),
    monthlyEmi:         t('calculators.loan.monthly_emi'),
    tenure:             t('calculators.loan.tenure'),
    interestRate:       t('calculators.loan.interest_rate'),
    totalInterest:      t('calculators.loan.total_interest'),
    totalPayment:       t('calculators.loan.total_payment'),
    monthlyPayment:     t('calculators.loan.monthly_payment'),
    principalAmount:    t('calculators.loan.principal_amount'),
    loanType:           t('calculators.loan.loan_type'),
    homeLoan:           t('calculators.loan.home_loan'),
    carLoan:            t('calculators.loan.car_loan'),
    personalLoan:       t('calculators.loan.personal_loan'),
    educationLoan:      t('calculators.loan.education_loan'),
    processingFee:      t('calculators.loan.processing_fee'),
    outstandingBalance: t('calculators.loan.outstanding_balance'),
    prepayment:         t('calculators.loan.prepayment'),
    amortizationSchedule: t('calculators.loan.amortization_schedule'),
    principalPaid:      t('calculators.loan.principal_paid'),
    interestPaid:       t('calculators.loan.interest_paid'),
    balance:            t('calculators.loan.balance'),
  }), [t])

  // Pre-resolved health calculator labels
  const health = useMemo(() => ({
    weight:         t('calculators.health.weight'),
    height:         t('calculators.health.height'),
    age:            t('calculators.health.age'),
    gender:         t('calculators.health.gender'),
    male:           t('calculators.health.male'),
    female:         t('calculators.health.female'),
    bmi:            t('calculators.health.bmi'),
    bmiLabel:       t('calculators.health.bmi_label'),
    underweight:    t('calculators.health.underweight'),
    normal:         t('calculators.health.normal'),
    overweight:     t('calculators.health.overweight'),
    obese:          t('calculators.health.obese'),
    calories:       t('calculators.health.calories'),
    bmr:            t('calculators.health.bmr'),
    idealWeight:    t('calculators.health.ideal_weight'),
    bodyFat:        t('calculators.health.body_fat'),
    waist:          t('calculators.health.waist'),
    hip:            t('calculators.health.hip'),
    neck:           t('calculators.health.neck'),
    yourResult:     t('calculators.health.your_result'),
    healthCategory: t('calculators.health.health_category'),
    recommendation: t('calculators.health.recommendation'),
    waterIntake:    t('calculators.health.water_intake'),
  }), [t])

  // Pre-resolved tax labels
  const tax = useMemo(() => ({
    income:         t('calculators.tax.income'),
    grossIncome:    t('calculators.tax.gross_income'),
    taxableIncome:  t('calculators.tax.taxable_income'),
    taxPayable:     t('calculators.tax.tax_payable'),
    deduction:      t('calculators.tax.deduction'),
    taxSlab:        t('calculators.tax.tax_slab'),
    oldRegime:      t('calculators.tax.old_regime'),
    newRegime:      t('calculators.tax.new_regime'),
    surcharge:      t('calculators.tax.surcharge'),
    cess:           t('calculators.tax.cess'),
    rebate:         t('calculators.tax.rebate'),
    netTax:         t('calculators.tax.net_tax'),
    effectiveRate:  t('calculators.tax.effective_rate'),
    financialYear:  t('calculators.tax.financial_year'),
    assessmentYear: t('calculators.tax.assessment_year'),
  }), [t])

  // Locale-aware number formatting
  const formatValue = useMemo(
    () => (value: number, decimals = 0) => formatNumber(value, lang, decimals),
    [lang]
  )

  // Locale-aware currency formatting (uses user-selected currency symbol)
  const formatCurrency = useMemo(
    () =>
      (value: number, decimals = 2) => {
        const config = localeConfigs[lang]
        const formattedNumber = formatNumber(value, lang, decimals)
        const symbol = currencySymbol
        if (config?.currencyPosition === 'after') {
          return `${formattedNumber} ${symbol}`
        }
        return `${symbol}${formattedNumber}`
      },
    [lang, currencySymbol]
  )

  // Locale-aware percentage formatting
  const formatPct = useMemo(
    () => (value: number, decimals = 2) => formatPercentage(value, lang, decimals),
    [lang]
  )

  return {
    t,
    lang,
    dir,
    currency: currencySymbol,
    common,
    units,
    labels,
    business,
    loan,
    health,
    tax,
    formatValue,
    formatCurrency,
    formatPct,
  }
}
