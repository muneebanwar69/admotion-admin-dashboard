import React, { useRef, useState, useEffect, useMemo, Suspense, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, MeshDistortMaterial, OrbitControls, Sphere, Box, Torus, Text } from '@react-three/drei'
import {
  ChevronDown, Play, MapPin, Calendar, Cloud, DollarSign, Wifi, BarChart3,
  Check, Star, Mail, Phone, ArrowRight, Music, Music2,
  Zap, Shield, Users, MonitorSmartphone, Globe, Clock, Heart, Crown,
  Github, Linkedin, Twitter, ChevronUp
} from 'lucide-react'
import * as THREE from 'three'

/* ═══════════════════════════════ BRAND & HELPERS ═══════════════════════════════ */

const BRAND = {
  900: '#0B1452', 800: '#111b68', 700: '#152071', 600: '#1b2b8b',
  blue: '#3b82f6', orange: '#f59e0b', teal: '#14b8a6', purple: '#8b5cf6',
}

function useCountUp(end, duration = 2000, inView) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!inView) return
    let startTime = null
    const step = (ts) => {
      if (!startTime) startTime = ts
      const p = Math.min((ts - startTime) / duration, 1)
      setVal(Math.floor(p * end))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [inView, end, duration])
  return val
}

function useTypewriter(text, speed = 40, startDelay = 1000, inView = true) {
  const [displayed, setDisplayed] = useState('')
  useEffect(() => {
    if (!inView) return
    let i = 0
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        i++
        setDisplayed(text.slice(0, i))
        if (i >= text.length) clearInterval(interval)
      }, speed)
      return () => clearInterval(interval)
    }, startDelay)
    return () => clearTimeout(timeout)
  }, [text, speed, startDelay, inView])
  return displayed
}

function useActiveSection(sectionIds) {
  const [active, setActive] = useState('')
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => { entries.forEach(entry => { if (entry.isIntersecting) setActive(entry.target.id) }) },
      { rootMargin: '-40% 0px -55% 0px' }
    )
    sectionIds.forEach(id => { const el = document.getElementById(id); if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [sectionIds])
  return active
}

/* ═══════════════════════════════ 3D COMPONENTS ═══════════════════════════════ */

function HeroShapes({ mouse }) {
  const groupRef = useRef()
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.08
      if (mouse) {
        groupRef.current.rotation.x += (mouse.y * 0.3 - groupRef.current.rotation.x) * 0.02
        groupRef.current.rotation.z += (mouse.x * 0.2 - groupRef.current.rotation.z) * 0.02
      }
    }
  })
  return (
    <group ref={groupRef}>
      <Float speed={1.5} rotationIntensity={1.2} floatIntensity={1.5}>
        <Torus args={[1.8, 0.4, 16, 48]} position={[-2, 1, -1]}>
          <meshStandardMaterial color={BRAND.blue} wireframe transparent opacity={0.6} />
        </Torus>
      </Float>
      <Float speed={2} rotationIntensity={2} floatIntensity={1}>
        <Sphere args={[1, 32, 32]} position={[2.5, -0.5, 0]}>
          <MeshDistortMaterial color={BRAND.teal} distort={0.35} speed={2} transparent opacity={0.5} />
        </Sphere>
      </Float>
      <Float speed={1.2} rotationIntensity={1.5} floatIntensity={2}>
        <Box args={[1.2, 1.2, 1.2]} position={[0, -1.5, 1]}>
          <meshStandardMaterial color={BRAND.orange} wireframe transparent opacity={0.55} />
        </Box>
      </Float>
      <Float speed={1.8} rotationIntensity={1} floatIntensity={1.2}>
        <mesh position={[-3, -1, -2]}>
          <icosahedronGeometry args={[0.8, 0]} />
          <meshStandardMaterial color={BRAND.purple} wireframe transparent opacity={0.5} />
        </mesh>
      </Float>
      <Float speed={2.5} rotationIntensity={2} floatIntensity={1}>
        <Sphere args={[0.5, 16, 16]} position={[3.5, 2, -2]}>
          <meshStandardMaterial color={BRAND.orange} wireframe transparent opacity={0.5} />
        </Sphere>
      </Float>
      <Float speed={1.3} rotationIntensity={1.8} floatIntensity={1.6}>
        <Torus args={[2.5, 0.15, 12, 64]} position={[0, 2.5, -3]}>
          <meshStandardMaterial color={BRAND.purple} wireframe transparent opacity={0.35} />
        </Torus>
      </Float>
      <Float speed={2.8} rotationIntensity={1.5} floatIntensity={0.8}>
        <mesh position={[4, 1.5, -1]}>
          <dodecahedronGeometry args={[0.6, 0]} />
          <meshStandardMaterial color={BRAND.teal} wireframe transparent opacity={0.4} />
        </mesh>
      </Float>
    </group>
  )
}

function Particles({ count = 120 }) {
  const mesh = useRef()
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20
      arr[i * 3 + 1] = (Math.random() - 0.5) * 20
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20
    }
    return arr
  }, [count])
  useFrame((_, delta) => { if (mesh.current) mesh.current.rotation.y += delta * 0.02 })
  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#ffffff" transparent opacity={0.5} sizeAttenuation />
    </points>
  )
}

function FloatingScreen() {
  const ref = useRef()
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.y += delta * 0.3 })
  return (
    <group ref={ref}>
      <Float speed={1.5} floatIntensity={0.5}>
        <Box args={[1.6, 2.8, 0.12]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
        </Box>
        <Box args={[1.4, 2.4, 0.01]} position={[0, 0.05, 0.07]}>
          <meshStandardMaterial color={BRAND.blue} emissive={BRAND.blue} emissiveIntensity={0.3} />
        </Box>
        <Box args={[0.5, 0.1, 0.01]} position={[0, 1.15, 0.07]}>
          <meshStandardMaterial color="#0a0a1a" />
        </Box>
      </Float>
    </group>
  )
}

function VehicleWireframe() {
  const ref = useRef()
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.y += delta * 0.25 })
  return (
    <group ref={ref} scale={1.1}>
      <Box args={[3.5, 0.8, 1.6]} position={[0, 0.3, 0]}>
        <meshStandardMaterial color={BRAND.blue} wireframe transparent opacity={0.6} />
      </Box>
      <Box args={[1.8, 0.7, 1.4]} position={[0.2, 0.95, 0]}>
        <meshStandardMaterial color={BRAND.teal} wireframe transparent opacity={0.5} />
      </Box>
      <Box args={[1.2, 0.1, 1.0]} position={[0.2, 1.35, 0]}>
        <meshStandardMaterial color={BRAND.orange} emissive={BRAND.orange} emissiveIntensity={0.5} transparent opacity={0.8} />
      </Box>
      {[[-1.2, -0.15, 0.85], [-1.2, -0.15, -0.85], [1.2, -0.15, 0.85], [1.2, -0.15, -0.85]].map((pos, i) => (
        <mesh key={i} position={pos} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.3, 0.1, 8, 16]} />
          <meshStandardMaterial color="#ffffff" wireframe transparent opacity={0.4} />
        </mesh>
      ))}
      <Float speed={2} floatIntensity={0.3}>
        <Text position={[0.2, 2.0, 0]} fontSize={0.22} color={BRAND.orange} anchorX="center">LED Screen</Text>
      </Float>
      <Float speed={1.8} floatIntensity={0.3}>
        <Text position={[-2.2, 0.8, 0]} fontSize={0.18} color={BRAND.teal} anchorX="center">GPS</Text>
      </Float>
      <Float speed={1.5} floatIntensity={0.3}>
        <Text position={[2.5, 1.2, 0]} fontSize={0.18} color={BRAND.blue} anchorX="center">4G Connection</Text>
      </Float>
      <Float speed={2.2} floatIntensity={0.3}>
        <Text position={[0, -0.6, 1.2]} fontSize={0.18} color={BRAND.purple} anchorX="center">AI Scheduling</Text>
      </Float>
    </group>
  )
}

function WireframeGlobe() {
  const ref = useRef()
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.y += delta * 0.15 })
  return (
    <group ref={ref}>
      <Sphere args={[2.5, 24, 24]}>
        <meshStandardMaterial color={BRAND.blue} wireframe transparent opacity={0.15} />
      </Sphere>
      <Sphere args={[2.6, 16, 16]}>
        <meshStandardMaterial color={BRAND.teal} wireframe transparent opacity={0.08} />
      </Sphere>
    </group>
  )
}

function Scene3D({ children, camera, style, className, orbitControls = false }) {
  return (
    <div className={className} style={style}>
      <Canvas
        camera={camera || { position: [0, 0, 8], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={0.6} />
          <pointLight position={[-5, -5, 5]} intensity={0.3} color={BRAND.blue} />
          {children}
          {orbitControls && <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />}
        </Suspense>
      </Canvas>
    </div>
  )
}

/* ═══════════════════════════════ ANIMATION VARIANTS ═══════════════════════════════ */

const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } } }
const fadeLeft = { hidden: { opacity: 0, x: -40 }, visible: { opacity: 1, x: 0, transition: { duration: 0.7 } } }
const fadeRight = { hidden: { opacity: 0, x: 40 }, visible: { opacity: 1, x: 0, transition: { duration: 0.7 } } }
const stagger = { visible: { transition: { staggerChildren: 0.15 } } }

function AnimSection({ children, className, id, style, variants = fadeUp }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.section
      ref={ref} id={id} className={className} style={style}
      initial="hidden" animate={inView ? 'visible' : 'hidden'} variants={stagger}
    >
      {children}
    </motion.section>
  )
}

/* ═══════════════════════════════ DIVIDERS ═══════════════════════════════ */

function WaveDivider({ flip = false, color = BRAND.blue }) {
  return (
    <div className={`w-full overflow-hidden leading-[0] ${flip ? 'rotate-180' : ''}`} style={{ height: '60px' }}>
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-full">
        <motion.path
          d="M0,30 C360,60 720,0 1080,30 C1260,45 1380,15 1440,30 L1440,60 L0,60 Z"
          fill={`${color}15`}
          animate={{
            d: [
              "M0,30 C360,60 720,0 1080,30 C1260,45 1380,15 1440,30 L1440,60 L0,60 Z",
              "M0,20 C360,0 720,50 1080,20 C1260,10 1380,40 1440,20 L1440,60 L0,60 Z",
              "M0,30 C360,60 720,0 1080,30 C1260,45 1380,15 1440,30 L1440,60 L0,60 Z",
            ]
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.path
          d="M0,40 C480,10 960,50 1440,40 L1440,60 L0,60 Z"
          fill={`${color}0a`}
          animate={{
            d: [
              "M0,40 C480,10 960,50 1440,40 L1440,60 L0,60 Z",
              "M0,35 C480,55 960,15 1440,35 L1440,60 L0,60 Z",
              "M0,40 C480,10 960,50 1440,40 L1440,60 L0,60 Z",
            ]
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
      </svg>
    </div>
  )
}

function GlowDivider() {
  return (
    <div className="w-full flex justify-center py-2">
      <motion.div
        className="h-px rounded-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${BRAND.blue}60, ${BRAND.teal}60, ${BRAND.purple}60, transparent)`,
          width: '80%',
        }}
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

/* Decorative edge orbs for filling blank sides */
function EdgeOrbs({ colors = [BRAND.blue, BRAND.teal], positions = ['top-left', 'bottom-right'] }) {
  const posMap = {
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    'mid-left': 'top-1/2 left-0 -translate-y-1/2',
    'mid-right': 'top-1/2 right-0 -translate-y-1/2',
  }
  return (
    <>
      {positions.map((pos, i) => (
        <div
          key={pos}
          className={`absolute ${posMap[pos]} w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20`}
          style={{ background: `radial-gradient(circle, ${colors[i % colors.length]}40, transparent 70%)` }}
        />
      ))}
    </>
  )
}

/* Vertical side accent lines */
function SideAccents({ color = BRAND.blue }) {
  return (
    <>
      <div className="absolute top-0 bottom-0 left-[5%] w-px pointer-events-none hidden lg:block"
        style={{ background: `linear-gradient(180deg, transparent, ${color}12, transparent)` }} />
      <div className="absolute top-0 bottom-0 right-[5%] w-px pointer-events-none hidden lg:block"
        style={{ background: `linear-gradient(180deg, transparent, ${color}12, transparent)` }} />
    </>
  )
}

/* ═══════════════════════════════ CSS KEYFRAMES ═══════════════════════════════ */

const injectStyles = () => {
  if (typeof document === 'undefined') return
  if (document.getElementById('publicsite-animations')) return
  const style = document.createElement('style')
  style.id = 'publicsite-animations'
  style.textContent = `
    @keyframes rotateGradient {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    @keyframes float-particle {
      0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0.3; }
      25% { transform: translateY(-15px) translateX(5px); opacity: 0.8; }
      50% { transform: translateY(-5px) translateX(-5px); opacity: 0.4; }
      75% { transform: translateY(-20px) translateX(8px); opacity: 0.7; }
    }
    @keyframes shine-sweep {
      0% { left: -100%; }
      50%, 100% { left: 100%; }
    }
    @keyframes pulse-ring {
      0% { transform: scale(1); opacity: 0.6; }
      50% { transform: scale(1.15); opacity: 0.2; }
      100% { transform: scale(1); opacity: 0.6; }
    }
    @keyframes badge-orbit {
      0% { transform: rotate(0deg) translateX(180px) rotate(0deg); }
      100% { transform: rotate(360deg) translateX(180px) rotate(-360deg); }
    }
    @keyframes badge-orbit-2 {
      0% { transform: rotate(90deg) translateX(210px) rotate(-90deg); }
      100% { transform: rotate(450deg) translateX(210px) rotate(-450deg); }
    }
    @keyframes badge-orbit-3 {
      0% { transform: rotate(180deg) translateX(240px) rotate(-180deg); }
      100% { transform: rotate(540deg) translateX(240px) rotate(-540deg); }
    }
    @keyframes badge-orbit-4 {
      0% { transform: rotate(270deg) translateX(195px) rotate(-270deg); }
      100% { transform: rotate(630deg) translateX(195px) rotate(-630deg); }
    }
    @keyframes glow-underline {
      0% { width: 0%; opacity: 0; }
      100% { width: 80%; opacity: 1; }
    }
    @keyframes sparkle {
      0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
      50% { opacity: 1; transform: scale(1) rotate(180deg); }
    }
    @keyframes ring-rotate {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes float-slow {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-20px); }
    }
    .animate-ring-rotate {
      animation: ring-rotate 4s linear infinite;
    }
    .animate-ring-rotate-reverse {
      animation: ring-rotate 6s linear infinite reverse;
    }
    .animate-float-slow {
      animation: float-slow 6s ease-in-out infinite;
    }
  `
  document.head.appendChild(style)
}

/* ═══════════════════════════════ STATS SECTION ═══════════════════════════════ */

function StatsSection({ stats }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const v0 = useCountUp(stats[0].value, 2000, inView)
  const v1 = useCountUp(stats[1].value, 2000, inView)
  const v2 = useCountUp(stats[2].value, 2000, inView)
  const v3 = useCountUp(stats[3].value, 2000, inView)
  const vals = [v0, v1, v2, v3]
  const finished = [v0 === stats[0].value, v1 === stats[1].value, v2 === stats[2].value, v3 === stats[3].value]
  const statColors = [BRAND.blue, BRAND.teal, BRAND.orange, BRAND.purple]
  const statIcons = [
    <BarChart3 className="w-6 h-6" />,
    <Globe className="w-6 h-6" />,
    <Shield className="w-6 h-6" />,
    <Clock className="w-6 h-6" />,
  ]

  return (
    <section
      ref={ref}
      className="py-20 w-full relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${BRAND[800]}90, ${BRAND[700]}60, ${BRAND[800]}90)`,
        borderTop: `1px solid ${BRAND.blue}15`,
        borderBottom: `1px solid ${BRAND.blue}15`,
      }}
    >
      <EdgeOrbs colors={[BRAND.blue, BRAND.purple]} positions={['mid-left', 'mid-right']} />
      <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-8">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            className="text-center relative group"
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.12, duration: 0.6 }}
          >
            {/* Icon with colored bg */}
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform group-hover:scale-110"
              style={{
                background: `linear-gradient(135deg, ${statColors[i]}25, ${statColors[i]}10)`,
                border: `1px solid ${statColors[i]}20`,
                boxShadow: `0 0 20px ${statColors[i]}15`,
              }}
            >
              <div style={{ color: statColors[i] }}>{statIcons[i]}</div>
            </div>
            <div className="text-3xl md:text-4xl lg:text-5xl font-black mb-1 relative inline-block">
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${statColors[i]}, ${statColors[(i + 1) % 4]})` }}>
                {s.prefix}{vals[i].toLocaleString()}{s.suffix}
              </span>
              <motion.div
                className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 rounded-full"
                style={{ background: `linear-gradient(90deg, transparent, ${statColors[i]}90, transparent)` }}
                initial={{ width: 0, opacity: 0 }}
                animate={finished[i] ? { width: '80%', opacity: 1 } : {}}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <div className="text-white/40 text-sm mt-3 font-medium tracking-wide">{s.label}</div>
            {finished[i] && (
              <div className="relative h-0">
                {[...Array(4)].map((_, pi) => (
                  <motion.div
                    key={pi}
                    className="absolute w-1 h-1 rounded-full left-1/2"
                    style={{ background: statColors[i] }}
                    initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                    animate={{ opacity: 0, x: (pi % 2 === 0 ? 1 : -1) * (10 + pi * 8), y: -(10 + pi * 5), scale: 0 }}
                    transition={{ duration: 0.8, delay: pi * 0.05 }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  )
}

/* ═══════════════════════════════ MAIN COMPONENT ═══════════════════════════════ */

export default function PublicSite() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showNav, setShowNav] = useState(false)
  const audioCtx = useRef(null)
  const oscillator = useRef(null)
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll()
  const bgY = useTransform(scrollYProgress, [0, 1], [0, -200])

  const navSections = useMemo(() => ['about', 'features', 'pricing', 'team', 'contact'], [])
  const activeSection = useActiveSection(navSections)

  useEffect(() => { injectStyles() }, [])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const handleScroll = () => setShowNav(window.scrollY > window.innerHeight * 0.7)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleMouse = useCallback((e) => {
    setMouse({ x: (e.clientX / window.innerWidth - 0.5) * 2, y: (e.clientY / window.innerHeight - 0.5) * 2 })
    setCursorPos({ x: e.clientX, y: e.clientY })
  }, [])

  const toggleMusic = useCallback(() => {
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || window.webkitAudioContext)()
      const osc = audioCtx.current.createOscillator()
      const gain = audioCtx.current.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(220, audioCtx.current.currentTime)
      gain.gain.setValueAtTime(0.03, audioCtx.current.currentTime)
      osc.connect(gain)
      gain.connect(audioCtx.current.destination)
      osc.start()
      oscillator.current = osc
      setMusicPlaying(true)
    } else if (musicPlaying) {
      audioCtx.current.suspend()
      setMusicPlaying(false)
    } else {
      audioCtx.current.resume()
      setMusicPlaying(true)
    }
  }, [musicPlaying])

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })

  const subtitleText = 'AdMotion - Intelligent Vehicle Advertising Platform. Reach millions on the move with dynamic, GPS-targeted outdoor ads.'
  const typedSubtitle = useTypewriter(subtitleText, 30, 1200, true)

  /* ─── Data ─── */
  const stats = [
    { label: 'Impressions', value: 50000, suffix: '+', prefix: '' },
    { label: 'Vehicles', value: 120, suffix: '+', prefix: '' },
    { label: 'Uptime', value: 98, suffix: '%', prefix: '' },
    { label: 'Monitoring', value: 24, suffix: '/7', prefix: '' },
  ]

  const steps = [
    { num: '01', title: 'Admin Creates Campaign', desc: 'Upload ads, set budget, define target areas and schedule. Our platform handles the rest.', icon: <MonitorSmartphone className="w-8 h-8" /> },
    { num: '02', title: 'Vehicles Display Ads', desc: 'Roof-mounted LED screens play ads dynamically with GPS tracking and smart scheduling.', icon: <Globe className="w-8 h-8" /> },
    { num: '03', title: 'Track & Earn', desc: 'Real-time analytics, driver earnings dashboard, and advertiser ROI - all in one platform.', icon: <BarChart3 className="w-8 h-8" /> },
  ]

  const features = [
    { title: 'Real-Time GPS Tracking', desc: 'Track every vehicle in your fleet with live location updates and route history.', icon: <MapPin className="w-7 h-7" />, color: BRAND.blue },
    { title: 'Smart Ad Scheduling', desc: 'AI-powered scheduling based on time, location, and audience demographics.', icon: <Calendar className="w-7 h-7" />, color: BRAND.orange },
    { title: 'Weather-Based Targeting', desc: 'Automatically switch ads based on weather conditions for maximum relevance.', icon: <Cloud className="w-7 h-7" />, color: BRAND.teal },
    { title: 'Driver Earnings Dashboard', desc: 'Transparent earnings tracking with instant withdrawal and payment history.', icon: <DollarSign className="w-7 h-7" />, color: '#f472b6' },
    { title: 'Offline Ad Playback', desc: 'Cached ads play seamlessly even without internet connectivity.', icon: <Wifi className="w-7 h-7" />, color: BRAND.purple },
    { title: 'Live Analytics', desc: 'Real-time impressions, engagement metrics, and campaign performance data.', icon: <BarChart3 className="w-7 h-7" />, color: '#34d399' },
  ]

  const pricing = [
    { name: 'Basic', price: 'Rs 15,000', period: '/mo', features: ['1 Vehicle', 'Basic Analytics', 'Email Support', 'Standard Scheduling', '5 Campaigns'], popular: false },
    { name: 'Professional', price: 'Rs 30,000', period: '/mo', features: ['5 Vehicles', 'Full Analytics', 'Priority Support', 'AI Scheduling', 'Unlimited Campaigns', 'Weather Targeting'], popular: true },
    { name: 'Enterprise', price: 'Custom', period: '', features: ['Unlimited Vehicles', 'API Access', 'Dedicated Support', 'Custom Integrations', 'White-Label Option', 'SLA Guarantee'], popular: false },
  ]

  const team = [
    { name: 'Muneeb Anwar', role: 'Full Stack Developer', initials: 'MA', gradient: `linear-gradient(135deg, ${BRAND.blue}, #22d3ee)`, colors: { primary: BRAND.blue, secondary: '#22d3ee' }, isSupervisor: false },
    { name: 'Muskan', role: 'UI/UX Designer & Developer', initials: 'MK', gradient: `linear-gradient(135deg, ${BRAND.purple}, #ec4899)`, colors: { primary: BRAND.purple, secondary: '#ec4899' }, isSupervisor: false },
    { name: 'Sir Zohaib Ahmed', role: 'Project Supervisor', initials: 'ZA', gradient: `linear-gradient(135deg, ${BRAND.orange}, #d97706)`, colors: { primary: BRAND.orange, secondary: '#d97706' }, isSupervisor: true },
  ]

  const testimonials = [
    { name: 'Ahmed Khan', role: 'Fleet Owner, Lahore', text: 'AdMotion transformed my taxi fleet into a revenue generating machine. The earnings from ads cover most of my fuel costs!', stars: 5 },
    { name: 'Sara Malik', role: 'Marketing Director', text: 'The targeting capabilities are incredible. We saw a 3x increase in brand awareness within the first month.', stars: 5 },
    { name: 'Usman Ali', role: 'Ride-share Driver', text: 'Easy to use, no effort needed. The screen runs ads automatically and I earn extra money every day.', stars: 4 },
  ]

  const heroBadges = [
    { label: 'GPS Tracking', orbit: 'badge-orbit' },
    { label: 'AI Scheduling', orbit: 'badge-orbit-2' },
    { label: 'Real-Time', orbit: 'badge-orbit-3' },
    { label: 'PWA Ready', orbit: 'badge-orbit-4' },
  ]

  /* ═══════════════════════════════ RENDER ═══════════════════════════════ */

  return (
    <div ref={containerRef} className="bg-brand-900 text-white overflow-x-hidden" style={{ scrollBehavior: 'smooth', background: BRAND[900] }} onMouseMove={handleMouse}>

      {/* ──── Custom Cursor Trail (desktop) ──── */}
      {!isMobile && (
        <motion.div
          className="fixed w-72 h-72 rounded-full pointer-events-none z-[9999] mix-blend-screen"
          style={{
            background: `radial-gradient(circle, rgba(59,130,246,0.12) 0%, rgba(20,184,166,0.06) 40%, transparent 70%)`,
          }}
          animate={{ x: cursorPos.x - 144, y: cursorPos.y - 144 }}
          transition={{ type: 'spring', stiffness: 150, damping: 15 }}
        />
      )}

      {/* ──── Floating Navbar ──── */}
      <AnimatePresence>
        {showNav && (
          <motion.nav
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 25 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-6xl"
          >
            <div
              className="flex items-center justify-between px-8 py-3 rounded-2xl border border-white/10"
              style={{
                background: 'rgba(11,20,82,0.7)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 1px 0 ${BRAND.blue}20 inset`,
              }}
            >
              <button onClick={() => scrollTo('hero')} className="text-xl font-black shrink-0">
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.teal})` }}>Ad</span>
                <span className="text-white">Motion</span>
              </button>

              <div className="hidden md:flex items-center gap-1">
                {navSections.map(sec => (
                  <button
                    key={sec}
                    onClick={() => scrollTo(sec)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                      activeSection === sec ? 'text-white' : 'text-white/50 hover:text-white/80'
                    }`}
                    style={activeSection === sec ? {
                      background: `${BRAND.blue}25`,
                      boxShadow: `0 0 15px ${BRAND.blue}20`,
                    } : undefined}
                  >
                    {sec.charAt(0).toUpperCase() + sec.slice(1)}
                  </button>
                ))}
              </div>

              <Link
                to="/login"
                className="px-6 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 hover:shadow-lg shrink-0"
                style={{ background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.teal})`, boxShadow: `0 2px 15px ${BRAND.blue}30` }}
              >
                Get Started
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* ──── Music Toggle ──── */}
      <button
        onClick={toggleMusic}
        className="fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-all hover:scale-110"
        style={{ background: 'rgba(11,20,82,0.7)' }}
        aria-label="Toggle music"
      >
        {musicPlaying ? <Music className="w-5 h-5" style={{ color: BRAND.teal }} /> : <Music2 className="w-5 h-5 text-white/50" />}
      </button>

      {/* ━━━━━━━━━━━━━━━━━━━━ 1. HERO ━━━━━━━━━━━━━━━━━━━━ */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden w-full">
        {/* Multi-layer gradient background */}
        <motion.div className="absolute inset-0" style={{ y: bgY }}>
          <div className="absolute inset-0" style={{
            background: `
              radial-gradient(ellipse 80% 50% at 20% 20%, ${BRAND.blue}25 0%, transparent 50%),
              radial-gradient(ellipse 60% 40% at 80% 30%, ${BRAND.purple}18 0%, transparent 50%),
              radial-gradient(ellipse 70% 50% at 70% 80%, ${BRAND.teal}1a 0%, transparent 50%),
              radial-gradient(ellipse 50% 40% at 10% 70%, ${BRAND.orange}12 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, ${BRAND[900]} 0%, #050a28 100%)`
          }} />
        </motion.div>

        {/* Edge decorations */}
        <div className="absolute top-20 left-0 w-96 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: `${BRAND.blue}10` }} />
        <div className="absolute bottom-20 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ background: `${BRAND.purple}10` }} />
        <div className="absolute top-1/2 left-0 w-48 h-96 rounded-full blur-3xl pointer-events-none" style={{ background: `${BRAND.teal}08` }} />
        <div className="absolute top-1/3 right-0 w-64 h-80 rounded-full blur-3xl pointer-events-none" style={{ background: `${BRAND.orange}08` }} />

        {/* 3D scene */}
        {!isMobile && (
          <Scene3D className="absolute inset-0 z-0" style={{ pointerEvents: 'none' }}>
            <HeroShapes mouse={mouse} />
            <Particles />
          </Scene3D>
        )}

        {/* Mobile gradient fallback */}
        {isMobile && (
          <div className="absolute inset-0 z-0">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl animate-float-slow" style={{ background: `${BRAND.blue}30` }} />
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full blur-3xl animate-float-slow" style={{ background: `${BRAND.teal}25`, animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-0 w-40 h-40 rounded-full blur-3xl animate-float-slow" style={{ background: `${BRAND.purple}20`, animationDelay: '2s' }} />
          </div>
        )}

        {/* Orbital badge pills (desktop) */}
        {!isMobile && (
          <div className="absolute inset-0 z-[5] pointer-events-none flex items-center justify-center">
            {heroBadges.map((b, i) => (
              <div key={b.label} className="absolute" style={{ animation: `${b.orbit} ${20 + i * 3}s linear infinite` }}>
                <span
                  className="px-4 py-1.5 rounded-full text-xs font-semibold border border-white/10 whitespace-nowrap"
                  style={{
                    background: `${BRAND.blue}20`,
                    backdropFilter: 'blur(10px)',
                    color: 'rgba(255,255,255,0.75)',
                    boxShadow: `0 0 20px ${BRAND.blue}15, inset 0 0 10px ${BRAND.blue}08`,
                  }}
                >
                  {b.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Hero content */}
        <div className="relative z-10 text-center px-4 sm:px-8 lg:px-8 max-w-6xl mx-auto w-full">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <span className="inline-block px-5 py-2 rounded-full text-sm font-semibold mb-8 border border-white/10 backdrop-blur-sm" style={{ background: `linear-gradient(135deg, ${BRAND.blue}20, ${BRAND.purple}15)`, boxShadow: `0 0 20px ${BRAND.blue}10` }}>
              Next-Gen Vehicle Advertising
            </span>
          </motion.div>

          <motion.h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-7xl font-bold leading-tight mb-8"
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
          >
            Transform Vehicles Into{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.teal}, ${BRAND.orange})` }}>
              Smart Digital Billboards
            </span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl lg:text-2xl text-white/55 mb-12 max-w-3xl mx-auto min-h-[3.5rem]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.6 }}
          >
            {typedSubtitle}
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
              className="inline-block w-0.5 h-5 bg-white/60 ml-1 align-middle"
            />
          </motion.p>

          <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }}>
            <Link to="/login"
              className="px-10 py-4 rounded-xl font-bold text-white text-lg transition-all hover:scale-105 hover:shadow-2xl"
              style={{ background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.teal})`, boxShadow: `0 4px 25px ${BRAND.blue}40` }}
            >
              Get Started <ArrowRight className="inline w-5 h-5 ml-2" />
            </Link>
            <button onClick={() => scrollTo('how-it-works')}
              className="px-10 py-4 rounded-xl font-bold border-2 border-white/15 text-white/80 hover:bg-white/5 transition-all hover:scale-105 backdrop-blur-sm hover:border-white/25"
            >
              <Play className="inline w-5 h-5 mr-2" /> Watch Demo
            </button>
          </motion.div>
        </div>

        <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10" animate={{ y: [0, 12, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
          <ChevronDown className="w-7 h-7 text-white/30" />
        </motion.div>
      </section>

      <WaveDivider color={BRAND.blue} />

      {/* ━━━━━━━━━━━━━━━━━━━━ 2. STATS ━━━━━━━━━━━━━━━━━━━━ */}
      <StatsSection stats={stats} />

      <GlowDivider />

      {/* ━━━━━━━━━━━━━━━━━━━━ 3. ABOUT ━━━━━━━━━━━━━━━━━━━━ */}
      <AnimSection id="about" className="py-24 px-4 sm:px-8 lg:px-8 relative overflow-hidden w-full"
        style={{
          background: `
            radial-gradient(ellipse 50% 50% at 0% 50%, ${BRAND.blue}10 0%, transparent 70%),
            radial-gradient(ellipse 50% 50% at 100% 50%, ${BRAND.teal}08 0%, transparent 70%)`
        }}
      >
        <EdgeOrbs colors={[BRAND.blue, BRAND.teal]} positions={['top-left', 'bottom-right']} />
        <SideAccents color={BRAND.blue} />
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div variants={fadeLeft}>
            {/* Gradient accent line */}
            <div className="flex items-start gap-4">
              <div className="w-1 h-32 rounded-full flex-shrink-0 hidden md:block"
                style={{ background: `linear-gradient(180deg, ${BRAND.blue}, ${BRAND.teal}, transparent)` }} />
              <div>
                <span className="text-sm font-bold tracking-widest uppercase" style={{ color: BRAND.teal }}>About AdMotion</span>
                <h2 className="text-4xl md:text-5xl font-bold mt-3 mb-6">
                  What is <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.teal})` }}>AdMotion</span>?
                </h2>
                <p className="text-white/60 text-lg leading-relaxed mb-6">
                  AdMotion transforms urban vehicles into intelligent advertising displays using roof-mounted LED panels.
                  Our platform connects advertisers with vehicle owners, creating a new channel for dynamic, location-based outdoor advertising.
                </p>
                <p className="text-white/45 leading-relaxed mb-8">
                  With real-time GPS tracking, AI-powered ad scheduling, and comprehensive analytics, AdMotion delivers
                  measurable results for advertisers while providing passive income for drivers. The platform handles everything
                  from campaign creation to performance reporting.
                </p>
              </div>
            </div>
            {/* Mini stats row */}
            <div className="flex gap-8 ml-0 md:ml-5">
              {[{ n: '50K+', l: 'Daily Views', c: BRAND.blue }, { n: '99.9%', l: 'Reliability', c: BRAND.teal }, { n: '150+', l: 'Cities', c: BRAND.orange }].map(s => (
                <div key={s.l} className="text-center">
                  <div className="text-2xl font-black bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${s.c}, ${BRAND.teal})` }}>{s.n}</div>
                  <div className="text-white/35 text-sm mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div variants={fadeRight} className="flex justify-center">
            {!isMobile ? (
              <Scene3D className="w-full h-[450px]" orbitControls>
                <FloatingScreen />
              </Scene3D>
            ) : (
              <div className="w-72 h-[400px] rounded-2xl border border-white/10 relative overflow-hidden" style={{ background: `linear-gradient(180deg, ${BRAND[800]}, ${BRAND[900]})` }}>
                <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 30%, ${BRAND.blue}15, transparent 60%)` }} />
                <div className="w-full h-full flex items-center justify-center">
                  <MonitorSmartphone className="w-24 h-24" style={{ color: `${BRAND.blue}50` }} />
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </AnimSection>

      <WaveDivider color={BRAND.teal} flip />

      {/* ━━━━━━━━━━━━━━━━━━━━ 4. HOW IT WORKS ━━━━━━━━━━━━━━━━━━━━ */}
      <AnimSection
        id="how-it-works"
        className="py-24 px-4 sm:px-8 lg:px-8 relative overflow-hidden w-full"
        style={{
          background: `
            linear-gradient(180deg, ${BRAND[800]}50, ${BRAND[700]}30, ${BRAND[800]}50),
            radial-gradient(ellipse at 0% 50%, ${BRAND.orange}08, transparent 50%),
            radial-gradient(ellipse at 100% 50%, ${BRAND.teal}08, transparent 50%)`
        }}
      >
        <EdgeOrbs colors={[BRAND.orange, BRAND.teal]} positions={['mid-left', 'mid-right']} />
        <SideAccents color={BRAND.orange} />
        <div className="max-w-6xl mx-auto text-center mb-16">
          <motion.span variants={fadeUp} className="text-sm font-bold tracking-widest uppercase" style={{ color: BRAND.orange }}>Process</motion.span>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold mt-3">
            How It <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.blue})` }}>Works</span>
          </motion.h2>
        </div>
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10">
          {steps.map((s, i) => (
            <motion.div key={i} variants={fadeUp} className="relative group">
              <div
                className="rounded-2xl p-10 border border-white/5 backdrop-blur-sm transition-all duration-500 hover:-translate-y-3 hover:border-white/15 relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${BRAND[800]}90, ${BRAND[900]})` }}
              >
                {/* Top gradient border accent */}
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-3xl"
                  style={{ background: `linear-gradient(90deg, ${[BRAND.blue, BRAND.teal, BRAND.orange][i]}, ${[BRAND.teal, BRAND.orange, BRAND.purple][i]})` }} />
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                  style={{
                    background: `linear-gradient(135deg, ${[BRAND.blue, BRAND.teal, BRAND.orange][i]}30, ${[BRAND.blue, BRAND.teal, BRAND.orange][i]}10)`,
                    boxShadow: `0 0 25px ${[BRAND.blue, BRAND.teal, BRAND.orange][i]}15`,
                  }}
                >
                  <div style={{ color: [BRAND.blue, BRAND.teal, BRAND.orange][i] }}>{s.icon}</div>
                </div>
                <div className="text-7xl font-black absolute top-6 right-8" style={{ color: `${[BRAND.blue, BRAND.teal, BRAND.orange][i]}08` }}>{s.num}</div>
                <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                <p className="text-white/50 leading-relaxed">{s.desc}</p>
              </div>
              {/* Arrow connector */}
              {i < 2 && (
                <div className="hidden md:block absolute top-1/2 -right-6 z-10">
                  <ArrowRight className="w-8 h-8" style={{ color: `${[BRAND.blue, BRAND.teal][i]}30` }} />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </AnimSection>

      <GlowDivider />

      {/* ━━━━━━━━━━━━━━━━━━━━ 5. FEATURES ━━━━━━━━━━━━━━━━━━━━ */}
      <AnimSection id="features" className="py-24 px-4 sm:px-8 lg:px-8 relative overflow-hidden w-full"
        style={{
          background: `
            radial-gradient(ellipse at 10% 30%, ${BRAND.blue}0c, transparent 50%),
            radial-gradient(ellipse at 90% 70%, ${BRAND.purple}0c, transparent 50%)`
        }}
      >
        <EdgeOrbs colors={[BRAND.purple, BRAND.blue]} positions={['top-right', 'bottom-left']} />
        <SideAccents color={BRAND.purple} />
        <div className="max-w-6xl mx-auto text-center mb-16">
          <motion.span variants={fadeUp} className="text-sm font-bold tracking-widest uppercase" style={{ color: BRAND.blue }}>Features</motion.span>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold mt-3">
            Everything You <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.purple})` }}>Need</span>
          </motion.h2>
        </div>
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {features.map((f, i) => (
            <motion.div
              key={i} variants={fadeUp}
              whileHover={{ rotateX: -4, rotateY: 4, scale: 1.04 }}
              style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
              className="group"
            >
              <div
                className="rounded-2xl p-8 border border-white/5 backdrop-blur-md h-full transition-all duration-500 hover:border-white/15 relative overflow-hidden"
                style={{ background: `linear-gradient(135deg, rgba(28,35,115,0.6), rgba(11,20,82,0.9))` }}
              >
                {/* Thin gradient top border */}
                <div className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ background: `linear-gradient(90deg, transparent, ${f.color}60, transparent)` }} />
                {/* Glow on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(circle at 30% 30%, ${f.color}08, transparent 60%)` }} />
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: `linear-gradient(135deg, ${f.color}22, ${f.color}08)`,
                    boxShadow: `0 0 20px ${f.color}15`,
                    border: `1px solid ${f.color}15`,
                  }}
                >
                  <div style={{ color: f.color, filter: `drop-shadow(0 0 6px ${f.color}40)` }}>{f.icon}</div>
                </div>
                <h3 className="text-lg font-bold mb-3">{f.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimSection>

      <WaveDivider color={BRAND.purple} />

      {/* ━━━━━━━━━━━━━━━━━━━━ 6. 3D VEHICLE SHOWCASE ━━━━━━━━━━━━━━━━━━━━ */}
      <section
        id="showcase"
        className="py-24 relative overflow-hidden w-full"
        style={{
          background: `
            linear-gradient(180deg, ${BRAND[800]}40, ${BRAND[700]}20, ${BRAND[800]}40),
            radial-gradient(ellipse at 30% 50%, ${BRAND.teal}0a, transparent 50%),
            radial-gradient(ellipse at 70% 50%, ${BRAND.blue}0a, transparent 50%)`
        }}
      >
        <EdgeOrbs colors={[BRAND.teal, BRAND.blue]} positions={['top-left', 'bottom-right']} />
        <SideAccents color={BRAND.teal} />
        <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-8 text-center mb-10">
          <span className="text-sm font-bold tracking-widest uppercase" style={{ color: BRAND.teal }}>Technology</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-3">
            Smart Vehicle <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${BRAND.teal}, ${BRAND.blue})` }}>Setup</span>
          </h2>
          <p className="text-white/50 mt-5 max-w-2xl mx-auto text-lg">Every AdMotion vehicle is equipped with cutting-edge technology for seamless ad delivery.</p>
        </div>
        {!isMobile ? (
          <div className="max-w-6xl mx-auto px-4 sm:px-8 lg:px-8">
            <Scene3D className="w-full h-[500px]" camera={{ position: [0, 1.5, 6], fov: 50 }} orbitControls>
              <VehicleWireframe />
            </Scene3D>
          </div>
        ) : (
          <div className="max-w-md mx-auto px-4 sm:px-8">
            <div className="rounded-2xl border border-white/10 p-8 text-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${BRAND[800]}80, ${BRAND[900]})` }}>
              <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 50%, ${BRAND.teal}08, transparent 60%)` }} />
              <div className="grid grid-cols-2 gap-4 relative z-10">
                {[
                  { l: 'GPS Tracking', c: BRAND.teal },
                  { l: 'LED Screen', c: BRAND.orange },
                  { l: '4G Connection', c: BRAND.blue },
                  { l: 'AI Scheduling', c: BRAND.purple },
                ].map(item => (
                  <div key={item.l} className="p-5 rounded-xl border border-white/5" style={{ background: `${item.c}10` }}>
                    <Zap className="w-6 h-6 mx-auto mb-2" style={{ color: item.c }} />
                    <span className="text-sm text-white/60">{item.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      <GlowDivider />

      {/* ━━━━━━━━━━━━━━━━━━━━ 7. PRICING ━━━━━━━━━━━━━━━━━━━━ */}
      <AnimSection
        id="pricing"
        className="py-24 px-4 sm:px-8 lg:px-8 relative overflow-hidden w-full"
        style={{
          background: `
            linear-gradient(180deg, transparent, ${BRAND[800]}40, transparent),
            radial-gradient(ellipse at 0% 50%, ${BRAND.orange}08, transparent 50%),
            radial-gradient(ellipse at 100% 50%, ${BRAND.blue}08, transparent 50%)`
        }}
      >
        <EdgeOrbs colors={[BRAND.orange, BRAND.blue]} positions={['mid-left', 'mid-right']} />
        <SideAccents color={BRAND.orange} />
        <div className="max-w-6xl mx-auto text-center mb-16">
          <motion.span variants={fadeUp} className="text-sm font-bold tracking-widest uppercase" style={{ color: BRAND.orange }}>Pricing</motion.span>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold mt-3">
            Simple, Transparent <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.blue})` }}>Pricing</span>
          </motion.h2>
        </div>
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 lg:gap-10 items-stretch">
          {pricing.map((p, i) => (
            <motion.div
              key={i} variants={fadeUp}
              whileHover={{ y: -10, rotateY: 2 }}
              style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
              className="relative"
            >
              {p.popular && (
                <>
                  {/* Sparkles */}
                  {[...Array(8)].map((_, si) => (
                    <motion.div
                      key={si}
                      className="absolute w-1 h-1 rounded-full pointer-events-none z-20"
                      style={{
                        background: BRAND.orange,
                        top: `${10 + Math.random() * 80}%`,
                        left: `${Math.random() * 100}%`,
                        boxShadow: `0 0 6px ${BRAND.orange}`,
                        animation: `sparkle ${2 + si * 0.4}s ease-in-out ${si * 0.25}s infinite`,
                      }}
                    />
                  ))}
                  {/* POPULAR badge */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-full text-xs font-black z-10 tracking-wider"
                    style={{ background: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.blue})`, boxShadow: `0 4px 15px ${BRAND.orange}30` }}>
                    POPULAR
                  </div>
                </>
              )}
              <div
                className={`rounded-2xl p-9 border h-full transition-all duration-500 relative overflow-hidden ${p.popular ? 'border-white/15' : 'border-white/5 hover:border-white/10'}`}
                style={{
                  background: p.popular
                    ? `linear-gradient(135deg, ${BRAND[800]}, ${BRAND[700]})`
                    : `linear-gradient(135deg, ${BRAND[800]}70, ${BRAND[900]}90)`,
                }}
              >
                {/* Shine sweep */}
                {p.popular && (
                  <div className="absolute top-0 h-full w-1/3 pointer-events-none"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)', animation: 'shine-sweep 3s ease-in-out infinite' }} />
                )}
                {/* Gradient border glow */}
                {p.popular && (
                  <div className="absolute inset-0 rounded-2xl pointer-events-none"
                    style={{ boxShadow: `0 0 40px ${BRAND.blue}20, inset 0 0 40px ${BRAND.blue}08` }} />
                )}
                <h3 className="text-2xl font-bold mb-2">{p.name}</h3>
                <div className="mb-8">
                  <span className="text-4xl font-black">{p.price}</span>
                  <span className="text-white/40 text-lg">{p.period}</span>
                </div>
                <ul className="space-y-4 mb-10">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-3 text-white/60 text-sm">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: `${BRAND.teal}20` }}>
                        <Check className="w-3 h-3" style={{ color: BRAND.teal }} />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/login"
                  className={`block text-center py-3.5 rounded-xl font-bold transition-all hover:scale-105 ${
                    p.popular ? 'text-white hover:shadow-lg' : 'border border-white/10 text-white/70 hover:bg-white/5'
                  }`}
                  style={p.popular ? { background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.teal})`, boxShadow: `0 4px 20px ${BRAND.blue}30` } : undefined}
                >
                  {p.price === 'Custom' ? 'Contact Sales' : 'Get Started'}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimSection>

      <WaveDivider color={BRAND.teal} flip />

      {/* ━━━━━━━━━━━━━━━━━━━━ 8. TEAM ━━━━━━━━━━━━━━━━━━━━ */}
      <AnimSection id="team" className="py-24 px-4 sm:px-8 lg:px-8 relative overflow-hidden w-full"
        style={{
          background: `
            radial-gradient(ellipse at 20% 30%, ${BRAND.purple}08, transparent 50%),
            radial-gradient(ellipse at 80% 70%, ${BRAND.orange}08, transparent 50%)`
        }}
      >
        <EdgeOrbs colors={[BRAND.purple, BRAND.orange]} positions={['top-left', 'bottom-right']} />
        <SideAccents color={BRAND.purple} />
        <div className="max-w-6xl mx-auto text-center mb-16">
          <motion.span variants={fadeUp} className="text-sm font-bold tracking-widest uppercase" style={{ color: BRAND.teal }}>Team</motion.span>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold mt-3">
            Meet The <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${BRAND.teal}, ${BRAND.purple})` }}>Team</span>
          </motion.h2>
        </div>
        <div className="max-w-6xl mx-auto grid sm:grid-cols-3 gap-8 lg:gap-10 items-end">
          {team.map((t, i) => (
            <motion.div
              key={i} variants={fadeUp}
              whileHover={{ y: -20, rotateX: -4, rotateY: 4, scale: 1.04 }}
              style={{ transformStyle: 'preserve-3d', perspective: '800px' }}
              className={`text-center relative group ${t.isSupervisor ? 'sm:-mt-6' : ''}`}
            >
              {/* Animated gradient border wrapper */}
              <div className="relative rounded-2xl p-[2px] overflow-hidden">
                {/* Rotating conic gradient border */}
                <div
                  className="absolute inset-[-50%] pointer-events-none"
                  style={{
                    background: `conic-gradient(from 0deg, ${t.colors.primary}, ${t.colors.secondary}, transparent, ${t.colors.primary})`,
                    animation: 'rotateGradient 4s linear infinite',
                  }}
                />

                {/* Card inner */}
                <div
                  className={`relative rounded-2xl backdrop-blur-xl transition-all duration-500 overflow-hidden ${t.isSupervisor ? 'p-12' : 'p-10'}`}
                  style={{
                    background: `linear-gradient(135deg, rgba(17,27,104,0.9), rgba(11,20,82,0.97))`,
                    boxShadow: `0 8px 32px rgba(0,0,0,0.3)`,
                  }}
                >
                  {/* Floating particles inside card */}
                  {[...Array(6)].map((_, pi) => (
                    <div
                      key={pi}
                      className="absolute rounded-full pointer-events-none"
                      style={{
                        width: `${3 + pi * 2}px`,
                        height: `${3 + pi * 2}px`,
                        background: `${t.colors.primary}40`,
                        top: `${15 + pi * 13}%`,
                        left: `${8 + pi * 16}%`,
                        animation: `float-particle ${3 + pi}s ease-in-out ${pi * 0.5}s infinite`,
                      }}
                    />
                  ))}

                  {/* Shimmer overlay */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `linear-gradient(135deg, transparent 30%, ${t.colors.primary}08 50%, transparent 70%)` }}
                  />

                  {/* Crown for supervisor */}
                  {t.isSupervisor && (
                    <motion.div
                      className="flex justify-center mb-4"
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Crown className="w-9 h-9" style={{ color: BRAND.orange, filter: `drop-shadow(0 0 10px ${BRAND.orange}60)` }} />
                    </motion.div>
                  )}

                  {/* Avatar with animated rings */}
                  <div className="relative mx-auto mb-6" style={{ width: t.isSupervisor ? '104px' : '88px', height: t.isSupervisor ? '104px' : '88px' }}>
                    <div className="absolute inset-[-6px] rounded-full animate-ring-rotate"
                      style={{ border: `2px dashed ${t.colors.primary}50` }} />
                    <div className="absolute inset-[-3px] rounded-full animate-ring-rotate-reverse"
                      style={{ border: `1px solid ${t.colors.secondary}30` }} />
                    <div
                      className="w-full h-full rounded-full flex items-center justify-center font-bold text-white shadow-lg relative z-10"
                      style={{
                        background: t.gradient,
                        boxShadow: `0 0 30px ${t.colors.primary}40`,
                        fontSize: t.isSupervisor ? '1.875rem' : '1.5rem',
                      }}
                    >
                      {t.initials}
                    </div>
                  </div>

                  {/* Name with gradient */}
                  <h3
                    className={`font-bold bg-clip-text text-transparent ${t.isSupervisor ? 'text-2xl' : 'text-xl'}`}
                    style={{ backgroundImage: `linear-gradient(135deg, #ffffff, ${t.colors.secondary})` }}
                  >
                    {t.name}
                  </h3>

                  {/* Role badge */}
                  <div className="mt-3 inline-block">
                    <span
                      className={`inline-block px-4 py-1.5 rounded-full font-semibold ${t.isSupervisor ? 'text-sm' : 'text-xs'}`}
                      style={{
                        background: t.isSupervisor
                          ? `linear-gradient(135deg, ${BRAND.orange}30, ${BRAND.orange}15)`
                          : `${t.colors.primary}20`,
                        color: t.isSupervisor ? BRAND.orange : t.colors.primary,
                        border: `1px solid ${t.isSupervisor ? BRAND.orange : t.colors.primary}30`,
                        boxShadow: t.isSupervisor ? `0 0 15px ${BRAND.orange}20` : 'none',
                      }}
                    >
                      {t.role}
                    </span>
                  </div>

                  {/* Special glow for supervisor */}
                  {t.isSupervisor && (
                    <div className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{ boxShadow: `inset 0 0 50px ${BRAND.orange}08, 0 0 50px ${BRAND.orange}10` }} />
                  )}
                </div>
              </div>

              {/* Hover glow shadow */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -z-10"
                style={{ boxShadow: `0 25px 70px ${t.colors.primary}25` }}
              />
            </motion.div>
          ))}
        </div>
      </AnimSection>

      <GlowDivider />

      {/* ━━━━━━━━━━━━━━━━━━━━ 9. TESTIMONIALS ━━━━━━━━━━━━━━━━━━━━ */}
      <AnimSection
        id="testimonials"
        className="py-24 px-4 sm:px-8 lg:px-8 relative overflow-hidden w-full"
        style={{
          background: `
            linear-gradient(180deg, transparent, ${BRAND[800]}40, transparent),
            radial-gradient(ellipse at 10% 50%, ${BRAND.blue}0a, transparent 50%),
            radial-gradient(ellipse at 90% 50%, ${BRAND.purple}0a, transparent 50%)`
        }}
      >
        <EdgeOrbs colors={[BRAND.blue, BRAND.purple]} positions={['top-left', 'bottom-right']} />
        <SideAccents color={BRAND.blue} />
        <div className="max-w-6xl mx-auto text-center mb-16">
          <motion.span variants={fadeUp} className="text-sm font-bold tracking-widest uppercase" style={{ color: BRAND.blue }}>Testimonials</motion.span>
          <motion.h2 variants={fadeUp} className="text-4xl md:text-5xl font-bold mt-3">
            Trusted by Fleet Owners <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.teal})` }}>Across Pakistan</span>
          </motion.h2>
        </div>
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 lg:gap-10">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              whileHover={{ y: -8, scale: 1.02 }}
              className="rounded-2xl p-9 border border-white/5 backdrop-blur-sm relative overflow-hidden group transition-all duration-500"
              style={{ background: `linear-gradient(135deg, ${BRAND[800]}60, ${BRAND[900]}80)` }}
            >
              {/* Large decorative quotation marks */}
              <div className="absolute -top-4 -left-2 text-9xl font-serif leading-none pointer-events-none select-none"
                style={{ color: `${[BRAND.blue, BRAND.teal, BRAND.purple][i]}12` }}>
                {'\u201C'}
              </div>
              <div className="absolute -bottom-8 -right-2 text-9xl font-serif leading-none pointer-events-none select-none"
                style={{ color: `${[BRAND.blue, BRAND.teal, BRAND.purple][i]}08` }}>
                {'\u201D'}
              </div>

              {/* Animated star ratings */}
              <div className="flex gap-1.5 mb-5 relative z-10">
                {Array.from({ length: 5 }).map((_, j) => (
                  <motion.div
                    key={j}
                    initial={{ opacity: 0, scale: 0, rotate: -180 }}
                    whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 + j * 0.1, duration: 0.4, type: 'spring' }}
                  >
                    <Star className={`w-5 h-5 ${j < t.stars ? '' : 'text-white/10'}`}
                      style={j < t.stars ? { color: BRAND.orange, fill: BRAND.orange } : undefined} />
                  </motion.div>
                ))}
              </div>

              <p className="text-white/55 leading-relaxed mb-6 relative z-10 text-base">&ldquo;{t.text}&rdquo;</p>
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: `linear-gradient(135deg, ${[BRAND.blue, BRAND.teal, BRAND.purple][i]}, ${[BRAND.teal, BRAND.orange, BRAND.blue][i]})` }}>
                  {t.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-white/30 text-xs">{t.role}</div>
                </div>
              </div>

              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl"
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${[BRAND.blue, BRAND.teal, BRAND.purple][i]}0a, transparent 70%)`,
                  boxShadow: `0 0 40px ${[BRAND.blue, BRAND.teal, BRAND.purple][i]}10`,
                }} />
            </motion.div>
          ))}
        </div>
      </AnimSection>

      <WaveDivider color={BRAND.blue} flip />

      {/* ━━━━━━━━━━━━━━━━━━━━ 10. CTA / CONTACT ━━━━━━━━━━━━━━━━━━━━ */}
      <section id="contact" className="py-24 px-4 sm:px-8 lg:px-8 relative overflow-hidden w-full">
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 50%, ${BRAND.blue}18, transparent 70%),
            radial-gradient(ellipse at 20% 80%, ${BRAND.teal}10, transparent 60%),
            radial-gradient(ellipse at 80% 20%, ${BRAND.purple}0c, transparent 60%)`
        }} />
        <EdgeOrbs colors={[BRAND.blue, BRAND.teal]} positions={['mid-left', 'mid-right']} />

        {!isMobile && (
          <Scene3D className="absolute inset-0 z-0 opacity-40" style={{ pointerEvents: 'none' }} camera={{ position: [0, 0, 6], fov: 50 }}>
            <WireframeGlobe />
            <Particles count={60} />
          </Scene3D>
        )}

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.h2
            className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8"
            initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          >
            Ready to Transform{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.teal})` }}>Your Fleet?</span>
          </motion.h2>
          <motion.p
            className="text-white/50 text-lg md:text-xl mb-5 max-w-2xl mx-auto"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
          >
            Join thousands of fleet owners and advertisers already using AdMotion.
          </motion.p>
          <motion.div
            className="flex items-center justify-center gap-2 text-white/40 mb-12"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}
          >
            <Mail className="w-4 h-4" /> admotion@project.com
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }}
            className="relative inline-block"
          >
            <motion.div
              className="absolute inset-0 rounded-xl"
              style={{ background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.teal})`, filter: 'blur(25px)' }}
              animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <Link to="/login"
              className="relative inline-block px-12 py-5 rounded-xl font-black text-white text-lg transition-all hover:scale-105 hover:shadow-2xl"
              style={{ background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.teal})`, boxShadow: `0 4px 30px ${BRAND.blue}40` }}
            >
              Get Started Free <ArrowRight className="inline w-5 h-5 ml-2" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━ 11. FOOTER ━━━━━━━━━━━━━━━━━━━━ */}
      <footer className="relative border-t border-white/5 py-14 px-4 sm:px-8 lg:px-8 w-full" style={{ background: BRAND[900] }}>
        {/* Animated gradient top line */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${BRAND.blue}, ${BRAND.teal}, ${BRAND.purple}, ${BRAND.orange}, transparent)`,
            backgroundSize: '200% 100%',
          }}
          animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />

        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-10 mb-12">
            <div>
              <div className="text-2xl font-black mb-4">
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.teal})` }}>Ad</span>
                <span className="text-white">Motion</span>
              </div>
              <p className="text-white/30 text-sm leading-relaxed mb-5">
                Intelligent Vehicle Advertising Platform. Transform urban mobility into advertising opportunities.
              </p>
              <div className="flex gap-3">
                {[
                  { icon: <Github className="w-4 h-4" />, label: 'GitHub', c: BRAND.blue },
                  { icon: <Linkedin className="w-4 h-4" />, label: 'LinkedIn', c: BRAND.teal },
                  { icon: <Twitter className="w-4 h-4" />, label: 'Twitter', c: BRAND.purple },
                ].map(social => (
                  <button
                    key={social.label}
                    aria-label={social.label}
                    className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 text-white/40 hover:text-white/80 hover:border-white/20 transition-all hover:scale-110"
                    style={{ background: `${BRAND[800]}60` }}
                  >
                    {social.icon}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-5 text-white/60">Quick Links</h4>
              <ul className="space-y-3 text-sm text-white/30">
                <li><Link to="/login" className="hover:text-white/60 transition-colors">Admin Panel</Link></li>
                <li><Link to="/driver/login" className="hover:text-white/60 transition-colors">Driver App</Link></li>
                <li><Link to="/display/setup" className="hover:text-white/60 transition-colors">Display Setup</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-5 text-white/60">Navigate</h4>
              <ul className="space-y-3 text-sm text-white/30">
                <li><button onClick={() => scrollTo('about')} className="hover:text-white/60 transition-colors">About</button></li>
                <li><button onClick={() => scrollTo('features')} className="hover:text-white/60 transition-colors">Features</button></li>
                <li><button onClick={() => scrollTo('pricing')} className="hover:text-white/60 transition-colors">Pricing</button></li>
                <li><button onClick={() => scrollTo('contact')} className="hover:text-white/60 transition-colors">Contact</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/20">
            <span className="flex items-center gap-1">
              &copy; 2026 AdMotion. Made with <Heart className="w-3 h-3 text-red-400 fill-red-400" /> All rights reserved.
            </span>
            <span>Supervised by Sir Zohaib Ahmed</span>
            <div className="flex items-center gap-3">
              <span>Built with React, Firebase, Three.js</span>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="w-9 h-9 rounded-lg flex items-center justify-center border border-white/10 text-white/30 hover:text-white/70 hover:border-white/20 transition-all hover:scale-110 hover:-translate-y-0.5"
                style={{ background: `${BRAND[800]}60` }}
                aria-label="Back to top"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
