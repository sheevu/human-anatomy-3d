export const organs = {
  brain: {
    en: 'Brain & Nervous System',
    hi: 'मस्तिष्क व तंत्रिका तंत्र',
    color: '#d5a99c',
    description: [
      'Coordinates thinking, hormonal signals, mood, sleep, and involuntary functions like heart rate and respiration.',
      'विचार, हार्मोनल संकेत, मनोदशा, नींद और हृदय गति जैसे महत्वपूर्ण कार्यों का समन्वय करता है।'
    ],
    markers: ['TSH', 'Vitamin B12', 'Cortisol', 'Vitamin D3'],
    care: {
      en: {
        cure: 'Maintain balanced endocrine health, restful sleep cycle, and neuroprotective nutrition.',
        foodsToEat: ['Walnuts, flaxseeds (Omega-3)', 'Green leafy vegetables', 'Berries and citrus fruits', 'Herbal calming teas (Chamomile, Ashwagandha)'],
        foodsToAvoid: ['Excessive caffeine and energy drinks', 'Refined sugars and processed snacks', 'Artificial sweeteners and trans fats'],
        lifestyle: ['7-8 hours uninterrupted sleep', 'Daily 15-20 min meditation or Pranayama', 'Regular cognitive exercises (reading, puzzles)'],
        doctorQuestions: ['Could thyroid or hormonal imbalances cause these symptoms?', 'Should I check my Vitamin B12 and Vitamin D levels?']
      },
      hi: {
        cure: 'संतुलित हार्मोनल स्वास्थ्य, पर्याप्त नींद और तंत्रिका-सुरक्षात्मक आहार बनाए रखें।',
        foodsToEat: ['अखरोट, अलसी (ओमेगा-3)', 'हरी पत्तेदार सब्जियां', 'जामुन, आंवला और खट्टे फल', 'अश्वगंधा व हर्बल चाय'],
        foodsToAvoid: ['अत्यधिक कैफीन व एनर्जी ड्रिंक्स', 'रिफाइंड चीनी व जंक फूड', 'ट्रांस फैट युक्त प्रोसेस्ड स्नैक्स'],
        lifestyle: ['7-8 घंटे की गहरी नींद', 'दैनिक 15-20 मिनट ध्यान या प्राणायाम', 'नियमित मानसिक व रचनात्मक अभ्यास'],
        doctorQuestions: ['क्या थायराइड या हार्मोनल असंतुलन से यह समस्या हो सकती है?', 'क्या मुझे विटामिन B12 और D की अतिरिक्त जांच करानी चाहिए?']
      }
    }
  },
  heart: {
    en: 'Heart & Cardiovascular',
    hi: 'हृदय व रक्त वाहिकाएं',
    color: '#d95d62',
    description: [
      'Pumps oxygen-rich blood throughout the body. Lipid profiles help assess cardiovascular and endothelial health.',
      'पूरे शरीर में ऑक्सीजन युक्त रक्त पंप करता है। लिपिड प्रोफाइल हृदय और रक्त वाहिकाओं के स्वास्थ्य का मूल्यांकन करता है।'
    ],
    markers: ['Total Cholesterol', 'LDL', 'HDL', 'Triglycerides', 'VLDL', 'Blood Pressure'],
    care: {
      en: {
        cure: 'Target optimal blood pressure and lipid balance through heart-healthy fats, cardio exercise, and sodium restriction.',
        foodsToEat: ['Oats, barley and soluble fibers', 'Garlic, olive oil and mustard oil', 'Fatty fish or chia seeds', 'Fresh salads and pomegranate'],
        foodsToAvoid: ['Deep-fried foods and hydrogenated oils (Dalda/Vanaspati)', 'Red meat and full-fat dairy', 'Excess salt and processed sodium'],
        lifestyle: ['30-45 minutes brisk walking daily', 'Stress reduction through gentle yoga', 'Strictly avoid smoking and tobacco'],
        doctorQuestions: ['What is my target LDL level?', 'Do I need an ECG, ECHO, or cardiac consultation?']
      },
      hi: {
        cure: 'हृदय-सुरक्षात्मक वसा, नियमित कार्डियो व्यायाम और नमक की कमी से रक्तचाप और लिपिड को संतुलित रखें।',
        foodsToEat: ['ओट्स, जौ और फाइबर युक्त खाद्य', 'लहसुन, जैतून या सरसों का तेल', 'चिया बीज, अलसी और अखरोट', 'ताजा सलाद, अनार और हरी सब्जियां'],
        foodsToAvoid: ['तले हुए भोजन और वनस्पति घी', 'अधिक वसायुक्त मांस व क्रीम', 'अत्यधिक नमक और पैकेज्ड नमकीन'],
        lifestyle: ['रोजाना 30-45 मिनट तेज चाल में टहलना', 'तनाव प्रबंधन हेतु योग व श्वास अभ्यास', 'धूम्रपान और तंबाकू से पूर्ण परहेज'],
        doctorQuestions: ['मेरा लक्षित एलडीएल (LDL) स्तर क्या होना चाहिए?', 'क्या मुझे ईसीजी या हृदय रोग विशेषज्ञ की सलाह चाहिए?']
      }
    }
  },
  lungs: {
    en: 'Lungs & Respiratory',
    hi: 'फेफड़े व श्वसन तंत्र',
    color: '#d6a0ac',
    description: [
      'Facilitates vital oxygen intake and carbon dioxide release across alveolar surfaces.',
      'सांस लेते समय ऑक्सीजन ग्रहण करने और कार्बन डाइऑक्साइड बाहर निकालने का कार्य करते हैं।'
    ],
    markers: ['SpO2', 'Oxygen Saturation', 'Respiratory Rate', 'ESR'],
    care: {
      en: {
        cure: 'Preserve airway elasticity, reduce inflammation, and enhance lung capacity through deep breathing exercises.',
        foodsToEat: ['Ginger, turmeric, and black pepper', 'Vitamin C-rich fruits (amla, oranges, kiwi)', 'Warm herbal decoctions (Kadha)', 'Broccoli and leafy greens'],
        foodsToAvoid: ['Ice-cold refrigerated beverages', 'Heavy greasy foods in damp weather', 'Exposure to indoor and outdoor smoke'],
        lifestyle: ['Daily deep breathing (Anulom-Vilom, Bhastrika)', 'Use air purifiers in dusty/polluted environments', 'Regular aerobic exercise'],
        doctorQuestions: ['Should I get a Spirometry (PFT) or chest X-ray?', 'Could allergens or pollution be affecting my lung function?']
      },
      hi: {
        cure: 'फेफड़ों की क्षमता बढ़ाने और सूजन कम करने के लिए प्राणायाम और एंटीऑक्सीडेंट युक्त आहार अपनाएं।',
        foodsToEat: ['अदरक, हल्दी, और काली मिर्च', 'विटामिन सी युक्त फल (आंवला, संतरा, कीवी)', 'हल्का गुनगुना काढ़ा व ग्रीन टी', 'हरी पत्तेदार सब्जियां'],
        foodsToAvoid: ['अत्यधिक ठंडा पानी व कोल्ड ड्रिंक्स', 'धुआं, प्रदूषण और धूल-मिट्टी', 'अत्यधिक तली-भुनी चीजें'],
        lifestyle: ['अनुलोम-विलोम और भस्त्रिका प्राणायाम', 'प्रदूषण से बचाव हेतु मास्क का उपयोग', 'स्वच्छ व हवादार वातावरण में रहना'],
        doctorQuestions: ['क्या मुझे स्पायरोमेट्री (PFT) या फेफड़ों की जांच करानी चाहिए?', 'क्या यह समस्या एलर्जी या वायु प्रदूषण से जुड़ी है?']
      }
    }
  },
  liver: {
    en: 'Liver & Metabolism',
    hi: 'यकृत (लिवर) व उपापचय',
    color: '#a45854',
    description: [
      'Central metabolic hub that filters toxins, produces digestive bile, and synthesizes critical blood proteins.',
      'शरीर का प्रमुख अंग जो विषैले तत्वों को साफ करता है, पाचक पित्त बनाता है और आवश्यक प्रोटीन संश्लेषित करता है।'
    ],
    markers: ['SGPT (ALT)', 'SGOT (AST)', 'Bilirubin', 'Alkaline Phosphatase', 'GGT'],
    care: {
      en: {
        cure: 'Reverse fatty accumulation and enzyme elevations with low-glycemic, antioxidant-rich foods and zero alcohol.',
        foodsToEat: ['Papaya, beets, and cruciferous vegetables', 'Green tea and lemon water in morning', 'Turmeric and milk thistle', 'High fiber legumes'],
        foodsToAvoid: ['Alcohol in any amount', 'Fructose syrups and sweetened beverages', 'Deep-fried, ultra-processed restaurant foods'],
        lifestyle: ['Maintain steady weight loss (5-7% if overweight)', 'At least 150 minutes of moderate activity weekly', 'Avoid self-medication with unnecessary painkillers'],
        doctorQuestions: ['Do my liver enzyme levels indicate fatty liver (NAFLD)?', 'Would an ultrasound of the abdomen or FibroScan be helpful?']
      },
      hi: {
        cure: 'लिवर एंजाइम और फैटी लिवर को नियंत्रित करने के लिए डिटॉक्सिफाइंग आहार, वजन नियंत्रण और शराब से दूरी जरूरी है।',
        foodsToEat: ['पपीता, चुकंदर और ब्रोकली/पत्तागोभी', 'सुबह गुनगुना नींबू पानी और ग्रीन टी', 'हल्दी और फाइबर युक्त दालें', 'लहसुन और सेब का सिरका (सीमित)'],
        foodsToAvoid: ['शराब (अल्कोहल) का पूर्ण त्याग', 'मीठे पेय व अतिरिक्त फ्रुक्टोज', 'बासी, तला हुआ और अत्यधिक मसालेदार भोजन'],
        lifestyle: ['वजन को धीरे-धीरे संतुलित करें (5-7% कमी)', 'सप्ताह में कम से कम 150 मिनट व्यायाम', 'बिना डॉक्टर की सलाह के दर्द निवारक दवाइयां न लें'],
        doctorQuestions: ['क्या बढ़े हुए एंजाइम फैटी लिवर का संकेत हैं?', 'क्या पेट का अल्ट्रासाउंड या फाइब्रोस्कैन करवाना उचित रहेगा?']
      }
    }
  },
  kidneys: {
    en: 'Kidneys & Renal Filtration',
    hi: 'गुर्दे (किडनी) व उत्सर्जन तंत्र',
    color: '#b57065',
    description: [
      'Filter approximately 200 quarts of fluid daily, balancing electrolytes, fluid volume, and clearing metabolic waste like urea and creatinine.',
      'प्रतिदिन रक्त को छानकर अपशिष्ट पदार्थों (क्रिएटिनिन, यूरिया) को मूत्र के रूप में बाहर निकालते हैं और खनिज संतुलन बनाए रखते हैं।'
    ],
    markers: ['Creatinine', 'eGFR', 'Blood Urea Nitrogen (BUN)', 'Uric Acid', 'Microalbumin'],
    care: {
      en: {
        cure: 'Support nephron filtration by maintaining optimal blood pressure, adequate hydration, and moderate protein intake.',
        foodsToEat: ['Cucumber, watermelon, and berries', 'Cabbage, cauliflower, and bell peppers', 'Boiled lentils and plant-based protein in moderation', 'Adequate clean water (unless fluid restricted)'],
        foodsToAvoid: ['Excess dietary salt (sodium > 2g/day)', 'High-purine foods (red meat, shellfish, beer)', 'Unsupervised NSAID pain medicines (ibuprofen, diclofenac)'],
        lifestyle: ['Keep blood pressure consistently below 130/80 mmHg', 'Strict glycemic control if diabetic', 'Track daily fluid intake and urine output'],
        doctorQuestions: ['What is my estimated glomerular filtration rate (eGFR)?', 'Do I need a urine microalbumin or renal ultrasound test?']
      },
      hi: {
        cure: 'किडनी को स्वस्थ रखने हेतु पर्याप्त पानी पिएं, नमक कम करें और रक्तचाप व शुगर को कड़ाई से नियंत्रित रखें।',
        foodsToEat: ['खीरा, तरबूज और ताजे फल', 'पत्तागोभी, शिमला मिर्च और फूलगोभी', 'संतुलित मात्रा में मूंग दाल व हरी सब्जियां', 'पर्याप्त मात्रा में स्वच्छ जल'],
        foodsToAvoid: ['अत्यधिक नमक व पैकेज्ड फूड', 'हाई-प्यूरीन खाद्य (रेड मीट, बीयर)', 'बिना डॉक्टर से पूछे दर्द निवारक (NSAID) गोलियां'],
        lifestyle: ['रक्तचाप 130/80 के नीचे बनाए रखें', 'डायबिटीज के स्तर पर कड़ी निगरानी रखें', 'धूम्रपान से बचें और वजन नियंत्रित रखें'],
        doctorQuestions: ['मेरी किडनी की कार्यक्षमता (eGFR) कैसी है?', 'क्या मुझे पेशाब में प्रोटीन (माइक्रोएल्बुमिन) की जांच करानी चाहिए?']
      }
    }
  },
  pancreas: {
    en: 'Pancreas & Glycemic Control',
    hi: 'अग्न्याशय व इंसुलिन नियंत्रण',
    color: '#e0b377',
    description: [
      'Produces digestive enzymes and vital endocrine hormones—primarily insulin and glucagon—to regulate blood sugar metabolism.',
      'पाचक एंजाइम और इंसुलिन जैसे महत्वपूर्ण हार्मोन स्रावित करता है जो रक्त में ग्लूकोज के स्तर को नियंत्रित करते हैं।'
    ],
    markers: ['Fasting Blood Glucose', 'Post-Prandial Glucose', 'HbA1c', 'Serum Insulin', 'C-Peptide'],
    care: {
      en: {
        cure: 'Prevent insulin resistance and glucose spikes through low glycemic load foods, timed meals, post-meal walks, and daily monitoring.',
        foodsToEat: ['Bitter gourd (Karela), fenugreek (Methi) seeds', 'Cinnamon, jamun fruit and powder', 'Whole millets (Ragi, Bajra, Jowar)', 'High fiber salads before meals'],
        foodsToAvoid: ['Refined white flour (Maida), white sugar, sweets', 'Sugary fruit juices and carbonated sodas', 'High glycemic fruits in excess (mango, sapota/chiku)'],
        lifestyle: ['15-20 min brisk walk after major meals', 'Record daily Fasting and Post-prandial blood sugar', 'Strength training 2-3 times per week to boost insulin sensitivity'],
        doctorQuestions: ['What should be my target fasting and post-meal glucose ranges?', 'Is my current treatment plan adequately lowering my HbA1c?']
      },
      hi: {
        cure: 'इंसुलिन प्रतिरोध को कम करने के लिए लो-ग्लाइसेमिक आहार, मेथी-करेला का सेवन, भोजन के बाद टहलना और नियमित शुगर जांच आवश्यक है।',
        foodsToEat: ['करेला, मेथी दाना का पानी', 'दालचीनी और जामुन/जामुन सिरका', 'मोटे अनाज (ज्वार, बाजरा, रागी)', 'भोजन से पहले कच्चा सलाद व खीरा'],
        foodsToAvoid: ['मैदा, सफेद चीनी और मिठाइयां', 'मीठे फलों का जूस और कोल्ड ड्रिंक्स', 'अत्यधिक आम, चीकू और अंगूर का सेवन'],
        lifestyle: ['हर भोजन के बाद 15-20 मिनट हल्की वॉक करें', 'दैनिक फास्टिंग और भोजन बाद की शुगर डायरी में नोट करें', 'हफ्ते में 2-3 दिन मांसपेशियों की हल्की कसरत करें'],
        doctorQuestions: ['मेरे लिए फास्टिंग और भोजन बाद का सही शुगर लक्ष्य क्या है?', 'क्या मेरी वर्तमान दवाएं HbA1c को सही स्तर पर रख पा रही हैं?']
      }
    }
  },
  stomach: {
    en: 'Stomach & Gastric Digestion',
    hi: 'आमाशय (पेट) व पाचन',
    color: '#d99789',
    description: [
      'Breaks down ingested food using gastric hydrochloric acid and proteases before emptying into the small intestine.',
      'हाइड्रोक्लोरिक एसिड और पाचक एंजाइमों की मदद से भोजन को तोड़कर पचाने योग्य बनाता है।'
    ],
    markers: ['H. Pylori', 'Gastric Acidity', 'Hemoglobin', 'Pepsinogen'],
    care: {
      en: {
        cure: 'Restore the gastric mucosal barrier, neutralize excess acidity, and eradicate potential gastric inflammation or infections.',
        foodsToEat: ['Curd / yogurt and probiotic buttermilk', 'Bananas, oats, and boiled rice', 'Aloe vera juice or coconut water', 'Chamomile and fennel (Saunf) infusion'],
        foodsToAvoid: ['Spicy chilies and oily fried foods', 'Caffeine on an empty stomach', 'Late-night heavy meals within 2 hours of bedtime'],
        lifestyle: ['Eat smaller, frequent meals at consistent hours', 'Elevate head of bed if experiencing acid reflux', 'Chew food thoroughly before swallowing'],
        doctorQuestions: ['Could my symptoms be related to acid reflux (GERD) or gastritis?', 'Should I be tested for H. pylori infection?']
      },
      hi: {
        cure: 'पेट की अम्लता (एसिडिटी) को शांत करने के लिए छाछ, सौंफ, हल्का सुपाच्य भोजन और समय पर खान-पान का नियम बनाएं।',
        foodsToEat: ['ताजा दही और जीरा छाछ', 'केला, दलिया और उबले चावल', 'नारियल पानी और एलोवेरा जूस', 'भोजन के बाद सौंफ और मिश्री का सेवन'],
        foodsToAvoid: ['अत्यधिक तीखा, लाल मिर्च व तला हुआ खाना', 'खाली पेट चाय या कॉफी पीना', 'सोने से ठीक पहले भारी भोजन करना'],
        lifestyle: ['एक साथ ज्यादा खाने के बजाय थोड़ा-थोड़ा खाएं', 'भोजन को खूब चबाकर खाएं', 'एसिड रिफ्लक्स होने पर सिरहाना थोड़ा ऊंचा रखें'],
        doctorQuestions: ['क्या यह एसिडिटी, गैस्ट्राइटिस या अल्सर का संकेत हो सकता है?', 'क्या मुझे एच. पायलोरी बैक्टीरिया की जांच करानी चाहिए?']
      }
    }
  },
  intestines: {
    en: 'Intestines & Microbiome',
    hi: 'आंतें व पाचन सूक्ष्मजीव (माइक्रोबायोम)',
    color: '#c99283',
    description: [
      'Site of critical nutrient absorption, water reabsorption, and home to trillions of beneficial immune-supporting microbes.',
      'पोषक तत्वों और पानी का मुख्य अवशोषण केंद्र और शरीर की 70% प्रतिरक्षा प्रणाली का आधार।'
    ],
    markers: ['Fecal Calprotectin', 'Stool Routine', 'Electrolytes', 'Lipase', 'Amylase'],
    care: {
      en: {
        cure: 'Nourish healthy gut flora, optimize digestion transit time, and prevent intestinal inflammation through prebiotic fibers.',
        foodsToEat: ['Fermented foods (Kefir, idli/dosa batter, kimchi)', 'Apples, flaxseeds, and psyllium husk (Isabgol)', 'Papaya and ripe figs', 'Abundant leafy greens'],
        foodsToAvoid: ['Artificial food colorings and chemical preservatives', 'Excess processed wheat and gluten if sensitive', 'High-fat dairy if lactose intolerant'],
        lifestyle: ['30-35 grams of daily dietary fiber', 'Drink at least 2.5 liters of water daily', 'Manage gut-brain axis stress with mindful walking'],
        doctorQuestions: ['Could an intolerance or IBS be causing my digestive symptoms?', 'Would a specific probiotic supplement support my gut recovery?']
      },
      hi: {
        cure: 'आंतों के माइक्रोबायोम को मजबूत बनाने हेतु प्रोबायोटिक्स (छाछ, फर्मेंटेड फूड), ईसबगोल और रेशेदार फल-सब्जियां लें।',
        foodsToEat: ['ताजी छाछ, दही, इडली/डोसा जैसा खमीरयुक्त भोजन', 'सेब, पपीता, पके अंजीर और ईसबगोल की भूसी', 'खूब सारा पानी और हरी पत्तेदार सब्जियां', 'अंकुरित मूंग और चने'],
        foodsToAvoid: ['प्रिजर्वेटिव युक्त पैकेज्ड चिप्स व नूडल्स', 'अत्यधिक मैदा और बासी खाना', 'अधिक चीनी और कृत्रिम मिठास वाले उत्पाद'],
        lifestyle: ['प्रतिदिन 30-35 ग्राम फाइबर का सेवन करें', 'रोजाना कम से कम 2.5 से 3 लीटर पानी पिएं', 'तनाव आंतों पर सीधा असर डालता है, इसलिए तनावमुक्त रहें'],
        doctorQuestions: ['क्या मेरे लक्षण इरिटेबल बाउल सिंड्रोम (IBS) से संबंधित हैं?', 'क्या मुझे किसी खास प्रोबायोटिक की आवश्यकता है?']
      }
    }
  }
};

export function organFor(name) {
  if (!name) return null;
  const n = name.toLowerCase().trim();
  if (/glucose|sugar|hba1c|glycated|insulin|c-peptide|diabetes|fbs|ppbs/.test(n)) return 'pancreas';
  if (/alt|ast|sgpt|sgot|bilirubin|alkaline phosphatase|ggt|gamma gt|liver|hepatic|albumin|globulin/.test(n)) return 'liver';
  if (/creatinine|egfr|gfr|urea|bun|uric acid|renal|kidney|microalbumin/.test(n)) return 'kidneys';
  if (/cholesterol|ldl|hdl|triglyceride|lipid|vldl|cardiac|troponin|apob|blood pressure/.test(n)) return 'heart';
  if (/spo2|oxygen|respiratory|lung|pco2|po2|fev1/.test(n)) return 'lungs';
  if (/tsh|thyroid|t3|t4|cortisol|b12|brain|neuro/.test(n)) return 'brain';
  if (/gastrin|h\.?\s*pylori|pepsinogen|stomach|gastric|acidity/.test(n)) return 'stomach';
  if (/calprotectin|stool|gut|intestinal|colon|amylase|lipase|celiac/.test(n)) return 'intestines';
  return null;
}

export function rangeStatus(row) {
  if (!row) return 'unknown';
  const valStr = String(row.value || '').trim();
  if (!valStr || !/^[-+]?\d*\.?\d+$/.test(valStr)) return 'unknown';
  const value = Number(valStr);
  const ref = String(row.range || '').replace(/[–—]/g, '-').trim();

  const pair = ref.match(/^(-?\d*\.?\d+)\s*(?:-|to)\s*(-?\d*\.?\d+)$/i);
  if (pair) {
    const lo = Number(pair[1]), hi = Number(pair[2]);
    if (lo > hi) return 'unknown';
    return value < lo ? 'low' : value > hi ? 'high' : 'within';
  }

  const single = ref.match(/^(<=|>=|<|>|≤|≥)\s*(-?\d*\.?\d+)$/);
  if (single) {
    const b = Number(single[2]);
    switch (single[1]) {
      case '<': return value < b ? 'within' : 'high';
      case '<=':
      case '≤': return value <= b ? 'within' : 'high';
      case '>': return value > b ? 'within' : 'low';
      default: return value >= b ? 'within' : 'low';
    }
  }

  return 'unknown';
}

export function parseReport(text) {
  const rows = [];
  if (!text) return rows;
  for (const line of text.split(/\r?\n/)) {
    const match = line.trim().match(/^([A-Za-z][A-Za-z0-9 ()/%.,-]{1,65}?)\s+([-+]?\d*\.?\d+)\s+([a-zA-Zµμ%/\d.^]+)\s+(<?=?\s*\d*\.?\d+\s*[-–—]\s*\d*\.?\d+|[<>≤≥]=?\s*\d*\.?\d+)\s*$/);
    if (match) {
      rows.push({
        name: match[1].trim(),
        value: match[2],
        unit: match[3],
        range: match[4]
      });
    }
  }
  return rows;
}

export function insight(row, hi = false) {
  const status = rangeStatus(row);
  const organ = organFor(row?.name || '');
  const organObj = organ ? organs[organ] : null;

  const result = hi
    ? status === 'unknown'
      ? 'इस परिणाम की संदर्भ सीमा उपलब्ध नहीं है। प्रयोगशाला की इकाई और रिपोर्ट की पुष्टि करें।'
      : status === 'within'
        ? 'यह मान सामान्य प्रयोगशाला सीमा के भीतर है।'
        : `यह मान सामान्य प्रयोगशाला सीमा से ${status === 'high' ? 'अधिक (High)' : 'कम (Low)'} है। इसका सटीक अर्थ आपके संपूर्ण स्वास्थ्य व लक्षणों पर निर्भर करता है।`
    : status === 'unknown'
      ? 'This result cannot be compared directly without a recognized reference range.'
      : status === 'within'
        ? 'This value is within the standard laboratory reference range.'
        : `This value is ${status === 'high' ? 'above' : 'below'} the standard laboratory reference range.`;

  return {
    status,
    organ,
    organDetails: organObj,
    text: result,
    connection: organObj
      ? organObj.description[hi ? 1 : 0]
      : hi ? 'यह परिणाम किसी विशिष्ट मुख्य अंग से सीधे मैप नहीं है।' : 'This finding is not mapped to a single organ.',
    question: hi
      ? 'क्या यह सीमा मुझ पर लागू होती है? क्या आहार, दवा या उपवास ने परिणाम को प्रभावित किया? क्या कोई फॉलो-अप जांच आवश्यक है?'
      : 'Does this reference range apply to my demographic? Could recent diet, medication, or fasting have affected this? Is a follow-up test indicated?'
  };
}

export const sampleText = `Fasting blood glucose 138 mg/dL 70-99
Post-prandial glucose 185 mg/dL <140
HbA1c 7.6 % 4.0-5.6
Total cholesterol 228 mg/dL <200
Triglycerides 190 mg/dL <150
SGPT (ALT) 62 U/L 7-56
Serum Creatinine 1.05 mg/dL 0.7-1.3
Hemoglobin 13.8 g/dL 13.0-17.0`;

export const LAB_PRESETS = [
  {
    id: 'lalpath',
    lab: 'Dr Lal PathLabs',
    title: 'Comprehensive Metabolic & Diabetes Profile',
    text: `Fasting blood glucose 136 mg/dL 70-99\nHbA1c 7.4 % 4.0-5.6\nTotal cholesterol 218 mg/dL <200\nTriglycerides 175 mg/dL <150\nSerum Creatinine 0.95 mg/dL 0.7-1.3\nSGPT (ALT) 48 U/L 7-56`
  },
  {
    id: 'apollo',
    lab: 'Apollo Diagnostics',
    title: 'Liver & Kidney Function Panel (LFT & KFT)',
    text: `SGPT (ALT) 68 U/L 7-56\nSGOT (AST) 52 U/L 10-40\nSerum Bilirubin 1.4 mg/dL 0.2-1.2\nSerum Creatinine 1.45 mg/dL 0.7-1.3\nBlood Urea Nitrogen (BUN) 28 mg/dL 7-20\nUric Acid 7.8 mg/dL 3.5-7.2`
  },
  {
    id: 'metropolis',
    lab: 'Metropolis Healthcare',
    title: 'Diabetic & Lipid Health Screening',
    text: `Fasting blood glucose 142 mg/dL 70-99\nPost-prandial glucose 210 mg/dL <140\nHbA1c 7.9 % 4.0-5.6\nTotal cholesterol 235 mg/dL <200\nLDL Cholesterol 142 mg/dL <100\nHDL Cholesterol 38 mg/dL >40`
  },
  {
    id: 'srl',
    lab: 'SRL Diagnostics',
    title: 'Executive Health Checkup & CBC',
    text: `Hemoglobin 11.2 g/dL 13.0-17.0\nFasting blood glucose 105 mg/dL 70-99\nTotal cholesterol 195 mg/dL <200\nSerum Creatinine 0.9 mg/dL 0.7-1.3\nSGPT (ALT) 32 U/L 7-56`
  }
];
