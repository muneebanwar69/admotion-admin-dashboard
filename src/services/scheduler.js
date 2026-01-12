// src/services/scheduler.js
const SCHEDULER_URL = "http://127.0.0.1:8000/api/scheduler/run"; // backend

export default async function runAiNow() {
  try {
    const res = await fetch(SCHEDULER_URL, {
      method: "POST", // ✅ MUST be POST
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ trigger: true }), // ✅ dummy payload
    });

    if (!res.ok) {
      throw new Error(`Scheduler call failed: ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error("Scheduler call error:", err);
    return { ok: false, error: "no-backend" };
  }
}
