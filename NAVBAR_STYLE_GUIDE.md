# Admin Panel Navbar / Sidebar — Complete Style Guide

> **Reference Image** — The sidebar shown in the attached screenshot contains the following items in order:  
> Dashboard · Vehicles Management · Ads Management · Scheduling · Analytics · Alerts Management · My Profile · Admin Management · Vehicle Reports · Report Settings

---

## 1. Color Palette (Exact Hex Values)

| Token | Hex | Usage |
|---|---|---|
| `brand-900` | `#0B1452` | Sidebar & header base — deep navy |
| `brand-800` | `#111b68` | Mid-gradient stop |
| `brand-700` | `#152071` | (available, lighter navy) |
| `brand-600` | `#1b2b8b` | (available, lightest navy) |
| Amber 400 | `#fbbf24` | Active icon glow, accent bar, active dot |
| Amber 300 | `#fcd34d` | Active text, icon hover color |
| Amber 500/600 | `#f59e0b` / `#d97706` | Active indicator bar gradient end |
| White | `#ffffff` | Default text / icon color |
| `white/80` | `rgba(255,255,255,0.80)` | Inactive nav item text |
| `white/60` | `rgba(255,255,255,0.60)` | Supervisor label, subtle text |
| `white/10` | `rgba(255,255,255,0.10)` | Hover background tint |
| `white/15` | `rgba(255,255,255,0.15)` | Active press state background |
| `white/5`  | `rgba(255,255,255,0.05)` | Header animated shimmer overlay |
| Red 300/400 | `#f87171` / `#fb7185` | Logout button hover |
| `red-500/20` | `rgba(239,68,68,0.20)` | Logout hover background |
| Blue 400 | `#60a5fa` | Right-edge gradient accent |
| Green 400 | `#4ade80` | Online status pulse dot on avatar |

---

## 2. Top Header Bar

```
height: h-16  (64px)
position: relative, z-30
```

### Background
- **Primary gradient:** `bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900`  
  → `#0B1452` → `#111b68` → `#0B1452` (left to right)
- **Overlay shimmer:** absolute layer, `bg-gradient-to-r from-transparent via-white/5 to-transparent`, `opacity-50`, animated with `animate-pulse-slow` (4 s ease-in-out, 30 %→60 % opacity cycle)

### Border
- Bottom: `border-b border-white/10` → `rgba(255,255,255,0.10)` 1 px

### Shadow
- `shadow-2xl`  

### Extras
- `backdrop-blur-sm` on the header container

---

## 3. Sidebar (Vertical Nav)

```
width (expanded):  w-64  (256px)
width (collapsed): w-16  (64px)
min-height: calc(100vh - 4rem)
position: fixed (mobile) / static (desktop)
z-index: 50 (mobile), auto (desktop)
```

### Background
- **Gradient:** `bg-gradient-to-b from-brand-900 via-brand-800 to-brand-900`  
  → `#0B1452` → `#111b68` → `#0B1452` (top to bottom, vertical)

### Right Edge Decorative Border
- 1 px wide absolute strip on the right edge  
- `bg-gradient-to-b from-amber-400/20 via-blue-400/10 to-transparent`  
  → `rgba(251,191,36,0.20)` fades into `rgba(96,165,250,0.10)` then transparent

### Shadow
- `shadow-2xl`

### Transition
- `transition-all duration-300 ease-in-out` for width toggle
- Mobile: slides in/out with `translate-x-0` / `-translate-x-full`

### Scrollbar (custom CSS)
```css
.sidebar::-webkit-scrollbar { width: 6px; }
.sidebar::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.2);
  border-radius: 6px;
  transition: background 0.2s ease;
}
.sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,0.3);
}
```

---

## 4. Nav Items (Individual Links)

### Layout
```
padding: py-3 md:py-4  px-4 md:px-5  (expanded)
         px-0 justify-center          (collapsed/icon-only)
margin: mx-2 md:mx-3  mb-1
border-radius: rounded-xl
overflow: hidden  (required for shimmer clip)
```

### Default (Inactive) State
| Property | Value |
|---|---|
| Text color | `text-white/80` = `rgba(255,255,255,0.80)` |
| Background | transparent |
| Border | none |
| Icon size | 20 px (Lucide icons) |
| Font size | `text-sm` (14 px), `font-medium` |

### Hover State
| Property | Value |
|---|---|
| Text color | `text-white` |
| Background | `hover:bg-white/10` = `rgba(255,255,255,0.10)` |
| Icon color | `group-hover:text-amber-200` |
| Icon size | grows to `text-2xl` |
| Font size | `group-hover:text-base group-hover:font-semibold` |
| Hover glow overlay | `bg-gradient-to-r from-amber-400/5 to-transparent`, fades in on hover |
| Transition | `transition-all duration-500 ease-out` |

### Active State
| Property | Value |
|---|---|
| Background | `bg-gradient-to-r from-amber-500/20 via-yellow-400/15 to-transparent` |
| Text color | `text-amber-300` = `#fcd34d` |
| Border | `border border-amber-400/30` = `rgba(251,191,36,0.30)` 1 px |
| Box shadow | `shadow-lg shadow-amber-500/20` |
| Icon color | `text-amber-300` |
| Icon glow filter | `drop-shadow(0 0 8px rgba(251,191,36,0.6))` |
| Font size | `text-base font-semibold tracking-wide` |
| Left indicator bar | 4 px wide, `bg-gradient-to-b from-amber-400 to-amber-600`, `shadow-lg shadow-amber-400/60`, rounded-right, vertically centered |
| Right pulse dot | `w-1.5 h-1.5 bg-amber-400 rounded-full`, `animate-pulse`, right-aligned in row |
| Shimmer overlay | `bg-gradient-to-r from-transparent via-white/10 to-transparent`, `animate-shimmer` (3 s infinite sweep) |

---

## 5. Animations & Effects

### `animate-shimmer` — Active nav item sweep
```css
@keyframes shimmer {
  0%   { transform: translateX(-100%) skewX(-15deg); }
  100% { transform: translateX(200%)  skewX(-15deg); }
}
.animate-shimmer { animation: shimmer 3s infinite; }
```

### `animate-pulse-slow` — Header background shimmer
```css
@keyframes pulse-slow {
  0%, 100% { opacity: 0.3; }
  50%       { opacity: 0.6; }
}
.animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
```

### `animate-pulse` (Tailwind built-in)
- Used on the **right dot** of the active nav item (amber dot)  
- Used on the **green online status dot** (avatar in header)

### Button hover micro-interactions
| Element | Effect |
|---|---|
| Menu toggle button | `hover:scale-110 active:scale-95` + amber gradient overlay on hover |
| Menu icon (mobile) | `group-hover:rotate-90` |
| Theme toggle | `hover:scale-105 active:scale-95` + icon `group-hover:scale-110 group-hover:rotate-12` |
| User profile link | `hover:scale-105 active:scale-95` + blue shadow on hover |
| Logout button | `hover:scale-105 active:scale-95` + red shadow on hover |

---

## 6. Header Buttons (Right Side)

All three header buttons share a base style:  
```
bg-white/10  hover:bg-white/20
backdrop-blur-sm
px-4 py-2.5
rounded-xl
border border-white/20
transition-all duration-500
min-w-[44px] min-h-[44px]   (touch target)
```

| Button | Hover border | Hover shadow | Hover overlay |
|---|---|---|---|
| Theme toggle | `hover:border-amber-400/40` | `hover:shadow-amber-400/20` | amber gradient |
| User profile | `hover:border-blue-400/40` | `hover:shadow-blue-400/20` | blue gradient |
| Logout | `hover:border-red-400/40` | `hover:shadow-red-400/20` | red gradient |

---

## 7. Brand Logo / Title (Header)

```
Text: "AdMotion"
Font: text-2xl font-bold tracking-wider
Color: bg-gradient-to-r from-white via-amber-100 to-white  (bg-clip-text text-transparent)
Hover: scale-105 (cursor-default)
Underline on hover: h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent
```

Vertical accent bar beside logo:  
```
w-1  h-8
bg-gradient-to-b from-amber-400 to-amber-600
rounded-full
shadow-lg shadow-amber-400/50
```

---

## 8. Active Breadcrumb (Header)

```
text-sm text-white/60
Separator: ChevronRight icon — text-white/30
Page name: text-amber-300/80 font-medium
```

---

## 9. Bottom Supervisor Section (Sidebar)

```
border-t border-white/10
bg-gradient-to-t from-brand-900/90 to-transparent
```

- Horizontal divider: `bg-gradient-to-r from-transparent via-amber-400/30 to-transparent`  
- Label "Supervised By": `text-xs font-light text-white/60 tracking-wider uppercase`  
- Name: `text-sm font-semibold text-amber-300`, gradient: `from-amber-300 via-yellow-200 to-amber-300 bg-clip-text text-transparent`  
- Version tag: `text-[9px] text-white/30 tracking-wider`

---

## 10. Typography Summary

| Element | Size | Weight | Color |
|---|---|---|---|
| App title | `text-2xl` (24 px) | `font-bold` | White→Amber gradient |
| Active nav label | `text-base` (16 px) | `font-semibold` | `#fcd34d` (amber-300) |
| Inactive nav label | `text-sm` (14 px) | `font-medium` | `rgba(255,255,255,0.80)` |
| Header buttons | `text-sm` (14 px) | `font-semibold` | White |
| Supervisor label | `text-xs` (12 px) | `font-light` | `rgba(255,255,255,0.60)` |
| Supervisor name | `text-sm` (14 px) | `font-semibold` | Amber-300 gradient |
| Version | `9 px` | normal | `rgba(255,255,255,0.30)` |
| Font family | `Inter, system-ui, ui-sans-serif, Arial` | — | — |

---

## 11. Quick-Reference CSS Variables to Copy

```css
/* Brand colors */
--brand-900: #0B1452;
--brand-800: #111b68;
--brand-700: #152071;
--brand-600: #1b2b8b;

/* Accent */
--amber-300: #fcd34d;
--amber-400: #fbbf24;
--amber-500: #f59e0b;
--amber-600: #d97706;
```

---

## 12. Tailwind Config Snippet to Replicate

```js
// tailwind.config.js
theme: {
  extend: {
    fontFamily: {
      inter: ['Inter', 'system-ui', 'ui-sans-serif', 'Arial'],
    },
    colors: {
      brand: {
        900: '#0B1452',
        800: '#111b68',
        700: '#152071',
        600: '#1b2b8b',
      },
    },
    animation: {
      shimmer: 'shimmer 3s infinite',
      'pulse-slow': 'pulse-slow 4s ease-in-out infinite',
    },
    keyframes: {
      shimmer: {
        '0%':   { transform: 'translateX(-100%) skewX(-15deg)' },
        '100%': { transform: 'translateX(200%)  skewX(-15deg)' },
      },
      'pulse-slow': {
        '0%, 100%': { opacity: '0.3' },
        '50%':      { opacity: '0.6' },
      },
    },
  },
},
```

---

## 13. Icon Library

All icons are from **[Lucide React](https://lucide.dev/)** at `size={20}` (20 px × 20 px).

| Nav Item | Icon component |
|---|---|
| Dashboard | `LayoutDashboard` |
| Vehicles Management | `Truck` |
| Ads Management | `Layers` |
| Scheduling | `CalendarClock` |
| Analytics | `BarChart3` |
| Alerts Management | `Bell` |
| My Profile | `User` |
| Admin Management | `Shield` |
| Vehicle Reports | `FileText` |
| Report Settings | `Settings` |

---

*Source file: `src/components/layouts/Layout.jsx`*
