import React, { useRef, useEffect, useState, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, PerspectiveCamera, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

// ═══════════════════════════════════════════════════
// Atmospheric Particles - Points-based (no sphere dots)
// ═══════════════════════════════════════════════════
const AtmosphericParticles = ({ count = 200, status }) => {
  const pointsRef = useRef()

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50
      pos[i * 3 + 1] = Math.random() * 20 - 3
      pos[i * 3 + 2] = (Math.random() - 0.5) * 50
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return geo
  }, [count])

  useFrame((state) => {
    if (!pointsRef.current) return
    const arr = pointsRef.current.geometry.attributes.position.array
    const t = state.clock.elapsedTime
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += Math.sin(t * 0.4 + i) * 0.002
      arr[i * 3] += Math.cos(t * 0.2 + i * 0.6) * 0.001
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true
    pointsRef.current.rotation.y = t * 0.006
  })

  const color = status === 'error' ? '#ff4444' : status === 'success' ? '#44ff88' : '#3b82f6'

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.06}
        color={color}
        transparent
        opacity={0.4}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

// ═══════════════════════════════════════════════════
// Neon Ground Grid - Cyberpunk animated floor
// ═══════════════════════════════════════════════════
const NeonGround = ({ status }) => {
  const meshRef = useRef()

  const gridTexture = useMemo(() => {
    const size = 512
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, size, size)

    // Vibrant multi-color grid lines
    const step = 32
    for (let i = 0; i <= size; i += step) {
      const hue = (i / size) * 60 + 180 // cyan to blue gradient
      ctx.strokeStyle = `hsla(${hue}, 80%, 60%, 0.12)`
      ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, size); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(size, i); ctx.stroke()
    }

    // Rich center glow - multi-layered
    const grad = ctx.createRadialGradient(256, 256, 0, 256, 256, 300)
    grad.addColorStop(0, 'rgba(139, 92, 246, 0.1)')
    grad.addColorStop(0.3, 'rgba(6, 182, 212, 0.06)')
    grad.addColorStop(0.6, 'rgba(236, 72, 153, 0.03)')
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)

    const tex = new THREE.CanvasTexture(canvas)
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(12, 12)
    return tex
  }, [])

  useFrame((state) => {
    if (meshRef.current?.material?.map) {
      meshRef.current.material.map.offset.y = state.clock.elapsedTime * 0.04
    }
  })

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[120, 120]} />
      <meshBasicMaterial
        map={gridTexture}
        transparent
        opacity={status === 'error' ? 0.3 : status === 'success' ? 0.7 : 0.5}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}

// LightBeams removed - cleaner look without cone beams falling from above

// ═══════════════════════════════════════════════════
// Car Headlights & Taillights
// ═══════════════════════════════════════════════════
const CarLights = ({ position, status }) => {
  const leftRef = useRef()
  const rightRef = useRef()

  useFrame((state) => {
    if (!leftRef.current || !rightRef.current) return
    const t = state.clock.elapsedTime

    if (status === 'idle') {
      const pulse = Math.sin(t * 2) * 0.3 + 1.2
      leftRef.current.intensity = pulse
      rightRef.current.intensity = pulse
      leftRef.current.color.setHex(0xffffff)
      rightRef.current.color.setHex(0xffffff)
    }
    if (status === 'error') {
      leftRef.current.color.setHex(0xff0000)
      rightRef.current.color.setHex(0xff0000)
      leftRef.current.intensity = Math.sin(t * 12) * 2 + 2.5
      rightRef.current.intensity = Math.sin(t * 12) * 2 + 2.5
    }
    if (status === 'success') {
      leftRef.current.color.setHex(0x00ff88)
      rightRef.current.color.setHex(0x00ff88)
      leftRef.current.intensity = 3.5
      rightRef.current.intensity = 3.5
    }
  })

  return (
    <>
      {/* Headlights */}
      <spotLight ref={leftRef} position={[position[0] - 0.6, position[1] + 0.3, position[2] + 2.5]} angle={0.6} penumbra={0.5} intensity={1.5} color="#ffffff" distance={15} />
      <mesh position={[position[0] - 0.6, position[1] + 0.3, position[2] + 2.5]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial
          emissive={status === 'error' ? '#ff0000' : status === 'success' ? '#00ff88' : '#ffffff'}
          emissiveIntensity={3}
          color="#ffffff"
        />
      </mesh>

      <spotLight ref={rightRef} position={[position[0] + 0.6, position[1] + 0.3, position[2] + 2.5]} angle={0.6} penumbra={0.5} intensity={1.5} color="#ffffff" distance={15} />
      <mesh position={[position[0] + 0.6, position[1] + 0.3, position[2] + 2.5]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial
          emissive={status === 'error' ? '#ff0000' : status === 'success' ? '#00ff88' : '#ffffff'}
          emissiveIntensity={3}
          color="#ffffff"
        />
      </mesh>

      {/* Taillights */}
      <pointLight position={[position[0] - 0.5, position[1] + 0.5, position[2] - 2]} intensity={1} color="#ff0000" distance={5} />
      <mesh position={[position[0] - 0.5, position[1] + 0.5, position[2] - 2]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial emissive="#ff0000" emissiveIntensity={2} />
      </mesh>

      <pointLight position={[position[0] + 0.5, position[1] + 0.5, position[2] - 2]} intensity={1} color="#ff0000" distance={5} />
      <mesh position={[position[0] + 0.5, position[1] + 0.5, position[2] - 2]}>
        <sphereGeometry args={[0.08, 12, 12]} />
        <meshStandardMaterial emissive="#ff0000" emissiveIntensity={2} />
      </mesh>
    </>
  )
}

// ═══════════════════════════════════════════════════
// Exhaust Fire (success only - no smoke sphere dots)
// ═══════════════════════════════════════════════════
const ExhaustFire = ({ position, status }) => {
  const fireRef = useRef()
  const flame2Ref = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (fireRef.current && status === 'success') {
      fireRef.current.material.emissiveIntensity = Math.sin(t * 20) * 0.5 + 2.5
      fireRef.current.scale.x = 1 + Math.sin(t * 15) * 0.3
      fireRef.current.scale.z = 1 + Math.cos(t * 15) * 0.3
    }
    if (flame2Ref.current && status === 'success') {
      flame2Ref.current.material.emissiveIntensity = Math.sin(t * 25 + 1) * 0.5 + 2
      flame2Ref.current.scale.y = 1 + Math.sin(t * 18) * 0.4
    }
  })

  if (status !== 'success') return null

  return (
    <group>
      {/* Main flame */}
      <mesh ref={fireRef} position={[position[0], position[1] - 0.3, position[2] - 2.5]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.35, 1.2, 8]} />
        <meshStandardMaterial emissive="#ff4400" emissiveIntensity={2.5} transparent opacity={0.85} color="#ff6600" />
      </mesh>
      {/* Inner blue flame */}
      <mesh ref={flame2Ref} position={[position[0], position[1] - 0.3, position[2] - 2.3]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.15, 0.6, 6]} />
        <meshStandardMaterial emissive="#4488ff" emissiveIntensity={2} transparent opacity={0.7} color="#6699ff" />
      </mesh>
      {/* Fire glow */}
      <pointLight position={[position[0], position[1] - 0.3, position[2] - 3]} intensity={4} color="#ff4400" distance={10} />
    </group>
  )
}

// ═══════════════════════════════════════════════════
// Car Model with damage & drive effects
// ═══════════════════════════════════════════════════
const CarModel = ({ modelPath, position, rotation, scale, status, onAnimationComplete }) => {
  const carRef = useRef()
  const [model, setModel] = useState(null)
  const [isDamaged, setIsDamaged] = useState(false)
  const [carParts, setCarParts] = useState([])
  const shakeIntensity = useRef(0)
  const explosionDebris = useRef([])

  useEffect(() => {
    const loader = new GLTFLoader()
    loader.load(
      modelPath,
      (gltf) => {
        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true
          }
        })
        setModel(gltf.scene)
      },
      undefined,
      (error) => {
        console.error('Error loading car model:', error)
        const fallback = new THREE.Group()
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff3333, metalness: 0.9, roughness: 0.15 })

        // Sporty body
        const body = new THREE.Mesh(new THREE.BoxGeometry(2, 0.7, 4.5), bodyMat)
        body.position.y = 0.4
        body.castShadow = true
        fallback.add(body)

        // Sloped roof
        const roof = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 2.2), bodyMat)
        roof.position.set(0, 0.95, -0.2)
        roof.castShadow = true
        fallback.add(roof)

        // Hood slope
        const hood = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.15, 1.2), bodyMat)
        hood.position.set(0, 0.7, 1.5)
        hood.rotation.x = -0.15
        fallback.add(hood)

        // Windshield
        const glassMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, metalness: 0.3, roughness: 0.1, transparent: true, opacity: 0.4 })
        const windshield = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 0.05), glassMat)
        windshield.position.set(0, 0.95, 0.85)
        windshield.rotation.x = -0.5
        fallback.add(windshield)

        // Wheels
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.6 })
        const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.25, 16)
        const wheelPositions = [[-0.95, 0.3, 1.3], [0.95, 0.3, 1.3], [-0.95, 0.3, -1.3], [0.95, 0.3, -1.3]]
        wheelPositions.forEach(([x, y, z]) => {
          const wheel = new THREE.Mesh(wheelGeo, wheelMat)
          wheel.rotation.z = Math.PI / 2
          wheel.position.set(x, y, z)
          wheel.castShadow = true
          wheel.name = 'wheel'
          fallback.add(wheel)
        })

        setModel(fallback)
      }
    )
  }, [modelPath])

  // Explosion on error
  useEffect(() => {
    if (status === 'error' && !isDamaged && model) {
      const debris = []
      for (let i = 0; i < 40; i++) {
        debris.push({
          position: new THREE.Vector3(
            position[0] + (Math.random() - 0.5) * 2,
            position[1] + Math.random() * 1.5,
            position[2] + (Math.random() - 0.5) * 2
          ),
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.25,
            Math.random() * 0.3 + 0.1,
            (Math.random() - 0.5) * 0.25
          ),
          rotation: new THREE.Euler(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
          rotSpeed: new THREE.Vector3((Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.3),
          life: 1,
          size: [0.08 + Math.random() * 0.12, 0.02 + Math.random() * 0.04, 0.02 + Math.random() * 0.04]
        })
      }
      explosionDebris.current = debris

      const parts = []
      model.traverse((child) => {
        if (child.isMesh) {
          parts.push({
            mesh: child.clone(),
            velocity: new THREE.Vector3((Math.random() - 0.5) * 0.08, Math.random() * 0.06 + 0.02, (Math.random() - 0.5) * 0.08),
            rotationVel: new THREE.Vector3((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1)
          })
        }
      })
      setCarParts(parts)
      setIsDamaged(true)

      setTimeout(() => {
        setIsDamaged(false)
        setCarParts([])
        explosionDebris.current = []
        shakeIntensity.current = 0
        onAnimationComplete?.()
      }, 3000)
    }
  }, [status, model, isDamaged, position, onAnimationComplete])

  useFrame((state, delta) => {
    if (!carRef.current || !model) return
    const t = state.clock.elapsedTime

    // Idle: gentle float + wheel rotation
    if (status === 'idle') {
      carRef.current.position.y = position[1] + Math.sin(t * 1.2) * 0.06
      carRef.current.rotation.y = rotation[1] + Math.sin(t * 0.5) * 0.03
      model.traverse((child) => {
        if (child.name?.toLowerCase().includes('wheel')) child.rotation.x += 0.015
      })
    }

    // Error: violent shake + debris physics
    if (status === 'error') {
      if (shakeIntensity.current < 1) shakeIntensity.current += delta * 3
      const shake = Math.sin(t * 60) * 0.35 * shakeIntensity.current
      carRef.current.position.x = position[0] + shake
      carRef.current.position.y = position[1] + Math.abs(shake) * 0.4
      carRef.current.rotation.z = shake * 0.35
      carRef.current.rotation.x = shake * 0.15

      explosionDebris.current.forEach((d) => {
        d.velocity.y -= 0.012
        d.position.add(d.velocity)
        d.rotation.x += d.rotSpeed.x
        d.rotation.y += d.rotSpeed.y
        d.rotation.z += d.rotSpeed.z
        d.life -= 0.012
      })

      carParts.forEach((part) => {
        part.velocity.y -= 0.015
        part.mesh.position.add(part.velocity)
        part.mesh.rotation.x += part.rotationVel.x
        part.mesh.rotation.y += part.rotationVel.y
        part.mesh.rotation.z += part.rotationVel.z
      })
    } else {
      shakeIntensity.current = 0
    }

    // Success: drive away
    if (status === 'success') {
      carRef.current.position.z -= 0.12
      carRef.current.position.x += 0.06
      carRef.current.position.y += 0.04
      carRef.current.rotation.x = Math.max(carRef.current.rotation.x - 0.015, -0.2)
      carRef.current.rotation.y -= 0.02
      model.traverse((child) => {
        if (child.name?.toLowerCase().includes('wheel')) child.rotation.x += 0.3
      })
    }
  })

  if (!model) return null

  return (
    <>
      {!isDamaged && (
        <primitive ref={carRef} object={model} position={position} rotation={rotation} scale={scale} />
      )}

      {/* Explosion debris - rectangles that look like shrapnel, not dots */}
      {status === 'error' && explosionDebris.current.map((d, i) => (
        d.life > 0 && (
          <mesh key={`debris-${i}`} position={d.position} rotation={d.rotation}>
            <boxGeometry args={d.size} />
            <meshStandardMaterial
              emissive={d.life > 0.5 ? '#ff4400' : '#ff8800'}
              emissiveIntensity={d.life * 3}
              transparent
              opacity={d.life}
              color="#ff6600"
            />
          </mesh>
        )
      ))}

      {isDamaged && carParts.map((part, i) => (
        <primitive key={`part-${i}`} object={part.mesh} scale={scale} />
      ))}
    </>
  )
}

// ═══════════════════════════════════════════════════
// Energy Ring - Animated torus rings around car
// ═══════════════════════════════════════════════════
const EnergyRing = ({ position, status }) => {
  const ringRef = useRef()

  useFrame((state) => {
    if (!ringRef.current) return
    const t = state.clock.elapsedTime
    ringRef.current.rotation.y += 0.008

    if (status === 'idle') {
      ringRef.current.scale.setScalar(1 + Math.sin(t * 2) * 0.08)
    }
    if (status === 'success') {
      ringRef.current.rotation.y += 0.04
      ringRef.current.scale.setScalar(1 + Math.sin(t * 8) * 0.2)
    }
  })

  if (status === 'error') return null

  return (
    <group ref={ringRef} position={position}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[5, 0.06, 16, 120]} />
        <meshStandardMaterial
          color={status === 'success' ? '#00ff88' : '#06b6d4'}
          emissive={status === 'success' ? '#00ff88' : '#06b6d4'}
          emissiveIntensity={status === 'success' ? 2.5 : 1}
          transparent
          opacity={0.45}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, Math.PI / 6]} position={[0, 0.05, 0]}>
        <torusGeometry args={[6.5, 0.04, 16, 120]} />
        <meshStandardMaterial
          color="#818cf8"
          emissive="#818cf8"
          emissiveIntensity={0.7}
          transparent
          opacity={0.25}
        />
      </mesh>
    </group>
  )
}

// ═══════════════════════════════════════════════════
// Loading Placeholder
// ═══════════════════════════════════════════════════
const Loader = () => {
  const meshRef = useRef()
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.02
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 0.15
      meshRef.current.material.emissiveIntensity = Math.sin(state.clock.elapsedTime * 4) * 0.5 + 1.5
    }
  })
  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[3, 1, 5]} />
      <meshStandardMaterial color="#4F46E5" emissive="#4F46E5" emissiveIntensity={1.5} metalness={0.8} roughness={0.2} />
    </mesh>
  )
}

// ═══════════════════════════════════════════════════
// Moving Background Vehicle - drives across the scene
// Each vehicle gets its own lane, speed, scale, glow
// ═══════════════════════════════════════════════════
// ═══════════════════════════════════════════════════
// Main 3D Scene - Full Page Background
// ═══════════════════════════════════════════════════
const Car3DScene = ({ status = 'idle', onAnimationComplete, modelPath = '/car_models/Camaro ZL1 2017.glb' }) => {
  const carPos = [0, -0.5, 0]

  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        gl={{
          alpha: true,
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2
        }}
      >
        <PerspectiveCamera makeDefault position={[6, 2.5, 7]} fov={42} />

        {/* Ambient fill - warm tint */}
        <ambientLight intensity={0.2} color="#c4b5fd" />

        {/* Key light */}
        <directionalLight
          position={[10, 12, 5]}
          intensity={2.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          color="#f0e6ff"
        />

        {/* Vivid blue accent spotlight (left) */}
        <spotLight position={[-10, 8, -5]} intensity={3} angle={0.5} penumbra={1} color="#818cf8" distance={30} />

        {/* Hot magenta accent spotlight (right) */}
        <spotLight position={[10, 6, -5]} intensity={2.5} angle={0.5} penumbra={1} color="#e879f9" distance={25} />

        {/* Cyan rim left */}
        <pointLight position={[-5, 3, 4]} intensity={2} color="#22d3ee" distance={18} />

        {/* Hot pink rim right */}
        <pointLight position={[5, 3, 4]} intensity={1.8} color="#f472b6" distance={18} />

        {/* Under-car neon glow */}
        <pointLight position={[0, 0.2, 0]} intensity={1.2} color="#7c3aed" distance={14} />

        {/* Warm overhead fill */}
        <pointLight position={[0, 10, 2]} intensity={0.4} color="#fde68a" distance={25} />

        {/* Environment reflections */}
        <Environment preset="night" />

        {/* ═══ HERO Car - BIG & CENTER ═══ */}
        <Suspense fallback={<Loader />}>
          <CarModel
            modelPath={modelPath}
            position={carPos}
            rotation={[0, Math.PI * 0.25, 0]}
            scale={[7, 7, 7]}
            status={status}
            onAnimationComplete={onAnimationComplete}
          />
          <CarLights position={carPos} status={status} />
          <ExhaustFire position={carPos} status={status} />
          <EnergyRing position={[0, -1, 0]} status={status} />
        </Suspense>

        {/* Atmosphere & Ground */}
        <AtmosphericParticles status={status} />
        <NeonGround status={status} />

        {/* Camera Controls */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 6}
          autoRotate={status === 'idle'}
          autoRotateSpeed={1.2}
          target={[0, 0.5, 0]}
        />
      </Canvas>
    </div>
  )
}

// Preload hero model
try { useGLTF.preload('/car_models/Camaro ZL1 2017.glb') } catch (e) {}

export default Car3DScene
