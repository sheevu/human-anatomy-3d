import { useCallback, useEffect, useMemo, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { Activity, ArrowLeft, ArrowRight, Crosshair, Eye, EyeOff, Focus, Layers, Minus, Plus, RotateCcw, RotateCw, Search, X } from 'lucide-react';
import ExplorerScene, { SceneBoundary, type CameraCommand } from './ExplorerScene';
import { bodySystems, fullBody, structures, type Bounds, type StructureId } from './explorerData';
import './explorer.css';

export default function AnatomyExplorer() {
  const [selected, setSelected] = useState<StructureId | null>(null);
  const [system, setSystem] = useState('All systems'), [query, setQuery] = useState('');
  const [hidden, setHidden] = useState<Set<string>>(new Set()), [isolated, setIsolated] = useState(false);
  const [skin, setSkin] = useState(.12), [label, setLabel] = useState(false), [rotating, setRotating] = useState(false);
  const [bounds, setBounds] = useState<Record<string, Bounds>>({}), [failed, setFailed] = useState<string[]>([]), [retry, setRetry] = useState(0);
  const [command, setCommand] = useState<CameraCommand>({ revision: 0, bounds: fullBody, direction: 'front' });
  const current = structures.find(s => s.id === selected);
  const full = bounds.body || fullBody;
  const ready = useCallback((id: string, value: Bounds) => setBounds(previous => ({ ...previous, [id]: value })), []);
  const fail = useCallback((id: string) => setFailed(previous => previous.includes(id) ? previous : [...previous, id]), []);
  const frame = useCallback((value: Bounds, direction: CameraCommand['direction'] = 'front') => setCommand(previous => ({ revision: previous.revision + 1, bounds: value, direction })), []);
  const reset = useCallback(() => {
    setSelected(null); setHidden(new Set()); setIsolated(false); setSystem('All systems'); setQuery(''); setRotating(false); setSkin(.12); frame(full);
  }, [frame, full]);
  const select = useCallback((id: StructureId) => {
    setSelected(id);
    setHidden(previous => { const next = new Set(previous); next.delete(id); return next; });
    if (isolated && bounds[id]) frame(bounds[id]);
  }, [isolated, bounds, frame]);
  const list = useMemo(() => structures.filter(s => (system === 'All systems' || s.system === system) && `${s.name} ${s.system}`.toLowerCase().includes(query.toLowerCase().trim())), [system, query]);
  const visible = useMemo(() => new Set(structures.filter(s => !hidden.has(s.id) && (system === 'All systems' || s.system === system) && (!isolated || selected === s.id)).map(s => s.id)), [system, hidden, isolated, selected]);
  const move = (change: Partial<CameraCommand>) => setCommand(previous => ({ revision: previous.revision + 1, bounds: previous.bounds, direction: previous.direction, ...change }));
  const retryModels = () => {
    failed.filter(id => id !== 'graphics').forEach(id => useGLTF.clear(`/models/${id}.glb`));
    setFailed([]); setRetry(value => value + 1);
  };
  useEffect(() => { document.title = 'Human Anatomy | VedaShield'; }, []);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setSelected(null); setIsolated(false); frame(full); } };
    window.addEventListener('keydown', escape); return () => window.removeEventListener('keydown', escape);
  }, [frame, full]);
  const pending = 11 - Object.keys(bounds).length - failed.filter(id => id !== 'graphics').length;
  const isVisible = selected ? visible.has(selected) : false;
  return <main className="anatomy-explorer">
    <header className="explorer-header"><a className="explorer-brand" href="/" aria-label="VedaShield home"><Activity size={23} /><span>VEDASHIELD <small>ANATOMY ATLAS</small></span></a><a className="explorer-back" href="/"><ArrowLeft size={16} /> Health workspace</a></header>
    <div className="explorer-title"><div><span className="explorer-eyebrow">BODYPARTS3D / EDUCATIONAL REFERENCE</span><h1>Human anatomy</h1></div><span className="explorer-count">10 model groups <span>/</span> 6 systems</span></div>
    <div className="explorer-workspace">
      <aside className="explorer-browser" aria-label="Structure browser">
        <h2><Layers size={17} /> Structures</h2>
        <label className="explorer-search"><Search size={17} /><input type="search" aria-label="Search structures" placeholder="Find a structure" value={query} onChange={event => setQuery(event.target.value)} /></label>
        <label className="explorer-system">Body system<select value={system} onChange={event => { setSystem(event.target.value); setSelected(null); setIsolated(false); frame(full); }}>{bodySystems.map(name => <option key={name}>{name}</option>)}</select></label>
        <div className="explorer-list-heading"><span>{list.length} structures</span>{hidden.size > 0 && <button onClick={() => setHidden(new Set())}>Show all ({hidden.size})</button>}</div>
        <div className="explorer-list">{list.map(s => <div className={`explorer-row ${selected === s.id ? 'is-selected' : ''}`} key={s.id}>
          <button className="explorer-select" aria-pressed={selected === s.id} onClick={() => select(s.id)}><i style={{ background: s.color }} /><span>{s.name}<small>{failed.includes(s.id) ? 'Model unavailable' : s.system}</small></span></button>
          <button className="explorer-icon" title={`${hidden.has(s.id) ? 'Show' : 'Hide'} ${s.name}`} aria-label={`${hidden.has(s.id) ? 'Show' : 'Hide'} ${s.name}`} aria-pressed={!hidden.has(s.id)} onClick={() => { setHidden(previous => { const next = new Set(previous); if (next.has(s.id)) next.delete(s.id); else next.add(s.id); return next; }); setIsolated(false); }}>{hidden.has(s.id) ? <EyeOff size={16} /> : <Eye size={16} />}</button>
        </div>)}{!list.length && <div className="explorer-empty">No matching structures.<button onClick={() => { setQuery(''); setSystem('All systems'); }}>Clear filters</button></div>}</div>
        <div className="explorer-layer"><label htmlFor="body-opacity">Body surface <output>{Math.round(skin * 100)}%</output></label><input id="body-opacity" type="range" min="0" max="0.4" step="0.01" value={skin} onChange={event => setSkin(Number(event.target.value))} /></div>
        <a className="explorer-source" href="/models/ATTRIBUTION.md" target="_blank" rel="noreferrer">Model sources & licenses <ArrowRight size={14} /></a>
      </aside>
      <section className="explorer-stage" aria-label="3D anatomy viewport">
        <div className="explorer-stage-top"><span aria-live="polite">{current ? `${current.name.toUpperCase()}${isolated ? ' / ISOLATED' : ''}` : system === 'All systems' ? 'FULL BODY' : system.toUpperCase()}</span><button onClick={reset} title="Return to full body"><RotateCcw size={15} /> Full body</button></div>
        <div className="explorer-canvas" tabIndex={0} role="group" aria-label="3D model. Arrow keys rotate or pan vertically. Plus and minus zoom. R resets."
          onKeyDown={event => { if (event.target !== event.currentTarget) return; const key = event.key; if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', 'r', 'R'].includes(key)) event.preventDefault(); if (key === 'ArrowLeft' || key === 'ArrowRight') move({ orbit: key === 'ArrowLeft' ? -.2 : .2 }); if (key === 'ArrowUp' || key === 'ArrowDown') move({ pan: key === 'ArrowUp' ? .15 : -.15 }); if (key === '+' || key === '=') move({ zoom: .8 }); if (key === '-') move({ zoom: 1.25 }); if (key.toLowerCase() === 'r') reset(); }}>
          <SceneBoundary key={`canvas-${retry}`} onError={() => fail('graphics')} fallback={<div className="explorer-fallback"><Layers size={32} /><h2>3D view unavailable</h2><p>You can still read every structure's details.</p><button onClick={retryModels}>Retry 3D view</button></div>}>
            <ExplorerScene selected={selected} visible={visible} skin={isolated ? 0 : skin} command={command} rotating={rotating} label={label} onSelect={select} onReady={ready} onError={fail} retry={retry} bounds={bounds} />
          </SceneBoundary>
        </div>
        {pending > 0 && !failed.includes('graphics') && <div className="explorer-loading" role="status"><span /> Loading anatomy ({Math.max(0, 11 - pending)}/11)</div>}
        {failed.length > 0 && <div className="explorer-load-error" role="alert">{failed.includes('graphics') ? 'Graphics interrupted.' : `${failed.length} model(s) could not load.`} <button onClick={retryModels}>Retry</button></div>}
        <div className="explorer-camera-views" role="group" aria-label="Camera views">{(['front', 'back', 'side'] as const).map(direction => <button key={direction} aria-pressed={command.direction === direction} onClick={() => frame(isolated && selected && bounds[selected] ? bounds[selected] : full, direction)}>{direction}</button>)}</div>
        <div className="explorer-toolbar" role="group" aria-label="Model controls">
          <button title="Zoom in" aria-label="Zoom in" onClick={() => move({ zoom: .8 })}><Plus size={19} /></button><button title="Zoom out" aria-label="Zoom out" onClick={() => move({ zoom: 1.25 })}><Minus size={19} /></button><span />
          <button title="Focus selected structure" aria-label="Focus selected structure" disabled={!selected || !bounds[selected] || !isVisible} onClick={() => selected && bounds[selected] && frame(bounds[selected])}><Focus size={18} /></button>
          <button title="Selected structure label" aria-label="Selected structure label" aria-pressed={label} onClick={() => setLabel(!label)}><Crosshair size={18} /></button>
          <button title="Auto rotate" aria-label="Auto rotate" aria-pressed={rotating} onClick={() => setRotating(!rotating)}><RotateCw size={18} /></button>
        </div>
        <div className="explorer-orientation" aria-hidden="true"><span>R</span><i /><span>L</span></div>
      </section>
      <aside className="explorer-details" aria-label="Structure details" aria-live="polite">
        <div className="explorer-detail-heading"><span className="explorer-eyebrow">{current ? 'SELECTED STRUCTURE' : 'ANATOMICAL REFERENCE'}</span>{current && <button className="explorer-icon" title="Clear selection" aria-label="Clear selection" onClick={() => { setSelected(null); setIsolated(false); frame(full); }}><X size={17} /></button>}</div>
        {current ? <><span className="explorer-system-tag" style={{ borderColor: current.color }}>{current.system}</span><h2>{current.name}</h2><p>{current.description}</p><h3>Location</h3><p>{current.location}</p>
          <div className="explorer-detail-actions"><button disabled={!bounds[current.id] || !isVisible} onClick={() => frame(bounds[current.id])}><Focus size={16} /> Focus</button><button disabled={!bounds[current.id] || !isVisible} aria-pressed={isolated} onClick={() => { setIsolated(!isolated); frame(isolated ? full : bounds[current.id]); }}><Layers size={16} /> {isolated ? 'In context' : 'Isolate'}</button></div>
          {!isVisible && <p role="status">This structure is hidden. <button className="explorer-text-button" onClick={() => select(current.id)}>Show structure</button></p>}
          <h3>Model coverage</h3><p>{current.coverage}</p><dl><dt>Source</dt><dd>DBCLS / BodyParts3D</dd><dt>Representation</dt><dd>Simplified surface mesh</dd></dl>
        </> : <><div className="explorer-detail-symbol"><Layers size={30} strokeWidth={1.2} /></div><h2>The body,<br />in context.</h2><p>Eight organ groups, the thoracic skeleton and a selection of major vessels.</p><h3>Coverage</h3><p>Paired organs and merged assemblies are selected as groups. The raw anatomy catalogue contains additional structures that are not yet available in this viewer.</p><div className="explorer-detail-actions"><button onClick={() => select('heart')}><Crosshair size={16} /> Explore the heart</button></div></>}
        <div className="explorer-detail-footer">Generic educational anatomy.<br />Not a patient scan or diagnostic tool.</div>
      </aside>
    </div>
    <footer className="explorer-footer"><span>BodyParts3D, &copy; The Database Center for Life Science</span><a href="https://creativecommons.org/licenses/by-sa/2.1/jp/" target="_blank" rel="noreferrer">CC BY-SA 2.1 Japan</a></footer>
  </main>;
}
