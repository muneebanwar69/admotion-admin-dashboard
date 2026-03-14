import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Activity, TrendingUp, Search, Calendar, X, Bell, Megaphone, Car, Wallet, User, Shield, LogIn, LogOut, FileText, Settings, Clock, CheckCircle, XCircle, Info } from 'lucide-react'
import { collection, query, orderBy, onSnapshot, limit, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import RealTimeIndicator from '../components/ui/RealTimeIndicator'

const Alerts = () => {
  const [activityLogs, setActivityLogs] = useState([])
  const [systemAlerts, setSystemAlerts] = useState([])
  const [filter, setFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('activity') // 'activity' or 'alerts'
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const { currentUser } = useAuth()
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set())
  const [searchFocused, setSearchFocused] = useState(false)

  // Fetch activity logs from Firebase
  useEffect(() => {
    const activityQuery = query(
      collection(db, 'activityLogs'),
      orderBy('timestamp', 'desc'),
      limit(100)
    )

    const unsubscribe = onSnapshot(activityQuery, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setActivityLogs(logs)
      setLoading(false)
      console.log('✅ Activity logs loaded:', logs.length, 'records')
    }, (error) => {
      console.error('❌ Error fetching activity logs:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        name: error.name
      })

      // Check for specific Firestore errors
      if (error.code === 'permission-denied') {
        console.error('⚠️ Firestore permission denied. Check security rules for activityLogs collection.')
      } else if (error.code === 'unavailable') {
        console.error('⚠️ Firestore unavailable. Check internet connection and Firebase status.')
      } else if (error.code === 'failed-precondition') {
        console.error('⚠️ Firestore index missing. You may need to create an index for activityLogs.timestamp.')
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Generate system alerts from real data
  useEffect(() => {
    const generateSystemAlerts = async () => {
      try {
        const alerts = []

        // Check ads for expiring campaigns
        const adsSnapshot = await getDocs(collection(db, 'ads'))
        adsSnapshot.forEach(doc => {
          const ad = doc.data()
          if (ad.end) {
            const endDate = new Date(ad.end)
            const today = new Date()
            const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))

            if (daysUntilExpiry > 0 && daysUntilExpiry <= 7) {
              alerts.push({
                id: `ad-expiry-${doc.id}`,
                type: 'ad',
                title: 'Ad Expiring Soon',
                message: `Ad "${ad.title}" will expire in ${daysUntilExpiry} day${daysUntilExpiry > 1 ? 's' : ''}`,
                timestamp: new Date(),
                priority: daysUntilExpiry <= 2 ? 'high' : 'medium',
                icon: '📢'
              })
            }
          }

          // Check budget warnings
          if (ad.budget && parseFloat(ad.budget.replace(/[^0-9.]/g, '')) < 5000) {
            alerts.push({
              id: `ad-budget-${doc.id}`,
              type: 'ad',
              title: 'Low Budget Warning',
              message: `Ad "${ad.title}" has low budget remaining`,
              timestamp: new Date(),
              priority: 'medium',
              icon: '💰'
            })
          }
        })

        // Check vehicles for issues
        const vehiclesSnapshot = await getDocs(collection(db, 'vehicles'))
        vehiclesSnapshot.forEach(doc => {
          const vehicle = doc.data()

          // Check registration expiry
          if (vehicle.registrationDate) {
            const regDate = new Date(vehicle.registrationDate)
            const today = new Date()
            const daysSinceReg = Math.ceil((today - regDate) / (1000 * 60 * 60 * 24))

            if (daysSinceReg > 365) {
              alerts.push({
                id: `vehicle-reg-${doc.id}`,
                type: 'vehicle',
                title: 'Vehicle Registration May Need Renewal',
                message: `Vehicle "${vehicle.vehicleName}" (${vehicle.carId}) registered ${Math.floor(daysSinceReg / 365)} year(s) ago`,
                timestamp: new Date(),
                priority: 'medium',
                icon: '🚗'
              })
            }
          }
        })

        setSystemAlerts(alerts)
      } catch (error) {
        console.error('Error generating system alerts:', error)
      }
    }

    generateSystemAlerts()
    // Refresh alerts every 5 minutes
    const interval = setInterval(generateSystemAlerts, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Mock alerts data for demonstration
  const mockAlerts = [
    {
      id: '1',
      type: 'Ads',
      title: 'Ad Expiry Warning',
      message: 'Ad ID AD-02 will expire in 2 days',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      read: false,
      priority: 'high'
    },
    {
      id: '2',
      type: 'Ads',
      title: 'Ad Paused by System',
      message: 'Ad ID AD-115 paused due to budget limit',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      read: false,
      priority: 'medium'
    },
    {
      id: '3',
      type: 'Ads',
      title: 'Ad Upload Failed',
      message: 'Ad upload failed for Coca-Cola campaign',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      read: true,
      priority: 'high'
    },
    {
      id: '4',
      type: 'Ads',
      title: 'Low Budget Warning',
      message: 'PepsiCo Ad is below PKR 5,000 remaining',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      read: false,
      priority: 'medium'
    },
    {
      id: '5',
      type: 'Vehicle',
      title: 'Vehicle Registration Expiry',
      message: 'Vehicle ID C-204 expired on 21 July',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      read: false,
      priority: 'high'
    },
    {
      id: '6',
      type: 'Vehicle',
      title: 'Unverified Vehicle',
      message: 'Car ID C-305 needs manual verification',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      read: false,
      priority: 'medium'
    },
    {
      id: '7',
      type: 'Vehicle',
      title: 'Parking Zone Conflict',
      message: 'Car ID C-210 parked in unauthorized zone',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      read: true,
      priority: 'low'
    },
    {
      id: '8',
      type: 'Vehicle',
      title: 'Inactive Vehicle Notice',
      message: 'Fleet vehicle C-401 inactive for 7 days',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      read: false,
      priority: 'medium'
    },
    {
      id: '9',
      type: 'System',
      title: 'New User Registered',
      message: 'Owner Ali Raza signed up',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      read: false,
      priority: 'low'
    },
    {
      id: '10',
      type: 'System',
      title: 'Support Ticket Received',
      message: 'Ticket #52 - Bug Report submitted',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      read: false,
      priority: 'medium'
    },
    {
      id: '11',
      type: 'System',
      title: 'Password Changed',
      message: 'Your password was updated at 9:00 AM',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      read: true,
      priority: 'low'
    },
    {
      id: '12',
      type: 'System',
      title: 'Login from New Device',
      message: 'Admin login from unfamiliar browser',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      read: false,
      priority: 'high'
    }
  ]


  const getTimeAgo = (timestamp) => {
    if (!timestamp) return 'Just now'

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const now = new Date()
    const diff = now - date
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    return 'Just now'
  }

  const getActionColor = (action) => {
    switch (action) {
      case 'created': return 'bg-green-100 text-green-700 border-green-200'
      case 'updated': return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'deleted': return 'bg-red-100 text-red-700 border-red-200'
      case 'logged_in': return 'bg-purple-100 text-purple-700 border-purple-200'
      case 'logged_out': return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'password_changed': return 'bg-orange-100 text-orange-700 border-orange-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const formatDateTime = (timestamp) => {
    if (!timestamp) return 'Unknown time'

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
    return `${dateStr} at ${timeStr}`
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getDateLabel = (timestamp) => {
    if (!timestamp) return 'Unknown Date'

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Reset time to compare dates only
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate())
    const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const yesterdayOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())

    if (dateOnly.getTime() === todayOnly.getTime()) {
      return 'Today'
    } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    }
  }

  const groupByDate = (logs) => {
    const grouped = {}
    logs.forEach(log => {
      const dateLabel = getDateLabel(log.timestamp)
      if (!grouped[dateLabel]) {
        grouped[dateLabel] = []
      }
      grouped[dateLabel].push(log)
    })
    return grouped
  }

  // Filter and search activity logs
  const filteredActivityLogs = activityLogs.filter(log => {
    // Type filter
    if (filter !== 'All' && log.type !== filter.toLowerCase()) {
      return false
    }

    // Date filter
    if (dateFilter) {
      const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.createdAt)
      const filterDate = new Date(dateFilter)
      const logDateOnly = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate())
      const filterDateOnly = new Date(filterDate.getFullYear(), filterDate.getMonth(), filterDate.getDate())

      if (logDateOnly.getTime() !== filterDateOnly.getTime()) {
        return false
      }
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const searchableText = `
        ${log.type}
        ${log.action}
        ${log.userName || ''}
        ${log.details?.message || ''}
        ${log.details?.adId || ''}
        ${log.details?.carId || ''}
        ${log.details?.campaignId || ''}
        ${log.details?.title || ''}
        ${log.details?.vehicleName || ''}
        ${log.details?.name || ''}
        ${log.details?.adminName || ''}
        ${log.details?.adminEmail || ''}
      `.toLowerCase()

      return searchableText.includes(query)
    }

    return true
  })

  const filteredSystemAlerts = systemAlerts.filter(alert => {
    // Type filter
    if (filter !== 'All' && alert.type !== filter.toLowerCase()) {
      return false
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const searchableText = `
        ${alert.type}
        ${alert.title}
        ${alert.message}
      `.toLowerCase()

      return searchableText.includes(query)
    }

    return true
  })

  const groupedActivityLogs = groupByDate(filteredActivityLogs)

  if (loading) {
    return (
      <div className='p-6 min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='relative'>
            <div className='animate-spin rounded-full h-16 w-16 border-4 border-brand-200 border-t-brand-900 mx-auto mb-4'></div>
            <div className='absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-b-blue-400 animate-spin mx-auto' style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className='text-slate-600 dark:text-slate-400 mt-4 font-medium'>Loading alerts...</p>
          <div className='flex justify-center gap-1 mt-2'>
            <span className='w-2 h-2 rounded-full bg-brand-900 animate-bounce' style={{ animationDelay: '0ms' }}></span>
            <span className='w-2 h-2 rounded-full bg-brand-800 animate-bounce' style={{ animationDelay: '150ms' }}></span>
            <span className='w-2 h-2 rounded-full bg-brand-700 animate-bounce' style={{ animationDelay: '300ms' }}></span>
          </div>
        </div>
      </div>
    )
  }

  // Helper to get icon for activity type
  const getActivityIcon = (type, action) => {
    const iconClass = "w-5 h-5"
    switch (type?.toLowerCase()) {
      case 'ad':
        return <Megaphone className={iconClass} />
      case 'vehicle':
        return <Car className={iconClass} />
      case 'campaign':
        return <FileText className={iconClass} />
      case 'profile':
        return <User className={iconClass} />
      case 'admin':
        return <Shield className={iconClass} />
      case 'login':
        return <LogIn className={iconClass} />
      case 'logout':
        return <LogOut className={iconClass} />
      default:
        return <Activity className={iconClass} />
    }
  }

  // Helper to get action icon
  const getActionIcon = (action) => {
    switch (action) {
      case 'created':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />
      case 'updated':
        return <Settings className="w-4 h-4 text-blue-500" />
      case 'deleted':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Info className="w-4 h-4 text-slate-500" />
    }
  }

  // Filter icon mapping
  const filterIcons = {
    All: <Activity className="w-3.5 h-3.5" />,
    Ad: <Megaphone className="w-3.5 h-3.5" />,
    Vehicle: <Car className="w-3.5 h-3.5" />,
    Campaign: <FileText className="w-3.5 h-3.5" />,
    Profile: <User className="w-3.5 h-3.5" />,
    Admin: <Shield className="w-3.5 h-3.5" />,
    Login: <LogIn className="w-3.5 h-3.5" />,
    Logout: <LogOut className="w-3.5 h-3.5" />,
  }

  // Filter color mapping for active state
  const filterColors = {
    All: 'from-brand-900 to-brand-700 shadow-brand-900/25',
    Ad: 'from-blue-500 to-blue-600 shadow-blue-500/25',
    Vehicle: 'from-purple-500 to-purple-600 shadow-purple-500/25',
    Campaign: 'from-amber-500 to-amber-600 shadow-amber-500/25',
    Profile: 'from-emerald-500 to-emerald-600 shadow-emerald-500/25',
    Admin: 'from-rose-500 to-rose-600 shadow-rose-500/25',
    Login: 'from-cyan-500 to-cyan-600 shadow-cyan-500/25',
    Logout: 'from-slate-500 to-slate-600 shadow-slate-500/25',
  }

  // Action border color mapping
  const getActionBorderColor = (action) => {
    switch (action) {
      case 'created': return 'border-l-emerald-500'
      case 'updated': return 'border-l-blue-500'
      case 'deleted': return 'border-l-red-500'
      case 'logged_in': return 'border-l-purple-500'
      case 'logged_out': return 'border-l-slate-400'
      default: return 'border-l-slate-300'
    }
  }

  // Action gradient badge mapping
  const getActionGradientBadge = (action) => {
    switch (action) {
      case 'created': return 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
      case 'updated': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
      case 'deleted': return 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
      case 'logged_in': return 'bg-gradient-to-r from-purple-500 to-violet-500 text-white'
      case 'logged_out': return 'bg-gradient-to-r from-slate-500 to-slate-600 text-white'
      case 'password_changed': return 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
      default: return 'bg-gradient-to-r from-slate-400 to-slate-500 text-white'
    }
  }

  const visibleSystemAlerts = filteredSystemAlerts.filter(a => !dismissedAlerts.has(a.id))

  return (
    <div className='p-4 md:p-6 transition-colors duration-300'>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 text-white px-6 py-4 rounded-xl shadow-lg mb-6 flex items-center justify-between border border-white/10 relative overflow-hidden'
      >
        {/* Decorative animated background orbs */}
        <div className='absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2'></div>
        <div className='absolute bottom-0 left-1/3 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl translate-y-1/2'></div>
        <div className="flex items-center gap-3 relative z-10">
          <div className='p-2 bg-white/10 rounded-lg backdrop-blur-sm'>
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className='text-xl md:text-2xl font-bold'>Activity & Alerts</h1>
            <p className="text-sm text-white/70 hidden sm:block">Monitor all system activities and important alerts</p>
          </div>
        </div>
        <RealTimeIndicator isActive={true} />
      </motion.div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6'>
        {/* Card 1: Total Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4 }}
          className='relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 group'
        >
          {/* Accent bar */}
          <div className='h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600'></div>
          {/* Subtle gradient overlay */}
          <div className='absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10 dark:to-transparent pointer-events-none'></div>
          <div className='p-5 relative'>
            <div className='flex items-center gap-4'>
              <div className='p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg shadow-blue-500/20'>
                <Activity className='w-6 h-6 text-white' />
              </div>
              <div>
                <p className='text-sm text-slate-600 dark:text-slate-400'>
                  {searchQuery || dateFilter || filter !== 'All' ? 'Filtered Activities' : 'Total Activities'}
                </p>
                <div className='flex items-center gap-2'>
                  <p className='text-2xl font-bold text-slate-800 dark:text-slate-100'>
                    {searchQuery || dateFilter || filter !== 'All' ? filteredActivityLogs.length : activityLogs.length}
                  </p>
                  {/* Pulse dot */}
                  <span className='relative flex h-2.5 w-2.5'>
                    <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75'></span>
                    <span className='relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500'></span>
                  </span>
                </div>
                {(searchQuery || dateFilter || filter !== 'All') && activityLogs.length > 0 && (
                  <p className='text-xs text-slate-500 dark:text-slate-500'>of {activityLogs.length} total</p>
                )}
                <p className='text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5'>+12% from yesterday</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Card 2: System Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -4 }}
          className='relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 group'
        >
          <div className='h-1 bg-gradient-to-r from-red-500 via-rose-400 to-red-600'></div>
          <div className='absolute inset-0 bg-gradient-to-br from-red-50/50 to-transparent dark:from-red-900/10 dark:to-transparent pointer-events-none'></div>
          <div className='p-5 relative'>
            <div className='flex items-center gap-4'>
              <div className='p-3 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl shadow-lg shadow-red-500/20'>
                <AlertTriangle className='w-6 h-6 text-white' />
              </div>
              <div>
                <p className='text-sm text-slate-600 dark:text-slate-400'>System Alerts</p>
                <div className='flex items-center gap-2'>
                  <p className='text-2xl font-bold text-slate-800 dark:text-slate-100'>{systemAlerts.length}</p>
                  <span className='relative flex h-2.5 w-2.5'>
                    <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75'></span>
                    <span className='relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500'></span>
                  </span>
                </div>
                <p className='text-xs text-amber-600 dark:text-amber-400 font-medium mt-0.5'>+3% from yesterday</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Today's Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -4 }}
          className='relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 group'
        >
          <div className='h-1 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-600'></div>
          <div className='absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-900/10 dark:to-transparent pointer-events-none'></div>
          <div className='p-5 relative'>
            <div className='flex items-center gap-4'>
              <div className='p-3 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl shadow-lg shadow-emerald-500/20'>
                <TrendingUp className='w-6 h-6 text-white' />
              </div>
              <div>
                <p className='text-sm text-slate-600 dark:text-slate-400'>Today's Actions</p>
                <div className='flex items-center gap-2'>
                  <p className='text-2xl font-bold text-slate-800 dark:text-slate-100'>
                    {activityLogs.filter(log => {
                      const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.createdAt)
                      const today = new Date()
                      return logDate.toDateString() === today.toDateString()
                    }).length}
                  </p>
                  <span className='relative flex h-2.5 w-2.5'>
                    <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75'></span>
                    <span className='relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500'></span>
                  </span>
                </div>
                <p className='text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5'>+8% from yesterday</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tab Navigation - Pill Style */}
      <div className='flex gap-3 mb-6 p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl overflow-x-auto relative'>
        <button
          onClick={() => setActiveTab('activity')}
          className='relative z-10 px-4 sm:px-6 py-3 font-semibold transition-all duration-300 rounded-xl whitespace-nowrap'
        >
          {activeTab === 'activity' && (
            <motion.div
              layoutId="tabIndicator"
              className='absolute inset-0 bg-gradient-to-r from-brand-900 to-blue-600 rounded-xl shadow-lg shadow-brand-900/25'
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <div className={`flex items-center gap-2 relative z-10 ${activeTab === 'activity' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
            <Activity className='w-5 h-5' />
            <span className='hidden sm:inline'>Activity Logs</span>
            <span className='sm:hidden'>Activity</span>
            <motion.span
              key={activityLogs.length}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'activity'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              {activityLogs.length}
            </motion.span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className='relative z-10 px-4 sm:px-6 py-3 font-semibold transition-all duration-300 rounded-xl whitespace-nowrap'
        >
          {activeTab === 'alerts' && (
            <motion.div
              layoutId="tabIndicator"
              className='absolute inset-0 bg-gradient-to-r from-brand-900 to-blue-600 rounded-xl shadow-lg shadow-brand-900/25'
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <div className={`flex items-center gap-2 relative z-10 ${activeTab === 'alerts' ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`}>
            <AlertTriangle className='w-5 h-5' />
            <span className='hidden sm:inline'>System Alerts</span>
            <span className='sm:hidden'>Alerts</span>
            <motion.span
              key={systemAlerts.length}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'alerts'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              {systemAlerts.length}
            </motion.span>
          </div>
        </button>
      </div>

      {/* Search and Date Filter */}
      <div className='mb-6 grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* Search Bar */}
        <div className='relative group'>
          <motion.div
            animate={{ scale: searchFocused ? 1.15 : 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className='absolute left-4 top-1/2 transform -translate-y-1/2 z-10'
          >
            <Search className={`w-5 h-5 transition-colors duration-300 ${searchFocused ? 'text-brand-900 dark:text-blue-400' : 'text-slate-400'}`} />
          </motion.div>
          <input
            type='text'
            placeholder='Search activities, admins, IDs, actions...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className='w-full pl-12 pr-12 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-900/50 dark:focus:ring-blue-500/50 focus:border-brand-900 dark:focus:border-blue-500 focus:shadow-lg focus:shadow-brand-900/10 transition-all duration-300 text-slate-800 dark:text-slate-200'
          />
          {searchQuery && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              onClick={() => setSearchQuery('')}
              className='absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20'
            >
              <X className='w-4 h-4' />
            </motion.button>
          )}
        </div>

        {/* Date Filter */}
        <div className='relative group'>
          <Calendar className='absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 z-10' />
          <input
            type='date'
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className='w-full pl-12 pr-12 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-900/50 dark:focus:ring-blue-500/50 focus:border-brand-900 dark:focus:border-blue-500 focus:shadow-lg focus:shadow-brand-900/10 transition-all duration-300 text-slate-800 dark:text-slate-200'
          />
          {dateFilter && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.1 }}
              onClick={() => setDateFilter('')}
              className='absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20'
            >
              <X className='w-4 h-4' />
            </motion.button>
          )}
        </div>
      </div>

      {/* Filter Pills */}
      <div className='flex gap-2 mb-6 overflow-x-auto pb-2'>
        {['All', 'Ad', 'Vehicle', 'Campaign', 'Profile', 'Admin', 'Login', 'Logout'].map((filterType) => (
          <motion.button
            key={filterType}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilter(filterType)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
              filter === filterType
                ? `bg-gradient-to-r ${filterColors[filterType]} text-white shadow-lg`
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            {filterIcons[filterType]}
            {filterType}
          </motion.button>
        ))}
      </div>

      {/* Active Filters Display */}
      {(searchQuery || dateFilter || filter !== 'All') && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className='mb-6 flex flex-wrap items-center gap-2'
        >
          <span className='text-sm text-slate-600 dark:text-slate-400 font-medium'>Active filters:</span>
          {filter !== 'All' && (
            <motion.span
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium'
            >
              Type: {filter}
              <motion.button whileHover={{ scale: 1.2 }} onClick={() => setFilter('All')} className='hover:text-blue-900 dark:hover:text-blue-300 p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800/40 rounded-full transition-colors'>
                <X className='w-3.5 h-3.5' />
              </motion.button>
            </motion.span>
          )}
          {searchQuery && (
            <motion.span
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium'
            >
              Search: "{searchQuery}"
              <motion.button whileHover={{ scale: 1.2 }} onClick={() => setSearchQuery('')} className='hover:text-emerald-900 dark:hover:text-emerald-300 p-0.5 hover:bg-emerald-200 dark:hover:bg-emerald-800/40 rounded-full transition-colors'>
                <X className='w-3.5 h-3.5' />
              </motion.button>
            </motion.span>
          )}
          {dateFilter && (
            <motion.span
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm font-medium'
            >
              Date: {new Date(dateFilter).toLocaleDateString()}
              <motion.button whileHover={{ scale: 1.2 }} onClick={() => setDateFilter('')} className='hover:text-purple-900 dark:hover:text-purple-300 p-0.5 hover:bg-purple-200 dark:hover:bg-purple-800/40 rounded-full transition-colors'>
                <X className='w-3.5 h-3.5' />
              </motion.button>
            </motion.span>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setFilter('All')
              setSearchQuery('')
              setDateFilter('')
            }}
            className='text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-semibold transition-colors px-3 py-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20'
          >
            Clear all
          </motion.button>
        </motion.div>
      )}

      {/* Activity Logs Tab */}
      {activeTab === 'activity' && (
        <div className='space-y-6'>
          {filteredActivityLogs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className='bg-white dark:bg-slate-800 p-16 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 text-center relative overflow-hidden'
            >
              {/* Background decorations */}
              <div className='absolute top-0 left-0 w-full h-full'>
                <div className='absolute top-10 left-10 w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-xl'></div>
                <div className='absolute bottom-10 right-10 w-32 h-32 bg-purple-100 dark:bg-purple-900/20 rounded-full blur-xl'></div>
              </div>
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className='relative z-10'
              >
                <div className='w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center shadow-lg'>
                  <Activity className='w-10 h-10 text-slate-400 dark:text-slate-500' />
                </div>
              </motion.div>
              <h3 className='text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-500 dark:from-slate-300 dark:to-slate-400 bg-clip-text text-transparent mb-2 relative z-10'>
                {searchQuery || dateFilter ? 'No matching activities found' : 'No activity logs yet'}
              </h3>
              <p className='text-slate-500 dark:text-slate-400 relative z-10 max-w-md mx-auto'>
                {searchQuery || dateFilter
                  ? 'Try adjusting your search or date filter.'
                  : 'Activity logs will appear here when actions are performed in the system.'}
              </p>
            </motion.div>
          ) : (
            Object.entries(groupedActivityLogs).map(([dateLabel, logs], groupIndex) => (
              <div key={dateLabel} className='relative'>
                {/* Timeline line */}
                <div className='absolute left-[22px] top-14 bottom-0 w-0.5 bg-gradient-to-b from-brand-900/30 via-brand-800/20 to-transparent hidden md:block'></div>

                {/* Date Header */}
                <div className='flex items-center gap-3 mb-4 relative z-10'>
                  <div className='flex items-center gap-2.5 bg-gradient-to-r from-brand-900 via-brand-800 to-blue-600 text-white px-5 py-2.5 rounded-xl shadow-lg shadow-brand-900/20'>
                    <Calendar className='w-4 h-4' />
                    <h3 className='text-sm font-bold tracking-wide'>{dateLabel}</h3>
                  </div>
                  <div className='flex-1 h-px bg-gradient-to-r from-brand-900/30 via-slate-300 dark:via-slate-600 to-transparent'></div>
                  <motion.span
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className='text-xs text-slate-500 dark:text-slate-400 font-semibold bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-600 shadow-sm'
                  >
                    {logs.length} {logs.length === 1 ? 'activity' : 'activities'}
                  </motion.span>
                </div>

                {/* Activities for this date */}
                <div className='space-y-3'>
                  {logs.map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 24 }}
                      className={`relative overflow-hidden bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-lg border border-l-4 border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 group ${getActionBorderColor(log.action)}`}
                    >
                      {/* Hover gradient overlay */}
                      <div className='absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-blue-50/0 group-hover:to-blue-50/50 dark:group-hover:to-blue-900/10 transition-all duration-500 pointer-events-none'></div>

                      <div className='flex items-start gap-4 relative z-10'>
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          className={`relative flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center group/icon ${
                            log.action === 'created' ? 'bg-gradient-to-br from-emerald-400 to-green-600 text-white shadow-lg shadow-emerald-500/20' :
                            log.action === 'updated' ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg shadow-blue-500/20' :
                            log.action === 'deleted' ? 'bg-gradient-to-br from-red-400 to-red-600 text-white shadow-lg shadow-red-500/20' :
                            log.action === 'logged_in' ? 'bg-gradient-to-br from-purple-400 to-purple-600 text-white shadow-lg shadow-purple-500/20' :
                            log.action === 'logged_out' ? 'bg-gradient-to-br from-slate-400 to-slate-600 text-white shadow-lg shadow-slate-500/20' :
                            'bg-gradient-to-br from-slate-300 to-slate-500 text-white shadow-lg shadow-slate-500/20'
                          }`}
                        >
                          {/* Pulsing ring on hover */}
                          <div className='absolute inset-0 rounded-xl border-2 border-current opacity-0 group-hover/icon:opacity-30 group-hover/icon:animate-ping pointer-events-none'></div>
                          {getActivityIcon(log.type, log.action)}
                        </motion.div>
                        <div className='flex-1 min-w-0'>
                          {/* Header with action and time */}
                          <div className='flex items-start justify-between gap-2 mb-2'>
                            <div className='flex-1'>
                              <h3 className='text-base font-semibold text-slate-800 dark:text-slate-200 capitalize mb-1'>
                                {log.type} {log.action.replace('_', ' ')}
                              </h3>
                              <p className='text-sm text-slate-600 dark:text-slate-400'>
                                {log.details?.message || (
                                  <>
                                    {log.details?.adId && `Ad ID: ${log.details.adId}`}
                                    {log.details?.carId && `Vehicle ID: ${log.details.carId}`}
                                    {log.details?.campaignId && `Campaign ID: ${log.details.campaignId}`}
                                    {log.details?.title && ` - ${log.details.title}`}
                                    {log.details?.vehicleName && ` - ${log.details.vehicleName}`}
                                    {log.details?.name && ` - ${log.details.name}`}
                                    {log.details?.adminName && `Admin: ${log.details.adminName}`}
                                    {log.details?.adminEmail && ` (${log.details.adminEmail})`}
                                    {log.details?.adminRole && ` - Role: ${log.details.adminRole}`}
                                  </>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Admin info and timestamp */}
                          <div className='flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700'>
                            <div className='flex items-center gap-2'>
                              <div className='w-8 h-8 rounded-full bg-gradient-to-br from-brand-900 to-brand-800 flex items-center justify-center shadow-md'>
                                <span className='text-sm font-semibold text-white'>
                                  {(log.userName || 'Admin').charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className='text-sm font-medium text-slate-800 dark:text-slate-200'>
                                  {log.userName || 'Admin'}
                                </p>
                                <p className='text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1'>
                                  <Clock className="w-3 h-3" />
                                  {formatDateTime(log.timestamp)}
                                </p>
                              </div>
                            </div>
                            <div className='ml-auto flex items-center gap-2'>
                              {getActionIcon(log.action)}
                              <span className={`inline-block px-3 py-1.5 text-xs font-bold rounded-full shadow-sm ${getActionGradientBadge(log.action)}`}>
                                {log.action.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* System Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className='space-y-4'>
          {visibleSystemAlerts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className='bg-white dark:bg-slate-800 p-16 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 text-center relative overflow-hidden'
            >
              <div className='absolute top-0 left-0 w-full h-full'>
                <div className='absolute top-10 right-10 w-24 h-24 bg-emerald-100 dark:bg-emerald-900/20 rounded-full blur-xl'></div>
                <div className='absolute bottom-10 left-10 w-28 h-28 bg-green-100 dark:bg-green-900/20 rounded-full blur-xl'></div>
              </div>
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className='relative z-10'
              >
                <div className='w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-emerald-100 to-green-200 dark:from-emerald-900/30 dark:to-green-900/30 flex items-center justify-center shadow-lg'>
                  <CheckCircle className='w-10 h-10 text-emerald-500 dark:text-emerald-400' />
                </div>
              </motion.div>
              <h3 className='text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent mb-2 relative z-10'>
                {searchQuery ? 'No matching alerts found' : 'All Clear!'}
              </h3>
              <p className='text-slate-500 dark:text-slate-400 relative z-10 max-w-md mx-auto'>
                {searchQuery
                  ? 'Try adjusting your search filter.'
                  : 'System alerts will appear here when attention is needed.'}
              </p>
            </motion.div>
          ) : (
            <AnimatePresence>
              {visibleSystemAlerts.map((alert, index) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0, marginBottom: 0, padding: 0 }}
                  transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 24 }}
                  className={`relative overflow-hidden bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 group ${
                    alert.priority === 'high' ? 'border-l-4 border-l-red-500 ring-1 ring-red-200/50 dark:ring-red-800/30' :
                    alert.priority === 'medium' ? 'border-l-4 border-l-amber-500 ring-1 ring-amber-200/50 dark:ring-amber-800/30' :
                    'border-l-4 border-l-emerald-500 ring-1 ring-emerald-200/50 dark:ring-emerald-800/30'
                  }`}
                >
                  {/* Priority-based animated top accent */}
                  {alert.priority === 'high' && (
                    <div className='absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 via-rose-400 to-red-500 animate-pulse'></div>
                  )}
                  {alert.priority === 'medium' && (
                    <div className='absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500'></div>
                  )}
                  {alert.priority === 'low' && (
                    <div className='absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-green-400 to-emerald-500'></div>
                  )}

                  {/* Hover gradient overlay */}
                  <div className='absolute inset-0 bg-gradient-to-r from-transparent to-transparent group-hover:to-slate-50/50 dark:group-hover:to-slate-700/20 transition-all duration-500 pointer-events-none'></div>

                  <div className='flex items-start gap-4 relative z-10'>
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      className={`relative flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                        alert.priority === 'high' ? 'bg-gradient-to-br from-red-400 to-rose-600 text-white shadow-lg shadow-red-500/20' :
                        alert.priority === 'medium' ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/20' :
                        'bg-gradient-to-br from-emerald-400 to-green-600 text-white shadow-lg shadow-emerald-500/20'
                      }`}
                    >
                      {alert.type === 'ad' ? <Megaphone className="w-6 h-6" /> :
                       alert.type === 'vehicle' ? <Car className="w-6 h-6" /> :
                       <AlertTriangle className="w-6 h-6" />}
                    </motion.div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-start justify-between gap-2'>
                        <div className='flex-1'>
                          <h3 className='text-base font-semibold text-slate-800 dark:text-slate-200'>
                            {alert.title}
                          </h3>
                          <p className='text-sm text-slate-600 dark:text-slate-400 mt-1'>
                            {alert.message}
                          </p>
                        </div>
                        <div className='flex items-center gap-2'>
                          <span className='text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap flex items-center gap-1'>
                            <Clock className="w-3 h-3" />
                            {getTimeAgo(alert.timestamp)}
                          </span>
                          {/* Dismiss button */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setDismissedAlerts(prev => new Set([...prev, alert.id]))}
                            className='p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 opacity-0 group-hover:opacity-100'
                            title='Dismiss alert'
                          >
                            <X className='w-4 h-4' />
                          </motion.button>
                        </div>
                      </div>
                      <div className='flex items-center gap-2 mt-3'>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full shadow-sm ${
                          alert.priority === 'high' ? 'bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-red-500/20' :
                          alert.priority === 'medium' ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/20' :
                          'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-emerald-500/20'
                        }`}>
                          <span className='w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse' />
                          {alert.priority} priority
                        </span>
                        <span className='inline-block px-3 py-1.5 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 capitalize border border-slate-200 dark:border-slate-600'>
                          {alert.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      )}
    </div>
  )
}

export default Alerts
