import { openDB } from 'idb'

const DB_NAME = 'admotion_cache'
const STORE_NAME = 'ads'
const CDN_BASE_URL = import.meta.env.VITE_CDN_BASE_URL || 'https://cdn.admotion.com'

let dbInstance = null

// Initialize IndexedDB
async function getDB() {
  if (dbInstance) return dbInstance

  try {
    dbInstance = await openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      },
    })
    console.log('✅ IndexedDB initialized')
    return dbInstance
  } catch (error) {
    console.error('❌ IndexedDB initialization failed:', error)
    throw error
  }
}

// Convert blob to base64
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Download and cache ad
export async function downloadAndCacheAd(adId, adData) {
  const db = await getDB()
  
  try {
    // Check if already cached
    const cached = await db.get(STORE_NAME, adId)
    if (cached && cached.media_data) {
      console.log(`✅ Ad ${adId} loaded from cache`)
      return cached
    }

    // Get media URL
    const mediaUrl = adData.media_url || adData.preview || adData.mediaUrl
    
    if (!mediaUrl) {
      throw new Error(`No media URL found for ad ${adId}`)
    }

    // Construct full URL if relative
    const fullMediaUrl = mediaUrl.startsWith('http') 
      ? mediaUrl 
      : `${CDN_BASE_URL}/${mediaUrl}`

    console.log(`⬇️ Downloading ad ${adId} from: ${fullMediaUrl}`)

    // Download media file
    const mediaResponse = await fetch(fullMediaUrl)
    
    if (!mediaResponse.ok) {
      throw new Error(`Failed to download media: ${mediaResponse.statusText}`)
    }

    const blob = await mediaResponse.blob()
    const base64 = await blobToBase64(blob)

    // Create ad object with cached data
    const ad = {
      id: adId,
      ...adData,
      media_data: base64,
      media_url: fullMediaUrl,
      cached_at: new Date().toISOString(),
      file_size_mb: (blob.size / 1024 / 1024).toFixed(2)
    }

    // Save to IndexedDB
    await db.put(STORE_NAME, ad, adId)
    
    console.log(`✅ Ad ${adId} cached successfully (${ad.file_size_mb} MB)`)
    return ad
  } catch (error) {
    console.error(`❌ Failed to cache ad ${adId}:`, error)
    throw error
  }
}

// Get cached ad
export async function getCachedAd(adId) {
  const db = await getDB()
  try {
    const ad = await db.get(STORE_NAME, adId)
    return ad || null
  } catch (error) {
    console.error(`❌ Failed to get cached ad ${adId}:`, error)
    return null
  }
}

// Clear all cached ads
export async function clearCache() {
  const db = await getDB()
  try {
    await db.clear(STORE_NAME)
    console.log('✅ Cache cleared')
  } catch (error) {
    console.error('❌ Failed to clear cache:', error)
  }
}

// Get cache size
export async function getCacheSize() {
  const db = await getDB()
  try {
    const allAds = await db.getAll(STORE_NAME)
    const totalSize = allAds.reduce((sum, ad) => {
      if (ad.media_data) {
        // Approximate size (base64 is ~33% larger)
        return sum + (ad.media_data.length * 0.75)
      }
      return sum
    }, 0)
    
    return {
      count: allAds.length,
      size_mb: (totalSize / 1024 / 1024).toFixed(2)
    }
  } catch (error) {
    console.error('❌ Failed to get cache size:', error)
    return { count: 0, size_mb: 0 }
  }
}





