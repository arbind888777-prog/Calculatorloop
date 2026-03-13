'use client'

import Link from 'next/link'
import * as Icons from 'lucide-react'
import { useMemo } from 'react'
import { ScrollToHash } from '@/components/logic/ScrollToHash'
import { useSettings } from '@/components/providers/SettingsProvider'
import { useTranslation } from '@/hooks/useTranslation'
import { localizeToolMeta } from '@/lib/toolLocalization'

export type CategoryTool = {
  id: string
  title: string
  description: string
}

export type CategorySubcategory = {
  key: string
  name: string
  calculators: CategoryTool[]
}

type Props = {
  categoryId: string
  categoryName: string
  subcategoryList: CategorySubcategory[]
}

// Icon mapping for calculator types
const iconMap: Record<string, string> = {
  'personal-loan-emi': 'User',
  'home-loan-emi': 'Home',
  'car-loan-emi': 'Car',
  'education-loan-emi': 'GraduationCap',
  'business-loan-emi': 'Briefcase',
  'gold-loan-emi': 'Coins',
  'two-wheeler-loan': 'Bike',
  'loan-prepayment-impact': 'FastForward',
  'loan-eligibility': 'CheckCircle',
  'loan-comparison': 'ArrowLeftRight',
  'simple-interest-loan': 'Percent',
  'compound-interest-loan': 'Percent',
  'loan-amortization': 'Calendar',
  'remaining-loan-balance': 'Scale',
  'top-up-loan': 'ArrowUp',
  'sip-calculator': 'TrendingUp',
  'mutual-fund-returns': 'Briefcase',
  'compound-interest-investment': 'Percent',
  'cagr-calculator': 'ChartBar',
  'roi-calculator': 'PieChart',
  'fd-calculator': 'University',
  'rd-calculator': 'RotateCw',
  'nps-calculator': 'Umbrella',
  'ppf-calculator': 'PiggyBank',
  'retirement-corpus': 'Clock',
  'lumpsum-calculator': 'HandCoins',
  'inflation-impact': 'TrendingDown',
  'income-tax-calculator': 'FileText',
  'salary-breakup': 'Banknote',
  'hra-calculator': 'Home',
  'pf-calculator': 'Wallet',
  'gratuity-calculator': 'Gift',
  'tds-calculator': 'Receipt',
  'gst-calculator': 'FileText',
  'professional-tax': 'Briefcase',
  'advance-tax-calculator': 'CalendarCheck',
  'post-tax-income': 'HandCoins',
  'currency-converter': 'ArrowLeftRight',
  'crypto-profit-loss': 'Bitcoin',
  'forex-margin': 'TrendingUp',
  'exchange-rate-impact': 'Globe',
  'bitcoin-converter': 'Bitcoin',
  'import-export-duty': 'Ship',
  'gold-silver-price': 'Coins',
  'international-transfer': 'Send',
  'savings-account-interest': 'PiggyBank',
  'deposit-maturity': 'Activity',
  'interest-rate-comparison': 'Percent',
  'deposit-growth': 'TrendingUp',
  'rd-planner': 'Calendar',
  'bank-charges': 'Receipt',
  'atm-withdrawal-charges': 'Banknote',
  'loan-against-fd': 'University',
  'money-market-calculator': 'ChartBar',
  'profit-margin': 'Percent',
  'break-even-calculator': 'Scale',
  'discount-calculator': 'Receipt',
  'roas-calculator': 'TrendingUp',
  'working-capital': 'Briefcase',
  'markup-calculator': 'ArrowUp',
  'commission-calculator': 'HandCoins',
  'tip-calculator': 'Wallet',
  'age-calculator': 'Calendar',
  'date-difference': 'CalendarCheck',
  'percentage-calculator': 'Percent',
  'fuel-cost-calculator': 'Car',
  'bmi-calculator': 'Scale',
  'bmr-calculator': 'Flame',
  'body-fat-calculator': 'Percent',
  'calorie-calculator': 'Flame',
  'ideal-weight-calculator': 'Scale',
  'macro-calculator': 'PieChart',
  'tdee-calculator': 'Activity',
  'water-intake-calculator': 'Droplets',
  'lean-body-mass': 'Dumbbell',
  'waist-hip-ratio': 'Ruler',
  'protein-calculator': 'Beef',
  'calories-burned': 'Zap',
  'target-heart-rate': 'HeartPulse',
  'sleep-calculator': 'Moon',

  // ─── Body Measurements ─────────────────────────────
  'body-surface-area': 'Scan',
  'waist-to-height-ratio': 'RulerDimensionLine',
  'waist-circumference': 'Circle',
  'neck-circumference': 'CircleDot',
  'hip-circumference': 'CircleEllipsis',
  'integrated-health-dashboard': 'LayoutDashboard',
  'body-adiposity-index': 'BarChart3',
  'ponderal-index': 'Weight',
  'a-body-shape-index-absi': 'TrendingUp',
  'body-shape-index': 'PersonStanding',
  'ffmi-calculator': 'Dumbbell',
  'ideal-body-fat': 'Target',
  'chest-waist-ratio': 'Ratio',
  'arm-span-height-ratio': 'MoveHorizontal',
  'mid-upper-arm-circumference': 'Radius',
  'calf-circumference': 'Footprints',
  'thigh-circumference-measure': 'Maximize2',
  'forearm-circumference': 'Grip',
  'shoulder-width-calculator': 'ArrowLeftRight',
  'torso-length-measure': 'ArrowUpDown',
  'leg-length-calculator': 'MoveVertical',
  'sitting-height-ratio': 'Armchair',
  'bmi-prime-calculator': 'Gauge',
  'corpulence-index': 'BarChart',
  'body-roundness-index': 'CircleDashed',
  'conicity-index': 'Triangle',
  'sagittal-abdominal-diameter': 'Minimize2',
  'wrist-circumference': 'Watch',
  'ankle-circumference': 'Anchor',
  'bicep-circumference': 'Dumbbell',
  'tricep-skinfold': 'Grip',
  'subscapular-skinfold': 'Layers',
  'suprailiac-skinfold': 'Slice',
  'abdominal-skinfold': 'AlignCenter',
  'thigh-skinfold': 'Scissors',
  'frame-size-calculator': 'Frame',
  'tibia-length-height': 'Bone',
  'ulna-length-height': 'ChevronsUp',

  // ─── Nutrition & Calorie Tracking ──────────────────
  'meal-planner': 'UtensilsCrossed',
  'glycemic-index-calculator': 'BarChart2',
  'glycemic-load-calculator': 'LineChart',
  'fiber-intake-calculator': 'Wheat',
  'sugar-intake-calculator': 'Candy',
  'sodium-intake-calculator': 'Salad',
  'fat-intake-calculator': 'Droplet',
  'carb-calculator': 'Cookie',
  'vitamin-d-calculator': 'Sun',
  'iron-intake-calculator': 'Shield',
  'hydration-electrolyte-calculator': 'GlassWater',
  'keto-macro-calculator': 'Beef',
  'intermittent-fasting-window': 'Clock',
  'meal-calorie-breakdown': 'PieChart',
  'nutrition-label-calculator': 'Tag',
  'omega3-intake-calculator': 'Fish',
  'calcium-intake-calculator': 'Bone',
  'magnesium-intake': 'Sparkles',
  'potassium-intake': 'Banana',
  'zinc-intake-calculator': 'ShieldCheck',
  'vitamin-c-intake': 'Citrus',
  'vitamin-b12-intake': 'Pill',
  'folate-intake-calculator': 'Leaf',
  'protein-timing-calculator': 'Timer',
  'pre-workout-nutrition': 'Zap',
  'post-workout-nutrition': 'Apple',
  'meal-frequency-calculator': 'CalendarClock',
  'portion-size-calculator': 'ScissorsLineDashed',
  'micronutrient-tracker': 'Microscope',
  'alcohol-calorie-calculator': 'Wine',
  'eating-window-16-8': 'Hourglass',
  'carb-cycling-planner': 'RefreshCcw',
  'paleo-macro-calculator': 'Drumstick',
  'vegan-protein-calculator': 'Vegan',
  'nutrient-density-score': 'Star',
  'caffeine-half-life': 'Coffee',
  'creatine-intake': 'FlaskConical',
  'beta-alanine-dosage': 'TestTube',
  'citrulline-malate': 'TestTubes',
  'bcaa-dosage': 'Atom',
  'eaa-dosage': 'Shapes',
  'glutamine-dosage': 'Beaker',
  'leucine-threshold': 'ArrowUpFromDot',
  'casein-protein': 'Moon',
  'whey-protein': 'Milk',
  'plant-protein': 'Sprout',
  'collagen-dosage': 'Paintbrush',
  'electrolyte-balance': 'Scale',
  'post-bariatric-protein': 'Syringe',
  'toddler-calorie': 'Baby',

  // ─── Exercise & Performance ────────────────────────
  'pace-calculator': 'Timer',
  'one-rep-max': 'Dumbbell',
  'vo2-max-calculator': 'Wind',
  'training-zone-calculator': 'Layers',
  'workout-intensity': 'Gauge',
  'running-cadence-calculator': 'Footprints',
  'stride-length-calculator': 'MoveHorizontal',
  'running-distance-time': 'Route',
  'cycling-pace-calculator': 'Bike',
  'met-calculator': 'Activity',
  'strength-volume-calculator': 'BarChart3',
  'workout-recovery-time': 'BedDouble',
  'heart-rate-reserve': 'HeartPulse',
  'max-heart-rate-calculator': 'Heart',
  'lactate-threshold': 'Thermometer',
  'rpe-calculator': 'Gauge',
  'calories-burned-walking': 'Footprints',
  'calories-burned-running': 'PersonStanding',
  'steps-to-calories': 'MapPin',
  'swimming-calories-burned': 'Waves',
  'hiit-workout-calculator': 'Timer',
  'yoga-calories-calculator': 'Flower2',
  'pilates-calorie-burn': 'Spline',
  'jump-rope-calculator': 'Lasso',
  'grip-strength': 'Hand',
  'vertical-jump': 'ArrowBigUp',
  'broad-jump': 'ArrowBigRight',
  'shuttle-run': 'Repeat',
  'beep-test': 'Volume2',
  'yo-yo-test': 'RefreshCcw',
  'navy-seal-pst': 'Anchor',
  'army-acft': 'Shield',
  'marine-pft': 'Swords',
  'air-force-pfa': 'Plane',
  'firefighter-cpat': 'Flame',
  'police-fitness': 'BadgeCheck',
  'power-to-weight': 'Zap',
  'ftp-calculator': 'Bike',
  'tss-calculator': 'LineChart',
  'if-calculator': 'BarChart',
  'swim-pace': 'Waves',
  'triathlon-time': 'Trophy',
  'marathon-time': 'Flag',
  'half-marathon-time': 'FlagTriangleRight',
  '5k-time': 'Clock3',
  '10k-time': 'Clock9',
  'rowing-calories-burned': 'Ship',
  'stair-climbing-calories': 'ArrowUpFromLine',
  'elliptical-calories': 'Circle',
  'boxing-calories-burned': 'Swords',
  'dance-calories-calculator': 'Music',
  'rock-climbing-calories': 'Mountain',
  'tennis-calories-burned': 'CircleDot',
  'basketball-calories': 'CircleDashed',
  'soccer-calories-burned': 'Goal',
  'golf-calories-calculator': 'Flag',
  'bench-press-calculator': 'Dumbbell',
  'squat-strength-calculator': 'ArrowDown',
  'deadlift-calculator': 'ArrowBigUp',
  'wilks-score-calculator': 'Award',
  'cooper-test-calculator': 'Milestone',

  // ─── Heart & Vital Health ─────────────────────────
  'blood-pressure-calculator': 'Stethoscope',
  'resting-heart-rate': 'Heart',
  'cardiovascular-risk': 'HeartCrack',
  'pulse-pressure-calculator': 'Activity',
  'mean-arterial-pressure': 'Gauge',
  'heart-age-calculator': 'HeartHandshake',
  'blood-volume-calculator': 'Droplets',
  'cardiac-output-calculator': 'HeartPulse',
  'oxygen-saturation-interpreter': 'Wind',
  'respiration-rate-calculator': 'CloudRain',
  'hrv-score-calculator': 'BarChart2',
  'ankle-brachial-index': 'Footprints',
  'dehydration-risk': 'GlassWater',
  'body-temperature-tracker': 'Thermometer',
  'blood-pressure-tracker': 'ClipboardList',
  'resting-pulse-tracker': 'HeartPulse',
  'stress-heart-impact': 'Brain',
  'heart-rate-recovery': 'Timer',
  'maf-180': 'Zap',
  'karvonen-formula': 'Calculator',
  'heart-rate-drift': 'TrendingUp',
  'orthostatic-heart-rate': 'ArrowUpDown',
  'hrv-rmssd': 'BarChart3',
  'hrv-sdnn': 'LineChart',
  'blood-pressure-dip': 'MoonStar',
  'arterial-compliance': 'Haze',
  'vascular-age': 'Hourglass',
  'framingham-heart-age': 'HeartCrack',
  'vital-signs-summary': 'FileHeart',
  'hydration-vitals-estimator': 'Droplets',
  'qrs-duration-calculator': 'ScanLine',
  'qt-interval-calculator': 'AudioWaveform',
  'stroke-volume-calculator': 'Heart',
  'ejection-fraction-estimate': 'HeartPulse',
  'cardiac-index-calculator': 'BarChart',
  'systemic-vascular-resistance': 'Workflow',
  'pulse-oximetry-tracker': 'Fingerprint',
  'arterial-stiffness-index': 'Unplug',
  'ventricular-rate-calculator': 'HeartPulse',
  'atrial-fibrillation-rate': 'HeartCrack',
  'pulse-deficit-calculator': 'GitCompare',
  'respiratory-quotient': 'Wind',
  'tidal-volume-calculator': 'CloudRain',
  'minute-ventilation': 'Fan',
  'alveolar-gas-equation': 'FlaskConical',
  'aa-gradient-calculator': 'TrendingDown',
  'pao2-fio2-ratio': 'Percent',
  'oxygen-delivery-calculator': 'Truck',
  'oxygen-consumption': 'Flame',
  'metabolic-cart-simulator': 'Monitor',

  // ─── Pregnancy & Fertility ────────────────────────
  'pregnancy-calculator': 'Baby',
  'due-date-calculator': 'CalendarDays',
  'ovulation-calculator': 'Egg',
  'conception-calculator': 'Sparkle',
  'pregnancy-weight-gain': 'TrendingUp',
  'fertility-window': 'CalendarHeart',
  'pregnancy-week-calculator': 'CalendarRange',
  'trimester-calculator': 'LayoutList',
  'cycle-length-calculator': 'RefreshCw',
  'period-tracker': 'CalendarCheck',
  'conception-window': 'CalendarSearch',
  'ivf-due-date-calculator': 'Syringe',
  'pregnancy-calorie-calculator': 'Flame',
  'pregnancy-bmi-calculator': 'Scale',
  'fetal-growth-percentile': 'BarChart2',
  'baby-kick-counter': 'Footprints',
  'contraction-timer': 'Timer',
  'breastfeeding-calorie': 'Milk',
  'pregnancy-appointment-schedule': 'CalendarClock',
  'fertility-score-calculator': 'Award',
  'luteal-phase-calculator': 'MoonStar',
  'follicular-phase-tracker': 'Sprout',
  'cervical-mucus-tracker': 'Droplet',
  'basal-body-temp-tracker': 'Thermometer',
  'pregnancy-test-timing': 'TestTube',
  'hcg-doubling-calculator': 'TrendingUp',
  'fundal-height-calculator': 'Ruler',
  'pregnancy-blood-volume': 'Droplets',
  'morning-sickness-tracker': 'Frown',
  'gestational-age-calculator': 'Clock',
  'naegeles-rule-calculator': 'CalendarDays',
  'pregnancy-milestones': 'Milestone',
  'amniotic-fluid-index': 'Waves',
  'biophysical-profile-score': 'ClipboardCheck',
  'bishops-score-calculator': 'ListChecks',
  'apgar-score-calculator': 'Star',
  'breastmilk-storage-guide': 'Refrigerator',
  'newborn-feeding-schedule': 'Clock3',
  'postpartum-recovery-tracker': 'HeartHandshake',
  'pms-symptom-tracker': 'AlertCircle',
  'implantation-calculator': 'Anchor',
  'doula-cost': 'HandHelping',
  'midwife-cost': 'Stethoscope',
  'hospital-bag': 'Luggage',
  'baby-name-numerology': 'Hash',
  'chinese-gender': 'CircleDot',
  'mayan-gender': 'Sun',
  'ramzi-theory': 'Scan',
  'nub-theory': 'Search',
  'skull-theory': 'Brain',
  'baby-blood-type': 'Droplets',
  'baby-eye-color': 'Eye',
  'baby-height': 'Ruler',
  'baby-hair-color': 'Palette',
  'twin-probability': 'Copy',
  'vbac-success': 'ShieldCheck',
  'labor-pain': 'AlertTriangle',
  'contraction-intensity': 'Zap',

  // ─── Sleep & Lifestyle ────────────────────────────
  'sleep-cycle-calculator': 'BedDouble',
  'caffeine-calculator': 'Coffee',
  'stress-level-calculator': 'Brain',
  'screen-time-calculator': 'Monitor',
  'sleep-debt-calculator': 'Banknote',
  'nap-calculator': 'CloudMoon',
  'jet-lag-calculator': 'Plane',
  'circadian-rhythm-calculator': 'SunMoon',
  'blue-light-schedule': 'Lightbulb',
  'meditation-timer': 'Flower2',
  'breathing-exercise-timer': 'Wind',
  'alcohol-sleep-impact': 'Wine',
  'nicotine-sleep-impact': 'Cigarette',
  'daily-habit-score': 'CheckSquare',
  'mindfulness-score': 'Sparkles',
  'sobriety-calculator': 'ShieldCheck',
  'smoke-free-calculator': 'ShieldOff',
  'fitness-streak': 'Flame',
  'burnout-risk-calculator': 'AlertOctagon',
  'hydration-reminder': 'Bell',
  'bedtime-reminder': 'AlarmClock',
  'sleep-quality-score': 'Star',
  'sleep-efficiency-calculator': 'Gauge',
  'power-nap-timer': 'Zap',
  'polyphasic-sleep-planner': 'LayoutGrid',
  'shift-work-sleep-planner': 'Clock',
  'sleep-onset-latency': 'Hourglass',
  'wake-after-sleep-onset': 'Sunrise',
  'sleep-fragmentation-index': 'Puzzle',
  'chronotype-calculator': 'SunMoon',
  'social-jetlag-calculator': 'Users',
  'melatonin-timing-calculator': 'Moon',
  'light-exposure-tracker': 'Sun',
  'darkness-exposure-planner': 'Eclipse',
  'exercise-sleep-timing': 'Dumbbell',
  'dinner-bedtime-gap': 'UtensilsCrossed',
  'bedroom-temp-optimizer': 'Thermometer',
  'noise-sleep-impact': 'Volume2',
  'weekend-sleep-calculator': 'CalendarDays',
  'sleep-pressure-calculator': 'ArrowDownFromLine',
  'adenosine-clearance': 'Eraser',
  'sleep-hygiene-score': 'Sparkle',
  'sleep-inertia': 'CloudFog',
  'lucid-dreaming': 'Eye',
  'dream-recall': 'BookOpen',
  'sleep-walking': 'Footprints',
  'sleep-talking': 'MessageCircle',
  'sleep-paralysis': 'Lock',

  // ─── Weight & Goal Management ─────────────────────
  'weight-loss-calculator': 'TrendingDown',
  'calorie-deficit-calculator': 'Minus',
  'body-frame-calculator': 'Frame',
  'weight-goal-tracker': 'Target',
  'maintenance-calorie-calculator': 'Equal',
  'weight-maintenance-planner': 'CalendarCheck',
  'bulk-cut-calculator': 'ArrowUpDown',
  'body-recomposition-calculator': 'RefreshCcw',
  'weekly-calorie-budget': 'Wallet',
  'goal-weight-date': 'CalendarDays',
  'bmi-goal-tracker': 'Goal',
  'body-fat-goal-planner': 'ListChecks',
  'inch-loss-calculator': 'Ruler',
  'weight-loss-percentage': 'Percent',
  'calorie-cycling': 'RefreshCw',
  'cheat-meal-impact': 'Pizza',
  'weight-plateau-calculator': 'Minus',
  'progress-checkin': 'ClipboardCheck',
  'metabolism-tracker': 'Flame',
  'weight-fluctuation-tracker': 'TrendingUp',
  'body-measurement-tracker': 'Ruler',
  'before-after-comparison': 'Columns',
  'progress-photo-planner': 'Camera',
  'weight-trend-analyzer': 'LineChart',
  'refeed-day-calculator': 'Plus',
  'diet-break-planner': 'Pause',
  'reverse-diet-calculator': 'RotateCcw',
  'adaptive-thermogenesis': 'Thermometer',
  'neat-calculator': 'Move',
  'thermic-effect-food': 'Flame',
  'adaptive-tdee-calculator': 'SlidersHorizontal',
  'muscle-gain-predictor': 'Dumbbell',
  'weight-loss-rate': 'Timer',
  'calorie-banking': 'PiggyBank',
  'diet-adherence': 'CheckCircle',
  'binge-eating-risk': 'AlertTriangle',
  'emotional-eating': 'Frown',
  'satiety-index': 'Gauge',
  'hunger-scale': 'Signal',
  'cravings-intensity': 'Candy',
  'maintenance-calories': 'Equal',
  'set-point-theory': 'Anchor',
  'metabolic-damage': 'AlertOctagon',
  'reverse-dieting': 'RotateCcw',
  'diet-break-freq': 'CalendarClock',
  'fat-loss-predictor': 'TrendingDown',
  'skinny-fat-calculator': 'PersonStanding',
  'genetic-potential-calculator': 'Dna',
  'ffmi-natural-limit': 'Dumbbell',
  'water-weight-calculator': 'Droplets',
  'glycogen-depletion': 'BatteryLow',

  // ─── Disease Risk & Prevention ────────────────────
  'diabetes-risk-calculator': 'Syringe',
  'cholesterol-ratio-calculator': 'TestTube',
  'stroke-risk-calculator': 'Brain',
  'metabolic-syndrome-calculator': 'Activity',
  'bone-density-calculator': 'Bone',
  'kidney-function-calculator': 'Scan',
  'hypertension-risk-calculator': 'HeartCrack',
  'sleep-apnea-risk-calculator': 'Moon',
  'fatty-liver-risk-calculator': 'Sticker',
  'anemia-risk-calculator': 'Droplets',
  'thyroid-risk-calculator': 'Thermometer',
  'insulin-resistance-homa-ir': 'BarChart2',
  'kidney-stone-risk': 'Diamond',
  'liver-function-score': 'ClipboardList',
  'immune-score-calculator': 'ShieldPlus',
  'vitamin-deficiency-check': 'Pill',
  'asthma-control-score': 'Wind',
  'allergy-symptom-score': 'Flower2',
  'migraine-trigger-tracker': 'Zap',
  'inflammation-crp-interpreter': 'Flame',
  'framingham-risk-score': 'HeartPulse',
  'ascvd-risk-calculator': 'Heart',
  'chads2-vasc-score': 'HeartCrack',
  'has-bled-score': 'Droplet',
  'wells-score-dvt': 'Footprints',
  'wells-score-pe': 'Wind',
  'perc-rule-calculator': 'ShieldCheck',
  'gout-risk': 'Annoyed',
  'osteoarthritis-risk': 'Bone',
  'rheumatoid-arthritis': 'Hand',
  'lupus-risk': 'Sun',
  'multiple-sclerosis': 'Brain',
  'parkinsons-risk': 'Vibrate',
  'alzheimers-risk': 'BrainCircuit',
  'dementia-risk': 'BrainCog',
  'glaucoma-risk': 'Eye',
  'curb-65-score': 'Stethoscope',
  'sofa-score-calculator': 'BedDouble',
  'qsofa-score': 'AlertCircle',
  'sirs-criteria-calculator': 'Thermometer',
  'apache-ii-score': 'Activity',
  'meld-score-calculator': 'FileBarChart',
  'child-pugh-score': 'Shield',
  'egfr-calculator': 'Filter',
  'creatinine-clearance': 'TestTubes',
  'urine-protein-creatinine': 'Droplets',
  'anion-gap-calculator': 'GitCompare',
  'corrected-calcium': 'Atom',
  'ldl-cholesterol-calculator': 'TestTube',

  // ─── Biological & Health Time ─────────────────────
  'pregnancy-week-tracker': 'CalendarRange',
  'pregnancy-due-date': 'CalendarDays',
  'conception-date-estimator': 'Sparkle',
  'ovulation-tracker': 'Egg',
  'menstrual-cycle': 'Heart',
  'fetal-development': 'Baby',
  'vaccination-schedule': 'ShieldPlus',
  'sleep-cycle-optimizer': 'BedDouble',
  'circadian-rhythm': 'SunMoon',
  'jet-lag-recovery': 'Plane',
  'nap-time-optimizer': 'CloudMoon',
}

export function CategoryPageClient({ categoryId, categoryName, subcategoryList }: Props) {
  const { language } = useSettings()
  const { dict, t } = useTranslation()

  const prefix = language && language !== 'en' ? `/${language}` : ''

  const allCalculatorsCount = useMemo(
    () => subcategoryList.flatMap(s => s.calculators).length,
    [subcategoryList]
  )

  const calculateNowLabel = t('common.calculate')

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/10 to-background">
      <ScrollToHash />
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href={`${prefix}/`}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-6"
        >
          <Icons.ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Header with Gradient */}
        <div className="mb-12 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Icons.Calculator className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Category</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            {categoryName}
          </h1>
          <p className="text-lg text-muted-foreground">{allCalculatorsCount} calculators available</p>
        </div>

        {/* Subcategory Sections */}
        <div className="space-y-12">
          {subcategoryList.map((sub) => (
            <div key={sub.key} id={sub.key} className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-border/50">
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <span className="text-3xl">{sub.name.split(' ')[0]}</span>
                  <span className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                    {sub.name.split(' ').slice(1).join(' ')}
                  </span>
                </h2>
                <span className="px-3 py-1 rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {sub.calculators.length} tools
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {sub.calculators.map((calc) => {
                  const iconName = iconMap[calc.id] || 'Calculator'
                  const IconComponent = (Icons as any)[iconName] || Icons.Calculator

                  const meta = localizeToolMeta({
                    dict,
                    toolId: calc.id,
                    fallbackTitle: calc.title,
                    fallbackDescription: calc.description,
                  })

                  return (
                    <Link
                      key={calc.id}
                      href={`${prefix}/calculator/${calc.id}`}
                      prefetch={true}
                      className="group relative p-6 rounded-2xl bg-gradient-to-br from-card to-card/50 border border-border hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className="relative space-y-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                          <IconComponent className="h-7 w-7 text-primary group-hover:text-purple-500 transition-colors" />
                        </div>

                        <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">
                          {meta.title}
                        </h3>

                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {meta.description}
                        </p>

                        <div className="flex items-center gap-2 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                          <span>{calculateNowLabel}</span>
                          <Icons.ArrowLeft className="h-3 w-3 rotate-180" />
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {allCalculatorsCount === 0 && (
          <div className="text-center py-20">
            <Icons.Calculator className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No calculators found</h3>
            <p className="text-muted-foreground">This category doesn't have any calculators yet.</p>
          </div>
        )}

        {/* Keep categoryId referenced so props don't get tree-shaken oddly */}
        <span className="sr-only">{categoryId}</span>
      </div>
    </div>
  )
}
