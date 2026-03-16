import React, { useRef, useState, useEffect, useMemo, Suspense, lazy, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, MeshDistortMaterial, OrbitControls, Sphere, Box, Torus, Text } from '@react-three/drei'
import {
  ChevronDown, Play, MapPin, Calendar, Cloud, DollarSign, Wifi, BarChart3,
  Check, Star, Mail, Phone, ArrowRight, Music, Music2,
  Zap, Shield, Users, MonitorSmartphone, Globe, Clock
} from 'lucide-react'
import * as THREE from 'three'

/* ─────────────────────── helpers ─────────────────────── */

const BRAND = {
  900: '#0B1452', 800: '#111b68', 700: '#152071', 600: '#1b2b8b',
  blue: '#3b82f6', orange: '#f59e0b', teal: '#14b8a6', purple: '#8b5cf6',
}

function useCountUp(end, duration = 2000, inView) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!inView) return
    let start = 0, startTime = null
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

/* ─────────── 3D components ─────────── */

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
        <icosahedronGeometry args={[0.8, 0]} attach="none" />
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
        {/* Phone body */}
        <Box args={[1.6, 2.8, 0.12]} position={[0, 0, 0]}>
          <meshStandardMaterial color="#1a1a2e" metalness={0.8} roughness={0.2} />
        </Box>
        {/* Screen */}
        <Box args={[1.4, 2.4, 0.01]} position={[0, 0.05, 0.07]}>
          <meshStandardMaterial color={BRAND.blue} emissive={BRAND.blue} emissiveIntensity={0.3} />
        </Box>
        {/* Notch */}
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
      {/* Car body */}
      <Box args={[3.5, 0.8, 1.6]} position={[0, 0.3, 0]}>
        <meshStandardMaterial color={BRAND.blue} wireframe transparent opacity={0.6} />
      </Box>
      {/* Cabin */}
      <Box args={[1.8, 0.7, 1.4]} position={[0.2, 0.95, 0]}>
        <meshStandardMaterial color={BRAND.teal} wireframe transparent opacity={0.5} />
      </Box>
      {/* LED Screen on roof */}
      <Box args={[1.2, 0.1, 1.0]} position={[0.2, 1.35, 0]}>
        <meshStandardMaterial color={BRAND.orange} emissive={BRAND.orange} emissiveIntensity={0.5} transparent opacity={0.8} />
      </Box>
      {/* Wheels */}
      {[[-1.2, -0.15, 0.85], [-1.2, -0.15, -0.85], [1.2, -0.15, 0.85], [1.2, -0.15, -0.85]].map((pos, i) => (
        <mesh key={i} position={pos} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.3, 0.1, 8, 16]} />
          <meshStandardMaterial color="#ffffff" wireframe transparent opacity={0.4} />
        </mesh>
      ))}
      {/* Floating labels */}
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

/* ─────────── Section components (inline) ─────────── */

const fadeUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } } }
const fadeLeft = { hidden: { opacity: 0, x: -40 }, visible: { opacity: 1, x: 0, transition: { duration: 0.7 } } }
const fadeRight = { hidden: { opacity: 0, x: 40 }, visible: { opacity: 1, x: 0, transition: { duration: 0.7 } } }
const stagger = { visible: { transition: { staggerChildren: 0.15 } } }

function AnimSection({ children, className, id, variants = fadeUp }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.section
      ref={ref} id={id} className={className}
      initial="hidden" animate={inView ? 'visible' : 'hidden'} variants={stagger}
    >
      {children}
    </motion.section>
  )
}

/* ─────────── Main Component ─────────── */

export default function PublicSite() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const audioCtx = useRef(null)
  const oscillator = useRef(null)
  const containerRef = useRef(null)
  const { scrollYProgress } = useScroll()
  const bgY = useTransform(scrollYProgress, [0, 1], [0, -200])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const handleMouse = useCallback((e) => {
    setMouse({ x: (e.clientX / window.innerWidth - 0.5) * 2, y: (e.clientY / window.innerHeight - 0.5) * 2 })
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

  /* ─── data ─── */
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
    { title: 'Driver Earnings Dashboard', desc: 'Transparent earnings tracking with instant withdrawal and payment history.', icon: <DollarSign className="w-7 h-7" />, color: BRAND.orange },
    { title: 'Offline Ad Playback', desc: 'Cached ads play seamlessly even without internet connectivity.', icon: <Wifi className="w-7 h-7" />, color: BRAND.purple },
    { title: 'Live Analytics', desc: 'Real-time impressions, engagement metrics, and campaign performance data.', icon: <BarChart3 className="w-7 h-7" />, color: BRAND.blue },
  ]

  const pricing = [
    { name: 'Basic', price: 'Rs 15,000', period: '/mo', features: ['1 Vehicle', 'Basic Analytics', 'Email Support', 'Standard Scheduling', '5 Campaigns'], popular: false },
    { name: 'Professional', price: 'Rs 30,000', period: '/mo', features: ['5 Vehicles', 'Full Analytics', 'Priority Support', 'AI Scheduling', 'Unlimited Campaigns', 'Weather Targeting'], popular: true },
    { name: 'Enterprise', price: 'Custom', period: '', features: ['Unlimited Vehicles', 'API Access', 'Dedicated Support', 'Custom Integrations', 'White-Label Option', 'SLA Guarantee'], popular: false },
  ]

  const team = [
    { name: 'Muneeb Anwar', role: 'Full Stack Developer', initials: 'MA', gradient: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.teal})` },
    { name: 'Muskan', role: 'UI/UX Designer & Developer', initials: 'MK', gradient: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.purple})` },
    { name: 'Sir Zohaib Ahmed', role: 'Project Supervisor', initials: 'ZA', gradient: `linear-gradient(135deg, ${BRAND.teal}, ${BRAND.blue})` },
  ]

  const testimonials = [
    { name: 'Ahmed Khan', role: 'Fleet Owner, Lahore', text: 'AdMotion transformed my taxi fleet into a revenue generating machine. The earnings from ads cover most of my fuel costs!', stars: 5 },
    { name: 'Sara Malik', role: 'Marketing Director', text: 'The targeting capabilities are incredible. We saw a 3x increase in brand awareness within the first month.', stars: 5 },
    { name: 'Usman Ali', role: 'Ride-share Driver', text: 'Easy to use, no effort needed. The screen runs ads automatically and I earn extra money every day.', stars: 4 },
  ]

  return (
    <div ref={containerRef} className="bg-brand-900 text-white overflow-x-hidden" style={{ scrollBehavior: 'smooth' }} onMouseMove={handleMouse}>

      {/* ──── Floating Music Toggle ──── */}
      <button
        onClick={toggleMusic}
        className="fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full flex items-center justify-center backdrop-blur-md border border-white/10 transition-all hover:scale-110"
        style={{ background: 'rgba(11,20,82,0.7)' }}
        aria-label="Toggle music"
      >
        {musicPlaying ? <Music className="w-5 h-5 text-accent-teal" /> : <Music2 className="w-5 h-5 text-white/50" />}
      </button>

      {/* ━━━━━━━━━━ 1. HERO ━━━━━━━━━━ */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Gradient bg */}
        <motion.div className="absolute inset-0" style={{ y: bgY }}>
          <div className="absolute inset-0" style={{
            background: `radial-gradient(ellipse at 30% 20%, ${BRAND.blue}22 0%, transparent 50%),
                          radial-gradient(ellipse at 70% 80%, ${BRAND.teal}1a 0%, transparent 50%),
                          radial-gradient(ellipse at 50% 50%, ${BRAND[900]} 0%, #050a28 100%)`
          }} />
        </motion.div>

        {/* 3D canvas */}
        {!isMobile && (
          <Scene3D className="absolute inset-0 z-0" style={{ pointerEvents: 'none' }}>
            <HeroShapes mouse={mouse} />
            <Particles />
          </Scene3D>
        )}

        {/* Mobile gradient fallback */}
        {isMobile && (
          <div className="absolute inset-0 z-0">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl animate-float" style={{ background: `${BRAND.blue}30` }} />
            <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full blur-3xl animate-float" style={{ background: `${BRAND.teal}25`, animationDelay: '1s' }} />
          </div>
        )}

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-white/10 backdrop-blur-sm" style={{ background: `${BRAND.blue}20` }}>
              Next-Gen Vehicle Advertising
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl md:text-7xl font-bold leading-tight mb-6"
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
          >
            Transform Vehicles Into{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.teal}, ${BRAND.orange})` }}>
              Smart Digital Billboards
            </span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-white/60 mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.6 }}
          >
            AdMotion - Intelligent Vehicle Advertising Platform. Reach millions on the move with dynamic, GPS-targeted outdoor ads.
          </motion.p>

          <motion.div className="flex flex-col sm:flex-row gap-4 justify-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.8 }}>
            <Link to="/login" className="px-8 py-3.5 rounded-xl font-semibold text-white transition-all hover:scale-105 hover:shadow-lg hover:shadow-blue-500/25" style={{ background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.teal})` }}>
              Get Started <ArrowRight className="inline w-5 h-5 ml-1" />
            </Link>
            <button onClick={() => scrollTo('how-it-works')} className="px-8 py-3.5 rounded-xl font-semibold border border-white/20 text-white/80 hover:bg-white/5 transition-all hover:scale-105 backdrop-blur-sm">
              <Play className="inline w-5 h-5 mr-2" /> Watch Demo
            </button>
          </motion.div>
        </div>

        <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10" animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
          <ChevronDown className="w-6 h-6 text-white/30" />
        </motion.div>
      </section>

      {/* ━━━━━━━━━━ 2. STATS ━━━━━━━━━━ */}
      <StatsSection stats={stats} />

      {/* ━━━━━━━━━━ 3. ABOUT ━━━━━━━━━━ */}
      <AnimSection id="about" className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <motion.div variants={fadeLeft}>
            <span className="text-accent-teal text-sm font-semibold tracking-widest uppercase">About AdMotion</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-6">What is AdMotion?</h2>
            <p className="text-white/60 text-lg leading-relaxed mb-6">
              AdMotion transforms urban vehicles into intelligent advertising displays using roof-mounted LED panels.
              Our platform connects advertisers with vehicle owners, creating a new channel for dynamic, location-based outdoor advertising.
            </p>
            <p className="text-white/50 leading-relaxed mb-8">
              With real-time GPS tracking, AI-powered ad scheduling, and comprehensive analytics, AdMotion delivers
              measurable results for advertisers while providing passive income for drivers. The platform handles everything
              from campaign creation to performance reporting.
            </p>
            <div className="flex gap-6">
              {[{ n: '50K+', l: 'Daily Views' }, { n: '99.9%', l: 'Reliability' }, { n: '150+', l: 'Cities' }].map(s => (
                <div key={s.l}>
                  <div className="text-2xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.teal})` }}>{s.n}</div>
                  <div className="text-white/40 text-sm">{s.l}</div>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div variants={fadeRight} className="flex justify-center">
            {!isMobile ? (
              <Scene3D className="w-full h-[400px]" orbitControls>
                <FloatingScreen />
              </Scene3D>
            ) : (
              <div className="w-64 h-96 rounded-3xl border border-white/10" style={{ background: `linear-gradient(180deg, ${BRAND[800]}, ${BRAND[900]})` }}>
                <div className="w-full h-full flex items-center justify-center">
                  <MonitorSmartphone className="w-20 h-20 text-accent-blue/40" />
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </AnimSection>

      {/* ━━━━━━━━━━ 4. HOW IT WORKS ━━━━━━━━━━ */}
      <AnimSection id="how-it-works" className="py-24 px-6" style={{ background: `linear-gradient(180deg, transparent, ${BRAND[800]}40, transparent)` }}>
        <div className="max-w-6xl mx-auto text-center mb-16">
          <motion.span variants={fadeUp} className="text-accent-orange text-sm font-semibold tracking-widest uppercase">Process</motion.span>
          <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mt-3">How It Works</motion.h2>
        </div>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <motion.div key={i} variants={fadeUp} className="relative group">
              <div className="rounded-2xl p-8 border border-white/5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-2 hover:border-white/15"
                style={{ background: `linear-gradient(135deg, ${BRAND[800]}80, ${BRAND[900]}90)` }}>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: `linear-gradient(135deg, ${[BRAND.blue, BRAND.teal, BRAND.orange][i]}30, transparent)` }}>
                  <div style={{ color: [BRAND.blue, BRAND.teal, BRAND.orange][i] }}>{s.icon}</div>
                </div>
                <div className="text-5xl font-black text-white/5 absolute top-4 right-6">{s.num}</div>
                <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                <p className="text-white/50 leading-relaxed">{s.desc}</p>
              </div>
              {i < 2 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 text-white/10">
                  <ArrowRight className="w-8 h-8" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </AnimSection>

      {/* ━━━━━━━━━━ 5. FEATURES ━━━━━━━━━━ */}
      <AnimSection id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <motion.span variants={fadeUp} className="text-accent-blue text-sm font-semibold tracking-widest uppercase">Features</motion.span>
          <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mt-3">Everything You Need</motion.h2>
        </div>
        <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={i} variants={fadeUp}
              whileHover={{ rotateX: -3, rotateY: 3, scale: 1.03 }}
              style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
              className="group"
            >
              <div className="rounded-2xl p-7 border border-white/5 backdrop-blur-md h-full transition-all duration-300 hover:border-white/15"
                style={{ background: `linear-gradient(135deg, rgba(28,35,115,0.5), rgba(11,20,82,0.8))` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                  style={{ background: `${f.color}18` }}>
                  <div style={{ color: f.color }}>{f.icon}</div>
                </div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-white/45 text-sm leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimSection>

      {/* ━━━━━━━━━━ 6. 3D VEHICLE SHOWCASE ━━━━━━━━━━ */}
      <section id="showcase" className="py-24 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 text-center mb-8">
          <span className="text-accent-teal text-sm font-semibold tracking-widest uppercase">Technology</span>
          <h2 className="text-3xl md:text-4xl font-bold mt-3">Smart Vehicle Setup</h2>
          <p className="text-white/50 mt-4 max-w-xl mx-auto">Every AdMotion vehicle is equipped with cutting-edge technology for seamless ad delivery.</p>
        </div>
        {!isMobile ? (
          <Scene3D className="w-full h-[450px]" camera={{ position: [0, 1.5, 6], fov: 50 }} orbitControls>
            <VehicleWireframe />
          </Scene3D>
        ) : (
          <div className="max-w-sm mx-auto px-6">
            <div className="rounded-2xl border border-white/10 p-8 text-center" style={{ background: `linear-gradient(135deg, ${BRAND[800]}60, ${BRAND[900]}80)` }}>
              <div className="grid grid-cols-2 gap-4">
                {['GPS Tracking', 'LED Screen', '4G Connection', 'AI Scheduling'].map(l => (
                  <div key={l} className="p-4 rounded-xl border border-white/5" style={{ background: `${BRAND.blue}10` }}>
                    <Zap className="w-6 h-6 text-accent-teal mx-auto mb-2" />
                    <span className="text-sm text-white/60">{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ━━━━━━━━━━ 7. PRICING ━━━━━━━━━━ */}
      <AnimSection id="pricing" className="py-24 px-6" style={{ background: `linear-gradient(180deg, transparent, ${BRAND[800]}30, transparent)` }}>
        <div className="max-w-6xl mx-auto text-center mb-16">
          <motion.span variants={fadeUp} className="text-accent-orange text-sm font-semibold tracking-widest uppercase">Pricing</motion.span>
          <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mt-3">Simple, Transparent Pricing</motion.h2>
        </div>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {pricing.map((p, i) => (
            <motion.div
              key={i} variants={fadeUp}
              whileHover={{ y: -8, rotateY: 2 }}
              style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
              className="relative"
            >
              {p.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold z-10"
                  style={{ background: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.blue})` }}>
                  POPULAR
                </div>
              )}
              <div className={`rounded-2xl p-8 border h-full transition-all duration-300 ${p.popular ? 'border-accent-blue/30' : 'border-white/5'}`}
                style={{
                  background: p.popular
                    ? `linear-gradient(135deg, ${BRAND[800]}, ${BRAND[700]})`
                    : `linear-gradient(135deg, ${BRAND[800]}60, ${BRAND[900]}80)`,
                }}>
                <h3 className="text-xl font-bold mb-1">{p.name}</h3>
                <div className="mb-6">
                  <span className="text-3xl font-black">{p.price}</span>
                  <span className="text-white/40">{p.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-white/60 text-sm">
                      <Check className="w-4 h-4 text-accent-teal flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <Link to="/login"
                  className={`block text-center py-3 rounded-xl font-semibold transition-all hover:scale-105 ${
                    p.popular
                      ? 'text-white hover:shadow-lg hover:shadow-blue-500/20'
                      : 'border border-white/10 text-white/70 hover:bg-white/5'
                  }`}
                  style={p.popular ? { background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.teal})` } : undefined}
                >
                  {p.price === 'Custom' ? 'Contact Sales' : 'Get Started'}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimSection>

      {/* ━━━━━━━━━━ 8. TEAM ━━━━━━━━━━ */}
      <AnimSection id="team" className="py-24 px-6">
        <div className="max-w-6xl mx-auto text-center mb-16">
          <motion.span variants={fadeUp} className="text-accent-teal text-sm font-semibold tracking-widest uppercase">Team</motion.span>
          <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mt-3">Meet The Team</motion.h2>
        </div>
        <div className="max-w-4xl mx-auto grid sm:grid-cols-3 gap-8">
          {team.map((t, i) => (
            <motion.div
              key={i} variants={fadeUp}
              whileHover={{ y: -10, rotateX: -3, rotateY: 3 }}
              style={{ transformStyle: 'preserve-3d', perspective: '800px' }}
              className="text-center"
            >
              <div className="rounded-2xl p-8 border border-white/5 backdrop-blur-sm transition-all duration-300 hover:border-white/15"
                style={{ background: `linear-gradient(135deg, ${BRAND[800]}60, ${BRAND[900]}80)` }}>
                <div className="w-24 h-24 rounded-full mx-auto mb-5 flex items-center justify-center text-2xl font-bold text-white shadow-lg"
                  style={{ background: t.gradient }}>
                  {t.initials}
                </div>
                <h3 className="text-lg font-bold">{t.name}</h3>
                <p className="text-white/40 text-sm mt-1">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimSection>

      {/* ━━━━━━━━━━ 9. TESTIMONIALS ━━━━━━━━━━ */}
      <AnimSection id="testimonials" className="py-24 px-6" style={{ background: `linear-gradient(180deg, transparent, ${BRAND[800]}30, transparent)` }}>
        <div className="max-w-6xl mx-auto text-center mb-16">
          <motion.span variants={fadeUp} className="text-accent-blue text-sm font-semibold tracking-widest uppercase">Testimonials</motion.span>
          <motion.h2 variants={fadeUp} className="text-3xl md:text-4xl font-bold mt-3">Trusted by Fleet Owners Across Pakistan</motion.h2>
        </div>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div key={i} variants={fadeUp}
              className="rounded-2xl p-7 border border-white/5 backdrop-blur-sm"
              style={{ background: `linear-gradient(135deg, ${BRAND[800]}50, ${BRAND[900]}70)` }}
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className={`w-4 h-4 ${j < t.stars ? 'text-accent-orange fill-accent-orange' : 'text-white/10'}`} />
                ))}
              </div>
              <p className="text-white/55 text-sm leading-relaxed mb-5">"{t.text}"</p>
              <div>
                <div className="font-semibold text-sm">{t.name}</div>
                <div className="text-white/30 text-xs">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimSection>

      {/* ━━━━━━━━━━ 10. CTA / CONTACT ━━━━━━━━━━ */}
      <section id="contact" className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0" style={{
          background: `radial-gradient(ellipse at 50% 50%, ${BRAND.blue}15, transparent 70%),
                        radial-gradient(ellipse at 20% 80%, ${BRAND.teal}10, transparent 60%)`
        }} />
        <div className="relative max-w-3xl mx-auto text-center">
          <motion.h2 className="text-3xl md:text-5xl font-bold mb-6" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            Ready to Transform{' '}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.teal})` }}>Your Fleet?</span>
          </motion.h2>
          <motion.p className="text-white/50 text-lg mb-4" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            Join thousands of fleet owners and advertisers already using AdMotion.
          </motion.p>
          <motion.div className="flex items-center justify-center gap-2 text-white/40 mb-10" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
            <Mail className="w-4 h-4" /> admotion@project.com
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }}>
            <Link to="/login" className="inline-block px-10 py-4 rounded-xl font-bold text-white text-lg transition-all hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20"
              style={{ background: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.teal})` }}>
              Get Started Free <ArrowRight className="inline w-5 h-5 ml-2" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ━━━━━━━━━━ 11. FOOTER ━━━━━━━━━━ */}
      <footer className="border-t border-white/5 py-12 px-6" style={{ background: BRAND[900] }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-3 gap-8 mb-10">
            <div>
              <div className="text-2xl font-black mb-3">
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.teal})` }}>Ad</span>Motion
              </div>
              <p className="text-white/30 text-sm leading-relaxed">Intelligent Vehicle Advertising Platform. Transform urban mobility into advertising opportunities.</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4 text-white/60">Quick Links</h4>
              <ul className="space-y-2 text-sm text-white/30">
                <li><Link to="/login" className="hover:text-white/60 transition-colors">Admin Panel</Link></li>
                <li><Link to="/driver/login" className="hover:text-white/60 transition-colors">Driver App</Link></li>
                <li><Link to="/display/setup" className="hover:text-white/60 transition-colors">Display Setup</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-4 text-white/60">Navigate</h4>
              <ul className="space-y-2 text-sm text-white/30">
                <li><button onClick={() => scrollTo('about')} className="hover:text-white/60 transition-colors">About</button></li>
                <li><button onClick={() => scrollTo('features')} className="hover:text-white/60 transition-colors">Features</button></li>
                <li><button onClick={() => scrollTo('pricing')} className="hover:text-white/60 transition-colors">Pricing</button></li>
                <li><button onClick={() => scrollTo('contact')} className="hover:text-white/60 transition-colors">Contact</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-white/20">
            <span>&copy; 2026 AdMotion. All rights reserved.</span>
            <span>Supervised by Sir Zohaib Ahmed</span>
            <span>Built with React, Firebase, Three.js</span>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ── Stats section (separate for useInView) ── */
function StatsSection({ stats }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const v0 = useCountUp(stats[0].value, 2000, inView)
  const v1 = useCountUp(stats[1].value, 2000, inView)
  const v2 = useCountUp(stats[2].value, 2000, inView)
  const v3 = useCountUp(stats[3].value, 2000, inView)
  const vals = [v0, v1, v2, v3]

  return (
    <section ref={ref} className="py-16 px-6 border-y border-white/5" style={{ background: `linear-gradient(90deg, ${BRAND[800]}40, ${BRAND[900]}60, ${BRAND[800]}40)` }}>
      <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((s, i) => (
          <motion.div key={i} className="text-center" initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.1, duration: 0.5 }}>
            <div className="text-3xl md:text-4xl font-black mb-1">
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(135deg, ${BRAND.blue}, ${BRAND.teal})` }}>
                {s.prefix}{vals[i].toLocaleString()}{s.suffix}
              </span>
            </div>
            <div className="text-white/35 text-sm">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
