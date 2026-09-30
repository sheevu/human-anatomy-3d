import {lazy,Suspense,useEffect,useRef,useState,type ReactNode} from 'react';
import {
  Activity,ArrowDownToLine,ArrowRight,Bell,BookOpen,CheckCircle2,ChevronDown,
  ChevronRight,ClipboardCheck,FileText,Heart,HeartPulse,LayoutDashboard,Leaf,
  LockKeyhole,LogOut,Menu,MessageCircle,Plus,ScanLine,Search,Settings,
  ShieldCheck,Sparkles,Stethoscope,Trash2,Users,X,Camera,Globe,UserCheck,
  Droplets,UploadCloud,Building2
} from 'lucide-react';
import {api,cloud,downloadBlob} from './api';
import {copy} from './i18n';
import {insight,organs,organFor,rangeStatus,LAB_PRESETS} from './medical.js';
import type {Profile,Report,ServiceStatus,User,DiabetesRecord} from './types';
import Scan from './Scan';
import Summary from './Summary';
import KYCModal from './KYCModal';
import DiabetesTracker from './DiabetesTracker';
import Chat from './Chat';
import OrganCareModal from './OrganCareModal';

const Anatomy=lazy(()=>import('./Anatomy'));

type Page='overview'|'reports'|'anatomy'|'diabetes'|'chat'|'family'|'medicines'|'wellness'|'settings'|'scan'|'detail';

const nav=[
  ['overview',LayoutDashboard],
  ['reports',FileText],
  ['anatomy',HeartPulse],
  ['diabetes',Activity],
  ['chat',MessageCircle],
  ['family',Users],
  ['medicines',BookOpen],
  ['wellness',Leaf]
] as const;

function Logo(){
  return <div className="brand"><span className="brand-symbol"><ShieldCheck size={25}/></span><div>VedaShield<span className="brand-ai">AI</span><small>YOUR HEALTH, UNDERSTOOD</small></div></div>;
}

function Modal({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}){
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{dialog.current?.showModal();return()=>dialog.current?.close()},[]);
  return <dialog ref={dialog} onCancel={onClose} onClick={e=>{if(e.target===dialog.current)onClose()}}><div className="dialog-head"><h2>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X/></button></div>{children}</dialog>;
}

function Status({value,hi=false}:{value:string;hi?:boolean}){
  return <span className={'status '+(value==='within'?'good':value==='unknown'?'neutral':'attention')}><i/>{hi?({within:'सीमा में',high:'सीमा से ऊपर',low:'सीमा से नीचे',unknown:'जांच आवश्यक'} as Record<string,string>)[value]:({within:'Within range',high:'Above range',low:'Below range',unknown:'Check range'} as Record<string,string>)[value]||value}</span>;
}

function Auth({onAuth,hi,setHi}:{onAuth:(u:User)=>void;hi:boolean;setHi:(v:boolean)=>void}){
  const [register,setRegister]=useState(false),[name,setName]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');

  return (
    <main className="auth-page">
      <div className="auth-visual">
        <Logo/>
        <div className="auth-message">
          <span className="eyebrow">{hi ? 'स्मार्ट सुरक्षा · विशेषज्ञ देखभाल' : 'A LITTLE CLARITY. A LOT MORE CONFIDENCE.'}</span>
          <h1>{hi ? 'आपकी सेहत एक कहानी है।\nअपनी समझें।' : 'Your health is a story.\nUnderstand yours.'}</h1>
          <p>{hi ? 'पारिवारिक लैब रिकॉर्ड, 3D मानव शरीर रचना, दैनिक शुगर लॉग और हिंदी व अंग्रेजी में एआई स्वास्थ्य संवाद।' : 'A thoughtful space for family records, 3D anatomy exploration, daily diabetes monitoring, and bilingual AI assistance.'}</p>
          <div className="auth-orbit">
            <HeartPulse size={80}/>
            <span className="floating-pill one"><FileText size={17}/>{hi ? 'लैब रिपोर्ट से 3D समझ' : 'Reports to 3D anatomy'}</span>
            <span className="floating-pill two"><ShieldCheck size={17}/>{hi ? 'सुरक्षित व सत्यापित' : 'Secure & verified'}</span>
          </div>
        </div>
        <p className="auth-foot">{hi ? 'सहानुभूति व समझ के साथ निर्मित।' : 'Built for understanding. Guided by care.'}</p>
      </div>

      <div className="auth-panel">
        <button className="language" onClick={()=>setHi(!hi)}>{hi?'English':'हिंदी'} <span>अ / EN</span></button>
        <div className="auth-form">
          <span className="icon-box"><HeartPulse/></span>
          <h2>{hi?(register?'आपका स्वागत है':'वापस स्वागत है'):(register?'Make space for better health.':'Welcome to your health space.')}</h2>
          <p className="muted">{hi?'अपने और परिवार के स्वास्थ्य रिकॉर्ड सुरक्षित रखें।':'One private place to care for yourself and your family.'}</p>

          <form onSubmit={async e=>{
            e.preventDefault();
            setBusy(true);
            setError('');
            try{
              onAuth(await api.auth(register,email,password,name));
            }catch(e){
              setError((e as Error).message);
            }finally{
              setBusy(false);
            }
          }}>
            {register&&<label>{hi?'आपका नाम':'Your name'}<input autoComplete="name" required value={name} maxLength={80} onChange={e=>setName(e.target.value)}/></label>}
            <label>{hi?'ईमेल':'Email address'}<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>
            <label>{hi?'पासवर्ड':'Password'}<input type="password" autoComplete={register?'new-password':'current-password'} minLength={12} required value={password} onChange={e=>setPassword(e.target.value)}/><small>{hi?'कम से कम 12 अक्षर':'At least 12 characters'}</small></label>
            {error&&<p className="error" role="alert">{error}</p>}
            <button className="primary full" disabled={busy}>{busy?'Please wait…':hi?(register?'खाता बनाएं':'साइन इन करें'):(register?'Create your account':'Sign in')}<ArrowRight size={17}/></button>
          </form>

          {/* Guest Mode Option */}
          <div style={{ margin: '14px 0 6px', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '12px 0' }}>
              <hr style={{ flex: 1, margin: 0 }}/>
              <span style={{ fontSize: '10px', color: '#90a094', textTransform: 'uppercase' }}>{hi ? 'या' : 'or'}</span>
              <hr style={{ flex: 1, margin: 0 }}/>
            </div>
            <button
              type="button"
              className="secondary full"
              style={{
                borderColor: '#26795f',
                color: '#206b53',
                backgroundColor: '#f1f8f3',
                fontWeight: 600,
                minHeight: '44px'
              }}
              disabled={busy}
              onClick={async ()=>{
                setBusy(true);
                setError('');
                try{
                  onAuth(await api.guest());
                }catch(e){
                  setError((e as Error).message);
                }finally{
                  setBusy(false);
                }
              }}
            >
              <UserCheck size={18}/>
              <span>{hi ? 'अतिथि मोड में प्रवेश करें (Guest Mode)' : 'Continue as Guest (Instant Access)'}</span>
            </button>
          </div>

          <button className="text-button auth-switch" onClick={()=>{setRegister(!register);setError('')}}>
            {hi?(register?'खाता है? साइन इन करें':'नए हैं? खाता बनाएं'):(register?'Already have an account? Sign in':'New to VedaShield? Create an account')}
          </button>
          <p className="privacy-line"><LockKeyhole size={14}/>{cloud?'Supabase authenticated workspace':'Local encrypted workspace'}</p>
          <p className="fine-print">{hi?'शैक्षिक उपयोग के लिए। चिकित्सा सलाह या आपातकालीन सेवा नहीं।':'Educational support, not medical advice or an emergency service.'}</p>
        </div>
      </div>
    </main>
  );
}

export default function App(){
  const [hi,setHi]=useState(false);
  const [user,setUser]=useState<User|null>(null);
  const [ready,setReady]=useState(false);
  const [page,setPage]=useState<Page>('overview');
  const [profiles,setProfiles]=useState<Profile[]>([]);
  const [active,setActive]=useState('');
  const [reports,setReports]=useState<Report[]>([]);
  const [report,setReport]=useState<Report|null>(null);
  const [diabetesRecords,setDiabetesRecords]=useState<DiabetesRecord[]>([]);
  const [status,setStatus]=useState<ServiceStatus|null>(null);
  const [error,setError]=useState('');
  const [selected,setSelected]=useState<string|null>(null);
  const [showOrganModal,setShowOrganModal]=useState(false);
  const [showKYC,setShowKYC]=useState(false);
  const [mobile,setMobile]=useState(false);
  const [share,setShare]=useState(false);
  const [profileDialog,setProfileDialog]=useState<Profile|'new'|null>(null);
  const [query,setQuery]=useState('');
  const [deleteTarget,setDeleteTarget]=useState<{kind:'report'|'profile';id:string}|null>(null);
  const [loading,setLoading]=useState(false);
  const [initialScanText,setInitialScanText]=useState('');

  const homeCameraRef = useRef<HTMLInputElement>(null);
  const homeFileRef = useRef<HTMLInputElement>(null);

  const t=copy[hi?'hi':'en'];
  const profile=profiles.find(p=>p.id===active);

  useEffect(()=>{document.documentElement.lang=hi?'hi':'en'},[hi]);

  useEffect(()=>{
    api.me()
      .then(u=>{
        setUser(u);
        if(!u.kycVerified&&!u.isGuest)setShowKYC(true);
      })
      .catch(()=>{})
      .finally(()=>setReady(true));
    api.status().then(setStatus).catch(()=>setError('Backend running in local mode.'));
  },[]);

  useEffect(()=>{
    if(user){
      if(!user.kycVerified&&!user.isGuest)setShowKYC(true);
      api.profiles().then(p=>{
        setProfiles(p);
        setActive(p[0]?.id||'');
      }).catch(e=>setError(e.message));
    }else{
      setProfiles([]);
      setReports([]);
      setDiabetesRecords([]);
      setActive('');
    }
  },[user]);

  useEffect(()=>{
    let alive=true;
    setReports([]);
    setReport(null);
    setSelected(null);
    setShare(false);
    setLoading(Boolean(active));
    if(active){
      api.reports(active).then(r=>{if(alive)setReports(r)}).catch(e=>{if(alive)setError(e.message)}).finally(()=>{if(alive)setLoading(false)});
      api.diabetes(active).then(d=>{if(alive)setDiabetesRecords(d)}).catch(()=>{});
    }
    return()=>{alive=false};
  },[active]);

  function navigate(p:Page){
    setPage(p);
    setMobile(false);
    setError('');
    window.scrollTo({top:0,behavior:'instant'});
  }

  function openReport(r:Report){
    setReport(r);
    const affected=r.rows.map(x=>organFor(x.name)).find(Boolean)||null;
    setSelected(affected);
    navigate('detail');
  }

  async function reloadProfiles(){
    const p=await api.profiles();
    setProfiles(p);
    if(!p.some(x=>x.id===active))setActive(p[0]?.id||'');
  }

  function handleSelectOrgan(org:string|null){
    setSelected(org);
    if(org)setShowOrganModal(true);
  }

  function quickLaunchPreset(preset:typeof LAB_PRESETS[0]){
    setInitialScanText(preset.text);
    navigate('scan');
  }

  function handleHomeFileUpload(e:React.ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0];
    if(file){
      navigate('scan');
    }
  }

  if(!ready)return <div className="boot"><ShieldCheck size={38}/><p>{hi?'वेदाशील्ड एआई लोड हो रहा है…':'Opening your health space…'}</p></div>;
  if(!user)return <Auth onAuth={u=>{setUser(u);if(!u.kycVerified&&!u.isGuest)setShowKYC(true);}} hi={hi} setHi={setHi}/>;

  const rows=reports[0]?.rows||[];
  const discuss=rows.filter(r=>['high','low'].includes(rangeStatus(r))).length;
  const currentRows=page==='detail'?report?.rows||[]:rows;
  const highlighted=[...new Set(currentRows.filter(r=>['high','low'].includes(rangeStatus(r))).map(r=>organFor(r.name)).filter(Boolean))] as string[];

  const viewer=(
    <Suspense fallback={<div className="empty">{hi?'3D एटलस लोड हो रहा है…':'Loading the anatomy explorer…'}</div>}>
      <Anatomy
        hi={hi}
        selected={selected}
        onSelect={handleSelectOrgan}
        highlighted={highlighted}
        large={page==='anatomy'}
      />
    </Suspense>
  );

  function recordList(list:Report[]){
    return (
      <div className="record-list">
        {list.map(r=>(
          <button className="record-item" key={r.id} onClick={()=>openReport(r)}>
            <span className="file-icon"><FileText size={21}/></span>
            <span>
              <strong>{r.title}</strong>
              <small>{r.lab||({lab:'Laboratory report',prescription:'Prescription',medicine:'Medicine packaging'}[r.type])} <span>·</span> {new Date(r.date+'T12:00:00').toLocaleDateString(hi?'hi-IN':'en-IN',{day:'numeric',month:'short',year:'numeric'})}</small>
            </span>
            <span className="record-meta">
              <span className="verified-mark"><CheckCircle2 size={13}/>{hi?'जांचा गया':'Verified'}</span>
              <ChevronRight size={17}/>
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to main content</a>
      {mobile&&<button aria-label="Close navigation" className="nav-scrim" onClick={()=>setMobile(false)}/>}

      {/* Sidebar Navigation */}
      <aside className={'sidebar '+(mobile?'open':'')}>
        <Logo/>
        <span className="nav-caption">{hi?'आपकी सेहत':'YOUR HEALTH SPACE'}</span>
        <nav>
          {nav.map(([id,Icon])=>(
            <button
              key={id}
              className={page===id||(id==='reports'&&['detail','scan'].includes(page))?'active':''}
              onClick={()=>navigate(id)}
            >
              <Icon size={19}/>
              <span>{t[id]}</span>
              {id==='anatomy'&&<span className="tiny-badge">3D</span>}
              {id==='chat'&&<span className="tiny-badge" style={{background:'#eaf4ed',color:'#207761'}}>AI</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="care-note">
            <span className="care-icon"><Heart size={18}/></span>
            <strong>{hi?'देखभाल, बेहतर समझ के साथ।':'Care begins with clarity.'}</strong>
            <p>{hi?'3D मानव शरीर रचना व मधुमेह रिकॉर्ड की सुविधा।':'Inspect affected 3D anatomy and daily glucose.'}</p>
            <button onClick={()=>navigate('chat')}>
              {hi?'एआई सहायक से पूछें':'Ask AI Assistant'}
              <ArrowRight size={14}/>
            </button>
          </div>
          <button className={'settings-link '+(page==='settings'?'active':'')} onClick={()=>navigate('settings')}>
            <Settings size={18}/>
            {t.settings}
          </button>
          <button className="user-block" onClick={()=>navigate('family')}>
            <span className="avatar">{user.name.slice(0,1).toUpperCase()}</span>
            <span>
              <strong>{user.name}</strong>
              <small>{user.isGuest ? (hi ? 'अतिथि खाता (Guest)' : 'Guest Session') : (hi ? 'पारिवारिक कार्यक्षेत्र' : 'Family workspace')}</small>
            </span>
            <ChevronRight size={15}/>
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="workspace">
        <header className="topbar">
          <div className="row">
            <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={()=>setMobile(!mobile)}><Menu/></button>
            <span className="breadcrumb">{t.private}<ChevronRight size={14}/><strong>{page==='detail'?t.reports:page==='scan'?t.scan:t[page]}</strong></span>
          </div>
          <div className="top-actions">
            {user.isGuest && (
              <span className="status neutral" style={{fontSize:'10px',background:'#fbf4e4',color:'#976f2d'}}>
                {hi ? 'अतिथि मोड' : 'Guest Mode'}
              </span>
            )}
            <span className="secure-label"><LockKeyhole size={13}/>{cloud?'Connected workspace':t.local}</span>
            <button className="language" onClick={()=>setHi(!hi)}>{hi?'English':'हिंदी'}<span>अ</span></button>
            <button className="avatar avatar-small" aria-label="Manage family profiles" onClick={()=>navigate('family')}>{user.name.slice(0,1).toUpperCase()}</button>
          </div>
        </header>

        <main id="main">
          {/* Profile Bar */}
          <div className="profile-bar">
            <div className="row">
              <span className="live-dot"/>
              <span>{t.profile}</span>
              <label className="sr-only" htmlFor="active-profile">Active family profile</label>
              <select id="active-profile" value={active} onChange={e=>{setActive(e.target.value);navigate('overview')}}>
                {profiles.map(p=><option key={p.id} value={p.id}>{p.name} · {p.relationship}</option>)}
              </select>
            </div>
            <div style={{display:'flex',gap:'14px',alignItems:'center'}}>
              {user.kycVerified ? (
                <span style={{color:'#207761',fontSize:'10px',fontWeight:600,display:'flex',alignItems:'center',gap:'4px'}}>
                  <UserCheck size={14}/>
                  {hi ? 'KYC सत्यापित' : 'KYC Verified'}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={()=>setShowKYC(true)}
                  style={{color:'#976f2d',fontSize:'10px',fontWeight:600,display:'flex',alignItems:'center',gap:'4px',textDecoration:'underline'}}
                >
                  <UserCheck size={14}/>
                  {hi ? 'KYC पूर्ण करें' : 'Complete KYC'}
                </button>
              )}
              <span><ShieldCheck size={14}/>{hi?'आपके नियंत्रण में':'You’re in control'}</span>
            </div>
          </div>

          {error&&<div role="alert" className="error">{error}<button aria-label="Dismiss error" onClick={()=>setError('')}><X size={16}/></button></div>}

          {/* PAGE: OVERVIEW (HOME) */}
          {page==='overview'&&(
            <>
              <div className="welcome">
                <div>
                  <span className="eyebrow">{hi?`नमस्ते, ${profile?.name||user.name}`:`YOUR HEALTH, AT A GLANCE`}</span>
                  <h1>{t.greeting}</h1>
                  <p>{t.subtitle}</p>
                </div>
                <div style={{display:'flex',gap:'10px'}}>
                  <button className="secondary" onClick={()=>navigate('diabetes')}>
                    <Activity size={17}/>
                    {hi ? 'दैनिक शुगर रिकॉर्ड' : 'Diabetes Log'}
                  </button>
                  <button className="primary" disabled={!profile} onClick={()=>navigate('scan')}>
                    <Plus size={18}/>
                    {t.scan}
                  </button>
                </div>
              </div>

              {/* Point 3: Upload or Take Photo of Report on Home Page */}
              <section className="card" style={{
                marginBottom:'25px',
                background:'linear-gradient(135deg, #f3f8f4 0%, #ffffff 100%)',
                border:'1.5px solid #cce2d3',
                padding:'24px',
                borderRadius:'14px'
              }}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'16px',marginBottom:'18px'}}>
                  <div>
                    <span className="eyebrow" style={{color:'#207761'}}>
                      <ScanLine size={13}/>
                      {hi ? 'त्वरित लैब रिपोर्ट विश्लेषण' : 'INSTANT PATHOLOGY & REPORT SCANNER'}
                    </span>
                    <h2 style={{fontSize:'20px',margin:'4px 0 2px',color:'#1c3e32'}}>
                      {hi ? 'लैब रिपोर्ट अपलोड करें या कैमरे से फोटो खींचें' : 'Upload or Take Photo of Medical Report'}
                    </h2>
                    <p className="muted" style={{fontSize:'12px',margin:0}}>
                      {hi ? 'डॉ लाल पैथलैब्स, एसआरएल, अपोलो या किसी भी लैब की रिपोर्ट का 3D शरीर विश्लेषण प्राप्त करें।' : 'Analyze lab parameters, identify out-of-range biomarkers, and highlight affected 3D anatomy.'}
                    </p>
                  </div>

                  <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
                    {/* Take Photo Button */}
                    <button
                      type="button"
                      className="primary"
                      onClick={()=>homeCameraRef.current?.click()}
                      style={{background:'#1d6b53'}}
                    >
                      <Camera size={17}/>
                      {hi ? 'कैमरे से फोटो लें' : 'Take Photo (Camera)'}
                    </button>
                    <input
                      ref={homeCameraRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      style={{display:'none'}}
                      onChange={handleHomeFileUpload}
                    />

                    {/* Upload File Button */}
                    <button
                      type="button"
                      className="secondary"
                      onClick={()=>homeFileRef.current?.click()}
                      style={{borderColor:'#207761',color:'#207761'}}
                    >
                      <UploadCloud size={17}/>
                      {hi ? 'फाइल अपलोड करें' : 'Upload Report File'}
                    </button>
                    <input
                      ref={homeFileRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.txt"
                      style={{display:'none'}}
                      onChange={handleHomeFileUpload}
                    />
                  </div>
                </div>

                {/* Popular Diagnostic Labs Presets */}
                <div style={{borderTop:'1px solid #dce8df',paddingTop:'14px'}}>
                  <span style={{fontSize:'10px',color:'#6b8575',fontWeight:600,textTransform:'uppercase',letterSpacing:'1px',display:'flex',alignItems:'center',gap:'6px'}}>
                    <Building2 size={13}/>
                    {hi ? '1-क्लिक टेस्ट लैब प्रीसेट:' : 'Or test with popular diagnostic lab panels:'}
                  </span>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))',gap:'10px',marginTop:'10px'}}>
                    {LAB_PRESETS.map(preset=>(
                      <button
                        key={preset.id}
                        type="button"
                        onClick={()=>quickLaunchPreset(preset)}
                        style={{
                          textAlign:'left',
                          padding:'10px 14px',
                          background:'#ffffff',
                          border:'1px solid #d8e5dc',
                          borderRadius:'8px',
                          display:'flex',
                          flexDirection:'column',
                          gap:'2px',
                          cursor:'pointer'
                        }}
                      >
                        <strong style={{fontSize:'12px',color:'#1c4233'}}>{preset.lab}</strong>
                        <span style={{fontSize:'10px',color:'#6a8274'}}>{preset.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              {/* Stats Grid */}
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-icon green"><ClipboardCheck/></span>
                  <div>
                    <span>{t.verified}</span>
                    <strong>{reports.length.toString().padStart(2,'0')}<small>{hi?'एक जगह सुरक्षित':'all in one place'}</small></strong>
                  </div>
                </div>
                <div className="stat-card">
                  <span className="stat-icon amber"><Activity/></span>
                  <div>
                    <span>{t.findings}</span>
                    <strong>{rows.length?discuss.toString().padStart(2,'0'):'—'}<small>{hi?'हाल की रिपोर्ट में':'in latest report'}</small></strong>
                  </div>
                </div>
                <button className="stat-card clickable" onClick={()=>navigate('diabetes')}>
                  <span className="stat-icon lavender"><Droplets/></span>
                  <div>
                    <span>{hi ? 'डायबिटीज रिकॉर्ड' : 'Diabetes Logs'}</span>
                    <strong>{diabetesRecords.length.toString().padStart(2,'0')}<small>{hi?'दैनिक रीडिंग':'daily glucose'}</small></strong>
                  </div>
                  <ChevronRight size={17}/>
                </button>
              </div>

              {/* Dashboard Grid: 3D Twin + Recent Records */}
              <div className="dashboard-grid">
                <section className="card twin-card">
                  <div className="section-head">
                    <div>
                      <span className="eyebrow">{hi?'अपने शरीर से जुड़ें':'MEET YOUR DIGITAL TWIN'}</span>
                      <h2>{t.learn}</h2>
                      <p>{t.learnText}</p>
                    </div>
                    <button className="icon-button" aria-label="Open full anatomy explorer" onClick={()=>navigate('anatomy')}><ArrowRight size={20}/></button>
                  </div>
                  {viewer}

                  {/* Organ Insight trigger if organ selected */}
                  {selected && organs[selected as keyof typeof organs] && (
                    <div style={{
                      marginTop:'14px',
                      padding:'12px 16px',
                      background:'#f4f9f5',
                      border:'1px solid #d4e7da',
                      borderRadius:'8px',
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'space-between',
                      gap:'10px'
                    }}>
                      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                        <HeartPulse size={18} color="#257860"/>
                        <div>
                          <strong style={{fontSize:'12px',color:'#1c3e32'}}>{organs[selected as keyof typeof organs][hi?'hi':'en']}</strong>
                          <span style={{fontSize:'11px',color:'#6b8273',marginLeft:'8px'}}>
                            {highlighted.includes(selected)?(hi?'⚠️ रिपोर्ट में संबंधित परिणाम':'⚠️ Associated biomarker alert'):''}
                          </span>
                        </div>
                      </div>
                      <button className="primary" style={{minHeight:'32px',padding:'6px 12px',fontSize:'11px'}} onClick={()=>setShowOrganModal(true)}>
                        {hi ? 'उपचार व सुझाव देखें' : 'View Insights & Care'}
                        <ArrowRight size={13}/>
                      </button>
                    </div>
                  )}
                </section>

                <div className="dashboard-right">
                  <section className="scan-banner">
                    <div className="scan-decoration"><ScanLine size={41}/><span/></div>
                    <span className="eyebrow">{hi?'रिपोर्ट से समझ तक':'MAKE SENSE OF YOUR REPORTS'}</span>
                    <h2>{hi?'जटिल रिपोर्ट। सरल समझ।':'Less medical jargon.\nMore understanding.'}</h2>
                    <p>{hi?'रिपोर्ट जोड़ें, विवरण जांचें और 3D में देखें कि कौन से अंग प्रभावित हैं।':'Upload a report, check details, and inspect affected anatomical structures in 3D.'}</p>
                    <button className="primary" disabled={!profile} onClick={()=>navigate('scan')}>{t.scan}<ArrowRight size={16}/></button>
                    <div className="banner-foot"><ShieldCheck size={13}/>{hi?'निजी · आपकी जांच के बाद':'Private by design · Verified by you'}</div>
                  </section>

                  <section className="card records-card">
                    <div className="section-head">
                      <h2>{t.recent}</h2>
                      <FileText size={18}/>
                    </div>
                    {loading?<div className="empty">{hi?'रिकॉर्ड लोड हो रहे हैं…':'Loading records…'}</div>:reports.length?recordList(reports.slice(0,3)):(
                      <div className="empty compact">
                        <span className="empty-icon"><FileText size={27}/></span>
                        <h3>{t.empty}</h3>
                        <p>{t.emptyText}</p>
                        <button className="text-button" disabled={!profile} onClick={()=>navigate('scan')}>{t.add}<ArrowRight size={15}/></button>
                      </div>
                    )}
                    <button className="records-footer" onClick={()=>navigate('reports')}>{t.all}<ArrowRight size={15}/></button>
                  </section>
                </div>
              </div>

              <div className="education-strip">
                <span><Stethoscope size={24}/></span>
                <div>
                  <strong>{t.education}</strong>
                  <p>{t.educationText}</p>
                </div>
                <a href="https://medlineplus.gov/lab-tests/how-to-understand-your-lab-results/" target="_blank" rel="noreferrer">
                  {hi?'और जानें':'Learn more'}<ArrowRight size={15}/>
                </a>
              </div>
            </>
          )}

          {/* PAGE: REPORTS */}
          {page==='reports'&&(
            <>
              <div className="welcome">
                <div>
                  <span className="eyebrow">{hi?'आपकी स्वास्थ्य यात्रा':'YOUR HEALTH STORY'}</span>
                  <h1>{t.reports}</h1>
                  <p>{hi?'हर रिपोर्ट, व्यवस्थित और आपके नियंत्रण में।':'Every record, organized and in your control.'}</p>
                </div>
                <button className="primary" disabled={!profile} onClick={()=>navigate('scan')}><Plus size={17}/>{t.add}</button>
              </div>
              <div className="card">
                <div className="search-field">
                  <Search size={18}/>
                  <input aria-label="Search reports" placeholder={hi?'रिपोर्ट खोजें…':'Search your records…'} value={query} onChange={e=>setQuery(e.target.value)}/>
                </div>
                {recordList(reports.filter(r=>(r.title+' '+r.lab).toLowerCase().includes(query.toLowerCase())))}
                {!reports.filter(r=>(r.title+' '+r.lab).toLowerCase().includes(query.toLowerCase())).length&&(
                  <div className="empty">
                    <FileText size={36}/>
                    <h3>{query?'No matching records':t.empty}</h3>
                    <p>{query?'Try another report title or laboratory.':t.emptyText}</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* PAGE: SCAN REPORT */}
          {page==='scan'&&profile&&(
            <Scan
              key={profile.id}
              profile={profile}
              ai={!!status?.ai}
              hi={hi}
              initialText={initialScanText}
              onCancel={()=>{setInitialScanText('');navigate('reports')}}
              onSaved={r=>{
                setInitialScanText('');
                setReports(v=>[r,...v]);
                openReport(r);
              }}
            />
          )}

          {/* PAGE: REPORT DETAIL */}
          {page==='detail'&&report&&(
            <>
              <div className="welcome">
                <div>
                  <button className="text-button" onClick={()=>navigate('reports')}>← {t.reports}</button>
                  <h1>{report.title}</h1>
                  <p>{report.date} · {report.lab||profile?.name} · {hi?'सत्यापित':'Verified'}</p>
                </div>
                <button className="primary" onClick={()=>setShare(true)}><MessageCircle size={17}/>{t.share}</button>
              </div>

              <div className="detail-grid">
                <div className="card">
                  <div className="section-head">
                    <h2>{hi?'आपके परिणामों का अर्थ व अंग संबंध':'Understanding your results & organs'}</h2>
                    <CheckCircle2 size={19}/>
                  </div>
                  <p className="muted">{hi?'असामान्य मानों से जुड़े अंगों को 3D मॉडल में देखने के लिए नीचे क्लिक करें।':'Click an affected organ to zoom in and read recommended care.'}</p>

                  {report.rows.map((r,i)=>{
                    const info=insight(r,hi);
                    return (
                      <article key={i} className={'finding '+(selected===info.organ?'selected':'')}>
                        <div className="section-head">
                          <h3>{r.name}</h3>
                          <Status value={info.status} hi={hi}/>
                        </div>
                        <div className="finding-value">
                          {r.value}
                          <span>{r.unit}</span>
                          <small>{hi?'लैब सीमा':'Lab range'}: {r.range||'Not provided'}</small>
                        </div>
                        <p>{info.text}</p>
                        {info.organ&&(
                          <button className="organ-link" onClick={()=>{handleSelectOrgan(info.organ)}}>
                            <HeartPulse size={15}/>
                            {hi?'शरीर में देखें व उपचार जानें':'Explore 3D & Recommended Care'} ({organs[info.organ as keyof typeof organs][hi?'hi':'en']})
                            <ArrowRight size={14}/>
                          </button>
                        )}
                      </article>
                    );
                  })}

                  {report.medicines&&(
                    <div className="notice">
                      <strong>Verified medicine names</strong>
                      <p>{report.medicines}</p>
                      <button className="text-button" onClick={()=>navigate('medicines')}>Open medicine library →</button>
                    </div>
                  )}

                  <details>
                    <summary>{hi?'मूल ट्रांसक्रिप्शन':'Original transcription'}</summary>
                    <pre className="transcript">{report.text}</pre>
                  </details>

                  <div className="row wrap" style={{marginTop:'18px'}}>
                    {report.fileId&&<button className="secondary" onClick={()=>api.download(report.fileId!).catch(e=>setError(e.message))}><ArrowDownToLine size={16}/>Original document</button>}
                    <button className="danger-text" onClick={()=>setDeleteTarget({kind:'report',id:report.id})}><Trash2 size={16}/>{hi?'रिपोर्ट हटाएं':'Delete report'}</button>
                  </div>
                </div>

                <div>
                  <section className="card">
                    {viewer}
                    {selected&&(
                      <div className="organ-info">
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                          <h3>{organs[selected as keyof typeof organs]?.[hi?'hi':'en']}</h3>
                          <button className="primary" style={{minHeight:'32px',fontSize:'11px',padding:'6px 12px'}} onClick={()=>setShowOrganModal(true)}>
                            {hi ? 'विस्तृत उपचार व सलाह' : 'Detailed Care & Diet'}
                          </button>
                        </div>
                        <p>{organs[selected as keyof typeof organs]?.description[hi?1:0]}</p>
                      </div>
                    )}
                  </section>
                </div>
              </div>
            </>
          )}

          {/* PAGE: 3D ANATOMY EXPLORER */}
          {page==='anatomy'&&(
            <>
              <div className="welcome">
                <div>
                  <span className="eyebrow">{hi?'आपके शरीर को समझने की जगह':'A CLOSER LOOK AT YOU'}</span>
                  <h1>{t.anatomy}</h1>
                  <p>{hi?'अंग चुनें, घुमाएं, ज़ूम करें और अनुशंसित देखभाल जानें।':'Select, rotate, zoom, and explore clinical recommendations.'}</p>
                </div>
              </div>
              <div className="anatomy-page-grid">
                <section className="card">
                  {viewer}
                </section>

                <section className="card anatomy-description">
                  <span className="icon-box"><HeartPulse/></span>
                  <h2>{selected?organs[selected as keyof typeof organs]?.[hi?'hi':'en']:t.learn}</h2>
                  <p>{selected?organs[selected as keyof typeof organs]?.description[hi?1:0]:hi?'किसी अंग के बारे में जानने के लिए मॉडल या बटन चुनें।':'Choose an organ on the model or from the buttons to understand its role.'}</p>

                  {selected && organs[selected as keyof typeof organs] && (
                    <button
                      className="primary full"
                      style={{margin:'14px 0'}}
                      onClick={()=>setShowOrganModal(true)}
                    >
                      <Sparkles size={16}/>
                      {hi ? 'उपचार, आहार व जीवनशैली सुझाव देखें' : 'View Recommended Cure, Diet & Care'}
                    </button>
                  )}

                  <hr/>
                  <h3>{hi?'आपकी हाल की रिपोर्ट से':'From your latest report'}</h3>
                  {rows.filter(r=>organFor(r.name)===selected).map((r,i)=>(
                    <div className="mini-finding" key={i}>
                      <strong>{r.name}</strong>
                      <p>{r.value} {r.unit}</p>
                      <Status value={rangeStatus(r)} hi={hi}/>
                    </div>
                  ))}
                  {!rows.some(r=>organFor(r.name)===selected)&&(
                    <p className="muted">{hi?'इस अंग से संबंधित कोई असामान्य परिणाम नहीं।':'No abnormal result mapped to this organ.'}</p>
                  )}
                </section>
              </div>
            </>
          )}

          {/* PAGE: DIABETES TRACKER */}
          {page==='diabetes'&&profile&&(
            <DiabetesTracker
              profile={profile}
              hi={hi}
              records={diabetesRecords}
              onSaveRecord={async (rec)=>{
                const saved=await api.saveDiabetes(profile.id,rec);
                setDiabetesRecords(prev=>[saved,...prev]);
              }}
              onDeleteRecord={async (id)=>{
                await api.deleteDiabetes(id);
                setDiabetesRecords(prev=>prev.filter(r=>r.id!==id));
              }}
            />
          )}

          {/* PAGE: CHAT (HEALTH ASSISTANT) */}
          {page==='chat'&&(
            <div style={{maxWidth:'950px',margin:'0 auto'}}>
              <div className="welcome" style={{marginBottom:'18px'}}>
                <div>
                  <span className="eyebrow">{hi ? 'स्मार्ट स्वास्थ्य परामर्श' : 'AI MEDICAL ASSISTANT'}</span>
                  <h1>{hi ? 'स्वास्थ्य संवाद (Chat in Hindi / English)' : 'Health Assistant Chat'}</h1>
                  <p>{hi ? 'अपनी रिपोर्ट, डायबिटीज और खान-पान से संबंधित प्रश्न हिंदी या अंग्रेजी में पूछें।' : 'Ask questions about your reports, diabetes, diet, and wellness.'}</p>
                </div>
              </div>
              <Chat
                profile={profile}
                latestReport={report || reports[0]}
                initialHi={hi}
              />
            </div>
          )}

          {/* PAGE: FAMILY */}
          {page==='family'&&(
            <>
              <div className="welcome">
                <div>
                  <span className="eyebrow">{hi?'उन लोगों के लिए जो आपके अपने हैं':'FOR THE PEOPLE WHO MATTER'}</span>
                  <h1>{t.family}</h1>
                  <p>{hi?'अलग प्रोफ़ाइल। अलग रिकॉर्ड। आपकी अनुमति से।':'Separate profiles and records, with permission at every step.'}</p>
                </div>
                <button className="primary" onClick={()=>setProfileDialog('new')}><Plus size={17}/>{hi?'सदस्य जोड़ें':'Add family member'}</button>
              </div>
              <div className="family-grid">
                {profiles.map((p,i)=>(
                  <article className="card family-card" key={p.id}>
                    <span className={'avatar family-avatar color-'+(i%3)}>{p.name.slice(0,1).toUpperCase()}</span>
                    <span className="tag">{p.relationship}</span>
                    <h2>{p.name}</h2>
                    <p>{p.dob?new Date(p.dob+'T12:00:00').toLocaleDateString(hi?'hi-IN':'en-IN'):'Birth date not added'}{p.bloodGroup?' · '+p.bloodGroup:''}</p>
                    <button className={active===p.id?'secondary full':'primary full'} onClick={()=>{setActive(p.id);navigate('overview')}}>
                      {active===p.id?'Viewing this profile':'View health records'}<ArrowRight size={15}/>
                    </button>
                    <div className="row between">
                      <button className="text-button" onClick={()=>setProfileDialog(p)}>Edit profile</button>
                      <button className="icon-button danger-text" aria-label={'Delete '+p.name} disabled={profiles.length<=1} onClick={()=>setDeleteTarget({kind:'profile',id:p.id})}><Trash2 size={16}/></button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {/* PAGE: MEDICINES */}
          {page==='medicines'&&<Medicines hi={hi}/>}

          {/* PAGE: WELLNESS */}
          {page==='wellness'&&<Wellness hi={hi}/>}

          {/* PAGE: SETTINGS */}
          {page==='settings'&&(
            <>
              <div className="welcome">
                <div>
                  <span className="eyebrow">YOUR DATA. YOUR CHOICE.</span>
                  <h1>{t.settings}</h1>
                  <p>Understand your connection, KYC identity, and storage choices.</p>
                </div>
              </div>
              <div className="settings-grid">
                <section className="card">
                  <h2>Connection & KYC Status</h2>
                  <dl className="connection-list">
                    <div>
                      <dt>User KYC Verification</dt>
                      <dd>
                        {user.kycVerified ? (
                          <span style={{color:'#207761',fontWeight:600}}>Verified ({user.kyc?.nationality || 'Indian'}, {user.kyc?.country || 'India'})</span>
                        ) : (
                          <button className="primary" style={{minHeight:'28px',padding:'4px 10px',fontSize:'10px'}} onClick={()=>setShowKYC(true)}>
                            Complete KYC
                          </button>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt>Session Mode</dt>
                      <dd>{user.isGuest ? 'Guest Access' : 'Authenticated'}</dd>
                    </div>
                    <div>
                      <dt>Health records</dt>
                      <dd>{cloud?'Supabase':'Local encrypted SQLite'}</dd>
                    </div>
                    <div>
                      <dt>Gemini extraction & Chat</dt>
                      <dd>{status?.ai?'Connected':'Local clinical AI assistant active'}</dd>
                    </div>
                    <div>
                      <dt>On-device OCR</dt>
                      <dd>Available · English + Hindi</dd>
                    </div>
                  </dl>

                  {user.kyc && (
                    <div style={{marginTop:'16px',background:'#f6faf7',padding:'12px',borderRadius:'8px',fontSize:'11px',border:'1px solid #dce8df'}}>
                      <strong>Verified KYC Identity:</strong>
                      <div style={{marginTop:'4px',color:'#506a5a',lineHeight:'1.6'}}>
                        <div>Name: {user.kyc.fullName}</div>
                        <div>Nationality: {user.kyc.nationality} · Country: {user.kyc.country}</div>
                        <div>ID: {user.kyc.idType} ({user.kyc.idNumber || 'Recorded'})</div>
                      </div>
                      <button className="text-button" style={{fontSize:'11px',marginTop:'6px'}} onClick={()=>setShowKYC(true)}>
                        Update KYC Details
                      </button>
                    </div>
                  )}
                </section>

                <section className="card">
                  <h2>Your records, in your hands</h2>
                  <p>Export your profiles, verified reports, and daily diabetes logs as JSON.</p>
                  <button className="secondary" onClick={async()=>{
                    try{
                      downloadBlob(new Blob([JSON.stringify(await api.export(),null,2)],{type:'application/json'}),'vedashield-records.json');
                    }catch(e){
                      setError((e as Error).message);
                    }
                  }}>
                    <ArrowDownToLine size={17}/>Export my records
                  </button>
                  <hr/>
                  <button className="secondary" onClick={async()=>{
                    try{
                      await api.logout();
                      setUser(null);
                      setReport(null);
                      setPage('overview');
                      setError('');
                    }catch(e){
                      setError((e as Error).message);
                    }
                  }}>
                    <LogOut size={17}/>{t.logout}
                  </button>
                </section>
              </div>
            </>
          )}

          <footer className="app-footer">
            <span>VedaShield AI <span>·</span> {hi?'समझ से बेहतर देखभाल':'Clarity for a healthier tomorrow'}</span>
            <span><LockKeyhole size={12}/>{hi?'शैक्षिक उपयोग के लिए':'Educational use only'}</span>
          </footer>
        </main>
      </div>

      {/* Floating Chat Trigger Button */}
      {page!=='chat'&&(
        <button
          className="floating-chat-trigger"
          aria-label="Open AI Health Assistant"
          onClick={()=>navigate('chat')}
          style={{
            position:'fixed',
            bottom:'24px',
            right:'24px',
            zIndex:99,
            display:'flex',
            alignItems:'center',
            gap:'8px',
            padding:'12px 18px',
            borderRadius:'30px',
            backgroundColor:'#257860',
            color:'#ffffff',
            boxShadow:'0 8px 24px rgba(37, 120, 96, 0.35)',
            border:'1px solid #338e73',
            fontSize:'13px',
            fontWeight:600,
            cursor:'pointer'
          }}
        >
          <MessageCircle size={20}/>
          <span>{hi ? 'स्वास्थ्य संवाद' : 'AI Health Chat'}</span>
        </button>
      )}

      {/* Modals */}
      {showKYC&&user&&(
        <KYCModal
          user={user}
          hi={hi}
          onComplete={async (data)=>{
            await api.saveKYC(data);
            setUser(prev=>prev?{...prev,kycVerified:true,kyc:data}:null);
            setShowKYC(false);
          }}
          onSkip={()=>setShowKYC(false)}
        />
      )}

      {showOrganModal&&selected&&(
        <OrganCareModal
          organKey={selected}
          hi={hi}
          reportRows={report?.rows || rows}
          onClose={()=>setShowOrganModal(false)}
          onFocus={()=>{
            setShowOrganModal(false);
          }}
        />
      )}

      {share&&report&&profile&&(
        <Modal title={t.summary} onClose={()=>setShare(false)}>
          <Summary key={report.id+hi} hi={hi} report={report} profile={profile}/>
        </Modal>
      )}

      {profileDialog&&(
        <Modal title={profileDialog==='new'?'Add a family member':'Edit family profile'} onClose={()=>setProfileDialog(null)}>
          <ProfileForm hi={hi} profile={profileDialog==='new'?null:profileDialog} onSave={async(p,id)=>{await api.saveProfile(p,id);await reloadProfiles();setProfileDialog(null)}}/>
        </Modal>
      )}

      {deleteTarget&&(
        <Modal title={hi?'हटाने की पुष्टि करें':'Confirm deletion'} onClose={()=>setDeleteTarget(null)}>
          <p>{deleteTarget.kind==='profile'?'This permanently deletes this profile and its reports and documents.':'This permanently deletes the report and its attached document.'}</p>
          <div className="row">
            <button className="secondary" onClick={()=>setDeleteTarget(null)}>{t.cancel}</button>
            <button className="danger-button" onClick={async()=>{
              try{
                if(deleteTarget.kind==='profile'){
                  await api.deleteProfile(deleteTarget.id);
                  await reloadProfiles();
                }else{
                  await api.deleteReport(deleteTarget.id);
                  setReports(reports.filter(r=>r.id!==deleteTarget.id));
                  setReport(null);
                  navigate('reports');
                }
                setDeleteTarget(null);
              }catch(e){
                setDeleteTarget(null);
                setError((e as Error).message);
              }
            }}>
              Delete permanently
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ProfileForm({profile,hi,onSave}:{profile:Profile|null;hi:boolean;onSave:(p:Omit<Profile,'id'>,id?:string)=>Promise<void>}){
  const [p,setP]=useState({name:profile?.name||'',relationship:profile?.relationship||'Parent',dob:profile?.dob||'',bloodGroup:profile?.bloodGroup||'',notes:profile?.notes||'',authorized:false}),[busy,setBusy]=useState(false),[error,setError]=useState('');
  return (
    <form onSubmit={async e=>{e.preventDefault();setBusy(true);try{await onSave(p,profile?.id)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}}>
      <label>{hi?'नाम':'Name'}<input required maxLength={80} value={p.name} onChange={e=>setP({...p,name:e.target.value})}/></label>
      <div className="form-grid">
        <label>{hi?'संबंध':'Relationship'}<select value={p.relationship} onChange={e=>setP({...p,relationship:e.target.value})}>{['Self','Spouse','Parent','Child','Other'].map(v=><option key={v}>{v}</option>)}</select></label>
        <label>{hi?'जन्म तिथि':'Birth date'}<input type="date" max={new Date().toISOString().slice(0,10)} value={p.dob} onChange={e=>setP({...p,dob:e.target.value})}/></label>
      </div>
      <label>Blood group (optional)<select value={p.bloodGroup} onChange={e=>setP({...p,bloodGroup:e.target.value})}>{['','A+','A-','B+','B-','AB+','AB-','O+','O-'].map(v=><option key={v} value={v}>{v||'Not known'}</option>)}</select></label>
      <label>Notes (optional)<textarea maxLength={2000} value={p.notes} onChange={e=>setP({...p,notes:e.target.value})}/></label>
      <label className="check"><input type="checkbox" required checked={p.authorized} onChange={e=>setP({...p,authorized:e.target.checked})}/>{hi?'मेरे पास इस व्यक्ति की अनुमति है, या मैं अधिकृत अभिभावक हूं।':'I have this person’s permission, or I am their authorized guardian, to manage these records.'}</label>
      {error&&<p className="error" role="alert">{error}</p>}
      <button className="primary full" disabled={busy||!p.authorized}>{busy?'Saving…':hi?'प्रोफ़ाइल सहेजें':'Save profile'}</button>
    </form>
  );
}

function Medicines({hi}:{hi:boolean}){
  const [q,setQ]=useState(''),[result,setResult]=useState<Awaited<ReturnType<typeof api.medicines>>|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  return (
    <>
      <div className="welcome">
        <div>
          <span className="eyebrow">INFORMATION, WITH CONTEXT</span>
          <h1>{hi?'दवा जानकारी':'Know more about your medicines.'}</h1>
          <p>{hi?'सक्रिय घटक से खोजें। भारतीय ब्रांड का मिलान फार्मासिस्ट से कराएं।':'Search an active ingredient. Confirm Indian brand equivalence with your pharmacist.'}</p>
        </div>
      </div>
      <div className="notice">
        <BookOpen size={22}/>
        <div>
          <strong>Source: openFDA — United States drug labels</strong>
          <p>DrugBank Clinical and verified Indian product data require licensed access. US labels do not verify an Indian brand, formulation, or strength. This library does not prescribe or recommend doses.</p>
        </div>
      </div>
      <section className="card">
        <form className="medicine-search" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');setResult(null);try{setResult(await api.medicines(q))}catch(e){setError((e as Error).message)}finally{setBusy(false)}}}>
          <label className="search-field">
            <Search size={19}/>
            <input required minLength={2} maxLength={80} value={q} onChange={e=>setQ(e.target.value)} placeholder={hi?'सक्रिय घटक, जैसे metformin':'Active ingredient, e.g. metformin'} aria-label="Medicine name"/>
          </label>
          <button className="primary" disabled={busy}>{busy?'Searching…':hi?'खोजें':'Search labels'}</button>
        </form>
        {error&&<p className="error" role="alert">{error}</p>}
        {result?.results.map(r=>(
          <article className="medicine-result" key={r.id}>
            <span className="tag">US label · source text in English</span>
            <h2>{r.name}</h2>
            <p>{r.generic}</p>
            <details><summary>Labelled uses</summary><p>{r.uses||'Not listed in this source.'}</p></details>
            <details><summary>Warnings and precautions</summary><p>{r.warnings||'Not listed. Absence does not mean the medicine is safe for you.'}</p></details>
            <a href={r.source} target="_blank" rel="noreferrer">Read the original DailyMed label ↗</a>
          </article>
        ))}
        {result&&!result.results.length&&<div className="empty">No labels found. Try the active ingredient; ask a pharmacist to verify packaging.</div>}
        {!result&&!busy&&!error&&<div className="empty"><BookOpen size={38}/><h3>{hi?'सूचित बातचीत की शुरुआत':'Start with the ingredient, not guesswork.'}</h3><p>Use your verified prescription or packaging to search. Never change treatment based on this library.</p></div>}
      </section>
    </>
  );
}

function Wellness({hi}:{hi:boolean}){
  return (
    <>
      <div className="welcome">
        <div>
          <span className="eyebrow">SMALL STEPS, THOUGHTFUL CARE</span>
          <h1>{hi?'दैनिक स्वास्थ्य':'A little care, every day.'}</h1>
          <p>{hi?'विश्वसनीय स्रोतों से सामान्य जानकारी। व्यक्तिगत उपचार नहीं।':'General education from named sources. Make personal decisions with your clinician.'}</p>
        </div>
      </div>
      <div className="wellness-grid">
        {[
          {icon:Leaf,title:hi?'पोषण में विविधता':'Make room for variety',tag:'Nutrition · WHO',text:hi?'साबुत अनाज, दालें, फल और सब्जियां विविध आहार में योगदान देती हैं। आपकी जरूरतें उम्र, स्वास्थ्य और गतिविधि पर निर्भर करती हैं।':'Whole grains, pulses, fruit and vegetables contribute to a varied diet. Your needs depend on your age, health, and activity.',url:'https://www.who.int/news-room/fact-sheets/detail/healthy-diet',style:'nutrition'},
          {icon:HeartPulse,title:hi?'अपनी लैब रिपोर्ट समझें':'See the context, not just the number',tag:'Prevention · MedlinePlus',text:hi?'लैब सीमा विधि और व्यक्ति के अनुसार बदल सकती है। एक परिणाम पूरी स्वास्थ्य स्थिति नहीं बताता। अपनी रिपोर्ट चिकित्सक को दिखाएं।':'Reference ranges can vary between laboratories and people. One result cannot describe your whole health. Bring your report and questions to your clinician.',url:'https://medlineplus.gov/lab-tests/how-to-understand-your-lab-results/',style:'prevention'},
          {icon:Sparkles,title:hi?'आयुर्वेद को प्रमाण के साथ समझें':'Tradition, with an evidence lens',tag:'Ayurveda · NCCIH',text:hi?'आयुर्वेद पर उच्च गुणवत्ता वाले शोध सीमित हैं। कुछ उत्पादों में धातुएं हो सकती हैं। सभी जड़ी-बूटियों और सप्लीमेंट की जानकारी चिकित्सक को दें; निर्धारित उपचार न बदलें।':'High-quality evidence for Ayurvedic approaches is limited. Some preparations can contain metals. Tell your clinician about herbs and supplements, and do not replace prescribed care.',url:'https://www.nccih.nih.gov/health/ayurvedic-medicine-in-depth',style:'ayurveda'}
        ].map(({icon:Icon,...c})=>(
          <article className="card wellness-card" key={c.tag}>
            <div className={'wellness-art '+c.style}><Icon size={62} strokeWidth={1}/><span className="art-circle"/></div>
            <span className="eyebrow">{c.tag}</span>
            <h2>{c.title}</h2>
            <p>{c.text}</p>
            <a href={c.url} target="_blank" rel="noreferrer">{hi?'स्रोत पढ़ें':'Read the source'}<ArrowRight size={16}/></a>
          </article>
        ))}
      </div>
      <div className="education-strip">
        <Stethoscope size={24}/>
        <div>
          <strong>{hi?'अगली मुलाकात की तैयारी करें':'Make your next appointment count'}</strong>
          <p>{hi?'अपने लक्षण, दवाएं, एलर्जी और सवाल लिखें। गंभीर लक्षण हों तो तत्काल चिकित्सा सहायता लें।':'Bring your report, a list of medicines and supplements, symptoms, and questions. For severe or rapidly worsening symptoms, seek urgent medical care.'}</p>
        </div>
      </div>
    </>
  );
}
