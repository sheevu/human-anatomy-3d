import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { Html, OrbitControls, useGLTF } from '@react-three/drei';
import {
  Mesh,
  MeshStandardMaterial,
  Box3,
  Vector3,
  DoubleSide,
  PerspectiveCamera,
  Group,
} from 'three';
import type { OrbitControls as OrbitControlsType } from 'three-stdlib';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Focus,
  Search,
  Maximize,
  Minimize,
  RotateCw,
  Activity,
  HeartPulse,
  Sparkles,
  Database,
  Bone,
  Flame,
  MessageSquare,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info,
  Layers,
  HelpCircle,
  Apple,
  Ban,
  Clock,
  Sliders,
} from 'lucide-react';
import { organs } from './medical.js';
import { systems, fitDistance, type AtlasPart, type AtlasManifest } from './atlas';
import { DeepAnatomyModal } from './DeepAnatomyModal';

type Organ = keyof typeof organs;
type Bounds = { center: [number, number, number]; size: [number, number, number] };
type View = { bounds: Bounds; direction: 'front' | 'back' | 'side' | 'chest' | 'abdomen' | 'head'; revision: number };

const whole: Bounds = { center: [0, 0, 0], size: [2.5, 4.8, 0.8] };
const organKeys = Object.keys(organs) as Organ[];

// Authentic anatomical data mapped from Z-Anatomy TA2.csv, FMA, and Ayurveda
export const ORGAN_DATA: Record<
  string,
  {
    center: [number, number, number];
    ta2Id: string;
    latin: string;
    fmaId: string;
    ayurveda: { dosha: string; dhatu: string; subdosha: string };
    simpleExplainEn: string;
    simpleExplainHi: string;
  }
> = {
  heart: {
    center: [0.05, 1.22, 0.07],
    ta2Id: 'TA2:4105',
    latin: 'Cor',
    fmaId: 'FMA7274',
    ayurveda: { dosha: 'Pitta-Kapha', dhatu: 'Rasa / Rakta', subdosha: 'Sadhaka Pitta & Avalambaka Kapha' },
    simpleExplainEn: 'Pumps oxygen-rich blood ~100,000 times a day to nourish every cell and tissue.',
    simpleExplainHi: 'प्रतिदिन लगभग 1 लाख बार धड़ककर पूरे शरीर में ऑक्सीजन और पोषण युक्त रक्त पहुंचाता है।',
  },
  brain: {
    center: [0.0, 2.15, -0.04],
    ta2Id: 'TA2:5270',
    latin: 'Encephalon',
    fmaId: 'FMA50801',
    ayurveda: { dosha: 'Vata', dhatu: 'Majja', subdosha: 'Prana Vayu & Tarpaka Kapha' },
    simpleExplainEn: 'Central command center managing thoughts, memory, hormones, reflexes, and restful sleep.',
    simpleExplainHi: 'विचार, स्मृति, हार्मोन संतुलन, सजगता और गहरी नींद को नियंत्रित करने वाला मुख्य तंत्रिका केंद्र।',
  },
  lungs: {
    center: [-0.01, 1.21, 0.0],
    ta2Id: 'TA2:3421',
    latin: 'Pulmones',
    fmaId: 'FMA7333',
    ayurveda: { dosha: 'Kapha', dhatu: 'Rasa', subdosha: 'Avalambaka Kapha & Udana Vayu' },
    simpleExplainEn: 'Breathes in fresh oxygen from the air into your bloodstream and expels carbon dioxide.',
    simpleExplainHi: 'हवा से शुद्ध ऑक्सीजन को रक्त में मिलाते हैं और कार्बन डाइऑक्साइड को बाहर निकालते हैं।',
  },
  liver: {
    center: [-0.13, 0.93, 0.1],
    ta2Id: 'TA2:2978',
    latin: 'Hepar',
    fmaId: 'FMA7197',
    ayurveda: { dosha: 'Pitta', dhatu: 'Rakta', subdosha: 'Ranjaka Pitta' },
    simpleExplainEn: 'Master chemical filter that neutralizes toxins, digests dietary fats, and stores energy.',
    simpleExplainHi: 'शरीर की सबसे बड़ी फिल्टर ग्रंथि जो खून को साफ करती है, वसा पचाती है और ऊर्जा संचित रखती है।',
  },
  stomach: {
    center: [0.08, 0.77, 0.1],
    ta2Id: 'TA2:2905',
    latin: 'Gaster',
    fmaId: 'FMA7148',
    ayurveda: { dosha: 'Kapha-Pitta', dhatu: 'Rasa', subdosha: 'Kledaka Kapha & Pachaka Pitta' },
    simpleExplainEn: 'Churns ingested food with gastric acids and enzymes to prepare nutrients for absorption.',
    simpleExplainHi: 'पाचक अम्ल और एंजाइम से भोजन को तोड़कर शरीर के अवशोषण योग्य बनाता है।',
  },
  pancreas: {
    center: [-0.02, 0.71, 0.11],
    ta2Id: 'TA2:3032',
    latin: 'Pancreas',
    fmaId: 'FMA7198',
    ayurveda: { dosha: 'Pitta', dhatu: 'Meda', subdosha: 'Pachaka Pitta' },
    simpleExplainEn: 'Produces insulin to regulate blood glucose and secretes vital digestive fluid.',
    simpleExplainHi: 'इंसुलिन बनाकर रक्त शर्करा (शुगर) को नियंत्रित रखता है और आवश्यक पाचक एंजाइम बनाता है।',
  },
  kidneys: {
    center: [0.0, 0.65, -0.06],
    ta2Id: 'TA2:3561',
    latin: 'Ren',
    fmaId: 'FMA7203',
    ayurveda: { dosha: 'Vata', dhatu: 'Meda / Rakta', subdosha: 'Apana Vayu' },
    simpleExplainEn: 'Filters 180 liters of blood fluid daily, removes waste, and controls water and blood pressure.',
    simpleExplainHi: 'रक्त से अपशिष्ट और अतिरिक्त तरल छानकर पेशाब बनाते हैं और बीपी व इलेक्ट्रोलाइट्स संतुलित रखते हैं।',
  },
  intestines: {
    center: [0.0, 0.35, 0.1],
    ta2Id: 'TA2:2930',
    latin: 'Intestinum',
    fmaId: 'FMA7199',
    ayurveda: { dosha: 'Vata', dhatu: 'Purisha', subdosha: 'Samana & Apana Vayu' },
    simpleExplainEn: 'Absorbs essential nutrients, vitamins, and fluids while supporting your gut microbiome.',
    simpleExplainHi: 'पोषक तत्वों और पानी को अवशोषित करती हैं और पेट के स्वस्थ बैक्टीरिया को पोषण देती हैं।',
  },
};

class ViewerBoundary extends Component<{ children: ReactNode; retry: () => void }, { error: boolean }> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="empty" role="alert">
        <p>The 3D anatomical view encountered a graphics issue. You can still inspect structure insights.</p>
        <button className="secondary" onClick={this.props.retry}>
          Retry 3D view
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}

// Realistic Organ Mesh Component with Physiological Heartbeat & Respiration Animations
function OrganGeometry({
  url,
  color,
  selected,
  onSelect,
  opacity = 1,
  hidden,
  isolate,
  organId,
  onBounds,
  highlighted = false,
}: {
  url: string;
  color: string;
  selected: string | null;
  onSelect: (id: string) => void;
  opacity?: number;
  hidden: Set<string>;
  isolate: boolean;
  organId: string;
  onBounds?: (id: string, bounds: Bounds) => void;
  highlighted?: boolean;
}) {
  const { scene } = useGLTF(url);
  const meshRef = useRef<Group>(null);

  const copy = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((o) => {
      if (o instanceof Mesh) {
        o.material = new MeshStandardMaterial({
          color,
          roughness: 0.38,
          metalness: 0.08,
          side: DoubleSide,
        });
        o.userData.atlasId = organId;
      }
    });
    return clone;
  }, [scene, color, organId]);

  useEffect(() => {
    copy.traverse((o) => {
      if (o instanceof Mesh) {
        const id = o.userData.atlasId || o.name;
        const active = id === selected;
        const material = o.material as MeshStandardMaterial;
        o.visible = !hidden.has(id) && (!isolate || active);

        // Realistic PBR shading + glowing amber-red alert highlight
        if (active) {
          material.color.set('#2caa91');
          material.emissive.set('#106958');
          material.emissiveIntensity = 0.5;
        } else if (highlighted) {
          material.color.set('#e05050');
          material.emissive.set('#aa2222');
          material.emissiveIntensity = 0.65;
        } else {
          material.color.set(color);
          material.emissive.set(color);
          material.emissiveIntensity = 0.12;
        }
        material.opacity = opacity;
        material.transparent = opacity < 1;
        material.depthWrite = opacity >= 0.95;
        material.needsUpdate = true;
      }
    });
  }, [copy, selected, color, opacity, hidden, isolate, highlighted]);

  useEffect(() => {
    if (organId && onBounds) {
      const box = new Box3().setFromObject(copy);
      onBounds(organId, {
        center: box.getCenter(new Vector3()).toArray(),
        size: box.getSize(new Vector3()).toArray(),
      });
    }
    return () => {
      copy.traverse((o) => {
        if (o instanceof Mesh) (o.material as MeshStandardMaterial).dispose();
      });
    };
  }, [copy, organId, onBounds]);

  // Physiological Life Motion: Cardiac contraction & Respiratory expansion
  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();

    if (organId === 'heart') {
      // Lub-dub cardiac rhythm
      const beat = Math.sin(t * 4.6);
      const s = 1 + (beat > 0.35 ? (beat - 0.35) * 0.038 : 0);
      meshRef.current.scale.set(s, s, s);
    } else if (organId === 'lungs') {
      // Gentle respiratory rhythm
      const breath = 1 + Math.sin(t * 1.8) * 0.022;
      meshRef.current.scale.set(breath, breath, breath);
    } else if (highlighted || organId === selected) {
      // Subtle alert pulse
      const pulse = 1 + Math.sin(t * 3.5) * 0.015;
      meshRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  const select = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(organId);
  };

  return <primitive ref={meshRef} object={copy} onClick={select} dispose={null} />;
}

// Authentic Bone & Skeletal Assembly from BodyParts3D
function SkeletalAssembly({
  visible = true,
  opacity = 0.92,
  onSelect,
}: {
  visible: boolean;
  opacity?: number;
  onSelect: (name: string) => void;
}) {
  const { scene } = useGLTF('/models/skeleton.glb');
  const copy = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((o) => {
      if (o instanceof Mesh) {
        o.material = new MeshStandardMaterial({
          color: '#ede7db', // Authentic bone ivory
          roughness: 0.45,
          metalness: 0.04,
          side: DoubleSide,
          transparent: opacity < 1,
          opacity: opacity,
        });
      }
    });
    return clone;
  }, [scene, opacity]);

  useEffect(() => {
    copy.traverse((o) => {
      if (o instanceof Mesh) {
        o.visible = visible;
        (o.material as MeshStandardMaterial).opacity = opacity;
        (o.material as MeshStandardMaterial).transparent = opacity < 1;
        (o.material as MeshStandardMaterial).needsUpdate = true;
      }
    });
  }, [copy, visible, opacity]);

  if (!visible) return null;
  return (
    <primitive
      object={copy}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect('Thoracic Rib Cage & Spine (BodyParts3D)');
      }}
      dispose={null}
    />
  );
}

// Authentic Vascular & Circulatory Network from BodyParts3D (Aorta, Vena Cava, Pulmonary vessels)
function VascularNetwork({
  visible = true,
  opacity = 0.95,
  onSelect,
}: {
  visible: boolean;
  opacity?: number;
  onSelect: (name: string) => void;
}) {
  const { scene } = useGLTF('/models/vascular.glb');
  const copy = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((o) => {
      if (o instanceof Mesh) {
        o.material = new MeshStandardMaterial({
          color: '#c02636', // Arterial crimson
          emissive: '#4a0810',
          emissiveIntensity: 0.25,
          roughness: 0.32,
          metalness: 0.15,
          side: DoubleSide,
          transparent: opacity < 1,
          opacity: opacity,
        });
      }
    });
    return clone;
  }, [scene, opacity]);

  useEffect(() => {
    copy.traverse((o) => {
      if (o instanceof Mesh) {
        o.visible = visible;
        (o.material as MeshStandardMaterial).opacity = opacity;
        (o.material as MeshStandardMaterial).transparent = opacity < 1;
        (o.material as MeshStandardMaterial).needsUpdate = true;
      }
    });
  }, [copy, visible, opacity]);

  if (!visible) return null;
  return (
    <primitive
      object={copy}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect('Aorta & Major Vessels (BodyParts3D)');
      }}
      dispose={null}
    />
  );
}

// Transparent Medical Body Skin Surface
function BodySilhouette({ opacity = 0.12, visible = true }: { opacity: number; visible: boolean }) {
  const { scene } = useGLTF('/models/body.glb');
  const copy = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((o) => {
      if (o instanceof Mesh) {
        o.material = new MeshStandardMaterial({
          color: '#a3c2b8',
          roughness: 0.75,
          metalness: 0.02,
          transparent: true,
          opacity: opacity,
          side: DoubleSide,
        });
      }
    });
    return clone;
  }, [scene, opacity]);

  useEffect(() => {
    copy.traverse((o) => {
      if (o instanceof Mesh) {
        o.visible = visible;
        (o.material as MeshStandardMaterial).opacity = opacity;
        (o.material as MeshStandardMaterial).needsUpdate = true;
      }
    });
  }, [copy, visible, opacity]);

  if (!visible) return null;
  return <primitive object={copy} dispose={null} />;
}

// 3D Radar Beacon on Selected Organ Surface
function OrganRadarBeacon({
  position,
  highlighted = false,
}: {
  position: [number, number, number];
  highlighted?: boolean;
}) {
  const groupRef = useRef<Group>(null);
  const color = highlighted ? '#ef4444' : '#22c55e';

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    const s = 1 + Math.sin(t * 5.0) * 0.18;
    groupRef.current.scale.set(s, s, s);
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh>
        <sphereGeometry args={[0.022, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.0} roughness={0.1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.038, 0.05, 32]} />
        <meshBasicMaterial color={color} side={DoubleSide} transparent opacity={0.85} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.065, 0.072, 32]} />
        <meshBasicMaterial color={color} side={DoubleSide} transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

// Smooth Camera Controller
function CameraRig({ view, controls }: { view: View; controls: React.RefObject<OrbitControlsType | null> }) {
  const { camera, size, invalidate } = useThree();

  useEffect(() => {
    const c = controls.current;
    if (!c || !(camera instanceof PerspectiveCamera)) return;

    const center = new Vector3(...view.bounds.center);
    const distance = fitDistance(view.bounds.size, size.width / size.height, camera.fov);

    let direction = new Vector3(0, 0, 1);
    if (view.direction === 'back') direction = new Vector3(0, 0, -1);
    else if (view.direction === 'side') direction = new Vector3(1, 0, 0);
    else if (view.direction === 'chest') direction = new Vector3(0, 0.1, 0.7);
    else if (view.direction === 'abdomen') direction = new Vector3(0, 0.05, 0.65);
    else if (view.direction === 'head') direction = new Vector3(0, 0.1, 0.6);

    c.target.copy(center);
    camera.position.copy(center).addScaledVector(direction, distance);
    camera.near = 0.005;
    camera.far = 100;
    camera.updateProjectionMatrix();
    c.update();
    invalidate();
  }, [camera, controls, invalidate, size.width, size.height, view]);

  return null;
}

export interface AnatomyProps {
  selected: string | null;
  onSelect: (s: string | null) => void;
  highlighted?: string[];
  hi?: boolean;
  large?: boolean;
  onOpenCareModal?: () => void;
  onOpenChatWithOrgan?: (organ: string) => void;
}

export default function Anatomy({
  selected,
  onSelect,
  highlighted = [],
  hi = false,
  large = false,
  onOpenCareModal,
  onOpenChatWithOrgan,
}: AnatomyProps) {
  // Layer toggles
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showVascular, setShowVascular] = useState(true);
  const [showSkin, setShowSkin] = useState(true);
  const [opacity, setOpacity] = useState(0.12);

  // States
  const [isolate, setIsolate] = useState(false);
  const [labels, setLabels] = useState(true);
  const [reset, setReset] = useState(0);
  const [rotating, setRotating] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [view, setView] = useState<View>({ bounds: whole, direction: 'front', revision: 0 });
  const [organBounds, setOrganBounds] = useState<Record<string, Bounds>>({});

  const controls = useRef<OrbitControlsType | null>(null);
  const root = useRef<HTMLDivElement>(null);

  const rememberBounds = useCallback(
    (id: string, bounds: Bounds) => setOrganBounds((prev) => ({ ...prev, [id]: bounds })),
    []
  );

  // Auto-focus when selected changes
  useEffect(() => {
    if (selected && organKeys.includes(selected as Organ)) {
      setHidden((prev) => {
        const next = new Set(prev);
        next.delete(selected);
        return next;
      });
      if (ORGAN_DATA[selected]) {
        const coord = ORGAN_DATA[selected].center;
        setView({
          bounds: { center: coord, size: [0.7, 0.7, 0.7] },
          direction: 'front',
          revision: Date.now(),
        });
      }
    }
  }, [selected]);

  const activeOrgan = selected as Organ | null;
  const activeOrganMeta = activeOrgan ? organs[activeOrgan] : null;
  const activeAnatomyData = activeOrgan ? ORGAN_DATA[activeOrgan] : null;
  const isAbnormal = activeOrgan ? highlighted.includes(activeOrgan) : false;

  function chooseOrgan(id: string) {
    onSelect(id);
    setHidden((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (ORGAN_DATA[id]) {
      const coord = ORGAN_DATA[id].center;
      setView({
        bounds: { center: coord, size: [0.7, 0.7, 0.7] },
        direction: 'front',
        revision: Date.now(),
      });
    }
  }

  function fitPreset(preset: 'front' | 'back' | 'side' | 'chest' | 'abdomen' | 'head') {
    if (preset === 'chest') {
      setView({ bounds: { center: [0, 1.25, 0], size: [1.2, 1.2, 0.8] }, direction: 'chest', revision: Date.now() });
    } else if (preset === 'abdomen') {
      setView({ bounds: { center: [0, 0.7, 0], size: [1.1, 1.1, 0.75] }, direction: 'abdomen', revision: Date.now() });
    } else if (preset === 'head') {
      setView({ bounds: { center: [0, 2.15, 0], size: [0.8, 0.8, 0.7] }, direction: 'head', revision: Date.now() });
    } else {
      setView({ bounds: whole, direction: preset, revision: Date.now() });
    }
  }

  function restore() {
    setHidden(new Set());
    setIsolate(false);
    setOpacity(0.12);
    setRotating(false);
    setShowSkeleton(true);
    setShowVascular(true);
    setShowSkin(true);
    setView({ bounds: whole, direction: 'front', revision: Date.now() });
  }

  function zoom(factor: number) {
    const c = controls.current;
    if (!c) return;
    const offset = c.object.position.clone().sub(c.target);
    c.object.position.copy(c.target).add(offset.multiplyScalar(factor));
    c.update();
  }

  return (
    <div
      ref={root}
      className={'anatomy ' + (large ? 'anatomy-large ' : '') + (expanded ? 'anatomy-expanded' : '')}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        backgroundColor: '#0c1613',
        borderRadius: '16px',
        padding: '16px',
        border: '1px solid #1a3027',
        color: '#e2ece7',
      }}
    >
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '6px',
              borderRadius: '8px',
              backgroundColor: '#14382c',
              border: '1px solid #235c48',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <HeartPulse size={18} />
          </div>
          <div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '1px',
                color: '#6ee7b7',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span className="live-dot" />
              {hi ? 'यथार्थवादी 3D मानव शरीर रचना' : 'AUTHENTIC 3D HUMAN ANATOMY'}
            </span>
            <small style={{ fontSize: '10px', color: '#82998e' }}>
              Z-Anatomy TA2 & BodyParts3D Authentic Geometry
            </small>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Deep Catalog Modal Trigger */}
          <button
            type="button"
            onClick={() => setShowCatalogModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: '#153328',
              border: '1px solid #2d6652',
              color: '#a7f3d0',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Database size={14} />
            <span>{hi ? '2,234 संरचनाएं खोजें' : 'Deep Anatomy Catalog (2,234 Meshes)'}</span>
          </button>

          {/* Fullscreen Expand */}
          <button
            data-expand
            className="icon-button"
            aria-label={expanded ? 'Exit expanded anatomy' : 'Expand anatomy'}
            onClick={() => setExpanded(!expanded)}
            style={{
              padding: '6px',
              borderRadius: '8px',
              backgroundColor: '#14251f',
              border: '1px solid #1f3b31',
              color: '#94a39b',
              cursor: 'pointer',
            }}
          >
            {expanded ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
        </div>
      </div>

      {/* Layer Visibility Toggles (Ribs, Vessels, Organs, Skin) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          padding: '8px 12px',
          backgroundColor: '#0f1f1a',
          borderRadius: '10px',
          border: '1px solid #1a382e',
        }}
      >
        <span style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#688c7c', letterSpacing: '0.5px' }}>
          {hi ? 'शारीरिक परतें:' : 'LAYERS:'}
        </span>

        {/* Skeletal Cage Toggle */}
        <button
          type="button"
          onClick={() => setShowSkeleton(!showSkeleton)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            border: showSkeleton ? '1px solid #38bdf8' : '1px solid #253a33',
            backgroundColor: showSkeleton ? '#0c3547' : '#142520',
            color: showSkeleton ? '#e0f2fe' : '#7d9188',
          }}
        >
          <Bone size={13} color={showSkeleton ? '#38bdf8' : '#6b7280'} />
          <span>{hi ? 'पसली पिंजर व रीढ़' : 'Skeletal Cage (Ribs & Spine)'}</span>
        </button>

        {/* Vascular Tree Toggle */}
        <button
          type="button"
          onClick={() => setShowVascular(!showVascular)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
            border: showVascular ? '1px solid #f43f5e' : '1px solid #253a33',
            backgroundColor: showVascular ? '#4c0d17' : '#142520',
            color: showVascular ? '#ffe4e6' : '#7d9188',
          }}
        >
          <Activity size={13} color={showVascular ? '#f43f5e' : '#6b7280'} />
          <span>{hi ? 'रक्त वाहिकाएं (महाधमनी)' : 'Vascular Network (Aorta & Veins)'}</span>
        </button>

        {/* Skin Opacity Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          <button
            type="button"
            onClick={() => setShowSkin(!showSkin)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '10px',
              cursor: 'pointer',
              border: showSkin ? '1px solid #22c55e' : '1px solid #253a33',
              backgroundColor: showSkin ? '#133526' : '#142520',
              color: showSkin ? '#86efac' : '#7d9188',
            }}
          >
            {showSkin ? <Eye size={12} /> : <EyeOff size={12} />}
            <span>{hi ? 'त्वचा' : 'Body Skin'}</span>
          </button>

          {showSkin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="range"
                min="0.02"
                max="0.6"
                step="0.02"
                value={opacity}
                onChange={(e) => setOpacity(+e.target.value)}
                style={{ width: '65px', accentColor: '#22c55e', cursor: 'pointer' }}
                title="Adjust Body Transparency"
              />
              <span style={{ fontSize: '10px', color: '#94a39b', minWidth: '24px' }}>
                {Math.round(opacity * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3D Canvas Stage */}
      <div
        className="atlas-stage"
        style={{
          position: 'relative',
          width: '100%',
          height: expanded ? '72vh' : large ? '540px' : '420px',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#07100e',
          border: '1px solid #162c23',
        }}
      >
        <ViewerBoundary
          key={reset}
          retry={() => {
            useGLTF.clear('/models/body.glb');
            useGLTF.clear('/models/skeleton.glb');
            useGLTF.clear('/models/vascular.glb');
            setReset((v) => v + 1);
          }}
        >
          <Canvas
            camera={{ position: [0, 0, 9], fov: 36, near: 0.005, far: 100 }}
            dpr={[1, 1.5]}
            frameloop="demand"
            gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
            onPointerMissed={() => {
              onSelect(null);
              setIsolate(false);
            }}
          >
            {/* Cinematic Medical Studio Lighting */}
            <ambientLight intensity={1.4} />
            <directionalLight position={[4, 7, 5]} intensity={2.8} />
            <directionalLight position={[-4, 2, -4]} intensity={1.4} color="#38bdf8" />
            <directionalLight position={[0, -5, 2]} intensity={0.6} color="#6ee7b7" />

            <Suspense
              fallback={
                <Html center>
                  <div
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(7, 16, 14, 0.9)',
                      border: '1px solid #22c55e',
                      color: '#6ee7b7',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {hi ? '3D एनाटॉमी मॉडल लोड हो रहे हैं…' : 'Loading Anatomical Structures…'}
                  </div>
                </Html>
              }
            >
              {/* 1. Body Skin Surface */}
              <BodySilhouette opacity={isolate ? 0 : opacity} visible={showSkin} />

              {/* 2. Authentic Skeletal Thoracic Assembly from BodyParts3D */}
              <SkeletalAssembly
                visible={showSkeleton && !isolate}
                opacity={0.88}
                onSelect={(name) => chooseOrgan('heart')} // Framing chest on rib click
              />

              {/* 3. Authentic Vascular Tree from BodyParts3D */}
              <VascularNetwork
                visible={showVascular && !isolate}
                opacity={0.92}
                onSelect={() => chooseOrgan('heart')}
              />

              {/* 4. Visceral Organs (All 8 key organs) */}
              {organKeys.map((k) => (
                <OrganGeometry
                  key={k}
                  url={'/models/' + k + '.glb'}
                  organId={k}
                  color={organs[k].color}
                  selected={selected}
                  hidden={hidden}
                  isolate={isolate}
                  onSelect={chooseOrgan}
                  onBounds={rememberBounds}
                  highlighted={highlighted.includes(k)}
                />
              ))}

              {/* 5. 3D Radar Beacon on Selected Organ Surface */}
              {selected && ORGAN_DATA[selected] && (
                <OrganRadarBeacon
                  position={ORGAN_DATA[selected].center}
                  highlighted={highlighted.includes(selected)}
                />
              )}

              {/* 6. 3D Floating Name Label */}
              {labels && selected && ORGAN_DATA[selected] && !hidden.has(selected) && (
                <Html position={ORGAN_DATA[selected].center} center>
                  <div
                    style={{
                      padding: '4px 10px',
                      borderRadius: '20px',
                      backgroundColor: isAbnormal ? 'rgba(153, 27, 27, 0.95)' : 'rgba(6, 78, 59, 0.95)',
                      border: isAbnormal ? '1px solid #ef4444' : '1px solid #34d399',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                    }}
                  >
                    {organs[selected as Organ]?.[hi ? 'hi' : 'en']}
                  </div>
                </Html>
              )}
            </Suspense>

            <OrbitControls
              ref={controls}
              makeDefault
              enablePan
              minDistance={0.08}
              maxDistance={30}
              enableDamping
              dampingFactor={0.08}
              autoRotate={rotating}
              autoRotateSpeed={0.8}
            />
            <CameraRig view={view} controls={controls} />
          </Canvas>
        </ViewerBoundary>

        {/* Viewport Floating Controls: View Presets & Zoom Tools */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
            zIndex: 10,
          }}
        >
          <button
            type="button"
            onClick={() => fitPreset('front')}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              backgroundColor: 'rgba(15, 31, 26, 0.85)',
              border: '1px solid #234739',
              color: '#d1fae5',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
            }}
          >
            {hi ? 'पूरा शरीर' : 'Full Body'}
          </button>
          <button
            type="button"
            onClick={() => fitPreset('chest')}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              backgroundColor: 'rgba(15, 31, 26, 0.85)',
              border: '1px solid #234739',
              color: '#d1fae5',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
            }}
          >
            {hi ? 'हृदय व छाती' : 'Chest & Ribs'}
          </button>
          <button
            type="button"
            onClick={() => fitPreset('abdomen')}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              backgroundColor: 'rgba(15, 31, 26, 0.85)',
              border: '1px solid #234739',
              color: '#d1fae5',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
            }}
          >
            {hi ? 'पेट व आंतें' : 'Abdomen'}
          </button>
          <button
            type="button"
            onClick={() => fitPreset('head')}
            style={{
              padding: '5px 10px',
              borderRadius: '6px',
              backgroundColor: 'rgba(15, 31, 26, 0.85)',
              border: '1px solid #234739',
              color: '#d1fae5',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
            }}
          >
            {hi ? 'मस्तिष्क' : 'Cranial / Head'}
          </button>
        </div>

        {/* Floating Quick Camera Action Bar */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            zIndex: 10,
          }}
        >
          <button
            type="button"
            title="Zoom In"
            onClick={() => zoom(0.8)}
            style={{
              padding: '8px',
              borderRadius: '8px',
              backgroundColor: 'rgba(15, 31, 26, 0.85)',
              border: '1px solid #234739',
              color: '#d1fae5',
              cursor: 'pointer',
            }}
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            title="Zoom Out"
            onClick={() => zoom(1.25)}
            style={{
              padding: '8px',
              borderRadius: '8px',
              backgroundColor: 'rgba(15, 31, 26, 0.85)',
              border: '1px solid #234739',
              color: '#d1fae5',
              cursor: 'pointer',
            }}
          >
            <ZoomOut size={16} />
          </button>
          <button
            type="button"
            title="Toggle Labels"
            onClick={() => setLabels(!labels)}
            style={{
              padding: '8px',
              borderRadius: '8px',
              backgroundColor: labels ? '#134e3a' : 'rgba(15, 31, 26, 0.85)',
              border: labels ? '1px solid #34d399' : '1px solid #234739',
              color: '#d1fae5',
              cursor: 'pointer',
            }}
          >
            <Eye size={16} />
          </button>
          <button
            type="button"
            title="Auto Rotate Turntable"
            onClick={() => setRotating(!rotating)}
            style={{
              padding: '8px',
              borderRadius: '8px',
              backgroundColor: rotating ? '#134e3a' : 'rgba(15, 31, 26, 0.85)',
              border: rotating ? '1px solid #34d399' : '1px solid #234739',
              color: '#d1fae5',
              cursor: 'pointer',
            }}
          >
            <RotateCw size={16} />
          </button>
          <button
            type="button"
            title="Reset View"
            onClick={restore}
            style={{
              padding: '8px',
              borderRadius: '8px',
              backgroundColor: 'rgba(15, 31, 26, 0.85)',
              border: '1px solid #234739',
              color: '#d1fae5',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Organ Selection Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        {organKeys.map((k) => {
          const isSel = selected === k;
          const isHigh = highlighted.includes(k);
          return (
            <button
              key={k}
              type="button"
              onClick={() => chooseOrgan(k)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: isSel ? 800 : 600,
                cursor: 'pointer',
                backgroundColor: isSel ? '#10b981' : isHigh ? 'rgba(239, 68, 68, 0.15)' : '#12241e',
                border: isSel
                  ? '1px solid #34d399'
                  : isHigh
                  ? '1px solid #ef4444'
                  : '1px solid #233e33',
                color: isSel ? '#042f24' : isHigh ? '#fca5a5' : '#c3d6cd',
                transition: 'all 0.15s ease',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isHigh ? '#ef4444' : organs[k].color,
                }}
              />
              <span>{organs[k][hi ? 'hi' : 'en']}</span>
              {isHigh && (
                <span
                  style={{
                    fontSize: '9px',
                    backgroundColor: '#7f1d1d',
                    color: '#fecaca',
                    padding: '1px 5px',
                    borderRadius: '10px',
                    fontWeight: 800,
                  }}
                >
                  ALERT
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Enhanced Simple Insights Panel for the Selected Organ */}
      {activeOrgan && activeOrganMeta && activeAnatomyData ? (
        <section
          style={{
            backgroundColor: '#0f231b',
            border: isAbnormal ? '1.5px solid #dc2626' : '1px solid #204c3a',
            borderRadius: '14px',
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          }}
        >
          {/* Header row: Nomenclature & Health Status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: activeOrganMeta.color,
                  }}
                />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#f0fdf4' }}>
                  {activeOrganMeta[hi ? 'hi' : 'en']}
                </h3>
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    backgroundColor: '#1b3b2e',
                    color: '#6ee7b7',
                    border: '1px solid #285a46',
                  }}
                >
                  {activeAnatomyData.latin} · {activeAnatomyData.ta2Id}
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9bb1a7', fontFamily: 'monospace' }}>
                FMA ID: {activeAnatomyData.fmaId} · Dosha: {activeAnatomyData.ayurveda.dosha} ({activeAnatomyData.ayurveda.dhatu})
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isAbnormal ? (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    backgroundColor: '#450a0a',
                    border: '1px solid #ef4444',
                    color: '#fca5a5',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  <AlertTriangle size={13} />
                  {hi ? 'जांच रिपोर्ट में ध्यान देने योग्य' : 'Lab Biomarker Attention'}
                </span>
              ) : (
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    backgroundColor: '#064e3b',
                    border: '1px solid #10b981',
                    color: '#a7f3d0',
                    fontSize: '11px',
                    fontWeight: 700,
                  }}
                >
                  <CheckCircle2 size={13} />
                  {hi ? 'सामान्य व स्वस्थ स्थिति' : 'Healthy / Normal Range'}
                </span>
              )}

              {onOpenCareModal && (
                <button
                  type="button"
                  onClick={onOpenCareModal}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '8px',
                    backgroundColor: '#16a34a',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Sparkles size={14} />
                  <span>{hi ? 'पूर्ण आहार व देखभाल' : 'Full Care Guide'}</span>
                </button>
              )}
            </div>
          </div>

          {/* 1. Simple Plain-Language Explanation */}
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '8px',
              backgroundColor: '#0b1b15',
              border: '1px solid #1a382c',
              fontSize: '13px',
              lineHeight: 1.5,
              color: '#d1fae5',
            }}
          >
            <strong>{hi ? 'यह अंग क्या करता है (सरल शब्दों में): ' : 'What this organ does: '}</strong>
            <span>{hi ? activeAnatomyData.simpleExplainHi : activeAnatomyData.simpleExplainEn}</span>
          </div>

          {/* 2. Key Connected Lab Biomarkers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#82a393' }}>
              {hi ? 'संबंधित लैब टेस्ट:' : 'Monitored Biomarkers:'}
            </span>
            {activeOrganMeta.markers.map((marker) => (
              <span
                key={marker}
                style={{
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontWeight: 600,
                  backgroundColor: '#163328',
                  border: '1px solid #234f3e',
                  color: '#6ee7b7',
                }}
              >
                {marker}
              </span>
            ))}
          </div>

          {/* 3. Daily Actionable Food & Habit Insights */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '10px',
              paddingTop: '6px',
            }}
          >
            {/* Foods to Eat */}
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: '#0a1a14',
                border: '1px solid #1b4030',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#4ade80',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '4px',
                }}
              >
                <Apple size={13} />
                {hi ? 'लाभकारी भोजन (खाएं):' : 'Foods to Favor:'}
              </span>
              <p style={{ margin: 0, fontSize: '11px', color: '#a7f3d0', lineHeight: 1.4 }}>
                {(activeOrganMeta.care?.[hi ? 'hi' : 'en']?.foodsToEat || []).slice(0, 2).join(' • ')}
              </p>
            </div>

            {/* Foods to Avoid */}
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: '#170f10',
                border: '1px solid #4a191f',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#fb7185',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '4px',
                }}
              >
                <Ban size={13} />
                {hi ? 'सीमित करें या बचें:' : 'Foods to Limit:'}
              </span>
              <p style={{ margin: 0, fontSize: '11px', color: '#fecdd3', lineHeight: 1.4 }}>
                {(activeOrganMeta.care?.[hi ? 'hi' : 'en']?.foodsToAvoid || []).slice(0, 2).join(' • ')}
              </p>
            </div>

            {/* Daily Habit */}
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: '#0a171d',
                border: '1px solid #163c4e',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#38bdf8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '4px',
                }}
              >
                <Clock size={13} />
                {hi ? 'स्वस्थ दिनचर्या आदत:' : 'Simple Daily Habit:'}
              </span>
              <p style={{ margin: 0, fontSize: '11px', color: '#bae6fd', lineHeight: 1.4 }}>
                {(activeOrganMeta.care?.[hi ? 'hi' : 'en']?.lifestyle || []).slice(0, 1)[0] ||
                  'Daily 20-30 min physical activity & hydration'}
              </p>
            </div>
          </div>
        </section>
      ) : (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#0f1f1a',
            borderRadius: '10px',
            border: '1px solid #1a382e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            color: '#94a39b',
            fontSize: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Info size={16} color="#34d399" />
            <span>
              {hi
                ? '3D मॉडल पर किसी भी अंग (जैसे हृदय, लिवर, पैंक्रियाज) पर क्लिक करें या ऊपर बटन चुनें।'
                : 'Click any organ (Heart, Liver, Pancreas, Kidneys, etc.) in the 3D body to inspect realistic structure & simple health care insights.'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => chooseOrgan('heart')}
            style={{
              padding: '5px 12px',
              borderRadius: '6px',
              backgroundColor: '#1b4332',
              border: '1px solid #2d6a4f',
              color: '#a7f3d0',
              fontWeight: 600,
              fontSize: '11px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {hi ? 'उदाहरण: हृदय चुनें' : 'Try: Select Heart'}
          </button>
        </div>
      )}

      {/* Deep BodyParts3D & Z-Anatomy 2,234 Meshes Catalog Modal */}
      <DeepAnatomyModal
        isOpen={showCatalogModal}
        onClose={() => setShowCatalogModal(false)}
        onSelectOrgan={(org) => chooseOrgan(org)}
        hi={hi}
      />
    </div>
  );
}
