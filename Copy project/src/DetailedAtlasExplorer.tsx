import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { Html, OrbitControls, useGLTF } from '@react-three/drei';
import { DoubleSide, Mesh, MeshPhongMaterial, PerspectiveCamera, Vector3, Plane } from 'three';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import { fitDistance, systems, type AtlasManifest, type AtlasPart } from './atlas';
import './detailed-atlas.css';

type AtlasSystem = Exclude<keyof typeof systems, 'organs'>;
type Bounds = { center: [number, number, number]; size: [number, number, number] };
const SYSTEM_KEYS = Object.keys(systems).filter((key) => key !== 'organs') as AtlasSystem[];
const FULL_BODY: Bounds = { center: [0, 0, 0], size: [2.4, 4.8, 1.35] };
const normalize = (value: string) => value.toLowerCase().replace(/\.\d{3}$/g, '').replace(/[^a-z0-9]/g, '');
// The source exporter emits positions and normals but no tissue materials.
function tissueColor(system:AtlasSystem, name:string) {
  const n=name.toLowerCase();
  if(/artery|arterial|aorta|arteries/.test(n))return '#a34b48';
  if(/vein|venous|vena cava/.test(n))return '#657b98';
  if(/cartilage|ligament|tendon|fascia/.test(n))return '#d2c7b5';
  if(/gallbladder|gall bladder|bile duct/.test(n))return '#78865a';
  if(/liver|hepatic/.test(n))return '#925143';
  if(/heart|cardiac|myocard|atrium|ventricle/.test(n))return '#a84e4b';
  if(/lung|bronch|trachea/.test(n))return '#c88f90';
  if(/pancrea/.test(n))return '#d1ae78';
  if(/stomach|gastric|oesoph|esoph/.test(n))return '#c78e83';
  if(/intestin|colon|duoden|jejun|ileum|rectum/.test(n))return '#bd9584';
  if(/kidney|renal|spleen/.test(n))return '#a05a54';
  return ({skeleton:'#d8cbb1',muscles:'#a15b54',joints:'#c9c8b9',vessels:'#a34b48',lymphatic:'#859568',nervous:'#d0b584',viscera:'#b78d80',surface:'#c7aaa0'} as Record<string,string>)[system] ?? '#bda79c';
}
const finite = (value: number) => Number.isFinite(value) && value > 0 ? value : 0.1;

function AtlasCamera({ target, controls }: {
  target: Bounds;
  controls: RefObject<OrbitControlsType | null>;
}) {
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    const orbit = controls.current;
    if (!orbit || !(camera instanceof PerspectiveCamera) || size.height <= 0) return;
    const center = new Vector3(...target.center);
    const distance = fitDistance(target.size.map(finite), size.width / size.height, camera.fov);
    camera.position.copy(center).add(new Vector3(0, 0.06, Math.max(0.28, distance)));
    orbit.target.copy(center);
    camera.near = Math.max(0.001, distance / 1000);
    camera.far = Math.max(30, distance * 20);
    camera.updateProjectionMatrix();
    orbit.update();
    invalidate();
  }, [camera, controls, invalidate, size.height, size.width, target]);
  return null;
}

function AtlasSystemModel({
  system, parts, chosen, opacity, isolate, selectPart, sectionAxis, sectionOffset,
}: {
  system: AtlasSystem;
  parts: AtlasPart[];
  chosen: string | null;
  opacity: number;
  isolate: boolean;
  selectPart: (part: AtlasPart) => void;
  sectionAxis: 'off'|'x'|'y'|'z';
  sectionOffset: number;
}) {
  const { scene } = useGLTF('/models/atlas/' + system + '.glb');
  const invalidate=useThree(s=>s.invalidate);
  const planes=useMemo(()=>sectionAxis==='off'?[]:[new Plane(new Vector3(sectionAxis==='x'?1:0,sectionAxis==='y'?1:0,sectionAxis==='z'?1:0),-sectionOffset)],[sectionAxis,sectionOffset]);
  const byIdentifier = useMemo(() => {
    const map = new Map<string, AtlasPart>();
    for (const part of parts) {
      for (const name of [part.id, part.sourceName, part.name]) {
        const key = normalize(name);
        if (key && !map.has(key)) map.set(key, part);
      }
    }
    return map;
  }, [parts]);

  const resolve = useCallback((mesh: Mesh): AtlasPart | undefined => {
    const candidates = [
      mesh.userData?.atlasId,
      mesh.userData?.sourceName,
      mesh.userData?.name,
      mesh.name,
      mesh.parent?.name,
    ];
    for (const candidate of candidates) {
      if (typeof candidate !== 'string') continue;
      const part = byIdentifier.get(normalize(candidate));
      if (part) return part;
    }
    return undefined;
  }, [byIdentifier]);

  const copy = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const material = new MeshPhongMaterial({side:DoubleSide,color:tissueColor(system,''),shininess:20,specular:'#aaa19b',toneMapped:false});
      object.material = material;
    });
    return cloned;
  }, [scene, system]);

  useEffect(() => {
    copy.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const material = object.material as MeshPhongMaterial;
      const part = resolve(object);
      const selected = !!chosen && part?.id === chosen;
      object.visible = !(isolate && chosen && !selected);
      material.opacity = selected ? 1 : opacity;
      material.transparent = !selected && opacity < 1;
      material.depthWrite = selected || opacity >= 0.99;
      const color=tissueColor(system,part?.name ?? '');
      material.color.set(color);
      material.emissive.set(color);
      material.emissiveIntensity=selected?0.30:0.12;
      material.clippingPlanes=planes;
      material.needsUpdate = true;
    });
    invalidate();
  }, [copy, resolve, chosen, opacity, isolate, system, planes, invalidate]);

  useEffect(() => () => {
    copy.traverse((object) => {
      if (object instanceof Mesh && object.material instanceof MeshPhongMaterial) {
        object.material.dispose();
      }
    });
  }, [copy]);

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (!(event.object instanceof Mesh)) return;
    const part = resolve(event.object);
    if (part) selectPart(part);
  };
  return <primitive object={copy} dispose={null} onClick={handleClick} />;
}

export default function DetailedAtlasExplorer({ hi = false }: { hi?: boolean }) {
  const [manifest, setManifest] = useState<AtlasManifest | null>(null);
  const [loadError, setLoadError] = useState('');
  const [system, setSystem] = useState<AtlasSystem>('viscera');
  const [selected, setSelected] = useState<AtlasPart | null>(null);
  const [query, setQuery] = useState('');
  const [opacity, setOpacity] = useState(1);
  const [isolate, setIsolate] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [sectionAxis,setSectionAxis]=useState<'off'|'x'|'y'|'z'>('off');
  const [sectionOffset,setSectionOffset]=useState(0);
  const orbit = useRef<OrbitControlsType | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch('/models/atlas/manifest.json', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error('Anatomy manifest could not be loaded.');
        return res.json() as Promise<AtlasManifest>;
      })
      .then((data) => setManifest(data))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : 'Unable to load the anatomy atlas.');
      });
    return () => controller.abort();
  }, []);

  const parts = useMemo(() => (manifest?.parts ?? []).filter((p) => p.system === system), [manifest, system]);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return parts.slice(0, 16);
    return parts.filter((p) => (p.name + ' ' + p.sourceName + ' ' + p.id).toLowerCase().includes(q)).slice(0, 36);
  }, [parts, query]);
  const target = useMemo(() => selected
    ? { center: selected.center, size: selected.size.map((v) => Math.max(v * 2, 0.16)) as [number, number, number] }
    : FULL_BODY, [selected]);

  const changeSystem = (next: AtlasSystem) => {
    setSystem(next);
    setSelected(null);
    setQuery('');
    setSectionAxis('off');
    setIsolate(false);
  };
  const choosePart = (part: AtlasPart) => {
    setSelected(part);
    setIsolate(false);
  };

  return (
    <section className={'detailed-atlas' + (expanded ? ' detailed-atlas-expanded' : '')} aria-label="Detailed anatomy explorer">
      <div className="detailed-atlas-header">
        <div><strong>{hi ? 'विस्तृत शरीर रचना' : 'DETAILED ANATOMY ATLAS'}</strong>
          <small>{hi ? 'सत्यापित स्रोत मॉडल • शैक्षिक उपयोग' : 'Source anatomy meshes · educational visualization'}</small></div>
        <button type="button" onClick={() => setExpanded((v) => !v)} aria-label={expanded ? 'Exit full screen' : 'Enlarge atlas'}>
          {expanded ? (hi ? 'बंद करें' : 'Close fullscreen') : (hi ? 'बड़ा देखें' : 'Fullscreen')}
        </button>
      </div>
      <nav className="detailed-atlas-systems" aria-label="Anatomical systems">
        {SYSTEM_KEYS.map((key) => <button type="button" key={key} aria-pressed={system === key}
          onClick={() => changeSystem(key)}>
          {hi ? systems[key].hi : systems[key].name}
          <small>{manifest?.systems[key]?.parts ?? ''}</small>
        </button>)}
      </nav>
      <div className="detailed-atlas-main">
        <div className="detailed-atlas-viewport">
          {loadError ? <div className="detailed-atlas-loading" role="alert">{loadError}</div> :
            <Canvas dpr={[1, 1.4]} frameloop="demand"
              camera={{ position: [0, 0.8, 6], fov: 37, near: 0.005, far: 100 }}
              gl={{ alpha: false, antialias: true, powerPreference: 'high-performance' }} onCreated={({gl})=>{gl.localClippingEnabled=true;}}>
              <color attach="background" args={['#20272d']} />
              <ambientLight intensity={0.9} />
              <hemisphereLight args={['#f1eee9', '#6c7177', 0.65]} />
              <directionalLight position={[3, 5, 7]} intensity={1.3} color="#fff5ee" />
              <directionalLight position={[-4, 1, -5]} intensity={0.5} color="#e4e9ef" />
              <Suspense fallback={<Html center><div className="detailed-atlas-loading">
                {hi ? 'मॉडल लोड हो रहा है…' : 'Loading detailed anatomy…'}
              </div></Html>}>
                <AtlasSystemModel system={system} parts={parts} chosen={selected?.id ?? null}
                  opacity={opacity} isolate={isolate} selectPart={choosePart} sectionAxis={sectionAxis} sectionOffset={sectionOffset} />
              </Suspense>
              <OrbitControls ref={orbit} makeDefault enableDamping dampingFactor={0.08}
                enablePan minDistance={0.06} maxDistance={40} />
              <AtlasCamera target={target} controls={orbit} />
            </Canvas>}
          <div className="detailed-atlas-viewport-caption">
            {hi ? 'घुमाएँ • ज़ूम करें • अंग चुनें' : 'Drag to rotate · Pinch to zoom · Tap a structure'}
          </div>
        </div>
        <aside className="detailed-atlas-panel">
          <label htmlFor="detailed-structure-search">{hi ? 'संरचना खोजें' : 'Find an anatomical structure'}</label>
          <input id="detailed-structure-search" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder={hi ? 'नाम खोजें…' : 'Search by name…'} />
          {selected ? <div className="detailed-atlas-selected" aria-live="polite">
            <span>{hi ? 'चयनित संरचना' : 'SELECTED STRUCTURE'}</span>
            <strong>{selected.name}</strong>
            <small>{systems[system].name} · {selected.sourceName}</small>
            <div className="detailed-atlas-actions">
              <button type="button" aria-pressed={isolate} onClick={() => setIsolate((v) => !v)}>
                {isolate ? (hi ? 'सब दिखाएँ' : 'Show all') : (hi ? 'अलग देखें' : 'Isolate')}
              </button>
              <button type="button" onClick={() => { setSelected(null); setIsolate(false); }}>
                {hi ? 'रीसेट' : 'Reset'}
              </button>
            </div>
          </div> : <p className="detailed-atlas-helper">
            {hi ? 'किसी भाग को टैप करें या सूची में नाम चुनें।' : 'Tap a structure or choose it from the list.'}
          </p>}
          <div className="detailed-atlas-opacity">
            <label htmlFor="detailed-opacity">{hi ? 'पारदर्शिता' : 'Layer opacity'} · {Math.round(opacity * 100)}%</label>
            <input id="detailed-opacity" type="range" min="0.15" max="1" step="0.05"
              value={opacity} onChange={(e) => setOpacity(Number(e.target.value))} />
          </div>
          <div className="detailed-atlas-opacity">
            <label htmlFor="atlas-section">{hi?'काट का तल':'Section plane'}</label>
            <select id="atlas-section" value={sectionAxis} onChange={e=>{setSectionAxis(e.target.value as 'off'|'x'|'y'|'z');setSectionOffset(0);}}>
              <option value="off">Off</option><option value="x">Sagittal</option><option value="y">Transverse</option><option value="z">Coronal</option>
            </select>
            {sectionAxis!=='off'&&<input aria-label="Section position" type="range" min={sectionAxis==='y'?-2.5:-1.3} max={sectionAxis==='y'?2.5:1.3} step="0.02" value={sectionOffset} onChange={e=>setSectionOffset(+e.target.value)}/>}
          </div>
          <div className="detailed-atlas-results" role="list" aria-label="Anatomical structures">
            {results.map((part) => <button role="listitem" type="button" key={part.id}
              aria-pressed={selected?.id === part.id} onClick={() => choosePart(part)}>
              {part.name}
            </button>)}
            {manifest && results.length === 0 && <span>{hi ? 'कोई परिणाम नहीं' : 'No matching structures'}</span>}
          </div>
          <p className="detailed-atlas-notice">
            {hi ? 'सिर्फ शैक्षिक 3D संदर्भ। किसी बीमारी या अंग क्षति का निदान नहीं।'
              : 'Educational 3D reference only. Highlights do not indicate a medical diagnosis or injury.'}
          </p>
        </aside>
      </div>
    </section>
  );
}
