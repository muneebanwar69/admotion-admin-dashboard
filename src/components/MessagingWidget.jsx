import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, X, Search, User, ChevronLeft, Megaphone, Car, Paperclip, CheckCheck, Check, Sparkles, Plus } from 'lucide-react'
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, getDocs, limit, updateDoc, doc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import DOMPurify from 'dompurify'

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  const now = new Date()
  const diff = Math.floor((now - date) / 1000)
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const msgVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 30 } },
}

const listItemVariants = {
  hidden: { opacity: 0, x: -16 },
  visible: (i) => ({ opacity: 1, x: 0, transition: { delay: i * 0.04, type: 'spring', stiffness: 300, damping: 25 } }),
}

const MessagingWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [conversations, setConversations] = useState([])
  const [activeConvo, setActiveConvo] = useState(null)
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [admins, setAdmins] = useState([])
  const [drivers, setDrivers] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNewChat, setShowNewChat] = useState(false)
  const [showBroadcast, setShowBroadcast] = useState(false)
  const [broadcastText, setBroadcastText] = useState('')
  const messagesEndRef = useRef(null)
  const { currentUser } = useAuth()

  // Load conversations
  useEffect(() => {
    if (!currentUser?.uid) return
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', currentUser.uid)
    )
    const unsub = onSnapshot(q, (snap) => {
      const convos = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const ta = a.updatedAt?.toDate?.() || new Date(0)
          const tb = b.updatedAt?.toDate?.() || new Date(0)
          return tb - ta
        })
      setConversations(convos)
      const total = convos.reduce((sum, c) => sum + (c.unreadCount?.[currentUser.uid] || 0), 0)
      setUnreadCount(total)
    }, () => {})
    return unsub
  }, [currentUser?.uid])

  // Load messages for active conversation
  useEffect(() => {
    if (!activeConvo) { setMessages([]); return }
    const q = query(
      collection(db, 'conversations', activeConvo.id, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    )
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      // Mark as read
      if (activeConvo.unreadCount?.[currentUser?.uid] > 0) {
        updateDoc(doc(db, 'conversations', activeConvo.id), {
          [`unreadCount.${currentUser.uid}`]: 0
        }).catch(() => {})
      }
    }, () => {})
    return unsub
  }, [activeConvo?.id, currentUser?.uid])

  // Load admins and drivers for new chat
  useEffect(() => {
    if (!showNewChat) return
    getDocs(collection(db, 'admins')).then(snap => {
      setAdmins(snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(a => a.id !== currentUser?.uid)
      )
    }).catch(() => {})
    const unsubDrivers = onSnapshot(collection(db, 'vehicles'), (snap) => {
      setDrivers(snap.docs.map(d => ({ id: d.id, ...d.data(), type: 'driver' })))
    })
    return unsubDrivers
  }, [showNewChat, currentUser?.uid])

  const sendMessage = async () => {
    if (!messageText.trim() || !activeConvo) return
    const text = messageText.trim()
    setMessageText('')
    try {
      await addDoc(collection(db, 'conversations', activeConvo.id, 'messages'), {
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.username || 'Admin',
        text,
        timestamp: serverTimestamp(),
        read: false,
      })
      // Update conversation
      const otherParticipant = activeConvo.participants?.find(p => p !== currentUser.uid)
      await updateDoc(doc(db, 'conversations', activeConvo.id), {
        lastMessage: { text, senderId: currentUser.uid, timestamp: serverTimestamp() },
        updatedAt: serverTimestamp(),
        ...(otherParticipant ? { [`unreadCount.${otherParticipant}`]: (activeConvo.unreadCount?.[otherParticipant] || 0) + 1 } : {}),
      })
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  const handleBroadcast = async () => {
    if (!broadcastText.trim()) return
    try {
      await addDoc(collection(db, 'broadcasts'), {
        senderId: currentUser?.uid,
        senderName: currentUser?.displayName || 'Admin',
        text: broadcastText.trim(),
        timestamp: serverTimestamp(),
        readBy: []
      })
      setBroadcastText('')
      setShowBroadcast(false)
    } catch (err) {
      console.error('Failed to send broadcast:', err)
    }
  }

  const startNewConversation = async (admin) => {
    // Check for existing conversation
    const existing = conversations.find(c =>
      c.participants?.includes(admin.id) && c.participants?.includes(currentUser.uid)
    )
    if (existing) {
      setActiveConvo(existing)
      setShowNewChat(false)
      return
    }
    try {
      const contactName = admin.type === 'driver'
        ? `${admin.ownerName || 'Driver'} (${admin.carId || admin.id})`
        : (admin.name || admin.username || 'Admin')
      const docRef = await addDoc(collection(db, 'conversations'), {
        participants: [currentUser.uid, admin.id],
        participantNames: {
          [currentUser.uid]: currentUser.displayName || currentUser.username || 'Admin',
          [admin.id]: contactName,
        },
        participantType: admin.type === 'driver' ? 'driver' : 'admin',
        lastMessage: null,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        unreadCount: { [currentUser.uid]: 0, [admin.id]: 0 },
      })
      setActiveConvo({ id: docRef.id, participants: [currentUser.uid, admin.id], participantNames: { [currentUser.uid]: currentUser.displayName, [admin.id]: contactName } })
      setShowNewChat(false)
    } catch (err) {
      console.error('Failed to create conversation:', err)
    }
  }

  const getOtherName = (convo) => {
    if (!convo.participantNames) return 'Unknown'
    const otherId = convo.participants?.find(p => p !== currentUser?.uid)
    return convo.participantNames[otherId] || 'Unknown'
  }

  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') { if (activeConvo) setActiveConvo(null); else setIsOpen(false) } }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, activeConvo])

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery) return true
    return getOtherName(c).toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-[9990]">
        {/* Gradient glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 blur-lg opacity-40 animate-pulse" />
        {/* Animated ring pulse for unreads */}
        {unreadCount > 0 && (
          <span className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-60" />
        )}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/30 flex items-center justify-center hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div key="msg" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <MessageCircle className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 ring-2 ring-white dark:ring-slate-900"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </motion.button>
      </div>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
            className="fixed bottom-24 right-6 z-[9991] w-[420px] h-[540px] bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 border border-white/20 dark:border-slate-700/50 flex flex-col overflow-hidden"
          >
            {/* Header with animated gradient */}
            <div className="relative flex items-center justify-between px-5 py-3.5 flex-shrink-0 overflow-hidden">
              {/* Animated gradient bg */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 opacity-0 hover:opacity-100 transition-opacity duration-700" />
              {/* Shimmer */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -inset-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_3s_infinite] skew-x-12" />
              </div>
              <div className="relative flex items-center gap-2.5">
                {activeConvo ? (
                  <motion.button
                    whileHover={{ x: -2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setActiveConvo(null)}
                    className="p-1.5 rounded-xl hover:bg-white/15 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-white" />
                  </motion.button>
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                )}
                <div>
                  <span className="font-semibold text-sm text-white tracking-tight">
                    {activeConvo ? getOtherName(activeConvo) : 'Messages'}
                  </span>
                  {activeConvo && (
                    <p className="text-[10px] text-blue-200/80 -mt-0.5">
                      {activeConvo.participantType === 'driver' ? 'Driver' : 'Admin'}
                    </p>
                  )}
                </div>
              </div>
              <div className="relative flex items-center gap-1">
                {!activeConvo && !showNewChat && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowNewChat(true)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-colors backdrop-blur-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-white/15 transition-colors text-white"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* Broadcast Dialog */}
            <AnimatePresence>
              {showBroadcast && !activeConvo && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden flex-shrink-0"
                >
                  <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border-b border-amber-200/50 dark:border-amber-800/30">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                        <Megaphone className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Broadcast to All Drivers</p>
                        <p className="text-[10px] text-amber-600/70 dark:text-amber-400/60">Message will reach all active drivers</p>
                      </div>
                    </div>
                    <textarea
                      value={broadcastText}
                      onChange={e => setBroadcastText(e.target.value)}
                      placeholder="Type your broadcast message..."
                      rows={3}
                      maxLength={500}
                      className="w-full px-3.5 py-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none border border-amber-200/50 dark:border-amber-700/30 resize-none focus:ring-2 focus:ring-amber-400/40 transition-shadow"
                    />
                    <div className="flex items-center justify-between mt-2.5">
                      <span className={`text-[10px] font-medium ${broadcastText.length > 450 ? 'text-red-500' : 'text-amber-500/60'}`}>
                        {broadcastText.length}/500
                      </span>
                      <div className="flex gap-2">
                        <button onClick={() => { setShowBroadcast(false); setBroadcastText('') }} className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                          Cancel
                        </button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleBroadcast}
                          disabled={!broadcastText.trim()}
                          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white disabled:opacity-40 transition-all shadow-lg shadow-amber-500/20 disabled:shadow-none"
                        >
                          <Send className="w-3 h-3" /> Broadcast
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* New Chat Panel */}
            <AnimatePresence>
              {showNewChat && !activeConvo && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 overflow-y-auto"
                >
                  {/* Search in new chat */}
                  <div className="sticky top-0 z-10 p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
                    <div className="relative group">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        placeholder="Search contacts..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none ring-2 ring-transparent focus:ring-blue-400/40 transition-all"
                      />
                    </div>
                    <button
                      onClick={() => setShowNewChat(false)}
                      className="absolute top-3.5 right-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="px-3 pb-3">
                    {/* Broadcast Card */}
                    <motion.button
                      whileHover={{ y: -2, scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setShowBroadcast(true); setShowNewChat(false) }}
                      className="w-full flex items-center gap-3 p-3.5 mb-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/15 dark:to-orange-900/10 border border-amber-200/50 dark:border-amber-700/30 hover:shadow-lg hover:shadow-amber-500/10 transition-all text-left group"
                    >
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/30 transition-shadow">
                        <Megaphone className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Broadcast to All</p>
                        <p className="text-xs text-amber-600/60 dark:text-amber-400/50">Send announcement to all drivers</p>
                      </div>
                      <Sparkles className="w-4 h-4 text-amber-400 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>

                    {/* Admins Section */}
                    <p className="text-[10px] text-slate-400 px-1 mb-2 mt-4 font-bold uppercase tracking-widest">Admins</p>
                    <div className="space-y-1">
                      {admins.map((admin, i) => (
                        <motion.button
                          key={admin.id}
                          custom={i}
                          variants={listItemVariants}
                          initial="hidden"
                          animate="visible"
                          whileHover={{ x: 4, backgroundColor: 'rgba(59, 130, 246, 0.05)' }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => startNewConversation(admin)}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left group"
                        >
                          <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
                              <User className="w-4.5 h-4.5 text-white" />
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{admin.name || admin.username}</p>
                            <p className="text-[11px] text-slate-400">{admin.role || 'Admin'}</p>
                          </div>
                        </motion.button>
                      ))}
                      {admins.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-3 italic">No other admins found</p>
                      )}
                    </div>

                    {/* Drivers Section */}
                    <p className="text-[10px] text-slate-400 px-1 mb-2 mt-5 font-bold uppercase tracking-widest">Drivers</p>
                    <div className="space-y-1">
                      {drivers.map((driver, i) => (
                        <motion.button
                          key={driver.id}
                          custom={i}
                          variants={listItemVariants}
                          initial="hidden"
                          animate="visible"
                          whileHover={{ x: 4, backgroundColor: 'rgba(16, 185, 129, 0.05)' }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => startNewConversation(driver)}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left group"
                        >
                          <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-md shadow-green-500/20 group-hover:shadow-green-500/30 transition-shadow">
                              <Car className="w-4.5 h-4.5 text-white" />
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{driver.ownerName || 'Unknown Driver'}</p>
                            <p className="text-[11px] text-slate-400">{driver.carId || driver.vehicleName || driver.id}</p>
                          </div>
                        </motion.button>
                      ))}
                      {drivers.length === 0 && (
                        <p className="text-xs text-slate-400 text-center py-3 italic">No drivers found</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Conversation List */}
            <AnimatePresence mode="wait">
              {!activeConvo && !showNewChat && (
                <motion.div
                  key="convo-list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex-1 overflow-y-auto"
                >
                  {/* Search */}
                  <div className="sticky top-0 z-10 p-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
                    <div className="relative group">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                      <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search conversations..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100/80 dark:bg-slate-800/60 rounded-xl text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none ring-2 ring-transparent focus:ring-blue-400/40 transition-all"
                      />
                    </div>
                  </div>

                  {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 px-6">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', delay: 0.1 }}
                        className="relative"
                      >
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center mb-4">
                          <MessageCircle className="w-10 h-10 text-blue-400/50" />
                        </div>
                        <motion.div
                          animate={{ y: [0, -4, 0] }}
                          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                          className="absolute -top-1 -right-1 w-6 h-6 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center shadow-lg"
                        >
                          <Sparkles className="w-3 h-3 text-white" />
                        </motion.div>
                      </motion.div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No conversations yet</p>
                      <p className="text-xs text-slate-400 mt-1 text-center">Start connecting with your team</p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowNewChat(true)}
                        className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-shadow"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Start a Chat
                      </motion.button>
                    </div>
                  ) : (
                    <div className="py-1">
                      {filteredConversations.map((convo, i) => {
                        const hasUnread = (convo.unreadCount?.[currentUser?.uid] || 0) > 0
                        const isDriver = convo.participantType === 'driver'
                        return (
                          <motion.button
                            key={convo.id}
                            custom={i}
                            variants={listItemVariants}
                            initial="hidden"
                            animate="visible"
                            whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.04)' }}
                            onClick={() => setActiveConvo(convo)}
                            className={`w-full flex items-center gap-3.5 px-4 py-3 transition-all text-left relative ${hasUnread ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                          >
                            {/* Left accent for unread */}
                            {hasUnread && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b from-blue-500 to-indigo-500" />
                            )}
                            <div className="relative flex-shrink-0">
                              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md ${
                                isDriver
                                  ? 'bg-gradient-to-br from-emerald-400 to-green-600 shadow-green-500/15'
                                  : 'bg-gradient-to-br from-blue-400 to-indigo-600 shadow-blue-500/15'
                              }`}>
                                {isDriver ? (
                                  <Car className="w-5 h-5 text-white" />
                                ) : (
                                  <User className="w-5 h-5 text-white" />
                                )}
                              </div>
                              {/* Online dot */}
                              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-[2.5px] border-white dark:border-slate-900" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className={`text-sm tracking-tight truncate ${hasUnread ? 'font-bold text-slate-800 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-200'}`}>
                                  {getOtherName(convo)}
                                </span>
                                <span className={`text-[10px] flex-shrink-0 ml-2 ${hasUnread ? 'text-blue-500 font-semibold' : 'text-slate-400'}`}>
                                  {formatTime(convo.updatedAt)}
                                </span>
                              </div>
                              <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'text-slate-600 dark:text-slate-300 font-medium' : 'text-slate-400'}`}>
                                {convo.lastMessage?.senderId === currentUser?.uid && (
                                  <span className="text-blue-400 mr-1">You:</span>
                                )}
                                {convo.lastMessage?.text || 'No messages yet'}
                              </p>
                            </div>
                            {hasUnread && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="min-w-[22px] h-[22px] px-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20"
                              >
                                {convo.unreadCount[currentUser.uid]}
                              </motion.span>
                            )}
                          </motion.button>
                        )
                      })}
                      {filteredConversations.length === 0 && searchQuery && (
                        <div className="flex flex-col items-center py-10 text-slate-400">
                          <Search className="w-8 h-8 mb-2 opacity-30" />
                          <p className="text-sm">No results for "{searchQuery}"</p>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message Thread */}
            <AnimatePresence mode="wait">
              {activeConvo && (
                <motion.div
                  key="thread"
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 32 }}
                  className="flex-1 flex flex-col min-h-0"
                >
                  {/* Messages area */}
                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5" style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(59,130,246,0.03) 0%, transparent 50%)' }}>
                    {messages.length === 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-12 text-slate-400"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 flex items-center justify-center mb-3">
                          <Send className="w-7 h-7 text-blue-400/50 -rotate-12" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">No messages yet</p>
                        <p className="text-xs text-slate-400 mt-0.5">Send the first message to get started</p>
                      </motion.div>
                    )}
                    {messages.map((msg, idx) => {
                      const isMine = msg.senderId === currentUser?.uid
                      return (
                        <motion.div
                          key={msg.id}
                          variants={msgVariants}
                          initial="hidden"
                          animate="visible"
                          className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                        >
                          {/* Other user avatar */}
                          {!isMine && (
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center flex-shrink-0 mr-2 mt-auto mb-1 shadow-sm">
                              <User className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                          <div className={`max-w-[72%] relative group ${isMine ? 'order-1' : ''}`}>
                            <div className={`px-3.5 py-2.5 text-sm ${
                              isMine
                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl rounded-br-md shadow-md shadow-blue-500/15'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl rounded-bl-md shadow-sm border border-slate-100 dark:border-slate-700/50'
                            }`}>
                              {!isMine && (
                                <p className="text-[10px] font-bold text-blue-500 dark:text-blue-400 mb-0.5">
                                  {msg.senderName}
                                </p>
                              )}
                              <p className="whitespace-pre-wrap break-words leading-relaxed">{DOMPurify.sanitize(msg.text)}</p>
                              <div className={`flex items-center justify-end gap-1 mt-1 ${isMine ? 'text-blue-200/70' : 'text-slate-400'}`}>
                                <span className="text-[9px]">{formatTime(msg.timestamp)}</span>
                                {isMine && (
                                  msg.read
                                    ? <CheckCheck className="w-3 h-3 text-blue-200" />
                                    : <Check className="w-3 h-3 text-blue-300/50" />
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <div className="flex-shrink-0 px-3 py-2.5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex-shrink-0">
                        <Paperclip className="w-4.5 h-4.5" />
                      </button>
                      <input
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                        placeholder="Type a message..."
                        className="flex-1 bg-slate-100/80 dark:bg-slate-800/60 rounded-xl px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none ring-2 ring-transparent focus:ring-blue-400/30 transition-all"
                      />
                      <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.9, rotate: -15 }}
                        onClick={sendMessage}
                        disabled={!messageText.trim()}
                        className="p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20 disabled:shadow-none flex-shrink-0"
                      >
                        <Send className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default MessagingWidget
