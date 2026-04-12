#!/usr/bin/env python3
"""
Generate tool title/description translation keys for ALL tools.
Uses suffix-replacement (not word-by-word) for non-Latin scripts.
Provides complete subcategory translations for key languages.
"""
import json, re, os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCALES_DIR = os.path.join(BASE, 'src', 'locales')

def to_snake(s):
    return s.strip().lower().replace('-', '_').replace(' ', '_')

def extract_tools():
    ts_path = os.path.join(BASE, 'src', 'lib', 'toolsData.ts')
    with open(ts_path, 'r', encoding='utf-8') as f:
        ts = f.read()
    tools = []
    pattern = r"\{\s*id:\s*['\"]([^'\"]+)['\"],\s*title:\s*['\"]([^'\"]+)['\"],\s*description:\s*['\"]([^'\"]+)['\"]"
    for m in re.finditer(pattern, ts):
        tools.append({'id': m.group(1), 'title': m.group(2), 'desc': m.group(3)})
    print(f"From toolsData.ts: {len(tools)} tools")

    fr_path = os.path.join(BASE, 'financial-tools-report.json')
    with open(fr_path, 'r', encoding='utf-8') as f:
        fr = json.load(f)
    existing = {t['id'] for t in tools}
    added = 0
    for item in fr.get('basicImplemented', []) + fr.get('advancedImplemented', []):
        tid = item.get('id', '')
        if tid and tid not in existing:
            tools.append({'id': tid, 'title': item.get('title', tid), 'desc': (item.get('title', tid) + '.') if item.get('title') else 'Calculator.'})
            existing.add(tid)
            added += 1
    print(f"From financial-report: {added} more tools")
    print(f"Total: {len(tools)} tools")
    return tools

def extract_subcategories():
    ts_path = os.path.join(BASE, 'src', 'lib', 'toolsData.ts')
    with open(ts_path, 'r', encoding='utf-8') as f:
        ts = f.read()
    subcats = {}
    pattern = r"['\"]([a-z0-9_-]+)['\"]:\s*\{\s*name:\s*['\"]([^'\"]+)['\"]"
    skip = {'health','math','datetime','education','technology','construction','business','everyday','scientific','physics'}
    for m in re.finditer(pattern, ts):
        key, name = m.group(1), m.group(2)
        if key not in skip:
            subcats[key] = name

    fr_path = os.path.join(BASE, 'financial-tools-report.json')
    with open(fr_path, 'r', encoding='utf-8') as f:
        fr = json.load(f)
    for item in fr.get('basicImplemented', []) + fr.get('advancedImplemented', []):
        sk, sn = item.get('subcategoryKey', ''), item.get('subcategoryName', '')
        if sk and sn and sk not in subcats:
            subcats[sk] = sn
    print(f"Total subcategories: {len(subcats)}")
    return subcats

def categorize_tool(tool_id):
    tid = tool_id.lower()
    if any(x in tid for x in ['emi', 'loan', 'mortgage', 'amortization']):
        return 'loan'
    if any(x in tid for x in ['tax', 'gst', 'regime', 'tds', 'cess', 'hra', 'deduction', 'income-tax']):
        return 'tax'
    if any(x in tid for x in ['sip', 'cagr', 'roi', 'investment', 'mutual-fund', 'stock', 'dividend', 'portfolio', 'compound', 'simple-interest', 'fixed-deposit', 'fd-', 'rd-', 'ppf', 'nps', 'epf', 'elss', 'gold', 'bond', 'etf', 'nav', 'xirr', 'retirement', 'pension', 'annuity', 'lumpsum', 'swp', 'stp', 'currency', 'forex', 'pip']):
        return 'investment'
    if any(x in tid for x in ['bmi', 'bmr', 'body', 'calorie', 'health', 'fitness', 'weight', 'fat', 'protein', 'water-intake', 'macro', 'tdee', 'nutrition', 'glycemic', 'fiber', 'sugar', 'sodium', 'vitamin', 'iron', 'keto', 'heart', 'blood', 'pregnancy', 'ovulation', 'sleep', 'hydration']):
        return 'health'
    if any(x in tid for x in ['real-estate', 'property', 'rent', 'stamp', 'carpet', 'built-up']):
        return 'real_estate'
    if any(x in tid for x in ['date', 'time', 'age', 'day', 'week', 'month', 'year', 'clock', 'timezone', 'countdown']):
        return 'datetime'
    if any(x in tid for x in ['math', 'algebra', 'geometry', 'fraction', 'matrix', 'equation', 'trigonometry', 'logarithm', 'factorial', 'permutation', 'combination', 'probability', 'statistics', 'mean', 'median', 'derivative', 'integral', 'prime', 'gcd', 'lcm', 'fibonacci', 'binary', 'hex', 'octal']):
        return 'math'
    if any(x in tid for x in ['business', 'profit', 'margin', 'break-even', 'revenue', 'cost', 'markup', 'discount', 'salary', 'wage', 'payroll', 'commission', 'tip', 'gratuity', 'bonus']):
        return 'business'
    if any(x in tid for x in ['physics', 'velocity', 'acceleration', 'force', 'energy', 'power', 'momentum', 'wave', 'frequency', 'ohm', 'resistance', 'capacitor', 'voltage', 'current', 'density']):
        return 'physics'
    if any(x in tid for x in ['chemistry', 'mole', 'periodic', 'solution', 'molarity', 'ph']):
        return 'scientific'
    if any(x in tid for x in ['gpa', 'grade', 'cgpa', 'scholarship', 'student', 'exam', 'score']):
        return 'education'
    if any(x in tid for x in ['data', 'bandwidth', 'storage', 'download', 'upload', 'pixel', 'resolution', 'color', 'ip', 'subnet', 'password', 'hash', 'encoding']):
        return 'technology'
    if any(x in tid for x in ['area', 'concrete', 'brick', 'tile', 'paint', 'roof', 'floor', 'wall', 'beam', 'column', 'foundation', 'staircase', 'rebar', 'cement', 'sand', 'gravel']):
        return 'construction'
    if any(x in tid for x in ['insurance', 'premium', 'claim', 'cover', 'policy']):
        return 'insurance'
    if any(x in tid for x in ['credit', 'card', 'fico', 'reward', 'cashback', 'balance-transfer']):
        return 'credit_card'
    if any(x in tid for x in ['bank', 'saving', 'deposit', 'withdrawal', 'account']):
        return 'banking'
    return 'tools'

# ---- Suffix-based translation for tool titles ----
# For each language: (English suffix/word, replacement)
# Applied right-to-left (last match of suffix wins)

SUFFIX_RULES = {
    'hi': [
        ('Calculator', 'कैलकुलेटर'), ('Converter', 'कनवर्टर'), ('Tracker', 'ट्रैकर'),
        ('Estimator', 'एस्टिमेटर'), ('Analyzer', 'एनालाइजर'), ('Planner', 'प्लानर'),
        ('Generator', 'जनरेटर'), ('Optimizer', 'ऑप्टिमाइज़र'), ('Dashboard', 'डैशबोर्ड'),
        ('Monitor', 'मॉनिटर'), ('Predictor', 'प्रेडिक्टर'), ('Measure', 'माप'),
        ('Measurement', 'माप'),
    ],
    'ja': [
        ('Calculator', '計算機'), ('Converter', 'コンバーター'), ('Tracker', 'トラッカー'),
        ('Estimator', 'エスティメーター'), ('Analyzer', 'アナライザー'), ('Planner', 'プランナー'),
        ('Generator', 'ジェネレーター'), ('Optimizer', 'オプティマイザー'), ('Dashboard', 'ダッシュボード'),
        ('Monitor', 'モニター'), ('Predictor', '予測'), ('Measure', '測定'),
        ('Measurement', '測定'),
    ],
    'es': [
        ('Calculator', 'Calculadora'), ('Converter', 'Convertidor'), ('Tracker', 'Rastreador'),
        ('Estimator', 'Estimador'), ('Analyzer', 'Analizador'), ('Planner', 'Planificador'),
        ('Generator', 'Generador'), ('Dashboard', 'Panel'), ('Monitor', 'Monitor'),
    ],
    'fr': [
        ('Calculator', 'Calculateur'), ('Converter', 'Convertisseur'), ('Tracker', 'Suivi'),
        ('Estimator', 'Estimateur'), ('Analyzer', 'Analyseur'), ('Planner', 'Planificateur'),
        ('Generator', 'Générateur'), ('Dashboard', 'Tableau de bord'), ('Monitor', 'Moniteur'),
    ],
    'de': [
        ('Calculator', 'Rechner'), ('Converter', 'Umrechner'), ('Tracker', 'Tracker'),
        ('Estimator', 'Schätzer'), ('Analyzer', 'Analysator'), ('Planner', 'Planer'),
        ('Generator', 'Generator'), ('Dashboard', 'Dashboard'), ('Monitor', 'Monitor'),
    ],
    'pt': [
        ('Calculator', 'Calculadora'), ('Converter', 'Conversor'), ('Tracker', 'Rastreador'),
        ('Estimator', 'Estimador'), ('Analyzer', 'Analisador'), ('Planner', 'Planejador'),
        ('Generator', 'Gerador'), ('Dashboard', 'Painel'),
    ],
    'ar': [
        ('Calculator', 'حاسبة'), ('Converter', 'محول'), ('Tracker', 'متتبع'),
        ('Estimator', 'مقدّر'), ('Analyzer', 'محلل'), ('Planner', 'مخطط'),
        ('Generator', 'مولد'), ('Dashboard', 'لوحة القيادة'),
    ],
    'ur': [
        ('Calculator', 'کیلکولیٹر'), ('Converter', 'کنورٹر'), ('Tracker', 'ٹریکر'),
        ('Estimator', 'ایسٹیمیٹر'), ('Analyzer', 'اینالائزر'), ('Planner', 'پلانر'),
    ],
    'ta': [
        ('Calculator', 'கால்குலேட்டர்'), ('Converter', 'கன்வர்ட்டர்'), ('Tracker', 'ட்ராக்கர்'),
    ],
    'te': [
        ('Calculator', 'కాల్క్యులేటర్'), ('Converter', 'కన్వర్టర్'), ('Tracker', 'ట్రాకర్'),
    ],
    'bn': [
        ('Calculator', 'ক্যালকুলেটর'), ('Converter', 'কনভার্টার'), ('Tracker', 'ট্র্যাকার'),
    ],
    'mr': [
        ('Calculator', 'कॅल्क्युलेटर'), ('Converter', 'कन्व्हर्टर'), ('Tracker', 'ट्रॅकर'),
    ],
    'gu': [
        ('Calculator', 'કેલ્ક્યુલેટર'), ('Converter', 'કન્વર્ટર'), ('Tracker', 'ટ્રેકર'),
    ],
    'id': [
        ('Calculator', 'Kalkulator'), ('Converter', 'Konverter'), ('Tracker', 'Pelacak'),
        ('Estimator', 'Estimator'), ('Analyzer', 'Penganalisis'), ('Planner', 'Perencana'),
        ('Generator', 'Generator'), ('Dashboard', 'Dasbor'),
    ],
}

def translate_title(text, lang):
    """Suffix-based translation: replaces known suffixes like 'Calculator' → '計算機'"""
    if lang not in SUFFIX_RULES:
        return text
    result = text
    for eng_suffix, local_suffix in SUFFIX_RULES[lang]:
        # Replace only if the English suffix appears as a whole word
        result = re.sub(r'\b' + re.escape(eng_suffix) + r'\b', local_suffix, result)
    return result

def translate_desc(text, lang):
    """Same suffix-based approach for descriptions"""
    return translate_title(text, lang)  # Same rules work for descriptions too


# ---- Complete subcategory translations for key languages ----

SUBCAT_TRANSLATIONS = {
    'hi': {
        'body_measurements': 'शरीर माप',
        'nutrition_calories': 'पोषण और कैलोरी ट्रैकिंग',
        'exercise_performance': 'व्यायाम और प्रदर्शन',
        'heart_vital_health': 'हृदय और महत्वपूर्ण स्वास्थ्य',
        'pregnancy_fertility': 'गर्भावस्था और प्रजनन',
        'sleep_lifestyle': 'नींद और जीवनशैली',
        'weight_goal_management': 'वजन और लक्ष्य प्रबंधन',
        'disease_risk_prevention': 'रोग जोखिम और रोकथाम',
        'biological_time': 'जैविक और स्वास्थ्य समय',
        'basic_arithmetic': 'मूल अंकगणित',
        'algebra_equations': 'बीजगणित और समीकरण',
        'geometry_shapes': 'ज्यामिति और आकृतियाँ',
        'trigonometry': 'त्रिकोणमिति',
        'probability_statistics': 'प्रायिकता और सांख्यिकी',
        'unit_conversions': 'इकाई रूपांतरण',
        'number_systems': 'संख्या प्रणालियाँ और कनवर्टर',
        'graphs_formulas': 'ग्राफ और सूत्र',
        'matrices_vectors': 'मैट्रिक्स और वेक्टर',
        'advanced_mathematics': 'उन्नत गणित',
        'structural_engineering': 'संरचनात्मक इंजीनियरिंग',
        'materials_quantity': 'सामग्री और मात्रा अनुमान',
        'area_volume': 'क्षेत्रफल और आयतन गणना',
        'finishing_work': 'फिनिशिंग और इंटीरियर कार्य',
        'cost_estimation': 'लागत अनुमान और बजट',
        'electrical_plumbing': 'इलेक्ट्रिकल और प्लंबिंग',
        'hvac_insulation': 'एचवीएसी और इन्सुलेशन',
        'roofing_waterproofing': 'छत और वॉटरप्रूफिंग',
        'loan_emi_calculators': 'ऋण और EMI कैलकुलेटर',
        'investment_returns_calculators': 'निवेश और रिटर्न कैलकुलेटर',
        'tax_income_calculators': 'कर और आय कैलकुलेटर',
        'currency_forex_calculators': 'मुद्रा और विदेशी मुद्रा',
        'time_based_financial_calculators': 'समय-आधारित वित्तीय कैलकुलेटर',
        'banking_savings_calculators': 'बैंकिंग और बचत कैलकुलेटर',
        'insurance_calculators': 'बीमा कैलकुलेटर',
        'real_estate_calculators': 'अचल संपत्ति कैलकुलेटर',
        'credit_card_calculators': 'क्रेडिट कार्ड कैलकुलेटर',
        'retirement_calculators': 'सेवानिवृत्ति कैलकुलेटर',
        'business_profitability_calculators': 'व्यापार और लाभप्रदता',
        'miscellaneous_financial_tools': 'विविध वित्तीय उपकरण',
    },
    'ja': {
        'body_measurements': '体の測定',
        'nutrition_calories': '栄養とカロリー管理',
        'exercise_performance': '運動とパフォーマンス',
        'heart_vital_health': '心臓とバイタルヘルス',
        'pregnancy_fertility': '妊娠と生殖',
        'sleep_lifestyle': '睡眠とライフスタイル',
        'weight_goal_management': '体重と目標管理',
        'disease_risk_prevention': '疾患リスクと予防',
        'biological_time': '生物学的・健康時間',
        'basic_arithmetic': '基本算術',
        'algebra_equations': '代数と方程式',
        'geometry_shapes': '幾何学と図形',
        'trigonometry': '三角関数',
        'probability_statistics': '確率と統計',
        'unit_conversions': '単位変換',
        'number_systems': '数体系とコンバーター',
        'graphs_formulas': 'グラフと公式',
        'matrices_vectors': '行列とベクトル',
        'advanced_mathematics': '高等数学',
        'linear_algebra_vectors': '線形代数とベクトル',
        'structural_engineering': '構造工学',
        'materials_quantity': '材料と数量見積',
        'area_volume': '面積と体積計算',
        'finishing_work': '仕上げとインテリア',
        'cost_estimation': 'コスト見積と予算',
        'electrical_plumbing': '電気と配管',
        'hvac_insulation': '空調と断熱',
        'roofing_waterproofing': '屋根と防水',
        'mechanics_motion': '力学と運動',
        'loan_emi_calculators': 'ローンとEMI計算機',
        'investment_returns_calculators': '投資とリターン計算機',
        'tax_income_calculators': '税金と所得計算機',
        'currency_forex_calculators': '通貨と外国為替',
        'time_based_financial_calculators': '時間ベースの金融計算機',
        'banking_savings_calculators': '銀行と貯蓄計算機',
        'insurance_calculators': '保険計算機',
        'real_estate_calculators': '不動産計算機',
        'credit_card_calculators': 'クレジットカード計算機',
        'retirement_calculators': '退職計算機',
        'business_profitability_calculators': 'ビジネスと収益性',
        'miscellaneous_financial_tools': 'その他の金融ツール',
    },
    'es': {
        'body_measurements': 'Medidas Corporales',
        'nutrition_calories': 'Nutrición y Calorías',
        'exercise_performance': 'Ejercicio y Rendimiento',
        'heart_vital_health': 'Salud Cardíaca y Vital',
        'pregnancy_fertility': 'Embarazo y Fertilidad',
        'sleep_lifestyle': 'Sueño y Estilo de Vida',
        'weight_goal_management': 'Control de Peso y Metas',
        'disease_risk_prevention': 'Riesgo y Prevención',
        'basic_arithmetic': 'Aritmética Básica',
        'algebra_equations': 'Álgebra y Ecuaciones',
        'geometry_shapes': 'Geometría y Formas',
        'trigonometry': 'Trigonometría',
        'probability_statistics': 'Probabilidad y Estadística',
        'unit_conversions': 'Conversión de Unidades',
        'loan_emi_calculators': 'Préstamos y EMI',
        'investment_returns_calculators': 'Inversiones y Rendimientos',
        'tax_income_calculators': 'Impuestos e Ingresos',
        'insurance_calculators': 'Seguros',
        'real_estate_calculators': 'Bienes Raíces',
        'credit_card_calculators': 'Tarjetas de Crédito',
        'retirement_calculators': 'Jubilación',
    },
    'fr': {
        'body_measurements': 'Mesures Corporelles',
        'nutrition_calories': 'Nutrition et Calories',
        'exercise_performance': 'Exercice et Performance',
        'heart_vital_health': 'Santé Cardiaque et Vitale',
        'pregnancy_fertility': 'Grossesse et Fertilité',
        'basic_arithmetic': 'Arithmétique de Base',
        'algebra_equations': 'Algèbre et Équations',
        'geometry_shapes': 'Géométrie et Formes',
        'trigonometry': 'Trigonométrie',
        'probability_statistics': 'Probabilité et Statistiques',
        'loan_emi_calculators': 'Prêts et EMI',
        'investment_returns_calculators': 'Investissements et Rendements',
        'tax_income_calculators': 'Impôts et Revenus',
        'insurance_calculators': 'Assurances',
    },
    'de': {
        'body_measurements': 'Körpermaße',
        'nutrition_calories': 'Ernährung und Kalorien',
        'exercise_performance': 'Übung und Leistung',
        'basic_arithmetic': 'Grundrechenarten',
        'algebra_equations': 'Algebra und Gleichungen',
        'geometry_shapes': 'Geometrie und Formen',
        'trigonometry': 'Trigonometrie',
        'probability_statistics': 'Wahrscheinlichkeit und Statistik',
        'loan_emi_calculators': 'Kredit und EMI Rechner',
        'investment_returns_calculators': 'Investitionen und Rendite',
        'tax_income_calculators': 'Steuern und Einkommen',
        'insurance_calculators': 'Versicherungsrechner',
    },
    'ar': {
        'body_measurements': 'قياسات الجسم',
        'nutrition_calories': 'التغذية والسعرات',
        'exercise_performance': 'التمارين والأداء',
        'heart_vital_health': 'صحة القلب والعلامات الحيوية',
        'pregnancy_fertility': 'الحمل والخصوبة',
        'basic_arithmetic': 'الحساب الأساسي',
        'algebra_equations': 'الجبر والمعادلات',
        'geometry_shapes': 'الهندسة والأشكال',
        'trigonometry': 'علم المثلثات',
        'loan_emi_calculators': 'القروض والأقساط',
        'investment_returns_calculators': 'الاستثمار والعوائد',
        'tax_income_calculators': 'الضرائب والدخل',
        'insurance_calculators': 'حاسبة التأمين',
    },
    'ur': {
        'body_measurements': 'جسم کی پیمائش',
        'nutrition_calories': 'غذائیت اور کیلوریز',
        'basic_arithmetic': 'بنیادی حساب',
        'loan_emi_calculators': 'قرض اور EMI کیلکولیٹر',
        'investment_returns_calculators': 'سرمایہ کاری اور منافع',
        'tax_income_calculators': 'ٹیکس اور آمدنی',
    },
}

def build_en_keys(tools, subcats):
    keys = {}
    subcat_keys = {}
    for key, name in subcats.items():
        clean = re.sub(r'^[^\w]+', '', name).strip()
        subcat_keys[to_snake(key)] = clean
    keys['subcategories'] = subcat_keys

    ns_keys = {}
    for tool in tools:
        ns = categorize_tool(tool['id'])
        if ns not in ns_keys:
            ns_keys[ns] = {}
        snake = to_snake(tool['id'])
        ns_keys[ns][f"{snake}_title"] = tool['title']
        ns_keys[ns][f"{snake}_desc"] = tool['desc']

    return keys, ns_keys

def main():
    tools = extract_tools()
    subcats = extract_subcategories()
    en_subcats, en_ns_keys = build_en_keys(tools, subcats)

    # Step 1: Update en.json
    en_path = os.path.join(LOCALES_DIR, 'en.json')
    with open(en_path, 'r', encoding='utf-8') as f:
        en = json.load(f)

    if 'subcategories' not in en:
        en['subcategories'] = {}
    en['subcategories'].update(en_subcats['subcategories'])

    for ns, keys in en_ns_keys.items():
        if ns not in en:
            en[ns] = {}
        for k, v in keys.items():
            if k not in en[ns]:
                en[ns][k] = v

    with open(en_path, 'w', encoding='utf-8') as f:
        json.dump(en, f, indent=4, ensure_ascii=False)
    print(f"Updated en.json ({len(tools)} tools, {len(subcats)} subcategories)")

    # Step 2: Update all other locale files
    locales = ['hi', 'ja', 'es', 'fr', 'de', 'pt', 'ar', 'ur', 'ta', 'te', 'bn', 'mr', 'gu', 'id']

    for lang in locales:
        locale_path = os.path.join(LOCALES_DIR, f'{lang}.json')
        if not os.path.exists(locale_path):
            continue

        with open(locale_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Subcategories: use manual translations if available, else suffix-translate
        if 'subcategories' not in data:
            data['subcategories'] = {}
        manual_subcats = SUBCAT_TRANSLATIONS.get(lang, {})
        for key, en_name in en_subcats['subcategories'].items():
            if key not in data['subcategories']:
                if key in manual_subcats:
                    data['subcategories'][key] = manual_subcats[key]
                else:
                    data['subcategories'][key] = translate_title(en_name, lang)

        # Tool keys: suffix-based translation
        for ns, keys in en_ns_keys.items():
            if ns not in data:
                data[ns] = {}
            for k, v in keys.items():
                if k not in data[ns]:
                    data[ns][k] = translate_title(v, lang)

        with open(locale_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        print(f"Updated {lang}.json")

    print("\nAll done!")

if __name__ == '__main__':
    main()
