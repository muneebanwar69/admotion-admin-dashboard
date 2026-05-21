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
  Sun, CloudRain, CloudSnow, Cloud, Play, Settings, Trash2, CheckCircle,
  Timer, MapPin, Target, ListChecks, ArrowRight, Eye, DollarSign, Image as ImageIcon,
  Repeat, Check
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
  const [selectedTestAds, setSelectedTestAds] = useState([]); // array of ad ids (multi-select)
  const [testTransition, setTestTransition] = useState(true); // rotate every 10s vs stay still
  const [testPushing, setTestPushing] = useState(false);
  const [testClearing, setTestClearing] = useState(false);
  const [assignments, setAssignments] = useState([]);
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

  // Live AI schedule — assignments written by the scheduler (newest first)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'assignments'), (snap) => {
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const ms = (r) => {
        const t = r.createdAt?.toMillis ? r.createdAt.toMillis()
          : (r.startTime ? Date.parse(r.startTime) : 0);
        return t || 0;
      };
      rows.sort((a, b) => ms(b) - ms(a));
      setAssignments(rows.slice(0, 50));
    });
    return () => unsub();
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

  const toggleTestAd = (adId) => {
    setSelectedTestAds(prev =>
      prev.includes(adId) ? prev.filter(id => id !== adId) : [...prev, adId]
    );
  };

  const handlePushTestAd = async () => {
    if (!selectedTestVehicle || selectedTestAds.length === 0) {
      toast.warning('Please select a vehicle and at least one ad');
      return;
    }
    setTestPushing(true);
    try {
      // If transition is OFF, only the first selected ad is shown (stays still).
      // If ON, all selected ads are assigned and the display rotates every 10s.
      const adIds = testTransition ? selectedTestAds : selectedTestAds.slice(0, 1);
      const now = Date.now();
      const assignedAds = adIds.map((adId, i) => ({
        adId,
        startTime: new Date(now).toISOString(),
        endTime: new Date(now + 24 * 60 * 60 * 1000).toISOString(),
        displayMinutes: 0,           // demo: short rotation (display uses 10s default)
        campaignId: 'test-mode',
        order: i,
        assignedAt: new Date(now).toISOString(),
      }));
      await updateDoc(doc(db, "vehicles", selectedTestVehicle), {
        assignedAds,
        testTransition,              // hint flag for the display
        lastAssignmentUpdate: serverTimestamp()
      });
      toast.success(
        testTransition && adIds.length > 1
          ? `${adIds.length} ads pushed — display will rotate every 10s`
          : 'Ad pushed to vehicle (single, no transition)'
      );
    } catch (e) {
      console.error('Test mode push failed:', e);
      toast.error('Failed to push ads to vehicle');
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

  // ---- Live AI schedule table helpers ----
  const vehicleNameById = React.useMemo(() => {
    const m = {};
    vehicles.forEach(v => { m[v.id] = v.vehicleName || v.name || v.plate || v.id; });
    return m;
  }, [vehicles]);

  // ad image + meta lookup (fallback for assignments saved before images were stored)
  const adById = React.useMemo(() => {
    const m = {};
    ads.forEach(a => { m[a.id] = a; });
    return m;
  }, [ads]);
  const adImage = (a) => a.preview || adById[a.adId]?.preview || adById[a.adId]?.mediaUrl || '';
  const adCategory = (a) => a.category || adById[a.adId]?.category || '';
  const fmtPKR = (n) => `Rs ${Math.round(n || 0).toLocaleString()}`;

  // total estimated spend/impressions across the live schedule
  const scheduleTotals = React.useMemo(() => assignments.reduce((acc, a) => {
    acc.impressions += a.estimatedImpressions || 0;
    acc.cost += a.estimatedCost || 0;
    return acc;
  }, { impressions: 0, cost: 0 }), [assignments]);

  const fmtTime = (iso) => {
    if (!iso) return '--';
    const d = new Date(iso);
    return isNaN(d) ? '--' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  const durationMins = (a) => {
    if (!a.startTime || !a.endTime) return null;
    const mins = Math.round((Date.parse(a.endTime) - Date.parse(a.startTime)) / 60000);
    return Number.isFinite(mins) && mins > 0 ? mins : null;
  };
  const fmtWhen = (a) => {
    const t = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.startTime ? Date.parse(a.startTime) : null);
    if (!t) return '--';
    const diff = Date.now() - t;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(t).toLocaleString();
  };
  const slotColor = (slot) => ({
    morning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    afternoon: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    evening: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
    night: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  }[(slot || '').toLowerCase()] || 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300');

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
                <p className="text-xs text-slate-500 dark:text-slate-400">Pick a vehicle, select one or more ads, and push them instantly. With transition on, the screen rotates every 10s like a video.</p>
              </div>
            </div>

            {/* Row: vehicle + transition toggle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                      {v.vehicleName || v.plateNumber || v.carId || v.id}{v.ownerName ? ` - ${v.ownerName}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5">Playback</label>
                <button
                  type="button"
                  onClick={() => setTestTransition(t => !t)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    testTransition
                      ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300'
                      : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Repeat className={`w-4 h-4 ${testTransition ? 'text-purple-500' : 'text-slate-400'}`} />
                    {testTransition ? 'Transition every 10s (like a video)' : 'Stay still (single image)'}
                  </span>
                  <span className={`relative w-10 h-5 rounded-full transition-colors ${testTransition ? 'bg-purple-500' : 'bg-slate-300 dark:bg-slate-500'}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${testTransition ? 'left-5' : 'left-0.5'}`} />
                  </span>
                </button>
              </div>
            </div>

            {/* Ad image gallery — click to select one or many */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Select Ads <span className="text-slate-400">({selectedTestAds.length} selected)</span>
                </label>
                {selectedTestAds.length > 0 && (
                  <button onClick={() => setSelectedTestAds([])} className="text-xs text-slate-400 hover:text-red-500 transition-colors">Clear selection</button>
                )}
              </div>
              {ads.length === 0 ? (
                <p className="text-sm text-slate-400 py-6 text-center">No ads yet. Create one in Ads Management first.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-64 overflow-y-auto p-1">
                  {ads.map(a => {
                    const img = a.preview || a.mediaUrl || '';
                    const sel = selectedTestAds.includes(a.id);
                    const order = selectedTestAds.indexOf(a.id);
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => toggleTestAd(a.id)}
                        title={a.title || a.id}
                        className={`group relative rounded-xl overflow-hidden border-2 transition-all aspect-square ${
                          sel ? 'border-purple-500 ring-2 ring-purple-300 dark:ring-purple-700' : 'border-slate-200 dark:border-slate-700 hover:border-purple-300'
                        }`}
                      >
                        {img ? (
                          <img src={img} alt={a.title || 'ad'} loading="lazy" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-slate-400" />
                          </div>
                        )}
                        {/* selection badge with play order */}
                        {sel && (
                          <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center shadow">
                            {testTransition ? order + 1 : <Check className="w-3 h-3" />}
                          </span>
                        )}
                        {/* title overlay */}
                        <span className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-1.5 py-1 text-[10px] text-white truncate text-left">
                          {a.title || a.id}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected preview strip */}
            {selectedTestAds.length > 0 && (
              <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                  Will play on the screen {testTransition ? `in this order, 10s each:` : `(single still image):`}
                </p>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {(testTransition ? selectedTestAds : selectedTestAds.slice(0, 1)).map((id, i) => {
                    const a = adById[id] || {};
                    const img = a.preview || a.mediaUrl || '';
                    return (
                      <React.Fragment key={id}>
                        {i > 0 && <ArrowRight className="w-4 h-4 text-slate-300 flex-shrink-0" />}
                        <div className="relative flex-shrink-0">
                          {img ? (
                            <img src={img} alt="" className="w-16 h-16 rounded-lg object-cover border border-slate-200 dark:border-slate-700" />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center"><ImageIcon className="w-5 h-5 text-slate-400" /></div>
                          )}
                          <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-purple-600 text-white text-[9px] font-bold flex items-center justify-center">{i + 1}</span>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handlePushTestAd}
                disabled={testPushing || !selectedTestVehicle || selectedTestAds.length === 0}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  testPushing || !selectedTestVehicle || selectedTestAds.length === 0
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40'
                }`}
              >
                {testPushing ? (<><RefreshCw className="w-4 h-4 animate-spin" /> Pushing...</>)
                  : (<><CheckCircle className="w-4 h-4" /> Push {selectedTestAds.length > 1 && testTransition ? `${selectedTestAds.length} Ads` : 'Ad'} to Vehicle</>)}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleClearTest}
                disabled={testClearing || !selectedTestVehicle}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  testClearing || !selectedTestVehicle
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700'
                }`}
              >
                {testClearing ? (<><RefreshCw className="w-4 h-4 animate-spin" /> Clearing...</>)
                  : (<><Trash2 className="w-4 h-4" /> Clear Test</>)}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>

        {/* Live AI Schedule — assignments produced by the scheduler */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5 }}
          className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 mb-6 overflow-hidden"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 opacity-80" />
          <div className="flex items-center justify-between gap-3 p-5 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <ListChecks className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Live AI Schedule</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Which ad plays on which vehicle, for how long, with AI-estimated reach &amp; cost</p>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {assignments.length > 0 && (
                <>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs font-semibold" title="Total AI-estimated impressions across the schedule">
                    <Eye className="w-3.5 h-3.5" />{Math.round(scheduleTotals.impressions).toLocaleString()} est. reach
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-semibold" title="Total AI-estimated ad spend across the schedule">
                    <DollarSign className="w-3.5 h-3.5" />{fmtPKR(scheduleTotals.cost)}
                  </span>
                </>
              )}
              <RealTimeIndicator isActive={true} />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{assignments.length} assignment{assignments.length === 1 ? '' : 's'}</span>
            </div>
          </div>

          {assignments.length === 0 ? (
            <div className="p-10 text-center">
              <Cpu className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">No schedule yet</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Click <span className="font-semibold">Run AI Scheduler Now</span> above to generate assignments.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40">
                    <th className="px-5 py-3 font-semibold">Vehicle</th>
                    <th className="px-5 py-3 font-semibold">Ad</th>
                    <th className="px-5 py-3 font-semibold">Display</th>
                    <th className="px-5 py-3 font-semibold">Time Window</th>
                    <th className="px-5 py-3 font-semibold">AI Reach</th>
                    <th className="px-5 py-3 font-semibold">Est. Cost</th>
                    <th className="px-5 py-3 font-semibold">Basis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {assignments.map((a) => {
                    const mins = a.displayMinutes || durationMins(a);
                    const img = adImage(a);
                    const cat = adCategory(a);
                    return (
                      <motion.tr
                        key={a.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
                      >
                        {/* Vehicle */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-purple-500 flex-shrink-0" />
                            <div>
                              <div className="font-semibold text-slate-800 dark:text-slate-100">{vehicleNameById[a.vehicleId] || a.vehicleId || '—'}</div>
                              {(a.city || a.area) && (
                                <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                                  <MapPin className="w-3 h-3" />{[a.city, a.area].filter(Boolean).join(' · ')}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        {/* Ad — real image thumbnail + title + category */}
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            {img ? (
                              <img src={img} alt={a.adTitle || a.title || 'ad'} loading="lazy"
                                className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0" />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                                <ImageIcon className="w-5 h-5 text-slate-400" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-medium text-slate-700 dark:text-slate-200 truncate max-w-[180px]">{a.adTitle || a.title || a.adId}</div>
                              {cat && <div className="text-xs text-slate-400">{cat}</div>}
                            </div>
                          </div>
                        </td>
                        {/* Display minutes (>= 5 min per image) */}
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-semibold whitespace-nowrap">
                            <Timer className="w-3.5 h-3.5" />{mins != null ? `${mins} min` : '—'}
                          </span>
                        </td>
                        {/* Time window */}
                        <td className="px-5 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {fmtTime(a.startTime)} <ArrowRight className="w-3 h-3 text-slate-400" /> {fmtTime(a.endTime)}
                          </span>
                        </td>
                        {/* AI estimated impressions */}
                        <td className="px-5 py-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-semibold whitespace-nowrap"
                            title={`AI-estimated people reached${a.estimationMethod ? ' (' + a.estimationMethod + ')' : ''}`}>
                            <Eye className="w-3.5 h-3.5" />{a.estimatedImpressions != null ? Math.round(a.estimatedImpressions).toLocaleString() : '—'}
                          </span>
                        </td>
                        {/* Estimated cost */}
                        <td className="px-5 py-3 whitespace-nowrap font-semibold text-slate-700 dark:text-slate-200">
                          {a.estimatedCost != null ? fmtPKR(a.estimatedCost) : '—'}
                        </td>
                        {/* Basis */}
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {a.timeSlot && (
                              <span className={`px-2 py-0.5 rounded-md text-xs font-medium capitalize ${slotColor(a.timeSlot)}`}>{a.timeSlot}</span>
                            )}
                            {a.weather && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400">
                                <WeatherIcon condition={a.weather} className="w-3 h-3" />{a.weather}
                              </span>
                            )}
                            {a.score != null && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400" title="Match score from the AI ranking">
                                <Target className="w-3 h-3" />{typeof a.score === 'number' ? a.score.toFixed(1) : a.score}
                              </span>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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
