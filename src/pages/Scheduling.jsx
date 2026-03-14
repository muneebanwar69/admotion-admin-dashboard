// src/pages/Scheduling.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import CampaignList from "../components/Campaigns/CampaignList";
import CampaignWizard from "../components/Campaigns/CampaignWizard/Index";
import RealTimeIndicator from "../components/ui/RealTimeIndicator";
import runAiNow, { getSchedulerStatus, getWeather } from "../services/scheduler";
import { db } from "../firebase";
import { collection, onSnapshot, updateDoc, doc, serverTimestamp, deleteField } from "firebase/firestore";
import { useToast } from "../contexts/ToastContext";
import {
  Calendar, Cpu, CloudSun, Truck, Layers, Zap, Clock, RefreshCw, AlertCircle,
  Sun, CloudRain, CloudSnow, Cloud, Play, Settings, Trash2, CheckCircle
} from "lucide-react";

// Weather icon mapper
const WeatherIcon = ({ condition, className }) => {
  const c = (condition || '').toLowerCase();
  if (c.includes('rain')) return <CloudRain className={className} />;
  if (c.includes('snow') || c.includes('cold')) return <CloudSnow className={className} />;
  if (c.includes('cloud')) return <Cloud className={className} />;
  return <Sun className={className} />;
};

// Mini donut chart for scheduling overview
const MiniDonut = ({ segments, size = 80 }) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let cumulative = 0;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="transform -rotate-90">
      {segments.map((seg, i) => {
        const pct = (seg.value / total) * 100;
        const start = cumulative * 3.6;
        const end = (cumulative + pct) * 3.6;
        cumulative += pct;

        const x1 = 50 + 38 * Math.cos((start - 90) * Math.PI / 180);
        const y1 = 50 + 38 * Math.sin((start - 90) * Math.PI / 180);
        const x2 = 50 + 38 * Math.cos((end - 90) * Math.PI / 180);
        const y2 = 50 + 38 * Math.sin((end - 90) * Math.PI / 180);
        const large = pct > 50 ? 1 : 0;

        return (
          <path
            key={i}
            d={`M 50 50 L ${x1} ${y1} A 38 38 0 ${large} 1 ${x2} ${y2} Z`}
            fill={seg.color}
            className="transition-all duration-500"
          />
        );
      })}
      <circle cx="50" cy="50" r="22" fill="white" className="dark:fill-slate-800" />
    </svg>
  );
};

export default function SchedulingPage() {
  const [schedulerStatus, setSchedulerStatus] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [weatherData, setWeatherData] = useState({});
  const [runningAi, setRunningAi] = useState(false);
  const [schedulingMode, setSchedulingMode] = useState("ai"); // "ai" or "manual"
  const [vehicles, setVehicles] = useState([]);
  const [ads, setAds] = useState([]);
  const [selectedTestVehicle, setSelectedTestVehicle] = useState('');
  const [selectedTestAd, setSelectedTestAd] = useState('');
  const [testPushing, setTestPushing] = useState(false);
  const [testClearing, setTestClearing] = useState(false);
  const toast = useToast();

  const cities = ['Islamabad', 'Lahore', 'Karachi', 'Rawalpindi'];

  // Fetch scheduler status
  useEffect(() => {
    const fetchStatus = async () => {
      setStatusLoading(true);
      const status = await getSchedulerStatus();
      setSchedulerStatus(status);
      setStatusLoading(false);
    };
    fetchStatus();
  }, []);

  // Fetch weather for major cities
  useEffect(() => {
    const fetchWeather = async () => {
      const results = {};
      for (const city of cities) {
        const data = await getWeather(city);
        if (data) results[city] = data;
      }
      setWeatherData(results);
    };
    fetchWeather();
  }, []);

  // Listen to vehicles and ads for stats
  useEffect(() => {
    const unsubVehicles = onSnapshot(collection(db, 'vehicles'), (snap) => {
      setVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    const unsubAds = onSnapshot(collection(db, 'ads'), (snap) => {
      setAds(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => { unsubVehicles(); unsubAds(); };
  }, []);

  const handleRunAi = async () => {
    setRunningAi(true);
    try {
      await runAiNow();
      const status = await getSchedulerStatus();
      setSchedulerStatus(status);
    } catch (e) {
      console.error('AI scheduler run failed:', e);
    }
    setRunningAi(false);
  };

  const handlePushTestAd = async () => {
    if (!selectedTestVehicle || !selectedTestAd) {
      toast.warning('Please select both a vehicle and an ad');
      return;
    }
    setTestPushing(true);
    try {
      await updateDoc(doc(db, "vehicles", selectedTestVehicle), {
        assignedAds: [{
          adId: selectedTestAd,
          startTime: new Date().toISOString(),
          endTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          campaignId: 'test-mode',
          assignedAt: new Date().toISOString()
        }],
        lastAssignmentUpdate: serverTimestamp()
      });
      toast.success('Ad pushed to vehicle successfully!');
    } catch (e) {
      console.error('Test mode push failed:', e);
      toast.error('Failed to push ad to vehicle');
    }
    setTestPushing(false);
  };

  const handleClearTest = async () => {
    if (!selectedTestVehicle) {
      toast.warning('Please select a vehicle to clear');
      return;
    }
    setTestClearing(true);
    try {
      await updateDoc(doc(db, "vehicles", selectedTestVehicle), {
        assignedAds: deleteField(),
        lastAssignmentUpdate: serverTimestamp()
      });
      toast.success('Test ads cleared from vehicle');
    } catch (e) {
      console.error('Test mode clear failed:', e);
      toast.error('Failed to clear test ads');
    }
    setTestClearing(false);
  };

  const activeVehicles = vehicles.filter(v => v.status === 'Active').length;
  const activeAds = ads.filter(a => a.status === 'Active').length;
  const scheduledVehicles = vehicles.filter(v => v.assignedAds?.length > 0).length;
  const unscheduledVehicles = activeVehicles - scheduledVehicles;

  const overviewSegments = [
    { label: 'Scheduled', value: scheduledVehicles, color: '#10b981' },
    { label: 'Unscheduled', value: unscheduledVehicles > 0 ? unscheduledVehicles : 0, color: '#f59e0b' },
    { label: 'Inactive', value: vehicles.length - activeVehicles, color: '#94a3b8' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 min-h-screen bg-[var(--app-bg)] transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 text-white px-6 py-5 rounded-2xl shadow-xl border border-white/10"
        >
          <div className="flex items-center gap-4">
            <Calendar className="w-6 h-6" />
            <h1 className="text-xl md:text-2xl font-bold text-white">Campaign Scheduling</h1>
            <RealTimeIndicator isActive={true} />
          </div>
          <div className="text-sm text-white/80 font-medium">
            Manage your advertising campaigns and schedules
          </div>
        </motion.header>

        {/* Scheduling Mode Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.4 }}
          className="flex gap-3 mb-6"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSchedulingMode("ai")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-300 ${
              schedulingMode === "ai"
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-xl shadow-purple-500/30"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-purple-400"
            }`}
          >
            <Cpu className="w-4 h-4" /> AI Scheduler
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSchedulingMode("manual")}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all duration-300 ${
              schedulingMode === "manual"
                ? "bg-gradient-to-r from-brand-900 to-brand-800 text-white shadow-xl shadow-brand-900/30"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-brand-800"
            }`}
          >
            <Settings className="w-4 h-4" /> Manual Campaign
          </motion.button>
        </motion.div>

        {/* Top Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        >
          {/* AI Scheduler Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0, duration: 0.4 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-5 transition-all duration-300 hover:shadow-2xl hover:border-purple-200 dark:hover:border-purple-800 relative overflow-hidden"
          >
            {/* Subtle color accent on top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 opacity-80" />
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-500" />
                AI Scheduler Status
              </h3>
              {statusLoading ? (
                <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              ) : schedulerStatus?.ok !== false ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Online
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                  <AlertCircle className="w-3 h-3" />
                  Offline
                </span>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Last Run</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {schedulerStatus?.lastRun ? new Date(schedulerStatus.lastRun).toLocaleString() : 'Never'}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> Vehicles Scheduled</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{schedulerStatus?.vehiclesScheduled ?? scheduledVehicles}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5" /> Ads in Rotation</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{schedulerStatus?.adsInRotation ?? activeAds}</span>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRunAi}
              disabled={runningAi}
              className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                runningAi
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl'
              }`}
            >
              {runningAi ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run AI Scheduler Now
                </>
              )}
            </motion.button>
          </motion.div>

          {/* Scheduling Overview with Donut */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.4 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-5 transition-all duration-300 hover:shadow-2xl hover:border-amber-200 dark:hover:border-amber-800 relative overflow-hidden"
          >
            {/* Subtle color accent on top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 opacity-80" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-amber-500" />
              Scheduling Overview
            </h3>
            <div className="flex items-center gap-4">
              <MiniDonut segments={overviewSegments} />
              <div className="flex-1 space-y-2">
                {overviewSegments.map((seg, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
                      <span className="text-slate-600 dark:text-slate-400 font-medium">{seg.label}</span>
                    </div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{seg.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
              Total: {vehicles.length} vehicles / {ads.length} ads
            </div>
          </motion.div>

          {/* Weather Widget */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.4 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="group bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-5 transition-all duration-300 hover:shadow-2xl hover:border-sky-200 dark:hover:border-sky-800 relative overflow-hidden"
          >
            {/* Subtle color accent on top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-500 opacity-80" />
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-3">
              <CloudSun className="w-4 h-4 text-sky-500" />
              Weather - Major Cities
            </h3>
            <div className="space-y-2">
              {cities.map((city, idx) => {
                const w = weatherData[city];
                return (
                  <motion.div
                    key={city}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <WeatherIcon condition={w?.condition || 'sunny'} className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{city}</span>
                    </div>
                    <div className="text-right text-xs">
                      {w ? (
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{w.temp || '--'}C - {w.condition || 'N/A'}</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 italic">No data</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>

        {/* Quick Test Mode */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <motion.div
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
            className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-purple-200 dark:border-purple-800 p-6 transition-all duration-300 hover:shadow-2xl"
          >
            {/* Purple gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-purple-500/5 to-transparent rounded-bl-full pointer-events-none" />

            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-purple-500/30">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Quick Test Mode</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Instantly push an ad to a vehicle without waiting for the AI scheduler</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              {/* Vehicle Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Select Vehicle</label>
                <select
                  value={selectedTestVehicle}
                  onChange={(e) => setSelectedTestVehicle(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="">-- Choose a vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.plateNumber || v.licensePlate || v.id} {v.driverName ? `- ${v.driverName}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ad Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Select Ad</label>
                <select
                  value={selectedTestAd}
                  onChange={(e) => setSelectedTestAd(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="">-- Choose an ad --</option>
                  {ads.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.title || a.name || a.id}
                    </option>
                  ))}
                </select>
              </div>

              {/* Push Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handlePushTestAd}
                disabled={testPushing || !selectedTestVehicle || !selectedTestAd}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  testPushing || !selectedTestVehicle || !selectedTestAd
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40'
                }`}
              >
                {testPushing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Pushing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Push Ad to Vehicle
                  </>
                )}
              </motion.button>

              {/* Clear Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleClearTest}
                disabled={testClearing || !selectedTestVehicle}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  testClearing || !selectedTestVehicle
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700'
                }`}
              >
                {testClearing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Clear Test
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>

        {/* Campaign Content Grid */}
        <div className="grid grid-cols-1 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <CampaignList />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <CampaignWizard />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
