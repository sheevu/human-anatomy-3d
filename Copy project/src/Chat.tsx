import { useState, useRef, useEffect } from 'react';
import {
  MessageCircle, Send, Bot, User, Sparkles, RefreshCw,
  Globe, ShieldCheck, HeartPulse, Stethoscope, AlertCircle
} from 'lucide-react';
import type { ChatMessage, Report, Profile } from './types';
import { organFor, organs, rangeStatus } from './medical.js';

export default function Chat({
  profile,
  latestReport,
  initialHi = false
}: {
  profile?: Profile;
  latestReport?: Report | null;
  initialHi?: boolean;
}) {
  const [hi, setHi] = useState(initialHi);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome',
      sender: 'assistant',
      language: initialHi ? 'hi' : 'en',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: initialHi
        ? `नमस्ते! मैं आपका वेदाशील्ड एआई स्वास्थ्य सहायक हूं। आप अपनी लैब रिपोर्ट, 3D शारीरिक अंगों, दैनिक शुगर (डायबिटीज), या खान-पान के बारे में हिंदी या अंग्रेजी में सवाल पूछ सकते हैं।`
        : `Hello! I am your VedaShield AI Health Assistant. You can ask me questions about your laboratory test results, 3D anatomical insights, daily diabetes records, or diet in English or Hindi.`
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  const promptSuggestions = hi
    ? [
        'मेरी हाल की रिपोर्ट सरल भाषा में समझाएं',
        'खाली पेट शुगर (Fasting Glucose) कम करने के उपाय',
        'लिवर एंजाइम (SGPT/SGOT) बढ़ने पर क्या खाना चाहिए?',
        'डॉक्टर से परामर्श के लिए कौन-से सवाल पूछें?'
      ]
    : [
        'Explain my latest lab findings in simple words',
        'How to manage high fasting blood sugar naturally?',
        'What foods help lower elevated liver enzymes (SGPT)?',
        'What key questions should I ask my doctor?'
      ];

  // Smart local responder in case backend is offline or no Gemini key
  function generateLocalResponse(query: string, inHindi: boolean): string {
    const q = query.toLowerCase();

    // 1. Context from latest report
    if (q.includes('report') || q.includes('रिजल्ट') || q.includes('रिपोर्ट') || q.includes('latest')) {
      if (latestReport && latestReport.rows.length) {
        const abnormal = latestReport.rows.filter(r => ['high', 'low'].includes(rangeStatus(r)));
        if (abnormal.length) {
          if (inHindi) {
            return `आपकी हालिया रिपोर्ट (${latestReport.title}) में ${abnormal.length} परिणाम सामान्य सीमा से बाहर हैं:\n\n` +
              abnormal.map(r => `• **${r.name}**: ${r.value} ${r.unit} (${rangeStatus(r) === 'high' ? 'सीमा से अधिक' : 'सीमा से कम'})`).join('\n') +
              `\n\n📌 **सुझाव**: 3D एनाटॉमी सेक्शन में जाकर देखें कि इन परिणामों का आपके अंगों पर क्या प्रभाव पड़ता है। डॉक्टर से अगली मुलाकात में इस पर विस्तार से चर्चा करें।`;
          } else {
            return `In your recent report (${latestReport.title}), there are ${abnormal.length} parameters outside the standard reference range:\n\n` +
              abnormal.map(r => `• **${r.name}**: ${r.value} ${r.unit} (${rangeStatus(r) === 'high' ? 'Above Range' : 'Below Range'})`).join('\n') +
              `\n\n📌 **Next Step**: Check the 3D Anatomy explorer to see the highlighted organs and follow the clinical lifestyle recommendations.`;
          }
        } else {
          return inHindi
            ? `आपकी हालिया रिपोर्ट (${latestReport.title}) के सभी परीक्षण परिणाम सामान्य सीमा के भीतर पाए गए हैं! संतुलित आहार और नियमित व्यायाम बनाए रखें।`
            : `All test results in your latest report (${latestReport.title}) are currently within the reference ranges! Continue with balanced nutrition and physical activity.`;
        }
      }
    }

    // 2. Glucose / Diabetes
    if (q.includes('sugar') || q.includes('glucose') || q.includes('diabetes') || q.includes('शुगर') || q.includes('मधुमेह') || q.includes('hba1c')) {
      if (inHindi) {
        return `🩸 **ब्लड शुगर व डायबिटीज नियंत्रण दिशानिर्देश:**\n\n` +
          `1. **फास्टिंग शुगर लक्ष्य:** 70–99 mg/dL (सामान्य), 100-125 mg/dL (प्री-डायबिटीज), 126+ (डायबिटीज)\n` +
          `2. **भोजन के 2 घंटे बाद लक्ष्य:** < 140 mg/dL\n` +
          `3. **उत्तम आहार:** करेला, मेथी दाना का पानी, जामुन का सिरका, ज्वार-बाजरा, दालें व कच्चा खीरा।\n` +
          `4. **सावधानी:** सफेद मैदा, चीनी, मीठे फलों के जूस और पैकेज्ड स्नैक्स से बचें।\n` +
          `5. **सक्रियता:** हर भोजन के तुरंत बाद 15-20 मिनट टहलने से शुगर स्पाइक 30% तक कम होता है।`;
      } else {
        return `🩸 **Blood Glucose & Diabetes Management Guidelines:**\n\n` +
          `1. **Fasting Glucose Targets:** 70–99 mg/dL (Normal), 100–125 mg/dL (Pre-diabetes), 126+ mg/dL (Diabetes range)\n` +
          `2. **Post-Meal (2h) Target:** < 140 mg/dL\n` +
          `3. **Foods to Include:** Bitter gourd (Karela), fenugreek (Methi) seeds, cinnamon, jamun, whole millets (Ragi, Jowar), and raw cucumber salad before meals.\n` +
          `4. **Foods to Avoid:** Refined sugars, maida, canned sodas, and ultra-processed carbs.\n` +
          `5. **Habit:** A 15-20 minute brisk walk after meals markedly enhances muscle insulin sensitivity.`;
      }
    }

    // 3. Liver / SGPT / SGOT
    if (q.includes('liver') || q.includes('sgpt') || q.includes('sgot') || q.includes('लिवर') || q.includes('यकृत') || q.includes('fatty')) {
      if (inHindi) {
        return `🌿 **लिवर स्वास्थ्य व एंजाइम (SGPT/SGOT) नियंत्रण:**\n\n` +
          `• **बढ़े हुए एंजाइम का अर्थ:** यह लिवर कोशिकाओं में सूजन या फैटी लिवर (NAFLD) का संकेत हो सकता है।\n` +
          `• **क्या खाएं:** पपीता, चुकंदर, लहसुन, हरी चाय (ग्रीन टी), हल्दी और प्रचुर मात्रा में हरी पत्तेदार सब्जियां।\n` +
          `• **किन चीजों से बचें:** शराब (अल्कोहल) का पूर्ण त्याग, अत्यधिक तला-भुना भोजन और अनावश्यक दर्द निवारक दवाइयां।\n` +
          `• **डॉक्टर से प्रश्न:** क्या मुझे पेट का अल्ट्रासाउंड या फाइब्रोस्कैन कराना चाहिए?`;
      } else {
        return `🌿 **Liver Health & Enzyme (SGPT/ALT) Guidance:**\n\n` +
          `• **Elevated Enzymes:** Often indicate hepatic cellular strain or early non-alcoholic fatty liver (NAFLD).\n` +
          `• **Recommended Foods:** Papaya, beets, garlic, green tea, cruciferous vegetables (broccoli/cabbage), and turmeric.\n` +
          `• **Things to Avoid:** Zero alcohol, eliminate deep-fried foods, and avoid unprescribed NSAID painkillers.\n` +
          `• **Doctor Consultation:** Ask whether an abdominal ultrasound or lipid profile is advised.`;
      }
    }

    // 4. Kidney / Creatinine
    if (q.includes('kidney') || q.includes('creatinine') || q.includes('किडनी') || q.includes('गुर्दे') || q.includes('यूरिया')) {
      if (inHindi) {
        return `💧 **किडनी (गुर्दे) की देखभाल व क्रिएटिनिन मार्गदर्शन:**\n\n` +
          `• **क्रिएटिनिन:** यह मांसपेशियों के चयापचय का अपशिष्ट है जिसे किडनी छानकर बाहर निकालती है (सामान्य: 0.7-1.3 mg/dL)।\n` +
          `• **सावधानियां:** भोजन में नमक (सोडियम) कम करें, पर्याप्त पानी पिएं (प्रतिदिन 2.5-3 लीटर), और रक्तचाप को 130/80 के भीतर रखें।\n` +
          `• **परहेज:** अत्यधिक दर्द निवारक (ibuprofen/diclofenac) दवाइयों का बिना डॉक्टर के परामर्श से सेवन न करें।`;
      } else {
        return `💧 **Kidney Health & Creatinine Management:**\n\n` +
          `• **Serum Creatinine:** A byproduct of muscle metabolism cleared by the kidneys (normal: 0.7–1.3 mg/dL).\n` +
          `• **Kidney Protection:** Restrict dietary sodium (< 2g/day), stay adequately hydrated (2.5–3L/day), and keep blood pressure strictly controlled.\n` +
          `• **Caution:** Avoid chronic use of over-the-counter NSAIDs (ibuprofen/naproxen) which reduce renal blood flow.`;
      }
    }

    // 5. Default General Response
    if (inHindi) {
      return `स्वास्थ्य को बेहतर समझने के लिए यह एक महत्वपूर्ण प्रश्न है।\n\n` +
        `• **मुख्य सलाह:** प्रयोगशाला रिपोर्ट के किसी भी असामान्य मान को हमेशा अपने लक्षणों, उम्र और पूर्व इतिहास के साथ देखा जाना चाहिए।\n` +
        `• **स्वस्थ कदम:** संतुलित घर का बना भोजन लें, प्रतिदिन 30 मिनट पैदल चलें, और पर्याप्त पानी पिएं।\n` +
        `• **डॉक्टर से क्या पूछें:** "क्या यह परिणाम मेरी जीवनशैली या दवा के कारण प्रभावित हुआ है, और क्या मुझे 4-6 सप्ताह में पुनः जांच करानी चाहिए?"\n\n` +
        `यदि आपके पास कोई विशिष्ट रिपोर्ट या मान (जैसे Fasting Sugar, Cholesterol, SGPT) है, तो कृपया लिखकर पूछें!`;
    } else {
      return `Thank you for asking. Here is educational guidance on this topic:\n\n` +
        `• **Clinical Context:** Any abnormal biomarker must always be interpreted alongside clinical symptoms, age, and lifestyle factors.\n` +
        `• **General Health Habits:** Follow a whole-food plant-predominant diet, engage in 150 minutes of moderate exercise weekly, and stay well hydrated.\n` +
        `• **Questions for Your Physician:** "Could recent diet or temporary stress have influenced this test, and is a follow-up panel indicated in 4–6 weeks?"\n\n` +
        `Feel free to ask about any specific test parameter (e.g. Fasting Glucose, Lipid panel, HbA1c, Liver enzymes)!`;
    }
  }

  async function handleSend(textToSend?: string) {
    const q = (textToSend || input).trim();
    if (!q || busy) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      sender: 'user',
      language: hi ? 'hi' : 'en',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setBusy(true);

    try {
      // Try backend AI endpoint
      let reply = '';
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: q, language: hi ? 'hi' : 'en', report: latestReport })
        });
        if (res.ok) {
          const data = await res.json();
          if (data.reply) reply = data.reply;
        }
      } catch {}

      if (!reply) {
        // Fallback to high-quality local clinical knowledge
        await new Promise(r => setTimeout(r, 600));
        reply = generateLocalResponse(q, hi);
      }

      const botMsg: ChatMessage = {
        id: String(Date.now() + 1),
        sender: 'assistant',
        language: hi ? 'hi' : 'en',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="chat-container card" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '75vh',
      minHeight: '520px',
      maxHeight: '820px',
      padding: 0,
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1px solid #d9e6dc'
    }}>
      {/* Chat Header */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid #e1ebe3',
        background: 'linear-gradient(135deg, #f5f9f6, #fbfdfb)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: '#257860',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bot size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '16px', margin: 0, color: '#1c3e32' }}>
                {hi ? 'वेदाशील्ड एआई स्वास्थ्य संवाद' : 'VedaShield AI Health Assistant'}
              </h2>
              <span className="status good" style={{ fontSize: '9px', padding: '2px 6px' }}>
                <i></i> {hi ? 'सक्रिय' : 'Online'}
              </span>
            </div>
            <p className="muted" style={{ margin: 0, fontSize: '11px' }}>
              {hi ? 'हिंदी व अंग्रेजी में चिकित्सा व रिपोर्ट मार्गदर्शन' : 'Bilingual medical report & wellness guidance'}
            </p>
          </div>
        </div>

        {/* Language Switcher */}
        <button
          className="secondary"
          onClick={() => setHi(!hi)}
          style={{
            fontSize: '11px',
            padding: '6px 12px',
            borderRadius: '8px',
            minHeight: '34px',
            gap: '6px'
          }}
        >
          <Globe size={14} />
          <span>{hi ? 'Switch to English' : 'हिंदी में बदलें'}</span>
          <span style={{
            background: '#ebf4ed',
            padding: '2px 5px',
            borderRadius: '4px',
            color: '#257860',
            fontWeight: 600
          }}>
            {hi ? 'EN' : 'अ'}
          </span>
        </button>
      </div>

      {/* Messages List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        background: '#fcfdfb'
      }}>
        {messages.map(m => {
          const isBot = m.sender === 'assistant';
          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
                alignSelf: isBot ? 'flex-start' : 'flex-end',
                maxWidth: '85%'
              }}
            >
              {isBot && (
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: '#e7f2eb',
                  color: '#257860',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  <Bot size={16} />
                </div>
              )}

              <div style={{
                background: isBot ? '#ffffff' : '#257860',
                color: isBot ? '#264236' : '#ffffff',
                border: isBot ? '1px solid #dce8df' : 'none',
                borderRadius: isBot ? '14px 14px 14px 3px' : '14px 14px 3px 14px',
                padding: '14px 18px',
                fontSize: '13px',
                lineHeight: '1.65',
                boxShadow: isBot ? '0 2px 8px rgba(0,0,0,0.03)' : '0 3px 10px rgba(37,120,96,0.2)',
                whiteSpace: 'pre-wrap'
              }}>
                <div>{m.text}</div>
                <div style={{
                  fontSize: '9px',
                  color: isBot ? '#8b9f91' : '#cce5dc',
                  marginTop: '6px',
                  textAlign: 'right'
                }}>
                  {m.timestamp}
                </div>
              </div>

              {!isBot && (
                <div style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  background: '#257860',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px'
                }}>
                  <User size={16} />
                </div>
              )}
            </div>
          );
        })}

        {busy && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#5b7a6b', fontSize: '12px' }}>
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: '#e7f2eb',
              color: '#257860',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <RefreshCw size={14} className="animate-spin" />
            </div>
            <span>{hi ? 'सोच रहे हैं और उत्तर तैयार कर रहे हैं…' : 'Thinking and generating medical guidance…'}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions Pills */}
      <div style={{
        padding: '10px 20px',
        background: '#f8faf7',
        borderTop: '1px solid #e7efe9',
        display: 'flex',
        gap: '8px',
        overflowX: 'auto',
        scrollbarWidth: 'none'
      }}>
        <span style={{ fontSize: '10px', fontWeight: 600, color: '#7a8f82', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
          <Sparkles size={12} /> {hi ? 'सुझाव:' : 'Suggested:'}
        </span>
        {promptSuggestions.map((prompt, i) => (
          <button
            key={i}
            onClick={() => handleSend(prompt)}
            disabled={busy}
            style={{
              fontSize: '11px',
              padding: '4px 10px',
              background: '#ffffff',
              border: '1px solid #d5e3d7',
              borderRadius: '20px',
              color: '#2a5a48',
              whiteSpace: 'nowrap',
              minHeight: '26px'
            }}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form
        onSubmit={e => { e.preventDefault(); handleSend(); }}
        style={{
          padding: '16px 20px',
          background: '#ffffff',
          borderTop: '1px solid #e4ede6',
          display: 'flex',
          gap: '12px',
          alignItems: 'center'
        }}
      >
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={hi ? 'स्वास्थ्य, रिपोर्ट या पोषण के बारे में सवाल लिखें…' : 'Ask about your test results, diabetes, or health…'}
          style={{
            flex: 1,
            margin: 0,
            borderRadius: '10px',
            border: '1.5px solid #d1ded4',
            padding: '11px 16px',
            fontSize: '13px'
          }}
        />

        <button
          type="submit"
          className="primary"
          disabled={busy || !input.trim()}
          style={{
            borderRadius: '10px',
            padding: '11px 20px',
            minHeight: '42px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Send size={15} />
          <span>{hi ? 'भेजें' : 'Send'}</span>
        </button>
      </form>

      {/* Disclaimer strip */}
      <div style={{
        padding: '6px 20px',
        background: '#f2f5f1',
        fontSize: '9px',
        color: '#819385',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px'
      }}>
        <ShieldCheck size={12} />
        <span>
          {hi
            ? 'शैक्षिक व सूचनात्मक सहायता हेतु। यह प्रत्यक्ष चिकित्सा निदान या डॉक्टर के परामर्श का विकल्प नहीं है।'
            : 'For informational support only. Does not replace professional clinical evaluation or diagnosis.'}
        </span>
      </div>
    </div>
  );
}
