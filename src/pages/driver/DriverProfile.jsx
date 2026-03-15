import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { User, Mail, Car, CreditCard, Edit3, Save, X, Award, Clock, MapPin, Shield } from 'lucide-react'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useDriverAuth } from '../../contexts/DriverAuthContext'
import { useTheme } from '../../contexts/ThemeContext'

/* ─── Animated Progress Ring (SVG) ─── */
const ProgressRing = ({ percent, size = 56, stroke = 4, color = '#3b82f6', label, value }) => {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })

  return (
    <div ref={ref} className="flex flex-col items-center">
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="currentColor" strokeWidth={stroke}
            className="text-slate-200 dark:text-slate-700"
          />
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={inView ? { strokeDashoffset: offset } : {}}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-slate-700 dark:text-white">{value}</span>
        </div>
      </div>
      <p className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-1.5 text-center">{label}</p>
    </div>
  )
}

/* Animated gradient border ring for avatar */
const GradientBorderRing = ({ children }) => (
  <div className="relative">
    {/* Animated rotating gradient border */}
    <motion.div
      className="absolute -inset-1 rounded-2xl"
      style={{
        background: 'conic-gradient(from 0deg, #f59e0b, #3b82f6, #14b8a6, #f59e0b)',
        opacity: 0.6,
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
    />
    <div className="relative rounded-2xl bg-brand-900 p-0.5">
      {children}
    </div>
  </div>
)

/* ─── Main Component ─── */
const DriverProfile = () => {
  const { driver, logoutDriver } = useDriverAuth()
  const { theme } = useTheme()
  const [driverData, setDriverData] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  const infoRef = useRef(null)
  const infoInView = useInView(infoRef, { once: true, margin: '-30px' })
  const payRef = useRef(null)
  const payInView = useInView(payRef, { once: true, margin: '-30px' })

  useEffect(() => {
    if (!driver?.uid) return
    const unsub = onSnapshot(doc(db, 'vehicles', driver.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setDriverData(data)
        setForm({
          name: data.ownerName || '',
          email: data.owner?.email || '',
          payoutMethod: data.payoutMethod || 'jazzcash',
          payoutAccount: data.payoutDetails?.accountNo || data.bank?.accountNo || '',
        })
      }
    })
    return () => unsub()
  }, [driver?.uid])

  const handleSave = async () => {
    if (!driver?.uid) return
    setSaving(true)
    try {
      await updateDoc(doc(db, 'vehicles', driver.uid), {
        ownerName: form.name,
        'owner.email': form.email,
        payoutMethod: form.payoutMethod,
        payoutDetails: { accountNo: form.payoutAccount },
      })
      const stored = JSON.parse(localStorage.getItem('currentDriver') || '{}')
      stored.name = form.name
      stored.email = form.email
      localStorage.setItem('currentDriver', JSON.stringify(stored))
      setEditing(false)
    } catch (e) {
      console.error('Failed to update:', e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* ─── Header ─── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white">My Profile</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your account & payment settings</p>
      </motion.div>

      {/* ─── Profile Hero Card ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-2xl p-5 sm:p-6 text-white overflow-hidden shadow-xl"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900" />
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(circle at 85% 20%, rgba(245,158,11,0.12) 0%, transparent 50%), radial-gradient(circle at 15% 80%, rgba(59,130,246,0.1) 0%, transparent 50%)',
        }} />
        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 3 + (i % 2) * 2,
                height: 3 + (i % 2) * 2,
                left: `${20 + i * 15}%`,
                top: `${30 + (i % 2) * 30}%`,
                background: i % 2 === 0 ? 'rgba(245,158,11,0.3)' : 'rgba(59,130,246,0.25)',
              }}
              animate={{ y: [0, -10, 0, 10, 0], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.5 }}
            />
          ))}
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <GradientBorderRing>
            {driver?.profileImage ? (
              <img
                src={driver.profileImage}
                alt={driver?.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-[14px] object-cover"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[14px] bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <span className="text-2xl sm:text-3xl font-bold text-white">
                  {driver?.name?.charAt(0) || 'D'}
                </span>
              </div>
            )}
          </GradientBorderRing>

          <div>
            <motion.h2
              className="text-xl sm:text-2xl font-bold"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              {driver?.name || 'Driver'}
            </motion.h2>
            <p className="text-white/60 text-sm">{driver?.phone}</p>
            {driver?.assignedVehiclePlate && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-white/10 text-[11px] text-amber-300 backdrop-blur-sm border border-white/10"
              >
                <Car className="w-3 h-3" />
                {driver.assignedVehiclePlate}
              </motion.span>
            )}
          </div>
        </div>

        {/* Online status indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative z-10 mt-4 flex items-center gap-2 text-xs text-white/50"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-emerald-300">Active Driver</span>
        </motion.div>
      </motion.div>

      {/* ─── Stats with Animated Progress Rings ─── */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {[
          { icon: Car, label: 'Vehicle', value: driverData?.vehicleName?.split(' ')[0] || 'N/A', percent: 100, color: '#f59e0b' },
          { icon: Clock, label: 'Duration', value: driverData?.duration || 'N/A', percent: 75, color: '#3b82f6' },
          { icon: Award, label: 'Status', value: driverData?.status || 'N/A', percent: driverData?.status === 'Active' ? 100 : 40, color: '#10b981' },
          { icon: Shield, label: 'Rating', value: driverData?.rating || '5.0', percent: ((driverData?.rating || 5) / 5) * 100, color: '#8b5cf6' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.07 }}
            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-xl p-3 shadow-sm border border-white/40 dark:border-slate-700/50 flex flex-col items-center"
          >
            <ProgressRing percent={stat.percent} size={48} stroke={3} color={stat.color} label={stat.label} value={stat.value} />
          </motion.div>
        ))}
      </div>

      {/* ─── Personal Info Section ─── */}
      <motion.div
        ref={infoRef}
        initial={{ opacity: 0, y: 30 }}
        animate={infoInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/40 dark:border-slate-700/50 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <User className="w-4 h-4 text-blue-500" />
            Personal Info
          </h2>
          {!editing ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </motion.button>
          ) : (
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setEditing(false)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-lg shadow-blue-500/20"
              >
                <Save className="w-3.5 h-3.5" />
                {saving ? 'Saving...' : 'Save'}
              </motion.button>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={editing ? 'edit' : 'view'}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-4">
              {/* Owner Name */}
              <div>
                <label className="text-[11px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <User className="w-3 h-3" /> Owner Name
                </label>
                {editing ? (
                  <motion.input
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="input-modern"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-800 dark:text-white">{driverData?.ownerName || driver?.name || 'N/A'}</p>
                )}
              </div>

              {/* CNIC */}
              <div>
                <label className="text-[11px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <CreditCard className="w-3 h-3" /> CNIC
                </label>
                <p className="text-sm font-medium text-slate-800 dark:text-white font-mono">{driverData?.cnic || driver?.cnic || 'N/A'}</p>
              </div>

              {/* Email */}
              <div>
                <label className="text-[11px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Mail className="w-3 h-3" /> Email
                </label>
                {editing ? (
                  <motion.input
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="input-modern"
                    placeholder="Optional"
                  />
                ) : (
                  <p className="text-sm font-medium text-slate-800 dark:text-white">{driverData?.owner?.email || 'Not set'}</p>
                )}
              </div>

              {/* Vehicle */}
              <div>
                <label className="text-[11px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Car className="w-3 h-3" /> Vehicle
                </label>
                <p className="text-sm font-medium text-slate-800 dark:text-white">{driverData?.vehicleName || 'N/A'} ({driverData?.carId || ''})</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* ─── Payment Settings ─── */}
      <motion.div
        ref={payRef}
        initial={{ opacity: 0, y: 30 }}
        animate={payInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
        className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-lg border border-white/40 dark:border-slate-700/50 overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50">
          <h2 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-500" />
            Payment Settings
          </h2>
        </div>
        <div className="p-4 space-y-4">
          {/* Payout Method */}
          <div>
            <label className="text-[11px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-1.5 block">
              Payout Method
            </label>
            {editing ? (
              <div className="flex gap-2">
                {['jazzcash', 'easypaisa', 'bank'].map(method => (
                  <motion.button
                    key={method}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setForm(f => ({ ...f, payoutMethod: method }))}
                    className={`relative flex-1 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 border overflow-hidden ${
                      form.payoutMethod === method
                        ? 'text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700'
                        : 'bg-slate-50 dark:bg-slate-700/30 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    {form.payoutMethod === method && (
                      <motion.div
                        layoutId="payoutMethodPill"
                        className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30"
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                    <span className="relative z-10">{method}</span>
                  </motion.button>
                ))}
              </div>
            ) : (
              <p className="text-sm font-medium text-slate-800 dark:text-white capitalize">{driverData?.payoutMethod || 'Not set'}</p>
            )}
          </div>

          {/* Account Number */}
          <div>
            <label className="text-[11px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider mb-1.5 block">
              Account Number
            </label>
            {editing ? (
              <motion.input
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                type="text"
                value={form.payoutAccount}
                onChange={e => setForm(f => ({ ...f, payoutAccount: e.target.value }))}
                className="input-modern"
                placeholder="03001234567"
              />
            ) : (
              <p className="text-sm font-medium text-slate-800 dark:text-white">
                {driverData?.payoutDetails?.accountNo
                  ? `***${driverData.payoutDetails.accountNo.slice(-4)}`
                  : driverData?.bank?.accountNo
                  ? `***${driverData.bank.accountNo.slice(-4)}`
                  : 'Not set'}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* ─── App Info ─── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center py-4"
      >
        <p className="text-xs text-slate-400 dark:text-slate-500">AdMotion Driver v1.0.0</p>
        <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1">Supervised by Sir Zohaib Ahmed</p>
      </motion.div>
    </div>
  )
}

export default DriverProfile
