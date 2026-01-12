import React, { useState, useEffect } from 'react'
import { FiUpload, FiEdit, FiTrash2 } from 'react-icons/fi'
import { db } from '../firebase'
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore'
import { useAuth } from '../contexts/AuthContext'
import { logAdminCreated, logAdminUpdated, logAdminDeleted } from '../services/activityLogger'

const Admin = () => {
  const [admins, setAdmins] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const { currentUser } = useAuth()

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
      alert('Please fill in all required fields')
      return
    }

    // Validate password
    if (!formData.password) {
      alert('Password is required')
      return
    }
    
    try {
      if (editingAdmin) {
        const adminRef = doc(db, 'admins', editingAdmin)
        const updateData = {
          name: formData.name,
          email: formData.email,
          phoneNo: formData.phoneNo,
          role: formData.role,
          location: formData.location,
          image: formData.image,
          password: formData.password, // Always save password
          updatedAt: serverTimestamp()
        }
        await updateDoc(adminRef, updateData)
        await logAdminUpdated({
          name: formData.name,
          email: formData.email,
          role: formData.role
        }, userName)
      } else {
        await addDoc(collection(db, 'admins'), {
          name: formData.name,
          email: formData.email,
          phoneNo: formData.phoneNo,
          role: formData.role,
          location: formData.location,
          image: formData.image,
          password: formData.password,
          createdAt: serverTimestamp()
        })
        await logAdminCreated({
          name: formData.name,
          email: formData.email,
          role: formData.role
        }, userName)
      }
      setShowForm(false)
    } catch (error) {
      console.error('Error saving admin:', error)
      alert('Failed to save admin: ' + error.message)
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
      <div className='p-6 bg-gray-50 min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading...</p>
        </div>
      </div>
    )
  }

  // Access Control: Only Super Admin can access this page
  if (!isSuperAdmin) {
  return (
      <div className='p-6 bg-gray-50 min-h-screen flex items-center justify-center'>
        <div className='text-center bg-white p-8 rounded-lg shadow-lg max-w-md'>
          <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <svg className='w-8 h-8 text-red-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
            </svg>
          </div>
          <h2 className='text-2xl font-bold text-gray-800 mb-2'>Access Denied</h2>
          <p className='text-gray-600 mb-4'>
            You don't have permission to access this page. Only Super Admins can manage admin accounts.
          </p>
          <p className='text-sm text-gray-500'>
            Current Role: <span className='font-semibold'>{currentUser?.role || 'User'}</span>
          </p>
        </div>
      </div>
    )
  }

              return (
    <div className='p-6'>
      {/* Admin List View */}
      {!showForm && (
        <div>
          <div className='flex items-center justify-between mb-6'>
            <h1 className='text-2xl font-bold text-gray-800'>Admin Management</h1>
                <button
              onClick={handleAddAdmin}
              className='bg-[#101c44] text-white px-6 py-2.5 rounded-lg hover:bg-[#182b5b] transition-all duration-200 transform hover:scale-105 font-medium'
            >
              Add Admin
                </button>
              </div>

          <div className='bg-white rounded-lg shadow-sm border overflow-hidden'>
            <table className='w-full'>
                  <thead className='bg-[#101c44] text-white'>
                    <tr>
                  <th className='px-6 py-4 text-left text-sm font-semibold'>Image</th>
                  <th className='px-6 py-4 text-left text-sm font-semibold'>Name</th>
                  <th className='px-6 py-4 text-left text-sm font-semibold'>Email</th>
                  <th className='px-6 py-4 text-left text-sm font-semibold'>Role</th>
                  <th className='px-6 py-4 text-left text-sm font-semibold'>Phone no</th>
                  <th className='px-6 py-4 text-left text-sm font-semibold'>Location</th>
                  <th className='px-6 py-4 text-left text-sm font-semibold'>Password</th>
                  <th className='px-6 py-4 text-center text-sm font-semibold'>Actions</th>
                    </tr>
                  </thead>
              <tbody className='divide-y divide-gray-200'>
                {admins.length === 0 ? (
                  <tr>
                    <td colSpan='8' className='px-6 py-12 text-center text-gray-500'>
                      No admins yet. Click "Add Admin" to create one.
                    </td>
                  </tr>
                ) : (
                  admins.map((admin) => (
                    <tr key={admin.id} className='hover:bg-gray-50 transition-colors duration-150'>
                      <td className='px-6 py-4'>
                        <div className='w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden'>
                          {admin.image ? (
                            <img src={admin.image} alt={admin.name} className='w-full h-full object-cover' />
                          ) : (
                            <span className='text-gray-500 text-xs'>No img</span>
                          )}
                          </div>
                        </td>
                      <td className='px-6 py-4 text-sm text-gray-900'>{admin.name}</td>
                      <td className='px-6 py-4 text-sm text-gray-600'>{admin.email}</td>
                      <td className='px-6 py-4 text-sm text-gray-900'>{admin.role}</td>
                      <td className='px-6 py-4 text-sm text-gray-600'>{admin.phoneNo}</td>
                      <td className='px-6 py-4 text-sm text-gray-600'>{admin.location}</td>
                      <td className='px-6 py-4 text-sm text-gray-600 font-mono'>
                        {admin.password ? '••••••••' : 'Not set'}
                        </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center justify-center gap-3'>
                            <button
                            onClick={() => handleEdit(admin)}
                            className='text-blue-600 hover:text-blue-800 transition-colors duration-200'
                            title='Edit'
                            >
                            <FiEdit className='w-5 h-5' />
                            </button>
                            <button
                            onClick={() => setDeleteTarget(admin)}
                            className='text-red-600 hover:text-red-800 transition-colors duration-200'
                            title='Delete'
                          >
                            <FiTrash2 className='w-5 h-5' />
                            </button>
                          </div>
                        </td>
                      </tr>
                  ))
                )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

      {/* Add/Edit Admin Form */}
      {showForm && (
            <div>
          <div className='mb-6'>
            <h1 className='text-2xl font-bold text-gray-800'>
              {editingAdmin ? 'Edit Admin' : 'Create NEW ADMIN'}
            </h1>
                    </div>

          <div className='bg-white rounded-lg shadow-sm border p-8 max-w-3xl'>
            <h2 className='text-lg font-semibold text-gray-800 mb-6'>Admin Management</h2>

            <div className='grid grid-cols-2 gap-6'>
              {/* Name */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Name</label>
                <input
                  type='text'
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder='Zohaib'
                  className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                />
                    </div>

              {/* E-mail */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>E-mail</label>
                <input
                  type='email'
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder='zohaib@gmail.com'
                  className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                />
                  </div>

              {/* Phone No */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Phone No</label>
                <input
                  type='tel'
                  value={formData.phoneNo}
                  onChange={(e) => setFormData({ ...formData, phoneNo: e.target.value })}
                  placeholder='0345-5098765'
                  className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                />
                </div>

              {/* Role */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                >
                  <option value='Admin'>Admin</option>
                  <option value='Moderator'>Moderator</option>
                  <option value='Super Admin'>Super Admin</option>
                </select>
              </div>

              {/* Location */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Location</label>
                <input
                  type='text'
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder='DHA'
                  className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                />
            </div>

              {/* Password */}
            <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Password {!editingAdmin && <span className='text-red-500'>*</span>}
                </label>
                <input
                  type='text'
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={editingAdmin ? 'Current password shown' : 'Enter password'}
                  className='w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
                />
                <p className='text-xs text-gray-500 mt-1'>
                  {editingAdmin 
                    ? 'You can change the password by editing this field' 
                    : 'This password will be used for admin login (use email as username)'}
                </p>
                </div>

              {/* Attachment */}
              <div className='col-span-2'>
                <label className='block text-sm font-medium text-gray-700 mb-2'>Attachment</label>
                <label className='flex items-center justify-center gap-2 w-full px-4 py-2.5 border border-gray-300 rounded-lg cursor-pointer bg-[#101c44] text-white hover:bg-[#182b5b] transition-all duration-200'>
                  <FiUpload className='w-4 h-4' />
                  Upload Image
                  <input
                    type='file'
                    accept='image/*'
                    onChange={handleImageUpload}
                    className='hidden'
                  />
                </label>
                {formData.image && (
                  <div className='mt-2'>
                    <img src={formData.image} alt='Preview' className='w-20 h-20 rounded-lg object-cover' />
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className='flex gap-4 mt-8'>
              <button
                onClick={handleSave}
                className='bg-[#101c44] text-white px-8 py-2.5 rounded-lg hover:bg-[#182b5b] transition-all duration-200 transform hover:scale-105 font-medium'
              >
                Save
              </button>
              <button
                onClick={() => setShowForm(false)}
                className='bg-gray-200 text-gray-700 px-8 py-2.5 rounded-lg hover:bg-gray-300 transition-all duration-200 transform hover:scale-105 font-medium'
              >
                Cancel
              </button>
                      </div>
                    </div>
                  </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg shadow-xl p-6 w-96'>
            <h3 className='text-lg font-semibold text-gray-800 mb-4'>Confirm Delete</h3>
            <p className='text-gray-600 mb-6'>
              Are you sure you want to delete admin "{deleteTarget.name}"? This action cannot be undone.
            </p>
            <div className='flex justify-end gap-4'>
              <button
                onClick={() => setDeleteTarget(null)}
                className='px-4 py-2 border rounded-lg hover:bg-gray-50 transition-all duration-200'
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className='px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200'
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
  </div>
)
}

export default Admin
