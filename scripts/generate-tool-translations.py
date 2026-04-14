#!/usr/bin/env python3
"""
Generate tool title/description translation keys for ALL tools.
Also add subcategory name translations.
"""
import json, re, os, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCALES_DIR = os.path.join(BASE, 'src', 'locales')

def to_snake(s):
    """Convert tool-id to snake_case key"""
    return s.strip().lower().replace('-', '_').replace(' ', '_')

def extract_tools():
    """Extract all tools from toolsData.ts and financial-tools-report.json"""
    ts_path = os.path.join(BASE, 'src', 'lib', 'toolsData.ts')
    with open(ts_path, 'r', encoding='utf-8') as f:
        ts = f.read()

    tools = []
    # Match { id: '...', title: '...', description: '...' }
    pattern = r"\{\s*id:\s*['\"]([^'\"]+)['\"],\s*title:\s*['\"]([^'\"]+)['\"],\s*description:\s*['\"]([^'\"]+)['\"]"
    for m in re.finditer(pattern, ts):
        tools.append({'id': m.group(1), 'title': m.group(2), 'desc': m.group(3)})

    print(f"From toolsData.ts: {len(tools)} tools")

    # Financial tools from report
    fr_path = os.path.join(BASE, 'financial-tools-report.json')
    with open(fr_path, 'r', encoding='utf-8') as f:
        fr = json.load(f)

    existing = {t['id'] for t in tools}
    added = 0
    for item in fr.get('basicImplemented', []) + fr.get('advancedImplemented', []):
        tid = item.get('id', '')
        if tid and tid not in existing:
            tools.append({
                'id': tid,
                'title': item.get('title', tid),
                'desc': (item.get('title', tid) + '.') if item.get('title') else 'Calculator.'
            })
            existing.add(tid)
            added += 1

    print(f"From financial-report: {added} more tools")
    print(f"Total: {len(tools)} tools")
    return tools

def extract_subcategories():
    """Extract subcategory keys and names"""
    ts_path = os.path.join(BASE, 'src', 'lib', 'toolsData.ts')
    with open(ts_path, 'r', encoding='utf-8') as f:
        ts = f.read()

    subcats = {}
    pattern = r"['\"]([a-z0-9_-]+)['\"]:\s*\{\s*name:\s*['\"]([^'\"]+)['\"]"
    for m in re.finditer(pattern, ts):
        key = m.group(1)
        name = m.group(2)
        # Skip if it's a category-level key
        if key in ('health', 'math', 'datetime', 'education', 'technology', 'construction', 'business', 'everyday', 'scientific', 'physics'):
            continue
        subcats[key] = name

    # From financial report
    fr_path = os.path.join(BASE, 'financial-tools-report.json')
    with open(fr_path, 'r', encoding='utf-8') as f:
        fr = json.load(f)

    for item in fr.get('basicImplemented', []) + fr.get('advancedImplemented', []):
        sk = item.get('subcategoryKey', '')
        sn = item.get('subcategoryName', '')
        if sk and sn and sk not in subcats:
            subcats[sk] = sn

    print(f"Total subcategories: {len(subcats)}")
    return subcats

def categorize_tool(tool_id):
    """Guess namespace for a tool based on its ID"""
    tid = tool_id.lower()
    if any(x in tid for x in ['emi', 'loan', 'mortgage', 'amortization']):
        return 'loan'
    if any(x in tid for x in ['tax', 'gst', 'regime', 'tds', 'cess', 'hra', 'deduction', 'income-tax']):
        return 'tax'
    if any(x in tid for x in ['sip', 'cagr', 'roi', 'investment', 'mutual-fund', 'stock', 'dividend', 'portfolio', 'compound', 'simple-interest', 'fixed-deposit', 'fd-', 'rd-', 'ppf', 'nps', 'epf', 'elss', 'gold', 'bond', 'etf', 'nav', 'xirr', 'retirement', 'pension', 'annuity', 'lumpsum', 'swp', 'stp']):
        return 'investment'
    if any(x in tid for x in ['bmi', 'bmr', 'body', 'calorie', 'health', 'fitness', 'weight', 'fat', 'protein', 'water-intake', 'macro', 'tdee', 'nutrition', 'glycemic', 'fiber', 'sugar', 'sodium', 'vitamin', 'iron', 'keto', 'heart', 'blood', 'pregnancy', 'ovulation', 'sleep', 'hydration']):
        return 'health'
    if any(x in tid for x in ['real-estate', 'property', 'rent', 'stamp', 'carpet', 'built-up']):
        return 'real_estate'
    if any(x in tid for x in ['date', 'time', 'age', 'day', 'week', 'month', 'year', 'clock', 'timezone', 'countdown']):
        return 'datetime'
    if any(x in tid for x in ['math', 'algebra', 'geometry', 'fraction', 'matrix', 'equation', 'trigonometry', 'logarithm', 'factorial', 'permutation', 'combination', 'probability', 'statistics', 'mean', 'median', 'mode', 'derivative', 'integral', 'prime', 'gcd', 'lcm', 'fibonacci', 'binary', 'hex', 'octal']):
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
    if any(x in tid for x in ['currency', 'forex', 'exchange', 'pip', 'spread']):
        return 'investment'
    if any(x in tid for x in ['insurance', 'premium', 'claim', 'cover', 'policy', 'life-insurance', 'health-insurance', 'car-insurance']):
        return 'insurance'
    if any(x in tid for x in ['credit', 'card', 'fico', 'credit-score', 'credit-limit', 'reward', 'cashback', 'balance-transfer']):
        return 'credit_card'
    if any(x in tid for x in ['bank', 'saving', 'deposit', 'withdrawal', 'interest-rate', 'account']):
        return 'banking'
    # Default: business for financial-like, or general
    return 'tools'

def build_en_keys(tools, subcats):
    """Build translation keys for en.json"""
    keys = {}

    # Subcategory names
    subcat_keys = {}
    for key, name in subcats.items():
        clean_name = re.sub(r'^[^\w]+', '', name).strip()  # Remove emoji prefix
        snake = to_snake(key)
        subcat_keys[snake] = clean_name
    keys['subcategories'] = subcat_keys

    # Tool titles and descriptions per namespace
    ns_keys = {}
    for tool in tools:
        ns = categorize_tool(tool['id'])
        if ns not in ns_keys:
            ns_keys[ns] = {}
        snake = to_snake(tool['id'])
        ns_keys[ns][f"{snake}_title"] = tool['title']
        ns_keys[ns][f"{snake}_desc"] = tool['desc']

    return keys, ns_keys

# --- Translation mappings (basic translations for common tool terms) ---

TRANSLATIONS = {
    'hi': {
        'Calculator': 'कैलकुलेटर', 'Calculate': 'गणना करें', 'BMI': 'बीएमआई',
        'Loan': 'ऋण', 'EMI': 'ईएमआई', 'Tax': 'कर', 'Income': 'आय',
        'Investment': 'निवेश', 'Interest': 'ब्याज', 'Rate': 'दर',
        'Salary': 'वेतन', 'Profit': 'लाभ', 'Loss': 'हानि',
        'Simple': 'सरल', 'Compound': 'चक्रवृद्धि', 'Advanced': 'उन्नत',
        'Basic': 'बेसिक', 'Premium': 'प्रीमियम', 'Insurance': 'बीमा',
        'Health': 'स्वास्थ्य', 'Fitness': 'फिटनेस', 'Body': 'शरीर',
        'Weight': 'वजन', 'Height': 'ऊंचाई', 'Age': 'आयु',
        'Date': 'तारीख', 'Time': 'समय', 'Currency': 'मुद्रा',
        'Converter': 'कनवर्टर', 'Discount': 'छूट', 'Percentage': 'प्रतिशत',
        'GST': 'जीएसटी', 'SIP': 'एसआईपी', 'Mortgage': 'बंधक',
        'Property': 'संपत्ति', 'Rent': 'किराया', 'Mutual Fund': 'म्यूचुअल फंड',
        'Fixed Deposit': 'सावधि जमा', 'Recurring Deposit': 'आवर्ती जमा',
        'Retirement': 'सेवानिवृत्ति', 'Pension': 'पेंशन',
        'Credit Card': 'क्रेडिट कार्ड', 'Savings': 'बचत',
        'Real Estate': 'अचल संपत्ति', 'Gold': 'सोना',
        'Stock': 'स्टॉक', 'Bond': 'बॉन्ड',
        'your': 'आपका', 'the': '', 'and': 'और', 'for': 'के लिए',
        'of': 'का', 'in': 'में', 'with': 'के साथ', 'to': 'को',
    },
    'ja': {
        'Calculator': '計算機', 'Calculate': '計算する', 'BMI': 'BMI',
        'Loan': 'ローン', 'EMI': 'EMI', 'Tax': '税金', 'Income': '所得',
        'Investment': '投資', 'Interest': '利息', 'Rate': '率',
        'Salary': '給与', 'Profit': '利益', 'Loss': '損失',
        'Simple': 'シンプル', 'Compound': '複利', 'Advanced': 'アドバンス',
        'Basic': '基本', 'Premium': 'プレミアム', 'Insurance': '保険',
        'Health': '健康', 'Fitness': 'フィットネス', 'Body': '体',
        'Weight': '体重', 'Height': '身長', 'Age': '年齢',
        'Date': '日付', 'Time': '時間', 'Currency': '通貨',
        'Converter': 'コンバーター', 'Discount': '割引', 'Percentage': 'パーセント',
        'GST': 'GST', 'SIP': 'SIP', 'Mortgage': '住宅ローン',
        'Property': '不動産', 'Rent': '家賃', 'Mutual Fund': '投資信託',
        'Fixed Deposit': '定期預金', 'Recurring Deposit': '積立預金',
        'Retirement': '退職', 'Pension': '年金',
        'Credit Card': 'クレジットカード', 'Savings': '貯蓄',
        'Real Estate': '不動産', 'Gold': '金(ゴールド)',
        'Stock': '株式', 'Bond': '債券',
        'your': 'あなたの', 'the': '', 'and': 'と', 'for': 'のための',
        'of': 'の', 'in': 'で', 'with': 'で', 'to': 'へ',
    },
    'es': {
        'Calculator': 'Calculadora', 'Calculate': 'Calcular', 'Loan': 'Préstamo',
        'EMI': 'EMI', 'Tax': 'Impuesto', 'Income': 'Ingreso',
        'Investment': 'Inversión', 'Interest': 'Interés', 'Rate': 'Tasa',
        'Salary': 'Salario', 'Profit': 'Beneficio', 'Loss': 'Pérdida',
        'Simple': 'Simple', 'Compound': 'Compuesto', 'Advanced': 'Avanzado',
        'Basic': 'Básico', 'Premium': 'Prima', 'Insurance': 'Seguro',
        'Health': 'Salud', 'Fitness': 'Fitness', 'Body': 'Cuerpo',
        'Weight': 'Peso', 'Height': 'Altura', 'Age': 'Edad',
        'Date': 'Fecha', 'Time': 'Tiempo', 'Currency': 'Moneda',
        'Converter': 'Convertidor', 'Discount': 'Descuento', 'Percentage': 'Porcentaje',
        'Property': 'Propiedad', 'Rent': 'Alquiler',
        'Retirement': 'Jubilación', 'Pension': 'Pensión',
        'Credit Card': 'Tarjeta de Crédito', 'Savings': 'Ahorros',
        'Real Estate': 'Bienes Raíces', 'Gold': 'Oro',
        'Stock': 'Acción', 'Bond': 'Bono',
    },
    'fr': {
        'Calculator': 'Calculateur', 'Calculate': 'Calculer', 'Loan': 'Prêt',
        'Tax': 'Impôt', 'Income': 'Revenu', 'Investment': 'Investissement',
        'Interest': 'Intérêt', 'Rate': 'Taux', 'Salary': 'Salaire',
        'Insurance': 'Assurance', 'Health': 'Santé', 'Body': 'Corps',
        'Weight': 'Poids', 'Height': 'Taille', 'Age': 'Âge',
        'Date': 'Date', 'Time': 'Temps', 'Currency': 'Devise',
        'Discount': 'Remise', 'Property': 'Propriété', 'Rent': 'Loyer',
        'Retirement': 'Retraite', 'Savings': 'Épargne',
        'Real Estate': 'Immobilier', 'Gold': 'Or',
    },
    'de': {
        'Calculator': 'Rechner', 'Calculate': 'Berechnen', 'Loan': 'Darlehen',
        'Tax': 'Steuer', 'Income': 'Einkommen', 'Investment': 'Investition',
        'Interest': 'Zinsen', 'Rate': 'Rate', 'Salary': 'Gehalt',
        'Insurance': 'Versicherung', 'Health': 'Gesundheit', 'Body': 'Körper',
        'Weight': 'Gewicht', 'Height': 'Größe', 'Age': 'Alter',
        'Date': 'Datum', 'Time': 'Zeit', 'Currency': 'Währung',
        'Discount': 'Rabatt', 'Property': 'Immobilie', 'Rent': 'Miete',
        'Retirement': 'Ruhestand', 'Savings': 'Sparen',
    },
    'pt': {
        'Calculator': 'Calculadora', 'Calculate': 'Calcular', 'Loan': 'Empréstimo',
        'Tax': 'Imposto', 'Income': 'Renda', 'Investment': 'Investimento',
        'Interest': 'Juros', 'Rate': 'Taxa', 'Salary': 'Salário',
        'Insurance': 'Seguro', 'Health': 'Saúde', 'Body': 'Corpo',
        'Weight': 'Peso', 'Height': 'Altura', 'Age': 'Idade',
        'Currency': 'Moeda', 'Discount': 'Desconto',
        'Retirement': 'Aposentadoria', 'Savings': 'Poupança',
    },
    'ar': {
        'Calculator': 'آلة حاسبة', 'Calculate': 'احسب', 'Loan': 'قرض',
        'Tax': 'ضريبة', 'Income': 'دخل', 'Investment': 'استثمار',
        'Interest': 'فائدة', 'Rate': 'معدل', 'Salary': 'راتب',
        'Insurance': 'تأمين', 'Health': 'صحة', 'Body': 'جسم',
        'Weight': 'وزن', 'Height': 'طول', 'Age': 'عمر',
        'Currency': 'عملة', 'Discount': 'خصم',
        'Retirement': 'تقاعد', 'Savings': 'مدخرات',
        'Property': 'عقار', 'Gold': 'ذهب',
    },
    'ur': {
        'Calculator': 'کیلکولیٹر', 'Calculate': 'حساب کریں', 'Loan': 'قرض',
        'Tax': 'ٹیکس', 'Income': 'آمدنی', 'Investment': 'سرمایہ کاری',
        'Interest': 'سود', 'Rate': 'شرح', 'Salary': 'تنخواہ',
        'Insurance': 'بیمہ', 'Health': 'صحت', 'Body': 'جسم',
        'Weight': 'وزن', 'Height': 'قد', 'Age': 'عمر',
        'Currency': 'کرنسی', 'Discount': 'چھوٹ',
        'Savings': 'بچت', 'Property': 'جائیداد',
    },
    'ta': {
        'Calculator': 'கால்குலேட்டர்', 'Calculate': 'கணக்கிடு',
        'Loan': 'கடன்', 'Tax': 'வரி', 'Income': 'வருமானம்',
        'Investment': 'முதலீடு', 'Interest': 'வட்டி', 'Health': 'ஆரோக்கியம்',
        'Body': 'உடல்', 'Weight': 'எடை', 'Height': 'உயரம்',
        'Insurance': 'காப்பீடு', 'Savings': 'சேமிப்பு',
    },
    'te': {
        'Calculator': 'కాల్క్యులేటర్', 'Calculate': 'లెక్కించండి',
        'Loan': 'రుణం', 'Tax': 'పన్ను', 'Income': 'ఆదాయం',
        'Investment': 'పెట్టుబడి', 'Interest': 'వడ్డీ', 'Health': 'ఆరోగ్యం',
        'Body': 'శరీరం', 'Weight': 'బరువు', 'Insurance': 'భీమా',
    },
    'bn': {
        'Calculator': 'ক্যালকুলেটর', 'Calculate': 'গণনা করুন',
        'Loan': 'ঋণ', 'Tax': 'কর', 'Income': 'আয়',
        'Investment': 'বিনিয়োগ', 'Interest': 'সুদ', 'Health': 'স্বাস্থ্য',
        'Body': 'শরীর', 'Weight': 'ওজন', 'Insurance': 'বীমা',
    },
    'mr': {
        'Calculator': 'कॅल्क्युलेटर', 'Calculate': 'गणना करा',
        'Loan': 'कर्ज', 'Tax': 'कर', 'Income': 'उत्पन्न',
        'Investment': 'गुंतवणूक', 'Interest': 'व्याज', 'Health': 'आरोग्य',
        'Body': 'शरीर', 'Weight': 'वजन', 'Insurance': 'विमा',
    },
    'gu': {
        'Calculator': 'કેલ્ક્યુલેટર', 'Calculate': 'ગણતરી કરો',
        'Loan': 'લોન', 'Tax': 'કર', 'Income': 'આવક',
        'Investment': 'રોકાણ', 'Interest': 'વ્યાજ', 'Health': 'આરોગ્ય',
        'Body': 'શરીર', 'Weight': 'વજન', 'Insurance': 'વીમો',
    },
    'id': {
        'Calculator': 'Kalkulator', 'Calculate': 'Hitung', 'Loan': 'Pinjaman',
        'Tax': 'Pajak', 'Income': 'Pendapatan', 'Investment': 'Investasi',
        'Interest': 'Bunga', 'Rate': 'Tarif', 'Salary': 'Gaji',
        'Insurance': 'Asuransi', 'Health': 'Kesehatan', 'Body': 'Tubuh',
        'Weight': 'Berat', 'Height': 'Tinggi', 'Age': 'Usia',
        'Currency': 'Mata Uang', 'Discount': 'Diskon',
        'Retirement': 'Pensiun', 'Savings': 'Tabungan',
    },
}

def translate_text(text, lang):
    """Word-boundary-aware translation for tool titles.
    Only replaces whole words, not substrings within words."""
    if lang not in TRANSLATIONS:
        return text  # Keep English as fallback
    mapping = TRANSLATIONS[lang]
    result = text
    # Sort by length descending to replace longer phrases first
    for eng, trans in sorted(mapping.items(), key=lambda x: -len(x[0])):
        # Skip short function words for non-Latin scripts — they cause corruption
        if len(eng) <= 3 and lang in ('ja', 'ar', 'ur', 'ta', 'te', 'bn', 'mr', 'gu', 'hi'):
            continue
        # Use word boundary matching to avoid partial replacements
        result = re.sub(r'\b' + re.escape(eng) + r'\b', trans, result)
    return result

def main():
    tools = extract_tools()
    subcats = extract_subcategories()
    en_subcats, en_ns_keys = build_en_keys(tools, subcats)

    # Step 1: Update en.json
    en_path = os.path.join(LOCALES_DIR, 'en.json')
    with open(en_path, 'r', encoding='utf-8') as f:
        en = json.load(f)

    # Add subcategories
    if 'subcategories' not in en:
        en['subcategories'] = {}
    en['subcategories'].update(en_subcats['subcategories'])

    # Add tool keys per namespace (merge, don't overwrite)
    for ns, keys in en_ns_keys.items():
        if ns not in en:
            en[ns] = {}
        for k, v in keys.items():
            if k not in en[ns]:  # Don't overwrite existing translations
                en[ns][k] = v

    with open(en_path, 'w', encoding='utf-8') as f:
        json.dump(en, f, indent=4, ensure_ascii=False)
    print(f"Updated en.json ({len(tools)} tools, {len(subcats)} subcategories)")

    # Step 2: Update all other locale files
    locales = ['hi', 'ja', 'es', 'fr', 'de', 'pt', 'ar', 'ur', 'ta', 'te', 'bn', 'mr', 'gu', 'id']

    for lang in locales:
        locale_path = os.path.join(LOCALES_DIR, f'{lang}.json')
        if not os.path.exists(locale_path):
            print(f"Skipping {lang}.json (not found)")
            continue

        with open(locale_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Add subcategories
        if 'subcategories' not in data:
            data['subcategories'] = {}
        for key, name in en_subcats['subcategories'].items():
            if key not in data['subcategories']:
                data['subcategories'][key] = translate_text(name, lang)

        # Add tool keys per namespace
        for ns, keys in en_ns_keys.items():
            if ns not in data:
                data[ns] = {}
            for k, v in keys.items():
                if k not in data[ns]:
                    data[ns][k] = translate_text(v, lang)

        with open(locale_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)
        print(f"Updated {lang}.json")

    print("\nAll done!")

if __name__ == '__main__':
    main()
