import React, { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* Mouse-reactive particle field (advertising "LED pixels" vibe) */
function Particles({ count = 1400 }) {
  const ref = useRef()
  const positions = useMemo(() => {
    const p = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 70
      p[i * 3 + 1] = (Math.random() - 0.5) * 46
      p[i * 3 + 2] = (Math.random() - 0.5) * 46
    }
    return p
  }, [count])
  useFrame((state, delta) => {
    if (!ref.current) return
    ref.current.rotation.y += delta * 0.025
    // gentle drift toward pointer
    ref.current.rotation.x += (state.pointer.y * 0.15 - ref.current.rotation.x) * 0.02
  })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.13} color="#67e8f9" transparent opacity={0.7} sizeAttenuation depthWrite={false} />
    </points>
  )
}

/* Two infinite "roads" of glowing lines moving toward the viewer (billboards in motion) */
function MovingGrid({ z = 0, color = '#f59e0b', y = -6 }) {
  const ref = useRef()
  const grid = useMemo(() => {
    const g = new THREE.GridHelper(120, 60, color, color)
    g.material.transparent = true
    g.material.opacity = 0.18
    return g
  }, [color])
  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.position.z = ((ref.current.position.z + delta * 6) % 4)
  })
  return <primitive object={grid} ref={ref} position={[0, y, z]} />
}

/* Rotating wireframe "hub" — the intelligent core */
function Hub() {
  const ref = useRef()
  useFrame((_, delta) => {
    if (!ref.current) return
    ref.current.rotation.x += delta * 0.18
    ref.current.rotation.y += delta * 0.12
  })
  return (
    <mesh ref={ref} position={[0, 1, 0]}>
      <icosahedronGeometry args={[3.4, 1]} />
      <meshBasicMaterial color="#fde047" wireframe transparent opacity={0.22} />
    </mesh>
  )
}

/* Camera parallax that follows the pointer */
function Rig() {
  useFrame((state) => {
    const x = state.pointer.x * 2.4
    const yy = state.pointer.y * 1.4
    state.camera.position.x += (x - state.camera.position.x) * 0.045
    state.camera.position.y += (yy - state.camera.position.y) * 0.045
    state.camera.lookAt(0, 0.5, 0)
  })
  return null
}

export default function LoginScene() {
  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: [0, 0, 15], fov: 62 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <fog attach="fog" args={['#0a1142', 16, 42]} />
      <ambientLight intensity={0.6} />
      <Particles />
      <Hub />
      <MovingGrid y={-7} color="#22d3ee" />
      <MovingGrid y={7} color="#a855f7" />
      <Rig />
    </Canvas>
  )
}
