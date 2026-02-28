import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import BoneAnnotation from './BoneAnnotation'

/**
 * Hotspot – a clickable/hoverable 3D marker placed at a specific bone location.
 */
export default function Hotspot({ position, data, activeId, onActivate, id }) {
  const ringRef = useRef()
  const coreRef = useRef()
  const [hovered, setHovered] = useState(false)
  const isActive = activeId === id

  // Animate ring scale
  useFrame((_, delta) => {
    if (!ringRef.current) return
    const target = isActive || hovered ? 1.4 : 1.0
    ringRef.current.scale.lerp(new THREE.Vector3(target, target, target), 0.12)

    // Pulse opacity for idle state
    if (!isActive && !hovered && ringRef.current.material) {
      ringRef.current.material.opacity = 0.4 + 0.4 * Math.sin(Date.now() * 0.003)
    } else if (ringRef.current.material) {
      ringRef.current.material.opacity = 0.9
    }
  })

  const color = isActive ? '#818cf8' : hovered ? '#a5b4fc' : '#6366f1'

  return (
    <group position={position}>
      {/* Outer pulse ring */}
      <mesh
        ref={ringRef}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
        onPointerLeave={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'default' }}
        onClick={(e) => { e.stopPropagation(); onActivate(isActive ? null : id) }}
      >
        <ringGeometry args={[0.06, 0.1, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>

      {/* Core sphere */}
      <mesh
        ref={coreRef}
        onPointerEnter={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
        onPointerLeave={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = 'default' }}
        onClick={(e) => { e.stopPropagation(); onActivate(isActive ? null : id) }}
      >
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isActive || hovered ? 2.0 : 0.8}
          roughness={0.2}
          metalness={0.4}
        />
      </mesh>

      {/* Label pill above hotspot */}
      {(hovered && !isActive) && (
        <Html center position={[0, 0.18, 0]} style={{ pointerEvents: 'none' }}>
          <div
            style={{
              fontFamily: 'Inter, ui-sans-serif',
              background: 'rgba(22,22,42,0.92)',
              border: '1px solid rgba(99,102,241,0.4)',
              borderRadius: '8px',
              padding: '3px 10px',
              fontSize: '11px',
              fontWeight: '600',
              color: '#a5b4fc',
              whiteSpace: 'nowrap',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 0 12px rgba(99,102,241,0.3)',
            }}
          >
            {data.title}
          </div>
        </Html>
      )}

      {/* Full annotation panel when active */}
      {isActive && (
        <BoneAnnotation
          position={[0.3, 0.2, 0]}
          title={data.title}
          description={data.description}
          conditions={data.conditions}
          onClose={() => onActivate(null)}
        />
      )}
    </group>
  )
}
