import { Suspense, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Float,
  Stars,
  useGLTF,
  Html,
  Bounds,
} from '@react-three/drei'
import * as THREE from 'three'
import Hotspot from './Hotspot'

// ─── Hotspot data for key bones ──────────────────────────────────────────
const BONE_HOTSPOTS = [
  {
    id: 'hip',
    position: [0.22, -0.5, 0.04],
    data: {
      title: 'Hip / Femoral Neck',
      description:
        'The femoral neck is the most fracture-prone region in osteoporosis. Hip fractures dramatically increase mortality risk and commonly require surgical intervention.',
      conditions: [
        'Femoral neck fracture (most common osteoporotic fracture)',
        'Avascular necrosis (osteonecrosis)',
        'Hip osteoarthritis linked to low BMD',
        'Stress fractures due to cortical thinning',
      ],
    },
  },
  {
    id: 'spine',
    position: [0, -0.1, 0.08],
    data: {
      title: 'Lumbar Spine (L1–L4)',
      description:
        'Vertebral compression fractures in the lumbar spine are silent hallmarks of osteoporosis, causing progressive height loss and chronic back pain.',
      conditions: [
        'Vertebral compression fracture',
        'Spinal stenosis related to collapsed vertebrae',
         "Kyphosis (dowager's hump)",
        'Chronic axial back pain',
      ],
    },
  },
  {
    id: 'wrist',
    position: [-0.38, -0.55, 0.03],
    data: {
      title: 'Distal Radius (Wrist)',
      description:
        "Colles' fractures at the distal radius are often the first fragility fracture to appear in osteoporotic patients — typically triggered by a simple fall on outstretched hands.",
      conditions: [
        "Colles' fracture (distal radius)",
        'Comminuted wrist fractures',
        'Carpal tunnel syndrome secondary to fracture',
        'Post-fracture osteoarthritis',
      ],
    },
  },
  {
    id: 'shoulder',
    position: [-0.32, 0.1, 0.04],
    data: {
      title: 'Proximal Humerus (Shoulder)',
      description:
        'The proximal humerus is one of three classic sites of osteoporotic fracture. Bone density loss here can cause fractures from minor trauma.',
      conditions: [
        'Proximal humeral fracture',
        'Rotator cuff tears exacerbated by fragile bone',
        'Shoulder dislocation with associated fracture',
        'Nonunion following osteoporotic fracture',
      ],
    },
  },
  {
    id: 'ankle',
    position: [0.12, -1.0, 0.04],
    data: {
      title: 'Ankle & Foot',
      description:
        'While less classic than hip/spine/wrist sites, foot and ankle fractures are increasingly associated with low bone density, especially in elderly women.',
      conditions: [
        'Stress fractures of the metatarsals',
        'Calcaneal insufficiency fractures',
        'Lateral malleolus fracture from low-energy trauma',
        'Charcot arthropathy in diabetic osteoporosis',
      ],
    },
  },
]

// ─── Procedural skeleton mesh (fallback when no .glb file is present) ───
function ProceduralSkeleton({ activeId, setActiveId }) {
  const groupRef = useRef()

  useFrame((state) => {
    if (!groupRef.current) return
    // Slow auto-rotation
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.35
  })

  // Bone segments: [geometry type, position, scale, color]
  const segments = [
    // Skull
    { geo: 'sphere',   pos: [0, 1.0, 0],   scale: [0.22, 0.25, 0.22], color: '#c7d2fe' },
    // Cervical spine
    { geo: 'cylinder', pos: [0, 0.72, 0],   scale: [0.06, 0.14, 0.06], color: '#a5b4fc' },
    // Torso / ribcage (simplified)
    { geo: 'box',      pos: [0, 0.42, 0],   scale: [0.52, 0.48, 0.2],  color: '#818cf8' },
    // Lumbar spine
    { geo: 'cylinder', pos: [0, 0.08, 0],   scale: [0.07, 0.25, 0.07], color: '#a5b4fc' },
    // Pelvis
    { geo: 'box',      pos: [0, -0.12, 0],  scale: [0.46, 0.28, 0.18], color: '#818cf8' },
    // Left femur
    { geo: 'cylinder', pos: [-0.17, -0.5, 0], scale: [0.07, 0.48, 0.07], color: '#a5b4fc' },
    // Right femur
    { geo: 'cylinder', pos: [0.17, -0.5, 0],  scale: [0.07, 0.48, 0.07], color: '#a5b4fc' },
    // Left tibia
    { geo: 'cylinder', pos: [-0.18, -0.95, 0], scale: [0.055, 0.44, 0.055], color: '#c7d2fe' },
    // Right tibia
    { geo: 'cylinder', pos: [0.18, -0.95, 0],  scale: [0.055, 0.44, 0.055], color: '#c7d2fe' },
    // Left foot
    { geo: 'box',      pos: [-0.18, -1.2, 0.08], scale: [0.1, 0.06, 0.22], color: '#818cf8' },
    // Right foot
    { geo: 'box',      pos: [0.18, -1.2, 0.08],  scale: [0.1, 0.06, 0.22], color: '#818cf8' },
    // Left clavicle + upper arm
    { geo: 'cylinder', pos: [-0.28, 0.6, 0],  scale: [0.055, 0.22, 0.055], color: '#a5b4fc', rotZ: Math.PI / 2.4 },
    // Right clavicle + upper arm
    { geo: 'cylinder', pos: [0.28, 0.6, 0],   scale: [0.055, 0.22, 0.055], color: '#a5b4fc', rotZ: -Math.PI / 2.4 },
    // Left upper arm
    { geo: 'cylinder', pos: [-0.42, 0.34, 0], scale: [0.055, 0.4, 0.055], color: '#c7d2fe' },
    // Right upper arm
    { geo: 'cylinder', pos: [0.42, 0.34, 0],  scale: [0.055, 0.4, 0.055], color: '#c7d2fe' },
    // Left lower arm
    { geo: 'cylinder', pos: [-0.44, -0.04, 0], scale: [0.045, 0.38, 0.045], color: '#a5b4fc' },
    // Right lower arm
    { geo: 'cylinder', pos: [0.44, -0.04, 0],  scale: [0.045, 0.38, 0.045], color: '#a5b4fc' },
    // Left hand
    { geo: 'box',      pos: [-0.44, -0.3, 0],  scale: [0.08, 0.14, 0.05], color: '#818cf8' },
    // Right hand
    { geo: 'box',      pos: [0.44, -0.3, 0],   scale: [0.08, 0.14, 0.05], color: '#818cf8' },
  ]

  return (
    <group ref={groupRef}>
      {segments.map((s, i) => (
        <mesh
          key={i}
          position={s.pos}
          rotation={[0, 0, s.rotZ ?? 0]}
          scale={s.scale}
        >
          {s.geo === 'sphere' && <sphereGeometry args={[1, 24, 24]} />}
          {s.geo === 'cylinder' && <cylinderGeometry args={[1, 1, 1, 16]} />}
          {s.geo === 'box' && <boxGeometry args={[1, 1, 1]} />}
          <meshStandardMaterial
            color={s.color}
            roughness={0.35}
            metalness={0.15}
            emissive={s.color}
            emissiveIntensity={0.08}
          />
        </mesh>
      ))}

      {/* Hotspots */}
      {BONE_HOTSPOTS.map((h) => (
        <Hotspot
          key={h.id}
          id={h.id}
          position={h.position}
          data={h.data}
          activeId={activeId}
          onActivate={setActiveId}
        />
      ))}
    </group>
  )
}

// ─── GLB model loader (used when skeleton.glb is present in /public) ────
function SkeletonGLB({ activeId, setActiveId }) {
  // ── REPLACE '/skeleton.glb' with the actual path to your GLTF model ──
  const { scene } = useGLTF('/skeleton.glb')
  const groupRef = useRef()

  useFrame((state) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.15) * 0.35
  })

  // Traverse mesh materials to add bone-like appearance
  scene.traverse((child) => {
    if (child.isMesh) {
      child.material = new THREE.MeshStandardMaterial({
        color: '#c7d2fe',
        roughness: 0.35,
        metalness: 0.1,
        emissive: '#818cf8',
        emissiveIntensity: 0.05,
      })
    }
  })

  return (
    <group ref={groupRef}>
      <Bounds fit clip observe margin={1.2}>
        <primitive object={scene} />
      </Bounds>
      {BONE_HOTSPOTS.map((h) => (
        <Hotspot
          key={h.id}
          id={h.id}
          position={h.position}
          data={h.data}
          activeId={activeId}
          onActivate={setActiveId}
        />
      ))}
    </group>
  )
}

// ─── Fallback loading indicator ───────────────────────────────────────────
function SceneLoader() {
  return (
    <Html center>
      <div style={{ color: '#a5b4fc', fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
        <div style={{ fontSize: 13, opacity: 0.7 }}>Loading 3D Scene…</div>
      </div>
    </Html>
  )
}

// ─── Main exported component ──────────────────────────────────────────────
/**
 * SkeletonScene
 *
 * Renders a full-screen interactive 3D scene with a procedural skeleton
 * (or a GLTF model if skeleton.glb is present in /public).
 *
 * Set USE_GLB = true once you have placed skeleton.glb in /public.
 */
const USE_GLB = false // ← set to true when skeleton.glb is available

export default function SkeletonScene() {
  const [activeId, setActiveId] = useState(null)

  return (
    <div className="w-full h-full three-canvas">
      <Canvas
        camera={{ position: [0, 0.2, 3.5], fov: 45 }}
        gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping }}
        shadows
        dpr={[1, 2]}
      >
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 5, 3]} intensity={1.2} castShadow />
        <pointLight position={[-2, 2, -2]} color="#818cf8" intensity={1.5} />
        <pointLight position={[2, -2, 2]} color="#a5b4fc" intensity={0.8} />

        {/* Background stars */}
        <Stars radius={40} depth={40} count={1200} factor={3} saturation={0.5} fade speed={0.5} />

        {/* Skeleton model or procedural fallback */}
        <Suspense fallback={<SceneLoader />}>
          <Float speed={0.6} rotationIntensity={0.05} floatIntensity={0.15}>
            {USE_GLB
              ? <SkeletonGLB activeId={activeId} setActiveId={setActiveId} />
              : <ProceduralSkeleton activeId={activeId} setActiveId={setActiveId} />
            }
          </Float>
          <ContactShadows
            position={[0, -1.35, 0]}
            opacity={0.4}
            scale={3}
            blur={2}
            far={1.5}
            color="#4338ca"
          />
          <Environment preset="night" />
        </Suspense>

        {/* Camera controls */}
        <OrbitControls
          enablePan={false}
          minDistance={2}
          maxDistance={7}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI * 0.8}
          autoRotate={activeId === null}
          autoRotateSpeed={0.4}
        />
      </Canvas>
    </div>
  )
}

// Pre-load GLB when available
// useGLTF.preload('/skeleton.glb')
