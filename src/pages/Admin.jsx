import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Pencil, Trash2, Shield, Plus, X, AlertTriangle, Users, Crown, UserCheck, Mail, Phone, MapPin, Lock, Eye } from 'lucide-react'
import { db } from '../firebase'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import { logAdminCreated, logAdminUpdated, logAdminDeleted } from '../services/activityLogger'
import RealTimeIndicator from '../components/ui/RealTimeIndicator'
import { hashPassword } from '../utils/password'
import { sanitizeFormData } from '../utils/sanitize'
import { validatePasswordStrength } from '../utils/password'
import { useToast } from '../contexts/ToastContext'

const Admin = () => {
  const [admins, setAdmins] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const { currentUser } = useAuth()
  const toast = useToast()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNo: '',
      role: 'Admin',
    location: '',
    image: '',
    password: ''
  })

  // Check if current user is Super Admin
  const isSuperAdmin = currentUser?.role === 'Super Admin' || currentUser?.username === 'muneeb'

  // Fetch admins from Firebase
  useEffect(() => {
    const adminsCollection = collection(db, 'admins')
    const unsubscribe = onSnapshot(adminsCollection, (snapshot) => {
      const adminsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setAdmins(adminsList)
      setLoading(false)
    }, (error) => {
      console.error('Error fetching admins:', error)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const handleAddAdmin = () => {
    setFormData({
      name: '',
      email: '',
      phoneNo: '',
      role: 'Admin',
      location: '',
      image: '',
      password: ''
    })
    setEditingAdmin(null)
    setShowForm(true)
  }

  const handleEdit = (admin) => {
    setFormData({
      name: admin.name || '',
      email: admin.email || '',
      phoneNo: admin.phoneNo || '',
      role: admin.role || 'Admin',
      location: admin.location || '',
      image: admin.image || '',
      password: admin.password || '' // Show existing password
    })
    setEditingAdmin(admin.id)
    setShowForm(true)
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    const userName = currentUser?.displayName || currentUser?.username || 'Admin'
    
    // Validate required fields
    if (!formData.name || !formData.email || !formData.phoneNo || !formData.location) {
      toast.error('Please fill in all required fields')
      return
    }

    // Validate password
    if (!formData.password) {
      toast.error('Password is required')
      return
    }

    // Validate password strength for new admins
    if (!editingAdmin) {
      const passwordValidation = validatePasswordStrength(formData.password)
      if (!passwordValidation.valid) {
        toast.error(`Password validation failed: ${passwordValidation.errors.join(', ')}`)
        return
      }
    }
    
    try {
      // Sanitize all inputs
      const sanitizedData = sanitizeFormData({
        name: formData.name,
        email: formData.email,
        phoneNo: formData.phoneNo,
        role: formData.role,
        location: formData.location,
        image: formData.image
      })

      // Hash password before saving
      const hashedPassword = await hashPassword(formData.password)

      if (editingAdmin) {
        const adminRef = doc(db, 'admins', editingAdmin)
        const updateData = {
          ...sanitizedData,
          password: hashedPassword,
          updatedAt: serverTimestamp()
        }
        await updateDoc(adminRef, updateData)
        await logAdminUpdated({
          name: sanitizedData.name,
          email: sanitizedData.email,
          role: sanitizedData.role
        }, userName)
        toast.success('Admin updated successfully!')
      } else {
        await addDoc(collection(db, 'admins'), {
          ...sanitizedData,
          password: hashedPassword,
          createdAt: serverTimestamp()
        })
        await logAdminCreated({
          name: sanitizedData.name,
          email: sanitizedData.email,
          role: sanitizedData.role
        }, userName)
        toast.success('Admin created successfully!')
      }
      setShowForm(false)
    } catch (error) {
      console.error('Error saving admin:', error)
      toast.error('Failed to save admin: ' + error.message)
    }
  }

  const handleDelete = async () => {
    if (deleteTarget) {
      const userName = currentUser?.displayName || currentUser?.username || 'Admin'
      try {
        await deleteDoc(doc(db, 'admins', deleteTarget.id))
        await logAdminDeleted({
          name: deleteTarget.name,
          email: deleteTarget.email
        }, userName)
        setDeleteTarget(null)
      } catch (error) {
        console.error('Error deleting admin:', error)
        alert('Failed to delete admin')
      }
    }
  }

  if (loading) {
    return (
      <div className='p-6 min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-brand-900 mx-auto mb-4'></div>
          <p className='text-slate-600 dark:text-slate-400'>Loading...</p>
        </div>
      </div>
    )
  }

  // Access Control: Only Super Admin can access this page
  if (!isSuperAdmin) {
    return (
      <div className='p-6 min-h-screen flex items-center justify-center'>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className='text-center bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md border border-slate-200 dark:border-slate-700'
        >
          <div className='w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4'>
            <AlertTriangle className='w-8 h-8 text-red-600 dark:text-red-400' />
          </div>
          <h2 className='text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2'>Access Denied</h2>
          <p className='text-slate-600 dark:text-slate-400 mb-4'>
            You don't have permission to access this page. Only Super Admins can manage admin accounts.
          </p>
          <p className='text-sm text-slate-500 dark:text-slate-500'>
            Current Role: <span className='font-semibold text-brand-900 dark:text-blue-400'>{currentUser?.role || 'User'}</span>
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className='p-4 md:p-6 transition-colors duration-300'>
      {/* Admin List View */}
      {!showForm && (
        <div>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className='bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 text-white px-6 py-4 rounded-xl shadow-lg mb-6 flex items-center justify-between border border-white/10'
          >
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6" />
              <h1 className='text-xl md:text-2xl font-bold'>Admin Management</h1>
            </div>
            <div className="flex items-center gap-4">
              <RealTimeIndicator isActive={true} />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddAdmin}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-semibold border border-white/20 transition-all duration-300"
              >
                <Plus size={18} /> Add Admin
              </motion.button>
            </div>
          </motion.div>

          {/* KPI Cards */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
            {[
              {
                label: 'Total Admins',
                count: admins.length,
                icon: Users,
                gradient: 'from-blue-500 to-blue-600',
                bg: 'bg-blue-50 dark:bg-blue-900/20',
                accent: 'bg-blue-500',
                text: 'text-blue-700 dark:text-blue-300',
                iconBg: 'bg-blue-100 dark:bg-blue-900/40',
              },
              {
                label: 'Super Admins',
                count: admins.filter(a => a.role === 'Super Admin').length,
                icon: Crown,
                gradient: 'from-purple-500 to-purple-600',
                bg: 'bg-purple-50 dark:bg-purple-900/20',
                accent: 'bg-purple-500',
                text: 'text-purple-700 dark:text-purple-300',
                iconBg: 'bg-purple-100 dark:bg-purple-900/40',
              },
              {
                label: 'Regular Admins',
                count: admins.filter(a => a.role === 'Admin').length,
                icon: UserCheck,
                gradient: 'from-emerald-500 to-emerald-600',
                bg: 'bg-emerald-50 dark:bg-emerald-900/20',
                accent: 'bg-emerald-500',
                text: 'text-emerald-700 dark:text-emerald-300',
                iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
              },
            ].map((card, index) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                whileHover={{ y: -4 }}
                className={`relative overflow-hidden rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 ${card.bg} p-5 cursor-default`}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${card.accent} rounded-l-2xl`} />
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-slate-500 dark:text-slate-400'>{card.label}</p>
                    <p className={`text-3xl font-bold mt-1 ${card.text}`}>{card.count}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center`}>
                    <card.icon className={`w-6 h-6 ${card.text}`} />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className='bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden'
          >
            <div className="overflow-x-auto">
              <table className='w-full'>
                <thead className='bg-gradient-to-r from-brand-900 to-brand-800 text-white'>
                  <tr>
                    <th className='px-6 py-4 text-left text-sm font-semibold'>Image</th>
                    <th className='px-6 py-4 text-left text-sm font-semibold'>Name</th>
                    <th className='px-6 py-4 text-left text-sm font-semibold'>Email</th>
                    <th className='px-6 py-4 text-left text-sm font-semibold'>Role</th>
                    <th className='px-6 py-4 text-left text-sm font-semibold'>Phone</th>
                    <th className='px-6 py-4 text-left text-sm font-semibold'>Location</th>
                    <th className='px-6 py-4 text-left text-sm font-semibold'>Password</th>
                    <th className='px-6 py-4 text-center text-sm font-semibold'>Actions</th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-slate-100 dark:divide-slate-700'>
                  {admins.length === 0 ? (
                    <tr>
                      <td colSpan='8' className='px-6 py-12 text-center'>
                        <div className='flex flex-col items-center'>
                          <div className='w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4'>
                            <Shield className='w-8 h-8 text-slate-400 dark:text-slate-500' />
                          </div>
                          <p className='text-slate-600 dark:text-slate-400 font-medium'>No admins yet</p>
                          <p className='text-slate-400 dark:text-slate-500 text-sm'>Click "Add Admin" to create one.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    admins.map((admin, index) => (
                      <motion.tr 
                        key={admin.id} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className='hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200 group border-l-4 border-l-transparent hover:border-l-brand-900 dark:hover:border-l-blue-500'
                      >
                        <td className='px-6 py-4'>
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-brand-900 to-brand-800 flex items-center justify-center overflow-hidden ring-2 ring-offset-2 dark:ring-offset-slate-800 ${
                            admin.role === 'Super Admin'
                              ? 'ring-purple-500'
                              : admin.role === 'Moderator'
                                ? 'ring-amber-500'
                                : 'ring-blue-500'
                          }`}>
                            {admin.image ? (
                              <img src={admin.image} alt={admin.name} className='w-full h-full object-cover' />
                            ) : (
                              <span className='text-white font-semibold text-sm'>{admin.name?.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                        </td>
                        <td className='px-6 py-4 text-sm font-medium text-slate-800 dark:text-slate-200'>{admin.name}</td>
                        <td className='px-6 py-4 text-sm text-slate-600 dark:text-slate-400'>{admin.email}</td>
                        <td className='px-6 py-4'>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                            admin.role === 'Super Admin'
                              ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                              : admin.role === 'Moderator'
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                                : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                          }`}>
                            {admin.role}
                          </span>
                        </td>
                        <td className='px-6 py-4 text-sm text-slate-600 dark:text-slate-400'>{admin.phoneNo}</td>
                        <td className='px-6 py-4 text-sm text-slate-600 dark:text-slate-400'>{admin.location}</td>
                        <td className='px-6 py-4 text-sm text-slate-400 font-mono'>
                          {admin.password ? '••••••••' : 'Not set'}
                        </td>
                        <td className='px-6 py-4'>
                          <div className='flex items-center justify-center gap-2'>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleEdit(admin)}
                              className='p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-all duration-200'
                              title='Edit'
                            >
                              <Pencil className='w-4 h-4' />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setDeleteTarget(admin)}
                              className='p-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-all duration-200'
                              title='Delete'
                            >
                              <Trash2 className='w-4 h-4' />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}

      {/* Add/Edit Admin Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className='bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 text-white px-6 py-4 rounded-xl shadow-lg mb-6 flex items-center justify-between border border-white/10'
            >
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6" />
                <h1 className='text-xl md:text-2xl font-bold'>
                  {editingAdmin ? 'Edit Admin' : 'Create New Admin'}
                </h1>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowForm(false)}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </motion.button>
            </motion.div>

            <div className='bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 md:p-8 max-w-3xl'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                {/* Name */}
                <div>
                  <label className='block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2'>Name</label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none'>
                      <Users className='w-4 h-4 text-blue-400' />
                    </div>
                    <input
                      type='text'
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder='Enter name'
                      className='w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-slate-800 dark:text-slate-200'
                    />
                  </div>
                </div>

                {/* E-mail */}
                <div>
                  <label className='block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2'>E-mail</label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none'>
                      <Mail className='w-4 h-4 text-cyan-400' />
                    </div>
                    <input
                      type='email'
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder='Enter email'
                      className='w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 text-slate-800 dark:text-slate-200'
                    />
                  </div>
                </div>

                {/* Phone No */}
                <div>
                  <label className='block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2'>Phone No</label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none'>
                      <Phone className='w-4 h-4 text-emerald-400' />
                    </div>
                    <input
                      type='tel'
                      value={formData.phoneNo}
                      onChange={(e) => setFormData({ ...formData, phoneNo: e.target.value })}
                      placeholder='0345-5098765'
                      className='w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 text-slate-800 dark:text-slate-200'
                    />
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label className='block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2'>Role</label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none'>
                      <Shield className='w-4 h-4 text-purple-400' />
                    </div>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className='w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-slate-800 dark:text-slate-200'
                    >
                      <option value='Admin'>Admin</option>
                      <option value='Moderator'>Moderator</option>
                      <option value='Super Admin'>Super Admin</option>
                    </select>
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className='block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2'>Location</label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none'>
                      <MapPin className='w-4 h-4 text-rose-400' />
                    </div>
                    <input
                      type='text'
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder='Enter location'
                      className='w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all duration-300 text-slate-800 dark:text-slate-200'
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className='block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2'>
                    Password {!editingAdmin && <span className='text-red-500'>*</span>}
                  </label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none'>
                      <Lock className='w-4 h-4 text-amber-400' />
                    </div>
                    <input
                      type='text'
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={editingAdmin ? 'Current password shown' : 'Enter password'}
                      className='w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300 text-slate-800 dark:text-slate-200'
                    />
                  </div>
                  <p className='text-xs text-slate-500 dark:text-slate-400 mt-2'>
                    {editingAdmin
                      ? 'You can change the password by editing this field'
                      : 'This password will be used for admin login'}
                  </p>
                </div>

                {/* Attachment */}
                <div className='md:col-span-2'>
                  <label className='block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2'>Profile Image</label>
                  <label className='flex items-center justify-center gap-2 w-full px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-brand-900 dark:hover:border-blue-500 transition-all duration-300 text-slate-600 dark:text-slate-400'>
                    <Upload className='w-5 h-5' />
                    <span className='font-medium'>Click to upload image</span>
                    <input
                      type='file'
                      accept='image/*'
                      onChange={handleImageUpload}
                      className='hidden'
                    />
                  </label>
                  {formData.image && (
                    <div className='mt-4 flex items-center gap-4'>
                      <img src={formData.image} alt='Preview' className='w-16 h-16 rounded-xl object-cover border-2 border-slate-200 dark:border-slate-600' />
                      <button
                        onClick={() => setFormData({ ...formData, image: '' })}
                        className='text-red-500 hover:text-red-600 text-sm font-medium'
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className='flex gap-4 mt-8'>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  className='flex-1 bg-gradient-to-r from-brand-900 to-brand-800 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300'
                >
                  Save Admin
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowForm(false)}
                  className='px-8 py-3 border border-slate-300 dark:border-slate-600 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300'
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal - rendered via portal to avoid overflow clipping */}
      {createPortal(
        <AnimatePresence>
          {deleteTarget && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'
              onClick={() => setDeleteTarget(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className='bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-700'
              >
                <div className='w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center'>
                  <Trash2 className='w-7 h-7 text-red-600 dark:text-red-400' />
                </div>
                <h3 className='text-xl font-bold text-slate-800 dark:text-slate-100 text-center mb-2'>Confirm Delete</h3>
                <p className='text-slate-600 dark:text-slate-400 text-center mb-6'>
                  Are you sure you want to delete admin <span className='font-semibold text-slate-800 dark:text-slate-200'>"{deleteTarget.name}"</span>? This action cannot be undone.
                </p>
                <div className='flex gap-3'>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setDeleteTarget(null)}
                    className='flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-300'
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDelete}
                    className='flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300'
                  >
                    Delete
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}

export default Admin
