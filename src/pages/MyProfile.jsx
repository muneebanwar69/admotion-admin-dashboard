import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Camera, Check, Lock, Mail, Phone, Edit } from 'lucide-react'
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

  return (
    <div className='p-4 md:p-6 transition-colors duration-300'>
      {/* Success Modal */}
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
      </AnimatePresence>

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
        <div className='flex border-b border-slate-200 dark:border-slate-700'>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'profile'
                ? 'text-brand-900 dark:text-blue-400 border-b-2 border-brand-900 dark:border-blue-400 bg-slate-50 dark:bg-slate-700/50'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30'
            }`}
          >
            <User className="w-4 h-4" />
            User Profile
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 px-6 py-4 text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'password'
                ? 'text-brand-900 dark:text-blue-400 border-b-2 border-brand-900 dark:border-blue-400 bg-slate-50 dark:bg-slate-700/50'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/30'
            }`}
          >
            <Lock className="w-4 h-4" />
            Change Password
          </button>
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
            <div className='flex flex-col items-center mb-8'>
              {/* Profile Picture */}
              <div className='relative mb-4'>
                <div className='w-28 h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-brand-900 to-brand-800 flex items-center justify-center border-4 border-white dark:border-slate-700 shadow-xl'>
                  {imagePreview ? (
                    <img src={imagePreview} alt='Profile' className='w-full h-full object-cover' />
                  ) : (
                    <User className='w-14 h-14 text-white/80' />
                  )}
                </div>
                {editing && (
                  <label className='absolute -bottom-2 -right-2 bg-gradient-to-r from-brand-900 to-brand-800 text-white p-3 rounded-xl cursor-pointer hover:from-brand-800 hover:to-brand-700 transition-all duration-300 transform hover:scale-110 shadow-lg'>
                    <Camera className='w-5 h-5' />
                    <input
                      type='file'
                      accept='image/*'
                      onChange={handleImageChange}
                      className='hidden'
                    />
                  </label>
                )}
              </div>

              {/* Name and Role */}
              <h2 className='text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1'>
                {formData.name || 'Admin'}
              </h2>
              <span className='px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 mb-2'>
                {currentUser?.role || 'Admin'}
              </span>
              <p className='text-slate-500 dark:text-slate-400 text-sm'>{formData.email}</p>
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
                  className='w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-brand-900 dark:focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 dark:disabled:bg-slate-700/50 disabled:text-slate-500 dark:disabled:text-slate-400 transition-all duration-300 text-slate-800 dark:text-slate-200'
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
                  className='w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-brand-900 dark:focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 dark:disabled:bg-slate-700/50 disabled:text-slate-500 dark:disabled:text-slate-400 transition-all duration-300 text-slate-800 dark:text-slate-200'
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
                  className='w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-brand-900 dark:focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 dark:disabled:bg-slate-700/50 disabled:text-slate-500 dark:disabled:text-slate-400 transition-all duration-300 text-slate-800 dark:text-slate-200'
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
                  className='w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-brand-900 dark:focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-slate-800 dark:text-slate-200'
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
                  className='w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-brand-900 dark:focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-slate-800 dark:text-slate-200'
                />
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
                  className='w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-brand-900 dark:focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-slate-800 dark:text-slate-200'
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
