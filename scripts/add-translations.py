import json, os

locale_dir = r'c:\Users\dell\Desktop\nextjs c\src\locales'

translations_map = {
    'hi': {
        'common': {
            'calculate': 'गणना करें', 'reset': 'रीसेट', 'result': 'परिणाम', 'results': 'परिणाम',
            'step_by_step': 'चरण-दर-चरण', 'calculation_breakdown': 'गणना विवरण',
            'copy_result': 'परिणाम कॉपी करें', 'share': 'साझा करें', 'export': 'निर्यात', 'print': 'प्रिंट',
            'summary': 'सारांश', 'details': 'विवरण', 'add_row': 'पंक्ति जोड़ें', 'remove': 'हटाएं',
            'period': 'अवधि', 'amount': 'राशि', 'enter_valid': 'कृपया सही मान दर्ज करें',
            'no_data': 'कोई डेटा नहीं', 'investment_analysis': 'निवेश विश्लेषण',
            'loading': 'गणना हो रही है...', 'error': 'त्रुटि', 'copied': 'कॉपी हो गया!'
        },
        'units': {
            'years': 'वर्ष', 'year': 'वर्ष', 'months': 'महीने', 'month': 'महीना',
            'days': 'दिन', 'day': 'दिन', 'percent': '%', 'per_year': 'प्रति वर्ष',
            'per_month': 'प्रति महीना', 'kg': 'किग्रा', 'lb': 'पाउंड',
            'cm': 'सेमी', 'ft': 'फुट', 'sqft': 'वर्ग फुट', 'sqm': 'वर्ग मीटर'
        },
        'labels': {
            'principal': 'मूलधन', 'rate': 'दर', 'interest_rate': 'ब्याज दर', 'amount': 'राशि',
            'total': 'कुल', 'total_amount': 'कुल राशि', 'net': 'निवल', 'gross': 'कुल सकल',
            'period': 'अवधि', 'duration': 'अवधि', 'tenure': 'कार्यकाल',
            'income': 'आय', 'expense': 'व्यय', 'profit': 'लाभ', 'loss': 'हानि',
            'balance': 'शेष', 'payment': 'भुगतान', 'investment': 'निवेश', 'return': 'रिटर्न',
            'revenue': 'राजस्व', 'cost': 'लागत', 'savings': 'बचत', 'tax': 'कर',
            'deduction': 'कटौती', 'interest': 'ब्याज', 'capital': 'पूंजी', 'value': 'मूल्य',
            'initial_value': 'प्रारंभिक मूल्य', 'final_value': 'अंतिम मूल्य',
            'start_date': 'प्रारंभ तिथि', 'end_date': 'समाप्ति तिथि',
            'name': 'नाम', 'type': 'प्रकार', 'status': 'स्थिति'
        },
        'business': {
            'calculation_method': 'गणना विधि', 'simple_roi': 'सरल ROI',
            'simple_roi_desc': 'बुनियादी प्रतिशत रिटर्न', 'npv_analysis': 'NPV विश्लेषण',
            'npv_analysis_desc': 'पैसे का समय मूल्य', 'cashflow_irr': 'कैश फ्लो (IRR)',
            'cashflow_irr_desc': 'एकाधिक अवधि', 'initial_investment': 'प्रारंभिक निवेश',
            'final_value': 'अंतिम मूल्य', 'time_period': 'समय अवधि',
            'discount_rate': 'छूट दर', 'cash_flows_by_period': 'अवधि-वार कैश फ्लो',
            'add_period': '+ अवधि जोड़ें', 'rate_placeholder': 'दर %',
            'calculate_roi': 'ROI गणना करें', 'return_on_investment': 'निवेश पर रिटर्न',
            'npv': 'NPV', 'irr': 'IRR', 'payback': 'पेबैक', 'net_profit': 'शुद्ध लाभ',
            'cash_flows_analysis': 'कैश फ्लो विश्लेषण', 'investment_not_recovered': 'निवेश वापस नहीं हुआ',
            'payback_period': 'पेबैक अवधि', 'annualized_roi': 'वार्षिकीकृत ROI',
            'pv_of_returns': 'रिटर्न का वर्तमान मूल्य',
            'npv_positive': 'सकारात्मक NPV - निवेश फायदेमंद है',
            'npv_negative': 'नकारात्मक NPV - निवेश फायदेमंद नहीं हो सकता',
            'roi_excellent': 'उत्कृष्ट ROI - औसत बाजार रिटर्न से काफी ऊपर',
            'roi_good': 'अच्छा ROI - बाजार औसत के बराबर',
            'roi_moderate': 'मध्यम ROI - वैकल्पिक निवेश पर विचार करें',
            'roi_negative': 'नकारात्मक ROI - निवेश में नुकसान हुआ',
            'npv_adds_value': 'NPV सकारात्मक - निवेश वर्तमान मूल्य में वृद्धि करता है',
            'npv_destroys_value': 'NPV नकारात्मक - निवेश वर्तमान मूल्य नष्ट करता है',
            'irr_exceeds': 'IRR ({irr}%) छूट दर ({rate}%) से अधिक - परियोजना व्यवहार्य है',
            'investment_recovered_in': 'निवेश {periods} अवधि में वापस',
            'quick_payback': 'त्वरित पेबैक', 'long_payback': 'लंबी पेबैक अवधि',
            'revenue': 'राजस्व', 'cost_of_goods': 'माल की लागत', 'operating_costs': 'परिचालन लागत',
            'gross_margin': 'सकल मार्जिन', 'net_margin': 'निवल मार्जिन',
            'break_even_units': 'ब्रेक-ईवन इकाइयां', 'break_even_revenue': 'ब्रेक-ईवन राजस्व',
            'fixed_costs': 'स्थिर लागत', 'variable_cost_per_unit': 'प्रति इकाई परिवर्तनीय लागत',
            'selling_price_per_unit': 'प्रति इकाई विक्रय मूल्य', 'contribution_margin': 'योगदान मार्जिन',
            'clv': 'ग्राहक आजीवन मूल्य', 'arpu': 'प्रति उपयोगकर्ता औसत राजस्व',
            'churn_rate': 'चर्न दर', 'cac': 'ग्राहक अधिग्रहण लागत',
            'monthly_revenue': 'मासिक राजस्व', 'annual_revenue': 'वार्षिक राजस्व'
        },
        'loan': {
            'loan_amount': 'ऋण राशि', 'emi': 'ईएमआई', 'monthly_emi': 'मासिक ईएमआई',
            'tenure': 'कार्यकाल', 'interest_rate': 'ब्याज दर (प्रति वर्ष)',
            'total_interest': 'कुल ब्याज', 'total_payment': 'कुल भुगतान',
            'monthly_payment': 'मासिक भुगतान', 'principal_amount': 'मूल राशि',
            'loan_type': 'ऋण का प्रकार', 'home_loan': 'होम लोन', 'car_loan': 'कार लोन',
            'personal_loan': 'पर्सनल लोन', 'education_loan': 'शिक्षा ऋण',
            'processing_fee': 'प्रोसेसिंग शुल्क', 'outstanding_balance': 'बकाया शेष',
            'prepayment': 'पूर्व-भुगतान', 'amortization_schedule': 'परिशोधन अनुसूची',
            'principal_paid': 'मूलधन भुगतान', 'interest_paid': 'ब्याज भुगतान', 'balance': 'शेष'
        },
        'health': {
            'weight': 'वजन', 'height': 'ऊंचाई', 'age': 'आयु', 'gender': 'लिंग',
            'male': 'पुरुष', 'female': 'महिला', 'bmi': 'बीएमआई', 'bmi_label': 'बॉडी मास इंडेक्स (BMI)',
            'underweight': 'कम वजन', 'normal': 'सामान्य वजन', 'overweight': 'अधिक वजन', 'obese': 'मोटापा',
            'calories': 'कैलोरी', 'bmr': 'बेसल मेटाबोलिक रेट', 'ideal_weight': 'आदर्श वजन',
            'body_fat': 'शरीर वसा %', 'waist': 'कमर', 'hip': 'कूल्हा', 'neck': 'गर्दन',
            'your_result': 'आपका परिणाम', 'health_category': 'स्वास्थ्य श्रेणी',
            'recommendation': 'सिफारिश', 'water_intake': 'पानी का सेवन'
        },
        'math': {
            'sum': 'योग', 'average': 'औसत', 'mean': 'माध्य', 'median': 'माध्यिका',
            'mode': 'बहुलक', 'std_dev': 'मानक विचलन', 'variance': 'प्रसरण',
            'square_root': 'वर्गमूल', 'power': 'घात', 'percentage': 'प्रतिशत',
            'ratio': 'अनुपात', 'area': 'क्षेत्रफल', 'perimeter': 'परिधि', 'volume': 'आयतन',
            'enter_numbers': 'संख्याएं दर्ज करें', 'comma_separated': 'अल्पविराम से अलग मान'
        },
        'tax': {
            'income': 'आय', 'gross_income': 'कुल आय', 'taxable_income': 'कर योग्य आय',
            'tax_payable': 'देय कर', 'deduction': 'कटौती', 'tax_slab': 'कर स्लैब',
            'old_regime': 'पुरानी व्यवस्था', 'new_regime': 'नई व्यवस्था', 'surcharge': 'अधिभार',
            'cess': 'सेस', 'rebate': 'छूट', 'net_tax': 'निवल कर',
            'effective_rate': 'प्रभावी कर दर', 'financial_year': 'वित्तीय वर्ष',
            'assessment_year': 'निर्धारण वर्ष'
        }
    },
    'ta': {
        'common': {
            'calculate': 'கணக்கிடு', 'reset': 'மீட்டமை', 'result': 'முடிவு', 'results': 'முடிவுகள்',
            'step_by_step': 'படிப்படியாக', 'calculation_breakdown': 'கணக்கீடு விவரம்',
            'copy_result': 'முடிவை நகலெடு', 'share': 'பகிர்', 'export': 'ஏற்றுமதி', 'print': 'அச்சிடு',
            'summary': 'சுருக்கம்', 'details': 'விவரங்கள்', 'add_row': 'வரி சேர்', 'remove': 'நீக்கு',
            'period': 'காலம்', 'amount': 'தொகை', 'enter_valid': 'சரியான மதிப்புகளை உள்ளிடவும்',
            'no_data': 'தரவு இல்லை', 'investment_analysis': 'முதலீட்டு பகுப்பாய்வு',
            'loading': 'கணக்கிடுகிறது...', 'error': 'பிழை', 'copied': 'நகலெடுக்கப்பட்டது!'
        },
        'units': {
            'years': 'ஆண்டுகள்', 'year': 'ஆண்டு', 'months': 'மாதங்கள்', 'month': 'மாதம்',
            'days': 'நாட்கள்', 'day': 'நாள்', 'percent': '%', 'per_year': 'ஆண்டுக்கு',
            'per_month': 'மாதத்திற்கு', 'kg': 'கிகி', 'lb': 'பவுண்டு',
            'cm': 'செமீ', 'ft': 'அடி', 'sqft': 'சதுர அடி', 'sqm': 'சதுர மீட்டர்'
        },
        'labels': {
            'principal': 'அசல்', 'rate': 'வீதம்', 'interest_rate': 'வட்டி வீதம்', 'amount': 'தொகை',
            'total': 'மொத்தம்', 'total_amount': 'மொத்த தொகை', 'net': 'நிகர', 'gross': 'மொத்த சகல',
            'period': 'காலம்', 'duration': 'கால அளவு', 'tenure': 'பதவிக்காலம்',
            'income': 'வருமானம்', 'expense': 'செலவு', 'profit': 'இலாபம்', 'loss': 'நஷ்டம்',
            'balance': 'இருப்பு', 'payment': 'கட்டணம்', 'investment': 'முதலீடு', 'return': 'வருவாய்',
            'revenue': 'வருவாய்', 'cost': 'செலவு', 'savings': 'சேமிப்பு', 'tax': 'வரி',
            'deduction': 'கழிவு', 'interest': 'வட்டி', 'capital': 'மூலதனம்', 'value': 'மதிப்பு',
            'initial_value': 'தொடக்க மதிப்பு', 'final_value': 'இறுதி மதிப்பு',
            'start_date': 'தொடக்க தேதி', 'end_date': 'முடிவு தேதி',
            'name': 'பெயர்', 'type': 'வகை', 'status': 'நிலை'
        },
        'business': {
            'calculation_method': 'கணக்கீட்டு முறை', 'simple_roi': 'எளிய ROI',
            'simple_roi_desc': 'அடிப்படை சதவீத வருவாய்', 'npv_analysis': 'NPV பகுப்பாய்வு',
            'npv_analysis_desc': 'பணத்தின் நேர மதிப்பு', 'cashflow_irr': 'பண ஓட்டம் (IRR)',
            'cashflow_irr_desc': 'பல காலங்கள்', 'initial_investment': 'தொடக்க முதலீடு',
            'final_value': 'இறுதி மதிப்பு', 'time_period': 'கால அளவு',
            'discount_rate': 'தள்ளுபடி வீதம்', 'cash_flows_by_period': 'காலம்வாரி பண ஓட்டம்',
            'add_period': '+ காலம் சேர்', 'rate_placeholder': 'வீதம் %',
            'calculate_roi': 'ROI கணக்கிடு', 'return_on_investment': 'முதலீட்டில் வருவாய்',
            'npv': 'NPV', 'irr': 'IRR', 'payback': 'திரும்பப் பெறும் காலம்', 'net_profit': 'நிகர இலாபம்',
            'cash_flows_analysis': 'பண ஓட்ட பகுப்பாய்வு', 'investment_not_recovered': 'முதலீடு திரும்பவில்லை',
            'payback_period': 'திரும்பப் பெறும் காலம்', 'annualized_roi': 'வருடாந்திர ROI',
            'pv_of_returns': 'வருவாயின் தற்போதைய மதிப்பு',
            'npv_positive': 'நேர்மறை NPV - முதலீடு பயனுள்ளது',
            'npv_negative': 'எதிர்மறை NPV - முதலீடு பயனுள்ளதாக இல்லாமல் போகலாம்',
            'roi_excellent': 'சிறந்த ROI - சராசரி சந்தை வருவாயை விட மிகவும் அதிகம்',
            'roi_good': 'நல்ல ROI - சந்தை சராசரிக்கு ஒப்பிடலாம்',
            'roi_moderate': 'மிதமான ROI - மாற்று முதலீடுகளை கவனியுங்கள்',
            'roi_negative': 'எதிர்மறை ROI - முதலீட்டில் நஷ்டம்',
            'npv_adds_value': 'NPV நேர்மறை - முதலீடு தற்போதைய மதிப்பில் சேர்க்கிறது',
            'npv_destroys_value': 'NPV எதிர்மறை - முதலீடு தற்போதைய மதிப்பை அழிக்கிறது',
            'irr_exceeds': 'IRR ({irr}%) தள்ளுபடி வீதத்தை ({rate}%) மீறுகிறது - திட்டம் சாத்தியமானது',
            'investment_recovered_in': 'முதலீடு {periods} காலங்களில் திரும்பியது',
            'quick_payback': 'விரைவான திரும்பிப் பெறுதல்', 'long_payback': 'நீண்ட திரும்பிப் பெறும் காலம்',
            'revenue': 'வருவாய்', 'gross_margin': 'மொத்த இலாப விகிதம்', 'net_margin': 'நிகர இலாப விகிதம்',
            'break_even_units': 'இலாப நட்ட சமத்துவ அலகுகள்', 'fixed_costs': 'நிலையான செலவுகள்',
            'clv': 'வாடிக்கையாளர் வாழ்நாள் மதிப்பு', 'monthly_revenue': 'மாதாந்திர வருவாய்',
            'annual_revenue': 'வருடாந்திர வருவாய்', 'cost_of_goods': 'பொருட்கள் செலவு',
            'operating_costs': 'செயல்பாட்டு செலவுகள்', 'break_even_revenue': 'இலாப நட்ட சமத்துவ வருவாய்',
            'variable_cost_per_unit': 'ஒரு அலகுக்கு மாறும் செலவு',
            'selling_price_per_unit': 'ஒரு அலகு விற்பனை விலை',
            'contribution_margin': 'பங்களிப்பு இலாப விகிதம்',
            'arpu': 'பயனர் ஒருவருக்கு சராசரி வருவாய்', 'churn_rate': 'வாடிக்கையாளர் இழப்பு வீதம்',
            'cac': 'வாடிக்கையாளர் கையகப்படுத்தல் செலவு'
        },
        'loan': {
            'loan_amount': 'கடன் தொகை', 'emi': 'மாதாந்திர தவணை', 'monthly_emi': 'மாதாந்திர தவணை',
            'tenure': 'கடன் காலம்', 'interest_rate': 'வட்டி வீதம் (ஆண்டுக்கு)',
            'total_interest': 'மொத்த வட்டி', 'total_payment': 'மொத்த கட்டணம்',
            'monthly_payment': 'மாதாந்திர கட்டணம்', 'principal_amount': 'அசல் தொகை',
            'home_loan': 'வீட்டு கடன்', 'car_loan': 'கார் கடன்', 'personal_loan': 'தனிப்பட்ட கடன்',
            'amortization_schedule': 'அமர்டைசேஷன் அட்டவணை'
        },
        'health': {
            'weight': 'எடை', 'height': 'உயரம்', 'age': 'வயது', 'gender': 'பாலினம்',
            'male': 'ஆண்', 'female': 'பெண்', 'bmi': 'பிஎம்ஐ', 'bmi_label': 'உடல் நிறை குறியீடு (BMI)',
            'underweight': 'குறைந்த எடை', 'normal': 'சாதாரண எடை', 'overweight': 'அதிக எடை', 'obese': 'உடல் பருமன்',
            'calories': 'கலோரி', 'ideal_weight': 'சிறந்த எடை', 'body_fat': 'உடல் கொழுப்பு %',
            'your_result': 'உங்கள் முடிவு', 'health_category': 'உடல் நல வகை',
            'recommendation': 'பரிந்துரை', 'water_intake': 'நீர் உட்கொள்ளல்'
        },
        'math': {
            'sum': 'கூட்டல்', 'average': 'சராசரி', 'mean': 'இடைநிலை', 'median': 'மையகோடு',
            'mode': 'மாதிரி', 'std_dev': 'நிலையான விலகல்', 'variance': 'மாறுபாடு',
            'square_root': 'வர்க்கமூலம்', 'percentage': 'சதவீதம்', 'ratio': 'விகிதம்',
            'area': 'பரப்பளவு', 'perimeter': 'சுற்றளவு', 'volume': 'கொள்ளளவு'
        },
        'tax': {
            'income': 'வருமானம்', 'taxable_income': 'வரிக்குரிய வருமானம்', 'tax_payable': 'செலுத்த வேண்டிய வரி',
            'deduction': 'கழிவு', 'tax_slab': 'வரி பட்டி', 'old_regime': 'பழைய திட்டம்',
            'new_regime': 'புதிய திட்டம்', 'surcharge': 'கூடுதல் கட்டணம்'
        }
    },
    'te': {
        'common': {
            'calculate': 'లెక్కించు', 'reset': 'రీసెట్', 'result': 'ఫలితం', 'results': 'ఫలితాలు',
            'step_by_step': 'దశలవారీగా', 'calculation_breakdown': 'లెక్కింపు వివరాలు',
            'copy_result': 'ఫలితాన్ని కాపీ చేయి', 'share': 'పంచుకో', 'export': 'ఎగుమతి', 'print': 'ముద్రించు',
            'summary': 'సారాంశం', 'details': 'వివరాలు', 'add_row': 'వరుస జోడించు', 'remove': 'తొలగించు',
            'period': 'కాలం', 'amount': 'మొత్తం', 'enter_valid': 'దయచేసి సరైన విలువలు నమోదు చేయండి',
            'no_data': 'డేటా లేదు', 'investment_analysis': 'పెట్టుబడి విశ్లేషణ',
            'loading': 'లెక్కిస్తున్నాం...', 'error': 'లోపం', 'copied': 'కాపీ చేయబడింది!'
        },
        'units': {
            'years': 'సంవత్సరాలు', 'year': 'సంవత్సరం', 'months': 'నెలలు', 'month': 'నెల',
            'days': 'రోజులు', 'day': 'రోజు', 'percent': '%', 'per_year': 'సంవత్సరానికి',
            'per_month': 'నెలకు', 'kg': 'కిగ్రా', 'lb': 'పౌండ్', 'cm': 'సెమీ', 'ft': 'అడుగు'
        },
        'labels': {
            'principal': 'అసలు', 'rate': 'రేటు', 'interest_rate': 'వడ్డీ రేటు', 'amount': 'మొత్తం',
            'total': 'మొత్తం', 'total_amount': 'మొత్తం సొమ్ము', 'net': 'నికర', 'gross': 'స్థూల',
            'income': 'ఆదాయం', 'expense': 'వ్యయం', 'profit': 'లాభం', 'loss': 'నష్టం',
            'payment': 'చెల్లింపు', 'investment': 'పెట్టుబడి', 'return': 'రాబడి',
            'revenue': 'ఆదాయం', 'cost': 'వ్యయం', 'savings': 'పొదుపు', 'tax': 'పన్ను',
            'interest': 'వడ్డీ', 'value': 'విలువ', 'initial_value': 'ప్రారంభ విలువ', 'final_value': 'చివరి విలువ'
        },
        'business': {
            'calculation_method': 'లెక్కింపు పద్ధతి', 'simple_roi': 'సాధారణ ROI',
            'initial_investment': 'ప్రారంభ పెట్టుబడి', 'final_value': 'చివరి విలువ',
            'time_period': 'కాల వ్యవధి', 'discount_rate': 'తగ్గింపు రేటు',
            'calculate_roi': 'ROI లెక్కించు', 'return_on_investment': 'పెట్టుబడిపై రాబడి',
            'net_profit': 'నికర లాభం', 'npv': 'NPV', 'irr': 'IRR',
            'npv_positive': 'సానుకూల NPV - పెట్టుబడి లాభదాయకం',
            'npv_negative': 'ప్రతికూల NPV - పెట్టుబడి లాభదాయకం కాకపోవచ్చు',
            'roi_excellent': 'అద్భుతమైన ROI', 'roi_good': 'మంచి ROI', 'roi_moderate': 'మధ్యస్తమైన ROI',
            'roi_negative': 'ప్రతికూల ROI - పెట్టుబడిలో నష్టం',
            'monthly_revenue': 'నెలవారీ ఆదాయం', 'annual_revenue': 'వార్షిక ఆదాయం',
            'cash_flows_analysis': 'నగదు ప్రవాహ విశ్లేషణ', 'investment_not_recovered': 'పెట్టుబడి తిరిగి రాలేదు',
            'payback_period': 'తిరిగి చెల్లింపు కాలం', 'gross_margin': 'స్థూల మార్జిన్',
            'net_margin': 'నికర మార్జిన్', 'fixed_costs': 'స్థిర వ్యయాలు'
        },
        'loan': {
            'loan_amount': 'రుణం మొత్తం', 'emi': 'EMI', 'monthly_emi': 'నెలవారీ EMI',
            'tenure': 'కాల వ్యవధి', 'interest_rate': 'వడ్డీ రేటు', 'total_interest': 'మొత్తం వడ్డీ',
            'total_payment': 'మొత్తం చెల్లింపు'
        },
        'health': {
            'weight': 'బరువు', 'height': 'ఎత్తు', 'age': 'వయస్సు', 'gender': 'లింగం',
            'male': 'పురుషుడు', 'female': 'స్త్రీ', 'bmi': 'BMI', 'bmi_label': 'శరీర ద్రవ్యరాశి సూచిక (BMI)',
            'underweight': 'తక్కువ బరువు', 'normal': 'సాధారణ బరువు', 'overweight': 'అధిక బరువు', 'obese': 'స్థూలకాయం'
        },
        'tax': {
            'income': 'ఆదాయం', 'taxable_income': 'పన్ను విధించే ఆదాయం', 'tax_payable': 'చెల్లించాల్సిన పన్ను',
            'old_regime': 'పాత విధానం', 'new_regime': 'కొత్త విధానం'
        }
    },
    'bn': {
        'common': {
            'calculate': 'গণনা করুন', 'reset': 'রিসেট', 'result': 'ফলাফল', 'results': 'ফলাফল',
            'step_by_step': 'ধাপে ধাপে', 'calculation_breakdown': 'গণনার বিবরণ',
            'copy_result': 'ফলাফল কপি করুন', 'share': 'শেয়ার করুন', 'export': 'রপ্তানি', 'print': 'প্রিন্ট',
            'summary': 'সারসংক্ষেপ', 'details': 'বিবরণ', 'add_row': 'সারি যোগ করুন', 'remove': 'সরান',
            'period': 'মেয়াদ', 'amount': 'পরিমাণ', 'enter_valid': 'দয়া করে সঠিক মান দিন',
            'investment_analysis': 'বিনিয়োগ বিশ্লেষণ', 'loading': 'গণনা হচ্ছে...', 'error': 'ত্রুটি', 'copied': 'কপি হয়েছে!'
        },
        'units': {
            'years': 'বছর', 'year': 'বছর', 'months': 'মাস', 'month': 'মাস',
            'days': 'দিন', 'day': 'দিন', 'percent': '%', 'per_year': 'প্রতি বছর', 'per_month': 'প্রতি মাস',
            'kg': 'কেজি', 'lb': 'পাউন্ড', 'cm': 'সেমি', 'ft': 'ফুট'
        },
        'labels': {
            'principal': 'মূলধন', 'rate': 'হার', 'interest_rate': 'সুদের হার', 'amount': 'পরিমাণ',
            'total': 'মোট', 'total_amount': 'মোট পরিমাণ', 'income': 'আয়', 'expense': 'ব্যয়',
            'profit': 'লাভ', 'loss': 'ক্ষতি', 'balance': 'ব্যালেন্স', 'payment': 'পেমেন্ট',
            'investment': 'বিনিয়োগ', 'return': 'রিটার্ন', 'revenue': 'রাজস্ব', 'cost': 'খরচ',
            'interest': 'সুদ', 'value': 'মান', 'initial_value': 'প্রাথমিক মান', 'final_value': 'চূড়ান্ত মান'
        },
        'business': {
            'calculation_method': 'গণনার পদ্ধতি', 'simple_roi': 'সহজ ROI',
            'initial_investment': 'প্রাথমিক বিনিয়োগ', 'final_value': 'চূড়ান্ত মান',
            'time_period': 'সময়কাল', 'discount_rate': 'ছাড়ের হার',
            'calculate_roi': 'ROI গণনা করুন', 'return_on_investment': 'বিনিয়োগে রিটার্ন',
            'net_profit': 'নিট লাভ', 'npv': 'NPV', 'irr': 'IRR',
            'roi_excellent': 'চমৎকার ROI', 'roi_good': 'ভালো ROI', 'roi_negative': 'নেতিবাচক ROI',
            'monthly_revenue': 'মাসিক রাজস্ব', 'annual_revenue': 'বার্ষিক রাজস্ব',
            'gross_margin': 'মোট মার্জিন', 'net_margin': 'নিট মার্জিন'
        },
        'loan': {
            'loan_amount': 'ঋণের পরিমাণ', 'emi': 'ইএমআই', 'monthly_emi': 'মাসিক ইএমআই',
            'tenure': 'মেয়াদ', 'interest_rate': 'সুদের হার', 'total_interest': 'মোট সুদ',
            'total_payment': 'মোট পেমেন্ট', 'amortization_schedule': 'পরিশোধের সূচী'
        },
        'health': {
            'weight': 'ওজন', 'height': 'উচ্চতা', 'age': 'বয়স', 'gender': 'লিঙ্গ',
            'male': 'পুরুষ', 'female': 'মহিলা', 'bmi': 'বিএমআই',
            'underweight': 'কম ওজন', 'normal': 'স্বাভাবিক ওজন', 'overweight': 'অতিরিক্ত ওজন', 'obese': 'স্থূলতা'
        },
        'tax': {
            'income': 'আয়', 'taxable_income': 'করযোগ্য আয়', 'tax_payable': 'প্রদেয় কর',
            'old_regime': 'পুরানো নিয়ম', 'new_regime': 'নতুন নিয়ম'
        }
    },
    'mr': {
        'common': {
            'calculate': 'गणना करा', 'reset': 'रीसेट', 'result': 'निकाल', 'results': 'निकाल',
            'step_by_step': 'पायरीपायरी', 'calculation_breakdown': 'गणना तपशील',
            'copy_result': 'निकाल कॉपी करा', 'share': 'शेअर करा', 'export': 'निर्यात', 'print': 'प्रिंट',
            'summary': 'सारांश', 'details': 'तपशील', 'add_row': 'पंक्ती जोडा', 'remove': 'काढा',
            'period': 'कालावधी', 'amount': 'रक्कम', 'enter_valid': 'कृपया योग्य मूल्ये प्रविष्ट करा',
            'investment_analysis': 'गुंतवणूक विश्लेषण', 'loading': 'गणना होत आहे...', 'error': 'त्रुटी', 'copied': 'कॉपी केले!'
        },
        'units': {
            'years': 'वर्षे', 'year': 'वर्ष', 'months': 'महिने', 'month': 'महिना',
            'days': 'दिवस', 'day': 'दिवस', 'percent': '%', 'per_year': 'प्रति वर्ष', 'per_month': 'प्रति महिना',
            'kg': 'किग्रा', 'cm': 'सेमी', 'ft': 'फूट'
        },
        'labels': {
            'principal': 'मूळ रक्कम', 'rate': 'दर', 'interest_rate': 'व्याज दर', 'amount': 'रक्कम',
            'total': 'एकूण', 'income': 'उत्पन्न', 'expense': 'खर्च', 'profit': 'नफा', 'loss': 'तोटा',
            'balance': 'शिल्लक', 'payment': 'भरणा', 'investment': 'गुंतवणूक', 'return': 'परतावा',
            'interest': 'व्याज', 'value': 'मूल्य', 'initial_value': 'प्रारंभिक मूल्य', 'final_value': 'अंतिम मूल्य'
        },
        'business': {
            'calculation_method': 'गणना पद्धत', 'simple_roi': 'साधा ROI',
            'initial_investment': 'प्रारंभिक गुंतवणूक', 'final_value': 'अंतिम मूल्य',
            'time_period': 'कालावधी', 'calculate_roi': 'ROI गणना करा',
            'return_on_investment': 'गुंतवणुकीवर परतावा', 'net_profit': 'निव्वळ नफा',
            'monthly_revenue': 'मासिक महसूल', 'annual_revenue': 'वार्षिक महसूल',
            'gross_margin': 'सकल मार्जिन', 'net_margin': 'निव्वळ मार्जिन'
        },
        'loan': {
            'loan_amount': 'कर्ज रक्कम', 'emi': 'ईएमआय', 'monthly_emi': 'मासिक ईएमआय',
            'tenure': 'कार्यकाल', 'interest_rate': 'व्याज दर', 'total_interest': 'एकूण व्याज',
            'total_payment': 'एकूण भरणा'
        },
        'health': {
            'weight': 'वजन', 'height': 'उंची', 'age': 'वय', 'gender': 'लिंग',
            'male': 'पुरुष', 'female': 'महिला', 'bmi': 'बीएमआय',
            'underweight': 'कमी वजन', 'normal': 'सामान्य वजन', 'overweight': 'जास्त वजन', 'obese': 'लठ्ठपणा'
        },
        'tax': {
            'income': 'उत्पन्न', 'taxable_income': 'करपात्र उत्पन्न', 'tax_payable': 'देय कर',
            'old_regime': 'जुनी पद्धत', 'new_regime': 'नवीन पद्धत'
        }
    },
    'gu': {
        'common': {
            'calculate': 'ગણતરી કરો', 'reset': 'રીસેટ', 'result': 'પરિણામ', 'results': 'પરિણામો',
            'step_by_step': 'પગલું-દ-પગલું', 'calculation_breakdown': 'ગણતરી વિગત',
            'copy_result': 'પરિણામ કૉપિ કરો', 'share': 'શેર કરો', 'export': 'નિકાસ', 'print': 'પ્રિન્ટ',
            'summary': 'સારાંશ', 'details': 'વિગત', 'add_row': 'પંક્તિ ઉમેરો', 'remove': 'દૂર કરો',
            'period': 'સમયગાળો', 'amount': 'રકમ', 'enter_valid': 'કૃપા કરી સાચા મૂલ્યો દાખલ કરો',
            'investment_analysis': 'રોકાણ વિશ્લેષણ', 'loading': 'ગણતરી ચાલુ છે...', 'error': 'ભૂલ', 'copied': 'કૉપિ થઈ!'
        },
        'units': {
            'years': 'વર્ષ', 'year': 'વર્ષ', 'months': 'મહિના', 'month': 'મહિનો',
            'days': 'દિવસ', 'day': 'દિવસ', 'percent': '%', 'per_year': 'દર વર્ષ', 'per_month': 'દર મહિને',
            'kg': 'કિગ્રા', 'cm': 'સેમી', 'ft': 'ફૂટ'
        },
        'labels': {
            'principal': 'મૂળ રકમ', 'rate': 'દર', 'interest_rate': 'વ્યાજ દર', 'amount': 'રકમ',
            'total': 'કુલ', 'income': 'આવક', 'expense': 'ખર્ચ', 'profit': 'નફો', 'loss': 'નુકસાન',
            'balance': 'બાકી', 'payment': 'ભુગતાન', 'investment': 'રોકાણ', 'return': 'વળતર',
            'interest': 'વ્યાજ', 'value': 'મૂલ્ય', 'initial_value': 'પ્રારંભિક મૂલ્ય', 'final_value': 'અંતિમ મૂલ્ય'
        },
        'business': {
            'calculation_method': 'ગણતરી પદ્ધતિ', 'simple_roi': 'સાદો ROI',
            'initial_investment': 'પ્રારંભિક રોકાણ', 'final_value': 'અંતિમ મૂલ્ય',
            'time_period': 'સમયગાળો', 'calculate_roi': 'ROI ગણો',
            'return_on_investment': 'રોકાણ પર વળતર', 'net_profit': 'ચોખ્ખો નફો',
            'monthly_revenue': 'માસિક આવક', 'annual_revenue': 'વાર્ષિક આવક',
            'gross_margin': 'કુલ માર્જિન', 'net_margin': 'ચોખ્ખો માર્જિન'
        },
        'loan': {
            'loan_amount': 'ઋણ રકમ', 'emi': 'ઇએમઆઇ', 'monthly_emi': 'માસિક ઇએમઆઇ',
            'tenure': 'સમયગાળો', 'interest_rate': 'વ્યાજ દર', 'total_interest': 'કુલ વ્યાજ'
        },
        'health': {
            'weight': 'વજન', 'height': 'ઊંચાઈ', 'age': 'ઉંમર', 'gender': 'જાતિ',
            'male': 'પુરુષ', 'female': 'સ્ત્રી', 'bmi': 'બીએમઆઇ',
            'underweight': 'ઓછું વજન', 'normal': 'સામાન્ય વજન', 'overweight': 'વધારે વજન', 'obese': 'સ્થૂળતા'
        },
        'tax': {
            'income': 'આવક', 'taxable_income': 'કરપાત્ર આવક', 'tax_payable': 'ચૂકવવાનો કર',
            'old_regime': 'જૂની પ્રણાલી', 'new_regime': 'નવી પ્રણાલી'
        }
    },
    'ar': {
        'common': {
            'calculate': 'احسب', 'reset': 'إعادة تعيين', 'result': 'النتيجة', 'results': 'النتائج',
            'step_by_step': 'خطوة بخطوة', 'calculation_breakdown': 'تفصيل الحساب',
            'copy_result': 'نسخ النتيجة', 'share': 'مشاركة', 'export': 'تصدير', 'print': 'طباعة',
            'summary': 'ملخص', 'details': 'تفاصيل', 'add_row': 'إضافة صف', 'remove': 'إزالة',
            'period': 'فترة', 'amount': 'مبلغ', 'enter_valid': 'يرجى إدخال قيم صحيحة',
            'investment_analysis': 'تحليل الاستثمار', 'loading': 'جاري الحساب...', 'error': 'خطأ', 'copied': 'تم النسخ!'
        },
        'units': {
            'years': 'سنوات', 'year': 'سنة', 'months': 'أشهر', 'month': 'شهر',
            'days': 'أيام', 'day': 'يوم', 'percent': '%', 'per_year': 'في السنة', 'per_month': 'في الشهر',
            'kg': 'كجم', 'cm': 'سم', 'ft': 'قدم'
        },
        'labels': {
            'principal': 'رأس المال', 'rate': 'المعدل', 'interest_rate': 'معدل الفائدة', 'amount': 'المبلغ',
            'total': 'المجموع', 'income': 'الدخل', 'expense': 'النفقة', 'profit': 'الربح', 'loss': 'الخسارة',
            'balance': 'الرصيد', 'payment': 'الدفعة', 'investment': 'الاستثمار', 'return': 'العائد',
            'interest': 'الفائدة', 'value': 'القيمة', 'initial_value': 'القيمة الأولية', 'final_value': 'القيمة النهائية'
        },
        'business': {
            'calculation_method': 'طريقة الحساب', 'simple_roi': 'عائد الاستثمار البسيط',
            'initial_investment': 'الاستثمار الأولي', 'final_value': 'القيمة النهائية',
            'time_period': 'الفترة الزمنية', 'discount_rate': 'معدل الخصم',
            'calculate_roi': 'احسب عائد الاستثمار', 'return_on_investment': 'العائد على الاستثمار',
            'net_profit': 'صافي الربح', 'npv': 'صافي القيمة الحالية', 'irr': 'معدل العائد الداخلي',
            'npv_positive': 'صافي القيمة الحالية إيجابي - الاستثمار مجدٍ',
            'npv_negative': 'صافي القيمة الحالية سلبي - قد لا يكون الاستثمار مجدياً',
            'roi_excellent': 'عائد ممتاز', 'roi_good': 'عائد جيد', 'roi_negative': 'عائد سلبي - خسارة',
            'gross_margin': 'هامش الربح الإجمالي', 'net_margin': 'صافي الهامش',
            'monthly_revenue': 'الإيرادات الشهرية', 'annual_revenue': 'الإيرادات السنوية'
        },
        'loan': {
            'loan_amount': 'مبلغ القرض', 'emi': 'القسط الشهري', 'monthly_emi': 'القسط الشهري',
            'tenure': 'مدة القرض', 'interest_rate': 'معدل الفائدة', 'total_interest': 'إجمالي الفائدة',
            'total_payment': 'إجمالي الدفعات'
        },
        'health': {
            'weight': 'الوزن', 'height': 'الطول', 'age': 'العمر', 'gender': 'الجنس',
            'male': 'ذكر', 'female': 'أنثى', 'bmi': 'مؤشر كتلة الجسم',
            'underweight': 'نقص الوزن', 'normal': 'وزن طبيعي', 'overweight': 'زيادة الوزن', 'obese': 'سمنة'
        },
        'tax': {
            'income': 'الدخل', 'taxable_income': 'الدخل الخاضع للضريبة', 'tax_payable': 'الضريبة المستحقة'
        }
    },
    'ur': {
        'common': {
            'calculate': 'حساب کریں', 'reset': 'ری سیٹ', 'result': 'نتیجہ', 'results': 'نتائج',
            'step_by_step': 'قدم بہ قدم', 'calculation_breakdown': 'حساب کی تفصیل',
            'copy_result': 'نتیجہ کاپی کریں', 'share': 'شیئر کریں', 'export': 'برآمد', 'print': 'پرنٹ',
            'summary': 'خلاصہ', 'details': 'تفصیلات', 'add_row': 'قطار شامل کریں', 'remove': 'ہٹائیں',
            'period': 'مدت', 'amount': 'رقم', 'enter_valid': 'براہ کرم درست اقدار درج کریں',
            'investment_analysis': 'سرمایہ کاری تجزیہ', 'loading': 'حساب ہو رہا ہے...', 'error': 'خرابی', 'copied': 'کاپی ہو گیا!'
        },
        'units': {
            'years': 'سال', 'year': 'سال', 'months': 'مہینے', 'month': 'مہینہ',
            'days': 'دن', 'day': 'دن', 'percent': '%', 'per_year': 'فی سال', 'per_month': 'فی مہینہ',
            'kg': 'کلوگرام', 'cm': 'سینٹی میٹر', 'ft': 'فٹ'
        },
        'labels': {
            'principal': 'اصل رقم', 'rate': 'شرح', 'interest_rate': 'سود کی شرح', 'amount': 'رقم',
            'total': 'کل', 'income': 'آمدنی', 'expense': 'اخراجات', 'profit': 'منافع', 'loss': 'نقصان',
            'balance': 'بقیہ', 'payment': 'ادائیگی', 'investment': 'سرمایہ کاری', 'return': 'منافع',
            'interest': 'سود', 'value': 'قدر', 'initial_value': 'ابتدائی قدر', 'final_value': 'آخری قدر'
        },
        'business': {
            'calculation_method': 'حساب کا طریقہ', 'simple_roi': 'سادہ ROI',
            'initial_investment': 'ابتدائی سرمایہ کاری', 'final_value': 'آخری قدر',
            'time_period': 'وقت کی مدت', 'discount_rate': 'رعایتی شرح',
            'calculate_roi': 'ROI حساب کریں', 'return_on_investment': 'سرمایہ کاری پر منافع',
            'net_profit': 'خالص منافع', 'npv': 'خالص موجودہ قدر', 'irr': 'داخلی منافع کی شرح',
            'gross_margin': 'مجموعی مارجن', 'monthly_revenue': 'ماہانہ آمدنی', 'annual_revenue': 'سالانہ آمدنی'
        },
        'loan': {
            'loan_amount': 'قرض کی رقم', 'emi': 'ماہانہ قسط', 'monthly_emi': 'ماہانہ قسط',
            'tenure': 'مدت', 'interest_rate': 'سود کی شرح', 'total_interest': 'کل سود'
        },
        'health': {
            'weight': 'وزن', 'height': 'قد', 'age': 'عمر', 'gender': 'جنس',
            'male': 'مرد', 'female': 'عورت', 'bmi': 'باڈی ماس انڈیکس',
            'underweight': 'کم وزن', 'normal': 'معمول کا وزن', 'overweight': 'زیادہ وزن', 'obese': 'موٹاپا'
        },
        'tax': {
            'income': 'آمدنی', 'taxable_income': 'قابل ٹیکس آمدنی', 'tax_payable': 'ادا کرنے کا ٹیکس'
        }
    },
    'es': {
        'common': {
            'calculate': 'Calcular', 'reset': 'Restablecer', 'result': 'Resultado', 'results': 'Resultados',
            'step_by_step': 'Paso a paso', 'calculation_breakdown': 'Desglose de cálculo',
            'copy_result': 'Copiar resultado', 'share': 'Compartir', 'export': 'Exportar', 'print': 'Imprimir',
            'summary': 'Resumen', 'details': 'Detalles', 'add_row': 'Agregar fila', 'remove': 'Eliminar',
            'period': 'Período', 'amount': 'Monto', 'enter_valid': 'Por favor ingrese valores válidos',
            'investment_analysis': 'Análisis de inversión', 'loading': 'Calculando...', 'error': 'Error', 'copied': '¡Copiado!'
        },
        'units': {
            'years': 'años', 'year': 'año', 'months': 'meses', 'month': 'mes',
            'days': 'días', 'day': 'día', 'percent': '%', 'per_year': 'por año', 'per_month': 'por mes',
            'kg': 'kg', 'cm': 'cm', 'ft': 'pies'
        },
        'labels': {
            'principal': 'Capital', 'rate': 'Tasa', 'interest_rate': 'Tasa de interés', 'amount': 'Monto',
            'total': 'Total', 'income': 'Ingresos', 'expense': 'Gasto', 'profit': 'Beneficio', 'loss': 'Pérdida',
            'balance': 'Saldo', 'payment': 'Pago', 'investment': 'Inversión', 'return': 'Retorno',
            'interest': 'Interés', 'value': 'Valor', 'initial_value': 'Valor inicial', 'final_value': 'Valor final'
        },
        'business': {
            'calculation_method': 'Método de cálculo', 'simple_roi': 'ROI simple',
            'initial_investment': 'Inversión inicial', 'final_value': 'Valor final',
            'time_period': 'Período de tiempo', 'discount_rate': 'Tasa de descuento',
            'calculate_roi': 'Calcular ROI', 'return_on_investment': 'Retorno de inversión',
            'net_profit': 'Ganancia neta', 'npv': 'VAN', 'irr': 'TIR',
            'npv_positive': 'VAN positivo - la inversión es rentable',
            'npv_negative': 'VAN negativo - la inversión puede no ser rentable',
            'roi_excellent': 'ROI excelente', 'roi_good': 'Buen ROI', 'roi_negative': 'ROI negativo - pérdida',
            'gross_margin': 'Margen bruto', 'net_margin': 'Margen neto',
            'monthly_revenue': 'Ingresos mensuales', 'annual_revenue': 'Ingresos anuales'
        },
        'loan': {
            'loan_amount': 'Monto del préstamo', 'emi': 'Cuota mensual', 'tenure': 'Plazo',
            'interest_rate': 'Tasa de interés', 'total_interest': 'Interés total', 'total_payment': 'Pago total'
        },
        'health': {
            'weight': 'Peso', 'height': 'Altura', 'age': 'Edad', 'gender': 'Género',
            'male': 'Masculino', 'female': 'Femenino', 'bmi': 'IMC',
            'underweight': 'Bajo peso', 'normal': 'Peso normal', 'overweight': 'Sobrepeso', 'obese': 'Obesidad'
        },
        'tax': {
            'income': 'Ingresos', 'taxable_income': 'Ingreso imponible', 'tax_payable': 'Impuesto a pagar'
        }
    },
    'pt': {
        'common': {
            'calculate': 'Calcular', 'reset': 'Redefinir', 'result': 'Resultado', 'results': 'Resultados',
            'step_by_step': 'Passo a passo', 'copy_result': 'Copiar resultado', 'share': 'Compartilhar',
            'summary': 'Resumo', 'details': 'Detalhes', 'period': 'Período', 'amount': 'Valor',
            'investment_analysis': 'Análise de investimento', 'loading': 'Calculando...', 'error': 'Erro', 'copied': 'Copiado!'
        },
        'units': { 'years': 'anos', 'year': 'ano', 'months': 'meses', 'month': 'mês', 'days': 'dias', 'day': 'dia', 'percent': '%', 'per_year': 'por ano', 'per_month': 'por mês', 'kg': 'kg', 'cm': 'cm' },
        'labels': { 'principal': 'Principal', 'rate': 'Taxa', 'amount': 'Valor', 'total': 'Total', 'income': 'Renda', 'profit': 'Lucro', 'loss': 'Perda', 'investment': 'Investimento', 'interest': 'Juros' },
        'business': {
            'initial_investment': 'Investimento inicial', 'final_value': 'Valor final', 'calculate_roi': 'Calcular ROI',
            'return_on_investment': 'Retorno sobre o investimento', 'net_profit': 'Lucro líquido',
            'gross_margin': 'Margem bruta', 'monthly_revenue': 'Receita mensal', 'annual_revenue': 'Receita anual'
        },
        'loan': { 'loan_amount': 'Valor do empréstimo', 'emi': 'Parcela mensal', 'tenure': 'Prazo', 'total_interest': 'Total de juros', 'total_payment': 'Pagamento total' },
        'health': { 'weight': 'Peso', 'height': 'Altura', 'age': 'Idade', 'male': 'Masculino', 'female': 'Feminino', 'bmi': 'IMC', 'underweight': 'Abaixo do peso', 'normal': 'Peso normal', 'overweight': 'Acima do peso', 'obese': 'Obeso' },
        'tax': { 'income': 'Renda', 'taxable_income': 'Renda tributável', 'tax_payable': 'Imposto a pagar' }
    },
    'fr': {
        'common': {
            'calculate': 'Calculer', 'reset': 'Réinitialiser', 'result': 'Résultat', 'results': 'Résultats',
            'step_by_step': 'Étape par étape', 'copy_result': 'Copier le résultat', 'share': 'Partager',
            'summary': 'Résumé', 'details': 'Détails', 'period': 'Période', 'amount': 'Montant',
            'investment_analysis': "Analyse d'investissement", 'loading': 'Calcul en cours...', 'error': 'Erreur', 'copied': 'Copié!'
        },
        'units': { 'years': 'ans', 'year': 'an', 'months': 'mois', 'month': 'mois', 'days': 'jours', 'day': 'jour', 'percent': '%', 'per_year': 'par an', 'per_month': 'par mois', 'kg': 'kg', 'cm': 'cm' },
        'labels': { 'principal': 'Capital', 'rate': 'Taux', 'amount': 'Montant', 'total': 'Total', 'income': 'Revenu', 'profit': 'Bénéfice', 'loss': 'Perte', 'investment': 'Investissement', 'interest': 'Intérêt' },
        'business': {
            'initial_investment': 'Investissement initial', 'final_value': 'Valeur finale', 'calculate_roi': 'Calculer le ROI',
            'return_on_investment': 'Retour sur investissement', 'net_profit': 'Bénéfice net',
            'gross_margin': 'Marge brute', 'monthly_revenue': 'Revenus mensuels', 'annual_revenue': 'Revenus annuels'
        },
        'loan': { 'loan_amount': 'Montant du prêt', 'emi': 'Mensualité', 'tenure': 'Durée', 'total_interest': 'Intérêts totaux', 'total_payment': 'Paiement total' },
        'health': { 'weight': 'Poids', 'height': 'Taille', 'age': 'Âge', 'male': 'Homme', 'female': 'Femme', 'bmi': 'IMC', 'underweight': 'Insuffisance pondérale', 'normal': 'Poids normal', 'overweight': 'Surpoids', 'obese': 'Obésité' },
        'tax': { 'income': 'Revenu', 'taxable_income': 'Revenu imposable', 'tax_payable': 'Impôt à payer' }
    },
    'de': {
        'common': {
            'calculate': 'Berechnen', 'reset': 'Zurücksetzen', 'result': 'Ergebnis', 'results': 'Ergebnisse',
            'step_by_step': 'Schritt für Schritt', 'copy_result': 'Ergebnis kopieren', 'share': 'Teilen',
            'summary': 'Zusammenfassung', 'details': 'Details', 'period': 'Zeitraum', 'amount': 'Betrag',
            'investment_analysis': 'Investitionsanalyse', 'loading': 'Berechnung läuft...', 'error': 'Fehler', 'copied': 'Kopiert!'
        },
        'units': { 'years': 'Jahre', 'year': 'Jahr', 'months': 'Monate', 'month': 'Monat', 'days': 'Tage', 'day': 'Tag', 'percent': '%', 'per_year': 'pro Jahr', 'per_month': 'pro Monat', 'kg': 'kg', 'cm': 'cm' },
        'labels': { 'principal': 'Kapital', 'rate': 'Zinssatz', 'amount': 'Betrag', 'total': 'Gesamt', 'income': 'Einkommen', 'profit': 'Gewinn', 'loss': 'Verlust', 'investment': 'Investition', 'interest': 'Zinsen' },
        'business': {
            'initial_investment': 'Anfangsinvestition', 'final_value': 'Endwert', 'calculate_roi': 'ROI berechnen',
            'return_on_investment': 'Kapitalrendite', 'net_profit': 'Nettogewinn',
            'gross_margin': 'Bruttomarge', 'monthly_revenue': 'Monatlicher Umsatz', 'annual_revenue': 'Jahresumsatz'
        },
        'loan': { 'loan_amount': 'Kreditbetrag', 'emi': 'Monatliche Rate', 'tenure': 'Laufzeit', 'total_interest': 'Gesamtzinsen', 'total_payment': 'Gesamtzahlung' },
        'health': { 'weight': 'Gewicht', 'height': 'Größe', 'age': 'Alter', 'male': 'Männlich', 'female': 'Weiblich', 'bmi': 'BMI', 'underweight': 'Untergewicht', 'normal': 'Normalgewicht', 'overweight': 'Übergewicht', 'obese': 'Adipositas' },
        'tax': { 'income': 'Einkommen', 'taxable_income': 'Steuerpflichtiges Einkommen', 'tax_payable': 'Zu zahlende Steuer' }
    },
    'id': {
        'common': {
            'calculate': 'Hitung', 'reset': 'Atur Ulang', 'result': 'Hasil', 'results': 'Hasil',
            'step_by_step': 'Langkah demi langkah', 'copy_result': 'Salin Hasil', 'share': 'Bagikan',
            'summary': 'Ringkasan', 'details': 'Detail', 'period': 'Periode', 'amount': 'Jumlah',
            'investment_analysis': 'Analisis Investasi', 'loading': 'Menghitung...', 'error': 'Kesalahan', 'copied': 'Disalin!'
        },
        'units': { 'years': 'tahun', 'year': 'tahun', 'months': 'bulan', 'month': 'bulan', 'days': 'hari', 'day': 'hari', 'percent': '%', 'per_year': 'per tahun', 'per_month': 'per bulan', 'kg': 'kg', 'cm': 'cm' },
        'labels': { 'principal': 'Pokok', 'rate': 'Tingkat', 'amount': 'Jumlah', 'total': 'Total', 'income': 'Pendapatan', 'profit': 'Keuntungan', 'loss': 'Kerugian', 'investment': 'Investasi', 'interest': 'Bunga' },
        'business': {
            'initial_investment': 'Investasi awal', 'final_value': 'Nilai akhir', 'calculate_roi': 'Hitung ROI',
            'return_on_investment': 'Return on Investment', 'net_profit': 'Laba bersih',
            'gross_margin': 'Margin kotor', 'monthly_revenue': 'Pendapatan bulanan', 'annual_revenue': 'Pendapatan tahunan'
        },
        'loan': { 'loan_amount': 'Jumlah pinjaman', 'emi': 'Cicilan bulanan', 'tenure': 'Jangka waktu', 'total_interest': 'Total bunga', 'total_payment': 'Total pembayaran' },
        'health': { 'weight': 'Berat', 'height': 'Tinggi', 'age': 'Usia', 'male': 'Laki-laki', 'female': 'Perempuan', 'bmi': 'BMI', 'underweight': 'Berat badan kurang', 'normal': 'Berat badan normal', 'overweight': 'Kelebihan berat badan', 'obese': 'Obesitas' },
        'tax': { 'income': 'Pendapatan', 'taxable_income': 'Penghasilan kena pajak', 'tax_payable': 'Pajak terutang' }
    },
    'ja': {
        'common': {
            'calculate': '計算する', 'reset': 'リセット', 'result': '結果', 'results': '結果',
            'step_by_step': 'ステップバイステップ', 'copy_result': '結果をコピー', 'share': '共有',
            'summary': '概要', 'details': '詳細', 'period': '期間', 'amount': '金額',
            'investment_analysis': '投資分析', 'loading': '計算中...', 'error': 'エラー', 'copied': 'コピーしました!'
        },
        'units': { 'years': '年', 'year': '年', 'months': 'ヶ月', 'month': 'ヶ月', 'days': '日', 'day': '日', 'percent': '%', 'per_year': '年間', 'per_month': '月間', 'kg': 'kg', 'cm': 'cm' },
        'labels': { 'principal': '元金', 'rate': 'レート', 'amount': '金額', 'total': '合計', 'income': '収入', 'profit': '利益', 'loss': '損失', 'investment': '投資', 'interest': '利息' },
        'business': {
            'initial_investment': '初期投資', 'final_value': '最終価値', 'calculate_roi': 'ROIを計算',
            'return_on_investment': '投資収益率', 'net_profit': '純利益',
            'gross_margin': '売上総利益率', 'monthly_revenue': '月間収益', 'annual_revenue': '年間収益'
        },
        'loan': { 'loan_amount': 'ローン金額', 'emi': '月々の支払い', 'tenure': '期間', 'total_interest': '総利息', 'total_payment': '総支払額' },
        'health': { 'weight': '体重', 'height': '身長', 'age': '年齢', 'male': '男性', 'female': '女性', 'bmi': 'BMI', 'underweight': '低体重', 'normal': '普通体重', 'overweight': '過体重', 'obese': '肥満' },
        'tax': { 'income': '収入', 'taxable_income': '課税所得', 'tax_payable': '納税額' }
    }
}

for lang_code, calc_translations in translations_map.items():
    filepath = os.path.join(locale_dir, f'{lang_code}.json')
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    data['calculators'] = calc_translations
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print(f'Updated {lang_code}.json')

print('All done!')
