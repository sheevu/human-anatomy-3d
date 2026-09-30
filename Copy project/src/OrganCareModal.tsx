import { HeartPulse, CheckCircle2, AlertTriangle, ArrowRight, X, Utensils, Activity, Stethoscope, Sparkles } from 'lucide-react';
import { organs, rangeStatus } from './medical.js';
import type { Row } from './types';

export default function OrganCareModal({
  organKey,
  hi,
  reportRows = [],
  onClose,
  onFocus
}: {
  organKey: string;
  hi: boolean;
  reportRows?: Row[];
  onClose: () => void;
  onFocus?: () => void;
}) {
  const organ = organs[organKey as keyof typeof organs];
  if (!organ) return null;

  // Filter report rows related to this organ
  const relatedRows = reportRows.filter(r => {
    const n = (r.name || '').toLowerCase();
    if (organKey === 'pancreas') return /glucose|sugar|hba1c|insulin|c-peptide/.test(n);
    if (organKey === 'liver') return /alt|ast|sgpt|sgot|bilirubin|alkaline|ggt/.test(n);
    if (organKey === 'kidneys') return /creatinine|egfr|urea|bun|uric acid/.test(n);
    if (organKey === 'heart') return /cholesterol|ldl|hdl|triglyceride|lipid/.test(n);
    if (organKey === 'lungs') return /spo2|oxygen|respiratory|lung/.test(n);
    if (organKey === 'brain') return /tsh|thyroid|t3|t4|cortisol|b12/.test(n);
    if (organKey === 'stomach') return /gastrin|pylori|pepsinogen|stomach|acidity/.test(n);
    if (organKey === 'intestines') return /calprotectin|stool|gut|amylase|lipase/.test(n);
    return false;
  });

  const careData = organ.care ? organ.care[hi ? 'hi' : 'en'] : null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(21, 35, 28, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '16px'
    }}>
      <div className="card" style={{
        maxWidth: '680px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        borderRadius: '16px',
        padding: '28px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
        border: '1px solid #d4e2d7'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: organ.color || '#257860',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <HeartPulse size={24} />
            </div>
            <div>
              <span className="eyebrow" style={{ color: '#257860' }}>
                {hi ? '3D शारीरिक अंग विश्लेषण' : 'ANATOMICAL INSIGHT & CARE PLAN'}
              </span>
              <h2 style={{ fontSize: '22px', margin: '2px 0 0', color: '#1a3d31' }}>
                {organ[hi ? 'hi' : 'en']}
              </h2>
            </div>
          </div>

          <button
            className="icon-button"
            aria-label="Close"
            onClick={onClose}
            style={{ width: '36px', height: '36px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Function Description */}
        <p style={{ fontSize: '13px', lineHeight: '1.7', color: '#4a6556', marginBottom: '18px' }}>
          {organ.description[hi ? 1 : 0]}
        </p>

        {/* Detected Issues from Report */}
        {relatedRows.length > 0 && (
          <div style={{
            background: '#fff9ed',
            border: '1px solid #edd9b1',
            borderRadius: '12px',
            padding: '16px 18px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a07124', fontWeight: 600, fontSize: '12px', marginBottom: '10px' }}>
              <AlertTriangle size={16} />
              <span>{hi ? 'आपकी रिपोर्ट में पाए गए संबंधित परिणाम:' : 'Detected Biomarkers in Your Report:'}</span>
            </div>

            <div style={{ display: 'grid', gap: '8px' }}>
              {relatedRows.map((r, i) => {
                const st = rangeStatus(r);
                return (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #fae8c8'
                  }}>
                    <div>
                      <strong style={{ fontSize: '13px', color: '#274435' }}>{r.name}</strong>
                      <div style={{ fontSize: '10px', color: '#7a8d80' }}>
                        {hi ? 'मानक सीमा' : 'Reference Range'}: {r.range || 'N/A'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#1c3e32' }}>
                        {r.value} {r.unit}
                      </span>
                      <span className={`status ${st === 'within' ? 'good' : 'attention'}`} style={{ fontSize: '10px' }}>
                        {st === 'within' ? (hi ? 'सीमा में' : 'Normal') : (hi ? 'सीमा से अधिक' : 'Above Range')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recommended Cure / Things to Follow */}
        {careData && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{
              background: '#f2f8f3',
              border: '1px solid #d4e7d8',
              borderRadius: '12px',
              padding: '16px 18px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#257860', fontWeight: 600, fontSize: '13px', marginBottom: '8px' }}>
                <Sparkles size={16} />
                <span>{hi ? 'सुझाया गया उपचार व देखभाल (Recommended Care):' : 'Clinical Objective & Care Plan:'}</span>
              </div>
              <p style={{ fontSize: '12px', lineHeight: '1.7', color: '#385547', margin: 0 }}>
                {careData.cure}
              </p>
            </div>

            {/* Diet Guidance */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              <div style={{
                background: '#fafcf9',
                border: '1px solid #d8e5db',
                borderRadius: '10px',
                padding: '14px'
              }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#207761', fontSize: '11px', marginBottom: '8px' }}>
                  <Utensils size={13} />
                  {hi ? 'लाभदायक आहार (Foods to Eat)' : 'Foods to Favor'}
                </strong>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#4a6556', lineHeight: '1.8' }}>
                  {careData.foodsToEat.map((food, i) => (
                    <li key={i}>{food}</li>
                  ))}
                </ul>
              </div>

              <div style={{
                background: '#fef9f7',
                border: '1px solid #eedcd6',
                borderRadius: '10px',
                padding: '14px'
              }}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a63e32', fontSize: '11px', marginBottom: '8px' }}>
                  <AlertTriangle size={13} />
                  {hi ? 'परहेज करें (Foods to Avoid)' : 'Foods to Strictly Limit'}
                </strong>
                <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#68453f', lineHeight: '1.8' }}>
                  {careData.foodsToAvoid.map((food, i) => (
                    <li key={i}>{food}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Lifestyle & Doctor Questions */}
            <div style={{
              background: '#fcfdfb',
              border: '1px solid #e1ebe3',
              borderRadius: '10px',
              padding: '14px'
            }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3f6755', fontSize: '11px', marginBottom: '8px' }}>
                <Activity size={13} />
                {hi ? 'दैनिक जीवनशैली में सुधार (Lifestyle Habits)' : 'Daily Lifestyle Habits'}
              </strong>
              <div style={{ display: 'grid', gap: '6px', fontSize: '11px', color: '#526e5e' }}>
                {careData.lifestyle.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#257860', fontWeight: 700 }}>•</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              background: '#f6f5fb',
              border: '1px solid #ded9f2',
              borderRadius: '10px',
              padding: '14px'
            }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#57419e', fontSize: '11px', marginBottom: '8px' }}>
                <Stethoscope size={13} />
                {hi ? 'डॉक्टर से क्या सवाल पूछें (Questions for Doctor)' : 'Key Questions for Your Physician'}
              </strong>
              <div style={{ display: 'grid', gap: '6px', fontSize: '11px', color: '#564d75' }}>
                {careData.doctorQuestions.map((q, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <span style={{ color: '#684bb5', fontWeight: 700 }}>?</span>
                    <span>{q}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
          {onFocus && (
            <button className="secondary" onClick={() => { onFocus(); onClose(); }}>
              <HeartPulse size={15} />
              {hi ? '3D में फोकस व ज़ूम करें' : 'Zoom & Frame in 3D'}
            </button>
          )}
          <button className="primary" onClick={onClose}>
            {hi ? 'समझ आ गया' : 'Close Insights'}
          </button>
        </div>
      </div>
    </div>
  );
}
