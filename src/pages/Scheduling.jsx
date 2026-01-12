// src/pages/Scheduling.jsx
import React from "react";
import { motion } from "framer-motion";
import CampaignList from "../components/Campaigns/CampaignList";
import CampaignWizard from "../components/Campaigns/CampaignWizard/Index";
import RealTimeIndicator from "../components/ui/RealTimeIndicator";

export default function SchedulingPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 min-h-screen bg-[var(--app-bg)] transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 text-white px-6 py-5 rounded-xl shadow-lg border border-white/10"
        >
          <div className="flex items-center gap-4">
            <h1 className="text-xl md:text-2xl font-bold text-white">Campaign Scheduling</h1>
            <RealTimeIndicator isActive={true} />
          </div>
          <div className="text-sm text-white/80 font-medium">
            Manage your advertising campaigns and schedules
          </div>
        </motion.header>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <CampaignList />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CampaignWizard />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
