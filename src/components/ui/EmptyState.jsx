import React from 'react'
import { motion } from 'framer-motion'
import { PlusCircle, Search, AlertCircle, Info, Truck, Layers, Calendar, CheckCircle } from 'lucide-react'

const EmptyState = ({ 
  icon: Icon = Info, 
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
        className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 shadow-lg"
      >
        <Icon className="w-12 h-12 text-slate-400 dark:text-slate-500" />
      </motion.div>
      
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2"
      >
        {title}
      </motion.h3>
      
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-slate-500 dark:text-slate-400 mb-8 max-w-md"
      >
        {description}
      </motion.p>
      
      {actionLabel && onAction && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onAction}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-900 to-brand-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <PlusCircle className="w-5 h-5" />
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  )
}

export const EmptyVehicles = ({ onAdd }) => (
  <EmptyState
    icon={Truck}
    title="No Vehicles Yet"
    description="Start by adding your first vehicle to the system. You can manage multiple vehicles and track their advertising campaigns."
    actionLabel="Add Your First Vehicle"
    onAction={onAdd}
  />
)

export const EmptyAds = ({ onAdd }) => (
  <EmptyState
    icon={Layers}
    title="No Ads Created"
    description="Create your first advertisement campaign. Upload images or videos and set up your advertising schedule."
    actionLabel="Create Your First Ad"
    onAction={onAdd}
  />
)

export const EmptyCampaigns = ({ onAdd }) => (
  <EmptyState
    icon={Calendar}
    title="No Campaigns Scheduled"
    description="Set up your first advertising campaign by assigning ads to vehicles and scheduling their display times."
    actionLabel="Create New Campaign"
    onAction={onAdd}
  />
)

export const EmptyAlerts = () => (
  <EmptyState
    icon={CheckCircle}
    title="All Clear!"
    description="You're all caught up. There are no alerts or notifications at this time."
    actionLabel={null}
    onAction={null}
  />
)

export const EmptySearch = ({ searchQuery }) => (
  <EmptyState
    icon={Search}
    title={`No results for "${searchQuery}"`}
    description="Try adjusting your search terms or filters to find what you're looking for."
    actionLabel={null}
    onAction={null}
  />
)

export default EmptyState
