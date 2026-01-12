# 🚀 Quick Implementation Examples

## 1. Toast Notifications - Usage Examples

### In any component:
```jsx
import { useToast } from '../contexts/ToastContext'

function MyComponent() {
  const toast = useToast()

  const handleSave = async () => {
    try {
      await saveData()
      toast.success('Data saved successfully!')
    } catch (error) {
      toast.error('Failed to save data')
    }
  }

  return (
    <button onClick={handleSave}>Save</button>
  )
}
```

### Toast Types:
```jsx
toast.success('Operation completed!')
toast.error('Something went wrong!')
toast.warning('Please check your input')
toast.info('New update available')
```

---

## 2. Skeleton Loaders - Usage Examples

### In Dashboard:
```jsx
import { SkeletonKpiCard } from '../components/ui/SkeletonLoader'

function Dashboard() {
  const [loading, setLoading] = useState(true)
  
  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        <SkeletonKpiCard />
        <SkeletonKpiCard />
        <SkeletonKpiCard />
        <SkeletonKpiCard />
      </div>
    )
  }
  
  return <div>...</div>
}
```

### In Tables:
```jsx
import { SkeletonTable } from '../components/ui/SkeletonLoader'

{loading ? (
  <SkeletonTable rows={5} cols={4} />
) : (
  <Table data={data} />
)}
```

---

## 3. Empty States - Usage Examples

### In Vehicles Page:
```jsx
import { EmptyVehicles } from '../components/ui/EmptyState'

function Vehicles() {
  if (vehicles.length === 0) {
    return <EmptyVehicles onAdd={handleAdd} />
  }
  
  return <VehicleList vehicles={vehicles} />
}
```

### Custom Empty State:
```jsx
import EmptyState from '../components/ui/EmptyState'

<EmptyState
  icon={<FiTruck />}
  title="No Vehicles"
  description="Add your first vehicle to get started"
  actionLabel="Add Vehicle"
  onAction={handleAdd}
/>
```

---

## 4. Page Transitions - Usage Examples

### In App.jsx:
```jsx
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation } from 'react-router-dom'

function AppRoutes() {
  const location = useLocation()
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/dashboard" element={
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Dashboard />
          </motion.div>
        } />
      </Routes>
    </AnimatePresence>
  )
}
```

---

## 5. Enhanced Buttons - Usage Examples

### Loading State Button:
```jsx
function SaveButton({ loading, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="relative px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold transition-all duration-300 hover:bg-blue-700 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Saving...
        </span>
      ) : (
        'Save'
      )}
    </button>
  )
}
```

---

## 6. Enhanced Tables - Usage Examples

### Add to existing table:
```jsx
<table className="min-w-full text-sm">
  <thead className="bg-gradient-to-r from-brand-900 to-brand-800 text-white">
    <tr>
      <th className="p-4 text-left font-semibold">Name</th>
      <th className="p-4 text-left font-semibold">Status</th>
      <th className="p-4 text-center font-semibold">Actions</th>
    </tr>
  </thead>
  <tbody>
    {data.map((item) => (
      <motion.tr
        key={item.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        <td className="p-4">{item.name}</td>
        <td className="p-4">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
            {item.status}
          </span>
        </td>
        <td className="p-4 text-center">
          <button className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Edit
          </button>
        </td>
      </motion.tr>
    ))}
  </tbody>
</table>
```

---

## 7. Form Enhancements - Usage Examples

### Floating Label Input:
```jsx
function FloatingInput({ label, ...props }) {
  const [focused, setFocused] = useState(false)
  const hasValue = props.value && props.value.length > 0
  
  return (
    <div className="relative">
      <input
        {...props}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full px-4 pt-6 pb-2 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
      />
      <label
        className={`absolute left-4 transition-all duration-300 ${
          focused || hasValue
            ? 'top-2 text-xs text-blue-600 font-semibold'
            : 'top-4 text-sm text-slate-500'
        }`}
      >
        {label}
      </label>
    </div>
  )
}
```

---

## 8. Status Badges - Usage Examples

### Enhanced Status Badge:
```jsx
function StatusBadge({ status }) {
  const styles = {
    active: 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg shadow-green-400/50',
    inactive: 'bg-gradient-to-r from-red-400 to-rose-500 text-white shadow-lg shadow-red-400/50',
    pending: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-400/50'
  }
  
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 ${styles[status]}`}
    >
      <motion.span
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-2 h-2 bg-white rounded-full"
      />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </motion.span>
  )
}
```

---

## 9. Card Enhancements - Usage Examples

### Enhanced Card:
```jsx
function EnhancedCard({ title, children, icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 p-6 transition-all duration-300"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
      </div>
      {children}
    </motion.div>
  )
}
```

---

## 10. Quick Implementation Checklist

### Week 1 (Must Have):
- [ ] Add ToastProvider to index.jsx ✅
- [ ] Replace all console.log with toast notifications
- [ ] Add SkeletonLoader to Dashboard
- [ ] Add EmptyState components to all list pages
- [ ] Add page transitions to App.jsx

### Week 2 (Nice to Have):
- [ ] Enhance all buttons with loading states
- [ ] Add animations to tables
- [ ] Enhance form inputs
- [ ] Add status badges everywhere
- [ ] Enhance cards with hover effects

### Week 3 (Polish):
- [ ] Add tooltips
- [ ] Add keyboard shortcuts
- [ ] Enhance modals
- [ ] Add breadcrumbs
- [ ] Final polish pass

---

**Remember:** Start with the most visible features first (Toast notifications, Skeleton loaders, Empty states) as these will make the biggest impact in your presentation!





