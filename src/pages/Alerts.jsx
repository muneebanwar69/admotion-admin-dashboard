import React, { useState, useEffect } from 'react'
import { FiAlertTriangle, FiActivity, FiClock, FiFilter, FiTrendingUp, FiSearch, FiCalendar, FiX } from 'react-icons/fi'
import { collection, query, orderBy, onSnapshot, limit, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

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
      <div className='p-6 bg-gray-50 min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading alerts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className='p-3 sm:p-4 md:p-6'>
      {/* Header with Stats */}
      <div className='mb-4 sm:mb-6'>
        <h1 className='text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2'>Activity & Alerts</h1>
        <p className='text-sm sm:text-base text-gray-600'>Monitor all system activities and important alerts</p>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6'>
        <div className='bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200'>
          <div className='flex items-center gap-3'>
            <div className='p-3 bg-blue-100 rounded-lg'>
              <FiActivity className='w-6 h-6 text-blue-600' />
            </div>
            <div>
              <p className='text-sm text-gray-600'>
                {searchQuery || dateFilter || filter !== 'All' ? 'Filtered Activities' : 'Total Activities'}
              </p>
              <p className='text-2xl font-bold text-gray-800'>
                {searchQuery || dateFilter || filter !== 'All' ? filteredActivityLogs.length : activityLogs.length}
              </p>
              {(searchQuery || dateFilter || filter !== 'All') && activityLogs.length > 0 && (
                <p className='text-xs text-gray-500'>of {activityLogs.length} total</p>
              )}
            </div>
          </div>
        </div>
        
        <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200'>
          <div className='flex items-center gap-3'>
            <div className='p-3 bg-red-100 rounded-lg'>
              <FiAlertTriangle className='w-6 h-6 text-red-600' />
            </div>
            <div>
              <p className='text-sm text-gray-600'>System Alerts</p>
              <p className='text-2xl font-bold text-gray-800'>{systemAlerts.length}</p>
            </div>
          </div>
        </div>
        
        <div className='bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200'>
          <div className='flex items-center gap-3'>
            <div className='p-3 bg-green-100 rounded-lg'>
              <FiTrendingUp className='w-6 h-6 text-green-600' />
            </div>
            <div>
              <p className='text-sm text-gray-600'>Today's Actions</p>
              <p className='text-2xl font-bold text-gray-800'>
                {activityLogs.filter(log => {
                  const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : new Date(log.createdAt)
                  const today = new Date()
                  return logDate.toDateString() === today.toDateString()
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className='flex gap-2 mb-4 sm:mb-6 border-b border-gray-200 overflow-x-auto'>
        <button
          onClick={() => setActiveTab('activity')}
          className={`px-4 sm:px-6 py-2 sm:py-3 font-medium transition-all duration-200 border-b-2 whitespace-nowrap touch-manipulation min-w-[120px] ${
            activeTab === 'activity'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          <div className='flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base'>
            <FiActivity className='w-4 h-4 sm:w-5 sm:h-5' />
            <span className='hidden sm:inline'>Activity Logs</span>
            <span className='sm:hidden'>Activity</span>
            <span className='text-xs sm:text-sm'>({activityLogs.length})</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('alerts')}
          className={`px-4 sm:px-6 py-2 sm:py-3 font-medium transition-all duration-200 border-b-2 whitespace-nowrap touch-manipulation min-w-[120px] ${
            activeTab === 'alerts'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          <div className='flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base'>
            <FiAlertTriangle className='w-4 h-4 sm:w-5 sm:h-5' />
            <span className='hidden sm:inline'>System Alerts</span>
            <span className='sm:hidden'>Alerts</span>
            <span className='text-xs sm:text-sm'>({systemAlerts.length})</span>
          </div>
        </button>
      </div>

      {/* Search and Date Filter */}
      <div className='mb-4 sm:mb-6 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4'>
        {/* Search Bar */}
        <div className='relative'>
          <FiSearch className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
          <input
            type='text'
            placeholder='Search activities, admins, IDs, actions...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full pl-10 pr-10 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101c44] focus:border-transparent transition-all duration-200 hover:border-gray-400 text-sm sm:text-base'
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
            >
              <FiX className='w-5 h-5' />
            </button>
          )}
        </div>

        {/* Date Filter */}
        <div className='relative'>
          <FiCalendar className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
          <input
            type='date'
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className='w-full pl-10 pr-10 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#101c44] focus:border-transparent transition-all duration-200 hover:border-gray-400 text-sm sm:text-base'
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors'
            >
              <FiX className='w-5 h-5' />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className='flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 -mx-3 sm:mx-0 px-3 sm:px-0'>
        {['All', 'Ad', 'Vehicle', 'Campaign', 'Profile', 'Admin', 'Login', 'Logout'].map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 transform hover:scale-105 touch-manipulation min-w-[60px] ${
              filter === filterType
                ? 'bg-[#101c44] text-white shadow-md'
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 active:bg-gray-100'
            }`}
          >
            {filterType}
          </button>
        ))}
      </div>

      {/* Active Filters Display */}
      {(searchQuery || dateFilter || filter !== 'All') && (
        <div className='mb-4 flex flex-wrap items-center gap-2'>
          <span className='text-sm text-gray-600'>Active filters:</span>
          {filter !== 'All' && (
            <span className='inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm'>
              Type: {filter}
              <button onClick={() => setFilter('All')} className='hover:text-blue-900'>
                <FiX className='w-3 h-3' />
              </button>
            </span>
          )}
          {searchQuery && (
            <span className='inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm'>
              Search: "{searchQuery}"
              <button onClick={() => setSearchQuery('')} className='hover:text-green-900'>
                <FiX className='w-3 h-3' />
              </button>
            </span>
          )}
          {dateFilter && (
            <span className='inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm'>
              Date: {new Date(dateFilter).toLocaleDateString()}
              <button onClick={() => setDateFilter('')} className='hover:text-purple-900'>
                <FiX className='w-3 h-3' />
              </button>
            </span>
          )}
          <button
            onClick={() => {
              setFilter('All')
              setSearchQuery('')
              setDateFilter('')
            }}
            className='text-sm text-red-600 hover:text-red-800 font-medium'
          >
            Clear all
          </button>
        </div>
      )}

      {/* Activity Logs Tab */}
      {activeTab === 'activity' && (
        <div className='space-y-6'>
          {filteredActivityLogs.length === 0 ? (
            <div className='bg-white p-12 rounded-lg shadow-sm border text-center'>
              <FiActivity className='w-16 h-16 text-gray-400 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-gray-700 mb-2'>
                {searchQuery || dateFilter ? 'No matching activities found' : 'No activity logs yet'}
              </h3>
            <p className='text-gray-500'>
                {searchQuery || dateFilter 
                  ? 'Try adjusting your search or date filter.'
                  : 'Activity logs will appear here when actions are performed in the system.'}
            </p>
          </div>
        ) : (
            Object.entries(groupedActivityLogs).map(([dateLabel, logs]) => (
              <div key={dateLabel} className='space-y-3'>
                {/* Date Header */}
                <div className='flex items-center gap-3 mb-4'>
                  <div className='flex items-center gap-2 bg-gradient-to-r from-[#101c44] to-[#182b5b] text-white px-4 py-2 rounded-lg shadow-md'>
                    <FiCalendar className='w-4 h-4' />
                    <h3 className='text-sm font-semibold'>{dateLabel}</h3>
                  </div>
                  <div className='flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent'></div>
                  <span className='text-xs text-gray-500 font-medium bg-gray-100 px-3 py-1 rounded-full'>
                    {logs.length} {logs.length === 1 ? 'activity' : 'activities'}
                  </span>
                </div>

                {/* Activities for this date */}
                {logs.map((log) => (
              <div
                key={log.id}
                className='bg-white p-5 rounded-lg shadow-sm border hover:shadow-md transition-all duration-200 hover:border-blue-300'
              >
                <div className='flex items-start gap-4'>
                  <div className='flex-shrink-0 text-3xl'>
                    {log.icon || '📝'}
                  </div>
                  <div className='flex-1 min-w-0'>
                    {/* Header with action and time */}
                    <div className='flex items-start justify-between gap-2 mb-2'>
                      <div className='flex-1'>
                        <h3 className='text-base font-semibold text-gray-900 capitalize mb-1'>
                          {log.type} {log.action.replace('_', ' ')}
                        </h3>
                        <p className='text-sm text-gray-600'>
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
                    <div className='flex items-center gap-3 mt-3 pt-3 border-t border-gray-100'>
                      <div className='flex items-center gap-2'>
                        <div className='w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center'>
                          <span className='text-sm font-medium text-blue-700'>
                            {(log.userName || 'Admin').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className='text-xs font-medium text-gray-900'>
                            {log.userName || 'Admin'}
                          </p>
                          <p className='text-xs text-gray-500'>
                            {formatDateTime(log.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className='ml-auto'>
                        <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${getActionColor(log.action)}`}>
                          {log.action.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {/* System Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className='space-y-3'>
          {filteredSystemAlerts.length === 0 ? (
            <div className='bg-white p-12 rounded-lg shadow-sm border text-center'>
              <FiAlertTriangle className='w-16 h-16 text-gray-400 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-gray-700 mb-2'>
                {searchQuery ? 'No matching alerts found' : 'No alerts at the moment'}
                    </h3>
              <p className='text-gray-500'>
                {searchQuery 
                  ? 'Try adjusting your search filter.'
                  : 'System alerts will appear here when attention is needed.'}
              </p>
            </div>
          ) : (
            filteredSystemAlerts.map((alert) => (
              <div
                key={alert.id}
                className='bg-white p-4 rounded-lg shadow-sm border border-l-4 hover:shadow-md transition-all duration-200'
                style={{ borderLeftColor: alert.priority === 'high' ? '#dc2626' : alert.priority === 'medium' ? '#f59e0b' : '#10b981' }}
              >
                <div className='flex items-start gap-4'>
                  <div className='flex-shrink-0 text-3xl'>
                    {alert.icon || '⚠️'}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-start justify-between gap-2'>
                      <div className='flex-1'>
                        <h3 className='text-sm font-semibold text-gray-900'>
                          {alert.title}
                        </h3>
                        <p className='text-sm text-gray-600 mt-1'>
                    {alert.message}
                  </p>
                      </div>
                      <span className='text-xs text-gray-500 whitespace-nowrap'>
                        {getTimeAgo(alert.timestamp)}
                      </span>
                    </div>
                    <div className='flex items-center gap-2 mt-3'>
                      <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${getPriorityColor(alert.priority)}`}>
                        {alert.priority} priority
                      </span>
                      <span className='inline-block px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 border border-gray-200 capitalize'>
                      {alert.type}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        </div>
      )}
  </div>
)
}

export default Alerts
