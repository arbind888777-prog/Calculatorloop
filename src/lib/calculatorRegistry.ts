// Registry of all calculator components
import dynamic from 'next/dynamic'

const genericHealthTool = dynamic(() =>
  import('@/components/calculators/categories/health/GenericHealthTool').then(m => ({ default: m.GenericHealthTool }))
)

const genericMathTool = dynamic(() =>
  import('@/components/calculators/categories/math/GenericMathTool').then(m => ({ default: m.GenericMathTool }))
)

const genericBusinessTool = dynamic(() =>
  import('@/components/calculators/categories/business/GenericBusinessTool').then(m => ({ default: m.GenericBusinessTool }))
)

const genericPhysicsTool = dynamic(() =>
  import('@/components/calculators/categories/physics/GenericPhysicsTool').then(m => ({ default: m.GenericPhysicsTool }))
)

const genericEverydayTool = dynamic(() =>
  import('@/components/calculators/categories/everyday/GenericEverydayTool').then(m => ({ default: m.GenericEverydayTool }))
)

const genericEducationTool = dynamic(() =>
  import('@/components/calculators/categories/education/GenericEducationTool').then(m => ({ default: m.GenericEducationTool }))
)

const XATScoreCalculator = dynamic(() =>
  import('@/components/calculators/education/XATScoreCalculator').then(m => ({ default: m.default }))
)

const genericConstructionTool = dynamic(() =>
  import('@/components/calculators/categories/construction/GenericConstructionTool').then(m => ({ default: m.GenericConstructionTool }))
)

const genericTechnologyTool = dynamic(() =>
  import('@/components/calculators/categories/technology/GenericTechnologyTool').then(m => ({ default: m.default }))
)

const genericDateTimeTool = dynamic(() =>
  import('@/components/calculators/categories/datetime/GenericDateTimeTool').then(m => ({ default: m.default }))
)

const CustomerSatisfactionCalculator = dynamic(() =>
  import('@/components/calculators/categories/business/CustomerSatisfactionCalculator').then(m => ({ default: m.CustomerSatisfactionCalculator }))
)

// Advanced Math Calculators
const AdvancedDecimalCalculator = dynamic(() =>
  import('@/components/calculators/categories/math/AdvancedDecimalCalculator').then(m => ({ default: m.default }))
)

const AdvancedScientificNotationCalculator = dynamic(() =>
  import('@/components/calculators/categories/math/AdvancedScientificNotationCalculator').then(m => ({ default: m.default }))
)

const AdvancedSignificantFiguresCalculator = dynamic(() =>
  import('@/components/calculators/categories/math/AdvancedSignificantFiguresCalculator').then(m => ({ default: m.default }))
)

const genericEducationToolIds = [
  // Academic & Grades (12 tools)
  'gpa-calculator',
  'grade-calculator',
  'percentage-calculator',
  'cgpa-calculator',
  'sgpa-calculator',
  'grade-converter',
  'weighted-grade-calculator',
  'semester-gpa-predictor',
  'grade-improvement-calculator',
  'class-rank-calculator',
  'assignment-grade-calculator',
  'quiz-average-calculator',

  // Test & Preparation (10 tools)
  'study-time-calculator',
  'exam-score-calculator',
  'reading-time-calculator',
  'revision-planner',
  'study-session-optimizer',
  'exam-countdown-calculator',
  'mock-test-analyzer',
  'topic-wise-time-allocator',
  'study-break-calculator',
  'concentration-span-tracker',

  // Attendance & Performance (6 tools)
  'attendance-calculator',
  'attendance-predictor',
  'bunk-calculator',
  'attendance-recovery-plan',
  'class-participation-tracker',
  'assignment-submission-tracker',

  // College Planning (11 tools)
  'college-cost-calculator',
  'scholarship-calculator',
  'student-loan-calculator',
  'college-savings-planner',
  'tuition-fee-planner',
  'hostel-expense-calculator',
  'textbook-budget-calculator',
  'course-selection-roi',
  'college-vs-job-calculator',
  'study-abroad-cost-calculator',
  'part-time-job-planner',

  // Skill Development (6 tools)
  'learning-curve-calculator',
  'certification-roi-calculator',
  'skill-gap-analyzer',
  'online-course-time-calculator',
  'language-learning-tracker',
  'coding-practice-planner',

  // Competitive Exams (9 tools)
  'jee-rank-predictor',
  'neet-score-calculator',
  'gate-score-calculator',
  'cat-percentile-calculator',
  'upsc-marks-calculator',
  'sat-score-calculator',
  'gre-score-predictor',
  'ielts-band-calculator',
  'toefl-score-calculator',
  'xat-score-calculator',
];

const genericConstructionToolIds = [
  // Structural Engineering (15 tools)
  'load-calculator',
  'beam-calculator',
  'column-calculator',
  'rebar-calculator',
  'footing-calculator',
  'slab-calculator',
  'lintel-calculator',
  'staircase-calculator',
  'retaining-wall',
  'truss-calculator',
  'earthquake-load',
  'wind-load-calculator',
  'soil-bearing-capacity',
  'pile-foundation',
  'shear-wall-design',

  // Materials & Quantity (18 tools)
  'concrete-calculator',
  'brick-calculator',
  'cement-calculator',
  'sand-calculator',
  'mortar-calculator',
  'plaster-calculator',
  'steel-weight-calculator',
  'timber-calculator',
  'gravel-calculator',
  'soil-calculator',
  'block-calculator',
  'rcc-calculator',
  'pcc-calculator',
  'asphalt-calculator',
  'glass-calculator',
  'drywall-calculator',
  'insulation-material',
  'formwork-calculator',

  // Area & Volume (12 tools)
  'area-calculator',
  'volume-calculator',
  'room-size-calculator',
  'excavation-calculator',
  'land-area-calculator',
  'plot-area-calculator',
  'built-up-area',
  'tank-volume',
  'circular-area',
  'polygon-area',
  'trapezoidal-area',
  'pyramid-volume',

  // Finishing & Interior (13 tools)
  'paint-calculator',
  'tile-calculator',
  'wallpaper-calculator',
  'flooring-calculator',
  'ceiling-calculator',
  'paving-calculator',
  'window-calculator',
  'skirting-calculator',
  'laminate-flooring',
  'vinyl-flooring',
  'carpet-calculator',
  'molding-calculator',
  'trim-calculator',

  // Cost Estimation (14 tools)
  'construction-cost',
  'civil-work-cost',
  'interior-cost',
  'renovation-cost',
  'labor-cost',
  'material-cost',
  'per-sqft-cost',
  'budget-planner',
  'roi-calculator',
  'demolition-cost',
  'landscaping-cost',
  'permit-fee-calculator',
  'architect-fee',
  'contractor-margin',

  // Electrical & Plumbing (15 tools)
  'wire-calculator',
  'conduit-calculator',
  'load-calculation',
  'mcb-rating',
  'voltage-drop',
  'pipe-size-calculator',
  'water-pressure',
  'septic-tank',
  'drainage-calculator',
  'pump-calculator',
  'transformer-calculator',
  'generator-sizing',
  'cable-tray-sizing',
  'earthing-calculator',
  'solar-panel-sizing',

  // HVAC & Insulation (10 tools)
  'ac-tonnage',
  'btu-calculator',
  'ventilation-calculator',
  'duct-size',
  'insulation-calculator',
  'heat-loss',
  'cfm-calculator',
  'heat-gain-calculator',
  'chiller-sizing',
  'boiler-sizing',

  // Roofing & Waterproofing (10 tools)
  'roof-area',
  'roof-pitch',
  'shingle-calculator',
  'gutter-calculator',
  'waterproofing-cost',
  'rainwater-harvesting',
  'drainage-slope',
  'metal-roofing',
  'membrane-waterproofing',
  'skylight-calculator',
];

const genericEverydayToolIds = [
  // Time & Productivity (13 tools)
  'pomodoro-timer-calculator',
  'meeting-time-finder',
  'work-hours-calculator',
  'overtime-calculator',
  'break-time-calculator',
  'deadline-calculator',
  'age-calculator',
  'day-counter',
  'hour-to-day-converter',
  'shift-schedule-calculator',
  'time-card-calculator',
  'productivity-score-calculator',

  // Travel & Transportation (18 tools)
  'fuel-cost-calculator',
  'trip-cost-calculator',
  'mileage-tracker',
  'car-maintenance-cost',
  'toll-calculator',
  'parking-cost-calculator',
  'road-trip-planner',
  'flight-cost-comparison',
  'hotel-cost-calculator',
  'travel-budget-calculator',
  'distance-calculator',
  'eta-calculator',
  'cab-fare-estimator',
  'train-ticket-estimator',
  'bus-fare-calculator',
  'luggage-weight-calculator',
  'foreign-exchange-calculator',
  'travel-insurance-cost',

  // Home & Living (16 tools)
  'rent-vs-buy-calculator',
  'room-size-calculator',
  'paint-calculator',
  'tile-calculator',
  'wallpaper-calculator',
  'furniture-dimension-calculator',
  'moving-cost-calculator',
  'utility-bill-calculator',
  'water-bill-calculator',
  'electricity-bill-calculator',
  'gas-bill-calculator',
  'ac-power-consumption',
  'refrigerator-cost-calculator',
  'room-heater-cost',
  'carpet-area-calculator',
  'interior-design-budget',

  // Mobile & Communication (10 tools) - Priority 2
  'data-plan-calculator',
  'call-cost-calculator',
  'sms-package-cost',
  'internet-speed-calculator',
  'wifi-coverage-calculator',
  'phone-bill-estimator',
  'roaming-charges-calculator',
  'mobile-insurance-calculator',
  'phone-upgrade-calculator',
  'prepaid-vs-postpaid',

  // Wedding & Events (10 tools) - Priority 2
  'wedding-budget-calculator',
  'guest-list-calculator',
  'venue-cost-calculator',
  'catering-cost-calculator',
  'decoration-budget',
  'invitation-cost-calculator',
  'photography-cost-calculator',
  'wedding-card-cost',
  'honeymoon-budget-calculator',
  'gift-registry-calculator',

  // Parenting & Baby (12 tools) - Priority 2
  'baby-due-date-calculator',
  'baby-growth-tracker',
  'diaper-cost-calculator',
  'baby-food-calculator',
  'baby-sleep-schedule',
  'vaccination-schedule-calculator',
  'child-education-cost-calculator',
  'daycare-cost-calculator',
  'baby-product-budget',
  'formula-milk-calculator',
  'baby-milestone-tracker',
  'baby-name-numerology',

  // Food & Dining
  'tip-calculator',
  'recipe-converter',
  'serving-size-calculator',
  'cooking-time-calculator',
  'grocery-cost-calculator',
  'meal-cost-calculator',
  'calories-per-serving',
  'food-waste-calculator',

  // Conversion Tools
  'unit-converter',
  'temperature-converter',
  'length-converter',
  'weight-converter',
  'volume-converter',
  'speed-converter',

  // Shopping & Budgeting
  'discount-calculator',
  'sales-tax-calculator',
  'price-comparison',
  'budget-calculator',
  'savings-goal-calculator',
  'cost-per-use-calculator',
]

const genericTechnologyToolIds = [
  // Networking & Internet (12 tools)
  'bandwidth-calculator',
  'ip-subnet-calculator',
  'download-time-calculator',
  'network-speed-test',
  'tcp-throughput',
  'vlsm-calculator',
  'mac-address-lookup',
  'dns-query-calculator',
  'cdn-latency',
  'vpn-bandwidth',
  'websocket-calculator',
  'http-request-size',

  // Security & Privacy (11 tools)
  'password-strength',
  'password-generator',
  'encryption-calculator',
  'hash-calculator',
  'ssl-certificate-checker',
  'brute-force-time',
  'two-factor-auth',
  'jwt-decoder',
  'base64-encoder',
  'url-encoder',
  'entropy-calculator',

  // Storage & Data Management (10 tools)
  'file-size-converter',
  'storage-calculator',
  'data-transfer-calculator',
  'raid-calculator',
  'backup-time-calculator',
  'compression-ratio',
  'iops-calculator',
  'ssd-lifespan',
  'cloud-storage-cost',
  'database-size',

  // Web Development & Performance (11 tools)
  'page-load-time',
  'image-optimization',
  'api-rate-limit',
  'css-specificity',
  'responsive-breakpoints',
  'web-font-calculator',
  'svg-optimizer',
  'javascript-bundle',
  'lighthouse-score',
  'seo-score',
  'core-web-vitals',

  // Mobile App Development (8 tools)
  'app-size-calculator',
  'screen-density',
  'battery-consumption',
  'push-notification',
  'app-store-fees',
  'in-app-purchase',
  'app-rating',
  'responsive-units',

  // Cloud Computing & DevOps (9 tools)
  'aws-cost-calculator',
  'azure-cost-calculator',
  'google-cloud-cost',
  'kubernetes-resources',
  'docker-image-size',
  'serverless-cost',
  'cdn-cost-calculator',
  'load-balancer-cost',
  'ci-cd-time',

  // Programming & Development (13 tools)
  'time-complexity',
  'space-complexity',
  'code-lines-counter',
  'text-analysis',
  'cyclomatic-complexity',
  'regex-tester',
  'json-validator',
  'xml-validator',
  'color-picker',
  'uuid-generator',
  'random-data-generator',
  'cron-expression',
  'git-commit-calculator',

  // AI & Machine Learning (10 tools)
  'model-size-calculator',
  'training-time-estimator',
  'gpu-requirements',
  'batch-size-calculator',
  'accuracy-calculator',
  'confusion-matrix',
  'learning-rate',
  'inference-time',
  'token-counter',
  'embedding-size',

  // Blockchain & Cryptocurrency (8 tools)
  'crypto-profit-calculator',
  'mining-profitability',
  'gas-fee-calculator',
  'blockchain-size',
  'hash-rate-calculator',
  'staking-rewards',
  'nft-rarity-calculator',
  'transaction-fee',

  // IoT & Hardware (7 tools)
  'power-consumption',
  'sensor-data-rate',
  'mqtt-bandwidth',
  'raspberry-pi-power',
  'arduino-memory',
  'esp32-battery-life',
  'lora-range-calculator',
];

const genericDateTimeToolIds = [
  // Time Conversion (12 tools)
  'time-unit-converter', 'military-time-converter', 'unix-timestamp-converter', 'seconds-to-hms',
  'seconds-converter',
  'decimal-to-time', 'time-to-decimal', 'minutes-to-hours', 'hours-to-minutes',
  'days-to-hours', 'weeks-to-days', 'months-to-years', 'years-to-days',
  'decimal-time-converter',
  'months-to-days',

  // Date Calculations (10 tools)
  'date-calculator',
  'date-difference', 'date-add-subtract', 'workday-calculator', 'age-calculator',
  'leap-year-calculator', 'day-of-week', 'week-number', 'day-of-year',
  'quarter-calculator', 'business-days',
  'days-between-dates',
  'days-until-calculator',
  'days-since-calculator',
  'weekday-calculator',
  'nth-day-calculator',
  'business-days-calculator',
  'working-days-counter',

  // Work & Productivity (11 tools)
  'work-hours-calculator', 'timesheet-calculator', 'overtime-calculator', 'shift-calculator',
  'break-time-calculator', 'pomodoro-calculator', 'productivity-tracker', 'billable-hours',
  'time-tracking', 'lunch-break-optimizer', 'work-efficiency',

  // Event & Planning (10 tools)
  'countdown-calculator', 'anniversary-calculator', 'birthday-calculator', 'retirement-date',
  'wedding-countdown', 'exam-countdown', 'vacation-planner',
  'meeting-scheduler', 'deadline-tracker',

  // Calendar & Year Tools (12 tools)
  'leap-year-calculator', 'week-number-calculator', 'calendar-generator', 'moon-phase-calculator',
  'solar-eclipse-calculator', 'lunar-calendar', 'hijri-calendar', 'hebrew-calendar',
  'chinese-calendar', 'julian-date', 'fiscal-year-calculator', 'academic-year-planner',

  // World Time & Zones (10 tools)
  'world-clock', 'time-zone-difference', 'ist-to-utc', 'utc-to-local',
  'time-zone-converter',
  'gmt-converter', 'dst-calculator', 'international-meeting-time', 'time-zone-map',
  'sunrise-sunset', 'golden-hour-calculator',

  // Time Tracking & Management (10 tools)
  'time-spent-calculator', 'average-time-calculator', 'time-estimation', 'elapsed-time',
  'remaining-time', 'time-percentage', 'cumulative-time', 'time-log-analyzer',
  'daily-time-budget', 'weekly-time-planner',

  // Special Dates & Occasions (10 tools)
  'days-of-life', 'relationship-duration', 'job-tenure-calculator', 'sobriety-calculator',
  'smoke-free-calculator', 'fitness-streak', 'habit-tracker', 'memorial-date',
  'milestone-tracker', 'anniversary-reminder',


  // Historical & Astronomical (10 tools)
  'historical-event-age', 'century-calculator', 'decade-calculator', 'era-converter',
  'sidereal-time', 'equinox-solstice', 'planet-position', 'zodiac-sign-calculator',
  'chinese-zodiac', 'vedic-panchang',


];

const genericPhysicsToolIds = [
  // Mechanics & Motion
  'velocity-calculator',
  'force-calculator',
  'acceleration-calculator',
  'momentum-calculator',
  'projectile-motion',
  'friction-calculator',
  'torque-calculator',
  'rotational-inertia',
  'centripetal-force',
  'angular-velocity',
  'angular-acceleration',
  'free-fall-calculator',
  'gravitational-force',
  'escape-velocity',
  'orbital-velocity',
  'keplers-law',
  'density-calculator',
  'pressure-calculator',
  'buoyancy-calculator',
  'bernoulli-equation',
  'viscosity-calculator',
  'surface-tension',
  'simple-pendulum',
  'spring-constant',
  'impulse-calculator',
  'collision-calculator',
  'youngs-modulus',
  'shear-modulus',
  'bulk-modulus',
  'poissons-ratio',
  'center-of-mass',
  'lever-calculator',
  'pulley-calculator',
  'inclined-plane',
  'gear-ratio',

  // Energy & Power
  'kinetic-energy',
  'potential-energy',
  'power-calculator',
  'work-calculator',
  'mechanical-energy',
  'efficiency-calculator',
  'horsepower-calculator',
  'joules-calculator',
  'calories-to-joules',
  'watt-hour-calculator',
  'solar-power-calculator',
  'wind-power-calculator',
  'hydro-power-calculator',
  'charge-time',
  'energy-cost',
  'fuel-efficiency',
  'thermal-energy',
  'specific-heat',
  'latent-heat',
  'enthalpy-calculator',
  'gibbs-free-energy',
  'plancks-law',
  'wien-displacement',
  'stefan-boltzmann',
  'photoelectric-effect',
  'mass-energy',
  'binding-energy',
  'radioactive-decay',
  'half-life',
  'sound-energy',
  'luminous-energy',
  'elastic-potential',

  // Electricity & Electronics
  'ohms-law',
  'power-consumption',
  'voltage-divider',
  'resistance-calculator',
  'capacitance-calculator',
  'current-divider',
  'led-resistor',
  'battery-capacity',
  'frequency-wavelength',
  'battery-life',
  'wire-resistance',
  'pcb-trace-width',
  'rc-time-constant',
  'lc-resonance',
  'rlc-circuit',
  'wheatstone-bridge',
  'inductance-calculator',
  'impedance-calculator',
  'power-factor',
  'skin-depth',
  'antenna-length',
  'coax-impedance',
  'decibel-calculator',
  'energy-storage',
  'inductor-energy',
  'coulombs-law',
  'electric-field',
  'magnetic-field',
  'lorentz-force',
  'biot-savart',
  'faradays-law',
  'lenz-law',
  'drift-velocity',
  'resistivity-calculator',
  'conductivity-calculator',

  // Scientific category (science page: /category/scientific)
  // Physics & Mechanics
  'kinetic-energy-calculator',
  'potential-energy-calculator',
  'friction-force',
  'angular-momentum',
  'pendulum-period',

  // Chemistry Calculations
  'mole-calculator',
  'concentration-calculator',
  'ph-calculator',
  'molarity-calculator',
  'dilution-calculator',
  'stoichiometry-calculator',
  'ideal-gas-law',
  'buffer-solution',
  'oxidation-state',
  'equilibrium-constant',
  'beer-lambert-law',
  'titration-calculator',

  // Astronomy & Space
  'astronomical-calculator',
  'light-year-calculator',
  'planet-weight-calculator',
  'schwarzschild-radius',
  'hubble-law',
  'stellar-luminosity',
  'planetary-mass',
  'redshift-calculator',
  'stellar-parallax',
  'kepler-third-law',

  // Thermodynamics
  'heat-transfer-calculator',
  'specific-heat-calculator',
  'carnot-efficiency',
  'thermal-expansion',
  'fourier-law',
  'first-law-thermodynamics',
  'second-law-thermodynamics',

  // Electromagnetism & Circuits
  'ohms-law-calculator',
  'power-electric-calculator',
  'coulomb-law',
  'faraday-law',
  'rc-circuit',
  'rl-circuit',

  // Optics & Waves
  'wavelength-frequency',
  'snells-law',
  'lens-formula',
  'mirror-formula',
  'magnification-calculator',
  'doppler-effect',
  'diffraction-grating',
  'brewster-angle',
  'critical-angle',

  // Quantum & Nuclear
  'de-broglie-wavelength',
  'planck-equation',
  'compton-scattering',
  'heisenberg-uncertainty',
  'nuclear-binding-energy',
  'einstein-mass-energy',

  // Fluid Mechanics
  'reynolds-number',
  'buoyancy-force',
  'flow-rate-calculator',
  'pressure-depth',
  'torricelli-theorem',

  // Scientific Tools & Conversions
  'significant-figures',
  'error-propagation',
  'standard-deviation',
  'regression-analysis',
  'chi-square-test',
  'normal-distribution',

  // Earth Science
  'earthquake-magnitude',
  'atmospheric-pressure',
  'wind-chill',
  'dew-point',
  'carbon-footprint',
  'solar-radiation',
  'haversine-distance'
]

const genericBusinessToolIds = [
  // Actually Implemented Business Tools (10 tools)
  'profit-margin',
  'gross-profit-calculator',
  'net-profit-calculator',
  'break-even-calculator',
  'markup-calculator',
  'clv-calculator',
  'cac-calculator',
  'quick-ratio',
  'debt-to-equity',
  'pe-ratio',
  // Time-Based Financial
  'hourly-to-annual',
  'annual-to-hourly',
  'pay-period-calculator',
  'time-value-money',
  'compound-time',
  'payroll-hours',
  'time-off-accrual',
  'sick-leave-calculator',
  'contract-duration',
  'subscription-cost-time',

  // Added to cover remaining Business tools in toolsData
  'roi-calculator-business',
  'roe-calculator',
  'roa-calculator',
  'roce-calculator',
  'irr-calculator',
  'npv-calculator-business',
  'cagr-calculator-business',
  'operating-cash-flow',
  'burn-rate',
  'runway-calculator',
  'customer-profitability',
  'product-profitability',
  'price-elasticity',
  'cost-of-goods-sold',
  'overhead-rate',
  'manufacturing-cost',
  'target-profit',
  'margin-of-safety',
  'degree-operating-leverage',
  'degree-financial-leverage',
  'combined-leverage',
  'inventory-holding-cost',
  'ordering-cost',
  'eoq-calculator',
  'reorder-point',
  'safety-stock',
  'stock-turnover',
  'days-sales-inventory',
  'receivables-turnover',
  'days-sales-outstanding',
  'payables-turnover',
  'days-payable-outstanding',
  'churn-rate-calculator',
  'net-promoter-score',
  'lead-conversion-rate',
  'retention-rate',
  'viral-coefficient',
  'arpu-calculator',
  'arppu-calculator',
  'mrr-calculator',
  'arr-calculator',
  'sales-growth',
  'market-share',
  'share-of-wallet',
  // 'customer-satisfaction', // Moved to explicit component
  'customer-effort',
  'email-open-rate',
  'click-through-rate',
  'bounce-rate',
  'cpc-calculator',
  'cpm-calculator',
  'cpa-calculator',
  'cpl-calculator',
  'sales-pipeline',
  'pipeline-velocity',
  'win-rate',
  'average-deal-size',
  'sales-cycle-length',
  'quota-attainment',
  'sales-efficiency',
  'lead-velocity',
  'referral-rate',
  'upsell-rate',
  'cross-sell-rate',
  'cart-abandonment',
  'repeat-purchase-rate',
  'purchase-frequency',
  'profit-per-order',
  'marketing-roi',
  'social-media-engagement',
  'interest-coverage',
  'dscr-calculator',
  'current-ratio',
  'cash-ratio',
  'debt-ratio',
  'equity-ratio',
  'debt-to-asset',
  'asset-turnover',
  'gross-margin-ratio',
  'operating-margin-ratio',
  'net-profit-margin',
  'return-on-investment',
  'return-on-capital-employed',
  'price-earnings-ratio',
  'price-book-ratio',
  'price-sales-ratio',
  'price-cash-flow',
  'dividend-payout',
  'earnings-per-share',
  'book-value-share',
  'cash-flow-share',
  'free-cash-flow-yield',
  'peg-ratio',
  'ev-ebitda',
  'ev-sales',
  'fixed-asset-turnover',
  'working-capital-turnover',
  'defensive-interval',
  'capex-ratio',
  'reinvestment-rate',
  'sustainable-growth',
  'internal-growth',
  'altman-z-score',
  'piotroski-f-score',
  'beneish-m-score',
  'pb-ratio',
  'enterprise-value',
  'book-value-per-share',
  'retention-ratio',
  'ar-turnover',
  'ap-turnover',
  'employee-turnover',
  'revenue-per-employee'
]

// Math tools that are implemented in GenericMathTool component
const genericMathToolIds: string[] = [
  'percentage-calculator',
  'ten-percent-calculator',
  'twenty-percent-calculator',
  'ratio-calculator',
  'average-calculator',
  'square-root-calculator',
  'cube-root-calculator',
  'factorial-calculator',
  'absolute-value-calculator',
  'reciprocal-calculator',
  'rounding-calculator',
  'remainder-calculator',
  'modulo-calculator',
  'exponent-calculator',
  'logarithm-calculator',
  'gcd-calculator',
  'greatest-common-divisor',
  'lcm-calculator',
  'least-common-multiple',
  'prime-number-checker',
  'distance-formula-calculator',
  'midpoint-calculator',
  'slope-calculator',
  'quadratic-formula-calculator',
  'arithmetic-progression-calculator',
  'geometric-progression-calculator',
  'pythagorean-theorem-calculator',
  'double-calculator',
  'triple-calculator',
  'half-calculator',
  'quarter-calculator',
  'third-calculator',
  'sum-of-series-calculator',
  'product-of-series-calculator',
  'area-calculator',

  // Added to cover remaining Math tools in toolsData
  'proportion-calculator',
  'difference-calculator',
  'increment-calculator',
  'decrement-calculator',
  'number-line-calculator',
  'linear-equation-solver',
  'polynomial-calculator',
  'factoring-calculator',
  'inequalities-solver',
  'simultaneous-equations',
  'cubic-equation-solver',
  'quartic-equation-solver',
  'polynomial-adder',
  'polynomial-subtractor',
  'polynomial-multiplier',
  'binomial-expansion-calculator',
  'discriminant-calculator',
  'vertex-calculator',
  'slope-intercept-calculator',
  'point-slope-calculator',
  'section-formula-calculator',
  'harmonic-progression-calculator',
  'matrix-calculator',
  'determinant-calculator',
  'inverse-matrix-calculator',
  'eigenvalue-calculator',
  'complex-number-calculator',
  'vector-calculator',
  'perimeter-calculator',
  'surface-area-calculator',
  'triangle-calculator',
  'circle-calculator',
  'pythagorean-theorem',
  'polygon-calculator',
  'coordinate-geometry',
  'rectangle-calculator',
  'square-calculator',
  'parallelogram-calculator',
  'trapezoid-calculator',
  'rhombus-calculator',
  'kite-calculator',
  'pentagon-calculator',
  'hexagon-calculator',
  'octagon-calculator',
  'ellipse-calculator',
  'sphere-calculator',
  'cube-calculator',
  'cylinder-calculator',
  'cone-calculator',
  'pyramid-calculator',
  'prism-calculator',
  'torus-calculator',
  'ellipsoid-calculator',
  'frustum-calculator',
  'sector-area-calculator',
  'arc-length-calculator',
  'chord-length-calculator',
  'trigonometry-calculator',
  'inverse-trig-calculator',
  'law-of-sines',
  'law-of-cosines',
  'unit-circle-calculator',
  'angle-converter',
  'triangle-angle-calculator',
  'sine-calculator',
  'cosine-calculator',
  'tangent-calculator',
  'cotangent-calculator',
  'secant-calculator',
  'cosecant-calculator',
  'arcsin-calculator',
  'arccos-calculator',
  'arctan-calculator',
  'arccot-calculator',
  'arcsec-calculator',
  'arccsc-calculator',
  'hyperbolic-functions-calculator',
  'inverse-hyperbolic-calculator',
  'trig-identities-calculator',
  'half-angle-calculator',
  'double-angle-calculator',
  'triple-angle-calculator',
  'sum-to-product-calculator',
  'product-to-sum-calculator',
  'reference-angle-calculator',
  'coterminal-angle-calculator',
  'polar-coordinates-calculator',
  'probability-calculator',
  'standard-deviation-calculator',
  'mean-median-mode',
  'variance-calculator',
  'permutation-calculator',
  'combination-calculator',
  'z-score-calculator',
  'correlation-coefficient',
  'regression-calculator',
  'confidence-interval',
  'sample-size-calculator',
  'margin-of-error-calculator',
  'p-value-calculator',
  't-test-calculator',
  'chi-square-calculator',
  'anova-calculator',
  'binomial-distribution-calculator',
  'poisson-distribution-calculator',
  'normal-distribution-calculator',
  'geometric-distribution-calculator',
  'hypergeometric-distribution-calculator',
  'covariance-calculator',
  'quartile-calculator',
  'percentile-calculator',
  'range-calculator',
  'interquartile-range-calculator',
  'coefficient-of-variation',
  'skewness-calculator',
  'kurtosis-calculator',
  'odds-ratio-calculator',
  'force-converter',
  'density-converter',
  'torque-converter',
  'viscosity-converter',
  'angle-converter-units',
  'data-transfer-rate-converter',
  'fuel-consumption-converter',
  'currency-converter-math',
  'cooking-volume-converter',
  'cooking-weight-converter',
  'astronomical-distance-converter',
  'frequency-converter',
  'illuminance-converter',
  'luminance-converter',
  'magnetic-flux-converter',
  'magnetic-field-strength-converter',
  'radiation-converter',
  'radioactivity-converter',
  'sound-level-converter',
  'binary-calculator',
  'hex-calculator',
  'octal-calculator',
  'base-converter',
  'scientific-notation-converter',
  'factors-calculator',
  'lcm-gcf-calculator',
  'binary-to-decimal',
  'decimal-to-binary',
  'hex-to-decimal',
  'decimal-to-hex',
  'octal-to-decimal',
  'decimal-to-octal',
  'binary-to-hex',
  'hex-to-binary',
  'binary-to-octal',
  'octal-to-binary',
  'hex-to-octal',
  'octal-to-hex',
  'ascii-to-binary',
  'binary-to-ascii',
  'ascii-to-hex',
  'hex-to-ascii',
  'text-to-binary',
  'binary-to-text',
  'gray-code-converter',
  'bcd-converter',
  'ones-complement-calculator',
  'twos-complement-calculator',
  'bitwise-calculator',
  'graphing-calculator',
  'intercept-calculator',
  'sequence-calculator',
  'series-calculator',
  'function-calculator',
  'parabola-calculator',
  'hyperbola-calculator',
  'circle-equation-calculator',
  'ellipse-equation-calculator',
  'line-equation-calculator',
  'plane-equation-calculator',
  'sphere-equation-calculator',
  'parametric-equation-calculator',
  'polar-equation-calculator',
  'asymptote-calculator',
  'domain-range-calculator',
  'inverse-function-calculator',
  'composite-function-calculator',
  'cubic-graph-calculator',
  'exponential-graph-calculator',
  'logarithmic-graph-calculator',
  'absolute-value-graph-calculator',
  'floor-function-graph-calculator',
  'ceiling-function-graph-calculator',
  'step-function-graph-calculator',
  'sigmoid-function-calculator',
  'hyperbolic-graph-calculator',
  'polar-rose-calculator',
  'limacon-calculator',
  'cardioid-calculator',
  'dot-product-calculator',
  'cross-product-calculator',
  'matrix-inverse',
  'matrix-transpose',
  'matrix-rank',
  'matrix-trace',
  'matrix-power',
  'matrix-decomposition',
  'vector-magnitude',
  'vector-normalization',
  'vector-projection',
  'vector-angle',
  'linear-independence-calculator',
  'basis-calculator',
  'gram-schmidt-calculator',
  'cramers-rule-calculator',
  'matrix-adjoint-calculator',
  'matrix-cofactor-calculator',
  'matrix-minor-calculator',
  'frobenius-norm-calculator',
  'matrix-condition-number',
  'null-space-calculator',
  'column-space-calculator',
  'row-space-calculator',
  'left-null-space-calculator',
  'vector-projection-plane',
  'vector-rejection-calculator',
  'scalar-triple-product',
  'scientific-calculator',
  'derivative-calculator',
  'integral-calculator',
  'limit-calculator',
  'differential-equation-solver',
  'fourier-series-calculator',
  'laplace-transform',
  'partial-derivative',
  'random-number-generator',
  'taylor-series-calculator',
  'maclaurin-series-calculator',
  'jacobian-calculator',
  'hessian-calculator',
  'gradient-calculator',
  'divergence-calculator',
  'curl-calculator',
  'line-integral-calculator',
  'surface-integral-calculator',
  'volume-integral-calculator',
  'improper-integral-calculator',
  'double-integral-calculator',
  'triple-integral-calculator',
  'directional-derivative-calculator',
  'lagrange-error-bound',
  'radius-of-convergence',
  'interval-of-convergence',
  'power-series-calculator',
  'binomial-series-calculator',
  'legendre-polynomial-calculator',
  'bessel-function-calculator',
  'gamma-function-calculator'
]

const genericHealthToolIds = [
  'body-surface-area',
  'waist-to-height-ratio',
  'waist-circumference',
  'neck-circumference',
  'hip-circumference',
  'body-adiposity-index',
  'ponderal-index',
  'a-body-shape-index-absi',
  'body-shape-index',
  'ffmi-calculator',
  'ideal-body-fat',
  'chest-waist-ratio',
  'arm-span-height-ratio',
  'mid-upper-arm-circumference',
  'calf-circumference',
  'thigh-circumference-measure',
  'forearm-circumference',
  'shoulder-width-calculator',
  'torso-length-measure',
  'leg-length-calculator',
  'sitting-height-ratio',
  'bmi-prime-calculator',
  'corpulence-index',
  'body-roundness-index',
  'conicity-index',
  'sagittal-abdominal-diameter',
  'wrist-circumference',
  'ankle-circumference',
  'bicep-circumference',
  'tricep-skinfold',
  'subscapular-skinfold',
  'suprailiac-skinfold',
  'abdominal-skinfold',
  'thigh-skinfold',
  'meal-planner',
  'glycemic-index-calculator',
  'glycemic-load-calculator',
  'fiber-intake-calculator',
  'sugar-intake-calculator',
  'sodium-intake-calculator',
  'fat-intake-calculator',
  'carb-calculator',
  'vitamin-d-calculator',
  'iron-intake-calculator',
  'hydration-electrolyte-calculator',
  'keto-macro-calculator',
  'intermittent-fasting-window',
  'meal-calorie-breakdown',
  'nutrition-label-calculator',
  'omega3-intake-calculator',
  'calcium-intake-calculator',
  'magnesium-intake',
  'potassium-intake',
  'zinc-intake-calculator',
  'vitamin-c-intake',
  'vitamin-b12-intake',
  'folate-intake-calculator',
  'protein-timing-calculator',
  'pre-workout-nutrition',
  'post-workout-nutrition',
  'meal-frequency-calculator',
  'portion-size-calculator',
  'micronutrient-tracker',
  'alcohol-calorie-calculator',
  'eating-window-16-8',
  'carb-cycling-planner',
  'paleo-macro-calculator',
  'vegan-protein-calculator',
  'nutrient-density-score',
  'pace-calculator',
  'one-rep-max',
  'vo2-max-calculator',
  'training-zone-calculator',
  'workout-intensity',
  'running-cadence-calculator',
  'stride-length-calculator',
  'running-distance-time',
  'cycling-pace-calculator',
  'met-calculator',
  'strength-volume-calculator',
  'workout-recovery-time',
  'heart-rate-reserve',
  'max-heart-rate-calculator',
  'lactate-threshold',
  'rpe-calculator',
  'calories-burned-walking',
  'calories-burned-running',
  'steps-to-calories',
  'swimming-calories-burned',
  'hiit-workout-calculator',
  'yoga-calories-calculator',
  'pilates-calorie-burn',
  'jump-rope-calculator',
  'rowing-calories-burned',
  'stair-climbing-calories',
  'elliptical-calories',
  'boxing-calories-burned',
  'dance-calories-calculator',
  'rock-climbing-calories',
  'tennis-calories-burned',
  'basketball-calories',
  'soccer-calories-burned',
  'golf-calories-calculator',
  'bench-press-calculator',
  'squat-strength-calculator',
  'deadlift-calculator',
  'wilks-score-calculator',
  'cooper-test-calculator',
  'blood-pressure-calculator',
  'resting-heart-rate',
  'cardiovascular-risk',
  'pulse-pressure-calculator',
  'mean-arterial-pressure',
  'heart-age-calculator',
  'blood-volume-calculator',
  'cardiac-output-calculator',
  'oxygen-saturation-interpreter',
  'respiration-rate-calculator',
  'hrv-score-calculator',
  'ankle-brachial-index',
  'dehydration-risk',
  'body-temperature-tracker',
  'blood-pressure-tracker',
  'resting-pulse-tracker',
  'stress-heart-impact',
  'vital-signs-summary',
  'hydration-vitals-estimator',
  'qrs-duration-calculator',
  'qt-interval-calculator',
  'stroke-volume-calculator',
  'ejection-fraction-estimate',
  'cardiac-index-calculator',
  'systemic-vascular-resistance',
  'pulse-oximetry-tracker',
  'arterial-stiffness-index',
  'ventricular-rate-calculator',
  'atrial-fibrillation-rate',
  'pulse-deficit-calculator',
  'respiratory-quotient',
  'tidal-volume-calculator',
  'minute-ventilation',
  'alveolar-gas-equation',
  'aa-gradient-calculator',
  'pao2-fio2-ratio',
  'oxygen-delivery-calculator',
  'oxygen-consumption',
  'metabolic-cart-simulator',
  'pregnancy-calculator',
  'due-date-calculator',
  'ovulation-calculator',
  'conception-calculator',
  'pregnancy-weight-gain',
  'fertility-window',
  'pregnancy-week-calculator',
  'trimester-calculator',
  'cycle-length-calculator',
  'period-tracker',
  'conception-window',
  'ivf-due-date-calculator',
  'pregnancy-calorie-calculator',
  'pregnancy-bmi-calculator',
  'fetal-growth-percentile',
  'baby-kick-counter',
  'contraction-timer',
  'breastfeeding-calorie',
  'pregnancy-appointment-schedule',
  'fertility-score-calculator',
  'luteal-phase-calculator',
  'follicular-phase-tracker',
  'cervical-mucus-tracker',
  'basal-body-temp-tracker',
  'pregnancy-test-timing',
  'hcg-doubling-calculator',
  'fundal-height-calculator',
  'pregnancy-blood-volume',
  'morning-sickness-tracker',
  'gestational-age-calculator',
  'naegeles-rule-calculator',
  'pregnancy-milestones',
  'amniotic-fluid-index',
  'biophysical-profile-score',
  'bishops-score-calculator',
  'apgar-score-calculator',
  'breastmilk-storage-guide',
  'newborn-feeding-schedule',
  'postpartum-recovery-tracker',
  'pms-symptom-tracker',
  'sleep-cycle-calculator',
  'caffeine-calculator',
  'stress-level-calculator',
  'screen-time-calculator',
  'sleep-debt-calculator',
  'nap-calculator',
  'jet-lag-calculator',
  'circadian-rhythm-calculator',
  'blue-light-schedule',
  'meditation-timer',
  'breathing-exercise-timer',
  'alcohol-sleep-impact',
  'nicotine-sleep-impact',
  'daily-habit-score',
  'mindfulness-score',
  'burnout-risk-calculator',
  'hydration-reminder',
  'bedtime-reminder',
  'sleep-quality-score',
  'sleep-efficiency-calculator',
  'power-nap-timer',
  'polyphasic-sleep-planner',
  'shift-work-sleep-planner',
  'sleep-onset-latency',
  'wake-after-sleep-onset',
  'sleep-fragmentation-index',
  'chronotype-calculator',
  'social-jetlag-calculator',
  'melatonin-timing-calculator',
  'light-exposure-tracker',
  'darkness-exposure-planner',
  'exercise-sleep-timing',
  'dinner-bedtime-gap',
  'bedroom-temp-optimizer',
  'noise-sleep-impact',
  'weekend-sleep-calculator',
  'sleep-pressure-calculator',
  'adenosine-clearance',
  'sleep-hygiene-score',
  'weight-loss-calculator',
  'calorie-deficit-calculator',
  'body-frame-calculator',
  'weight-goal-tracker',
  'maintenance-calorie-calculator',
  'weight-maintenance-planner',
  'bulk-cut-calculator',
  'body-recomposition-calculator',
  'weekly-calorie-budget',
  'goal-weight-date',
  'bmi-goal-tracker',
  'body-fat-goal-planner',
  'inch-loss-calculator',
  'weight-loss-percentage',
  'calorie-cycling',
  'cheat-meal-impact',
  'weight-plateau-calculator',
  'progress-checkin',
  'metabolism-tracker',
  'weight-fluctuation-tracker',
  'body-measurement-tracker',
  'before-after-comparison',
  'progress-photo-planner',
  'weight-trend-analyzer',
  'refeed-day-calculator',
  'diet-break-planner',
  'reverse-diet-calculator',
  'adaptive-thermogenesis',
  'neat-calculator',
  'thermic-effect-food',
  'adaptive-tdee-calculator',
  'muscle-gain-predictor',
  'fat-loss-predictor',
  'skinny-fat-calculator',
  'genetic-potential-calculator',
  'ffmi-natural-limit',
  'water-weight-calculator',
  'glycogen-depletion',
  'diabetes-risk-calculator',
  'cholesterol-ratio-calculator',
  'stroke-risk-calculator',
  'metabolic-syndrome-calculator',
  'bone-density-calculator',
  'kidney-function-calculator',
  'hypertension-risk-calculator',
  'sleep-apnea-risk-calculator',
  'fatty-liver-risk-calculator',
  'anemia-risk-calculator',
  'thyroid-risk-calculator',
  'insulin-resistance-homa-ir',
  'kidney-stone-risk',
  'liver-function-score',
  'immune-score-calculator',
  'vitamin-deficiency-check',
  'asthma-control-score',
  'allergy-symptom-score',
  'migraine-trigger-tracker',
  'inflammation-crp-interpreter',
  'framingham-risk-score',
  'ascvd-risk-calculator',
  'chads2-vasc-score',
  'has-bled-score',
  'wells-score-dvt',
  'wells-score-pe',
  'perc-rule-calculator',
  'curb-65-score',
  'sofa-score-calculator',
  'qsofa-score',
  'sirs-criteria-calculator',
  'apache-ii-score',
  'meld-score-calculator',
  'child-pugh-score',
  'egfr-calculator',
  'creatinine-clearance',
  'urine-protein-creatinine',
  'anion-gap-calculator',
  'corrected-calcium',
  'ldl-cholesterol-calculator',
  // Moved from Biological Time
  'menstrual-cycle',
  'fetal-development',
  'vaccination-schedule',
  'circadian-rhythm',
  'nap-time-optimizer',
  'pregnancy-due-date',
  'sobriety-calculator',
  'smoke-free-calculator',
  'fitness-streak',
  'sleep-cycle-calculator',
  'jet-lag-calculator',

  // Added to cover remaining Health tools in toolsData
  'finger-ring-size',
  'shoe-size-converter',
  'bra-size-calculator',
  'hat-size-calculator',
  'glove-size-calculator',
  'frame-size-calculator',
  'tibia-length-height',
  'ulna-length-height',
  'grip-strength',
  'vertical-jump',
  'broad-jump',
  'shuttle-run',
  'beep-test',
  'yo-yo-test',
  'navy-seal-pst',
  'army-acft',
  'marine-pft',
  'air-force-pfa',
  'firefighter-cpat',
  'police-fitness',
  'power-to-weight',
  'ftp-calculator',
  'tss-calculator',
  'if-calculator',
  'swim-pace',
  'triathlon-time',
  'marathon-time',
  'half-marathon-time',
  '5k-time',
  '10k-time',
  'heart-rate-recovery',
  'maf-180',
  'karvonen-formula',
  'heart-rate-drift',
  'orthostatic-heart-rate',
  'hrv-rmssd',
  'hrv-sdnn',
  'blood-pressure-dip',
  'arterial-compliance',
  'vascular-age',
  'framingham-heart-age',
  'implantation-calculator',
  'doula-cost',
  'midwife-cost',
  'hospital-bag',
  'chinese-gender',
  'mayan-gender',
  'ramzi-theory',
  'nub-theory',
  'skull-theory',
  'baby-blood-type',
  'baby-eye-color',
  'baby-height',
  'baby-hair-color',
  'twin-probability',
  'vbac-success',
  'labor-pain',
  'contraction-intensity',
  'sleep-inertia',
  'lucid-dreaming',
  'dream-recall',
  'sleep-walking',
  'sleep-talking',
  'sleep-paralysis',
  'weight-loss-rate',
  'calorie-banking',
  'diet-adherence',
  'binge-eating-risk',
  'emotional-eating',
  'satiety-index',
  'hunger-scale',
  'cravings-intensity',
  'maintenance-calories',
  'set-point-theory',
  'metabolic-damage',
  'reverse-dieting',
  'diet-break-freq',
  'gout-risk',
  'osteoarthritis-risk',
  'rheumatoid-arthritis',
  'lupus-risk',
  'multiple-sclerosis',
  'parkinsons-risk',
  'alzheimers-risk',
  'dementia-risk',
  'glaucoma-risk'
]

// Central registry of calculator components and their route ids
export const calculatorComponents: Record<string, any> = {
  ...genericMathToolIds.reduce((acc, id) => ({ ...acc, [id]: genericMathTool }), {}),
  ...genericHealthToolIds.reduce((acc, id) => ({ ...acc, [id]: genericHealthTool }), {}),
  ...genericBusinessToolIds.reduce((acc, id) => ({ ...acc, [id]: genericBusinessTool }), {}),
  ...genericPhysicsToolIds.reduce((acc, id) => ({ ...acc, [id]: genericPhysicsTool }), {}),
  ...genericEverydayToolIds.reduce((acc, id) => ({ ...acc, [id]: genericEverydayTool }), {}),
  ...genericEducationToolIds.reduce((acc, id) => ({ ...acc, [id]: genericEducationTool }), {}),
  ...genericConstructionToolIds.reduce((acc, id) => ({ ...acc, [id]: genericConstructionTool }), {}),
  ...genericTechnologyToolIds.reduce((acc, id) => ({ ...acc, [id]: genericTechnologyTool }), {}),
  // Date & Time (keep after other generic spreads so it can win for shared IDs like 'age-calculator')
  ...genericDateTimeToolIds.reduce((acc, id) => ({ ...acc, [id]: genericDateTimeTool }), {}),
  // Loan & EMI Calculators
  'personal-loan-emi': dynamic(() => import('@/components/calculators/categories/loan/PersonalLoanEMI').then(m => ({ default: m.PersonalLoanEMI }))),
  'home-loan-emi': dynamic(() => import('@/components/calculators/categories/loan/HomeLoanEMI').then(m => ({ default: m.HomeLoanEMI }))),
  'car-loan-emi': dynamic(() => import('@/components/calculators/categories/loan/CarLoanEMI').then(m => ({ default: m.CarLoanEMI }))),
  'education-loan-emi': dynamic(() => import('@/components/calculators/categories/loan/EducationLoanEMI').then(m => ({ default: m.EducationLoanEMI }))),
  'business-loan-emi': dynamic(() => import('@/components/calculators/categories/loan/BusinessLoanEMI').then(m => ({ default: m.BusinessLoanEMI }))),
  'gold-loan-emi': dynamic(() => import('@/components/calculators/categories/loan/GoldLoanEMI').then(m => ({ default: m.GoldLoanEMI }))),
  'two-wheeler-loan': dynamic(() => import('@/components/calculators/categories/loan/TwoWheelerLoan').then(m => ({ default: m.TwoWheelerLoan }))),
  'loan-prepayment-impact': dynamic(() => import('@/components/calculators/categories/loan/LoanPrepaymentImpact').then(m => ({ default: m.LoanPrepaymentImpact }))),
  'loan-eligibility': dynamic(() => import('@/components/calculators/categories/loan/LoanEligibility').then(m => ({ default: m.LoanEligibility }))),
  'loan-comparison': dynamic(() => import('@/components/calculators/categories/loan/LoanComparison').then(m => ({ default: m.LoanComparison }))),
  'simple-interest-loan': dynamic(() => import('@/components/calculators/categories/loan/SimpleInterestLoan').then(m => ({ default: m.SimpleInterestLoan }))),
  'compound-interest-loan': dynamic(() => import('@/components/calculators/categories/loan/CompoundInterestLoan').then(m => ({ default: m.CompoundInterestLoan }))),
  'loan-amortization': dynamic(() => import('@/components/calculators/categories/loan/LoanAmortization').then(m => ({ default: m.LoanAmortization }))),
  'remaining-loan-balance': dynamic(() => import('@/components/calculators/categories/loan/RemainingLoanBalance').then(m => ({ default: m.RemainingLoanBalance }))),
  'top-up-loan': dynamic(() => import('@/components/calculators/categories/loan/TopUpLoan').then(m => ({ default: m.TopUpLoan }))),
  'loan-balance-transfer': dynamic(() => import('@/components/calculators/categories/loan/LoanBalanceTransfer').then(m => ({ default: m.LoanBalanceTransfer }))),
  'flat-vs-reducing': dynamic(() => import('@/components/calculators/categories/loan/FlatVsReducing').then(m => ({ default: m.FlatVsReducing }))),
  'rent-vs-buy': dynamic(() => import('@/components/calculators/categories/real-estate/RentVsBuy').then(m => ({ default: m.RentVsBuy }))),

  // Investment
  'sip-calculator': dynamic(() => import('@/components/calculators/categories/investment/AdvancedSIPCalculator').then(m => ({ default: m.AdvancedSIPCalculator }))),
  'swp-calculator': dynamic(() => import('@/components/calculators/categories/investment/SWPCalculator').then(m => ({ default: m.SWPCalculator }))),
  'step-up-sip': dynamic(() => import('@/components/calculators/categories/investment/StepUpSIP').then(m => ({ default: m.StepUpSIP }))),
  'fire-calculator': dynamic(() => import('@/components/calculators/categories/retirement/FIRECalculator').then(m => ({ default: m.FIRECalculator }))),
  'mutual-fund-returns': dynamic(() => import('@/components/calculators/categories/investment/InvestmentCalculators').then(m => ({ default: m.MutualFundReturns }))),
  'cagr-calculator': dynamic(() => import('@/components/calculators/categories/investment/InvestmentCalculators').then(m => ({ default: m.CAGRCalculator }))),
  'roi-calculator': dynamic(() => import('@/components/calculators/categories/investment/InvestmentCalculators').then(m => ({ default: m.ROICalculator }))),
  'fd-calculator': dynamic(() => import('@/components/calculators/categories/investment/InvestmentCalculators').then(m => ({ default: m.FDCalculator }))),
  'rd-calculator': dynamic(() => import('@/components/calculators/categories/investment/InvestmentCalculators').then(m => ({ default: m.RDCalculator }))),
  'nps-calculator': dynamic(() => import('@/components/calculators/categories/retirement/NPSCalculator').then(m => ({ default: m.NPSCalculator }))),
  'ppf-calculator': dynamic(() => import('@/components/calculators/categories/investment/MoreInvestmentCalculators').then(m => ({ default: m.PPFCalculator }))),
  'retirement-corpus': dynamic(() => import('@/components/calculators/categories/retirement/RetirementCorpus').then(m => ({ default: m.RetirementCorpus }))),
  'lumpsum-calculator': dynamic(() => import('@/components/calculators/categories/investment/MoreInvestmentCalculators').then(m => ({ default: m.LumpsumCalculator }))),
  'inflation-impact': dynamic(() => import('@/components/calculators/categories/investment/MoreInvestmentCalculators').then(m => ({ default: m.InflationImpact }))),
  'compound-interest-investment': dynamic(() => import('@/components/calculators/categories/investment/MoreInvestmentCalculators').then(m => ({ default: m.CompoundInterestInvestment }))),

  // Tax
  'income-tax-calculator': dynamic(() => import('@/components/calculators/categories/tax/AdvancedIncomeTax').then(m => ({ default: m.AdvancedIncomeTax }))),
  'salary-breakup': dynamic(() => import('@/components/calculators/categories/tax/TaxCalculators').then(m => ({ default: m.SalaryBreakup }))),
  'hra-calculator': dynamic(() => import('@/components/calculators/categories/tax/HRAExemption').then(m => ({ default: m.HRAExemption }))),
  'pf-calculator': dynamic(() => import('@/components/calculators/categories/tax/MoreTaxCalculators').then(m => ({ default: m.PFCalculator }))),
  'gratuity-calculator': dynamic(() => import('@/components/calculators/categories/tax/MoreTaxCalculators').then(m => ({ default: m.GratuityCalculator }))),
  'tds-calculator': dynamic(() => import('@/components/calculators/categories/tax/MoreTaxCalculators').then(m => ({ default: m.TDSCalculator }))),
  'gst-calculator': dynamic(() => import('@/components/calculators/categories/business/AdvancedGSTCalculator').then(m => ({ default: m.AdvancedGSTCalculator }))),
  'professional-tax': dynamic(() => import('@/components/calculators/categories/tax/MoreTaxCalculators').then(m => ({ default: m.ProfessionalTax }))),
  'advance-tax-calculator': dynamic(() => import('@/components/calculators/categories/tax/MoreTaxCalculators').then(m => ({ default: m.AdvanceTaxCalculator }))),
  'post-tax-income': dynamic(() => import('@/components/calculators/categories/tax/MoreTaxCalculators').then(m => ({ default: m.PostTaxIncome }))),
  'capital-gains-tax': dynamic(() => import('@/components/calculators/categories/tax/CapitalGainsTax').then(m => ({ default: m.CapitalGainsTax }))),
  'old-vs-new-regime': dynamic(() => import('@/components/calculators/categories/tax/OldVsNewRegime').then(m => ({ default: m.OldVsNewRegime }))),

  // Currency
  'currency-converter': dynamic(() => import('@/components/calculators/categories/currency/CurrencyCalculators').then(m => ({ default: m.CurrencyConverter }))),
  'crypto-profit-loss': dynamic(() => import('@/components/calculators/categories/currency/CurrencyCalculators').then(m => ({ default: m.CryptoProfitLoss }))),
  'forex-margin': dynamic(() => import('@/components/calculators/categories/currency/CurrencyCalculators').then(m => ({ default: m.ForexMargin }))),
  'bitcoin-converter': dynamic(() => import('@/components/calculators/categories/currency/CurrencyCalculators').then(m => ({ default: m.BitcoinConverter }))),
  'exchange-rate-impact': dynamic(() => import('@/components/calculators/categories/currency/CurrencyCalculators').then(m => ({ default: m.ExchangeRateImpact }))),
  'import-export-duty': dynamic(() => import('@/components/calculators/categories/currency/CurrencyCalculators').then(m => ({ default: m.ImportExportDuty }))),
  'gold-silver-price': dynamic(() => import('@/components/calculators/categories/currency/CurrencyCalculators').then(m => ({ default: m.GoldSilverPrice }))),
  'international-transfer': dynamic(() => import('@/components/calculators/categories/currency/CurrencyCalculators').then(m => ({ default: m.InternationalTransfer }))),
  'pip-value': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.PipValueCalculator }))),
  'position-size': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.ForexPositionSizeCalculator }))),
  'forex-compounding': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.ForexCompoundingCalculator }))),
  'risk-reward-ratio': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.ForexRiskRewardRatio }))),
  'pivot-point': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.ForexPivotPointCalculator }))),
  'fibonacci-calculator': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.FibonacciRetracementCalculator }))),
  'forex-profit': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.ForexProfitCalculator }))),
  'forex-swap': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.ForexSwapCalculator }))),
  'forex-position-sizer': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.ForexPositionSizerAdvanced }))),
  'crypto-market-cap': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.CryptoMarketCapCalculator }))),
  'crypto-staking': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.CryptoStakingCalculator }))),
  'mining-profitability': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.CryptoMiningProfitability }))),
  'crypto-dca': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.DollarCostAveragingCrypto }))),
  'arbitrage-calculator': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.ArbitrageCalculator }))),
  // 'crypto-market-cap': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.CryptoMarketCapCalculator }))), // DISABLED - old template structure
  // 'crypto-staking': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.CryptoStakingCalculator }))), // DISABLED - old template structure
  // 'mining-profitability': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.CryptoMiningProfitability }))), // DISABLED - old template structure
  // 'crypto-dca': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.DollarCostAveragingCrypto }))), // DISABLED - old template structure
  // 'arbitrage-calculator': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.ArbitrageCalculator }))), // DISABLED - old template structure
  'inflation-adjusted-rate': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.InflationAdjustedExchangeRate }))),
  'ppp-calculator': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.PurchasingPowerParity }))),
  'reer-calculator': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.RealEffectiveExchangeRate }))),
  'currency-devaluation': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.CurrencyDevaluationCalculator }))),
  'travel-budget': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.TravelBudgetCalculator }))),
  'forex-fee-calculator': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.ForexFeeCalculator }))),
  'remittance-cost': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.RemittanceCostCalculator }))),
  'hedging-cost': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.HedgingCostCalculator }))),
  'forward-rate': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.ForwardRateCalculator }))),
  'cross-rate': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.CrossRateCalculator }))),
  'currency-strength': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.CurrencyStrengthCalculator }))),
  'volatility-calculator': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.VolatilityCalculator }))),
  'correlation-matrix': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.CorrelationMatrixCalculator }))),
  'carry-trade': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.CarryTradeCalculator }))),
  'interest-rate-parity': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.InterestRateParityCalculator }))),
  'big-mac-index': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.BigMacIndexCalculator }))),
  'gold-silver-ratio': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.GoldSilverRatioCalculator }))),
  'platinum-gold-ratio': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.PlatinumGoldRatioCalculator }))),
  'bitcoin-dominance': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.BitcoinDominanceCalculator }))),
  'eth-gas-fee': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.EthGasFeeCalculator }))),
  'crypto-burn-rate': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.CryptoBurnRateCalculator }))),
  'impermanent-loss': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.ImpermanentLossCalculator }))),
  'yield-farming': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.YieldFarmingCalculator }))),
  'staking-rewards-adv': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.AdvancedStakingRewardsCalculator }))),
  'mining-roi-adv': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.AdvancedMiningROICalculator }))),
  'hash-rate-converter': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.HashRateConverter }))),
  'satoshi-converter': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.SatoshiConverter }))),
  'wei-converter': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.WeiConverter }))),
  'gwei-converter': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.GweiConverter }))),
  'forex-pip-adv': dynamic(() => import('@/components/calculators/categories/currency/ExtendedCurrencyCalculators').then(m => ({ default: m.ForexPipAdvancedCalculator }))),

  // Banking
  'savings-account-interest': dynamic(() => import('@/components/calculators/categories/banking/BankingCalculators').then(m => ({ default: m.SavingsAccountInterest }))),
  'deposit-maturity': dynamic(() => import('@/components/calculators/categories/banking/AdvancedFDCalculator').then(m => ({ default: m.AdvancedFDCalculator }))),
  'interest-rate-comparison': dynamic(() => import('@/components/calculators/categories/banking/BankingCalculators').then(m => ({ default: m.InterestRateComparison }))),
  'deposit-growth': dynamic(() => import('@/components/calculators/categories/banking/BankingCalculators').then(m => ({ default: m.DepositGrowth }))),
  'bank-charges': dynamic(() => import('@/components/calculators/categories/banking/BankingCalculators').then(m => ({ default: m.BankChargesCalculator }))),
  'atm-withdrawal-charges': dynamic(() => import('@/components/calculators/categories/banking/BankingCalculators').then(m => ({ default: m.ATMWithdrawalCalculator }))),
  'loan-against-fd': dynamic(() => import('@/components/calculators/categories/banking/BankingCalculators').then(m => ({ default: m.LoanAgainstFD }))),
  'money-market-calculator': dynamic(() => import('@/components/calculators/categories/banking/BankingCalculators').then(m => ({ default: m.MoneyMarketCalculator }))),
  'rd-planner': dynamic(() => import('@/components/calculators/categories/banking/AdvancedRDCalculator').then(m => ({ default: m.AdvancedRDCalculator }))),
  'credit-card-payoff': dynamic(() => import('@/components/calculators/categories/credit-card/CreditCardPayoff').then(m => ({ default: m.CreditCardPayoff }))),
  'ssy-calculator': dynamic(() => import('@/components/calculators/categories/banking/SSYCalculator').then(m => ({ default: m.SSYCalculator }))),
  'scss-calculator': dynamic(() => import('@/components/calculators/categories/banking/SCSSCalculator').then(m => ({ default: m.SCSSCalculator }))),

  // Business
  'profit-margin': dynamic(() => import('@/components/calculators/categories/business/BusinessCalculators').then(m => ({ default: m.ProfitMarginCalculator }))),
  'break-even-calculator': dynamic(() => import('@/components/calculators/categories/business/AdvancedBreakEvenCalculator').then(m => ({ default: m.AdvancedBreakEvenCalculator }))),
  'clv-calculator': dynamic(() => import('@/components/calculators/categories/business/AdvancedCLVCalculator').then(m => ({ default: m.AdvancedCLVCalculator }))),
  'discount-calculator': dynamic(() => import('@/components/calculators/categories/business/BusinessCalculators').then(m => ({ default: m.DiscountCalculator }))),
  'roas-calculator': dynamic(() => import('@/components/calculators/categories/business/BusinessCalculators').then(m => ({ default: m.ROASCalculator }))),
  'working-capital': dynamic(() => import('@/components/calculators/categories/business/BusinessCalculators').then(m => ({ default: m.WorkingCapital }))),
  'markup-calculator': dynamic(() => import('@/components/calculators/categories/business/BusinessCalculators').then(m => ({ default: m.MarkupCalculator }))),
  'commission-calculator': dynamic(() => import('@/components/calculators/categories/business/BusinessCalculators').then(m => ({ default: m.CommissionCalculator }))),
  'advanced-depreciation-calculator': dynamic(() => import('@/components/calculators/categories/business/AdvancedDepreciationCalculator').then(m => ({ default: m.AdvancedDepreciationCalculator }))),
  'advanced-working-capital-calculator': dynamic(() => import('@/components/calculators/categories/business/AdvancedWorkingCapitalCalculator').then(m => ({ default: m.AdvancedWorkingCapitalCalculator }))),
  'advanced-cash-flow-calculator': dynamic(() => import('@/components/calculators/categories/business/AdvancedCashFlowCalculator').then(m => ({ default: m.AdvancedCashFlowCalculator }))),
  'advanced-pricing-strategy-calculator': dynamic(() => import('@/components/calculators/categories/business/AdvancedPricingStrategyCalculator').then(m => ({ default: m.AdvancedPricingStrategyCalculator }))),
  'advanced-business-valuation-calculator': dynamic(() => import('@/components/calculators/categories/business/AdvancedBusinessValuationCalculator').then(m => ({ default: m.AdvancedBusinessValuationCalculator }))),
  'advanced-unit-economics-calculator': dynamic(() => import('@/components/calculators/categories/business/AdvancedUnitEconomicsCalculator').then(m => ({ default: m.AdvancedUnitEconomicsCalculator }))),
  'startup-runway': dynamic(() => import('@/components/calculators/categories/business/StartupRunway').then(m => ({ default: m.StartupRunway }))),
  'freelance-tax': dynamic(() => import('@/components/calculators/categories/business/FreelanceTax').then(m => ({ default: m.FreelanceTax }))),
  'inventory-turnover': dynamic(() => import('@/components/calculators/categories/business/InventoryTurnover').then(m => ({ default: m.InventoryTurnover }))),
  'operating-margin': dynamic(() => import('@/components/calculators/categories/business/OperatingMargin').then(m => ({ default: m.OperatingMargin }))),
  'sales-tax-calculator': genericBusinessTool,
  'payroll-calculator': genericBusinessTool,
  'overtime-calculator': genericBusinessTool,
  'profit-split-calculator': genericBusinessTool,
  'roi-percentage': genericBusinessTool,
  'conversion-rate': genericBusinessTool,
  'average-order-value': genericBusinessTool,
  'churn-rate': genericBusinessTool,
  'ltv-cac-ratio': genericBusinessTool,
  'monthly-recurring-revenue': genericBusinessTool,
  'annual-recurring-revenue': genericBusinessTool,
  'gross-margin-calculator': genericBusinessTool,
  'net-margin-calculator': genericBusinessTool,
  'ebitda-calculator': genericBusinessTool,
  'revenue-growth-rate': genericBusinessTool,
  'employee-productivity': genericBusinessTool,
  'cost-per-hire': genericBusinessTool,
  'inventory-days': genericBusinessTool,
  'accounts-receivable-days': genericBusinessTool,
  'accounts-payable-days': genericBusinessTool,
  'cash-conversion-cycle': genericBusinessTool,
  'return-on-assets': genericBusinessTool,
  'return-on-equity': genericBusinessTool,
  'asset-turnover-ratio': genericBusinessTool,
  'equity-multiplier': genericBusinessTool,
  'times-interest-earned': genericBusinessTool,
  'free-cash-flow': genericBusinessTool,
  'contribution-margin': genericBusinessTool,
  'variable-cost-per-unit': genericBusinessTool,
  'fixed-cost-analysis': genericBusinessTool,
  'operating-leverage': genericBusinessTool,
  'financial-leverage': genericBusinessTool,
  'safety-margin': genericBusinessTool,
  'payback-period': genericBusinessTool,
  'internal-rate-return': dynamic(() => import('@/components/calculators/categories/business/AdvancedROICalculator').then(m => ({ default: m.AdvancedROICalculator }))),
  'profitability-index': genericBusinessTool,
  'economic-value-added': genericBusinessTool,
  'roi-calculator-business': dynamic(() => import('@/components/calculators/categories/business/AdvancedROICalculator').then(m => ({ default: m.AdvancedROICalculator }))),
  // Extended Business Calculators - DISABLED (template structure issues)
  // // 'clv-calculator': dynamic(() => import('@/components/calculators/categories/business/MoreExtendedBusinessCalculators').then(m => ({ default: m.CustomerLifetimeValue }))), // DISABLED - old template structure
  // // 'cac-calculator': dynamic(() => import('@/components/calculators/categories/business/MoreExtendedBusinessCalculators').then(m => ({ default: m.CustomerAcquisitionCost }))), // DISABLED - old template structure
  // // 'churn-rate-calculator': dynamic(() => import('@/components/calculators/categories/business/MoreExtendedBusinessCalculators').then(m => ({ default: m.ChurnRateCalculator }))), // DISABLED - old template structure
  // // 'net-promoter-score': dynamic(() => import('@/components/calculators/categories/business/MoreExtendedBusinessCalculators').then(m => ({ default: m.NetPromoterScore }))), // DISABLED - old template structure
  // // 'employee-turnover': dynamic(() => import('@/components/calculators/categories/business/MoreExtendedBusinessCalculators').then(m => ({ default: m.EmployeeTurnoverRate }))), // DISABLED - old template structure
  // // 'revenue-per-employee': dynamic(() => import('@/components/calculators/categories/business/MoreExtendedBusinessCalculators').then(m => ({ default: m.RevenuePerEmployee }))), // DISABLED - old template structure
  // // 'ebitda-calculator': dynamic(() => import('@/components/calculators/categories/business/MoreExtendedBusinessCalculators').then(m => ({ default: m.EBITDACalculator }))), // DISABLED - old template structure
  // // 'quick-ratio': dynamic(() => import('@/components/calculators/categories/business/MoreExtendedBusinessCalculators').then(m => ({ default: m.QuickRatioCalculator }))), // DISABLED - old template structure
  // // 'return-on-assets': dynamic(() => import('@/components/calculators/categories/business/MoreExtendedBusinessCalculators').then(m => ({ default: m.ReturnOnAssets }))), // DISABLED - old template structure
  // // 'return-on-equity': dynamic(() => import('@/components/calculators/categories/business/MoreExtendedBusinessCalculators').then(m => ({ default: m.ReturnOnEquity }))), // DISABLED - old template structure
  // // 'lead-conversion-rate': dynamic(() => import('@/components/calculators/categories/business/MoreExtendedBusinessCalculators').then(m => ({ default: m.LeadConversionRate }))), // DISABLED - old template structure
  // // 'dscr-calculator': dynamic(() => import('@/components/calculators/categories/business/EvenMoreExtendedBusinessCalculators').then(m => ({ default: m.DebtServiceCoverageRatio }))), // DISABLED - old template structure
  // // 'ar-turnover': dynamic(() => import('@/components/calculators/categories/business/EvenMoreExtendedBusinessCalculators').then(m => ({ default: m.AccountsReceivableTurnover }))), // DISABLED - old template structure
  // // 'ap-turnover': dynamic(() => import('@/components/calculators/categories/business/EvenMoreExtendedBusinessCalculators').then(m => ({ default: m.AccountsPayableTurnover }))), // DISABLED - old template structure
  // // 'debt-to-equity': dynamic(() => import('@/components/calculators/categories/business/EvenMoreExtendedBusinessCalculators').then(m => ({ default: m.DebtToEquityRatio }))), // DISABLED - old template structure
  // // 'interest-coverage': dynamic(() => import('@/components/calculators/categories/business/EvenMoreExtendedBusinessCalculators').then(m => ({ default: m.InterestCoverageRatio }))), // DISABLED - old template structure
  // // 'asset-turnover': dynamic(() => import('@/components/calculators/categories/business/EvenMoreExtendedBusinessCalculators').then(m => ({ default: m.AssetTurnoverRatio }))), // DISABLED - old template structure
  // // 'dividend-yield': dynamic(() => import('@/components/calculators/categories/business/EvenMoreExtendedBusinessCalculators').then(m => ({ default: m.DividendYieldCalculator }))), // DISABLED - old template structure
  // // 'pe-ratio': dynamic(() => import('@/components/calculators/categories/business/EvenMoreExtendedBusinessCalculators').then(m => ({ default: m.PriceToEarningsRatio }))), // DISABLED - old template structure
  // // 'pb-ratio': dynamic(() => import('@/components/calculators/categories/business/EvenMoreExtendedBusinessCalculators').then(m => ({ default: m.PriceToBookRatio }))), // DISABLED - old template structure
  // // 'enterprise-value': dynamic(() => import('@/components/calculators/categories/business/EvenMoreExtendedBusinessCalculators').then(m => ({ default: m.EnterpriseValueCalculator }))), // DISABLED - old template structure
  // // 'book-value-per-share': dynamic(() => import('@/components/calculators/categories/business/EvenMoreExtendedBusinessCalculators').then(m => ({ default: m.BookValuePerShare }))), // DISABLED - old template structure
  // // 'dividend-payout': dynamic(() => import('@/components/calculators/categories/business/EvenMoreExtendedBusinessCalculators').then(m => ({ default: m.DividendPayoutRatio }))), // DISABLED - old template structure
  // // 'retention-ratio': dynamic(() => import('@/components/calculators/categories/business/EvenMoreExtendedBusinessCalculators').then(m => ({ default: m.RetentionRatio }))), // DISABLED - old template structure
  // // 'sustainable-growth': dynamic(() => import('@/components/calculators/categories/business/EvenMoreExtendedBusinessCalculators').then(m => ({ default: m.SustainableGrowthRate }))), // DISABLED - old template structure
  // // 'operating-leverage': dynamic(() => import('@/components/calculators/categories/business/EvenMoreExtendedBusinessCalculators').then(m => ({ default: m.DegreeOfOperatingLeverage }))), // DISABLED - old template structure
  // // 'financial-leverage': dynamic(() => import('@/components/calculators/categories/business/EvenMoreExtendedBusinessCalculators').then(m => ({ default: m.DegreeOfFinancialLeverage }))), // DISABLED - old template structure

  // Misc
  'tip-calculator': dynamic(() => import('@/components/calculators/categories/misc/MiscCalculators').then(m => ({ default: m.TipCalculator }))),
  'date-difference': dynamic(() => import('@/components/calculators/categories/datetime/GenericDateTimeTool')),
  'date-plus-duration': dynamic(() => import('@/components/calculators/categories/misc/MiscCalculators').then(m => ({ default: m.DatePlusDurationCalculator }))),
  // 'percentage-calculator': dynamic(() => import('@/components/calculators/categories/misc/MiscCalculators').then(m => ({ default: m.PercentageCalculator }))), // Replaced by AdvancedArithmeticTools version
  'fuel-cost-calculator': dynamic(() => import('@/components/calculators/categories/misc/AdvancedFuelCostCalculator').then(m => ({ default: m.AdvancedFuelCostCalculator }))),
  'bmi-calculator': dynamic(() => import('@/components/calculators/categories/health/ComprehensiveBMICalculator').then(m => ({ default: m.ComprehensiveBMICalculator }))),
  'emergency-fund': dynamic(() => import('@/components/calculators/categories/misc/EmergencyFund').then(m => ({ default: m.EmergencyFund }))),
  'life-insurance-calculator': dynamic(() => import('@/components/calculators/categories/insurance/LifeInsuranceCalculator').then(m => ({ default: m.LifeInsuranceCalculator }))),

  // Health Calculators
  'bmr-calculator': dynamic(() => import('@/components/calculators/categories/health/HealthCalculators').then(m => ({ default: m.BMRCalculator }))),
  'body-fat-calculator': dynamic(() => import('@/components/calculators/categories/health/HealthCalculators').then(m => ({ default: m.BodyFatCalculator }))),
  'calorie-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedCalorieCalculator').then(m => ({ default: m.AdvancedCalorieCalculator }))),
  'ideal-weight-calculator': dynamic(() => import('@/components/calculators/categories/health/HealthCalculators').then(m => ({ default: m.IdealWeightCalculator }))),
  'macro-calculator': dynamic(() => import('@/components/calculators/categories/health/HealthCalculators').then(m => ({ default: m.MacroCalculator }))),
  'tdee-calculator': dynamic(() => import('@/components/calculators/categories/health/HealthCalculators').then(m => ({ default: m.TDEECalculator }))),
  'water-intake-calculator': dynamic(() => import('@/components/calculators/categories/health/HealthCalculators').then(m => ({ default: m.WaterIntakeCalculator }))),
  'lean-body-mass': dynamic(() => import('@/components/calculators/categories/health/HealthCalculators').then(m => ({ default: m.LeanBodyMassCalculator }))),
  'waist-hip-ratio': dynamic(() => import('@/components/calculators/categories/health/HealthCalculators').then(m => ({ default: m.WaistHipRatioCalculator }))),
  'protein-calculator': dynamic(() => import('@/components/calculators/categories/health/HealthCalculators').then(m => ({ default: m.ProteinCalculator }))),
  'calories-burned': dynamic(() => import('@/components/calculators/categories/health/HealthCalculators').then(m => ({ default: m.CaloriesBurnedCalculator }))),
  'target-heart-rate': dynamic(() => import('@/components/calculators/categories/health/HealthCalculators').then(m => ({ default: m.TargetHeartRateCalculator }))),
  'sleep-calculator': dynamic(() => import('@/components/calculators/categories/health/HealthCalculators').then(m => ({ default: m.SleepCalculator }))),

  // Health - Body Measurements (NEW ADVANCED CALCULATORS)
  'body-surface-area': dynamic(() => import('@/components/calculators/categories/health/BodyMeasurementCalculators').then(m => ({ default: m.BodySurfaceAreaCalculator }))),
  'waist-to-height-ratio': dynamic(() => import('@/components/calculators/categories/health/BodyMeasurementCalculators').then(m => ({ default: m.WaistToHeightRatioCalculator }))),

  // Health - Nutrition / Supplements
  'caffeine-half-life': dynamic(() => import('@/components/calculators/categories/health/NutritionSupplementCalculators').then(m => ({ default: m.CaffeineHalfLifeCalculator }))),
  'creatine-intake': dynamic(() => import('@/components/calculators/categories/health/NutritionSupplementCalculators').then(m => ({ default: m.CreatineIntakeCalculator }))),
  'beta-alanine-dosage': dynamic(() => import('@/components/calculators/categories/health/NutritionSupplementCalculators').then(m => ({ default: m.BetaAlanineDosageCalculator }))),
  'citrulline-malate': dynamic(() => import('@/components/calculators/categories/health/NutritionSupplementCalculators').then(m => ({ default: m.CitrullineMalateCalculator }))),
  'bcaa-dosage': dynamic(() => import('@/components/calculators/categories/health/NutritionSupplementCalculators').then(m => ({ default: m.BCAADosageCalculator }))),
  'eaa-dosage': dynamic(() => import('@/components/calculators/categories/health/NutritionSupplementCalculators').then(m => ({ default: m.EAADosageCalculator }))),
  'glutamine-dosage': dynamic(() => import('@/components/calculators/categories/health/NutritionSupplementCalculators').then(m => ({ default: m.GlutamineDosageCalculator }))),
  'leucine-threshold': dynamic(() => import('@/components/calculators/categories/health/NutritionSupplementCalculators').then(m => ({ default: m.LeucineThresholdCalculator }))),
  'casein-protein': dynamic(() => import('@/components/calculators/categories/health/NutritionSupplementCalculators').then(m => ({ default: m.CaseinProteinCalculator }))),
  'whey-protein': dynamic(() => import('@/components/calculators/categories/health/NutritionSupplementCalculators').then(m => ({ default: m.WheyProteinCalculator }))),
  'plant-protein': dynamic(() => import('@/components/calculators/categories/health/NutritionSupplementCalculators').then(m => ({ default: m.PlantProteinCalculator }))),
  'collagen-dosage': dynamic(() => import('@/components/calculators/categories/health/NutritionSupplementCalculators').then(m => ({ default: m.CollagenDosageCalculator }))),
  'electrolyte-balance': dynamic(() => import('@/components/calculators/categories/health/NutritionSupplementCalculators').then(m => ({ default: m.ElectrolyteBalanceCalculator }))),
  'post-bariatric-protein': dynamic(() => import('@/components/calculators/categories/health/NutritionSupplementCalculators').then(m => ({ default: m.PostBariatricProteinCalculator }))),
  'toddler-calorie': dynamic(() => import('@/components/calculators/categories/health/NutritionSupplementCalculators').then(m => ({ default: m.ToddlerCalorieCalculator }))),

  // NOTE: Do NOT re-spread genericHealthToolIds here — it would override all specific implementations above.
  // The initial spread at the top of this object already covers all generic fallbacks.

  // ─── Health - Exercise & Performance ───────────────────────────────────────
  'one-rep-max': dynamic(() => import('@/components/calculators/categories/health/AdvancedExerciseCalculators').then(m => ({ default: m.OneRepMaxCalculator }))),
  'vo2-max-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedExerciseCalculators').then(m => ({ default: m.VO2MaxCalculator }))),
  'max-heart-rate-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedExerciseCalculators').then(m => ({ default: m.MaxHeartRateCalculator }))),
  'karvonen-formula': dynamic(() => import('@/components/calculators/categories/health/AdvancedExerciseCalculators').then(m => ({ default: m.KarvonenFormulaCalculator }))),
  'pace-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedExerciseCalculators').then(m => ({ default: m.PaceCalculator }))),
  'calories-burned-walking': dynamic(() => import('@/components/calculators/categories/health/AdvancedExerciseCalculators').then(m => ({ default: m.CaloriesBurnedWalkingCalculator }))),
  'calories-burned-running': dynamic(() => import('@/components/calculators/categories/health/AdvancedExerciseCalculators').then(m => ({ default: m.CaloriesBurnedRunningCalculator }))),
  'swimming-calories-burned': dynamic(() => import('@/components/calculators/categories/health/AdvancedExerciseCalculators').then(m => ({ default: m.SwimmingCaloriesCalculator }))),
  'hiit-workout-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedExerciseCalculators').then(m => ({ default: m.HIITCaloriesCalculator }))),
  'steps-to-calories': dynamic(() => import('@/components/calculators/categories/health/AdvancedExerciseCalculators').then(m => ({ default: m.StepsToCaloriesCalculator }))),
  'bench-press-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedExerciseCalculators').then(m => ({ default: m.BenchPressCalculator }))),
  'squat-strength-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedExerciseCalculators').then(m => ({ default: m.SquatStrengthCalculator }))),
  'deadlift-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedExerciseCalculators').then(m => ({ default: m.DeadliftCalculator }))),
  'wilks-score-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedExerciseCalculators').then(m => ({ default: m.WilksScoreCalculator }))),
  'training-zone-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedExerciseCalculators').then(m => ({ default: m.TrainingZoneCalculator }))),
  'met-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedExerciseCalculators').then(m => ({ default: m.METCalculator }))),
  'strength-volume-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedExerciseCalculators').then(m => ({ default: m.StrengthVolumeCalculator }))),
  'power-to-weight': dynamic(() => import('@/components/calculators/categories/health/AdvancedExerciseCalculators').then(m => ({ default: m.PowerToWeightCalculator }))),
  'ftp-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedExerciseCalculators').then(m => ({ default: m.FTPCalculator }))),
  'maf-180': dynamic(() => import('@/components/calculators/categories/health/AdvancedExerciseCalculators').then(m => ({ default: m.MAF180Calculator }))),
  'cooper-test-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedExerciseCalculators').then(m => ({ default: m.CooperTestCalculator }))),

  // ─── Health - Heart & Vital Health ─────────────────────────────────────────
  'blood-pressure-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedHeartHealthCalculators').then(m => ({ default: m.BloodPressureCalculator }))),
  'resting-heart-rate': dynamic(() => import('@/components/calculators/categories/health/AdvancedHeartHealthCalculators').then(m => ({ default: m.RestingHeartRateCalculator }))),
  'pulse-pressure-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedHeartHealthCalculators').then(m => ({ default: m.PulsePressureCalculator }))),
  'mean-arterial-pressure': dynamic(() => import('@/components/calculators/categories/health/AdvancedHeartHealthCalculators').then(m => ({ default: m.MeanArterialPressureCalculator }))),
  'cardiac-output-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedHeartHealthCalculators').then(m => ({ default: m.CardiacOutputCalculator }))),
  'heart-age-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedHeartHealthCalculators').then(m => ({ default: m.HeartAgeCalculator }))),
  'blood-volume-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedHeartHealthCalculators').then(m => ({ default: m.BloodVolumeCalculator }))),
  'oxygen-saturation-interpreter': dynamic(() => import('@/components/calculators/categories/health/AdvancedHeartHealthCalculators').then(m => ({ default: m.OxygenSaturationInterpreter }))),
  'qt-interval-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedHeartHealthCalculators').then(m => ({ default: m.QTIntervalCalculator }))),
  'stroke-volume-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedHeartHealthCalculators').then(m => ({ default: m.StrokeVolumeCalculator }))),
  'ankle-brachial-index': dynamic(() => import('@/components/calculators/categories/health/AdvancedHeartHealthCalculators').then(m => ({ default: m.AnkleBrachialIndexCalculator }))),
  'pao2-fio2-ratio': dynamic(() => import('@/components/calculators/categories/health/AdvancedHeartHealthCalculators').then(m => ({ default: m.PaO2FiO2RatioCalculator }))),
  'tidal-volume-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedHeartHealthCalculators').then(m => ({ default: m.TidalVolumeCalculator }))),

  // ─── Health - Weight & Goal Management ─────────────────────────────────────
  'weight-loss-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedWeightGoalCalculators').then(m => ({ default: m.WeightLossCalculator }))),
  'calorie-deficit-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedWeightGoalCalculators').then(m => ({ default: m.CalorieDeficitCalculator }))),
  'goal-weight-date': dynamic(() => import('@/components/calculators/categories/health/AdvancedWeightGoalCalculators').then(m => ({ default: m.GoalWeightDateCalculator }))),
  'bulk-cut-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedWeightGoalCalculators').then(m => ({ default: m.BulkCutCalculator }))),
  'neat-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedWeightGoalCalculators').then(m => ({ default: m.NEATCalculator }))),
  'thermic-effect-food': dynamic(() => import('@/components/calculators/categories/health/AdvancedWeightGoalCalculators').then(m => ({ default: m.ThermicEffectFoodCalculator }))),
  'ffmi-natural-limit': dynamic(() => import('@/components/calculators/categories/health/AdvancedWeightGoalCalculators').then(m => ({ default: m.FFMICalculator }))),
  'body-fat-goal-planner': dynamic(() => import('@/components/calculators/categories/health/AdvancedWeightGoalCalculators').then(m => ({ default: m.IdealBodyFatCalculator }))),
  'maintenance-calorie-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedWeightGoalCalculators').then(m => ({ default: m.MaintenanceCalorieCalculator }))),

  // ─── Health - Pregnancy & Fertility ────────────────────────────────────────
  'due-date-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedPregnancyCalculators').then(m => ({ default: m.DueDateCalculator }))),
  'ovulation-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedPregnancyCalculators').then(m => ({ default: m.OvulationCalculator }))),
  'gestational-age-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedPregnancyCalculators').then(m => ({ default: m.GestationalAgeCalculator }))),
  'pregnancy-weight-gain': dynamic(() => import('@/components/calculators/categories/health/AdvancedPregnancyCalculators').then(m => ({ default: m.PregnancyWeightGainCalculator }))),
  'baby-height': dynamic(() => import('@/components/calculators/categories/health/AdvancedPregnancyCalculators').then(m => ({ default: m.BabyHeightPredictor }))),
  'hcg-doubling-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedPregnancyCalculators').then(m => ({ default: m.HCGDoublingCalculator }))),
  'baby-blood-type': dynamic(() => import('@/components/calculators/categories/health/AdvancedPregnancyCalculators').then(m => ({ default: m.BabyBloodTypeCalculator }))),
  'conception-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedPregnancyCalculators').then(m => ({ default: m.ConceptionDateCalculator }))),
  'conception-date-estimator': dynamic(() => import('@/components/calculators/categories/health/AdvancedPregnancyCalculators').then(m => ({ default: m.ConceptionDateCalculator }))),
  'ovulation-tracker': dynamic(() => import('@/components/calculators/categories/health/AdvancedPregnancyCalculators').then(m => ({ default: m.OvulationCalculator }))),

  // ─── Health - Sleep & Lifestyle ────────────────────────────────────────────
  'sleep-cycle-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedSleepCalculators').then(m => ({ default: m.SleepCycleCalculator }))),
  'sleep-cycle-optimizer': dynamic(() => import('@/components/calculators/categories/health/AdvancedSleepCalculators').then(m => ({ default: m.SleepCycleCalculator }))),
  'sleep-debt-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedSleepCalculators').then(m => ({ default: m.SleepDebtCalculator }))),
  'sleep-efficiency-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedSleepCalculators').then(m => ({ default: m.SleepEfficiencyCalculator }))),
  'caffeine-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedSleepCalculators').then(m => ({ default: m.CaffeineDailyTrackerCalculator }))),
  'jet-lag-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedSleepCalculators').then(m => ({ default: m.JetLagCalculator }))),
  'jet-lag-recovery': dynamic(() => import('@/components/calculators/categories/health/AdvancedSleepCalculators').then(m => ({ default: m.JetLagCalculator }))),
  'smoke-free-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedSleepCalculators').then(m => ({ default: m.SmokeFreeCalculator }))),
  'nap-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedSleepCalculators').then(m => ({ default: m.NapCalculator }))),
  'alcohol-calorie-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedSleepCalculators').then(m => ({ default: m.AlcoholCalorieCalculator }))),

  // ─── Health - Disease Risk & Prevention ────────────────────────────────────
  'diabetes-risk-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedDiseaseRiskCalculators').then(m => ({ default: m.DiabetesRiskCalculator }))),
  'cholesterol-ratio-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedDiseaseRiskCalculators').then(m => ({ default: m.CholesterolRatioCalculator }))),
  'ldl-cholesterol-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedDiseaseRiskCalculators').then(m => ({ default: m.LDLCholesterolCalculator }))),
  'insulin-resistance-homa-ir': dynamic(() => import('@/components/calculators/categories/health/AdvancedDiseaseRiskCalculators').then(m => ({ default: m.HOMAIRCalculator }))),
  'egfr-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedDiseaseRiskCalculators').then(m => ({ default: m.eGFRCalculator }))),
  'creatinine-clearance': dynamic(() => import('@/components/calculators/categories/health/AdvancedDiseaseRiskCalculators').then(m => ({ default: m.CrClCalculator }))),
  'anion-gap-calculator': dynamic(() => import('@/components/calculators/categories/health/AdvancedDiseaseRiskCalculators').then(m => ({ default: m.AnionGapCalculator }))),
  'corrected-calcium': dynamic(() => import('@/components/calculators/categories/health/AdvancedDiseaseRiskCalculators').then(m => ({ default: m.CorrectedCalciumCalculator }))),

  // Math Calculators
  'basic-calculator': dynamic(() => import('@/components/calculators/categories/math/BasicArithmetic').then(m => ({ default: m.BasicCalculator }))),
  'fraction-calculator': dynamic(() => import('@/components/calculators/categories/math/AdvancedArithmeticTools').then(m => ({ default: m.FractionCalculator }))),

  // Advanced Math Tools (Batch 1 Upgrades)
  'percentage-calculator': dynamic(() => import('@/components/calculators/categories/math/AdvancedArithmeticTools').then(m => ({ default: m.PercentageCalculator }))),
  'average-calculator': dynamic(() => import('@/components/calculators/categories/math/AdvancedArithmeticTools').then(m => ({ default: m.AverageCalculator }))),
  'ratio-calculator': dynamic(() => import('@/components/calculators/categories/math/AdvancedArithmeticTools').then(m => ({ default: m.RatioCalculator }))),
  'proportion-calculator': dynamic(() => import('@/components/calculators/categories/math/AdvancedArithmeticTools').then(m => ({ default: m.ProportionCalculator }))),
  'square-root-calculator': dynamic(() => import('@/components/calculators/categories/math/AdvancedArithmeticTools').then(m => ({ default: m.RootsCalculator }))), // Default is square
  'cube-root-calculator': dynamic(() => import('@/components/calculators/categories/math/AdvancedArithmeticTools').then(m => ({ default: m.CubeRootCalculator }))),

  // Advanced Math Tools (Batch 2 Upgrades)
  'rounding-calculator': dynamic(() => import('@/components/calculators/categories/math/AdvancedArithmeticTools').then(m => ({ default: m.RoundingCalculator }))),
  'factorial-calculator': dynamic(() => import('@/components/calculators/categories/math/AdvancedArithmeticTools').then(m => ({ default: m.FactorialCalculator }))),
  'absolute-value-calculator': dynamic(() => import('@/components/calculators/categories/math/AdvancedArithmeticTools').then(m => ({ default: m.AbsoluteValueCalculator }))),
  'reciprocal-calculator': dynamic(() => import('@/components/calculators/categories/math/AdvancedArithmeticTools').then(m => ({ default: m.ReciprocalCalculator }))),

  // Advanced Math Tools (Batch 3 Upgrades)
  'remainder-calculator': dynamic(() => import('@/components/calculators/categories/math/AdvancedArithmeticTools').then(m => ({ default: m.RemainderCalculator }))),
  'modulo-calculator': dynamic(() => import('@/components/calculators/categories/math/AdvancedArithmeticTools').then(m => ({ default: m.ModuloCalculator }))),
  'sum-of-series-calculator': dynamic(() => import('@/components/calculators/categories/math/AdvancedArithmeticTools').then(m => ({ default: m.SumOfSeriesCalculator }))),
  'product-of-series-calculator': dynamic(() => import('@/components/calculators/categories/math/AdvancedArithmeticTools').then(m => ({ default: m.ProductOfSeriesCalculator }))),
  'difference-calculator': dynamic(() => import('@/components/calculators/categories/math/AdvancedArithmeticTools').then(m => ({ default: m.DifferenceCalculator }))),


  // Advanced Math Tools (New Additions)
  'percentage-change-calculator': dynamic(() => import('@/components/calculators/categories/math/AdvancedMathCalculators').then(m => ({ default: m.PercentageChangeCalculator }))),
  'prime-factorization-calculator': dynamic(() => import('@/components/calculators/categories/math/AdvancedMathCalculators').then(m => ({ default: m.PrimeFactorizationCalculator }))),
  'divisibility-checker': dynamic(() => import('@/components/calculators/categories/math/AdvancedMathCalculators').then(m => ({ default: m.DivisibilityChecker }))),
  'even-odd-checker': dynamic(() => import('@/components/calculators/categories/math/AdvancedMathCalculators').then(m => ({ default: m.EvenOddChecker }))),

  // New Insurance
  'term-insurance': dynamic(() => import('@/components/calculators/categories/insurance/InsuranceCalculators').then(m => ({ default: m.TermInsurancePremium }))),
  'human-life-value': dynamic(() => import('@/components/calculators/categories/insurance/InsuranceCalculators').then(m => ({ default: m.HumanLifeValue }))),
  'health-insurance': dynamic(() => import('@/components/calculators/categories/insurance/InsuranceCalculators').then(m => ({ default: m.HealthInsurancePremium }))),

  // New Real Estate
  'rental-yield': dynamic(() => import('@/components/calculators/categories/real-estate/RealEstateCalculators').then(m => ({ default: m.RentalYield }))),
  'home-affordability': dynamic(() => import('@/components/calculators/categories/real-estate/RealEstateCalculators').then(m => ({ default: m.HomeAffordability }))),
  'stamp-duty': dynamic(() => import('@/components/calculators/categories/real-estate/RealEstateCalculators').then(m => ({ default: m.StampDuty }))),

  // Extended Real Estate
  'construction-cost': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.ConstructionCostCalculator }))),
  'land-area-converter': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.LandAreaConverter }))),
  'property-capital-gains': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.PropertyCapitalGains }))),
  'property-tax': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.PropertyTaxCalculator }))),
  'pre-emi-calculator': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.PreEMICalculator }))),
  'plot-loan': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.PlotLoanCalculator }))),
  'interior-design-cost': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.InteriorDesignCost }))),
  'down-payment-goal': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.DownPaymentGoal }))),
  'home-loan-balance-transfer': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.HomeLoanBalanceTransfer }))),
  'pmay-subsidy': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.PMAYSubsidyCalculator }))),
  'carpet-area-calculator': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.CarpetAreaCalculator }))),
  'fsi-calculator': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.FSICalculator }))),
  'rental-agreement-cost': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.RentalAgreementCost }))),
  'paint-cost-calculator': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.PaintCostCalculator }))),
  'flooring-cost-calculator': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.FlooringCostCalculator }))),
  'false-ceiling-cost': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.FalseCeilingCost }))),
  'modular-kitchen-cost': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.ModularKitchenCost }))),
  'wardrobe-cost-calculator': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.WardrobeCostCalculator }))),
  'solar-rooftop-calculator': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.SolarRooftopCalculator }))),
  'bricks-calculator': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.BricksCalculator }))),
  'cement-calculator': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.CementCalculator }))),
  'water-tank-capacity': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.WaterTankCapacity }))),
  'electrical-wiring-cost': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.ElectricalWiringCost }))),
  'plumbing-cost-calculator': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.PlumbingCostCalculator }))),
  'bathroom-renovation-cost': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.BathroomRenovationCost }))),
  'staircase-calculator': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.StaircaseCalculator }))),
  'septic-tank-size': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.SepticTankSize }))),
  'rainwater-harvesting': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.RainwaterHarvesting }))),
  'fence-cost-calculator': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.FenceCostCalculator }))),
  'driveway-cost-calculator': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.DrivewayCostCalculator }))),
  'pool-cost-calculator': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.PoolCostCalculator }))),

  // New Retirement
  'atal-pension-yojana': dynamic(() => import('@/components/calculators/categories/retirement/MoreRetirementCalculators').then(m => ({ default: m.AtalPensionYojana }))),
  'corpus-longevity': dynamic(() => import('@/components/calculators/categories/retirement/MoreRetirementCalculators').then(m => ({ default: m.InflationAdjustedWithdrawal }))),
  'nps-withdrawal': dynamic(() => import('@/components/calculators/categories/retirement/MoreRetirementCalculators').then(m => ({ default: m.NPSWithdrawal }))),

  // Extended Retirement
  'epf-calculator': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.EPFCalculator }))),
  'vpf-calculator': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.VPFCalculator }))),
  'inflation-pension': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.InflationPensionCalculator }))),
  'superannuation-calculator': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.SuperannuationCalculator }))),
  'post-retirement-budget': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.PostRetirementBudget }))),
  'swp-tax-calculator': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.SWPTaxCalculator }))),
  'nps-tier2': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.NPSTier2Calculator }))),
  'retirement-shortfall': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.RetirementShortfall }))),
  'fire-calculator-pro': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.EarlyRetirementCalculator }))),
  'gratuity-retirement': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.GratuityCalculator }))),
  'leave-encashment-retirement': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.LeaveEncashmentCalculator }))),
  'vrs-retirement': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.VRSCompensationCalculator }))),
  'scss-retirement': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.SeniorCitizenSavingsScheme }))),
  'pmvvy-scheme': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.PMVVYSchemeCalculator }))),
  'reverse-mortgage': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.ReverseMortgageCalculator }))),
  'medical-inflation': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.MedicalInflationCalculator }))),
  'bucket-strategy': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.BucketStrategyCalculator }))),
  'annuity-yield': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.AnnuityYieldCalculator }))),
  'life-expectancy': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.LifeExpectancyCalculator }))),
  'travel-fund': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.TravelFundCalculator }))),
  'legacy-planner': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.LegacyPlannerCalculator }))),
  'care-cost': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.CareCostCalculator }))),
  'pension-tax': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.PensionTaxCalculator }))),
  'eps-pension': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.EPSPensionCalculator }))),
  'health-premium-projector': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.HealthPremiumProjector }))),

  // New Credit Card
  'credit-card-min-due': dynamic(() => import('@/components/calculators/categories/credit-card/MoreCreditCardCalculators').then(m => ({ default: m.CreditCardMinimumDue }))),
  'balance-transfer': dynamic(() => import('@/components/calculators/categories/credit-card/MoreCreditCardCalculators').then(m => ({ default: m.BalanceTransfer }))),
  'credit-card-emi': dynamic(() => import('@/components/calculators/categories/credit-card/MoreCreditCardCalculators').then(m => ({ default: m.CreditCardEMI }))),

  // New Personal Finance
  'net-worth': dynamic(() => import('@/components/calculators/categories/misc/PersonalFinanceCalculators').then(m => ({ default: m.NetWorth }))),
  'savings-goal': dynamic(() => import('@/components/calculators/categories/misc/PersonalFinanceCalculators').then(m => ({ default: m.SavingsGoal }))),
  'budget-planner': dynamic(() => import('@/components/calculators/categories/misc/PersonalFinanceCalculators').then(m => ({ default: m.BudgetPlanner }))),

  // New Banking
  'kvp-calculator': dynamic(() => import('@/components/calculators/categories/banking/MoreBankingCalculators').then(m => ({ default: m.KisanVikasPatra }))),
  'nsc-calculator': dynamic(() => import('@/components/calculators/categories/banking/MoreBankingCalculators').then(m => ({ default: m.NationalSavingsCertificate }))),
  'pomis-calculator': dynamic(() => import('@/components/calculators/categories/banking/MoreBankingCalculators').then(m => ({ default: m.PostOfficeMIS }))),

  // New Business
  'depreciation-calculator': dynamic(() => import('@/components/calculators/categories/business/MoreBusinessCalculators').then(m => ({ default: m.DepreciationCalculator }))),
  'cash-flow-calculator': dynamic(() => import('@/components/calculators/categories/business/MoreBusinessCalculators').then(m => ({ default: m.CashFlowCalculator }))),
  'burn-rate-calculator': dynamic(() => import('@/components/calculators/categories/business/MoreBusinessCalculators').then(m => ({ default: m.BurnRateCalculator }))),

  // New Loan
  'loan-part-payment': dynamic(() => import('@/components/calculators/categories/loan/MoreLoanCalculators').then(m => ({ default: m.LoanPartPayment }))),
  'moratorium-calculator': dynamic(() => import('@/components/calculators/categories/loan/MoreLoanCalculators').then(m => ({ default: m.MoratoriumCalculator }))),

  // New Tax
  'leave-encashment': dynamic(() => import('@/components/calculators/categories/tax/MoreTaxCalculators').then(m => ({ default: m.LeaveEncashment }))),
  'vrs-compensation': dynamic(() => import('@/components/calculators/categories/tax/MoreTaxCalculators').then(m => ({ default: m.VRSCompensation }))),

  // Extended Tax
  '80c-calculator': dynamic(() => import('@/components/calculators/categories/tax/ExtendedTaxCalculators').then(m => ({ default: m.Deduction80CCalculator }))),
  '80d-calculator': dynamic(() => import('@/components/calculators/categories/tax/ExtendedTaxCalculators').then(m => ({ default: m.Deduction80DCalculator }))),
  '80g-calculator': dynamic(() => import('@/components/calculators/categories/tax/ExtendedTaxCalculators').then(m => ({ default: m.Deduction80GCalculator }))),
  '80tta-calculator': dynamic(() => import('@/components/calculators/categories/tax/ExtendedTaxCalculators').then(m => ({ default: m.Deduction80TTACalculator }))),
  'capital-gains-indexation': dynamic(() => import('@/components/calculators/categories/tax/ExtendedTaxCalculators').then(m => ({ default: m.CapitalGainsIndexationCalculator }))),
  'crypto-tax': dynamic(() => import('@/components/calculators/categories/tax/ExtendedTaxCalculators').then(m => ({ default: m.CryptoTaxCalculator }))),
  'lottery-tax': dynamic(() => import('@/components/calculators/categories/tax/ExtendedTaxCalculators').then(m => ({ default: m.LotteryTaxCalculator }))),
  'gift-tax': dynamic(() => import('@/components/calculators/categories/tax/ExtendedTaxCalculators').then(m => ({ default: m.GiftTaxCalculator }))),
  'rental-income-tax': dynamic(() => import('@/components/calculators/categories/tax/ExtendedTaxCalculators').then(m => ({ default: m.RentalIncomeTaxCalculator }))),
  'presumptive-tax': dynamic(() => import('@/components/calculators/categories/tax/ExtendedTaxCalculators').then(m => ({ default: m.PresumptiveTaxCalculator }))),
  'advance-tax': dynamic(() => import('@/components/calculators/categories/tax/ExtendedTaxCalculators').then(m => ({ default: m.AdvanceTaxCalculator }))),
  'surcharge-calculator': dynamic(() => import('@/components/calculators/categories/tax/ExtendedTaxCalculators').then(m => ({ default: m.SurchargeCalculator }))),
  'marginal-relief': dynamic(() => import('@/components/calculators/categories/tax/ExtendedTaxCalculators').then(m => ({ default: m.MarginalReliefCalculator }))),
  '87a-rebate': dynamic(() => import('@/components/calculators/categories/tax/ExtendedTaxCalculators').then(m => ({ default: m.Rebate87ACalculator }))),
  'agri-income-tax': dynamic(() => import('@/components/calculators/categories/tax/ExtendedTaxCalculators').then(m => ({ default: m.AgriIncomeTaxCalculator }))),

  // Extended Time-Based Finance
  'hourly-to-annual': dynamic(() => import('@/components/calculators/categories/time-based-finance/ExtendedTimeBasedFinanceCalculators').then(m => ({ default: m.HourlyToAnnualCalculator }))),
  'annual-to-hourly': dynamic(() => import('@/components/calculators/categories/time-based-finance/ExtendedTimeBasedFinanceCalculators').then(m => ({ default: m.AnnualToHourlyCalculator }))),
  'pay-period-calculator': dynamic(() => import('@/components/calculators/categories/time-based-finance/ExtendedTimeBasedFinanceCalculators').then(m => ({ default: m.PayPeriodCalculator }))),
  'time-value-money': dynamic(() => import('@/components/calculators/categories/time-based-finance/ExtendedTimeBasedFinanceCalculators').then(m => ({ default: m.TimeValueOfMoneyCalculator }))),
  'compound-time': dynamic(() => import('@/components/calculators/categories/time-based-finance/ExtendedTimeBasedFinanceCalculators').then(m => ({ default: m.CompoundTimeCalculator }))),
  'payroll-hours': dynamic(() => import('@/components/calculators/categories/time-based-finance/ExtendedTimeBasedFinanceCalculators').then(m => ({ default: m.PayrollHoursCalculator }))),
  'time-off-accrual': dynamic(() => import('@/components/calculators/categories/time-based-finance/ExtendedTimeBasedFinanceCalculators').then(m => ({ default: m.TimeOffAccrualCalculator }))),
  'sick-leave-calculator': dynamic(() => import('@/components/calculators/categories/time-based-finance/ExtendedTimeBasedFinanceCalculators').then(m => ({ default: m.SickLeaveCalculator }))),
  'contract-duration': dynamic(() => import('@/components/calculators/categories/time-based-finance/ExtendedTimeBasedFinanceCalculators').then(m => ({ default: m.ContractDurationCalculator }))),
  'subscription-cost-time': dynamic(() => import('@/components/calculators/categories/time-based-finance/ExtendedTimeBasedFinanceCalculators').then(m => ({ default: m.SubscriptionCostTimeCalculator }))),

  // New Investment
  'dividend-yield': dynamic(() => import('@/components/calculators/categories/investment/MoreInvestmentCalculators').then(m => ({ default: m.DividendYield }))),
  'stock-return': dynamic(() => import('@/components/calculators/categories/investment/MoreInvestmentCalculators').then(m => ({ default: m.StockReturn }))),
  'bond-yield': dynamic(() => import('@/components/calculators/categories/investment/MoreInvestmentCalculators').then(m => ({ default: m.BondYield }))),

  // New Misc
  'electricity-bill': dynamic(() => import('@/components/calculators/categories/misc/MiscCalculators').then(m => ({ default: m.ElectricityBill }))),
  'water-bill': dynamic(() => import('@/components/calculators/categories/misc/MiscCalculators').then(m => ({ default: m.WaterBill }))),

  // Extended Insurance
  'motor-insurance': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.MotorInsuranceCalculator }))),
  'insurance-gst': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.InsuranceGSTCalculator }))),
  'endowment-policy': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.EndowmentCalculator }))),
  'child-plan': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.ChildPlanCalculator }))),
  'ncb-calculator': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.NCBCalculator }))),
  'term-vs-invest': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.TermVsInvestCalculator }))),
  'pli-calculator': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.PLICalculator }))),
  'travel-insurance-cost': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.TravelInsuranceCost }))),
  'home-insurance-calculator': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.HomeInsuranceCalculator }))),
  'critical-illness-cover': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.CriticalIllnessCover }))),
  'cyber-insurance-calculator': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.CyberInsuranceCalculator }))),
  'surrender-value-calculator': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.SurrenderValueCalculator }))),
  'pet-insurance-calculator': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.PetInsuranceCalculator }))),
  'bicycle-insurance-calculator': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.BicycleInsuranceCalculator }))),
  'mobile-insurance-calculator': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.MobileInsuranceCalculator }))),
  'wedding-insurance-calculator': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.WeddingInsuranceCalculator }))),
  'group-health-insurance': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.GroupHealthInsurancePremium }))),
  'keyman-insurance': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.KeymanInsuranceCalculator }))),
  'marine-insurance': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.MarineInsuranceCalculator }))),
  'fire-insurance': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.FireInsuranceCalculator }))),
  'burglary-insurance': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.BurglaryInsuranceCalculator }))),
  'public-liability': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.PublicLiabilityInsurance }))),
  'workmens-compensation': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.WorkmensCompensation }))),
  'directors-officers-liability': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.DirectorsOfficersLiability }))),
  'professional-indemnity': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.ProfessionalIndemnity }))),
  'crop-insurance': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.CropInsuranceCalculator }))),
  'shopkeepers-insurance': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.ShopkeepersInsurance }))),
  // 'motor-insurance': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.MotorInsuranceCalculator }))), // DISABLED - old template structure
  // 'ulip-calculator': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.ULIPCalculator }))), // DISABLED - old template structure
  // 'endowment-policy': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.EndowmentCalculator }))), // DISABLED - old template structure
  // 'child-plan': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.ChildPlanCalculator }))), // DISABLED - old template structure
  // 'ncb-calculator': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.NCBCalculator }))), // DISABLED - old template structure
  // 'insurance-gst': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.InsuranceGSTCalculator }))), // DISABLED - old template structure
  // 'term-vs-invest': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.TermVsInvestCalculator }))), // DISABLED - old template structure
  // 'pli-calculator': dynamic(() => import('@/components/calculators/categories/insurance/ExtendedInsuranceCalculators').then(m => ({ default: m.PLICalculator }))), // DISABLED - old template structure

  // More Extended Insurance
  // 'term-insurance-premium': dynamic(() => import('@/components/calculators/categories/insurance/MoreExtendedInsuranceCalculators').then(m => ({ default: m.TermInsurancePremium }))), // DISABLED - old template structure
  // 'hlv-calculator': dynamic(() => import('@/components/calculators/categories/insurance/MoreExtendedInsuranceCalculators').then(m => ({ default: m.HLVCalculator }))), // DISABLED - old template structure
  // 'health-insurance-premium': dynamic(() => import('@/components/calculators/categories/insurance/MoreExtendedInsuranceCalculators').then(m => ({ default: m.HealthInsurancePremium }))), // DISABLED - old template structure
  // 'travel-insurance-cost': dynamic(() => import('@/components/calculators/categories/insurance/MoreExtendedInsuranceCalculators').then(m => ({ default: m.TravelInsuranceCost }))), // DISABLED - old template structure
  // 'home-insurance-calculator': dynamic(() => import('@/components/calculators/categories/insurance/MoreExtendedInsuranceCalculators').then(m => ({ default: m.HomeInsuranceCalculator }))), // DISABLED - old template structure
  // 'critical-illness-cover': dynamic(() => import('@/components/calculators/categories/insurance/MoreExtendedInsuranceCalculators').then(m => ({ default: m.CriticalIllnessCover }))), // DISABLED - old template structure
  // 'cyber-insurance-calculator': dynamic(() => import('@/components/calculators/categories/insurance/MoreExtendedInsuranceCalculators').then(m => ({ default: m.CyberInsuranceCalculator }))), // DISABLED - old template structure
  // 'surrender-value-calculator': dynamic(() => import('@/components/calculators/categories/insurance/MoreExtendedInsuranceCalculators').then(m => ({ default: m.SurrenderValueCalculator }))), // DISABLED - old template structure
  // 'pet-insurance-calculator': dynamic(() => import('@/components/calculators/categories/insurance/MoreExtendedInsuranceCalculators').then(m => ({ default: m.PetInsuranceCalculator }))), // DISABLED - old template structure
  // 'bicycle-insurance-calculator': dynamic(() => import('@/components/calculators/categories/insurance/MoreExtendedInsuranceCalculators').then(m => ({ default: m.BicycleInsuranceCalculator }))), // DISABLED - old template structure
  // 'mobile-insurance-calculator': dynamic(() => import('@/components/calculators/categories/insurance/MoreExtendedInsuranceCalculators').then(m => ({ default: m.MobileInsuranceCalculator }))), // DISABLED - old template structure
  // 'wedding-insurance-calculator': dynamic(() => import('@/components/calculators/categories/insurance/MoreExtendedInsuranceCalculators').then(m => ({ default: m.WeddingInsuranceCalculator }))), // DISABLED - old template structure

  // Even More Extended Insurance
  // 'group-health-insurance': dynamic(() => import('@/components/calculators/categories/insurance/EvenMoreExtendedInsuranceCalculators').then(m => ({ default: m.GroupHealthInsurancePremium }))), // DISABLED - old template structure
  // 'keyman-insurance': dynamic(() => import('@/components/calculators/categories/insurance/EvenMoreExtendedInsuranceCalculators').then(m => ({ default: m.KeymanInsuranceCalculator }))), // DISABLED - old template structure
  // 'marine-insurance': dynamic(() => import('@/components/calculators/categories/insurance/EvenMoreExtendedInsuranceCalculators').then(m => ({ default: m.MarineInsuranceCalculator }))), // DISABLED - old template structure
  // 'fire-insurance': dynamic(() => import('@/components/calculators/categories/insurance/EvenMoreExtendedInsuranceCalculators').then(m => ({ default: m.FireInsuranceCalculator }))), // DISABLED - old template structure
  // 'burglary-insurance': dynamic(() => import('@/components/calculators/categories/insurance/EvenMoreExtendedInsuranceCalculators').then(m => ({ default: m.BurglaryInsuranceCalculator }))), // DISABLED - old template structure
  // 'public-liability': dynamic(() => import('@/components/calculators/categories/insurance/EvenMoreExtendedInsuranceCalculators').then(m => ({ default: m.PublicLiabilityInsurance }))), // DISABLED - old template structure
  // 'workmens-compensation': dynamic(() => import('@/components/calculators/categories/insurance/EvenMoreExtendedInsuranceCalculators').then(m => ({ default: m.WorkmensCompensation }))), // DISABLED - old template structure
  // 'directors-officers-liability': dynamic(() => import('@/components/calculators/categories/insurance/EvenMoreExtendedInsuranceCalculators').then(m => ({ default: m.DirectorsOfficersLiability }))), // DISABLED - old template structure
  // 'professional-indemnity': dynamic(() => import('@/components/calculators/categories/insurance/EvenMoreExtendedInsuranceCalculators').then(m => ({ default: m.ProfessionalIndemnity }))), // DISABLED - old template structure
  // 'crop-insurance': dynamic(() => import('@/components/calculators/categories/insurance/EvenMoreExtendedInsuranceCalculators').then(m => ({ default: m.CropInsuranceCalculator }))), // DISABLED - old template structure
  // 'shopkeepers-insurance': dynamic(() => import('@/components/calculators/categories/insurance/EvenMoreExtendedInsuranceCalculators').then(m => ({ default: m.ShopkeepersInsurance }))), // DISABLED - old template structure

  // More Extended Real Estate
  // 'home-loan-balance-transfer': dynamic(() => import('@/components/calculators/categories/real-estate/MoreExtendedRealEstateCalculators').then(m => ({ default: m.HomeLoanBalanceTransfer }))), // DISABLED - old template structure
  // 'pmay-subsidy': dynamic(() => import('@/components/calculators/categories/real-estate/MoreExtendedRealEstateCalculators').then(m => ({ default: m.PMAYSubsidyCalculator }))), // DISABLED - old template structure
  // 'carpet-area-calculator': dynamic(() => import('@/components/calculators/categories/real-estate/MoreExtendedRealEstateCalculators').then(m => ({ default: m.CarpetAreaCalculator }))), // DISABLED - old template structure
  // 'fsi-calculator': dynamic(() => import('@/components/calculators/categories/real-estate/MoreExtendedRealEstateCalculators').then(m => ({ default: m.FSICalculator }))), // DISABLED - old template structure
  // 'rental-agreement-cost': dynamic(() => import('@/components/calculators/categories/real-estate/MoreExtendedRealEstateCalculators').then(m => ({ default: m.RentalAgreementCost }))), // DISABLED - old template structure
  // 'paint-cost-calculator': dynamic(() => import('@/components/calculators/categories/real-estate/MoreExtendedRealEstateCalculators').then(m => ({ default: m.PaintCostCalculator }))), // DISABLED - old template structure
  // 'flooring-cost-calculator': dynamic(() => import('@/components/calculators/categories/real-estate/MoreExtendedRealEstateCalculators').then(m => ({ default: m.FlooringCostCalculator }))), // DISABLED - old template structure
  // 'false-ceiling-cost': dynamic(() => import('@/components/calculators/categories/real-estate/MoreExtendedRealEstateCalculators').then(m => ({ default: m.FalseCeilingCost }))), // DISABLED - old template structure
  // 'modular-kitchen-cost': dynamic(() => import('@/components/calculators/categories/real-estate/MoreExtendedRealEstateCalculators').then(m => ({ default: m.ModularKitchenCost }))), // DISABLED - old template structure
  // 'wardrobe-cost-calculator': dynamic(() => import('@/components/calculators/categories/real-estate/MoreExtendedRealEstateCalculators').then(m => ({ default: m.WardrobeCostCalculator }))), // DISABLED - old template structure
  // 'solar-rooftop-calculator': dynamic(() => import('@/components/calculators/categories/real-estate/MoreExtendedRealEstateCalculators').then(m => ({ default: m.SolarRooftopCalculator }))), // DISABLED - old template structure
  // 'bricks-calculator': dynamic(() => import('@/components/calculators/categories/real-estate/MoreExtendedRealEstateCalculators').then(m => ({ default: m.BricksCalculator }))), // DISABLED - old template structure
  // 'cement-calculator': dynamic(() => import('@/components/calculators/categories/real-estate/MoreExtendedRealEstateCalculators').then(m => ({ default: m.CementCalculator }))), // DISABLED - old template structure
  // 'water-tank-capacity': dynamic(() => import('@/components/calculators/categories/real-estate/MoreExtendedRealEstateCalculators').then(m => ({ default: m.WaterTankCapacity }))), // DISABLED - old template structure
  // 'electrical-wiring-cost': dynamic(() => import('@/components/calculators/categories/real-estate/MoreExtendedRealEstateCalculators').then(m => ({ default: m.ElectricalWiringCost }))), // DISABLED - old template structure

  // Even More Extended Real Estate
  // 'plumbing-cost-calculator': dynamic(() => import('@/components/calculators/categories/real-estate/EvenMoreExtendedRealEstateCalculators').then(m => ({ default: m.PlumbingCostCalculator }))), // DISABLED - old template structure
  // 'bathroom-renovation-cost': dynamic(() => import('@/components/calculators/categories/real-estate/EvenMoreExtendedRealEstateCalculators').then(m => ({ default: m.BathroomRenovationCost }))), // DISABLED - old template structure
  // 'staircase-calculator': dynamic(() => import('@/components/calculators/categories/real-estate/EvenMoreExtendedRealEstateCalculators').then(m => ({ default: m.StaircaseCalculator }))), // DISABLED - old template structure
  // 'septic-tank-size': dynamic(() => import('@/components/calculators/categories/real-estate/EvenMoreExtendedRealEstateCalculators').then(m => ({ default: m.SepticTankSize }))), // DISABLED - old template structure
  // 'rainwater-harvesting': dynamic(() => import('@/components/calculators/categories/real-estate/EvenMoreExtendedRealEstateCalculators').then(m => ({ default: m.RainwaterHarvesting }))), // DISABLED - old template structure
  // 'fence-cost-calculator': dynamic(() => import('@/components/calculators/categories/real-estate/EvenMoreExtendedRealEstateCalculators').then(m => ({ default: m.FenceCostCalculator }))), // DISABLED - old template structure
  // 'driveway-cost-calculator': dynamic(() => import('@/components/calculators/categories/real-estate/EvenMoreExtendedRealEstateCalculators').then(m => ({ default: m.DrivewayCostCalculator }))), // DISABLED - old template structure
  // 'pool-cost-calculator': dynamic(() => import('@/components/calculators/categories/real-estate/EvenMoreExtendedRealEstateCalculators').then(m => ({ default: m.PoolCostCalculator }))), // DISABLED - old template structure

  // Extended Real Estate
  // 'construction-cost': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.ConstructionCostCalculator }))), // DISABLED - old template structure
  // 'land-area-converter': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.LandAreaConverter }))), // DISABLED - old template structure
  // 'property-capital-gains': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.PropertyCapitalGains }))), // DISABLED - old template structure
  // 'property-tax': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.PropertyTaxCalculator }))), // DISABLED - old template structure
  // 'pre-emi-calculator': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.PreEMICalculator }))), // DISABLED - old template structure
  // 'plot-loan': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.PlotLoanCalculator }))), // DISABLED - old template structure
  // 'interior-design-cost': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.InteriorDesignCost }))), // DISABLED - old template structure
  // 'down-payment-goal': dynamic(() => import('@/components/calculators/categories/real-estate/ExtendedRealEstateCalculators').then(m => ({ default: m.DownPaymentGoal }))), // DISABLED - old template structure

  // Extended Retirement
  // 'epf-calculator': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.EPFCalculator }))), // DISABLED - old template structure
  // 'vpf-calculator': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.VPFCalculator }))), // DISABLED - old template structure
  // 'inflation-pension': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.InflationPensionCalculator }))), // DISABLED - old template structure
  // 'superannuation-calculator': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.SuperannuationCalculator }))), // DISABLED - old template structure
  // 'post-retirement-budget': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.PostRetirementBudget }))), // DISABLED - old template structure
  // 'swp-tax-calculator': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.SWPTaxCalculator }))), // DISABLED - old template structure
  // 'nps-tier2': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.NPSTier2Calculator }))), // DISABLED - old template structure
  // 'retirement-shortfall': dynamic(() => import('@/components/calculators/categories/retirement/ExtendedRetirementCalculators').then(m => ({ default: m.RetirementShortfall }))), // DISABLED - old template structure

  // Extended Credit Card
  'cc-interest': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.CreditCardInterestCalculator }))),
  'min-payment-warning': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.MinimumPaymentWarning }))),
  'credit-utilization': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.CreditUtilizationCalculator }))),
  'reward-points': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.RewardPointsCalculator }))),
  'forex-fee': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.ForeignTransactionFeeCalculator }))),
  'cash-advance-fee': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.CashAdvanceFeeCalculator }))),
  'card-vs-loan': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.CardVsLoanCalculator }))),
  'annual-fee-breakeven': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.AnnualFeeBreakeven }))),
  'debt-snowball': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.DebtSnowballCalculator }))),
  'debt-avalanche': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.DebtAvalancheCalculator }))),
  'late-payment-fee': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.LatePaymentFeeCalculator }))),
  'over-limit-fee': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.OverLimitFeeCalculator }))),
  'cc-eligibility': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.CreditCardEligibility }))),
  'fuel-surcharge-waiver': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.FuelSurchargeWaiver }))),
  'airport-lounge-value': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.AirportLoungeValue }))),
  'cashback-calculator': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.AnnualCashbackCalculator }))),
  'miles-to-cash': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.MilesToCashConverter }))),
  'cc-against-fd': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.CreditCardAgainstFD }))),
  'forex-markup': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.ForeignCurrencyMarkup }))),
  'billing-cycle': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.BillingCycleCalculator }))),
  'limit-increase': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.CreditLimitIncreaseCalculator }))),
  'card-upgrade': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.CardUpgradeCalculator }))),
  'cash-withdrawal-cost': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.CashWithdrawalCostCalculator }))),
  'cc-insurance-cost': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.CreditCardInsuranceCalculator }))),
  'addon-card-limit': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.AddonCardLimitSetter }))),
  'min-due-trap': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.MinimumDueTrapWarning }))),
  'no-cost-emi': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.NoCostEMIRealCost }))),
  'annual-fee-waiver': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.AnnualFeeWaiverTracker }))),
  // 'cc-interest': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.CreditCardInterestCalculator }))), // DISABLED - old template structure
  // 'min-payment-warning': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.MinimumPaymentWarning }))), // DISABLED - old template structure
  // 'balance-transfer': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.BalanceTransferCalculator }))), // DISABLED - old template structure
  // 'credit-utilization': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.CreditUtilizationCalculator }))), // DISABLED - old template structure
  // 'reward-points': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.RewardPointsCalculator }))), // DISABLED - old template structure
  // 'forex-fee': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.ForeignTransactionFeeCalculator }))), // DISABLED - old template structure
  // 'cash-advance-fee': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.CashAdvanceFeeCalculator }))), // DISABLED - old template structure
  // 'card-vs-loan': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.CardVsLoanCalculator }))), // DISABLED - old template structure
  // 'annual-fee-breakeven': dynamic(() => import('@/components/calculators/categories/credit-card/ExtendedCreditCardCalculators').then(m => ({ default: m.AnnualFeeBreakeven }))), // DISABLED - old template structure

  // Extended Loan
  'loan-affordability': dynamic(() => import('@/components/calculators/categories/loan/LoanAffordability').then(m => ({ default: m.LoanAffordability }))),
  'step-up-emi': dynamic(() => import('@/components/calculators/categories/loan/StepUpEMI').then(m => ({ default: m.StepUpEMI }))),
  'balloon-payment': dynamic(() => import('@/components/calculators/categories/loan/BalloonPayment').then(m => ({ default: m.BalloonPayment }))),
  'od-interest': dynamic(() => import('@/components/calculators/categories/loan/OverdraftInterest').then(m => ({ default: m.OverdraftInterest }))),
  'loan-settlement': dynamic(() => import('@/components/calculators/categories/loan/LoanSettlement').then(m => ({ default: m.LoanSettlement }))),

  // More Extended Loan
  'loan-restructuring': dynamic(() => import('@/components/calculators/categories/loan/ExtendedLoanCalculators').then(m => ({ default: m.LoanRestructuringCalculator }))),
  'loan-default-penalty': dynamic(() => import('@/components/calculators/categories/loan/ExtendedLoanCalculators').then(m => ({ default: m.LoanDefaultPenalty }))),
  'guarantor-liability': dynamic(() => import('@/components/calculators/categories/loan/ExtendedLoanCalculators').then(m => ({ default: m.GuarantorLiability }))),
  'loan-against-property': dynamic(() => import('@/components/calculators/categories/loan/ExtendedLoanCalculators').then(m => ({ default: m.LoanAgainstProperty }))),
  'car-lease-vs-buy': dynamic(() => import('@/components/calculators/categories/loan/ExtendedLoanCalculators').then(m => ({ default: m.CarLeaseVsBuy }))),
  'zero-cost-emi': dynamic(() => import('@/components/calculators/categories/loan/ExtendedLoanCalculators').then(m => ({ default: m.ZeroCostEMICalculator }))),
  'payday-loan-apr': dynamic(() => import('@/components/calculators/categories/loan/ExtendedLoanCalculators').then(m => ({ default: m.PaydayLoanAPR }))),
  'microfinance-loan': dynamic(() => import('@/components/calculators/categories/loan/ExtendedLoanCalculators').then(m => ({ default: m.MicrofinanceLoan }))),
  'education-loan-tax': dynamic(() => import('@/components/calculators/categories/loan/ExtendedLoanCalculators').then(m => ({ default: m.EducationLoanTaxBenefit }))),
  'mudra-loan': dynamic(() => import('@/components/calculators/categories/loan/ExtendedLoanCalculators').then(m => ({ default: m.MudraLoanCalculator }))),

  // Extended Investment
  'rule-of-72': dynamic(() => import('@/components/calculators/categories/investment/ExtendedInvestmentCalculators').then(m => ({ default: m.RuleOf72Calculator }))),
  'real-rate-return': dynamic(() => import('@/components/calculators/categories/investment/ExtendedInvestmentCalculators').then(m => ({ default: m.RealRateReturnCalculator }))),
  'cost-of-delay': dynamic(() => import('@/components/calculators/categories/investment/ExtendedInvestmentCalculators').then(m => ({ default: m.CostOfDelayCalculator }))),
  'asset-allocation': dynamic(() => import('@/components/calculators/categories/investment/ExtendedInvestmentCalculators').then(m => ({ default: m.AssetAllocationCalculator }))),
  'npv-calculator': dynamic(() => import('@/components/calculators/categories/investment/ExtendedInvestmentCalculators').then(m => ({ default: m.NPVCalculator }))),
  'sharpe-ratio': dynamic(() => import('@/components/calculators/categories/investment/ExtendedInvestmentCalculators').then(m => ({ default: m.SharpeRatioCalculator }))),
  'treynor-ratio': dynamic(() => import('@/components/calculators/categories/investment/ExtendedInvestmentCalculators').then(m => ({ default: m.TreynorRatioCalculator }))),
  'alpha-calculator': dynamic(() => import('@/components/calculators/categories/investment/ExtendedInvestmentCalculators').then(m => ({ default: m.AlphaCalculator }))),
  'beta-calculator': dynamic(() => import('@/components/calculators/categories/investment/ExtendedInvestmentCalculators').then(m => ({ default: m.BetaCalculator }))),
  'sip-delay-cost': dynamic(() => import('@/components/calculators/categories/investment/ExtendedInvestmentCalculators').then(m => ({ default: m.SIPDelayCostCalculator }))),
  'lumpsum-vs-sip': dynamic(() => import('@/components/calculators/categories/investment/ExtendedInvestmentCalculators').then(m => ({ default: m.LumpsumVsSIPCalculator }))),
  'stp-calculator': dynamic(() => import('@/components/calculators/categories/investment/ExtendedInvestmentCalculators').then(m => ({ default: m.STPCalculator }))),
  'dividend-reinvestment': dynamic(() => import('@/components/calculators/categories/investment/ExtendedInvestmentCalculators').then(m => ({ default: m.DividendReinvestmentCalculator }))),
  'rights-issue': dynamic(() => import('@/components/calculators/categories/investment/ExtendedInvestmentCalculators').then(m => ({ default: m.RightsIssueCalculator }))),
  'sovereign-gold-bond': dynamic(() => import('@/components/calculators/categories/investment/ExtendedInvestmentCalculators').then(m => ({ default: m.SovereignGoldBondCalculator }))),
  'nps-tier-1-calculator': dynamic(() => import('@/components/calculators/categories/investment/ExtendedInvestmentCalculators').then(m => ({ default: m.NPSTier1Calculator }))),
  'elss-calculator': dynamic(() => import('@/components/calculators/categories/investment/ExtendedInvestmentCalculators').then(m => ({ default: m.ELSSCalculator }))),
  'index-fund-returns': dynamic(() => import('@/components/calculators/categories/investment/ExtendedInvestmentCalculators').then(m => ({ default: m.IndexFundReturnsCalculator }))),
  'debt-fund-returns': dynamic(() => import('@/components/calculators/categories/investment/ExtendedInvestmentCalculators').then(m => ({ default: m.DebtFundReturnsCalculator }))),
  'hybrid-fund-calculator': dynamic(() => import('@/components/calculators/categories/investment/ExtendedInvestmentCalculators').then(m => ({ default: m.HybridFundCalculator }))),
  'ulip-calculator': dynamic(() => import('@/components/calculators/categories/investment/ExtendedInvestmentCalculators').then(m => ({ default: m.ULIPCalculator }))),
  'etf-returns': dynamic(() => import('@/components/calculators/categories/investment/ExtendedInvestmentCalculators').then(m => ({ default: m.ETFReturnsCalculator }))),
  'portfolio-rebalancing': dynamic(() => import('@/components/calculators/categories/investment/ExtendedInvestmentCalculators').then(m => ({ default: m.PortfolioRebalancingCalculator }))),
  'emergency-fund-calculator': dynamic(() => import('@/components/calculators/categories/investment/ExtendedInvestmentCalculators').then(m => ({ default: m.EmergencyFundCalculator }))),
  'goal-based-investment': dynamic(() => import('@/components/calculators/categories/investment/ExtendedInvestmentCalculators').then(m => ({ default: m.GoalBasedInvestmentCalculator }))),

  // More Extended Loan
  // 'loan-restructuring': dynamic(() => import('@/components/calculators/categories/loan/MoreExtendedLoanCalculators').then(m => ({ default: m.LoanRestructuringCalculator }))), // DISABLED - old template structure
  // 'loan-default-penalty': dynamic(() => import('@/components/calculators/categories/loan/MoreExtendedLoanCalculators').then(m => ({ default: m.LoanDefaultPenalty }))), // DISABLED - old template structure
  // 'guarantor-liability': dynamic(() => import('@/components/calculators/categories/loan/MoreExtendedLoanCalculators').then(m => ({ default: m.GuarantorLiability }))), // DISABLED - old template structure
  // 'loan-against-property': dynamic(() => import('@/components/calculators/categories/loan/MoreExtendedLoanCalculators').then(m => ({ default: m.LoanAgainstProperty }))), // DISABLED - old template structure
  // 'car-lease-vs-buy': dynamic(() => import('@/components/calculators/categories/loan/MoreExtendedLoanCalculators').then(m => ({ default: m.CarLeaseVsBuy }))), // DISABLED - old template structure
  // 'zero-cost-emi': dynamic(() => import('@/components/calculators/categories/loan/MoreExtendedLoanCalculators').then(m => ({ default: m.ZeroCostEMICalculator }))), // DISABLED - old template structure
  // 'payday-loan-apr': dynamic(() => import('@/components/calculators/categories/loan/MoreExtendedLoanCalculators').then(m => ({ default: m.PaydayLoanAPR }))), // DISABLED - old template structure
  // 'microfinance-loan': dynamic(() => import('@/components/calculators/categories/loan/MoreExtendedLoanCalculators').then(m => ({ default: m.MicrofinanceLoan }))), // DISABLED - old template structure
  // 'education-loan-tax': dynamic(() => import('@/components/calculators/categories/loan/MoreExtendedLoanCalculators').then(m => ({ default: m.EducationLoanTaxBenefit }))), // DISABLED - old template structure
  // 'mudra-loan': dynamic(() => import('@/components/calculators/categories/loan/MoreExtendedLoanCalculators').then(m => ({ default: m.MudraLoanCalculator }))), // DISABLED - old template structure

  // More Extended Investment
  // 'sharpe-ratio': dynamic(() => import('@/components/calculators/categories/investment/MoreExtendedInvestmentCalculators').then(m => ({ default: m.SharpeRatioCalculator }))), // DISABLED - old template structure
  // 'treynor-ratio': dynamic(() => import('@/components/calculators/categories/investment/MoreExtendedInvestmentCalculators').then(m => ({ default: m.TreynorRatioCalculator }))), // DISABLED - old template structure
  // 'alpha-calculator': dynamic(() => import('@/components/calculators/categories/investment/MoreExtendedInvestmentCalculators').then(m => ({ default: m.AlphaCalculator }))), // DISABLED - old template structure
  // 'beta-calculator': dynamic(() => import('@/components/calculators/categories/investment/MoreExtendedInvestmentCalculators').then(m => ({ default: m.BetaCalculator }))), // DISABLED - old template structure

  // More Extended Credit Card
  // 'debt-snowball': dynamic(() => import('@/components/calculators/categories/credit-card/MoreExtendedCreditCardCalculators').then(m => ({ default: m.DebtSnowballCalculator }))), // DISABLED - old template structure
  // 'debt-avalanche': dynamic(() => import('@/components/calculators/categories/credit-card/MoreExtendedCreditCardCalculators').then(m => ({ default: m.DebtAvalancheCalculator }))), // DISABLED - old template structure
  // 'late-payment-fee': dynamic(() => import('@/components/calculators/categories/credit-card/MoreExtendedCreditCardCalculators').then(m => ({ default: m.LatePaymentFeeCalculator }))), // DISABLED - old template structure
  // 'over-limit-fee': dynamic(() => import('@/components/calculators/categories/credit-card/MoreExtendedCreditCardCalculators').then(m => ({ default: m.OverLimitFeeCalculator }))), // DISABLED - old template structure
  // 'cc-eligibility': dynamic(() => import('@/components/calculators/categories/credit-card/MoreExtendedCreditCardCalculators').then(m => ({ default: m.CreditCardEligibility }))), // DISABLED - old template structure
  // 'fuel-surcharge-waiver': dynamic(() => import('@/components/calculators/categories/credit-card/MoreExtendedCreditCardCalculators').then(m => ({ default: m.FuelSurchargeWaiver }))), // DISABLED - old template structure
  // 'airport-lounge-value': dynamic(() => import('@/components/calculators/categories/credit-card/MoreExtendedCreditCardCalculators').then(m => ({ default: m.AirportLoungeValue }))), // DISABLED - old template structure
  // 'cashback-calculator': dynamic(() => import('@/components/calculators/categories/credit-card/MoreExtendedCreditCardCalculators').then(m => ({ default: m.CashbackCalculator }))), // DISABLED - old template structure
  // 'miles-to-cash': dynamic(() => import('@/components/calculators/categories/credit-card/MoreExtendedCreditCardCalculators').then(m => ({ default: m.MilesToCashConverter }))), // DISABLED - old template structure
  // 'cc-against-fd': dynamic(() => import('@/components/calculators/categories/credit-card/MoreExtendedCreditCardCalculators').then(m => ({ default: m.CreditCardAgainstFD }))), // DISABLED - old template structure
  // 'forex-markup': dynamic(() => import('@/components/calculators/categories/credit-card/MoreExtendedCreditCardCalculators').then(m => ({ default: m.ForeignCurrencyMarkup }))), // DISABLED - old template structure
  // 'billing-cycle': dynamic(() => import('@/components/calculators/categories/credit-card/MoreExtendedCreditCardCalculators').then(m => ({ default: m.BillingCycleCalculator }))), // DISABLED - old template structure

  // Even More Extended Credit Card
  // 'limit-increase': dynamic(() => import('@/components/calculators/categories/credit-card/EvenMoreExtendedCreditCardCalculators').then(m => ({ default: m.CreditLimitIncreaseCalculator }))), // DISABLED - old template structure
  // 'card-upgrade': dynamic(() => import('@/components/calculators/categories/credit-card/EvenMoreExtendedCreditCardCalculators').then(m => ({ default: m.CardUpgradeCalculator }))), // DISABLED - old template structure
  // 'cash-withdrawal-cost': dynamic(() => import('@/components/calculators/categories/credit-card/EvenMoreExtendedCreditCardCalculators').then(m => ({ default: m.CashWithdrawalCostCalculator }))), // DISABLED - old template structure
  // 'cc-insurance-cost': dynamic(() => import('@/components/calculators/categories/credit-card/EvenMoreExtendedCreditCardCalculators').then(m => ({ default: m.CreditCardInsuranceCalculator }))), // DISABLED - old template structure
  // 'addon-card-limit': dynamic(() => import('@/components/calculators/categories/credit-card/EvenMoreExtendedCreditCardCalculators').then(m => ({ default: m.AddOnCardLimitCalculator }))), // DISABLED - old template structure
  // 'min-due-trap': dynamic(() => import('@/components/calculators/categories/credit-card/EvenMoreExtendedCreditCardCalculators').then(m => ({ default: m.MinimumDueWarningCalculator }))), // DISABLED - old template structure
  // 'no-cost-emi': dynamic(() => import('@/components/calculators/categories/credit-card/EvenMoreExtendedCreditCardCalculators').then(m => ({ default: m.NoCostEmiDiscountCalculator }))), // DISABLED - old template structure
  // 'annual-fee-waiver': dynamic(() => import('@/components/calculators/categories/credit-card/EvenMoreExtendedCreditCardCalculators').then(m => ({ default: m.AnnualFeeWaiverCalculator }))), // DISABLED - old template structure

  // More Extended Retirement
  // 'fire-calculator-pro': dynamic(() => import('@/components/calculators/categories/retirement/MoreExtendedRetirementCalculators').then(m => ({ default: m.EarlyRetirementCalculator }))), // DISABLED - old template structure
  // 'gratuity-retirement': dynamic(() => import('@/components/calculators/categories/retirement/MoreExtendedRetirementCalculators').then(m => ({ default: m.GratuityCalculator }))), // DISABLED - old template structure
  // 'leave-encashment-retirement': dynamic(() => import('@/components/calculators/categories/retirement/MoreExtendedRetirementCalculators').then(m => ({ default: m.LeaveEncashmentCalculator }))), // DISABLED - old template structure
  // 'vrs-retirement': dynamic(() => import('@/components/calculators/categories/retirement/MoreExtendedRetirementCalculators').then(m => ({ default: m.VRSCompensationCalculator }))), // DISABLED - old template structure
  // 'scss-retirement': dynamic(() => import('@/components/calculators/categories/retirement/MoreExtendedRetirementCalculators').then(m => ({ default: m.SeniorCitizenSavingsScheme }))), // DISABLED - old template structure
  // 'pmvvy-scheme': dynamic(() => import('@/components/calculators/categories/retirement/MoreExtendedRetirementCalculators').then(m => ({ default: m.PMVVYCalculator }))), // DISABLED - old template structure
  // 'reverse-mortgage': dynamic(() => import('@/components/calculators/categories/retirement/MoreExtendedRetirementCalculators').then(m => ({ default: m.ReverseMortgageCalculator }))), // DISABLED - old template structure
  // 'medical-inflation': dynamic(() => import('@/components/calculators/categories/retirement/MoreExtendedRetirementCalculators').then(m => ({ default: m.MedicalInflationCalculator }))), // DISABLED - old template structure
  // 'bucket-strategy': dynamic(() => import('@/components/calculators/categories/retirement/MoreExtendedRetirementCalculators').then(m => ({ default: m.RetirementBucketStrategy }))), // DISABLED - old template structure
  // 'annuity-yield': dynamic(() => import('@/components/calculators/categories/retirement/MoreExtendedRetirementCalculators').then(m => ({ default: m.AnnuityYieldCalculator }))), // DISABLED - old template structure

  // Even More Extended Retirement
  // 'life-expectancy': dynamic(() => import('@/components/calculators/categories/retirement/EvenMoreExtendedRetirementCalculators').then(m => ({ default: m.LifeExpectancyCalculator }))), // DISABLED - old template structure
  // 'travel-fund': dynamic(() => import('@/components/calculators/categories/retirement/EvenMoreExtendedRetirementCalculators').then(m => ({ default: m.RetirementTravelBudget }))), // DISABLED - old template structure
  // 'legacy-planner': dynamic(() => import('@/components/calculators/categories/retirement/EvenMoreExtendedRetirementCalculators').then(m => ({ default: m.LegacyPlanningCalculator }))), // DISABLED - old template structure
  // 'care-cost': dynamic(() => import('@/components/calculators/categories/retirement/EvenMoreExtendedRetirementCalculators').then(m => ({ default: m.LongTermCareCost }))), // DISABLED - old template structure
  // 'pension-tax': dynamic(() => import('@/components/calculators/categories/retirement/EvenMoreExtendedRetirementCalculators').then(m => ({ default: m.PensionTaxCalculator }))), // DISABLED - old template structure
  // 'eps-pension': dynamic(() => import('@/components/calculators/categories/retirement/EvenMoreExtendedRetirementCalculators').then(m => ({ default: m.EPFPensionCalculator }))), // DISABLED - old template structure
  // 'health-premium-projector': dynamic(() => import('@/components/calculators/categories/retirement/EvenMoreExtendedRetirementCalculators').then(m => ({ default: m.RetirementHealthInsurance }))), // DISABLED - old template structure
  // 'sip-delay-cost': dynamic(() => import('@/components/calculators/categories/investment/MoreExtendedInvestmentCalculators').then(m => ({ default: m.SIPDelayCost }))), // DISABLED - old template structure
  // 'lumpsum-vs-sip': dynamic(() => import('@/components/calculators/categories/investment/MoreExtendedInvestmentCalculators').then(m => ({ default: m.LumpsumVsSIP }))), // DISABLED - old template structure
  // 'stp-calculator': dynamic(() => import('@/components/calculators/categories/investment/MoreExtendedInvestmentCalculators').then(m => ({ default: m.STPCalculator }))), // DISABLED - old template structure
  // 'dividend-reinvestment': dynamic(() => import('@/components/calculators/categories/investment/MoreExtendedInvestmentCalculators').then(m => ({ default: m.DividendReinvestment }))), // DISABLED - old template structure
  // 'rights-issue': dynamic(() => import('@/components/calculators/categories/investment/MoreExtendedInvestmentCalculators').then(m => ({ default: m.RightsIssueValue }))), // DISABLED - old template structure

  // Extended Tax
  // '80c-calculator': dynamic(() => import('@/components/calculators/categories/tax/ExtendedTaxCalculators').then(m => ({ default: m.Section80CCalculator }))), // DISABLED - old template structure
  // '80d-calculator': dynamic(() => import('@/components/calculators/categories/tax/ExtendedTaxCalculators').then(m => ({ default: m.Section80DCalculator }))), // DISABLED - old template structure
  // '80g-calculator': dynamic(() => import('@/components/calculators/categories/tax/ExtendedTaxCalculators').then(m => ({ default: m.Section80GCalculator }))), // DISABLED - old template structure
  // '80tta-calculator': dynamic(() => import('@/components/calculators/categories/tax/ExtendedTaxCalculators').then(m => ({ default: m.Section80TTACalculator }))), // DISABLED - old template structure
  // 'capital-gains-indexation': dynamic(() => import('@/components/calculators/categories/tax/ExtendedTaxCalculators').then(m => ({ default: m.CapitalGainsIndexation }))), // DISABLED - old template structure
  // 'crypto-tax': dynamic(() => import('@/components/calculators/categories/tax/ExtendedTaxCalculators').then(m => ({ default: m.CryptoTaxCalculator }))), // DISABLED - old template structure
  // 'lottery-tax': dynamic(() => import('@/components/calculators/categories/tax/ExtendedTaxCalculators').then(m => ({ default: m.LotteryTaxCalculator }))), // DISABLED - old template structure
  // 'gift-tax': dynamic(() => import('@/components/calculators/categories/tax/ExtendedTaxCalculators').then(m => ({ default: m.GiftTaxCalculator }))), // DISABLED - old template structure
  // 'rental-income-tax': dynamic(() => import('@/components/calculators/categories/tax/ExtendedTaxCalculators').then(m => ({ default: m.RentalIncomeTax }))), // DISABLED - old template structure
  // 'presumptive-tax': dynamic(() => import('@/components/calculators/categories/tax/ExtendedTaxCalculators').then(m => ({ default: m.PresumptiveTaxCalculator }))), // DISABLED - old template structure
  // 'advance-tax': dynamic(() => import('@/components/calculators/categories/tax/ExtendedTaxCalculators').then(m => ({ default: m.AdvanceTaxCalculator }))), // DISABLED - old template structure
  // 'surcharge-calculator': dynamic(() => import('@/components/calculators/categories/tax/ExtendedTaxCalculators').then(m => ({ default: m.SurchargeCalculator }))), // DISABLED - old template structure
  // 'marginal-relief': dynamic(() => import('@/components/calculators/categories/tax/ExtendedTaxCalculators').then(m => ({ default: m.MarginalReliefCalculator }))), // DISABLED - old template structure
  // '87a-rebate': dynamic(() => import('@/components/calculators/categories/tax/ExtendedTaxCalculators').then(m => ({ default: m.Section87ARebate }))), // DISABLED - old template structure
  // 'agri-income-tax': dynamic(() => import('@/components/calculators/categories/tax/ExtendedTaxCalculators').then(m => ({ default: m.AgriculturalIncomeTax }))), // DISABLED - old template structure

  // Extended Banking
  'locker-rent-calculator': dynamic(() => import('@/components/calculators/categories/banking/ExtendedBankingCalculators').then(m => ({ default: m.LockerRentCalculator }))),
  'dd-charges-calculator': dynamic(() => import('@/components/calculators/categories/banking/ExtendedBankingCalculators').then(m => ({ default: m.DDChargesCalculator }))),
  'neft-rtgs-charges': dynamic(() => import('@/components/calculators/categories/banking/ExtendedBankingCalculators').then(m => ({ default: m.NEFTRTGSChargesCalculator }))),
  'amb-calculator': dynamic(() => import('@/components/calculators/categories/banking/ExtendedBankingCalculators').then(m => ({ default: m.AMBCalculator }))),
  'cash-deposit-charges': dynamic(() => import('@/components/calculators/categories/banking/ExtendedBankingCalculators').then(m => ({ default: m.CashDepositChargesCalculator }))),
  'cheque-bounce-penalty': dynamic(() => import('@/components/calculators/categories/banking/ExtendedBankingCalculators').then(m => ({ default: m.ChequeBouncePenaltyCalculator }))),
  'auto-sweep-calculator': dynamic(() => import('@/components/calculators/categories/banking/ExtendedBankingCalculators').then(m => ({ default: m.AutoSweepCalculator }))),
  'fd-premature-penalty': dynamic(() => import('@/components/calculators/categories/banking/ExtendedBankingCalculators').then(m => ({ default: m.FDPrematurePenaltyCalculator }))),
  'rd-delay-penalty': dynamic(() => import('@/components/calculators/categories/banking/ExtendedBankingCalculators').then(m => ({ default: m.RDDelayPenaltyCalculator }))),
  'senior-citizen-fd-extra': dynamic(() => import('@/components/calculators/categories/banking/ExtendedBankingCalculators').then(m => ({ default: m.SeniorCitizenFDExtraCalculator }))),
  'effective-yield-calculator': dynamic(() => import('@/components/calculators/categories/banking/ExtendedBankingCalculators').then(m => ({ default: m.EffectiveYieldCalculator }))),
  'cash-denomination-counter': dynamic(() => import('@/components/calculators/categories/banking/ExtendedBankingCalculators').then(m => ({ default: m.CashDenominationCounter }))),
  'simple-vs-compound': dynamic(() => import('@/components/calculators/categories/banking/ExtendedBankingCalculators').then(m => ({ default: m.SimpleVsCompoundCalculator }))),
  'rule-of-72-banking': dynamic(() => import('@/components/calculators/categories/banking/ExtendedBankingCalculators').then(m => ({ default: m.RuleOf72Banking }))),
  'debit-card-emi': dynamic(() => import('@/components/calculators/categories/banking/ExtendedBankingCalculators').then(m => ({ default: m.DebitCardEMICalculator }))),
  'sweep-in-calculator': dynamic(() => import('@/components/calculators/categories/banking/ExtendedBankingCalculators').then(m => ({ default: m.SweepInCalculator }))),
  'fd-ladder-calculator': dynamic(() => import('@/components/calculators/categories/banking/ExtendedBankingCalculators').then(m => ({ default: m.FDLadderCalculator }))),
  'foreign-currency-account': dynamic(() => import('@/components/calculators/categories/banking/ExtendedBankingCalculators').then(m => ({ default: m.ForeignCurrencyAccountCalculator }))),
  'tax-saving-fd': dynamic(() => import('@/components/calculators/categories/banking/ExtendedBankingCalculators').then(m => ({ default: m.TaxSavingFDCalculator }))),
  'cumulative-vs-non-cumulative': dynamic(() => import('@/components/calculators/categories/banking/ExtendedBankingCalculators').then(m => ({ default: m.CumulativeVsNonCumulativeCalculator }))),
  'bank-fd-vs-post-office': dynamic(() => import('@/components/calculators/categories/banking/ExtendedBankingCalculators').then(m => ({ default: m.BankFDVsPostOfficeCalculator }))),
  'quarterly-interest-calculator': dynamic(() => import('@/components/calculators/categories/banking/ExtendedBankingCalculators').then(m => ({ default: m.QuarterlyInterestCalculator }))),
  'monthly-interest-calculator': dynamic(() => import('@/components/calculators/categories/banking/ExtendedBankingCalculators').then(m => ({ default: m.MonthlyInterestCalculator }))),
  'annual-interest-calculator': dynamic(() => import('@/components/calculators/categories/banking/ExtendedBankingCalculators').then(m => ({ default: m.AnnualInterestCalculator }))),
  'overdraft-protection-cost': dynamic(() => import('@/components/calculators/categories/banking/ExtendedBankingCalculators').then(m => ({ default: m.OverdraftProtectionCostCalculator }))),
  'multi-currency-account': dynamic(() => import('@/components/calculators/categories/banking/ExtendedBankingCalculators').then(m => ({ default: m.MultiCurrencyAccountCalculator }))),

  // Misc
  'unit-converter': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.UnitConverter }))),
  'temperature-converter': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.TemperatureConverter }))),
  'electricity-bill-calculator': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.ElectricityBillCalculator }))),
  'data-usage-calculator': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.DataUsageCalculator }))),
  'download-time-calculator': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.DownloadTimeCalculator }))),
  'password-strength-calculator': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.PasswordStrengthCalculator }))),
  'aspect-ratio-calculator': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.AspectRatioCalculator }))),
  'pixels-to-rem-calculator': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.PixelsToRemCalculator }))),
  'golden-ratio-calculator': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.GoldenRatioCalculator }))),
  'age-difference-calculator': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.AgeDifferenceCalculator }))),
  'love-calculator': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.LoveCalculator }))),
  'grade-calculator': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.GradeCalculator }))),
  'gpa-calculator': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.GPACalculator }))),
  'speed-converter': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.SpeedConverter }))),
  'volume-converter': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.VolumeConverter }))),
  'area-converter': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.AreaConverter }))),
  'time-converter': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.TimeConverter }))),
  'pressure-converter': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.PressureConverter }))),
  'power-converter': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.PowerConverter }))),
  'energy-converter': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.EnergyConverter }))),
  'data-storage-converter': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.DataStorageConverter }))),
  'cooking-converter': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.CookingConverter }))),
  'roman-numeral-converter': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.RomanNumeralConverter }))),
  // 'unit-converter': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.UnitConverter }))), // DISABLED - old template structure
  // 'temperature-converter': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.TemperatureConverter }))), // DISABLED - old template structure
  // 'bmi-calculator': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.BMICalculator }))), // DISABLED - old template structure
  // 'bmr-calculator': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.BMRCalculator }))), // DISABLED - old template structure
  // 'calorie-calculator': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.CalorieCalculator }))), // DISABLED - old template structure
  // 'water-intake-calculator': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.WaterIntakeCalculator }))), // DISABLED - old template structure
  // 'body-fat-calculator': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.BodyFatCalculator }))), // DISABLED - old template structure
  // 'ideal-weight-calculator': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.IdealWeightCalculator }))), // DISABLED - old template structure
  // 'pregnancy-due-date-calculator': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.PregnancyDueDateCalculator }))), // DISABLED - old template structure
  // 'sales-tax-calculator': dynamic(() => import('@/components/calculators/categories/misc/ExtendedMiscCalculators').then(m => ({ default: m.SalesTaxCalculator }))), // DISABLED - old template structure

  // 'electricity-bill-calculator': dynamic(() => import('@/components/calculators/categories/misc/MoreExtendedMiscCalculators').then(m => ({ default: m.ElectricityBillCalculator }))), // DISABLED - old template structure
  // 'data-usage-calculator': dynamic(() => import('@/components/calculators/categories/misc/MoreExtendedMiscCalculators').then(m => ({ default: m.DataUsageCalculator }))), // DISABLED - old template structure
  // 'download-time-calculator': dynamic(() => import('@/components/calculators/categories/misc/MoreExtendedMiscCalculators').then(m => ({ default: m.DownloadTimeCalculator }))), // DISABLED - old template structure
  // 'password-strength-calculator': dynamic(() => import('@/components/calculators/categories/misc/MoreExtendedMiscCalculators').then(m => ({ default: m.PasswordStrengthCalculator }))), // DISABLED - old template structure
  // 'aspect-ratio-calculator': dynamic(() => import('@/components/calculators/categories/misc/MoreExtendedMiscCalculators').then(m => ({ default: m.AspectRatioCalculator }))), // DISABLED - old template structure
  // 'pixels-to-rem-calculator': dynamic(() => import('@/components/calculators/categories/misc/MoreExtendedMiscCalculators').then(m => ({ default: m.PixelsToRemCalculator }))), // DISABLED - old template structure
  // 'golden-ratio-calculator': dynamic(() => import('@/components/calculators/categories/misc/MoreExtendedMiscCalculators').then(m => ({ default: m.GoldenRatioCalculator }))), // DISABLED - old template structure
  // 'time-duration-calculator': dynamic(() => import('@/components/calculators/categories/misc/MoreExtendedMiscCalculators').then(m => ({ default: m.TimeDurationCalculator }))), // DISABLED - old template structure
  // 'age-difference-calculator': dynamic(() => import('@/components/calculators/categories/misc/MoreExtendedMiscCalculators').then(m => ({ default: m.AgeDifferenceCalculator }))), // DISABLED - old template structure
  // 'zodiac-sign-calculator': dynamic(() => import('@/components/calculators/categories/misc/MoreExtendedMiscCalculators').then(m => ({ default: m.ZodiacSignCalculator }))), // DISABLED - old template structure
  // 'love-calculator': dynamic(() => import('@/components/calculators/categories/misc/MoreExtendedMiscCalculators').then(m => ({ default: m.LoveCalculator }))), // DISABLED - old template structure
  // 'grade-calculator': dynamic(() => import('@/components/calculators/categories/misc/MoreExtendedMiscCalculators').then(m => ({ default: m.GradeCalculator }))), // DISABLED - old template structure
  // 'gpa-calculator': dynamic(() => import('@/components/calculators/categories/misc/MoreExtendedMiscCalculators').then(m => ({ default: m.GPACalculator }))), // DISABLED - old template structure

  // 'speed-converter': dynamic(() => import('@/components/calculators/categories/misc/EvenMoreExtendedMiscCalculators').then(m => ({ default: m.SpeedConverter }))), // DISABLED - old template structure
  // 'volume-converter': dynamic(() => import('@/components/calculators/categories/misc/EvenMoreExtendedMiscCalculators').then(m => ({ default: m.VolumeConverter }))), // DISABLED - old template structure
  // 'area-converter': dynamic(() => import('@/components/calculators/categories/misc/EvenMoreExtendedMiscCalculators').then(m => ({ default: m.AreaConverter }))), // DISABLED - old template structure
  // 'time-converter': dynamic(() => import('@/components/calculators/categories/misc/EvenMoreExtendedMiscCalculators').then(m => ({ default: m.TimeConverter }))), // DISABLED - old template structure
  // 'pressure-converter': dynamic(() => import('@/components/calculators/categories/misc/EvenMoreExtendedMiscCalculators').then(m => ({ default: m.PressureConverter }))), // DISABLED - old template structure
  // 'power-converter': dynamic(() => import('@/components/calculators/categories/misc/EvenMoreExtendedMiscCalculators').then(m => ({ default: m.PowerConverter }))), // DISABLED - old template structure
  // 'energy-converter': dynamic(() => import('@/components/calculators/categories/misc/EvenMoreExtendedMiscCalculators').then(m => ({ default: m.EnergyConverter }))), // DISABLED - old template structure
  // 'data-storage-converter': dynamic(() => import('@/components/calculators/categories/misc/EvenMoreExtendedMiscCalculators').then(m => ({ default: m.DataStorageConverter }))), // DISABLED - old template structure
  // 'cooking-converter': dynamic(() => import('@/components/calculators/categories/misc/EvenMoreExtendedMiscCalculators').then(m => ({ default: m.CookingConverter }))), // DISABLED - old template structure
  // 'roman-numeral-converter': dynamic(() => import('@/components/calculators/categories/misc/EvenMoreExtendedMiscCalculators').then(m => ({ default: m.RomanNumeralConverter }))), // DISABLED - old template structure

  'xat-score-calculator': XATScoreCalculator,
  'customer-satisfaction': CustomerSatisfactionCalculator,
  'customer-satisfaction-pro': CustomerSatisfactionCalculator,

  // Advanced Math Calculators
  'decimal-calculator': AdvancedDecimalCalculator,
  'scientific-notation-calculator': AdvancedScientificNotationCalculator,
  'significant-figures-calculator': AdvancedSignificantFiguresCalculator,

  // --- Missing IDs (were in toolsData but not registered → caused 404) ---

  // Health aliases (generic fallbacks for IDs not covered by specific implementations)
  'pregnancy-week-tracker': genericHealthTool,
  // Note: conception-date-estimator, ovulation-tracker, sleep-cycle-optimizer, jet-lag-recovery
  // are now covered by specific implementations above (registered with real calculators)

  // Physics / Scientific
  'physics-scientific-notation': genericPhysicsTool,
  'physics-midpoint': genericPhysicsTool,
  'physics-matrix': genericPhysicsTool,
  'physics-determinant': genericPhysicsTool,
  'physics-vector': genericPhysicsTool,
  'physics-eigenvalue': genericPhysicsTool,
  'physics-complex-number': genericPhysicsTool,
  'electrical-power': genericPhysicsTool,
  'gibbs-energy-chemistry': genericPhysicsTool,
  'enthalpy-chemistry': genericPhysicsTool,
  'entropy-change-calculator': genericPhysicsTool,

  // Construction aliases
  'construction-area': genericConstructionTool,
  'construction-volume': genericConstructionTool,
  'transformer-sizing': genericConstructionTool,
  'ac-btu-calculator': genericConstructionTool,

  // Business aliases
  'business-discount': genericBusinessTool,
  'business-runway': genericBusinessTool,
  'business-freelance-tax': genericBusinessTool,
  'business-labor-cost': genericBusinessTool,
  'business-material-cost': genericBusinessTool,
  'inventory-turnover-ratio': genericBusinessTool,
  'ar-turnover-ratio': genericBusinessTool,
  'ap-turnover-ratio': genericBusinessTool,
  'business-dividend-yield': genericBusinessTool,
  'business-dividend-payout': genericBusinessTool,
  'business-sustainable-growth': genericBusinessTool,
  'inventory-efficiency': genericBusinessTool,
  'operational-asset-turnover': genericBusinessTool,

  // Everyday aliases
  'shopping-discount': genericEverydayTool,
  'travel-distance': genericEverydayTool,
  'home-room-size': genericEverydayTool,
  'home-paint': genericEverydayTool,
  'home-tile': genericEverydayTool,
  'home-wallpaper': genericEverydayTool,

  // Education aliases
  'percentage-to-grade': genericEducationTool,

  // DateTime aliases
  'time-duration-calculator': genericDateTimeTool,
  'fiscal-quarter': genericDateTimeTool,
  'sobriety-tracker': genericDateTimeTool,
  'smoke-free-tracker': genericDateTimeTool,
  'fitness-streak-tracker': genericDateTimeTool,

  // Technology aliases
  'password-entropy-calculator': genericTechnologyTool,
}

export const implementedCalculatorIds = new Set(Object.keys(calculatorComponents))
