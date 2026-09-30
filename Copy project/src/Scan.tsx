import { useState, useRef } from 'react';
import {
  UploadCloud, FileText, ArrowRight, Plus, Trash2, CheckCircle2,
  ScanLine, ShieldCheck, Camera, Sparkles, Building2, AlertCircle
} from 'lucide-react';
import { api } from './api';
import { recognize } from './ocr';
import { parseReport, sampleText, LAB_PRESETS } from './medical.js';
import type { Profile, Report, Row } from './types';

export default function Scan({
  profile,
  ai,
  hi,
  onSaved,
  onCancel,
  initialText = ''
}: {
  profile: Profile;
  ai: boolean;
  hi: boolean;
  onSaved: (r: Report) => void;
  onCancel: () => void;
  initialText?: string;
}) {
  const [phase, setPhase] = useState(initialText ? 1 : 0);
  const [text, setText] = useState(initialText);
  const [rows, setRows] = useState<Row[]>(() => initialText ? parseReport(initialText) : []);
  const [title, setTitle] = useState(initialText ? 'Diagnostic Health Panel' : '');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [lab, setLab] = useState('Diagnostic Laboratory');
  const [kind, setKind] = useState<Report['type']>('lab');
  const [medicines, setMedicines] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function extract(useAI = false, fileToUse?: File) {
    const targetFile = fileToUse || file;
    setError('');
    setBusy(hi ? 'रिपोर्ट पढ़ रहे हैं…' : 'Reading your report…');
    try {
      let raw = text;
      let result: Awaited<ReturnType<typeof api.extract>> | null = null;

      if (targetFile) {
        if (targetFile.size > 15 * 1024 * 1024) throw Error('Maximum file size is 15 MB');
        let id = fileId;
        if (!id && targetFile.type !== 'text/plain' && !targetFile.name.endsWith('.txt')) {
          id = (await api.upload(profile.id, targetFile)).id;
          setFileId(id);
        }
        if (useAI) {
          if (!consent) throw Error('Confirm permission to send this file to Gemini.');
          if (!id) throw Error('Use a PDF or image for Gemini extraction.');
          result = await api.extract(profile.id, id);
          raw = result.text;
          setMedicines(result.medicines);
        } else {
          raw = await recognize(targetFile, setBusy);
        }
      }

      if (!raw.trim() && !result?.rows.length) {
        throw Error(hi ? 'कृपया पढ़ने योग्य रिपोर्ट जोड़ें या टेक्स्ट पेस्ट करें।' : 'Add a readable report or enter its text first.');
      }

      setText(raw);
      setRows(result?.rows || parseReport(raw));
      if (!title) setTitle(targetFile?.name.replace(/\.[^.]+$/, '') || 'Health report');
      setPhase(1);
      setVerified(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }

  function handleCameraCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const captured = e.target.files?.[0];
    if (captured) {
      setFile(captured);
      setFileId(null);
      setError('');
      extract(false, captured);
    }
  }

  function loadPreset(preset: typeof LAB_PRESETS[0]) {
    setFile(null);
    setFileId(null);
    setText(preset.text);
    setTitle(preset.title);
    setLab(preset.lab);
    setKind('lab');
    setRows(parseReport(preset.text));
    setPhase(1);
    setVerified(false);
  }

  async function save() {
    setError('');
    if (!verified) return;
    setBusy(hi ? 'सत्यापित रिपोर्ट सहेज रहे हैं…' : 'Saving verified report…');
    try {
      const result = await api.saveReport(profile.id, {
        title,
        date,
        lab,
        type: kind,
        rows,
        text,
        medicines,
        fileId,
        verified: true
      });
      onSaved(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy('');
    }
  }

  function editRow(index: number, key: keyof Row, value: string) {
    setVerified(false);
    setRows(rows.map((r, i) => i === index ? { ...r, [key]: value } : r));
  }

  return (
    <section className="scan-page">
      <div className="page-intro">
        <span className="eyebrow">{hi ? 'समझने की शुरुआत' : 'FROM PAPER TO 3D CLARITY'}</span>
        <h1>{hi ? 'अपनी लैब रिपोर्ट को समझें।' : 'Analyze Your Medical Report'}</h1>
        <p>
          {hi ? 'प्रोफ़ाइल' : 'Adding record for'} <strong>{profile.name}</strong>. {hi ? 'कैमरे से फोटो लें, फाइल अपलोड करें या भारतीय डायग्नोस्टिक लैब चुनें।' : 'Take a photo, upload a document, or choose a recognized diagnostic lab preset.'}
        </p>
      </div>

      <div className="steps">
        {['Upload / Photo', 'Review Extraction', '3D Anatomy & Care'].map((s, i) => (
          <span className={i === phase ? 'active' : i < phase ? 'done' : ''} key={s}>
            <b>{i + 1}</b>
            {hi ? ['रिपोर्ट जोड़ें / फोटो', 'परिणाम जांचें', '3D शरीर व देखभाल'][i] : s}
          </span>
        ))}
      </div>

      {error && <div role="alert" className="error">{error}</div>}
      {busy && <div role="status" className="notice">{busy}</div>}

      {phase === 0 ? (
        <div className="scan-grid">
          <div className="card scan-card">
            <h2>{hi ? 'रिपोर्ट जोड़ें या फोटो लें' : 'Upload or Take Photo'}</h2>
            <p className="muted">
              {hi ? 'लैब रिपोर्ट, प्रिस्क्रिप्शन या दवा पैकेज (Dr Lal PathLabs, SRL, Apollo आदि)' : 'Diagnostic lab report, patient prescription, or pathology panel'}
            </p>

            {/* Camera Capture and File Upload Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', margin: '14px 0' }}>
              {/* Take Photo Button */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '20px',
                  background: 'linear-gradient(145deg, #eef7f2, #f5faf7)',
                  border: '2px dashed #328b6d',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  color: '#21634e'
                }}
              >
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: '#257860',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Camera size={22} />
                </div>
                <strong style={{ fontSize: '13px' }}>
                  {hi ? 'कैमरे से फोटो खींचें' : 'Take Photo with Camera'}
                </strong>
                <span style={{ fontSize: '10px', color: '#688574' }}>
                  {hi ? 'फोन या वेबकैम से लाइव फोटो' : 'Snap physical paper report'}
                </span>
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={handleCameraCapture}
                />
              </button>

              {/* Upload Document Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '20px',
                  background: 'linear-gradient(145deg, #f8faf6, #ffffff)',
                  border: '2px dashed #b8ceba',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  color: '#345e4a'
                }}
              >
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: '#eef6f0',
                  color: '#257860',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <UploadCloud size={22} />
                </div>
                <strong style={{ fontSize: '13px' }}>
                  {file ? file.name : (hi ? 'फाइल चुनें (PDF/JPG)' : 'Upload Report File')}
                </strong>
                <span style={{ fontSize: '10px', color: '#748d7b' }}>
                  PDF, JPG, PNG, WebP &middot; 15 MB
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const chosen = e.target.files?.[0];
                    if (chosen) {
                      setFile(chosen);
                      setFileId(null);
                      setError('');
                    }
                  }}
                />
              </button>
            </div>

            {/* Popular Test Lab Presets */}
            <div style={{ margin: '18px 0', borderTop: '1px solid #e5eee7', paddingTop: '16px' }}>
              <span className="eyebrow" style={{ color: '#257860', marginBottom: '8px' }}>
                <Building2 size={13} />
                {hi ? 'लोकप्रिय भारतीय टेस्ट लैब्स प्रीसेट:' : 'POPULAR DIAGNOSTIC LAB PRESETS:'}
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '8px' }}>
                {LAB_PRESETS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => loadPreset(p)}
                    style={{
                      textAlign: 'left',
                      padding: '10px 14px',
                      background: '#ffffff',
                      border: '1px solid #dbe6de',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                      cursor: 'pointer'
                    }}
                  >
                    <strong style={{ fontSize: '11px', color: '#1f4838' }}>{p.lab}</strong>
                    <span style={{ fontSize: '10px', color: '#748a7b' }}>{p.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Document Type & Manual Paste */}
            <label>
              {hi ? 'दस्तावेज़ का प्रकार' : 'Document Type'}
              <select value={kind} onChange={e => setKind(e.target.value as Report['type'])}>
                <option value="lab">{hi ? 'लैब रिपोर्ट (Pathology / Lab Report)' : 'Laboratory Report'}</option>
                <option value="prescription">{hi ? 'प्रिस्क्रिप्शन (Doctor Prescription)' : 'Doctor Prescription'}</option>
                <option value="medicine">{hi ? 'दवा पैकेज (Medicine Packaging)' : 'Medicine Packaging'}</option>
              </select>
            </label>

            <label>
              {hi ? 'या रिपोर्ट का टेक्स्ट पेस्ट करें' : 'Or Paste Report Text Manually'}
              <textarea
                rows={4}
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Fasting blood glucose 138 mg/dL 70-99&#10;Total cholesterol 228 mg/dL <200&#10;SGPT 62 U/L 7-56"
              />
            </label>

            <div className="row wrap" style={{ marginTop: '14px' }}>
              <button
                type="button"
                className="primary"
                disabled={!!busy || (!file && !text.trim())}
                onClick={() => extract(false)}
              >
                <ScanLine size={17} />
                {hi ? 'डिवाइस पर स्कैन व विश्लेषण करें' : 'Analyze on This Device'}
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                className="text-button"
                disabled={!!busy}
                onClick={() => {
                  setFile(null);
                  setFileId(null);
                  setText(sampleText);
                  setTitle('Comprehensive Metabolic & Diabetes Profile');
                  setLab('Metropolis Healthcare');
                  setKind('lab');
                }}
              >
                {hi ? 'काल्पनिक उदाहरण इस्तेमाल करें' : 'Use Sample Report'}
              </button>
            </div>
          </div>

          <aside>
            <div className="card ai-card">
              <span className="icon-box"><Sparkles /></span>
              <h2>{hi ? 'Gemini AI से पढ़ें' : 'Extract with Gemini AI'}</h2>
              <p>
                {hi
                  ? 'इमेज और PDF से स्वचालित परीक्षण निष्कर्ष निकालें। आप सहेजने से पहले हर मान की जांच कर सकते हैं।'
                  : 'Multimodal vision extraction from report images and PDFs. Review every result before saving.'}
              </p>
              <span className={'status ' + (ai ? 'good' : 'neutral')}>
                {ai ? (hi ? 'जुड़ा हुआ है (AI Connected)' : 'Connected') : (hi ? 'स्थानीय OCR उपलब्ध' : 'Local OCR Ready')}
              </span>
              <label className="check" style={{ marginTop: '14px' }}>
                <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />
                <span style={{ fontSize: '11px', color: '#445b4e' }}>
                  {hi
                    ? 'मैं इस रिपोर्ट को विश्लेषण हेतु Google Gemini के साथ साझा करने की अनुमति देता/देती हूं।'
                    : 'I consent to send this document to Google Gemini for multimodal extraction.'}
                </span>
              </label>
              <button
                type="button"
                className="secondary full"
                disabled={!ai || !file || !consent || !!busy}
                onClick={() => extract(true)}
              >
                {hi ? 'Gemini AI से निकालें' : 'Extract with Gemini AI'}
              </button>
            </div>

            <div className="small-note">
              <ShieldCheck size={18} />
              <p>
                {hi
                  ? 'डिवाइस OCR आपके कंप्यूटर पर निजी रहता है। हमेशा मूल लैब रिपोर्ट से मानों का मिलान करें।'
                  : 'On-device OCR processes data locally. Always compare extracted numbers with your official lab report.'}
              </p>
            </div>
          </aside>
        </div>
      ) : (
        /* Review Table */
        <form className="card review-card" onSubmit={e => { e.preventDefault(); save(); }}>
          <div className="section-head">
            <div>
              <h2>{hi ? 'हर परिणाम की जांच करें व पुष्टि करें' : 'Verify Extracted Test Results'}</h2>
              <p className="muted" style={{ margin: '2px 0 0', fontSize: '11px' }}>
                {hi ? '3D एनाटॉमी में अंग हाइलाइट करने से पहले मानों का मिलान करें' : 'Results will highlight affected organs in 3D Anatomy'}
              </p>
            </div>
            <span className="tag amber">{hi ? 'सत्यापन आवश्यक' : 'Review Required'}</span>
          </div>

          <div className="form-grid">
            <label>
              {hi ? 'रिपोर्ट का शीर्षक' : 'Report Title'}
              <input required maxLength={120} value={title} onChange={e => setTitle(e.target.value)} />
            </label>
            <label>
              {hi ? 'रिपोर्ट की तारीख' : 'Report Date'}
              <input required type="date" max={new Date().toISOString().slice(0, 10)} value={date} onChange={e => setDate(e.target.value)} />
            </label>
            <label>
              {hi ? 'प्रयोगशाला / लैब का नाम' : 'Diagnostic Lab'}
              <input maxLength={120} value={lab} onChange={e => setLab(e.target.value)} />
            </label>
          </div>

          {kind === 'lab' && (
            <>
              <div className="table-scroll">
                <table className="edit-table">
                  <thead>
                    <tr>
                      {['Test Name', 'Value', 'Unit', 'Lab Reference Range', ''].map((x, i) => (
                        <th key={i}>{hi ? ['जांच का नाम', 'मान (Value)', 'इकाई (Unit)', 'सामान्य सीमा (Range)', ''][i] : x}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i}>
                        {(['name', 'value', 'unit', 'range'] as const).map(k => (
                          <td key={k}>
                            <input
                              aria-label={`${k} row ${i + 1}`}
                              required={k === 'name' || k === 'value'}
                              value={r[k]}
                              onChange={e => editRow(i, k, e.target.value)}
                            />
                          </td>
                        ))}
                        <td>
                          <button
                            type="button"
                            aria-label={'Remove row ' + (i + 1)}
                            className="icon-button"
                            onClick={() => {
                              setRows(rows.filter((_, j) => i !== j));
                              setVerified(false);
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!rows.length && (
                <div className="notice">
                  {hi ? 'कोई पंक्ति नहीं मिली। नीचे बटन से मैन्युअली जांच जोड़ें।' : 'No rows extracted. Add test parameters manually.'}
                </div>
              )}

              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setRows([...rows, { name: '', value: '', unit: '', range: '' }]);
                  setVerified(false);
                }}
              >
                <Plus size={16} />
                {hi ? 'नया परिणाम जोड़ें' : 'Add Test Result'}
              </button>
            </>
          )}

          {kind !== 'lab' && (
            <label>
              {hi ? 'दवाइयों के नाम' : 'Medicine Names'}
              <textarea value={medicines} onChange={e => { setMedicines(e.target.value); setVerified(false); }} />
            </label>
          )}

          <details style={{ marginTop: '14px' }}>
            <summary>{hi ? 'मूल ट्रांसक्रिप्शन देखें' : 'View Extracted Raw Text'}</summary>
            <textarea
              rows={6}
              value={text}
              onChange={e => { setText(e.target.value); setVerified(false); }}
            />
          </details>

          <label className="check verification" style={{ marginTop: '18px' }}>
            <input
              required
              type="checkbox"
              checked={verified}
              onChange={e => setVerified(e.target.checked)}
            />
            <span style={{ fontSize: '11px', color: '#274435' }}>
              {hi
                ? 'मैंने मूल रिपोर्ट से सभी मान मिला लिए हैं और इन्हें 3D एनाटॉमी विश्लेषण के लिए सहेजने की पुष्टि करता/करती हूं।'
                : 'I have verified these parameters against the official laboratory report and approve saving for 3D anatomy insights.'}
            </span>
          </label>

          <div className="row wrap" style={{ marginTop: '18px' }}>
            <button
              type="button"
              className="secondary"
              disabled={!!busy}
              onClick={() => setPhase(0)}
            >
              {hi ? 'वापस' : 'Back'}
            </button>

            <button
              type="submit"
              className="primary"
              disabled={!verified || !!busy || (kind === 'lab' && !rows.length)}
            >
              <CheckCircle2 size={17} />
              {hi ? 'सत्यापित रिपोर्ट सहेजें व 3D में देखें' : 'Save & View in 3D Anatomy'}
            </button>
          </div>
        </form>
      )}

      <button className="text-button" disabled={!!busy} onClick={onCancel} style={{ marginTop: '14px' }}>
        {hi ? 'रद्द करें' : 'Cancel'}
      </button>
    </section>
  );
}
