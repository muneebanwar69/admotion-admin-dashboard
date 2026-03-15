import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, X, ChevronLeft, User, Megaphone, CheckCheck, Check, Sparkles, Radio } from 'lucide-react'
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, limit, updateDoc, doc } from 'firebase/firestore'
import { db } from '../../firebase'
import { useDriverAuth } from '../../contexts/DriverAuthContext'
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
  hidden: { opacity: 0, x: -12 },
  visible: (i) => ({ opacity: 1, x: 0, transition: { delay: i * 0.04, type: 'spring', stiffness: 300, damping: 25 } }),
}

const DriverMessaging = () => {
  const { driver } = useDriverAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [conversations, setConversations] = useState([])
  const [broadcasts, setBroadcasts] = useState([])
  const [activeConvo, setActiveConvo] = useState(null)
  const [activeTab, setActiveTab] = useState('messages') // 'messages' | 'broadcasts'
  const [messages, setMessages] = useState([])
  const [messageText, setMessageText] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)
  const [broadcastUnread, setBroadcastUnread] = useState(0)
  const messagesEndRef = useRef(null)

  const driverId = driver?.uid // vehicle doc ID

  // Load conversations where this driver is a participant
  useEffect(() => {
    if (!driverId) return
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', driverId)
    )
    const unsub = onSnapshot(q, (snap) => {
      const convos = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          const ta = a.updatedAt?.toDate?.() || new Date(0)
          const tb = b.updatedAt?.toDate?.() || new Date(0)
          return tb - ta
        })
      setConversations(convos)
      const total = convos.reduce((sum, c) => sum + (c.unreadCount?.[driverId] || 0), 0)
      setUnreadCount(total)
    }, () => {})
    return unsub
  }, [driverId])

  // Load broadcasts
  useEffect(() => {
    if (!driverId) return
    const q = query(
      collection(db, 'broadcasts'),
      orderBy('timestamp', 'desc'),
      limit(50)
    )
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setBroadcasts(items)
      // Count unread broadcasts
      const unread = items.filter(b => !b.readBy?.includes(driverId)).length
      setBroadcastUnread(unread)
    }, () => {})
    return unsub
  }, [driverId])

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
      if (activeConvo.unreadCount?.[driverId] > 0) {
        updateDoc(doc(db, 'conversations', activeConvo.id), {
          [`unreadCount.${driverId}`]: 0
        }).catch(() => {})
      }
    }, () => {})
    return unsub
  }, [activeConvo?.id, driverId])

  // Send message (driver reply)
  const sendMessage = async () => {
    if (!messageText.trim() || !activeConvo || !driverId) return
    const text = messageText.trim()
    setMessageText('')
    try {
      const senderName = driver?.name || 'Driver'
      await addDoc(collection(db, 'conversations', activeConvo.id, 'messages'), {
        senderId: driverId,
        senderName,
        text,
        timestamp: serverTimestamp(),
        read: false,
      })
      const otherParticipant = activeConvo.participants?.find(p => p !== driverId)
      await updateDoc(doc(db, 'conversations', activeConvo.id), {
        lastMessage: { text, senderId: driverId, timestamp: serverTimestamp() },
        updatedAt: serverTimestamp(),
        ...(otherParticipant ? { [`unreadCount.${otherParticipant}`]: (activeConvo.unreadCount?.[otherParticipant] || 0) + 1 } : {}),
      })
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  // Mark broadcast as read
  const markBroadcastRead = async (broadcastId) => {
    if (!driverId) return
    try {
      const b = broadcasts.find(x => x.id === broadcastId)
      if (b && !b.readBy?.includes(driverId)) {
        const updatedReadBy = [...(b.readBy || []), driverId]
        await updateDoc(doc(db, 'broadcasts', broadcastId), { readBy: updatedReadBy })
      }
    } catch (e) { /* silent */ }
  }

  const getOtherName = (convo) => {
    if (!convo.participantNames) return 'Admin'
    const otherId = convo.participants?.find(p => p !== driverId)
    return convo.participantNames[otherId] || 'Admin'
  }

  const totalUnread = unreadCount + broadcastUnread

  return (
    <>
      {/* Floating Button - positioned above mobile bottom nav */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[9990]">
        {/* Gradient glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 blur-lg opacity-40 animate-pulse" />
        {/* Ring pulse for unreads */}
        {totalUnread > 0 && (
          <span className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-60" />
        )}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/30 flex items-center justify-center hover:shadow-2xl hover:shadow-blue-500/40 transition-all duration-300"
          style={{ width: '52px', height: '52px' }}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </motion.div>
            ) : (
              <motion.div key="msg" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </motion.div>
            )}
          </AnimatePresence>
          {totalUnread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 ring-2 ring-white dark:ring-slate-900"
            >
              {totalUnread > 9 ? '9+' : totalUnread}
            </motion.span>
          )}
        </motion.button>
      </div>

      {/* Chat Panel - full width on mobile, floating on desktop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 350, damping: 32 }}
            className="fixed inset-x-2 bottom-[5.5rem] sm:bottom-24 sm:right-6 sm:left-auto sm:w-[400px] z-[9991] h-[70vh] sm:h-[520px] bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 border border-white/20 dark:border-slate-700/50 flex flex-col overflow-hidden"
          >
            {/* Header with animated gradient */}
            <div className="relative flex items-center justify-between px-4 sm:px-5 py-3.5 flex-shrink-0 overflow-hidden">
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
                    className="p-2 sm:p-1.5 rounded-xl hover:bg-white/15 transition-colors -ml-1"
                  >
                    <ChevronLeft className="w-5 h-5 sm:w-4 sm:h-4 text-white" />
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
                    <p className="text-[10px] text-blue-200/80 -mt-0.5">Admin</p>
                  )}
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(false)}
                className="relative p-2 sm:p-1.5 rounded-xl hover:bg-white/15 transition-colors text-white"
              >
                <X className="w-5 h-5 sm:w-4 sm:h-4" />
              </motion.button>
            </div>

            {/* Tabs (when no active convo) */}
            <AnimatePresence>
              {!activeConvo && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex border-b border-slate-200/50 dark:border-slate-700/50 flex-shrink-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm"
                >
                  <button
                    onClick={() => setActiveTab('messages')}
                    className={`flex-1 py-3 sm:py-2.5 text-xs font-bold transition-colors relative ${
                      activeTab === 'messages'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      <MessageCircle className="w-3.5 h-3.5" />
                      Messages
                      {unreadCount > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-[9px] font-bold rounded-full shadow-sm"
                        >
                          {unreadCount}
                        </motion.span>
                      )}
                    </span>
                    {activeTab === 'messages' && (
                      <motion.div layoutId="driverMsgTab" className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('broadcasts')}
                    className={`flex-1 py-3 sm:py-2.5 text-xs font-bold transition-colors relative ${
                      activeTab === 'broadcasts'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      <Megaphone className="w-3.5 h-3.5" />
                      Broadcasts
                      {broadcastUnread > 0 && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold rounded-full shadow-sm"
                        >
                          {broadcastUnread}
                        </motion.span>
                      )}
                    </span>
                    {activeTab === 'broadcasts' && (
                      <motion.div layoutId="driverMsgTab" className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Conversation List */}
            <AnimatePresence mode="wait">
              {!activeConvo && activeTab === 'messages' && (
                <motion.div
                  key="messages-tab"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 32 }}
                  className="flex-1 overflow-y-auto"
                >
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
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No messages yet</p>
                      <p className="text-xs text-slate-400 mt-1 text-center">Admin will contact you here</p>
                    </div>
                  ) : (
                    <div className="py-1">
                      {conversations.map((convo, i) => {
                        const hasUnread = (convo.unreadCount?.[driverId] || 0) > 0
                        return (
                          <motion.button
                            key={convo.id}
                            custom={i}
                            variants={listItemVariants}
                            initial="hidden"
                            animate="visible"
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setActiveConvo(convo)}
                            className={`w-full flex items-center gap-3.5 px-4 py-3.5 sm:py-3 transition-all text-left relative active:bg-blue-50/80 dark:active:bg-blue-900/20 ${hasUnread ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                          >
                            {/* Left accent for unread */}
                            {hasUnread && (
                              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-gradient-to-b from-blue-500 to-indigo-500" />
                            )}
                            <div className="relative flex-shrink-0">
                              <div className="w-12 h-12 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/15">
                                <User className="w-5 h-5 text-white" />
                              </div>
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
                                {convo.lastMessage?.senderId === driverId && (
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
                                {convo.unreadCount[driverId]}
                              </motion.span>
                            )}
                          </motion.button>
                        )
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Broadcasts List */}
            <AnimatePresence mode="wait">
              {!activeConvo && activeTab === 'broadcasts' && (
                <motion.div
                  key="broadcasts-tab"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 32 }}
                  className="flex-1 overflow-y-auto"
                >
                  {broadcasts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-400 px-6">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', delay: 0.1 }}
                        className="relative"
                      >
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 flex items-center justify-center mb-4">
                          <Megaphone className="w-10 h-10 text-amber-400/50" />
                        </div>
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                          className="absolute -top-1 -right-1 w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg"
                        >
                          <Radio className="w-3 h-3 text-white" />
                        </motion.div>
                      </motion.div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No broadcasts yet</p>
                      <p className="text-xs text-slate-400 mt-1 text-center">Admin announcements will appear here</p>
                    </div>
                  ) : (
                    <div className="py-2 px-2 space-y-2">
                      {broadcasts.map((b, i) => {
                        const isRead = b.readBy?.includes(driverId)
                        return (
                          <motion.div
                            key={b.id}
                            custom={i}
                            variants={listItemVariants}
                            initial="hidden"
                            animate="visible"
                            whileTap={{ scale: 0.98 }}
                            onClick={() => markBroadcastRead(b.id)}
                            className={`relative p-3.5 sm:p-3 rounded-2xl cursor-pointer transition-all border ${
                              !isRead
                                ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/15 dark:to-orange-900/10 border-amber-200/50 dark:border-amber-700/30 shadow-sm shadow-amber-500/5'
                                : 'bg-white/60 dark:bg-slate-800/40 border-slate-200/30 dark:border-slate-700/30 hover:bg-slate-50/80 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            {/* Unread indicator */}
                            {!isRead && (
                              <div className="absolute top-3 right-3">
                                <span className="flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                                </span>
                              </div>
                            )}
                            <div className="flex items-start gap-3">
                              <div className={`w-10 h-10 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                !isRead
                                  ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-md shadow-amber-500/20'
                                  : 'bg-gradient-to-br from-amber-300/60 to-orange-400/60'
                              }`}>
                                <Megaphone className={`w-4 h-4 ${!isRead ? 'text-white' : 'text-white/80'}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-xs font-bold ${!isRead ? 'text-amber-700 dark:text-amber-300' : 'text-amber-600/60 dark:text-amber-400/60'}`}>
                                    {b.senderName || 'Admin'}
                                  </span>
                                  <span className="text-[10px] text-slate-400">{formatTime(b.timestamp)}</span>
                                </div>
                                <p className={`text-sm whitespace-pre-wrap break-words leading-relaxed ${
                                  !isRead ? 'text-slate-700 dark:text-slate-200 font-medium' : 'text-slate-600 dark:text-slate-300'
                                }`}>
                                  {DOMPurify.sanitize(b.text)}
                                </p>
                                {isRead && (
                                  <div className="flex items-center gap-1 mt-1.5">
                                    <CheckCheck className="w-3 h-3 text-amber-500/50" />
                                    <span className="text-[10px] text-slate-400">Read</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )
                      })}
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
                        <p className="text-xs text-slate-400 mt-0.5">Say hello to get started</p>
                      </motion.div>
                    )}
                    {messages.map((msg) => {
                      const isMine = msg.senderId === driverId
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
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center flex-shrink-0 mr-2 mt-auto mb-1 shadow-sm">
                              <User className="w-3.5 h-3.5 text-white" />
                            </div>
                          )}
                          <div className={`max-w-[78%] sm:max-w-[72%] relative ${isMine ? 'order-1' : ''}`}>
                            <div className={`px-3.5 py-2.5 text-sm ${
                              isMine
                                ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl rounded-br-md shadow-md shadow-blue-500/15'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl rounded-bl-md shadow-sm border border-slate-100 dark:border-slate-700/50'
                            }`}>
                              {!isMine && (
                                <p className="text-[10px] font-bold text-blue-500 dark:text-blue-400 mb-0.5">
                                  {msg.senderName || 'Admin'}
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

                  {/* Message Input - touch friendly */}
                  <div className="flex-shrink-0 px-3 py-3 sm:py-2.5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border-t border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex items-center gap-2">
                      <input
                        value={messageText}
                        onChange={e => setMessageText(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                        placeholder="Type a reply..."
                        className="flex-1 bg-slate-100/80 dark:bg-slate-800/60 rounded-xl px-4 py-3 sm:py-2.5 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 outline-none ring-2 ring-transparent focus:ring-blue-400/30 transition-all"
                      />
                      <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.9, rotate: -15 }}
                        onClick={sendMessage}
                        disabled={!messageText.trim()}
                        className="p-3 sm:p-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20 disabled:shadow-none flex-shrink-0"
                      >
                        <Send className="w-5 h-5 sm:w-4 sm:h-4" />
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

export default DriverMessaging
