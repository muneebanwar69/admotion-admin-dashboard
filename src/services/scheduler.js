// src/services/scheduler.js
import logger from '../utils/logger'

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export default async function runAiNow() {
  try {
    const res = await fetch(`${API_URL}/api/scheduler/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ trigger: true }),
    });

    if (!res.ok) {
      throw new Error(`Scheduler call failed: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    logger.error("Scheduler call error:", err);
    return { ok: false, error: "no-backend" };
  }
}

export async function getSchedulerStatus() {
  try {
    const res = await fetch(`${API_URL}/api/scheduler/status`);
    if (!res.ok) throw new Error(`Status check failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    return { ok: false, error: "no-backend" };
  }
}

export async function getWeather(city) {
  try {
    const res = await fetch(`${API_URL}/api/weather/${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function getAreas(city) {
  try {
    const res = await fetch(`${API_URL}/api/areas/${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error(`Areas fetch failed: ${res.status}`);
    return await res.json();
  } catch (err) {
    return { areas: [] };
  }
}
