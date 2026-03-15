import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MessageCircle, Bell, Send, Settings, Save, Eye, Clock, Calendar, FileText, CheckCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { saveReportPreference, getReportPreference, generateDailyReport, generateReportHTML } from '../services/emailReports'
import { saveWhatsAppConfig, getWhatsAppConfig, getWhatsAppTemplates, formatWhatsAppMessage } from '../services/whatsappIntegration'
import RealTimeIndicator from '../components/ui/RealTimeIndicator'

const Toggle = ({ enabled, onChange }) => (
  <button onClick={onChange} className={`w-10 h-5.5 rounded-full relative transition-colors duration-200 ${enabled ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
    <motion.div animate={{ x: enabled ? 18 : 2 }} className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-sm" />
  </button>
)

const ReportSettings = () => {
  const { currentUser } = useAuth()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('email')
  const [saving, setSaving] = useState(false)

  // Email state
  const [emailEnabled, setEmailEnabled] = useState(false)
  const [emailAddress, setEmailAddress] = useState('')
  const [frequency, setFrequency] = useState('daily')
  const [reportTypes, setReportTypes] = useState({ performance: true, campaigns: true, vehicles: false })
  const [showPreview, setShowPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')

  // WhatsApp state
  const [waEnabled, setWaEnabled] = useState(false)
  const [waPhone, setWaPhone] = useState('')
  const [waApiUrl, setWaApiUrl] = useState('')
  const [waApiToken, setWaApiToken] = useState('')
  const [waAlerts, setWaAlerts] = useState({ vehicleOffline: true, campaignStarted: true, dailySummary: true, lowBudget: true, paymentReminder: false, campaignEnded: true })
  const [waPreview, setWaPreview] = useState(null)

  const templates = getWhatsAppTemplates()

  useEffect(() => {
    if (!currentUser?.uid) return
    getReportPreference(currentUser.uid).then(pref => {
      if (pref) {
        setEmailEnabled(pref.enabled || false)
        setEmailAddress(pref.email || '')
        setFrequency(pref.frequency || 'daily')
        setReportTypes(pref.reportTypes || { performance: true, campaigns: true, vehicles: false })
      }
    }).catch(() => {})
    getWhatsAppConfig().then(config => {
      if (config) {
        setWaEnabled(config.enabled || false)
        setWaPhone(config.phone || '')
        setWaApiUrl(config.apiUrl || '')
        setWaApiToken(config.apiToken || '')
        setWaAlerts(config.alerts || waAlerts)
      }
    }).catch(() => {})
  }, [currentUser?.uid])

  const handleSave = async () => {
    setSaving(true)
    try {
      if (activeTab === 'email') {
        await saveReportPreference(currentUser.uid, { enabled: emailEnabled, email: emailAddress, frequency, reportTypes })
      } else {
        await saveWhatsAppConfig({ enabled: waEnabled, phone: waPhone, apiUrl: waApiUrl, apiToken: waApiToken, alerts: waAlerts })
      }
      toast.success('Settings saved successfully!')
    } catch (err) {
      toast.error('Failed to save settings: ' + err.message)
    }
    setSaving(false)
  }

  const handleTestEmail = async () => {
    try {
      const report = await generateDailyReport()
      const html = generateReportHTML(report)
      setPreviewHtml(html)
      setShowPreview(true)
      toast.info('Report preview generated! In production, this would be sent to your email.')
    } catch (err) {
      toast.error('Failed to generate report: ' + err.message)
    }
  }

  return (
    <div className="p-4 md:p-6 transition-colors duration-300">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 text-white px-6 py-4 rounded-2xl shadow-xl mb-6 flex items-center justify-between border border-white/10">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6" />
          <h1 className="text-xl md:text-2xl font-bold">Report & Notification Settings</h1>
        </div>
        <RealTimeIndicator isActive={true} />
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[{ id: 'email', label: 'Email Reports', icon: Mail }, { id: 'whatsapp', label: 'WhatsApp Notifications', icon: MessageCircle }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-gradient-to-r from-brand-900 to-brand-800 text-white shadow-xl' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'}`}>
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
        {activeTab === 'email' && (
          <div className="space-y-6">
            {/* Enable toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
              <div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200">Enable Email Reports</h3>
                <p className="text-xs text-slate-400 mt-0.5">Receive automated performance reports via email</p>
              </div>
              <Toggle enabled={emailEnabled} onChange={() => setEmailEnabled(!emailEnabled)} />
            </div>

            {emailEnabled && (
              <>
                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                  <input value={emailAddress} onChange={e => setEmailAddress(e.target.value)} placeholder="admin@example.com" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                {/* Frequency */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Frequency</label>
                  <div className="flex gap-2">
                    {['daily', 'weekly', 'monthly'].map(f => (
                      <button key={f} onClick={() => setFrequency(f)} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${frequency === f ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                        {f === 'daily' ? <Clock className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Report Types */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Report Types</label>
                  {Object.entries(reportTypes).map(([key, val]) => (
                    <label key={key} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer">
                      <input type="checkbox" checked={val} onChange={() => setReportTypes(p => ({ ...p, [key]: !p[key] }))} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-slate-600 dark:text-slate-300 capitalize">{key} Summary</span>
                    </label>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button onClick={handleTestEmail} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all">
                    <Eye className="w-4 h-4" /> Generate Report
                  </button>
                  <button
                    onClick={() => {
                      const subject = encodeURIComponent(`AdMotion ${frequency.charAt(0).toUpperCase() + frequency.slice(1)} Report - ${new Date().toLocaleDateString()}`)
                      const body = encodeURIComponent('Please find your AdMotion report attached.\n\nNote: For HTML report preview, use the "Generate Report" button in the dashboard.')
                      const mailto = `mailto:${emailAddress}?subject=${subject}&body=${body}`
                      window.open(mailto, '_blank')
                      toast.info('Opening email client with report details...')
                    }}
                    disabled={!emailAddress}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" /> Send Test Email
                  </button>
                </div>

                {/* Preview */}
                {showPreview && previewHtml && (
                  <div className="mt-4 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-700">
                      <span className="text-xs font-medium text-slate-500">Email Preview</span>
                      <button onClick={() => setShowPreview(false)} className="text-xs text-slate-400 hover:text-slate-600">Close</button>
                    </div>
                    <div className="bg-white p-2 max-h-96 overflow-y-auto">
                      <iframe title="Report Preview" srcDoc={previewHtml} className="w-full h-80 border-0" sandbox="" />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'whatsapp' && (
          <div className="space-y-6">
            {/* Enable toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl">
              <div>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200">Enable WhatsApp Notifications</h3>
                <p className="text-xs text-slate-400 mt-0.5">Send alerts via WhatsApp Business API</p>
              </div>
              <Toggle enabled={waEnabled} onChange={() => setWaEnabled(!waEnabled)} />
            </div>

            {waEnabled && (
              <>
                {/* Config */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Phone Number</label>
                    <input value={waPhone} onChange={e => setWaPhone(e.target.value)} placeholder="+92 300 1234567" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">API URL</label>
                    <input value={waApiUrl} onChange={e => setWaApiUrl(e.target.value)} placeholder="https://api.whatsapp.com/..." className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">API Token</label>
                  <input type="password" value={waApiToken} onChange={e => setWaApiToken(e.target.value)} placeholder="Your API token" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none focus:ring-2 focus:ring-green-500" />
                </div>

                {/* Alert types */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Notification Types</label>
                  {Object.entries(waAlerts).map(([key, val]) => {
                    const labels = { vehicleOffline: 'Vehicle Offline Alert', campaignStarted: 'Campaign Started', campaignEnded: 'Campaign Ended', dailySummary: 'Daily Summary', lowBudget: 'Low Budget Alert', paymentReminder: 'Payment Reminder' }
                    return (
                      <label key={key} className="flex items-center justify-between p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" checked={val} onChange={() => setWaAlerts(p => ({ ...p, [key]: !p[key] }))} className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500" />
                          <span className="text-sm text-slate-600 dark:text-slate-300">{labels[key] || key}</span>
                        </div>
                        <button onClick={() => setWaPreview(waPreview === key ? null : key)} className="text-xs text-blue-500 hover:text-blue-600">
                          {waPreview === key ? 'Hide' : 'Preview'}
                        </button>
                      </label>
                    )
                  })}
                </div>

                {/* Template Preview */}
                {waPreview && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-semibold text-green-700 dark:text-green-400">WhatsApp Preview</span>
                      </div>
                      <button
                        onClick={() => {
                          const template = templates.find(t => t.id === waPreview)
                          if (!template) return
                          const phone = waPhone.replace(/[^0-9]/g, '')
                          const text = encodeURIComponent(template.preview)
                          const url = phone
                            ? `https://wa.me/${phone}?text=${text}`
                            : `https://wa.me/?text=${text}`
                          window.open(url, '_blank')
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500 hover:bg-green-600 text-white transition-colors"
                      >
                        <Send className="w-3 h-3" /> Send via WhatsApp
                      </button>
                    </div>
                    <pre className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                      {templates.find(t => t.id === waPreview)?.preview || 'Preview not available'}
                    </pre>
                  </motion.div>
                )}
              </>
            )}
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:from-green-600 hover:to-emerald-700 transition-all disabled:opacity-50">
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Settings'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

export default ReportSettings
