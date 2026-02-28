/**
 * BoneBackground.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Full-screen Three.js canvas rendered behind predictor page content.
 *
 * Renders ~14 procedural 3-D bones (cylinder shaft + sphere epiphyses) that
 * float, rotate and drift slowly. Each predictor page passes its own accent
 * color so the bones match the page theme.
 *
 * Props
 *  accentColor  – hex string, e.g. "#6366f1"  (defaults to indigo)
 *  secondColor  – hex string for secondary bones
 *  boneCount    – number of bone instances (default 14)
 */

import { useRef, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Stars } from '@react-three/drei'
import * as THREE from 'three'

/* ── Single bone geometry (shaft + 2 epiphyses) ─────────────────────────── */
function BoneMesh({ position, rotation, scale, color, opacity }) {
  const group = useRef()

  // Reuse geometry across instances
  const shaftGeo  = useMemo(() => new THREE.CylinderGeometry(0.08, 0.08, 1.0, 10), [])
  const headGeo   = useMemo(() => new THREE.SphereGeometry(0.22, 12, 8), [])
  const knuckleGeo = useMemo(() => new THREE.SphereGeometry(0.14, 10, 7), [])

  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.35,
    metalness: 0.15,
    transparent: true,
    opacity,
    wireframe: false,
  }), [color, opacity])

  const wireMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 0.6,
    metalness: 0,
    transparent: true,
    opacity: opacity * 0.3,
    wireframe: true,
  }), [color, opacity])

  return (
    <group ref={group} position={position} rotation={rotation} scale={scale}>
      {/* Shaft */}
      <mesh geometry={shaftGeo} material={mat} />
      <mesh geometry={shaftGeo} material={wireMat} />

      {/* Top epiphysis */}
      <mesh geometry={headGeo} material={mat} position={[0,  0.55, 0]} />
      <mesh geometry={headGeo} material={wireMat} position={[0, 0.55, 0]} />

      {/* Bottom epiphysis */}
      <mesh geometry={headGeo} material={mat} position={[0, -0.55, 0]} />
      <mesh geometry={headGeo} material={wireMat} position={[0, -0.55, 0]} />

      {/* Extra knuckle bumps on top head */}
      <mesh geometry={knuckleGeo} material={mat} position={[ 0.14,  0.60,  0.10]} />
      <mesh geometry={knuckleGeo} material={mat} position={[-0.14,  0.60, -0.10]} />

      {/* Extra knuckle bumps on bottom head */}
      <mesh geometry={knuckleGeo} material={mat} position={[ 0.14, -0.60,  0.10]} />
      <mesh geometry={knuckleGeo} material={mat} position={[-0.14, -0.60, -0.10]} />
    </group>
  )
}

/* ── Animated floating bone ──────────────────────────────────────────────── */
function FloatingBone({ seed, accentColor, secondColor }) {
  const groupRef = useRef()

  // Deterministic pseudo-random values from seed
  const r = (offset) => Math.sin(seed * 127.1 + offset * 311.7) * 0.5 + 0.5

  const initPos   = [
    (r(1) - 0.5) * 22,
    (r(2) - 0.5) * 14,
    (r(3) - 0.5) * 8  - 5,
  ]
  const initRot   = [r(4) * Math.PI * 2, r(5) * Math.PI * 2, r(6) * Math.PI * 2]
  const scale     = 0.35 + r(7) * 0.55          // 0.35 – 0.90
  const speed     = 0.12 + r(8) * 0.22           // rotation speed
  const driftAmp  = 0.4 + r(9) * 0.8             // float amplitude
  const driftFreq = 0.18 + r(10) * 0.22
  const phaseX    = r(11) * Math.PI * 2
  const phaseY    = r(12) * Math.PI * 2
  const color     = r(13) > 0.45 ? accentColor : secondColor
  const opacity   = 0.18 + r(14) * 0.22          // 0.18 – 0.40

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.elapsedTime
    groupRef.current.rotation.x += speed * 0.007
    groupRef.current.rotation.y += speed * 0.011
    groupRef.current.rotation.z += speed * 0.005
    groupRef.current.position.y = initPos[1] + Math.sin(t * driftFreq + phaseY) * driftAmp
    groupRef.current.position.x = initPos[0] + Math.sin(t * driftFreq * 0.7 + phaseX) * (driftAmp * 0.5)
  })

  return (
    <group ref={groupRef} position={initPos} rotation={initRot} scale={scale}>
      <BoneMesh
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
        scale={[1, 1, 1]}
        color={color}
        opacity={opacity}
      />
    </group>
  )
}

/* ── Scene contents ──────────────────────────────────────────────────────── */
function Scene({ accentColor, secondColor, boneCount }) {
  const bones = useMemo(
    () => Array.from({ length: boneCount }, (_, i) => i),
    [boneCount]
  )

  return (
    <>
      {/* Ambient + directional lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]}  intensity={1.2} color={accentColor} />
      <directionalLight position={[-8, -5, -4]} intensity={0.6} color={secondColor} />
      <pointLight position={[0, 6, 3]} intensity={0.8} color={accentColor} distance={20} />

      {/* Deep-space star field */}
      <Stars
        radius={60}
        depth={30}
        count={600}
        factor={2}
        saturation={0.6}
        fade
        speed={0.4}
      />

      {/* Floating bones */}
      {bones.map((seed) => (
        <FloatingBone
          key={seed}
          seed={seed + 1}
          accentColor={accentColor}
          secondColor={secondColor}
        />
      ))}
    </>
  )
}

/* ── Public component ────────────────────────────────────────────────────── */
export default function BoneBackground({
  accentColor  = '#6366f1',
  secondColor  = '#8b5cf6',
  boneCount    = 14,
  gradientFrom = 'rgba(6,6,28,0.95)',
  gradientTo   = 'rgba(12,4,32,0.95)',
}) {
  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* Per-page gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
        }}
      />

      {/* Three.js Canvas */}
      <Canvas
        camera={{ position: [0, 0, 12], fov: 65 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
        style={{ position: 'absolute', inset: 0 }}
      >
        <Suspense fallback={null}>
          <Scene
            accentColor={accentColor}
            secondColor={secondColor}
            boneCount={boneCount}
          />
        </Suspense>
      </Canvas>

      {/* Subtle vignette on top of Three.js */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 40%, rgba(3,3,16,0.7) 100%)',
        }}
      />
    </div>
  )
}
