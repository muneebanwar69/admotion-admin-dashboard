/**
 * Application Constants
 * Centralized configuration values
 */

// File Upload Limits
export const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
export const MAX_IMAGE_SIZE = 700 * 1024 // 700KB base64 = ~500KB file
export const MAX_BASE64_SIZE = 700 * 1024 // 700KB base64 = ~500KB file (alias for MAX_IMAGE_SIZE)
export const MAX_VIDEO_SIZE_MB = 100 // 100MB max for videos
export const MAX_IMAGE_DIMENSION = 1200 // Max width/height for images

// Firestore Collection Names
export const COLLECTIONS = {
  ADS: 'ads',
  VEHICLES: 'vehicles',
  ADMINS: 'admins',
  ACTIVITY_LOGS: 'activityLogs',
  CAMPAIGNS: 'campaigns',
  USERS: 'users'
}

// User Roles
export const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  USER: 'User'
}

// Vehicle Status
export const VEHICLE_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  MAINTENANCE: 'Maintenance'
}

// Ad Status
export const AD_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PENDING: 'Pending',
  EXPIRED: 'Expired'
}

// Media Types
export const MEDIA_TYPES = {
  IMAGE: 'Image',
  VIDEO: 'Video'
}

// Pagination
export const DEFAULT_PAGE_SIZE = 20
export const MAX_PAGE_SIZE = 100

// Rate Limiting
export const RATE_LIMITS = {
  LOGIN_ATTEMPTS: 5,
  LOGIN_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  API_REQUESTS: 100,
  API_WINDOW_MS: 60 * 1000 // 1 minute
}

// Session
export const SESSION_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

// Geocoding
export const GEOCODE_CACHE_SIZE = 1000
export const GEOCODE_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

// File Validation
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg']

// File Signatures (magic numbers) for validation
export const FILE_SIGNATURES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  'image/gif': [0x47, 0x49, 0x46, 0x38],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header
  'video/mp4': [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], // ftyp box
  'video/webm': [0x1A, 0x45, 0xDF, 0xA3], // EBML header
}

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Invalid username or password',
  TOO_MANY_ATTEMPTS: 'Too many login attempts. Please try again later.',
  PERMISSION_DENIED: 'You do not have permission to perform this action',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  VALIDATION_ERROR: 'Please check your input and try again',
  FILE_TOO_LARGE: 'File size exceeds the maximum allowed size',
  INVALID_FILE_TYPE: 'Invalid file type. Please upload a valid image or video.',
  REQUIRED_FIELD: 'This field is required'
}

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logged out successfully',
  SAVE_SUCCESS: 'Saved successfully',
  DELETE_SUCCESS: 'Deleted successfully',
  UPDATE_SUCCESS: 'Updated successfully',
  UPLOAD_SUCCESS: 'Upload completed successfully'
}
