/**
 * Rate Limiter for preventing brute force attacks
 */
class RateLimiter {
  constructor(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    this.maxAttempts = maxAttempts
    this.windowMs = windowMs
    this.attempts = new Map()
  }

  /**
   * Check if an action is allowed for the given identifier
   * @param {string} identifier - Unique identifier (e.g., username, IP)
   * @returns {boolean} True if allowed
   */
  isAllowed(identifier) {
    const now = Date.now()
    const userAttempts = this.attempts.get(identifier)

    if (!userAttempts) {
      this.attempts.set(identifier, { count: 1, resetTime: now + this.windowMs })
      return true
    }

    // Reset if window has passed
    if (now > userAttempts.resetTime) {
      this.attempts.set(identifier, { count: 1, resetTime: now + this.windowMs })
      return true
    }

    // Check if max attempts reached
    if (userAttempts.count >= this.maxAttempts) {
      return false
    }

    // Increment count
    userAttempts.count++
    this.attempts.set(identifier, userAttempts)
    return true
  }

  /**
   * Get remaining time until reset (in milliseconds)
   * @param {string} identifier - Unique identifier
   * @returns {number} Remaining time in milliseconds
   */
  getRemainingTime(identifier) {
    const userAttempts = this.attempts.get(identifier)
    if (!userAttempts) return 0
    return Math.max(0, userAttempts.resetTime - Date.now())
  }

  /**
   * Reset attempts for an identifier
   * @param {string} identifier - Unique identifier
   */
  reset(identifier) {
    this.attempts.delete(identifier)
  }

  /**
   * Get current attempt count
   * @param {string} identifier - Unique identifier
   * @returns {number} Current attempt count
   */
  getAttemptCount(identifier) {
    const userAttempts = this.attempts.get(identifier)
    return userAttempts ? userAttempts.count : 0
  }

  /**
   * Clean up old entries (call periodically)
   */
  cleanup() {
    const now = Date.now()
    for (const [identifier, attempts] of this.attempts.entries()) {
      if (now > attempts.resetTime) {
        this.attempts.delete(identifier)
      }
    }
  }
}

// Create rate limiters for different operations
export const loginRateLimiter = new RateLimiter(5, 15 * 60 * 1000) // 5 attempts per 15 minutes
export const apiRateLimiter = new RateLimiter(100, 60 * 1000) // 100 requests per minute

// Cleanup old entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    loginRateLimiter.cleanup()
    apiRateLimiter.cleanup()
  }, 5 * 60 * 1000)
}
