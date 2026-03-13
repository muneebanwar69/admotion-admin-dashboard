import { FILE_SIGNATURES, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, ERROR_MESSAGES, MAX_FILE_SIZE, MAX_VIDEO_SIZE_MB } from '../constants'

/**
 * Validate file signature (magic numbers) to prevent file type spoofing
 * @param {File} file - File to validate
 * @param {string} expectedType - Expected MIME type
 * @returns {Promise<boolean>} True if signature matches
 */
export const validateFileSignature = async (file, expectedType) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const bytes = new Uint8Array(e.target.result)
        const signature = FILE_SIGNATURES[expectedType]
        
        if (!signature) {
          // Unknown type - allow if it's in allowed types list
          if (ALLOWED_IMAGE_TYPES.includes(expectedType) || ALLOWED_VIDEO_TYPES.includes(expectedType)) {
            resolve(true)
          } else {
            resolve(false)
          }
          return
        }

        // Special handling for MP4 where box size bytes can vary
        if (expectedType === 'video/mp4') {
          const hasFtypBox = bytes.length >= 8
            && bytes[4] === 0x66
            && bytes[5] === 0x74
            && bytes[6] === 0x79
            && bytes[7] === 0x70
          resolve(hasFtypBox)
          return
        }

        // Check if file signature matches
        const matches = signature.every((byte, index) => bytes[index] === byte)
        resolve(matches)
      } catch (error) {
        console.error('Error validating file signature:', error)
        resolve(false)
      }
    }
    
    reader.onerror = () => {
      resolve(false)
    }
    
    // Read first 20 bytes to check signature
    reader.readAsArrayBuffer(file.slice(0, 20))
  })
}

/**
 * Validate file type and size
 * @param {File} file - File to validate
 * @returns {{ valid: boolean, error?: string }} Validation result
 */
export const validateFile = async (file) => {
  // Check file size
  const fileSizeMB = file.size / (1024 * 1024)
  
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: ERROR_MESSAGES.FILE_TOO_LARGE
    }
  }

  // Check MIME type
  const isImage = file.type.startsWith('image/')
  const isVideo = file.type.startsWith('video/')
  
  if (!isImage && !isVideo) {
    return {
      valid: false,
      error: ERROR_MESSAGES.INVALID_FILE_TYPE
    }
  }

  // Check if MIME type is in allowed list
  if (isImage && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Image type ${file.type} is not allowed. Allowed types: ${ALLOWED_IMAGE_TYPES.join(', ')}`
    }
  }

  if (isVideo && !ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Video type ${file.type} is not allowed. Allowed types: ${ALLOWED_VIDEO_TYPES.join(', ')}`
    }
  }

  // Validate file signature
  const expectedType = file.type
  const signatureValid = await validateFileSignature(file, expectedType)
  
  if (!signatureValid) {
    return {
      valid: false,
      error: 'File signature does not match file type. The file may be corrupted or malicious.'
    }
  }

  // Check video size limit
  if (isVideo && fileSizeMB > MAX_VIDEO_SIZE_MB) {
    return {
      valid: false,
      error: `Video must be under ${MAX_VIDEO_SIZE_MB}MB. Your file is ${fileSizeMB.toFixed(1)}MB.`
    }
  }

  return { valid: true }
}

/**
 * Get file extension from filename
 * @param {string} filename - Filename
 * @returns {string} File extension (lowercase)
 */
export const getFileExtension = (filename) => {
  return filename.split('.').pop()?.toLowerCase() || ''
}

/**
 * Validate file extension
 * @param {string} filename - Filename
 * @param {string[]} allowedExtensions - Allowed extensions
 * @returns {boolean} True if extension is allowed
 */
export const validateFileExtension = (filename, allowedExtensions) => {
  const extension = getFileExtension(filename)
  return allowedExtensions.includes(extension)
}
