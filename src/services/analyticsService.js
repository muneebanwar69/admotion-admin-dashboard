// src/services/analyticsService.js
// Aggregates the real `impressions` collection into chart-ready datasets.
// Every impression doc carries: adId, vehicleId, estimatedReach, area,
// areaType, weather, timeSlot, hour, date, timestamp.
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import logger from '../utils/logger'

const DAY_MS = 86_400_000

function periodCutoff(period) {
  const now = new Date()
  if (period === 'This Week') return new Date(now - 7 * DAY_MS)
  if (period === 'This Month') return new Date(now - 30 * DAY_MS)
  // Today -> start of today
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

function dateKey(d) {
  return d.toISOString().split('T')[0]
}

/**
 * Fetch + aggregate impressions for a period.
 * @returns {Promise<{
 *   totalReach:number, totalPlays:number, impressionDocs:number,
 *   trend:Array<{label:string,value:number}>,
 *   byAreaType:Array<{label:string,value:number}>,
 *   byArea:Array<{label:string,value:number}>,
 *   topAds:Array<{adId:string,reach:number,plays:number}>,
 *   byWeather:Array<{label:string,value:number}>,
 *   peakHours:Array<{label:string,value:number}>,
 *   hasData:boolean
 * }>}
 */
export async function getAnalytics(period = 'Today') {
  const cutoffKey = dateKey(periodCutoff(period))
  const empty = {
    totalReach: 0, totalPlays: 0, impressionDocs: 0,
    trend: [], byAreaType: [], byArea: [], topAds: [],
    byWeather: [], peakHours: [], hasData: false,
  }

  let docs = []
  try {
    // Indexed range query on the denormalised `date` string.
    const q = query(
      collection(db, 'impressions'),
      where('date', '>=', cutoffKey),
      orderBy('date', 'asc'),
    )
    const snap = await getDocs(q)
    docs = snap.docs.map(d => d.data())
  } catch (err) {
    // Missing composite index or other error -> fall back to full scan.
    logger.warn('Analytics indexed query failed, scanning all:', err?.message)
    try {
      const snap = await getDocs(collection(db, 'impressions'))
      docs = snap.docs.map(d => d.data()).filter(d => (d.date || '') >= cutoffKey)
    } catch (e) {
      logger.error('Analytics fallback scan failed:', e)
      return empty
    }
  }

  if (docs.length === 0) return empty

  const reachOf = d => Number(d.estimatedReach) || Number(d.adPlays) || 1
  const playsOf = d => Number(d.adPlays) || 1

  const trendMap = new Map()
  const areaTypeMap = new Map()
  const areaMap = new Map()
  const adMap = new Map()
  const weatherMap = new Map()
  const hourMap = new Map()
  let totalReach = 0
  let totalPlays = 0

  for (const d of docs) {
    const r = reachOf(d)
    const p = playsOf(d)
    totalReach += r
    totalPlays += p

    const dk = d.date || dateKey(new Date())
    trendMap.set(dk, (trendMap.get(dk) || 0) + r)

    const at = d.areaType || 'unknown'
    areaTypeMap.set(at, (areaTypeMap.get(at) || 0) + r)

    const ar = d.area || d.city || 'Unknown'
    areaMap.set(ar, (areaMap.get(ar) || 0) + r)

    if (d.adId) {
      const cur = adMap.get(d.adId) || { reach: 0, plays: 0 }
      cur.reach += r; cur.plays += p
      adMap.set(d.adId, cur)
    }

    const w = d.weather || 'sunny'
    weatherMap.set(w, (weatherMap.get(w) || 0) + r)

    if (d.hour != null) {
      const h = `${String(d.hour).padStart(2, '0')}:00`
      hourMap.set(h, (hourMap.get(h) || 0) + r)
    }
  }

  const toSorted = (m, n) =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n)
      .map(([label, value]) => ({ label, value: Math.round(value) }))

  return {
    totalReach: Math.round(totalReach),
    totalPlays,
    impressionDocs: docs.length,
    trend: [...trendMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-14)
      .map(([label, value]) => ({ label: label.slice(5), value: Math.round(value) })),
    byAreaType: toSorted(areaTypeMap, 6),
    byArea: toSorted(areaMap, 6),
    byWeather: toSorted(weatherMap, 5),
    peakHours: [...hourMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, value]) => ({ label, value: Math.round(value) })),
    topAds: [...adMap.entries()]
      .sort((a, b) => b[1].reach - a[1].reach)
      .slice(0, 6)
      .map(([adId, v]) => ({ adId, reach: Math.round(v.reach), plays: v.plays })),
    hasData: true,
  }
}
