// src/services/aiGenerator.js
// Talks to the backend AI endpoints (which hold the OpenAI key server-side).
import logger from '../utils/logger'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

async function post(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.detail || `Request failed (${res.status})`)
  return data
}

/** Is the AI generator configured on the server? */
export async function getAiStatus() {
  try {
    const res = await fetch(`${API_URL}/api/ai/status`)
    if (!res.ok) return { configured: false, offline: true }
    return await res.json()
  } catch (e) {
    logger.warn('AI status check failed:', e?.message)
    return { configured: false, offline: true }
  }
}

/** Refine a rough idea into an image prompt + headline + caption. */
export function refineIdea({ idea, product = '', tone = 'modern, bold, eye-catching' }) {
  return post('/api/ai/refine', { idea, product, tone })
}

/** Generate an ad image from a prompt (+ optional reference image data URL). */
export function generateAd({ prompt, size = '1024x1024', referenceImage = null }) {
  return post('/api/ai/generate', { prompt, size, reference_image: referenceImage })
}
