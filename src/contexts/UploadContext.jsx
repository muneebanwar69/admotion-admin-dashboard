import React, { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiUpload, FiCheck, FiX, FiLoader } from 'react-icons/fi'
import { db, storage } from '../firebase'
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { logAdCreated, logAdUpdated } from '../services/activityLogger'
import { MAX_BASE64_SIZE, MAX_VIDEO_SIZE_MB, MAX_IMAGE_DIMENSION, ERROR_MESSAGES } from '../constants'
import { sanitizeFormData } from '../utils/sanitize'
import { validateFile } from '../utils/fileValidation'

const UploadContext = createContext()

export const useUpload = () => {
  const context = useContext(UploadContext)
  if (!context) {
    throw new Error('useUpload must be used within UploadProvider')
  }
  return context
}

export const UploadProvider = ({ children }) => {
  const [uploads, setUploads] = useState([])

  // Compress image to fit within size limit
  const compressImage = (file, maxSizeBytes) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      img.onload = () => {
        // Start with original dimensions
        let width = img.width
        let height = img.height
        let quality = 0.8
        
        // Max dimension for reasonable quality
        const maxDimension = MAX_IMAGE_DIMENSION
        
        // Scale down if too large
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          } else {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }
        
        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        
        // Try different quality levels until under size limit
        const tryCompress = (q) => {
          const dataUrl = canvas.toDataURL('image/jpeg', q)
          const base64Size = dataUrl.length * 0.75 // Approximate actual size
          
          if (base64Size <= maxSizeBytes || q <= 0.1) {
            console.log(`✅ Compressed image: ${(base64Size / 1024).toFixed(0)}KB at quality ${q}`)
            resolve(dataUrl)
          } else {
            // Try lower quality
            tryCompress(q - 0.1)
          }
        }
        
        tryCompress(quality)
      }
      
      img.onerror = () => reject(new Error('Failed to load image for compression'))
      img.src = URL.createObjectURL(file)
    })
  }

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }

  // Upload video to Firebase Storage
  const uploadVideoToStorage = (file, uploadId, setUploads) => {
    return new Promise((resolve, reject) => {
      const fileName = `ads/videos/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
      const storageRef = ref(storage, fileName)
      const uploadTask = uploadBytesResumable(storageRef, file)

      uploadTask.on('state_changed',
        (snapshot) => {
          // Progress
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 60) + 20
          setUploads(prev => prev.map(u => 
            u.id === uploadId ? { ...u, progress, status: `Uploading... ${Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)}%` } : u
          ))
        },
        (error) => {
          // Error
          console.error('Storage upload error:', error)
          reject(error)
        },
        async () => {
          // Complete - get download URL
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
            console.log('✅ Video uploaded to Storage:', downloadURL)
            resolve(downloadURL)
          } catch (err) {
            reject(err)
          }
        }
      )
    })
  }

  // Start background upload
  const startUpload = useCallback(async (formData, file, editingId, userName, onSuccess, onError) => {
    const uploadId = Date.now() + Math.random()
    const isVideo = file?.type?.startsWith('video')
    const isImage = file?.type?.startsWith('image')
    
    // Add to uploads list
    setUploads(prev => [...prev, {
      id: uploadId,
      name: formData.title || 'New Ad',
      fileName: file?.name || 'No file',
      status: 'uploading',
      progress: 0,
      isVideo
    }])

    try {
      let saveData = { ...formData }
      
      // Process file if provided
      if (file) {
        // Validate file first
        setUploads(prev => prev.map(u => 
          u.id === uploadId ? { ...u, progress: 5, status: 'Validating file...' } : u
        ))

        const validation = await validateFile(file)
        if (!validation.valid) {
          throw new Error(validation.error || ERROR_MESSAGES.INVALID_FILE_TYPE)
        }

        const fileSizeMB = file.size / (1024 * 1024)
        console.log(`📁 Processing file: ${file.name} (${fileSizeMB.toFixed(2)} MB)`)

        // Update progress
        setUploads(prev => prev.map(u => 
          u.id === uploadId ? { ...u, progress: 10, status: 'Processing file...' } : u
        ))

        if (isVideo) {
          // Videos: Upload to Firebase Storage
          if (fileSizeMB > MAX_VIDEO_SIZE_MB) {
            throw new Error(`Video must be under ${MAX_VIDEO_SIZE_MB}MB. Your file is ${fileSizeMB.toFixed(1)}MB.`)
          }
          
          setUploads(prev => prev.map(u => 
            u.id === uploadId ? { ...u, progress: 15, status: 'Uploading video...' } : u
          ))
          
          // Upload to Firebase Storage and get URL
          const videoURL = await uploadVideoToStorage(file, uploadId, setUploads)
          
          saveData = {
            ...saveData,
            preview: videoURL,
            mediaUrl: videoURL,
            mediaBase64: '', // Don't store base64 for videos
            mediaType: 'Video',
            type: 'Video',
            mediaSize: fileSizeMB.toFixed(2) + ' MB',
            mediaName: file.name,
            storageRef: `ads/videos/${Date.now()}_${file.name}`
          }
        } else if (isImage) {
          // Images: Compress to fit in Firestore
          setUploads(prev => prev.map(u => 
            u.id === uploadId ? { ...u, progress: 30, status: 'Compressing image...' } : u
          ))
          
          const base64Data = await compressImage(file, MAX_BASE64_SIZE)
          
          setUploads(prev => prev.map(u => 
            u.id === uploadId ? { ...u, progress: 60, status: 'Preparing to save...' } : u
          ))

          const finalSizeKB = (base64Data.length * 0.75) / 1024
          console.log(`📦 Final image size: ${finalSizeKB.toFixed(0)} KB`)

          saveData = {
            ...saveData,
            preview: base64Data,
            mediaBase64: base64Data,
            mediaType: 'Image',
            type: 'Image',
            mediaSize: (finalSizeKB / 1024).toFixed(2) + ' MB',
            mediaName: file.name
          }
        } else {
          throw new Error('Unsupported file type. Please upload an image or video.')
        }
      }

      // Remove blob URL if exists
      if (saveData.preview?.startsWith('blob:')) {
        saveData.preview = saveData.mediaUrl || saveData.mediaBase64 || ''
      }

      setUploads(prev => prev.map(u => 
        u.id === uploadId ? { ...u, progress: 85, status: 'Saving to database...' } : u
      ))

      // Sanitize data before saving
      const sanitizedData = sanitizeFormData(saveData)

      // Save to Firestore
      if (editingId) {
        const docRef = doc(db, "ads", editingId)
        await updateDoc(docRef, { ...sanitizedData, updatedAt: new Date().toISOString() })
        await logAdUpdated(sanitizedData, userName)
      } else {
        sanitizedData.createdAt = new Date().toISOString()
        await addDoc(collection(db, "ads"), sanitizedData)
        await logAdCreated(sanitizedData, userName)
      }

      // Success!
      setUploads(prev => prev.map(u => 
        u.id === uploadId ? { ...u, progress: 100, status: 'completed' } : u
      ))

      // Remove from list after 3 seconds
      setTimeout(() => {
        setUploads(prev => prev.filter(u => u.id !== uploadId))
      }, 3000)

      onSuccess?.()
    } catch (error) {
      console.error('Upload failed:', error)
      
      setUploads(prev => prev.map(u => 
        u.id === uploadId ? { ...u, status: 'failed', error: error.message } : u
      ))

      // Remove from list after 8 seconds
      setTimeout(() => {
        setUploads(prev => prev.filter(u => u.id !== uploadId))
      }, 8000)

      onError?.(error)
    }
  }, [])

  // Cancel upload (remove from UI)
  const cancelUpload = useCallback((uploadId) => {
    setUploads(prev => prev.filter(u => u.id !== uploadId))
  }, [])

  const value = {
    uploads,
    startUpload,
    cancelUpload,
    isUploading: uploads.some(u => u.status === 'uploading' || u.status === 'Reading file...' || u.status === 'Processing...' || u.status === 'Saving to database...')
  }

  return (
    <UploadContext.Provider value={value}>
      {children}
      
      {/* Upload Progress Panel - Fixed position, always visible */}
      <AnimatePresence>
        {uploads.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="fixed bottom-4 right-4 z-[9999] w-80"
          >
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <div className="flex items-center gap-2">
                  <FiUpload className="w-4 h-4" />
                  <span className="font-semibold text-sm">Uploads</span>
                  <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">
                    {uploads.filter(u => u.status !== 'completed' && u.status !== 'failed').length} active
                  </span>
                </div>
              </div>

              {/* Upload Items */}
              <div className="max-h-60 overflow-y-auto">
                {uploads.map((upload) => (
                  <div key={upload.id} className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                    <div className="flex items-center gap-3">
                      {/* Status Icon */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        upload.status === 'completed' 
                          ? 'bg-green-100 text-green-600' 
                          : upload.status === 'failed'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {upload.status === 'completed' ? (
                          <FiCheck className="w-4 h-4" />
                        ) : upload.status === 'failed' ? (
                          <FiX className="w-4 h-4" />
                        ) : (
                          <FiLoader className="w-4 h-4 animate-spin" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                          {upload.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {upload.status === 'completed' ? 'Upload complete!' 
                            : upload.status === 'failed' ? upload.error || 'Upload failed'
                            : typeof upload.status === 'string' ? upload.status 
                            : `${upload.progress}%`}
                        </p>
                      </div>

                      {/* Close Button */}
                      <button
                        onClick={() => cancelUpload(upload.id)}
                        className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Progress Bar */}
                    {upload.status !== 'completed' && upload.status !== 'failed' && (
                      <div className="mt-2 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${upload.progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </UploadContext.Provider>
  )
}
