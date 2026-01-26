import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-brand-900 mx-auto mb-4'></div>
          <p className='text-slate-600 dark:text-slate-400'>Loading alerts...</p>
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

  return (
    <div className='p-4 md:p-6 transition-colors duration-300'>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 text-white px-6 py-4 rounded-xl shadow-lg mb-6 flex items-center justify-between border border-white/10'
      >
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6" />
          <div>
            <h1 className='text-xl md:text-2xl font-bold'>Activity & Alerts</h1>
            <p className="text-sm text-white/70 hidden sm:block">Monitor all system activities and important alerts</p>
          </div>
        </div>
        <RealTimeIndicator isActive={true} />
      </motion.div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6'>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className='bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300'
        >
          <div className='flex items-center gap-4'>
            <div className='p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl'>
              <Activity className='w-6 h-6 text-blue-600 dark:text-blue-400' />
            </div>
            <div>
              <p className='text-sm text-slate-600 dark:text-slate-400'>
                {searchQuery || dateFilter || filter !== 'All' ? 'Filtered Activities' : 'Total Activities'}
              </p>
              <p className='text-2xl font-bold text-slate-800 dark:text-slate-100'>
                {searchQuery || dateFilter || filter !== 'All' ? filteredActivityLogs.length : activityLogs.length}
              </p>
              {(searchQuery || dateFilter || filter !== 'All') && activityLogs.length > 0 && (
                <p className='text-xs text-slate-500 dark:text-slate-500'>of {activityLogs.length} total</p>
              )}
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className='bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300'
        >
          <div className='flex items-center gap-4'>
            <div className='p-3 bg-red-100 dark:bg-red-900/30 rounded-xl'>
              <AlertTriangle className='w-6 h-6 text-red-600 dark:text-red-400' />
            </div>
            <div>
              <p className='text-sm text-slate-600 dark:text-slate-400'>System Alerts</p>
              <p className='text-2xl font-bold text-slate-800 dark:text-slate-100'>{systemAlerts.length}</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className='bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300'
        >
          <div className='flex items-center gap-4'>
            <div className='p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl'>
              <TrendingUp className='w-6 h-6 text-emerald-600 dark:text-emerald-400' />
            </div>
            <div>
              <p className='text-sm text-slate-600 dark:text-slate-400'>Today's Actions</p>
              <p className='text-2xl font-bold text-slate-800 dark:text-slate-100'>
                {activityLogs.filter(log => {
                  const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.createdAt)
                  const today = new Date()
                  return logDate.toDateString() === today.toDateString()
                }).length}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <div className='flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700 overflow-x-auto'>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 sm:px-6 py-3 font-semibold transition-all duration-300 border-b-2 whitespace-nowrap ${
            activeTab === 'activity'
              ? 'border-brand-900 dark:border-blue-400 text-brand-900 dark:text-blue-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <div className='flex items-center gap-2'>
            <Activity className='w-5 h-5' />
            <span className='hidden sm:inline'>Activity Logs</span>
            <span className='sm:hidden'>Activity</span>
            <span className='text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700'>
              {activityLogs.length}
            </span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 sm:px-6 py-3 font-semibold transition-all duration-300 border-b-2 whitespace-nowrap ${
            activeTab === 'alerts'
              ? 'border-brand-900 dark:border-blue-400 text-brand-900 dark:text-blue-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <div className='flex items-center gap-2'>
            <AlertTriangle className='w-5 h-5' />
            <span className='hidden sm:inline'>System Alerts</span>
            <span className='sm:hidden'>Alerts</span>
            <span className='text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700'>
              {systemAlerts.length}
            </span>
          </div>
        </button>
      </div>

      {/* Search and Date Filter */}
      <div className='mb-6 grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* Search Bar */}
        <div className='relative'>
          <Search className='absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5' />
          <input
            type='text'
            placeholder='Search activities, admins, IDs, actions...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full pl-12 pr-12 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-900 dark:focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-slate-800 dark:text-slate-200'
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className='absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700'
            >
              <X className='w-4 h-4' />
            </button>
          )}
        </div>

        {/* Date Filter */}
        <div className='relative'>
          <Calendar className='absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5' />
          <input
            type='date'
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className='w-full pl-12 pr-12 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-900 dark:focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-slate-800 dark:text-slate-200'
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className='absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700'
            >
              <X className='w-4 h-4' />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className='flex gap-2 mb-6 overflow-x-auto pb-2'>
        {['All', 'Ad', 'Vehicle', 'Campaign', 'Profile', 'Admin', 'Login', 'Logout'].map((filterType) => (
          <motion.button
            key={filterType}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setFilter(filterType)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
              filter === filterType
                ? 'bg-gradient-to-r from-brand-900 to-brand-800 text-white shadow-lg'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-brand-900 dark:hover:border-slate-600'
            }`}
          >
            {filterType}
          </motion.button>
        ))}
      </div>

      {/* Active Filters Display */}
      {(searchQuery || dateFilter || filter !== 'All') && (
        <div className='mb-6 flex flex-wrap items-center gap-2'>
          <span className='text-sm text-slate-600 dark:text-slate-400'>Active filters:</span>
          {filter !== 'All' && (
            <span className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium'>
              Type: {filter}
              <button onClick={() => setFilter('All')} className='hover:text-blue-900 dark:hover:text-blue-300'>
                <X className='w-3.5 h-3.5' />
              </button>
            </span>
          )}
          {searchQuery && (
            <span className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-sm font-medium'>
              Search: "{searchQuery}"
              <button onClick={() => setSearchQuery('')} className='hover:text-emerald-900 dark:hover:text-emerald-300'>
                <X className='w-3.5 h-3.5' />
              </button>
            </span>
          )}
          {dateFilter && (
            <span className='inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-sm font-medium'>
              Date: {new Date(dateFilter).toLocaleDateString()}
              <button onClick={() => setDateFilter('')} className='hover:text-purple-900 dark:hover:text-purple-300'>
                <X className='w-3.5 h-3.5' />
              </button>
            </span>
          )}
          <button
            onClick={() => {
              setFilter('All')
              setSearchQuery('')
              setDateFilter('')
            }}
            className='text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-semibold transition-colors'
          >
            Clear all
          </button>
        </div>
      )}

      {/* Activity Logs Tab */}
      {activeTab === 'activity' && (
        <div className='space-y-6'>
          {filteredActivityLogs.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className='bg-white dark:bg-slate-800 p-12 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 text-center'
            >
              <div className='w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center'>
                <Activity className='w-8 h-8 text-slate-400 dark:text-slate-500' />
              </div>
              <h3 className='text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2'>
                {searchQuery || dateFilter ? 'No matching activities found' : 'No activity logs yet'}
              </h3>
              <p className='text-slate-500 dark:text-slate-400'>
                {searchQuery || dateFilter 
                  ? 'Try adjusting your search or date filter.'
                  : 'Activity logs will appear here when actions are performed in the system.'}
              </p>
            </motion.div>
          ) : (
            Object.entries(groupedActivityLogs).map(([dateLabel, logs]) => (
              <div key={dateLabel} className='space-y-3'>
                {/* Date Header */}
                <div className='flex items-center gap-3 mb-4'>
                  <div className='flex items-center gap-2 bg-gradient-to-r from-brand-900 to-brand-800 text-white px-4 py-2 rounded-xl shadow-lg'>
                    <Calendar className='w-4 h-4' />
                    <h3 className='text-sm font-semibold'>{dateLabel}</h3>
                  </div>
                  <div className='flex-1 h-px bg-gradient-to-r from-slate-300 dark:from-slate-600 to-transparent'></div>
                  <span className='text-xs text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-full'>
                    {logs.length} {logs.length === 1 ? 'activity' : 'activities'}
                  </span>
                </div>

                {/* Activities for this date */}
                {logs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className='bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 hover:border-brand-900/30 dark:hover:border-slate-600'
                  >
                    <div className='flex items-start gap-4'>
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                        log.action === 'created' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                        log.action === 'updated' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                        log.action === 'deleted' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
                        'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}>
                        {getActivityIcon(log.type, log.action)}
                      </div>
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
                            <div className='w-8 h-8 rounded-full bg-gradient-to-br from-brand-900 to-brand-800 flex items-center justify-center'>
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
                            <span className={`inline-block px-3 py-1.5 text-xs font-semibold rounded-full ${getActionColor(log.action)}`}>
                              {log.action.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {/* System Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className='space-y-4'>
          {filteredSystemAlerts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className='bg-white dark:bg-slate-800 p-12 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 text-center'
            >
              <div className='w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center'>
                <CheckCircle className='w-8 h-8 text-emerald-500 dark:text-emerald-400' />
              </div>
              <h3 className='text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2'>
                {searchQuery ? 'No matching alerts found' : 'All Clear!'}
              </h3>
              <p className='text-slate-500 dark:text-slate-400'>
                {searchQuery 
                  ? 'Try adjusting your search filter.'
                  : 'System alerts will appear here when attention is needed.'}
              </p>
            </motion.div>
          ) : (
            filteredSystemAlerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-lg border-l-4 border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 ${
                  alert.priority === 'high' ? 'border-l-red-500' : 
                  alert.priority === 'medium' ? 'border-l-amber-500' : 'border-l-emerald-500'
                }`}
              >
                <div className='flex items-start gap-4'>
                  <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                    alert.type === 'ad' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                    alert.type === 'vehicle' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                    'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                  }`}>
                    {alert.type === 'ad' ? <Megaphone className="w-6 h-6" /> :
                     alert.type === 'vehicle' ? <Car className="w-6 h-6" /> :
                     <AlertTriangle className="w-6 h-6" />}
                  </div>
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
                      <span className='text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap flex items-center gap-1'>
                        <Clock className="w-3 h-3" />
                        {getTimeAgo(alert.timestamp)}
                      </span>
                    </div>
                    <div className='flex items-center gap-2 mt-3'>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full ${
                        alert.priority === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                        alert.priority === 'medium' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                        'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          alert.priority === 'high' ? 'bg-red-500' :
                          alert.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                        } animate-pulse`} />
                        {alert.priority} priority
                      </span>
                      <span className='inline-block px-3 py-1.5 text-xs font-semibold rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 capitalize'>
                        {alert.type}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default Alerts
