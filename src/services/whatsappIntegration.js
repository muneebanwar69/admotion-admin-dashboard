import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

// WhatsApp message templates
const TEMPLATES = {
  vehicleOffline: {
    id: 'vehicle_offline',
    name: 'Vehicle Offline Alert',
    format: (data) =>
      `🚨 *Vehicle Offline Alert*\n\n` +
      `Vehicle *${data.vehicleName || data.carId}* has gone offline.\n` +
      `📍 Last known location: ${data.location || 'Unknown'}\n` +
      `🕐 Last seen: ${data.lastSeen || 'Unknown'}\n\n` +
      `Please check the vehicle status in the AdMotion dashboard.`,
  },
  campaignStarted: {
    id: 'campaign_started',
    name: 'Campaign Started',
    format: (data) =>
      `🎯 *Campaign Started*\n\n` +
      `Campaign *${data.name}* is now live!\n` +
      `📅 Duration: ${data.startDate} - ${data.endDate}\n` +
      `🚗 Vehicles: ${data.vehicleCount || 0}\n` +
      `📺 Ads: ${data.adCount || 0}\n\n` +
      `Track performance on the AdMotion dashboard.`,
  },
  campaignEnded: {
    id: 'campaign_ended',
    name: 'Campaign Ended',
    format: (data) =>
      `✅ *Campaign Completed*\n\n` +
      `Campaign *${data.name}* has ended.\n` +
      `👀 Total Impressions: ${data.impressions?.toLocaleString() || 0}\n` +
      `🚗 Vehicles Used: ${data.vehicleCount || 0}\n\n` +
      `View the full report on the AdMotion dashboard.`,
  },
  dailySummary: {
    id: 'daily_summary',
    name: 'Daily Summary',
    format: (data) =>
      `📊 *Daily Summary - ${data.date || new Date().toLocaleDateString()}*\n\n` +
      `📺 Active Ads: ${data.activeAds || 0}/${data.totalAds || 0}\n` +
      `🚗 Active Vehicles: ${data.activeVehicles || 0}/${data.totalVehicles || 0}\n` +
      `👀 Impressions Today: ${data.impressions?.toLocaleString() || 0}\n` +
      `💰 Revenue: PKR ${data.revenue?.toLocaleString() || 0}\n\n` +
      `_Powered by AdMotion Platform_`,
  },
  paymentReminder: {
    id: 'payment_reminder',
    name: 'Payment Reminder',
    format: (data) =>
      `💳 *Payment Reminder*\n\n` +
      `Dear ${data.ownerName || 'Vehicle Owner'},\n\n` +
      `Your payment of *PKR ${data.amount?.toLocaleString() || 0}* for vehicle *${data.vehicleName || data.carId}* is due.\n` +
      `📅 Due Date: ${data.dueDate || 'N/A'}\n\n` +
      `Please ensure timely payment to continue the service.`,
  },
  lowBudget: {
    id: 'low_budget',
    name: 'Low Budget Alert',
    format: (data) =>
      `⚠️ *Low Budget Alert*\n\n` +
      `Ad *${data.adTitle}* by ${data.company} has a low remaining budget.\n` +
      `💰 Remaining: PKR ${data.remaining?.toLocaleString() || 0}\n` +
      `📊 Budget Used: ${data.percentUsed || 0}%\n\n` +
      `Consider increasing the budget to continue ad delivery.`,
  },
}

// Format a message using a template
export function formatWhatsAppMessage(templateId, data) {
  const template = TEMPLATES[templateId]
  if (!template) throw new Error(`Template ${templateId} not found`)
  return template.format(data)
}

// Get available templates
export function getWhatsAppTemplates() {
  return Object.entries(TEMPLATES).map(([key, val]) => ({
    id: key,
    name: val.name,
    preview: val.format({
      vehicleName: 'CAR-12345', carId: 'CAR-12345', location: 'Blue Area, Islamabad',
      lastSeen: '5 minutes ago', name: 'Summer Campaign 2025', startDate: '2025-01-01',
      endDate: '2025-01-31', vehicleCount: 10, adCount: 5, impressions: 15000,
      date: new Date().toLocaleDateString(), activeAds: 8, totalAds: 12,
      activeVehicles: 15, totalVehicles: 20, revenue: 50000, ownerName: 'Ahmed Khan',
      amount: 25000, dueDate: '2025-02-01', adTitle: 'Mega Sale', company: 'ABC Corp',
      remaining: 5000, percentUsed: 85,
    }),
  }))
}

// Save WhatsApp configuration
export async function saveWhatsAppConfig(config) {
  await setDoc(doc(db, 'settings', 'whatsapp'), {
    ...config,
    updatedAt: new Date().toISOString(),
  })
}

// Get WhatsApp configuration
export async function getWhatsAppConfig() {
  const snap = await getDoc(doc(db, 'settings', 'whatsapp'))
  return snap.exists() ? snap.data() : null
}
