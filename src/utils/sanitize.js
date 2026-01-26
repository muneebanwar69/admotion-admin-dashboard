import DOMPurify from 'dompurify'

/**
 * Sanitize a string to prevent XSS attacks
 * @param {string} input - String to sanitize
 * @param {boolean} allowHTML - Whether to allow HTML tags (default: false)
 * @returns {string} Sanitized string
 */
export const sanitizeString = (input, allowHTML = false) => {
  if (input === null || input === undefined) {
    return ''
  }
  
  if (typeof input !== 'string') {
    return String(input)
  }
  
  if (allowHTML) {
    // Allow safe HTML tags
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href', 'target']
    })
  }
  
  // Strip all HTML tags
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })
}

/**
 * Sanitize an object recursively
 * @param {object} obj - Object to sanitize
 * @param {boolean} allowHTML - Whether to allow HTML in strings
 * @returns {object} Sanitized object
 */
export const sanitizeObject = (obj, allowHTML = false) => {
  if (obj === null || obj === undefined) {
    return obj
  }
  
  if (typeof obj === 'string') {
    return sanitizeString(obj, allowHTML)
  }
  
  if (typeof obj !== 'object') {
    return obj
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, allowHTML))
  }
  
  const sanitized = {}
  for (const [key, value] of Object.entries(obj)) {
    // Skip certain fields that might contain valid base64 or URLs
    if (key === 'preview' || key === 'mediaBase64' || key === 'mediaUrl' || key === 'image') {
      sanitized[key] = value
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value, allowHTML)
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value, allowHTML)
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}

/**
 * Sanitize form data before submission
 * @param {object} formData - Form data to sanitize
 * @returns {object} Sanitized form data
 */
export const sanitizeFormData = (formData) => {
  return sanitizeObject(formData, false)
}
