import { useState, useMemo, useEffect } from 'react';
import {
  Activity, Plus, Trash2, Calendar, Clock, TrendingUp, AlertTriangle,
  CheckCircle2, Droplets, Info, HeartPulse, ArrowRight, ShieldAlert, Sparkles
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import type { DiabetesRecord, Profile } from './types';

export default function DiabetesTracker({
  profile,
  hi,
  records,
  onSaveRecord,
  onDeleteRecord
}: {
  profile: Profile;
  hi: boolean;
  records: DiabetesRecord[];
  onSaveRecord: (rec: Omit<DiabetesRecord, 'id' | 'createdAt'>) => Promise<void>;
  onDeleteRecord: (id: string) => Promise<void>;
}) {
  // Auto-selected date and time
  const todayStr = new Date().toISOString().slice(0, 10);
  const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

  const [timing, setTiming] = useState<DiabetesRecord['timing']>('before_food');
  const [date, setDate] = useState(todayStr);
  const [time, setTime] = useState(nowTimeStr);
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');
  const [filter, setFilter] = useState<'all' | 'before_food' | 'after_food'>('all');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Status calculation based on clinical ADA guidelines
  function getStatus(val: number, t: DiabetesRecord['timing']): DiabetesRecord['status'] {
    if (val < 70) return 'low';
    if (t === 'before_food') {
      if (val <= 99) return 'normal';
      if (val <= 125) return 'elevated';
      return 'high';
    } else if (t === 'after_food') {
      if (val < 140) return 'normal';
      if (val <= 199) return 'elevated';
      return 'high';
    } else {
      if (val <= 120) return 'normal';
      if (val <= 160) return 'elevated';
      return 'high';
    }
  }

  const numVal = parseFloat(value);
  const currentStatus = !isNaN(numVal) ? getStatus(numVal, timing) : null;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (isNaN(numVal) || numVal < 20 || numVal > 600) {
      setError(hi ? 'कृपया 20 से 600 mg/dL के बीच वैध ब्लड शुगर दर्ज करें।' : 'Please enter a valid glucose value between 20 and 600 mg/dL.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await onSaveRecord({
        profileId: profile.id,
        date,
        time,
        timing,
        value: Math.round(numVal),
        unit: 'mg/dL',
        notes: notes.trim(),
        status: currentStatus || 'normal'
      });
      setValue('');
      setNotes('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Analytics
  const profileRecords = useMemo(() => {
    return records
      .filter(r => r.profileId === profile.id)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }, [records, profile.id]);

  const filteredRecords = useMemo(() => {
    if (filter === 'all') return [...profileRecords].reverse();
    return profileRecords.filter(r => r.timing === filter).reverse();
  }, [profileRecords, filter]);

  const stats = useMemo(() => {
    if (!profileRecords.length) return null;
    const fasting = profileRecords.filter(r => r.timing === 'before_food').map(r => r.value);
    const postMeal = profileRecords.filter(r => r.timing === 'after_food').map(r => r.value);
    const all = profileRecords.map(r => r.value);

    const avgFasting = fasting.length ? Math.round(fasting.reduce((a, b) => a + b, 0) / fasting.length) : null;
    const avgPost = postMeal.length ? Math.round(postMeal.reduce((a, b) => a + b, 0) / postMeal.length) : null;
    const totalAvg = Math.round(all.reduce((a, b) => a + b, 0) / all.length);

    // Estimated HbA1c = (Average Glucose + 46.7) / 28.7
    const eA1c = ((totalAvg + 46.7) / 28.7).toFixed(1);

    const inRange = profileRecords.filter(r => r.status === 'normal').length;
    const inRangePct = Math.round((inRange / profileRecords.length) * 100);

    return {
      latest: profileRecords[profileRecords.length - 1],
      avgFasting,
      avgPost,
      totalAvg,
      eA1c,
      inRangePct,
      count: profileRecords.length
    };
  }, [profileRecords]);

  // Chart data formatting
  const chartData = useMemo(() => {
    return profileRecords.map(r => ({
      dateTime: `${r.date.slice(5)} ${r.time}`,
      value: r.value,
      timing: r.timing === 'before_food' ? (hi ? 'भोजन से पहले' : 'Before Food') : (hi ? 'भोजन के बाद' : 'After Food'),
      status: r.status
    }));
  }, [profileRecords, hi]);

  return (
    <div className="diabetes-page" style={{ paddingBottom: '40px' }}>
      {/* Header */}
      <div className="welcome" style={{ marginBottom: '24px' }}>
        <div>
          <span className="eyebrow" style={{ color: '#257860' }}>
            <Activity size={14} />
            {hi ? 'दैनिक ग्लूकोज लॉग व नियंत्रण' : 'DAILY GLUCOSE MANAGEMENT'}
          </span>
          <h1 style={{ fontSize: '28px', margin: '6px 0 4px', color: '#1d3e33' }}>
            {hi ? 'दैनिक मधुमेह (शुगर) रिकॉर्ड' : 'Daily Diabetes Log & Trends'}
          </h1>
          <p className="muted" style={{ fontSize: '13px' }}>
            {hi
              ? `प्रोफ़ाइल: ${profile.name} · भोजन से पहले व बाद की शुगर दर्ज करें, ट्रेंड देखें और सामान्य स्तर बनाए रखें।`
              : `Tracking for ${profile.name} · Record Before-Food & After-Food glucose, view trends, and maintain clinical target.`}
          </p>
        </div>
      </div>

      {/* Top Stats Cards */}
      {stats && (
        <div className="stats-grid" style={{ marginBottom: '24px' }}>
          <div className="stat-card" style={{ borderLeft: '4px solid #207761' }}>
            <span className="stat-icon green">
              <Droplets />
            </span>
            <div>
              <span>{hi ? 'नवीनतम शुगर' : 'Latest Reading'}</span>
              <strong>
                {stats.latest.value}
                <small style={{ fontSize: '11px', color: '#688273' }}>
                  mg/dL ({stats.latest.timing === 'before_food' ? (hi ? 'खाली पेट' : 'Fasting') : (hi ? 'भोजन बाद' : 'Post-Meal')})
                </small>
              </strong>
            </div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #b78939' }}>
            <span className="stat-icon amber">
              <TrendingUp />
            </span>
            <div>
              <span>{hi ? 'औसत (खाली पेट / भोजन बाद)' : 'Avg Fasting / Post-Meal'}</span>
              <strong>
                {stats.avgFasting || '—'} / {stats.avgPost || '—'}
                <small style={{ fontSize: '10px', color: '#88988a' }}>mg/dL</small>
              </strong>
            </div>
          </div>

          <div className="stat-card" style={{ borderLeft: '4px solid #8e62ac' }}>
            <span className="stat-icon lavender">
              <Activity />
            </span>
            <div>
              <span>{hi ? 'अनुमानित HbA1c / सामान्य %' : 'Est. HbA1c / In-Range'}</span>
              <strong>
                ~{stats.eA1c}%
                <small style={{ fontSize: '11px', color: '#628a6f' }}>
                  {stats.inRangePct}% {hi ? 'लक्ष्य में' : 'in target'}
                </small>
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Entry Form + Trend Chart */}
      <div className="dashboard-grid" style={{ gap: '24px', marginBottom: '24px' }}>
        {/* Entry Form */}
        <section className="card" style={{ border: '1px solid #d8e5db', borderRadius: '14px', padding: '24px' }}>
          <div className="section-head" style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: '#eef6f0', color: '#257860', display: 'flex',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <Plus size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '17px', margin: 0, color: '#1c3e32' }}>
                  {hi ? 'नई शुगर जांच दर्ज करें' : 'Record Blood Glucose'}
                </h2>
                <p className="muted" style={{ margin: 0, fontSize: '11px' }}>
                  {hi ? 'तारीख, समय, भोजन स्थिति व मान चुनें' : 'Auto-selected date & time with meal timing'}
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="error" role="alert" style={{ marginBottom: '16px' }}>
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAdd} style={{ display: 'grid', gap: '14px' }}>
            {/* Meal Timing Dropdown */}
            <label style={{ margin: 0 }}>
              <span style={{ fontWeight: 600, color: '#385747', fontSize: '12px' }}>
                {hi ? 'भोजन की स्थिति (Meal Timing) *' : 'Meal Timing *'}
              </span>
              <select
                required
                value={timing}
                onChange={e => setTiming(e.target.value as DiabetesRecord['timing'])}
                style={{
                  border: '1.5px solid #c9d8cc',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  fontWeight: 500,
                  backgroundColor: '#fbfdfb'
                }}
              >
                <option value="before_food">
                  {hi ? 'भोजन से पहले (Before food / Fasting)' : 'Before food (Fasting / Pre-meal)'}
                </option>
                <option value="after_food">
                  {hi ? 'भोजन के बाद (After food / 2 hrs Post-meal)' : 'After food (Post-prandial / 2 hrs)'}
                </option>
                <option value="bedtime">
                  {hi ? 'सोते समय (Bedtime / Night)' : 'Bedtime (Night)'}
                </option>
                <option value="random">
                  {hi ? 'सामान्य / अन्य (Random)' : 'Random / Other'}
                </option>
              </select>
            </label>

            {/* Date & Time Row */}
            <div className="form-grid">
              <label style={{ margin: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#385747', fontSize: '12px' }}>
                  <Calendar size={13} />
                  {hi ? 'तारीख (Auto Date)' : 'Date (Auto-Selected)'} *
                </span>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  max={todayStr}
                  style={{ borderRadius: '8px' }}
                />
              </label>

              <label style={{ margin: 0 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#385747', fontSize: '12px' }}>
                  <Clock size={13} />
                  {hi ? 'समय (Auto Time)' : 'Time (Auto-Selected)'} *
                </span>
                <input
                  type="time"
                  required
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  style={{ borderRadius: '8px' }}
                />
              </label>
            </div>

            {/* Value (mg/dL) */}
            <label style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: '#385747', fontSize: '12px' }}>
                  {hi ? 'शुगर का मान (Blood Glucose Value) *' : 'Glucose Reading (mg/dL) *'}
                </span>
                {currentStatus && (
                  <span className={`status ${currentStatus === 'normal' ? 'good' : currentStatus === 'elevated' ? 'attention' : 'attention'}`} style={{
                    fontSize: '10px',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontWeight: 600
                  }}>
                    <i></i>
                    {currentStatus === 'normal'
                      ? (hi ? 'सामान्य (In Range)' : 'Optimal Target')
                      : currentStatus === 'elevated'
                        ? (hi ? 'हल्का बढ़ा हुआ (Pre-diabetic)' : 'Elevated / Borderline')
                        : currentStatus === 'low'
                          ? (hi ? 'कम (Low Sugar)' : 'Hypoglycemia Alert')
                          : (hi ? 'अधिक (High Sugar)' : 'High / Hyperglycemia')}
                  </span>
                )}
              </div>
              <div style={{ position: 'relative', marginTop: '6px' }}>
                <input
                  type="number"
                  step="1"
                  min="20"
                  max="600"
                  required
                  placeholder={hi ? 'उदा. 95 (फास्टिंग) या 130 (भोजन बाद)' : 'e.g. 95 (Fasting) or 135 (Post-meal)'}
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  style={{
                    paddingRight: '60px',
                    fontSize: '16px',
                    fontWeight: 600,
                    borderRadius: '8px'
                  }}
                />
                <span style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#7e9385',
                  fontSize: '12px',
                  fontWeight: 600
                }}>
                  mg/dL
                </span>
              </div>
            </label>

            {/* Optional Notes */}
            <label style={{ margin: 0 }}>
              <span style={{ fontWeight: 500, color: '#688273', fontSize: '11px' }}>
                {hi ? 'टिप्पणी (वैकल्पिक: भोजन या व्यायाम विवरण)' : 'Notes (optional context: meal details, walk)'}
              </span>
              <input
                value={notes}
                maxLength={100}
                placeholder={hi ? 'उदा. सुबह 2 रोटी व दाल, 20 मिनट टहलना' : 'e.g. 2 rotis with dal, 30 min morning walk'}
                onChange={e => setNotes(e.target.value)}
                style={{ borderRadius: '8px', fontSize: '12px' }}
              />
            </label>

            {/* Target Guidance snippet */}
            <div style={{
              background: '#f8faf7',
              border: '1px solid #e2ece3',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '11px',
              color: '#526e5d'
            }}>
              <strong>{hi ? 'क्लीनिकल मानक लक्ष्य:' : 'Clinical Target Range:'}</strong>
              <div style={{ display: 'flex', gap: '14px', marginTop: '4px', flexWrap: 'wrap' }}>
                <span>• {hi ? 'भोजन से पहले (Fasting):' : 'Before Food:'} <b>70–99 mg/dL</b></span>
                <span>• {hi ? 'भोजन के 2 घंटे बाद:' : 'After Food (2 hrs):'} <b>&lt; 140 mg/dL</b></span>
              </div>
            </div>

            <button
              type="submit"
              className="primary"
              disabled={busy || !value}
              style={{ minHeight: '44px', marginTop: '6px' }}
            >
              <CheckCircle2 size={16} />
              {busy ? (hi ? 'सहेज रहे हैं…' : 'Saving…') : (hi ? 'रीडिंग सहेजें' : 'Save Glucose Reading')}
            </button>
          </form>
        </section>

        {/* Visual Trend Chart */}
        <section className="card" style={{ border: '1px solid #d8e5db', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div className="section-head" style={{ marginBottom: '14px' }}>
            <div>
              <span className="eyebrow" style={{ color: '#257860' }}>
                <TrendingUp size={14} />
                {hi ? 'ग्लाइकेमिक ट्रेंड ग्राफ' : 'GLYCEMIC TREND VISUALIZER'}
              </span>
              <h2 style={{ fontSize: '17px', margin: '2px 0 0', color: '#1c3e32' }}>
                {hi ? 'रक्त शर्करा स्तर ग्राफ' : 'Blood Sugar Timeline (mg/dL)'}
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '6px', fontSize: '11px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#257860', fontWeight: 600 }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#257860' }} />
                {hi ? 'सामान्य क्षेत्र' : 'Normal Target Zone (70-140)'}
              </span>
            </div>
          </div>

          {chartData.length > 0 ? (
            <div style={{ width: '100%', height: '310px', marginTop: 'auto' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 25 }}>
                  <defs>
                    <linearGradient id="sugarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#257860" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#257860" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8ede7" />
                  <XAxis
                    dataKey="dateTime"
                    tick={{ fontSize: 9, fill: '#6c8273' }}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis
                    domain={[40, 'auto']}
                    tick={{ fontSize: 10, fill: '#6c8273' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #d4dfd4',
                      borderRadius: '8px',
                      fontSize: '11px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                    }}
                    formatter={(val: unknown) => [`${val} mg/dL`, hi ? 'ग्लूकोज' : 'Glucose']}
                  />
                  <ReferenceLine y={140} stroke="#c48a34" strokeDasharray="4 4" label={{ value: 'Post-Meal Max (140)', position: 'top', fill: '#b27b27', fontSize: 9 }} />
                  <ReferenceLine y={100} stroke="#2e8a6f" strokeDasharray="4 4" label={{ value: 'Fasting Max (100)', position: 'bottom', fill: '#2e8a6f', fontSize: 9 }} />
                  <ReferenceLine y={70} stroke="#a84343" strokeDasharray="4 4" label={{ value: 'Low (70)', position: 'bottom', fill: '#a84343', fontSize: 9 }} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#257860"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#sugarGrad)"
                    dot={{ r: 4, fill: '#257860', strokeWidth: 1.5, stroke: '#ffffff' }}
                    activeDot={{ r: 6, fill: '#1b5b49' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty" style={{ margin: 'auto', padding: '40px 20px' }}>
              <Droplets size={38} color="#8aa292" />
              <h3>{hi ? 'अभी कोई रिकॉर्ड नहीं' : 'No Glucose Logs Yet'}</h3>
              <p>{hi ? 'बाईं ओर के फॉर्म से अपनी पहली फास्टिंग या भोजन बाद की शुगर जांच दर्ज करें।' : 'Use the form on the left to add your first reading.'}</p>
            </div>
          )}
        </section>
      </div>

      {/* History Log Table & Clinical Care Section */}
      <div className="dashboard-grid" style={{ gap: '24px' }}>
        {/* History Table */}
        <section className="card" style={{ border: '1px solid #d8e5db', borderRadius: '14px', padding: '24px' }}>
          <div className="section-head" style={{ marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '17px', margin: 0, color: '#1c3e32' }}>
                {hi ? 'हालिया लॉग इतिहास' : 'Recent Glucose History'}
              </h2>
              <p className="muted" style={{ margin: '2px 0 0', fontSize: '11px' }}>
                {filteredRecords.length} {hi ? 'दर्ज परिणाम' : 'entries logged'}
              </p>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['all', 'before_food', 'after_food'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '11px',
                    borderRadius: '6px',
                    border: '1px solid',
                    borderColor: filter === f ? '#257860' : '#d8e4db',
                    background: filter === f ? '#eef5f0' : '#ffffff',
                    color: filter === f ? '#257860' : '#576f61',
                    fontWeight: filter === f ? 600 : 400
                  }}
                >
                  {f === 'all'
                    ? (hi ? 'सभी (All)' : 'All')
                    : f === 'before_food'
                      ? (hi ? 'भोजन से पहले' : 'Before Food')
                      : (hi ? 'भोजन के बाद' : 'After Food')}
                </button>
              ))}
            </div>
          </div>

          {filteredRecords.length > 0 ? (
            <div className="table-scroll">
              <table className="edit-table" style={{ width: '100%', minWidth: '560px' }}>
                <thead>
                  <tr style={{ borderBottom: '1.5px solid #dce6de' }}>
                    <th style={{ width: '22%' }}>{hi ? 'तारीख व समय' : 'Date & Time'}</th>
                    <th style={{ width: '24%' }}>{hi ? 'भोजन स्थिति' : 'Meal Timing'}</th>
                    <th style={{ width: '20%' }}>{hi ? 'रीडिंग (mg/dL)' : 'Reading'}</th>
                    <th style={{ width: '24%' }}>{hi ? 'टिप्पणी / संदर्भ' : 'Notes'}</th>
                    <th style={{ width: '10%', textAlign: 'right' }}>{hi ? 'हटाएं' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #edf2ee' }}>
                      <td style={{ fontSize: '11px', color: '#274437' }}>
                        <strong>{r.date}</strong>
                        <div style={{ fontSize: '10px', color: '#7a8e81' }}>{r.time}</div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '5px',
                          fontSize: '10px',
                          fontWeight: 600,
                          background: r.timing === 'before_food' ? '#eaf3ec' : '#f8f4e6',
                          color: r.timing === 'before_food' ? '#216c54' : '#8d6d2b'
                        }}>
                          {r.timing === 'before_food'
                            ? (hi ? 'भोजन से पहले (Fasting)' : 'Before Food (Fasting)')
                            : r.timing === 'after_food'
                              ? (hi ? 'भोजन बाद (Post-meal)' : 'After Food (2h)')
                              : r.timing === 'bedtime'
                                ? (hi ? 'सोते समय (Bedtime)' : 'Bedtime')
                                : (hi ? 'रैंडम (Random)' : 'Random')}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                          <span style={{ fontSize: '16px', fontWeight: 700, color: '#1c3e32' }}>
                            {r.value}
                          </span>
                          <span style={{ fontSize: '10px', color: '#748b7d' }}>mg/dL</span>
                          <span className={`status ${r.status === 'normal' ? 'good' : 'attention'}`} style={{ fontSize: '9px', padding: '2px 5px' }}>
                            {r.status === 'normal'
                              ? (hi ? 'सामान्य' : 'Normal')
                              : r.status === 'elevated'
                                ? (hi ? 'हल्का अधिक' : 'Borderline')
                                : r.status === 'low'
                                  ? (hi ? 'कम' : 'Low')
                                  : (hi ? 'अधिक' : 'High')}
                          </span>
                        </div>
                      </td>
                      <td style={{ fontSize: '11px', color: '#567162' }}>
                        {r.notes || '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="icon-button danger-text"
                          aria-label="Delete entry"
                          onClick={() => onDeleteRecord(r.id)}
                          style={{ width: '28px', height: '28px' }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty compact">
              <p>{hi ? 'इस फ़िल्टर में कोई रिकॉर्ड उपलब्ध नहीं है।' : 'No records match the selected filter.'}</p>
            </div>
          )}
        </section>

        {/* Clinical Cure & Lifestyle Tips for Diabetes */}
        <section className="card" style={{ border: '1px solid #d8e5db', borderRadius: '14px', padding: '24px' }}>
          <div className="section-head" style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: '#fdf3e2', color: '#a07727', display: 'flex',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <Sparkles size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '17px', margin: 0, color: '#1c3e32' }}>
                  {hi ? 'मधुमेह प्रबंधन व उपयोगी सुझाव' : 'Evidence-Based Diabetes Care'}
                </h2>
                <p className="muted" style={{ margin: 0, fontSize: '11px' }}>
                  {hi ? 'आहार, जीवनशैली व सावधानियां' : 'Dietary guidance, exercise, & precautions'}
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '14px', fontSize: '12px', lineHeight: '1.7', color: '#446051' }}>
            <div style={{ background: '#f5f9f5', border: '1px solid #dbe8dd', borderRadius: '10px', padding: '14px' }}>
              <strong style={{ color: '#257860', display: 'block', marginBottom: '4px' }}>
                🥗 {hi ? 'सर्वोत्तम आहार (Foods to Include):' : 'Glycemic-Smart Nutrition:'}
              </strong>
              <span>
                {hi
                  ? 'करेला, मेथी दाना का पानी, जामुन का सिरका, दालचीनी। मोटे अनाज (ज्वार, बाजरा, रागी) और भोजन से पहले कच्चा खीरा व हरी सलाद लें।'
                  : 'Bitter gourd (Karela), fenugreek (Methi) seeds, cinnamon, jamun fruit. Choose whole millets (Ragi, Jowar) and consume a raw vegetable salad before meals.'}
              </span>
            </div>

            <div style={{ background: '#fdf6f4', border: '1px solid #f2ded9', borderRadius: '10px', padding: '14px' }}>
              <strong style={{ color: '#b24c3a', display: 'block', marginBottom: '4px' }}>
                ⚠️ {hi ? 'परहेज करें (Foods to Avoid):' : 'Items to Strictly Limit:'}
              </strong>
              <span>
                {hi
                  ? 'सफेद चीनी, मैदा, पैकेटबंद जूस, कोल्ड ड्रिंक्स और अधिक मीठे फल (आम, चीकू)। भोजन के तुरंत बाद लेटने से बचें।'
                  : 'Refined white flour (Maida), table sugar, sweet beverages, packaged juices, and high-glycemic fruits like mango and sapota.'}
              </span>
            </div>

            <div style={{ background: '#f7f6fd', border: '1px solid #e5e0f7', borderRadius: '10px', padding: '14px' }}>
              <strong style={{ color: '#684bb5', display: 'block', marginBottom: '4px' }}>
                🚶 {hi ? 'दैनिक आदतें (Daily Habits):' : 'Post-Meal Walking & Routine:'}
              </strong>
              <span>
                {hi
                  ? 'प्रत्येक मुख्य भोजन के बाद 15-20 मिनट की हल्की वॉक इंसुलिन संवेदनशीलता को 30% तक बढ़ाती है। तनाव कम रखें और 7 घंटे सोएं।'
                  : 'A 15-20 minute brisk walk immediately after lunch and dinner markedly reduces post-prandial glucose spikes. Maintain 7-8 hours of sleep.'}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
