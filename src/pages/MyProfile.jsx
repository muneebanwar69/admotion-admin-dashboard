import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Camera, Check, Lock, Mail, Phone, Edit, Activity, Calendar, Sparkles, ShieldCheck } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { db } from '../firebase'
import { doc, updateDoc, getDoc } from 'firebase/firestore'
import { logProfileUpdated, logPasswordChanged } from '../services/activityLogger'

const MyProfile = () => {
  const { currentUser } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contactNo: '',
    image: null
  })
  const [imagePreview, setImagePreview] = useState(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  // Password change state
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  useEffect(() => {
    // Load current user data
    if (currentUser) {
      setFormData({
        name: currentUser.displayName || currentUser.username || '',
        email: currentUser.email || '',
        contactNo: currentUser.contactNo || '',
        image: currentUser.image || null
      })
      if (currentUser.image) {
        setImagePreview(currentUser.image)
      }
    }
  }, [currentUser])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData(prev => ({ ...prev, image: file }))
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleEdit = () => {
    setEditing(true)
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      // In production, update Firebase with image upload
      // For now, just update local state
      // await updateDoc(doc(db, 'admins', currentUser.id), {
      //   displayName: formData.name,
      //   email: formData.email,
      //   contactNo: formData.contactNo,
      //   image: imageUrl // after uploading to storage
      // })
      
      // Log the profile update activity
      await logProfileUpdated(
        {
          name: formData.name,
          email: formData.email,
          contactNo: formData.contactNo
        },
        currentUser?.displayName || currentUser?.username || 'Admin'
      )
      
      setEditing(false)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New password and confirm password do not match')
      return
    }
    if (passwordData.newPassword.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      // In production, update password in Firebase
      // await updateDoc(doc(db, 'admins', currentUser.id), {
      //   password: passwordData.newPassword
      // })
      
      // Log the password change activity
      await logPasswordChanged(
        currentUser?.displayName || currentUser?.username || 'Admin'
      )
      
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' })
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } catch (error) {
      console.error('Error updating password:', error)
      alert('Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  // Password strength calculator
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: 'bg-slate-200' }
    let score = 0
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
    }
    score = Object.values(checks).filter(Boolean).length
    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500', textColor: 'text-red-500', checks }
    if (score <= 3) return { score, label: 'Medium', color: 'bg-yellow-500', textColor: 'text-yellow-500', checks }
    return { score, label: 'Strong', color: 'bg-emerald-500', textColor: 'text-emerald-500', checks }
  }

  const passwordStrength = getPasswordStrength(passwordData.newPassword)

  return (
    <div className='p-4 md:p-6 transition-colors duration-300'>
      {/* Success Modal - rendered via portal to avoid overflow clipping */}
      {createPortal(
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className='bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 max-w-sm w-full border border-slate-200 dark:border-slate-700'
              >
                <div className='text-center'>
                  <div className='w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4'>
                    <Check className='w-8 h-8 text-emerald-600 dark:text-emerald-400' />
                  </div>
                  <h3 className='text-xl font-bold text-slate-800 dark:text-slate-100 mb-2'>Success!</h3>
                  <p className='text-slate-600 dark:text-slate-400 mb-6'>Your changes have been saved successfully.</p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowSuccess(false)}
                    className='bg-gradient-to-r from-brand-900 to-brand-800 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300'
                  >
                    Continue
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 text-white px-6 py-4 rounded-xl shadow-lg mb-6 flex items-center justify-between border border-white/10'
      >
        <div className="flex items-center gap-3">
          <User className="w-6 h-6" />
          <h1 className='text-xl md:text-2xl font-bold'>
            {activeTab === 'profile' ? 'My Profile' : 'Change Password'}
          </h1>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 mb-6 overflow-hidden'>
        <div className='flex relative'>
          {['profile', 'password'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative flex-1 px-6 py-4 text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                activeTab === tab
                  ? 'text-brand-900 dark:text-blue-400 bg-slate-50 dark:bg-slate-700/50'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30'
              }`}
            >
              {tab === 'profile' ? <User className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {tab === 'profile' ? 'User Profile' : 'Change Password'}
              {activeTab === tab && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className='absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-brand-900 via-purple-600 to-blue-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]'
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Profile Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'profile' && (
          <motion.div 
            key="profile"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className='bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 md:p-8 max-w-2xl mx-auto'
          >
            {/* Gradient Banner */}
            <div className='relative -mx-6 -mt-6 md:-mx-8 md:-mt-8 mb-16'>
              <div className='h-36 md:h-44 bg-gradient-to-r from-brand-900 via-purple-800 to-blue-900 rounded-t-2xl overflow-hidden relative'>
                <div className='absolute inset-0 opacity-20' style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 75% 30%, rgba(255,255,255,0.06) 0%, transparent 40%)' }} />
                <Sparkles className='absolute top-4 right-6 w-5 h-5 text-white/20 animate-pulse' />
                <Sparkles className='absolute top-10 right-20 w-3 h-3 text-white/15 animate-pulse delay-300' />
              </div>
              {/* Overlapping Profile Image */}
              <div className='absolute -bottom-12 left-1/2 -translate-x-1/2'>
                <div className='relative'>
                  <div className='w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-brand-900 to-brand-800 flex items-center justify-center ring-4 ring-white dark:ring-slate-800 shadow-xl'>
                    {imagePreview ? (
                      <img src={imagePreview} alt='Profile' className='w-full h-full object-cover' />
                    ) : (
                      <User className='w-14 h-14 text-white/80' />
                    )}
                  </div>
                  {/* Online Status Dot */}
                  <span className='absolute bottom-1 right-1 block w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-800'>
                    <span className='absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75' />
                  </span>
                  {editing && (
                    <label className='absolute -bottom-1 -left-1 bg-gradient-to-r from-brand-900 to-brand-800 text-white p-2.5 rounded-full cursor-pointer hover:from-brand-800 hover:to-brand-700 transition-all duration-300 transform hover:scale-110 shadow-lg'>
                      <Camera className='w-4 h-4' />
                      <input
                        type='file'
                        accept='image/*'
                        onChange={handleImageChange}
                        className='hidden'
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Name and Role */}
            <div className='flex flex-col items-center mb-6'>
              <h2 className='text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1'>
                {formData.name || 'Admin'}
              </h2>
              <p className='text-slate-500 dark:text-slate-400 text-sm mb-3'>{formData.email}</p>
            </div>

            {/* Quick Stats Cards */}
            <div className='flex flex-wrap justify-center gap-3 mb-8'>
              <div className='flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 border border-purple-100 dark:border-purple-800/30'>
                <ShieldCheck className='w-4 h-4 text-purple-600 dark:text-purple-400' />
                <span className='text-xs font-bold bg-gradient-to-r from-purple-600 to-fuchsia-600 bg-clip-text text-transparent'>
                  {currentUser?.role || 'Admin'}
                </span>
              </div>
              <div className='flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-100 dark:border-blue-800/30'>
                <Calendar className='w-4 h-4 text-blue-600 dark:text-blue-400' />
                <span className='text-xs font-semibold text-blue-700 dark:text-blue-300'>Member since 2024</span>
              </div>
              <div className='flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-100 dark:border-emerald-800/30'>
                <Activity className='w-4 h-4 text-emerald-600 dark:text-emerald-400' />
                <span className='text-xs font-semibold text-emerald-700 dark:text-emerald-300'>Active now</span>
              </div>
            </div>

            {/* Form Fields */}
            <div className='space-y-5'>
              <div>
                <label className='block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2'>
                  <User className="w-4 h-4" />
                  Name
                </label>
                <input
                  type='text'
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={!editing}
                  placeholder='Your name'
                  className='w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-brand-900 dark:focus:ring-blue-500 focus:border-transparent focus:border-l-4 focus:border-l-brand-900 dark:focus:border-l-blue-500 disabled:bg-slate-50 dark:disabled:bg-slate-700/50 disabled:text-slate-500 dark:disabled:text-slate-400 transition-all duration-300 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-500'
                />
              </div>

              <div>
                <label className='block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2'>
                  <Phone className="w-4 h-4" />
                  Contact No
                </label>
                <input
                  type='tel'
                  value={formData.contactNo}
                  onChange={(e) => handleInputChange('contactNo', e.target.value)}
                  disabled={!editing}
                  placeholder='+1234567890'
                  className='w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-brand-900 dark:focus:ring-blue-500 focus:border-transparent focus:border-l-4 focus:border-l-brand-900 dark:focus:border-l-blue-500 disabled:bg-slate-50 dark:disabled:bg-slate-700/50 disabled:text-slate-500 dark:disabled:text-slate-400 transition-all duration-300 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-500'
                />
              </div>

              <div>
                <label className='block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2'>
                  <Mail className="w-4 h-4" />
                  E-mail
                </label>
                <input
                  type='email'
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!editing}
                  placeholder='email@example.com'
                  className='w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-brand-900 dark:focus:ring-blue-500 focus:border-transparent focus:border-l-4 focus:border-l-brand-900 dark:focus:border-l-blue-500 disabled:bg-slate-50 dark:disabled:bg-slate-700/50 disabled:text-slate-500 dark:disabled:text-slate-400 transition-all duration-300 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-500'
                />
              </div>

              {/* Action Buttons */}
              <div className='flex justify-center pt-4 gap-4'>
                {!editing ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleEdit}
                    className='flex items-center gap-2 bg-gradient-to-r from-brand-900 to-brand-800 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300'
                  >
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </motion.button>
                ) : (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSave}
                      disabled={loading}
                      className='flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      <Check className="w-4 h-4" />
                      {loading ? 'Saving...' : 'Save Changes'}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setEditing(false)}
                      className='px-8 py-3 border border-slate-300 dark:border-slate-600 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300'
                    >
                      Cancel
                    </motion.button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Password Tab Content */}
        {activeTab === 'password' && (
          <motion.div 
            key="password"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className='bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 md:p-8 max-w-2xl mx-auto'
          >
            <div className='mb-6 text-center'>
              <div className='w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center'>
                <Lock className='w-8 h-8 text-purple-600 dark:text-purple-400' />
              </div>
              <h3 className='text-lg font-bold text-slate-800 dark:text-slate-100'>Change Your Password</h3>
              <p className='text-slate-500 dark:text-slate-400 text-sm mt-1'>Keep your account secure with a strong password</p>
            </div>
            
            <div className='space-y-5'>
              <div>
                <label className='block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2'>
                  Current Password
                </label>
                <input
                  type='password'
                  value={passwordData.oldPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, oldPassword: e.target.value }))}
                  placeholder='Enter current password'
                  className='w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-brand-900 dark:focus:ring-blue-500 focus:border-transparent focus:border-l-4 focus:border-l-purple-500 dark:focus:border-l-purple-400 transition-all duration-300 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-500'
                />
              </div>

              <div>
                <label className='block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2'>
                  New Password
                </label>
                <input
                  type='password'
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder='Enter new password'
                  className='w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-brand-900 dark:focus:ring-blue-500 focus:border-transparent focus:border-l-4 focus:border-l-purple-500 dark:focus:border-l-purple-400 transition-all duration-300 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-500'
                />
                {/* Password Strength Indicator */}
                {passwordData.newPassword && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className='mt-3 space-y-2'
                  >
                    <div className='flex items-center gap-2'>
                      <div className='flex-1 h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden'>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                          transition={{ duration: 0.3 }}
                          className={`h-full rounded-full ${passwordStrength.color}`}
                        />
                      </div>
                      <span className={`text-xs font-bold ${passwordStrength.textColor}`}>{passwordStrength.label}</span>
                    </div>
                    <div className='grid grid-cols-2 gap-1.5 text-xs'>
                      {[
                        { key: 'length', label: '8+ characters' },
                        { key: 'uppercase', label: 'Uppercase letter' },
                        { key: 'lowercase', label: 'Lowercase letter' },
                        { key: 'number', label: 'Number' },
                        { key: 'special', label: 'Special character' },
                      ].map(({ key, label }) => (
                        <div key={key} className={`flex items-center gap-1.5 ${passwordStrength.checks?.[key] ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                          {passwordStrength.checks?.[key] ? (
                            <Check className='w-3 h-3' />
                          ) : (
                            <span className='w-3 h-3 rounded-full border border-current inline-block' />
                          )}
                          {label}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>

              <div>
                <label className='block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2'>
                  Confirm New Password
                </label>
                <input
                  type='password'
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder='Confirm new password'
                  className='w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-brand-900 dark:focus:ring-blue-500 focus:border-transparent focus:border-l-4 focus:border-l-purple-500 dark:focus:border-l-purple-400 transition-all duration-300 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-500'
                />
              </div>

              {/* Submit Button */}
              <div className='flex justify-center pt-4'>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePasswordChange}
                  disabled={loading || !passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  className='flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <Lock className="w-4 h-4" />
                  {loading ? 'Updating...' : 'Update Password'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MyProfile
