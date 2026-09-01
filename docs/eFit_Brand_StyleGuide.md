# eFit — Brand Identity & Style Guide

> Tài liệu tổng hợp bộ nhận diện thương hiệu, hệ màu, typography và design tokens của eFit.
> Source of truth: `frontend/src/styles/globals.css` + `tailwind.config.ts` + `docs/eFit Style Guide.html`

---

## 1. Logo

### Bộ file Logo

| File | Mô tả | Sử dụng khi |
|---|---|---|
| `nobg-noname.png` | Icon logo (không nền, không tên) | Favicon, sidebar thu gọn, mobile header |
| `nobg-name.png` | Logo + chữ "eFit" (không nền) | Sidebar mở rộng, Landing Page header |
| `name-bg.png` | Logo + chữ "eFit" (có nền) | Poster, tài liệu in ấn |
| `Có nền - Không tên.png` | Icon logo (có nền) | Avatar, social media profile |

**Đường dẫn:** `frontend/public/images/`

### Quy tắc sử dụng Logo
- Khoảng cách tối thiểu xung quanh logo: bằng chiều cao chữ "e" trong logo
- KHÔNG xoay, kéo dãn hoặc thay đổi tỷ lệ logo
- Trên nền tối: dùng file `nobg-*` (logo tự sáng)
- Trên nền sáng: dùng file `nobg-*` hoặc `name-bg.png`

---

## 2. Màu sắc (Color System)

### 2.1 Brand Colors — Màu thương hiệu

#### Primary: eFit Blue
```
HEX:  #54B7F0
HSL:  202° 85% 64%
RGB:  84, 183, 240
```
**Sử dụng:** CTA chính, AI features, active state, link, sidebar active, focus ring

| Biến thể | Giá trị | CSS Variable | Tailwind |
|---|---|---|---|
| Default | `#54B7F0` | `--efit-blue` | `text-efit-blue` / `bg-efit-blue` |
| Dark | `#3FA3DC` | `--efit-blue-dark` | `text-efit-blue-dark` |
| Tint 10% | `rgba(84,183,240,.10)` | `--efit-blue-tint` | `bg-efit-blue-tint` |
| Tint 18% | `rgba(84,183,240,.18)` | `--efit-blue-tint-strong` | `bg-efit-blue-tint-strong` |
| Border 30% | `rgba(84,183,240,.30)` | `--efit-blue-border` | `border-efit-blue-border` |

#### Secondary: eFit Orange
```
HEX:  #EF9035
HSL:  29° 85% 57%
RGB:  239, 144, 53
```
**Sử dụng:** Accent, secondary CTA, cảnh báo nhẹ, nutrition/macro icon

| Biến thể | Giá trị | CSS Variable | Tailwind |
|---|---|---|---|
| Default | `#EF9035` | `--efit-orange` | `text-efit-orange` / `bg-efit-orange` |
| Dark | `#D6812F` | `--efit-orange-dark` | `text-efit-orange-dark` |
| Tint 10% | `rgba(239,144,53,.10)` | `--efit-orange-tint` | `bg-efit-orange-tint` |
| Tint 18% | `rgba(239,144,53,.18)` | `--efit-orange-tint-strong` | `bg-efit-orange-tint-strong` |
| Border 30% | `rgba(239,144,53,.30)` | `--efit-orange-border` | `border-efit-orange-border` |

#### Brand Gradient
```css
background: linear-gradient(135deg, #6AE5F7 0%, #54B7F0 35%, #F4BC41 70%, #EF9035 100%);
```
**Tailwind class:** `text-brand-gradient` (cho text gradient)
**Sử dụng:** Hero header accent text, season progress bar, premium UI elements

---

### 2.2 Semantic Colors — Màu ngữ nghĩa

| Vai trò | HEX | CSS Variable | Tailwind | Sử dụng |
|---|---|---|---|---|
| **Success** | `#10b981` | `--efit-green` | `text-efit-green` | Done, completed, positive delta, tập xong |
| **Warning** | `#f97316` | `--efit-orange-alert` | `text-efit-alert` | Negative delta, warm warning, chệch mục tiêu |
| **Danger** | `#ef4444` | `--efit-red` | `text-efit-red` | Destructive action, high severity, missed workout |
| **Info/Purple** | `#a78bfa` | `--efit-purple` | `text-efit-purple` | Fat macro, secondary metric, neutral info |

---

### 2.3 Surface Colors — Màu bề mặt

#### Light Mode (Mặc định)

| Element | HEX | HSL | CSS Variable | Tailwind |
|---|---|---|---|---|
| **Background** | `#f4f6fb` | 223° 33% 97% | `--background` | `bg-background` |
| **Card** | `#ffffff` | 0° 0% 100% | `--card` | `bg-card` |
| **Muted** | `#f8fafc` | 210° 33% 98% | `--muted` | `bg-muted` |
| **Border** | `#e8f4fc` | 204° 71% 95% | `--border` | `border-border` |
| **Input** | `#f8fafc` | 210° 33% 98% | `--input` | `bg-input` |

#### Dark Mode

| Element | HEX | HSL | CSS Variable |
|---|---|---|---|
| **Background** | `#070a14` | 226° 48% 5% | `--background` |
| **Card** | `#0e1424` | 223° 44% 10% | `--card` |
| **Muted** | `#111c33` | 221° 50% 13% | `--muted` |
| **Border** | ~`#2a3555` | 215° 25% 20% | `--border` |

---

### 2.4 Text Colors

| Level | HEX | Tailwind | Sử dụng |
|---|---|---|---|
| **Primary text** | `#0f172a` | `text-foreground` | Tiêu đề, body text chính |
| **Muted text** | `#475569` | `text-muted-foreground` | Label, description, secondary text |
| **Dim text** | `#94a3b8` | — | Placeholder, disabled text |

---

### 2.5 Sidebar Dark Pulse (Custom)

Sidebar sử dụng dark gradient riêng kể cả trong Light Mode:

```css
background: linear-gradient(135deg, #0c1730 0%, #0e1424 60%, #1a1208 100%);
color: #e2e8f0;
border-right: 1px solid rgba(148, 163, 184, 0.14);
```

Có thêm:
- **Grid overlay:** Radial dots pattern, opacity 5%
- **Bloom glow:** Blue radial gradient blur phía sau logo

---

## 3. Typography

### 3.1 Typeface: Inter (Duy nhất)

```
Font Family: Inter
Subsets:     latin, vietnamese
Weights:     400 (Regular), 500 (Medium), 600 (Semibold), 
             700 (Bold), 800 (ExtraBold), 900 (Black)
Loading:     next/font/google (swap)
CSS Variable: --font-sans
```

> ⚠️ **KHÔNG sử dụng font nào khác** (không Outfit, không JetBrains Mono, không serif).
> Hierarchy đạt được qua **weight + size + letter-spacing**, không phải đổi font.

### 3.2 Type Scale

| Class | Weight | Size | Letter-spacing | Sử dụng |
|---|---|---|---|---|
| `.display-xl` | 900 (Black) | 52px | -0.04em | Hero heading, landing page |
| `.display-lg` | 900 (Black) | 38px | -0.03em | Page heading |
| `.display-md` | 800 (ExtraBold) | 22px | -0.02em | Section heading |
| `.display-sm` | 800 (ExtraBold) | 17px | -0.02em | Card heading |
| `.body-lg` | 600 (Semibold) | 15px | normal | Body text |
| `.body-md` | 600 (Semibold) | 13px | normal | Small body |
| `.body-sm` | 700 (Bold) | 11px | normal | Caption, helper text (muted color) |
| `.label-eyebrow` | 800 (ExtraBold) | 10px | 0.14em | Section label, uppercase |

### 3.3 Heading Style
```css
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-sans), sans-serif;
  letter-spacing: -0.02em;
}
```

### 3.4 Body Base
```css
body {
  font-size: 14px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
```

---

## 4. Spacing & Border Radius

### 4.1 Border Radius Scale

| Token | Value | Tailwind | Sử dụng |
|---|---|---|---|
| `--radius` (base) | `12px` | `rounded-lg` | Card, input, button default |
| `3xl` | `22px` | `rounded-3xl` | Hero card, large modal |
| `2xl` | `18px` | `rounded-2xl` | Dashboard card |
| `xl` | `14px` | `rounded-xl` | Icon container, pill large |
| `md` | `10px` | `rounded-md` | Button, small card |
| `sm` | `8px` | `rounded-sm` | Badge, chip |
| `pill` | `999px` | `rounded-pill` | Status pill, tag |

---

## 5. Shadows

| Token | Value | Tailwind | Sử dụng |
|---|---|---|---|
| Card light | `0 1px 3px rgba(15,23,42,.06)` | `shadow-card-light` | Card default |
| Card hover | `0 16px 40px rgba(15,23,42,.10)` | `shadow-card-hover` | Card hover state |
| Card dark | `0 1px 0 rgba(255,255,255,.02)` | `shadow-card-dark` | Dark mode card |
| Button blue | `0 4px 14px rgba(84,183,240,.45)` | `shadow-button-blue` | Primary CTA glow |
| Button orange | `0 4px 14px rgba(239,144,53,.45)` | `shadow-button-orange` | Secondary CTA glow |

---

## 6. Component Patterns

### 6.1 Button Gradient Orange (CTA chính)
```css
.btn-gradient-orange {
  background: linear-gradient(135deg, #EF9035, #D6812F);
  color: white;
  box-shadow: 0 4px 14px rgba(239,144,53,.45);
}
.btn-gradient-orange:hover {
  box-shadow: 0 6px 18px rgba(239,144,53,.6);
  transform: translateY(-1px);
}
```

### 6.2 Status Pills
```css
.pill-blue   { bg: blue-tint,   color: blue,   border: blue-border   }
.pill-orange { bg: orange-tint, color: orange, border: orange-border }
.pill-green  { bg: green 10%,   color: green,  border: green 30%     }
.pill-red    { bg: red 10%,     color: red,    border: red 30%       }
```

### 6.3 KPI Tile Tones
6 tones available: `blue` | `orange` | `green` | `red` | `purple` | `neutral`
Mỗi tone dùng cặp: background tint + icon color + glow blob

### 6.4 Custom Scrollbar
```css
Thumb:       rgba(84, 183, 240, 0.25)  /* eFit Blue 25% */
Thumb hover: hsl(var(--primary))       /* Full blue */
Width:       6px
Dark mode:   rgba(255, 255, 255, 0.05)
```

---

## 7. Animation

### 7.1 Keyframes có sẵn

| Name | Duration | Easing | Sử dụng |
|---|---|---|---|
| `accordion-down/up` | 200ms | ease-out | Accordion expand/collapse |
| `fade-in/fade-out` | 200ms | ease-out | Element appear/disappear |
| `zoom-in/zoom-out` | 200ms | ease-out | Modal, popover |
| `caret-blink` | 1250ms | ease-out infinite | Input caret |

### 7.2 Page Transition Pattern
```tsx
<div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
  {/* Page content */}
</div>
```

---

## 8. Quy tắc KHÔNG được vi phạm

| ❌ KHÔNG | ✅ THAY BẰNG |
|---|---|
| `bg-white` | `bg-card` |
| `bg-gray-100` | `bg-background` hoặc `bg-muted` |
| `text-green-600` | `text-efit-green` hoặc `text-success` |
| `text-blue-500` | `text-primary` hoặc `text-efit-blue` |
| `border-gray-200` | `border-border` |
| Font Outfit / JetBrains Mono | `font-sans` (Inter) |
| Hardcode `#54B7F0` inline | `var(--efit-blue)` hoặc Tailwind token |

---

## 9. Metadata & SEO

```tsx
// Root layout (layout.tsx)
title: {
  default: "eFit · AI-First Fitness Periodization",
  template: "%s · eFit",
}
description: "Hệ thống lập kế hoạch tập luyện chu kỳ AI-First..."
```

- Mỗi page route PHẢI có `layout.tsx` export `metadata` riêng
- Browser tab format: `[Page Title] · eFit`

---

## 10. Tóm tắt nhanh — Brand At a Glance

```
Brand Name:     eFit
Tagline:        AI-First Fitness Periodization
Primary Color:  #54B7F0 (Blue — trust, technology, clarity)
Secondary:      #EF9035 (Orange — energy, action, warmth)
Font:           Inter (400-900)
Border Radius:  12px base
Dark Mode:      Supported (class-based toggle)
Tone:           Professional + Energetic (không quá nghiêm túc, không quá casual)
Target:         PT (Personal Trainer) tại Việt Nam
Language:       Tiếng Việt là chính, thuật ngữ kỹ thuật giữ EN
```
