import React, { Suspense, useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import { OrganKey, TestRow, SkinMode, AnatomicalLayers } from '../../types';
import { ORGANS } from '../../services/medicalRules';
import { useTranslation } from 'react-i18next';
import {
  Eye,
  RotateCcw,
  Sparkles,
  Layers,
  Info,
  ShieldAlert,
  ChevronRight,
  Activity,
  HeartPulse,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Tag,
  Crosshair,
  Search,
  MessageSquare,
  ArrowDownRight,
  Maximize2,
  Volume2,
  VolumeX,
  Orbit,
  Compass,
  Smartphone,
  Database,
  ZoomOut,
  Target,
} from 'lucide-react';
import { ANATOMICAL_STRUCTURES } from '../../data/anatomyNomenclature';
import { DeepAnatomyModal } from './DeepAnatomyModal';
import { playOrganClickChime } from '../../utils/audioChime';
import bp3dCatalog from '../../data/bp3dCatalog.json';

interface AnatomyViewerProps {
  activeOrgan?: OrganKey | null;
  onSelectOrgan?: (organ: OrganKey | null) => void;
  reportRows?: TestRow[];
  selectedFinding?: TestRow | null;
  onSelectFinding?: (row: TestRow | null) => void;
  onOpenChatWithSymptom?: (symptom: string) => void;
}

const ALL_ORGAN_KEYS: OrganKey[] = [
  'brain',
  'heart',
  'lungs',
  'liver',
  'stomach',
  'pancreas',
  'kidneys',
  'intestines',
];

// Stabilized Smooth Camera Controller with Damping & Auto-Orbit
// Stabilized Smooth Camera Controller with Damping, Wheel Interrupt, & Auto-Orbit
function StabilizedCameraController({
  targetPos,
  targetLookAt,
  isInteracting,
  autoRotate = false,
}: {
  targetPos: THREE.Vector3;
  targetLookAt: THREE.Vector3;
  isInteracting: boolean;
  autoRotate?: boolean;
}) {
  const { camera, gl } = useThree();
  const controlsRef = useRef<any>(null);
  const isTransitioningRef = useRef(false);
  const prevTargetPos = useRef<THREE.Vector3>(targetPos.clone());
  const prevTargetLookAt = useRef<THREE.Vector3>(targetLookAt.clone());

  // Detect when targetPos or targetLookAt changes to start a smooth glide
  useEffect(() => {
    if (
      targetPos.distanceTo(prevTargetPos.current) > 0.05 ||
      targetLookAt.distanceTo(prevTargetLookAt.current) > 0.05
    ) {
      prevTargetPos.current.copy(targetPos);
      prevTargetLookAt.current.copy(targetLookAt);
      isTransitioningRef.current = true;
    }
  }, [targetPos, targetLookAt]);

  // Cancel transition on user scroll/wheel zoom so wheel zoom is instant and never fights the camera
  useEffect(() => {
    const dom = gl.domElement;
    const handleWheel = () => {
      isTransitioningRef.current = false;
    };
    dom.addEventListener('wheel', handleWheel, { passive: true });
    return () => dom.removeEventListener('wheel', handleWheel);
  }, [gl]);

  useFrame((_, delta) => {
    if (isTransitioningRef.current && !isInteracting) {
      const factor = Math.min(delta * 5.2, 1);
      camera.position.lerp(targetPos, factor);
      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLookAt, factor);
        controlsRef.current.update();
      }
      // Release camera completely once close to target destination
      if (
        camera.position.distanceTo(targetPos) < 0.035 &&
        controlsRef.current?.target.distanceTo(targetLookAt) < 0.02
      ) {
        isTransitioningRef.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping={true}
      dampingFactor={0.08}
      rotateSpeed={0.7}
      zoomSpeed={0.9}
      panSpeed={0.7}
      minDistance={0.3}
      maxDistance={6.0}
      target={[targetLookAt.x, targetLookAt.y, targetLookAt.z]}
      autoRotate={autoRotate && !isInteracting && !isTransitioningRef.current}
      autoRotateSpeed={1.2}
      onStart={() => {
        isTransitioningRef.current = false;
      }}
      makeDefault
    />
  );
}

// Sleek Medical Leader Callout & Arrow System
function MedicalOrganCallout({
  organKey,
  status,
  lang,
  onUnzoom,
}: {
  organKey: OrganKey;
  status?: 'high' | 'low' | 'within';
  lang: string;
  onUnzoom: () => void;
}) {
  const meta = ORGANS[organKey];
  const organPos = useMemo(() => new THREE.Vector3(...meta.position), [meta]);

  // Floating badge anchor position offset from the organ
  const badgePos = useMemo(() => {
    const offset = meta.arrowOffset;
    return new THREE.Vector3(offset[0], offset[1], offset[2]);
  }, [meta]);

  // Leader line vector calculation & exact rotation quaternion
  const { lineMid, lineLen, orientation } = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(organPos, badgePos).normalize();
    const len = badgePos.distanceTo(organPos);
    const mid = new THREE.Vector3().addVectors(badgePos, organPos).multiplyScalar(0.5);

    // Three.js Cylinder points along (0, 1, 0) - rotate towards target organ
    const q = new THREE.Quaternion();
    q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);

    return { lineMid: mid, lineLen: len, orientation: q };
  }, [organPos, badgePos]);

  // Animated pulse for the target beacon
  const targetBeaconRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (targetBeaconRef.current) {
      const t = state.clock.getElapsedTime();
      const s = 1 + Math.sin(t * 4.5) * 0.14;
      targetBeaconRef.current.scale.set(s, s, s);
    }
  });

  const accentColor = status === 'high' ? '#ef4444' : status === 'low' ? '#f59e0b' : '#38bdf8';

  return (
    <group>
      {/* 1. Sleek Glowing Leader Line */}
      <mesh position={lineMid} quaternion={orientation}>
        <cylinderGeometry args={[0.005, 0.005, lineLen * 0.90, 12]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={1.2}
          roughness={0.2}
          transparent
          opacity={0.88}
        />
      </mesh>

      {/* 2. Sleek Tapered Arrowhead Cone pointing into organ */}
      <mesh
        position={[
          organPos.x - (organPos.x - badgePos.x) * 0.05,
          organPos.y - (organPos.y - badgePos.y) * 0.05,
          organPos.z - (organPos.z - badgePos.z) * 0.05,
        ]}
        quaternion={orientation}
      >
        <coneGeometry args={[0.022, 0.065, 16]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={1.6}
          roughness={0.1}
        />
      </mesh>

      {/* 3. Pulsing Radar Target Beacon on Organ Surface */}
      <group ref={targetBeaconRef} position={organPos}>
        <mesh>
          <sphereGeometry args={[0.024, 16, 16]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={1.8}
            roughness={0.1}
          />
        </mesh>
        <mesh rotation={[Math.PI * 0.5, 0, 0]}>
          <ringGeometry args={[0.036, 0.046, 24]} />
          <meshBasicMaterial color={accentColor} side={THREE.DoubleSide} transparent opacity={0.85} />
        </mesh>
        <mesh rotation={[Math.PI * 0.5, 0, 0]}>
          <ringGeometry args={[0.058, 0.064, 24]} />
          <meshBasicMaterial color={accentColor} side={THREE.DoubleSide} transparent opacity={0.4} />
        </mesh>
      </group>

      {/* 4. Elegant Interactive Callout Card Badge at start point */}
      <Html
        position={[badgePos.x, badgePos.y, badgePos.z]}
        center
        style={{ pointerEvents: 'auto' }}
      >
        <div className="bg-slate-950/95 backdrop-blur-xl border border-sky-400/70 p-2.5 rounded-xl shadow-2xl max-w-[200px] text-white animate-in fade-in zoom-in-95 duration-200 ring-1 ring-sky-500/20 select-none pointer-events-auto">
          <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-slate-800">
            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shadow-sm animate-pulse shrink-0"
                style={{ backgroundColor: meta.color }}
              />
              <span className="font-bold text-xs text-white tracking-tight truncate">
                {lang === 'hi' ? meta.nameHi : meta.nameEn}
              </span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnzoom();
              }}
              title="Close Callout"
              className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {/* Finding Alert or Healthy Tag */}
          <div className="mt-1.5 flex items-center justify-between text-[10px]">
            {status ? (
              <span
                className={`font-bold uppercase px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
                  status === 'high'
                    ? 'bg-red-950 text-red-300 border border-red-700/60'
                    : 'bg-amber-950 text-amber-300 border border-amber-700/60'
                }`}
              >
                <AlertCircle className="w-2.5 h-2.5" />
                <span>{status === 'high' ? 'High / Elevated' : 'Low / Subnormal'}</span>
              </span>
            ) : (
              <span className="font-medium text-emerald-400 bg-emerald-950/70 px-1.5 py-0.5 rounded-full border border-emerald-800/50 flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>Normal Limits</span>
              </span>
            )}

            <span className="text-[9px] text-slate-400 font-mono">
              {meta.fmaId}
            </span>
          </div>

          {/* Direct Unzoom Button inside Callout */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUnzoom();
            }}
            className="mt-2 w-full py-1 px-2.5 rounded-lg bg-slate-800/90 hover:bg-emerald-900/60 border border-slate-700 hover:border-emerald-500/60 text-slate-200 hover:text-emerald-200 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow group"
          >
            <RotateCcw className="w-2.5 h-2.5 text-slate-400 group-hover:text-emerald-400 group-hover:-rotate-90 transition-transform" />
            <span>{lang === 'hi' ? 'अनज़ूम करें' : 'Unzoom / Reset'}</span>
          </button>
        </div>
      </Html>
    </group>
  );
}

// 3D Visual Pin Marker with Small Readable Font Organ Name Labels
// 3D Visual Pin Marker with sleek, non-scaling crisp tooltips
function WebGLOrganMarker({
  organKey,
  status,
  isHovered,
  isSelected,
  lang,
  onSelect,
}: {
  organKey: OrganKey;
  status?: 'high' | 'low' | 'within';
  isHovered: boolean;
  isSelected: boolean;
  lang: string;
  onSelect: (k: OrganKey) => void;
}) {
  const meta = ORGANS[organKey];
  const pos = meta.position;
  const pinRef = useRef<THREE.Group>(null);
  const [localHover, setLocalHover] = useState(false);

  useFrame((state) => {
    if (pinRef.current) {
      const t = state.clock.getElapsedTime();
      const s = 1 + (isSelected ? Math.sin(t * 5) * 0.12 : isHovered || localHover ? 0.15 : 0);
      pinRef.current.scale.set(s, s, s);
    }
  });

  const pinColor = useMemo(() => {
    if (isSelected) return '#10b981';
    if (status === 'high') return '#ef4444';
    if (status === 'low') return '#f59e0b';
    if (isHovered || localHover) return '#38bdf8';
    return meta.color;
  }, [isSelected, status, isHovered, localHover, meta.color]);

  const showLabel = isSelected || isHovered || localHover || status === 'high' || status === 'low';

  return (
    <group
      ref={pinRef}
      position={[pos[0], pos[1], pos[2] + 0.14]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(organKey);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setLocalHover(true);
      }}
      onPointerOut={() => setLocalHover(false)}
    >
      {/* 3D Glowing Beacon Sphere */}
      <mesh>
        <sphereGeometry args={[0.022, 16, 16]} />
        <meshStandardMaterial
          color={pinColor}
          emissive={pinColor}
          emissiveIntensity={isSelected ? 1.6 : status ? 1.4 : 0.8}
          roughness={0.2}
        />
      </mesh>
      {/* 3D Radar Pulse Ring */}
      <mesh rotation={[Math.PI * 0.5, 0, 0]}>
        <ringGeometry args={[0.028, 0.038, 24]} />
        <meshBasicMaterial color={pinColor} side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>

      {/* Sleek, Non-Scaling Micro-Badge: Only shown on hover/selection/abnormal status */}
      {showLabel && (
        <Html
          position={[0, 0.045, 0]}
          center
          style={{ pointerEvents: 'auto' }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(organKey);
            }}
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xl border backdrop-blur-md transition-all duration-150 cursor-pointer select-none whitespace-nowrap ${
              isSelected
                ? 'bg-emerald-600/95 border-emerald-300 text-white ring-1 ring-emerald-400 scale-105 shadow-emerald-950/80'
                : status === 'high'
                ? 'bg-red-950/95 border-red-500/90 text-red-100 ring-1 ring-red-500/50 hover:bg-red-900'
                : status === 'low'
                ? 'bg-amber-950/95 border-amber-500/90 text-amber-100 ring-1 ring-amber-500/50 hover:bg-amber-900'
                : 'bg-slate-900/95 border-slate-700 text-slate-200 hover:border-emerald-400 hover:bg-slate-800'
            }`}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0 shadow-sm"
              style={{
                backgroundColor: isSelected
                  ? '#34d399'
                  : status === 'high'
                  ? '#ef4444'
                  : status === 'low'
                  ? '#f59e0b'
                  : meta.color,
              }}
            />
            <span className="font-semibold text-white">
              {lang === 'hi' ? meta.nameHi : meta.nameEn}
            </span>
            {status === 'high' && (
              <span className="text-[8px] font-black uppercase px-1 rounded bg-red-600 text-white leading-tight">
                High
              </span>
            )}
            {status === 'low' && (
              <span className="text-[8px] font-black uppercase px-1 rounded bg-amber-600 text-white leading-tight">
                Low
              </span>
            )}
          </button>
        </Html>
      )}
    </group>
  );
}

// Individual GLB Organ Component with Stabilized Raycasting
function OrganModel({
  organKey,
  isSelected,
  isHighlighted,
  severity,
  isDimmed = false,
  onSelect,
  onHover,
}: {
  organKey: OrganKey;
  isSelected: boolean;
  isHighlighted: boolean;
  severity?: 'high' | 'low';
  isDimmed?: boolean;
  onSelect: (key: OrganKey) => void;
  onHover: (key: OrganKey | null) => void;
}) {
  const meshRef = useRef<THREE.Group>(null);
  const organMeta = ORGANS[organKey];
  const [hovered, setHovered] = useState(false);

  const { scene } = useGLTF(`/models/${organKey}.glb`);

  // Clone scene and create materials once on mount
  const { clonedScene, materials } = useMemo(() => {
    const clone = scene.clone(true);
    const mats: THREE.MeshStandardMaterial[] = [];
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.computeVertexNormals();
        }
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(organMeta.color),
          roughness: 0.28,
          metalness: 0.12,
          emissive: new THREE.Color('#000000'),
          emissiveIntensity: 0.05,
          transparent: true,
          opacity: 1.0,
        });
        mesh.material = mat;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mats.push(mat);
      }
    });
    return { clonedScene: clone, materials: mats };
  }, [scene, organMeta.color]);

  // Color calculation
  const targetColor = useMemo(() => {
    if (isHighlighted) {
      return severity === 'high' ? new THREE.Color('#ef4444') : new THREE.Color('#f59e0b');
    }
    if (isSelected) return new THREE.Color('#10b981');
    if (hovered) return new THREE.Color('#38bdf8');
    return new THREE.Color(organMeta.color);
  }, [isHighlighted, severity, isSelected, hovered, organMeta.color]);

  const targetEmissive = useMemo(() => {
    if (isHighlighted || isSelected) return targetColor;
    if (hovered) return new THREE.Color('#0284c7');
    return new THREE.Color('#000000');
  }, [isHighlighted, isSelected, hovered, targetColor]);

  const targetEmissiveIntensity = isHighlighted ? 0.65 : isSelected ? 0.5 : hovered ? 0.35 : 0.05;

  // In-place material uniform update (Ultra-fast O(1) WebGL call, zero normal recalculation)
  useEffect(() => {
    materials.forEach((mat) => {
      mat.color.copy(targetColor);
      mat.emissive.copy(targetEmissive);
      mat.emissiveIntensity = targetEmissiveIntensity;
      mat.opacity = isDimmed && !isSelected ? 0.16 : 1.0;
      mat.needsUpdate = true;
    });
  }, [materials, targetColor, targetEmissive, targetEmissiveIntensity, isDimmed, isSelected]);

  useFrame((state) => {
    if (meshRef.current) {
      const t = state.clock.getElapsedTime();
      if (organKey === 'heart') {
        const beat = Math.sin(t * 7.5);
        const pulse = 1 + (beat > 0.6 ? 0.04 : 0);
        meshRef.current.scale.set(pulse, pulse, pulse);
      } else if (isHighlighted) {
        const pulse = 1 + Math.sin(t * 3.8) * 0.03;
        meshRef.current.scale.set(pulse, pulse, pulse);
      } else if (isSelected) {
        const pulse = 1 + Math.sin(t * 2.5) * 0.015;
        meshRef.current.scale.set(pulse, pulse, pulse);
      } else {
        meshRef.current.scale.set(1, 1, 1);
      }
    }
  });

  return (
    <group
      ref={meshRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(organKey);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover(organKey);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        setHovered(false);
        onHover(null);
        document.body.style.cursor = 'default';
      }}
    >
      <primitive object={clonedScene} />
    </group>
  );
}

// Outer Body Skin with Pre-instantiated Materials
function BodyShell({
  mode = 'hologram',
  opacity = 0.15,
}: {
  mode: SkinMode;
  opacity: number;
}) {
  if (mode === 'hidden') return null;

  const { scene } = useGLTF('/models/body.glb');
  const { clonedScene, meshList } = useMemo(() => {
    const clone = scene.clone(true);
    const list: THREE.Mesh[] = [];
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        if (m.geometry) {
          m.geometry.computeVertexNormals();
        }
        list.push(m);
      }
    });
    return { clonedScene: clone, meshList: list };
  }, [scene]);

  const materials: Record<Exclude<SkinMode, 'hidden'>, THREE.Material> = useMemo(() => {
    return {
      wireframe: new THREE.MeshBasicMaterial({
        color: new THREE.Color('#34d399'),
        wireframe: true,
        transparent: true,
        opacity: Math.max(0.08, opacity * 0.5),
      }),
      solid: new THREE.MeshStandardMaterial({
        color: new THREE.Color('#e2bca8'),
        roughness: 0.6,
        metalness: 0.05,
        transparent: opacity < 0.95,
        opacity: opacity,
      }),
      hologram: new THREE.MeshStandardMaterial({
        color: new THREE.Color('#a7f3d0'),
        roughness: 0.2,
        metalness: 0.1,
        transparent: true,
        opacity: opacity,
        depthWrite: false,
        side: THREE.FrontSide,
      }),
      glass: new THREE.MeshStandardMaterial({
        color: new THREE.Color('#e0f2fe'),
        roughness: 0.1,
        metalness: 0.05,
        transparent: true,
        opacity: Math.min(opacity, 0.2),
        depthWrite: false,
        side: THREE.FrontSide,
      }),
    };
  }, []);

  useEffect(() => {
    const activeMat = materials[mode] || materials.hologram;
    activeMat.opacity = mode === 'wireframe' ? Math.max(0.08, opacity * 0.5) : opacity;
    activeMat.transparent = opacity < 0.98;
    meshList.forEach((m) => {
      m.material = activeMat;
    });
  }, [meshList, mode, opacity, materials]);

  return <primitive object={clonedScene} />;
}

// Authentic Skeletal System from BodyParts3D (39 authentic meshes: Rib cage 1-12, Sternum, Clavicles, Vertebrae)
function SkeletalSystem() {
  const { scene } = useGLTF('/models/skeleton.glb');
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        if (m.geometry) m.geometry.computeVertexNormals();
        m.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#f5eedc'),
          roughness: 0.45,
          metalness: 0.08,
          transparent: true,
          opacity: 0.85,
        });
      }
    });
    return clone;
  }, [scene]);

  return <primitive object={clonedScene} />;
}

// Authentic Vascular System from BodyParts3D (10 authentic meshes: Aorta, Vena Cava, Pulmonary Trunk, Carotids)
function VascularSystem() {
  const { scene } = useGLTF('/models/vascular.glb');
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        if (m.geometry) m.geometry.computeVertexNormals();
        m.material = new THREE.MeshStandardMaterial({
          color: new THREE.Color('#e11d48'),
          roughness: 0.32,
          metalness: 0.15,
          emissive: new THREE.Color('#881337'),
          emissiveIntensity: 0.25,
        });
      }
    });
    return clone;
  }, [scene]);

  return <primitive object={clonedScene} />;
}

// Scene Root
function SceneContent({
  activeOrgan,
  hoveredOrgan,
  onSelectOrgan,
  onHoverOrgan,
  highlightedOrgans,
  layers,
  isolateMode,
  lang,
  onUnzoom,
}: {
  activeOrgan: OrganKey | null;
  hoveredOrgan: OrganKey | null;
  onSelectOrgan: (key: OrganKey) => void;
  onHoverOrgan: (key: OrganKey | null) => void;
  highlightedOrgans: Map<OrganKey, 'high' | 'low'>;
  layers: AnatomicalLayers;
  isolateMode: boolean;
  lang: string;
  onUnzoom: () => void;
}) {
  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[4, 8, 5]} intensity={1.4} />
      <directionalLight position={[-4, 3, -4]} intensity={0.7} color="#93c5fd" />
      <pointLight position={[0, 1.2, 2.5]} intensity={0.6} color="#34d399" />
      <pointLight position={[0, -1.0, 2.0]} intensity={0.4} color="#60a5fa" />

      {/* Layer 1: Body Skin Shell (Adaptive transparency) */}
      {layers.skin && !isolateMode && (
        <Suspense fallback={null}>
          <BodyShell
            mode={layers.skinMode}
            opacity={activeOrgan ? Math.min(layers.skinOpacity, 0.10) : layers.skinOpacity}
          />
        </Suspense>
      )}

      {/* Layer 2: Skeletal System */}
      {layers.skeleton && !isolateMode && <SkeletalSystem />}

      {/* Layer 3: Circulatory Vascular System */}
      {layers.vascular && !isolateMode && <VascularSystem />}

      {/* Layer 4: Visceral Organs */}
      {layers.organs && (
        <Suspense fallback={null}>
          {ALL_ORGAN_KEYS.map((k) => (
            <OrganModel
              key={k}
              organKey={k}
              isSelected={activeOrgan === k}
              isHighlighted={highlightedOrgans.has(k)}
              severity={highlightedOrgans.get(k)}
              isDimmed={Boolean(isolateMode && activeOrgan && activeOrgan !== k)}
              onSelect={onSelectOrgan}
              onHover={onHoverOrgan}
            />
          ))}
        </Suspense>
      )}

      {/* Sleek Medical Leader Callout & Arrow */}
      {layers.showArrows && activeOrgan && (
        <MedicalOrganCallout
          organKey={activeOrgan}
          status={highlightedOrgans.get(activeOrgan)}
          lang={lang}
          onUnzoom={onUnzoom}
        />
      )}

      {/* Interactive Organ Name Badges & Pins for Full Body Mode */}
      {layers.showLabels && !isolateMode && (
        <>
          {ALL_ORGAN_KEYS.map((k) => (
            <WebGLOrganMarker
              key={`marker-${k}`}
              organKey={k}
              status={highlightedOrgans.get(k)}
              isHovered={hoveredOrgan === k}
              isSelected={activeOrgan === k}
              lang={lang}
              onSelect={onSelectOrgan}
            />
          ))}
        </>
      )}
    </>
  );
}

// 2D Mobile Fallback Interactive Diagram
function Interactive2DAnatomyMap({
  currentOrgan,
  onSelectOrgan,
  highlightedOrgans,
  lang,
}: {
  currentOrgan: OrganKey | null;
  onSelectOrgan: (key: OrganKey | null) => void;
  highlightedOrgans: Map<OrganKey, 'high' | 'low'>;
  lang: string;
}) {
  const organPositions: { key: OrganKey; x: number; y: number; label: string }[] = [
    { key: 'brain', x: 200, y: 70, label: lang === 'hi' ? 'मस्तिष्क' : 'Brain' },
    { key: 'lungs', x: 155, y: 170, label: lang === 'hi' ? 'फेफड़े' : 'Lungs' },
    { key: 'heart', x: 235, y: 185, label: lang === 'hi' ? 'हृदय' : 'Heart' },
    { key: 'liver', x: 165, y: 245, label: lang === 'hi' ? 'यकृत' : 'Liver' },
    { key: 'stomach', x: 240, y: 245, label: lang === 'hi' ? 'आमाशय' : 'Stomach' },
    { key: 'pancreas', x: 200, y: 275, label: lang === 'hi' ? 'अग्न्याशय' : 'Pancreas' },
    { key: 'kidneys', x: 140, y: 310, label: lang === 'hi' ? 'गुर्दे' : 'Kidneys' },
    { key: 'intestines', x: 200, y: 355, label: lang === 'hi' ? 'आंतें' : 'Intestines' },
  ];

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4 bg-slate-950 overflow-hidden select-none">
      <div className="absolute top-14 left-4 z-10 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800/60 shadow-lg">
        {lang === 'hi' ? '2D इंटरैक्टिव एनाटॉमी मैप सक्रिय' : '2D Mobile Interactive Map Active'}
      </div>

      <svg
        viewBox="0 0 400 480"
        className="max-h-[420px] w-auto drop-shadow-2xl"
      >
        {/* Stylized Human Torso Silhouette */}
        <path
          d="M 200 30 C 180 30, 165 45, 165 75 C 165 95, 175 110, 185 115 C 160 125, 130 145, 115 190 C 105 220, 100 280, 110 330 C 120 375, 140 410, 155 450 C 165 475, 180 475, 200 475 C 220 475, 235 475, 245 450 C 260 410, 280 375, 290 330 C 300 280, 295 220, 285 190 C 270 145, 240 125, 215 115 C 225 110, 235 95, 235 75 C 235 45, 220 30, 200 30 Z"
          fill="#090d16"
          stroke="#1e293b"
          strokeWidth="3"
        />

        {/* Ribcage Outline Accent */}
        <path
          d="M 170 150 Q 200 165 230 150 M 160 180 Q 200 200 240 180 M 165 210 Q 200 230 235 210"
          fill="none"
          stroke="#1e293b"
          strokeWidth="2"
          strokeDasharray="4 4"
        />

        {/* Clickable Organ Hotspots */}
        {organPositions.map((org) => {
          const isSelected = currentOrgan === org.key;
          const isAbnormal = highlightedOrgans.has(org.key);
          const color = ORGANS[org.key]?.color || '#10b981';

          return (
            <g
              key={org.key}
              onClick={() => onSelectOrgan(isSelected ? null : org.key)}
              className="cursor-pointer transition-transform hover:scale-105"
            >
              {/* Outer pulsing ring if selected or abnormal */}
              {(isSelected || isAbnormal) && (
                <circle
                  cx={org.x}
                  cy={org.y}
                  r="26"
                  fill="none"
                  stroke={isAbnormal ? '#ef4444' : '#10b981'}
                  strokeWidth="2"
                  className="animate-pulse"
                />
              )}

              {/* Organ Base Circle */}
              <circle
                cx={org.x}
                cy={org.y}
                r="19"
                fill={isSelected ? '#10b981' : isAbnormal ? '#ef4444' : color}
                opacity={isSelected ? 1 : 0.9}
                stroke="#ffffff"
                strokeWidth="2"
              />

              {/* Organ Label Tag */}
              <rect
                x={org.x - 38}
                y={org.y + 24}
                width="76"
                height="19"
                rx="6"
                fill="#020617"
                stroke={isSelected ? '#10b981' : isAbnormal ? '#ef4444' : '#334155'}
                strokeWidth="1"
              />
              <text
                x={org.x}
                y={org.y + 37}
                textAnchor="middle"
                fill="#f8fafc"
                fontSize="10"
                fontWeight="bold"
              >
                {org.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function AnatomyViewer({
  activeOrgan = null,
  onSelectOrgan,
  reportRows = [],
  selectedFinding = null,
  onSelectFinding,
  onOpenChatWithSymptom,
}: AnatomyViewerProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'hi' ? 'hi' : 'en';

  const [currentOrgan, setCurrentOrgan] = useState<OrganKey | null>(activeOrgan);
  const [hoveredOrgan, setHoveredOrgan] = useState<OrganKey | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isolateMode, setIsolateMode] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [organSearchQuery, setOrganSearchQuery] = useState('');
  const [showAttribution, setShowAttribution] = useState(false);
  const [cameraAngle, setCameraAngle] = useState<'front' | 'back' | 'left' | 'right' | 'top'>('front');
  const [is2DFallback, setIs2DFallback] = useState(false);
  const [showDeepAnatomy, setShowDeepAnatomy] = useState(false);

  const [layers, setLayers] = useState<AnatomicalLayers>({
    skin: true,
    skinMode: 'hologram',
    skinOpacity: 0.14,
    organs: true,
    skeleton: true,
    vascular: true,
    showLabels: true,
    showArrows: true,
  });

  const prevActiveOrganRef = useRef<OrganKey | null | undefined>(activeOrgan);
  useEffect(() => {
    if (activeOrgan !== undefined && activeOrgan !== prevActiveOrganRef.current) {
      setCurrentOrgan(activeOrgan);
    }
    prevActiveOrganRef.current = activeOrgan;
  }, [activeOrgan]);

  const lastFindingIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedFinding && selectedFinding.id !== lastFindingIdRef.current) {
      lastFindingIdRef.current = selectedFinding.id;
      if (selectedFinding.organ) {
        setCurrentOrgan(selectedFinding.organ);
      }
    } else if (!selectedFinding) {
      lastFindingIdRef.current = null;
    }
  }, [selectedFinding]);

  const handleSelectOrgan = useCallback((key: OrganKey | null) => {
    setCurrentOrgan(key);
    if (soundEnabled) {
      playOrganClickChime(key ? 520 : 380);
    }
    if (onSelectOrgan) onSelectOrgan(key);
    if (onSelectFinding) {
      if (key && reportRows.length > 0) {
        const match = reportRows.find((r) => r.organ === key);
        onSelectFinding(match || null);
      } else {
        onSelectFinding(null);
      }
    }
  }, [soundEnabled, onSelectOrgan, onSelectFinding, reportRows]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= ALL_ORGAN_KEYS.length) {
        handleSelectOrgan(ALL_ORGAN_KEYS[num - 1]);
      } else if (e.key === ' ' || e.key.toLowerCase() === 'r') {
        handleSelectOrgan(null);
        setCameraAngle('front');
      } else if (e.key.toLowerCase() === 'o') {
        setAutoRotate((prev) => !prev);
      } else if (e.key.toLowerCase() === 'x') {
        setIsolateMode((prev) => !prev);
      } else if (e.key.toLowerCase() === 'm') {
        setSoundEnabled((prev) => !prev);
      } else if (e.key.toLowerCase() === 's') {
        setLayers((prev) => ({
          ...prev,
          skinMode:
            prev.skinMode === 'hologram'
              ? 'wireframe'
              : prev.skinMode === 'wireframe'
              ? 'solid'
              : prev.skinMode === 'solid'
              ? 'hidden'
              : 'hologram',
          skin: prev.skinMode !== 'solid',
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSelectOrgan]);

  const filteredOrganKeys = useMemo(() => {
    if (!organSearchQuery.trim()) return ALL_ORGAN_KEYS;
    const q = organSearchQuery.toLowerCase();
    return ALL_ORGAN_KEYS.filter((k) => {
      const meta = ORGANS[k];
      return (
        k.toLowerCase().includes(q) ||
        meta.nameEn.toLowerCase().includes(q) ||
        meta.nameHi.toLowerCase().includes(q) ||
        meta.fmaId.toLowerCase().includes(q)
      );
    });
  }, [organSearchQuery]);

  // Smooth camera position with angle presets
  const { targetPos, targetLookAt } = useMemo(() => {
    if (currentOrgan && ORGANS[currentOrgan]) {
      const meta = ORGANS[currentOrgan];
      const pos = meta.position;
      const dist = meta.cameraDistance;
      return {
        targetPos: new THREE.Vector3(pos[0] * 0.35, pos[1], pos[2] + dist),
        targetLookAt: new THREE.Vector3(pos[0], pos[1], pos[2]),
      };
    }
    if (cameraAngle === 'back') {
      return {
        targetPos: new THREE.Vector3(0, 1.25, -3.2),
        targetLookAt: new THREE.Vector3(0, 1.15, 0),
      };
    }
    if (cameraAngle === 'left') {
      return {
        targetPos: new THREE.Vector3(-3.2, 1.25, 0),
        targetLookAt: new THREE.Vector3(0, 1.15, 0),
      };
    }
    if (cameraAngle === 'right') {
      return {
        targetPos: new THREE.Vector3(3.2, 1.25, 0),
        targetLookAt: new THREE.Vector3(0, 1.15, 0),
      };
    }
    if (cameraAngle === 'top') {
      return {
        targetPos: new THREE.Vector3(0, 4.0, 0.4),
        targetLookAt: new THREE.Vector3(0, 1.15, 0),
      };
    }
    // Default Front full torso frame
    return {
      targetPos: new THREE.Vector3(0, 1.25, 3.2),
      targetLookAt: new THREE.Vector3(0, 1.15, 0),
    };
  }, [currentOrgan, cameraAngle]);

  const highlightedOrgans = useMemo(() => {
    const map = new Map<OrganKey, 'high' | 'low'>();
    reportRows.forEach((r) => {
      if (r.organ && (r.status === 'high' || r.status === 'low')) {
        map.set(r.organ, r.status);
      }
    });
    return map;
  }, [reportRows]);

  const activeOrganMeta = currentOrgan ? ORGANS[currentOrgan] : null;

  const organRelatedTests = useMemo(() => {
    if (!currentOrgan) return [];
    return reportRows.filter((r) => r.organ === currentOrgan);
  }, [currentOrgan, reportRows]);

  const organMicroStructures = useMemo(() => {
    if (!currentOrgan) return [];
    const org = currentOrgan.toLowerCase();
    return (bp3dCatalog as any[])
      .filter((item) => {
        const name = item.name.toLowerCase();
        if (org === 'liver') return name.includes('liver') || name.includes('hepatic') || name.includes('gallbladder');
        if (org === 'heart') return name.includes('heart') || name.includes('aorta') || name.includes('coronary') || name.includes('atrium') || name.includes('ventricle');
        if (org === 'lungs') return name.includes('lung') || name.includes('bronch') || name.includes('pulmon');
        if (org === 'stomach') return name.includes('stomach') || name.includes('gastr') || name.includes('pylor');
        if (org === 'kidneys') return name.includes('kidney') || name.includes('renal');
        if (org === 'pancreas') return name.includes('pancrea');
        if (org === 'brain') return name.includes('brain') || name.includes('cerebr') || name.includes('thalam');
        if (org === 'intestines') return name.includes('intestin') || name.includes('colon') || name.includes('duoden') || name.includes('ileum') || name.includes('jejunum');
        return false;
      })
      .slice(0, 6);
  }, [currentOrgan]);

  return (
    <div className="relative flex flex-col h-full w-full rounded-3xl overflow-hidden border border-emerald-900/20 bg-slate-950 text-white shadow-2xl">
      {/* Top Header & Layer Toggles Bar */}
      <div className="p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md z-10">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="font-black text-sm tracking-tight text-white flex items-center gap-2">
              <span>{t('anatomy.title')}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                BodyParts3D & Z-Anatomy
              </span>
            </h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {currentOrgan
              ? `${lang === 'hi' ? activeOrganMeta?.nameHi : activeOrganMeta?.nameEn} (${activeOrganMeta?.fmaId})`
              : 'Interactive 3D Body Anatomy · Click any organ to zoom & inspect'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          {/* Auto-Orbit Toggle */}
          <button
            onClick={() => setAutoRotate(!autoRotate)}
            className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all ${
              autoRotate
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-sm'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Auto-rotate 3D model (Press 'O')"
          >
            <Orbit className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
            <span>{autoRotate ? 'Orbiting' : 'Orbit'}</span>
          </button>

          {/* Solo Focus / Isolate Mode Toggle */}
          <button
            onClick={() => setIsolateMode(!isolateMode)}
            className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all ${
              isolateMode
                ? 'bg-amber-600 border-amber-400 text-white shadow-sm'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Isolate selected organ / X-ray focus (Press 'X')"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>{isolateMode ? 'Solo ON' : 'Solo Focus'}</span>
          </button>

          {/* Audio Chime Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-all ${
              soundEnabled
                ? 'bg-slate-800 border-emerald-500/50 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
            title={soundEnabled ? "Mute interactive audio chime (Press 'M')" : "Unmute interactive audio chime (Press 'M')"}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Full Body Labels Pin Toggle */}
          <button
            onClick={() =>
              setLayers((prev) => ({ ...prev, showLabels: !prev.showLabels }))
            }
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all ${
              layers.showLabels
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Pins: {layers.showLabels ? 'ON' : 'OFF'}</span>
          </button>

          {/* Callout Arrow Pointer Toggle */}
          <button
            onClick={() =>
              setLayers((prev) => ({ ...prev, showArrows: !prev.showArrows }))
            }
            className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all ${
              layers.showArrows
                ? 'bg-sky-600 border-sky-400 text-white shadow-md'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Arrows: {layers.showArrows ? 'ON' : 'OFF'}</span>
          </button>

          {/* 2D / 3D Mobile Fallback Toggle */}
          <button
            onClick={() => setIs2DFallback(!is2DFallback)}
            className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border transition-all ${
              is2DFallback
                ? 'bg-emerald-600 border-emerald-400 text-white shadow-sm'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Toggle between 3D WebGL and 2D Interactive Diagram for Mobile"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>{is2DFallback ? '2D Map' : '3D WebGL'}</span>
          </button>

          {/* Deep Anatomy 2,234 Meshes Browser from Asstes */}
          <button
            onClick={() => setShowDeepAnatomy(true)}
            className="px-2.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 border border-emerald-600/60 bg-emerald-950/70 text-emerald-300 hover:bg-emerald-900/80 transition-all shadow-sm"
            title="Browse all 2,234 individual structures from D:\CODEX2025-2026\RAHUL-SIR\Asstes"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lang === 'hi' ? '2,234 संरचनाएं' : '2,234 Micro-Structures'}</span>
          </button>

          {/* Skin Mode */}
          <button
            onClick={() =>
              setLayers((prev) => ({
                ...prev,
                skinMode:
                  prev.skinMode === 'hologram'
                    ? 'wireframe'
                    : prev.skinMode === 'wireframe'
                    ? 'solid'
                    : prev.skinMode === 'solid'
                    ? 'hidden'
                    : 'hologram',
                skin: prev.skinMode !== 'solid',
              }))
            }
            className="px-2.5 py-1.5 rounded-xl font-semibold bg-slate-800 border border-slate-700 text-slate-300 hover:text-white"
          >
            <Eye className="w-3.5 h-3.5 inline mr-1" />
            <span>Skin: {layers.skinMode.toUpperCase()}</span>
          </button>

          {/* Skeleton */}
          <button
            onClick={() => setLayers((prev) => ({ ...prev, skeleton: !prev.skeleton }))}
            className={`px-2.5 py-1.5 rounded-xl font-semibold border transition-all ${
              layers.skeleton
                ? 'bg-slate-800 border-amber-500/50 text-amber-200'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <span>🦴 Bones</span>
          </button>

          {/* Vascular */}
          <button
            onClick={() => setLayers((prev) => ({ ...prev, vascular: !prev.vascular }))}
            className={`px-2.5 py-1.5 rounded-xl font-semibold border transition-all ${
              layers.vascular
                ? 'bg-slate-800 border-rose-500/50 text-rose-300'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <span>🩸 Vessels</span>
          </button>

          {/* Attribution */}
          <button
            onClick={() => setShowAttribution(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
            title="Model Attribution"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Split View: 3D Canvas + Interactive Finding HUD */}
      <div className="relative flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-[560px]">
        {/* 3D Canvas Viewport */}
        <div
          className="lg:col-span-8 relative w-full h-[460px] lg:h-full cursor-grab active:cursor-grabbing bg-slate-950"
          onMouseDown={() => setIsInteracting(true)}
          onMouseUp={() => setIsInteracting(false)}
          onTouchStart={() => setIsInteracting(true)}
          onTouchEnd={() => setIsInteracting(false)}
        >
          {/* Top Organ Navigation Pills & Search Filter */}
          <div className="absolute top-3 left-3 right-3 z-10 flex items-center gap-1.5 overflow-x-auto pb-1 pointer-events-auto">
            {/* Quick Organ Search */}
            <div className="relative flex items-center min-w-[125px] max-w-[150px] shrink-0">
              <Search className="absolute left-2.5 w-3 h-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={organSearchQuery}
                onChange={(e) => setOrganSearchQuery(e.target.value)}
                placeholder={lang === 'hi' ? 'अंग खोजें...' : 'Search organ...'}
                className="w-full pl-7 pr-2 py-1 rounded-lg text-xs bg-slate-900/90 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={() => handleSelectOrgan(null)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                currentOrgan === null
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'bg-slate-900/85 backdrop-blur-md text-slate-300 hover:bg-slate-800 border border-slate-700'
              }`}
            >
              Full Body
            </button>
            {filteredOrganKeys.map((k) => {
              const isAbnormal = highlightedOrgans.has(k);
              const isSel = currentOrgan === k;
              return (
                <button
                  key={k}
                  onClick={() => handleSelectOrgan(k)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                    isSel
                      ? 'bg-emerald-500 text-white shadow-lg ring-2 ring-emerald-300'
                      : isAbnormal
                      ? 'bg-red-950/90 border border-red-500 text-red-200 hover:bg-red-900'
                      : 'bg-slate-900/85 backdrop-blur-md text-slate-300 hover:bg-slate-800 border border-slate-700'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: ORGANS[k].color }}
                  />
                  <span>{lang === 'hi' ? ORGANS[k].nameHi : ORGANS[k].nameEn}</span>
                  {isAbnormal && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Hover Status Indicator floating in bottom corner */}
          {hoveredOrgan && (
            <div className="absolute top-14 left-4 z-10 pointer-events-none px-3 py-1 rounded-xl bg-slate-900/90 border border-sky-400/50 text-sky-200 text-xs font-bold shadow-lg animate-in fade-in duration-100 flex items-center gap-2">
              <Crosshair className="w-3.5 h-3.5 text-sky-400 animate-spin" />
              <span>
                {lang === 'hi' ? ORGANS[hoveredOrgan].nameHi : ORGANS[hoveredOrgan].nameEn} — Click to Zoom & Inspect
              </span>
            </div>
          )}

          {/* Camera Angles Presets Floating Toolbar */}
          <div className="absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700/80 shadow-xl pointer-events-auto">
            <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>{lang === 'hi' ? 'कैमरा:' : 'View:'}</span>
            </span>
            {(['front', 'back', 'left', 'right', 'top'] as const).map((ang) => (
              <button
                key={ang}
                onClick={() => {
                  setCurrentOrgan(null);
                  setCameraAngle(ang);
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-bold capitalize transition-all ${
                  cameraAngle === ang && !currentOrgan
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {ang}
              </button>
            ))}
            <button
              onClick={() => {
                handleSelectOrgan(null);
                setCameraAngle('front');
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/60 transition-all border border-emerald-800/40"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t('anatomy.resetCamera')}</span>
            </button>
          </div>

          {/* 3D Canvas or 2D Mobile Fallback Map */}
          {is2DFallback ? (
            <Interactive2DAnatomyMap
              currentOrgan={currentOrgan}
              onSelectOrgan={handleSelectOrgan}
              highlightedOrgans={highlightedOrgans}
              lang={lang}
            />
          ) : (
            <Canvas
              dpr={[1, 1.75]}
              performance={{ min: 0.5 }}
              camera={{ position: [0, 1.25, 3.2], fov: 45 }}
              gl={{
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance',
              }}
            >
              <StabilizedCameraController
                targetPos={targetPos}
                targetLookAt={targetLookAt}
                isInteracting={isInteracting}
                autoRotate={autoRotate}
              />
              <SceneContent
                activeOrgan={currentOrgan}
                hoveredOrgan={hoveredOrgan}
                onSelectOrgan={handleSelectOrgan}
                onHoverOrgan={setHoveredOrgan}
                highlightedOrgans={highlightedOrgans}
                layers={layers}
                isolateMode={isolateMode}
                lang={lang}
                onUnzoom={() => handleSelectOrgan(null)}
              />
            </Canvas>
          )}
        </div>

        {/* Right Side: Educational Finding & Organ Inspection HUD */}
        <div className="lg:col-span-4 p-5 bg-slate-900/95 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col justify-between overflow-y-auto space-y-4">
          {activeOrganMeta ? (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Header with Short Insight */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full shadow-sm"
                      style={{ backgroundColor: activeOrganMeta.color }}
                    />
                    <h4 className="text-base font-black text-white">
                      {lang === 'hi' ? activeOrganMeta.nameHi : activeOrganMeta.nameEn}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {activeOrganMeta.fmaId}
                  </span>
                </div>

                {/* Terminologia Anatomica 2 (TA2) & Ayurveda Bio-Energetics */}
                {currentOrgan && ANATOMICAL_STRUCTURES[currentOrgan] && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                    <span className="font-serif italic text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-800/60">
                      Latin: {ANATOMICAL_STRUCTURES[currentOrgan].latin}
                    </span>
                    <span className="font-mono text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
                      {ANATOMICAL_STRUCTURES[currentOrgan].ta2Id}
                    </span>
                    <span className="text-[10px] font-semibold text-teal-300 bg-teal-950/70 px-2 py-0.5 rounded border border-teal-800/60">
                      Dosha: {ANATOMICAL_STRUCTURES[currentOrgan].ayurvedaAssociation.dosha} ({ANATOMICAL_STRUCTURES[currentOrgan].ayurvedaAssociation.dhatu})
                    </span>
                  </div>
                )}

                {/* Short Insight Banner on Zoom */}
                <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 leading-relaxed font-medium">
                  💡 <strong>{lang === 'hi' ? 'संक्षिप्त जानकारी:' : 'Quick Takeaway:'}</strong>{' '}
                  {lang === 'hi' ? activeOrganMeta.shortInsightHi : activeOrganMeta.shortInsightEn}
                </div>
              </div>

              {/* Associated Clinical Finding */}
              {organRelatedTests.length > 0 ? (
                <div className="space-y-2">
                  <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Report Finding for this Organ</span>
                  </h5>

                  {organRelatedTests.map((test) => (
                    <div
                      key={test.id}
                      className={`p-3.5 rounded-2xl border ${
                        test.status === 'high'
                          ? 'bg-red-950/40 border-red-800/80 text-red-200'
                          : test.status === 'low'
                          ? 'bg-amber-950/40 border-amber-800/80 text-amber-200'
                          : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-white">{test.name}</span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            test.status === 'within'
                              ? 'bg-emerald-800 text-emerald-100'
                              : 'bg-red-800 text-red-100'
                          }`}
                        >
                          {test.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-xl font-black text-white">{test.value}</span>
                        <span className="text-xs text-slate-300">{test.unit}</span>
                        <span className="text-[11px] text-slate-400 ml-auto">
                          Standard Range: {test.range}
                        </span>
                      </div>

                      <p className="mt-2 text-[11px] leading-relaxed text-slate-200 pt-2 border-t border-white/10">
                        {test.clinicalNote ||
                          (lang === 'hi'
                            ? `यह जांच परिणाम ${activeOrganMeta.nameHi} के कार्य से जुड़ा है।`
                            : `This test parameter directly correlates with ${activeOrganMeta.nameEn} physiology.`)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-300">No Active Findings in Current Report</p>
                  <p className="text-[11px]">
                    This organ does not have active abnormal markers in the selected report.
                  </p>
                </div>
              )}

              {/* BodyParts3D Micro-Anatomy Sub-structures from Asstes */}
              {organMicroStructures.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-900/50 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-emerald-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5" />
                      <span>BodyParts3D Micro-Structures ({organMicroStructures.length})</span>
                    </h5>
                    <button
                      onClick={() => setShowDeepAnatomy(true)}
                      className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold hover:underline"
                    >
                      {lang === 'hi' ? 'सभी 2,234 देखें' : 'View all 2,234'}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                    {organMicroStructures.map((sub, i) => (
                      <div
                        key={i}
                        className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] flex flex-col justify-between hover:border-emerald-500/40 transition-colors"
                      >
                        <div className="font-bold text-slate-200 line-clamp-1" title={sub.name}>
                          {sub.name}
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-slate-400 mt-1 font-mono">
                          <span className="text-emerald-400">{sub.fmaId}</span>
                          <span>{sub.volumeCm3} cm³</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommended Diagnostic Tests */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <h5 className="font-bold text-sky-400 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  <span>Recommended Clinical Biomarkers</span>
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {activeOrganMeta.recommendedTests.map((tName, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-200 text-[10px] font-medium"
                    >
                      {tName}
                    </span>
                  ))}
                </div>
              </div>

              {/* Common Associated Symptoms & Ask Chat */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-amber-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <HeartPulse className="w-3.5 h-3.5" />
                    <span>Common Related Symptoms</span>
                  </h5>
                  {onOpenChatWithSymptom && (
                    <button
                      onClick={() =>
                        onOpenChatWithSymptom(
                          (lang === 'hi' ? activeOrganMeta.symptomsHi : activeOrganMeta.symptomsEn)[0]
                        )
                      }
                      className="text-[10px] font-bold text-emerald-400 hover:underline flex items-center gap-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Ask AI</span>
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(lang === 'hi' ? activeOrganMeta.symptomsHi : activeOrganMeta.symptomsEn).map(
                    (symptom, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-200 text-[10px]"
                      >
                        {symptom}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-400">
                <HeartPulse className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-sm text-white">Full Body Anatomy Active</h4>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                Click any organ mesh in 3D or use the quick buttons above to zoom in, point arrows, and read short clinical insights.
              </p>
            </div>
          )}

          {/* Safety Notice Footer */}
          <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span>Educational visualization only. Not a clinical diagnosis.</span>
          </div>
        </div>
      </div>

      {/* Attribution & Specs Modal */}
      {showAttribution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 text-xs text-slate-300 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <span>Anatomical Model Attribution & Licensing</span>
              </h4>
              <button
                onClick={() => setShowAttribution(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 leading-relaxed">
              <div>
                <h5 className="font-bold text-emerald-400">BodyParts3D & Z-Anatomy</h5>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  BodyParts3D is a dictionary-based 3D anatomical model repository developed by the Database Center for Life Science (DBCLS), Japan under <strong>CC BY-SA 2.1 JP</strong>.
                </p>
              </div>

              <div>
                <h5 className="font-bold text-emerald-400">Optimized WebGL Derivative Specifications</h5>
                <ul className="list-disc pl-4 text-[11px] space-y-1 text-slate-400 mt-1">
                  <li>Body Shell (FMA7163): 26,000 triangles (~440 KB)</li>
                  <li>Brain (FMA50801): 18,000 triangles (~318 KB)</li>
                  <li>Heart, Lungs, Liver, Kidneys, Pancreas, Stomach, Intestines: 9,000 triangles each (~160 KB each)</li>
                  <li>Total Asset Size: &lt; 2.0 MB (Ultra-fast mobile loading)</li>
                  <li>Coordinate Space: Anatomically unified torso frame of reference</li>
                  <li>Direct Link: 2,234 Micro-Structures from Asstes/isa_BP3D_4.0_obj_99</li>
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                © DBCLS BodyParts3D & Z-Anatomy contributors. Integrated into VedaShield AI for educational health literacy.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deep Anatomy Catalog Modal (2,234 raw structures from Asstes) */}
      <DeepAnatomyModal
        isOpen={showDeepAnatomy}
        onClose={() => setShowDeepAnatomy(false)}
        onSelectOrgan={(k) => handleSelectOrgan(k)}
      />
    </div>
  );
}

useGLTF.preload('/models/body.glb');
useGLTF.preload('/models/skeleton.glb');
useGLTF.preload('/models/vascular.glb');
ALL_ORGAN_KEYS.forEach((k) => useGLTF.preload(`/models/${k}.glb`));

