// src/services/impressions.js
// Sends ad-play impressions to the backend, which estimates real-world reach
// (area x time x weather). Falls back to a direct Firestore write when the
// backend is unreachable (e.g. vehicle offline) so no data is ever lost.
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import logger from '../utils/logger'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

/**
 * Log a single ad play.
 * @returns {Promise<{ok:boolean, estimatedReach?:number, method?:string, fallback?:boolean}>}
 */
export async function logImpression({ adId, vehicleId, carId, lat, lon, duration = 10 }) {
  if (!adId || !vehicleId) return { ok: false }

  // 1. Primary path: backend computes & stores enriched, ML-ready impression.
  try {
    const res = await fetch(`${API_URL}/api/impressions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adId,
        vehicleId,
        duration,
        adPlays: 1,
        lat: lat ?? null,
        lon: lon ?? null,
      }),
    })
    if (res.ok) return await res.json()
    throw new Error(`Impression API ${res.status}`)
  } catch (err) {
    // 2. Offline fallback: raw Firestore write (reach estimated later/server-side).
    try {
      await addDoc(collection(db, 'impressions'), {
        adId,
        vehicleId,
        carId: carId || '',
        duration,
        adPlays: 1,
        lat: lat ?? null,
        lon: lon ?? null,
        estimatedReach: 1, // conservative placeholder until reconciled
        method: 'offline-fallback',
        timestamp: serverTimestamp(),
        date: new Date().toISOString().split('T')[0],
      })
      return { ok: true, fallback: true }
    } catch (e) {
      logger.error('Impression logging failed (backend + fallback):', err, e)
      return { ok: false }
    }
  }
}
