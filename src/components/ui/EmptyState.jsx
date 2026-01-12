import React from 'react'
import { motion } from 'framer-motion'
import { FiPlusCircle, FiSearch, FiAlertCircle, FiInfo } from 'react-icons/fi'

const EmptyState = ({ 
  icon = <FiInfo />, 
  title, 
  description, 
  actionLabel, 
  onAction,
  className = '' 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="mb-6 p-6 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30"
      >
        <div className="text-6xl text-blue-600 dark:text-blue-400">
          {icon}
        </div>
      </motion.div>
      
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2"
      >
        {title}
      </motion.h3>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-slate-600 dark:text-slate-400 mb-8 max-w-md"
      >
        {description}
      </motion.p>
      
      {actionLabel && onAction && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          onClick={onAction}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          <FiPlusCircle className="w-5 h-5" />
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  )
}

export const EmptyVehicles = ({ onAdd }) => (
  <EmptyState
    icon={<FiInfo />}
    title="No Vehicles Yet"
    description="Start by adding your first vehicle to the system. You can manage multiple vehicles and track their advertising campaigns."
    actionLabel="Add Your First Vehicle"
    onAction={onAdd}
  />
)

export const EmptyAds = ({ onAdd }) => (
  <EmptyState
    icon={<FiSearch />}
    title="No Ads Created"
    description="Create your first advertisement campaign. Upload images or videos and set up your advertising schedule."
    actionLabel="Create Your First Ad"
    onAction={onAdd}
  />
)

export const EmptyCampaigns = ({ onAdd }) => (
  <EmptyState
    icon={<FiAlertCircle />}
    title="No Campaigns Scheduled"
    description="Set up your first advertising campaign by assigning ads to vehicles and scheduling their display times."
    actionLabel="Create New Campaign"
    onAction={onAdd}
  />
)

export const EmptyAlerts = () => (
  <EmptyState
    icon={<FiInfo />}
    title="All Clear!"
    description="You're all caught up. There are no alerts or notifications at this time."
    actionLabel={null}
    onAction={null}
  />
)

export const EmptySearch = ({ searchQuery }) => (
  <EmptyState
    icon={<FiSearch />}
    title={`No results for "${searchQuery}"`}
    description="Try adjusting your search terms or filters to find what you're looking for."
    actionLabel={null}
    onAction={null}
  />
)

export default EmptyState


