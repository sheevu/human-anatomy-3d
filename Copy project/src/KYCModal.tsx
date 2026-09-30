import { useState } from 'react';
import { ShieldCheck, UserCheck, Globe, CheckCircle2, LockKeyhole, AlertCircle } from 'lucide-react';
import type { KYCData, User } from './types';

export const NATIONALITIES = [
  'Indian', 'American', 'British', 'Canadian', 'Australian',
  'Emirati (UAE)', 'Singaporean', 'German', 'French', 'Japanese',
  'Bangladeshi', 'Nepalese', 'Sri Lankan', 'Malaysian', 'Saudi Arabian',
  'South African', 'New Zealander', 'Dutch', 'Irish', 'Other'
];

export const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'United Arab Emirates', 'Singapore', 'Germany', 'France', 'Japan',
  'Bangladesh', 'Nepal', 'Sri Lanka', 'Malaysia', 'Saudi Arabia',
  'South Africa', 'New Zealand', 'Netherlands', 'Ireland', 'Other'
];

export const ID_TYPES = [
  'Aadhaar Card (UIDAI)', 'Passport', 'Voter ID Card',
  'PAN Card', 'Driving License', 'National Health ID (ABHA)', 'National Identity Card'
];

export default function KYCModal({
  user,
  hi,
  onComplete,
  onSkip
}: {
  user: User;
  hi: boolean;
  onComplete: (data: KYCData) => Promise<void>;
  onSkip?: () => void;
}) {
  const [fullName, setFullName] = useState(user.name || '');
  const [nationality, setNationality] = useState('Indian');
  const [country, setCountry] = useState('India');
  const [stateCity, setStateCity] = useState('');
  const [idType, setIdType] = useState('Aadhaar Card (UIDAI)');
  const [idNumber, setIdNumber] = useState('');
  const [dob, setDob] = useState(user.dob || '');
  const [gender, setGender] = useState(user.gender || 'Male');
  const [phone, setPhone] = useState(user.phone || '');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      setError(hi ? 'कृपया घोषणा व सहमति बॉक्स को चेक करें।' : 'Please check the consent declaration box.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await onComplete({
        fullName,
        nationality,
        country,
        stateCity,
        idType,
        idNumber,
        dob,
        gender,
        phone,
        consent: true
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="kyc-overlay" style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(21, 38, 30, 0.72)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      overflowY: 'auto'
    }}>
      <div className="kyc-card card" style={{
        maxWidth: '640px',
        width: '100%',
        maxHeight: '92vh',
        overflowY: 'auto',
        background: '#fff',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
        border: '1px solid #d4dfd4'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            background: '#eef6f0',
            color: '#26795f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <UserCheck size={26} />
          </div>
          <div>
            <span className="eyebrow" style={{ color: '#257860' }}>
              {hi ? 'सुरक्षित पहचान सत्यापन' : 'PATIENT KYC & VERIFICATION'}
            </span>
            <h2 style={{ fontSize: '22px', margin: '2px 0 0', color: '#1c3e32' }}>
              {hi ? 'उपयोगकर्ता पहचान व निवास सत्यापन' : 'Patient KYC & Identity Details'}
            </h2>
          </div>
        </div>

        <p className="muted" style={{ fontSize: '12px', marginBottom: '22px', lineHeight: '1.6' }}>
          {hi
            ? 'स्वास्थ्य रिपोर्टों के सुरक्षित मिलान और चिकित्सा नियमों के अनुपालन हेतु कृपया अपनी राष्ट्रीयता और निवास देश विवरण सत्यापित करें।'
            : 'To comply with patient safety standards and provide personalized reference ranges, please confirm your nationality, country of residence, and basic identity.'}
        </p>

        {error && (
          <div className="error" role="alert" style={{ marginBottom: '18px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
          <div className="form-grid">
            <label style={{ margin: 0 }}>
              {hi ? 'पूरा कानूनी नाम' : 'Full Legal Name'} *
              <input
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder={hi ? 'उदा. राहुल शर्मा' : 'e.g. Rahul Sharma'}
              />
            </label>
            <label style={{ margin: 0 }}>
              {hi ? 'संपर्क फोन नंबर' : 'Phone / Mobile Number'}
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </label>
          </div>

          <div className="form-grid">
            <label style={{ margin: 0 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe size={14} />
                {hi ? 'राष्ट्रीयता (Nationality)' : 'Nationality'} *
              </span>
              <select
                required
                value={nationality}
                onChange={e => setNationality(e.target.value)}
              >
                {NATIONALITIES.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>

            <label style={{ margin: 0 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe size={14} />
                {hi ? 'निवास देश (Country of Residence)' : 'Country of Residence'} *
              </span>
              <select
                required
                value={country}
                onChange={e => setCountry(e.target.value)}
              >
                {COUNTRIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-grid">
            <label style={{ margin: 0 }}>
              {hi ? 'राज्य व शहर' : 'State & City'}
              <input
                value={stateCity}
                onChange={e => setStateCity(e.target.value)}
                placeholder={hi ? 'उदा. दिल्ली, मुंबई, बंगलुरु' : 'e.g. New Delhi, Mumbai, Bengaluru'}
              />
            </label>
            <label style={{ margin: 0 }}>
              {hi ? 'जन्म तिथि' : 'Date of Birth'} *
              <input
                type="date"
                required
                max={new Date().toISOString().slice(0, 10)}
                value={dob}
                onChange={e => setDob(e.target.value)}
              />
            </label>
          </div>

          <div className="form-grid">
            <label style={{ margin: 0 }}>
              {hi ? 'पहचान पत्र का प्रकार' : 'ID Document Type'} *
              <select
                required
                value={idType}
                onChange={e => setIdType(e.target.value)}
              >
                {ID_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>

            <label style={{ margin: 0 }}>
              {hi ? 'पहचान संख्या / ID Number' : 'Document ID Number'}
              <input
                value={idNumber}
                onChange={e => setIdNumber(e.target.value)}
                placeholder="XXXX-XXXX-XXXX"
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', margin: '6px 0' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#556c5c' }}>
              {hi ? 'लिंग (Gender):' : 'Gender:'}
            </span>
            {['Male', 'Female', 'Other'].map(g => (
              <label key={g} style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 400, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="gender"
                  checked={gender === g}
                  onChange={() => setGender(g)}
                  style={{ width: 'auto', minHeight: 'auto', margin: 0 }}
                />
                {hi ? (g === 'Male' ? 'पुरुष' : g === 'Female' ? 'महिला' : 'अन्य') : g}
              </label>
            ))}
          </div>

          <div style={{
            background: '#f4f8f4',
            border: '1px solid #dbe7dc',
            borderRadius: '10px',
            padding: '14px 16px',
            marginTop: '8px'
          }}>
            <label className="check" style={{ margin: 0, cursor: 'pointer' }}>
              <input
                type="checkbox"
                required
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
              />
              <span style={{ fontSize: '11px', lineHeight: '1.6', color: '#445b4c' }}>
                {hi
                  ? 'मैं प्रमाणित करता/करती हूं कि प्रदान की गई राष्ट्रीयता, देश और पहचान जानकारी सही है। मैं अपने स्वास्थ्य रिकॉर्ड को सुरक्षित रूप से संसाधित करने की सहमति देता/देती हूं।'
                  : 'I declare that the nationality, country, and identity information provided is accurate, and I consent to secure local encrypted processing of my health records.'}
              </span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', gap: '12px' }}>
            {onSkip ? (
              <button
                type="button"
                className="secondary"
                onClick={onSkip}
                disabled={busy}
              >
                {hi ? 'बाद में करें (Skip for now)' : 'Skip for now'}
              </button>
            ) : <div />}

            <button
              type="submit"
              className="primary"
              disabled={busy || !consent}
              style={{ minWidth: '180px' }}
            >
              {busy ? (hi ? 'सत्यापित हो रहा है…' : 'Saving KYC…') : (
                <>
                  <CheckCircle2 size={16} />
                  {hi ? 'KYC पूर्ण करें' : 'Complete & Proceed'}
                </>
              )}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '8px', color: '#7a8f81', fontSize: '10px' }}>
            <LockKeyhole size={13} />
            <span>
              {hi
                ? 'डेटा सुरक्षित रूप से एन्क्रिप्टेड है और केवल आपके व्यक्तिगत स्वास्थ्य विश्लेषण के लिए उपयोग किया जाता है।'
                : 'Data is encrypted locally and used solely to correlate diagnostic and country-specific ranges.'}
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
