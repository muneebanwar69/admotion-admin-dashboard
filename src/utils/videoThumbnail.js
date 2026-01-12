// src/utils/videoThumbnail.js

/**
 * Generate a thumbnail from a video file
 * @param {File} videoFile - The video file
 * @param {number} timeInSeconds - Time in seconds to capture thumbnail (default: 1)
 * @returns {Promise<Blob>} - Thumbnail blob
 */
export const generateVideoThumbnail = (videoFile, timeInSeconds = 1) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    video.addEventListener('loadedmetadata', () => {
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      // Seek to the specified time
      video.currentTime = Math.min(timeInSeconds, video.duration)
    })

    video.addEventListener('seeked', () => {
      try {
        // Draw the current frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        
        // Convert canvas to blob
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to generate thumbnail'))
          }
        }, 'image/jpeg', 0.8)
      } catch (error) {
        reject(error)
      }
    })

    video.addEventListener('error', (e) => {
      reject(new Error('Video loading error: ' + e.message))
    })

    // Load the video file
    video.src = URL.createObjectURL(videoFile)
    video.load()
  })
}

/**
 * Generate multiple thumbnails from a video file
 * @param {File} videoFile - The video file
 * @param {number[]} timeStamps - Array of timestamps in seconds
 * @returns {Promise<Blob[]>} - Array of thumbnail blobs
 */
export const generateMultipleThumbnails = async (videoFile, timeStamps = [1, 5, 10]) => {
  const thumbnails = []
  
  for (const timestamp of timeStamps) {
    try {
      const thumbnail = await generateVideoThumbnail(videoFile, timestamp)
      thumbnails.push(thumbnail)
    } catch (error) {
      console.warn(`Failed to generate thumbnail at ${timestamp}s:`, error)
    }
  }
  
  return thumbnails
}

/**
 * Get video duration in seconds
 * @param {File} videoFile - The video file
 * @returns {Promise<number>} - Duration in seconds
 */
export const getVideoDuration = (videoFile) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    
    video.addEventListener('loadedmetadata', () => {
      resolve(video.duration)
      URL.revokeObjectURL(video.src)
    })
    
    video.addEventListener('error', (e) => {
      reject(new Error('Video loading error: ' + e.message))
    })
    
    video.src = URL.createObjectURL(videoFile)
    video.load()
  })
}

/**
 * Get video dimensions
 * @param {File} videoFile - The video file
 * @returns {Promise<{width: number, height: number}>} - Video dimensions
 */
export const getVideoDimensions = (videoFile) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    
    video.addEventListener('loadedmetadata', () => {
      resolve({
        width: video.videoWidth,
        height: video.videoHeight
      })
      URL.revokeObjectURL(video.src)
    })
    
    video.addEventListener('error', (e) => {
      reject(new Error('Video loading error: ' + e.message))
    })
    
    video.src = URL.createObjectURL(videoFile)
    video.load()
  })
}

