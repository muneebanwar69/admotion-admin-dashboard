import React, { useState, useEffect } from 'react'
import { FiUser, FiCamera, FiCheck } from 'react-icons/fi'
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
    <div className='min-h-screen bg-[var(--app-bg)]'>
      {/* Success Modal */}
      {showSuccess && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg shadow-xl p-8 max-w-sm w-full mx-4 animate-scale-in'>
            <div className='text-center'>
              <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <FiCheck className='w-8 h-8 text-green-600' />
              </div>
              <h3 className='text-xl font-semibold text-gray-800 mb-2'>Successful!</h3>
              <p className='text-gray-600 mb-6'>Your changes have been saved successfully.</p>
              <button
                onClick={() => setShowSuccess(false)}
                className='bg-[#101c44] text-white px-6 py-2 rounded-lg hover:bg-[#182b5b] transition-all duration-300 transform hover:scale-105'
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className='p-4'>
        {/* Header */}
        <div className='bg-[#101c44] text-white px-4 py-3 text-sm mb-4 rounded-t-lg'>
          {activeTab === 'profile' ? 'My Profile' : 'Set new password'}
        </div>

        {/* Tabs */}
        <div className='bg-white border-b border-gray-200 mb-6'>
          <div className='flex'>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-6 py-3 text-sm font-medium transition-all duration-300 ${
                activeTab === 'profile'
                  ? 'text-[#101c44] border-b-2 border-[#101c44]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              User Profile
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`px-6 py-3 text-sm font-medium transition-all duration-300 ${
                activeTab === 'password'
                  ? 'text-[#101c44] border-b-2 border-[#101c44]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Set new password
            </button>
          </div>
        </div>

        {/* Profile Tab Content */}
        {activeTab === 'profile' && (
          <div className='bg-white rounded-lg shadow-sm border p-8 max-w-2xl mx-auto'>
            <div className='flex flex-col items-center mb-8'>
              {/* Profile Picture */}
              <div className='relative mb-4'>
                <div className='w-24 h-24 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center border-4 border-white shadow-lg'>
                  {imagePreview ? (
                    <img src={imagePreview} alt='Profile' className='w-full h-full object-cover' />
                  ) : (
                    <FiUser className='w-12 h-12 text-blue-600' />
                  )}
                </div>
                {editing && (
                  <label className='absolute bottom-0 right-0 bg-[#101c44] text-white p-2 rounded-full cursor-pointer hover:bg-[#182b5b] transition-all duration-300 transform hover:scale-110 shadow-lg'>
                    <FiCamera className='w-4 h-4' />
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
              <h2 className='text-xl font-semibold text-gray-800 mb-1'>
                {formData.name || 'Admin'}
              </h2>
              <p className='text-gray-600 text-sm mb-1'>{currentUser?.role || 'Admin'}</p>
              <p className='text-gray-500 text-sm'>{formData.email}</p>
            </div>

            {/* Form Fields */}
            <div className='space-y-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Name
                </label>
                <input
                  type='text'
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  disabled={!editing}
                  placeholder='Muneeb'
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101c44] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300 hover:border-gray-400'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Contact No
                </label>
                <input
                  type='tel'
                  value={formData.contactNo}
                  onChange={(e) => handleInputChange('contactNo', e.target.value)}
                  disabled={!editing}
                  placeholder='+1234567890'
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101c44] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300 hover:border-gray-400'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  E-mail
                </label>
                <input
                  type='email'
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!editing}
                  placeholder='muneeb@admotion.com'
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101c44] focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-all duration-300 hover:border-gray-400'
                />
                {editing && (
                  <p className='text-xs text-gray-500 mt-1'>Change Account</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className='flex justify-center pt-4'>
                {!editing ? (
                  <button
                    onClick={handleEdit}
                    className='bg-[#101c44] text-white px-8 py-2 rounded-lg hover:bg-[#182b5b] transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg'
                  >
                    Edit
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className='bg-[#101c44] text-white px-8 py-2 rounded-lg hover:bg-[#182b5b] transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Password Tab Content */}
        {activeTab === 'password' && (
          <div className='bg-white rounded-lg shadow-sm border p-8 max-w-2xl mx-auto'>
            <div className='space-y-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Old Password
                </label>
                <input
                  type='password'
                  value={passwordData.oldPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, oldPassword: e.target.value }))}
                  placeholder='Enter old password'
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101c44] focus:border-transparent transition-all duration-300 hover:border-gray-400'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  New Password
                </label>
                <input
                  type='password'
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder='Enter new password'
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101c44] focus:border-transparent transition-all duration-300 hover:border-gray-400'
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Confirm Password
                </label>
                <input
                  type='password'
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder='Confirm new password'
                  className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101c44] focus:border-transparent transition-all duration-300 hover:border-gray-400'
                />
              </div>

              {/* Submit Button */}
              <div className='flex justify-center pt-4'>
                <button
                  onClick={handlePasswordChange}
                  disabled={loading || !passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  className='bg-[#6366f1] text-white px-8 py-2 rounded-lg hover:bg-[#5558e3] transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  {loading ? 'Updating...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default MyProfile
