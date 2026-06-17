# Tyto-PhishShield Design Specification
> See the [**interactive design specification website**](https://cos301-se-2026.github.io/Tyto-PhishShield/demo-1/design-specifications)
---

## 1. Brand Identity

### Mission

Help organizations build human resilience against phishing attacks through realistic simulations, instant feedback, and engaging security awareness training.

Make employees a part of the firewall.

### Product Personality

- Trustworthy
- Intelligent
- Protective
- Motivating
- Modern
- Professional
- Approachable

### Tone

- Clear
- Helpful
- Encouraging
- Security focused
- Professional without fearmongering

### Preferred Messaging Style

Rather have:

> "Well done! You identified a phishing attempt."

Than:

> "You failed the phishing test."

### UX Philosophy

The platform should:

- Encourage learning rather than punish mistakes.
- Make cybersecurity approachable.
- Provide teachable moments.
- Reward positive security behaviour through gamification.

---

## 2. Logo Direction

### Primary Logo Concept

Current primary branding uses:

- Owl mascot
- Tyto wordmark
- Dark-mode optimized lockup

### Logo Variants

- Full logo with wordmark
- Icon-only compact sidebar variant
- Dark mode variant
- Light mode variant

---

## 3. Colour System

Use semantic colour tokens with full light/dark theme support.

| Token | Value | Purpose |
|---|---|---|
| Primary Navy | `#0F172A` | Header, navbars, hero sections |
| Accent Blue | `#2563EB` | Buttons, links, focus states |
| Accent Blue Hover | `#1D4ED8` | Hover states |
| Success Green | `#22C55E` | XP gains, success states |
| Warning Amber | `#F59E0B` | Suspicion/warnings |
| Danger Red | `#EF4444` | Threats/errors |
| Surface White | `#FFFFFF` | Light mode cards |
| Neutral Gray | `#64748B` | Secondary text |
| Light Blue Accent | `#60A5FA` | Hero highlights |
| Border Neutral | Variable | Dividers/borders |

### Theme Support

The application should support:

- Light mode
- Dark mode
- System theme preference detection
- LocalStorage persistence

---

## 4. Typography

### Primary Fonts

- Inter is Primary. Roboto is Secondary/fallback.

### Typography Principles

- Compact dashboard typography.
- Clear hierarchy.
- High readability.
- Dense but modern data presentation.

### Responsive Typography Scale

| Use | Size |
|---|---|
| Hero H1 | 32–50px |
| H1 | 28–32px |
| H2 | 22–24px |
| H3 | 18–20px |
| Dashboard Title | 15–17px |
| Dashboard Body | 12–13px |
| Body | 14–16px |
| Caption | 11–12px |
| Micro Labels | 10–11px |

### Font Weights

- 400 Regular
- 500 Medium
- 600 Semibold
- 700 Bold
- 800 Extra Bold

---

## 5. Spacing System

Use an 8px spacing grid.

### Core Scale

- 4
- 8
- 12
- 16
- 20
- 24
- 32
- 40
- 48

---

## 6. Border Radius

| Token | Value |
|---|---|
| sm | 6px |
| md | 10px |
| lg | 16px |
| xl | 20–24px |
| full | 9999px |

### Usage

- `sm` — small controls
- `md` — buttons/inputs
- `lg` — cards
- `xl` — modals/highlight containers
- `full` — pills/badges/avatar circles

---

## 7. UI Components

### Buttons

Variants:

- Primary
- Secondary
- Danger
- Ghost
- Outline

States:

- Hover
- Active
- Disabled
- Loading

### Inputs

- Text input
- Password input
- Select dropdown
- Date input
- Textarea

### Navigation

- Sidebar navigation
- Topbar
- Breadcrumbs
- Theme toggle

### Feedback Components

- Toast notifications
- XP animations
- Loading spinners
- Status badges

### Data Components

- Dashboard metric cards
- Campaign tables
- Analytics charts
- Leaderboards
- User lists

### Modal Components

- Overlay blur
- Escape key close
- Animated entry

---

## 8. Accessibility

The platform targets WCAG AA compliance.

### Requirements

- Proper colour contrast
- Keyboard navigation
- Visible focus states
- Readable typography
- Semantic button usage
- ARIA labels where necessary
- Responsive scaling

### Focus System

Use visible blue focus rings:

- Accent Blue (`#2563EB`)
- Soft glow outline

---

## 9. Motion System

Animations should remain subtle and fast.

### Transition Timing

| Interaction | Duration |
|---|---|
| Hover | 150ms |
| Sidebar collapse | 200ms |
| Modal entry | 150–250ms |
| Page transitions | 300–400ms |
| Spinner rotation | Continuous |

### Motion Types

- Hover elevation
- Fade ins
- XP gain overlays
- Toast animations
- Modal scale/fade entry
- Card hover movement

Avoid excessive animation.

---

## 10. Dashboard Layout

### Core Layout Structure

- Persistent sidebar
- Top navigation bar
- Responsive dashboard grid
- Scrollable content region

### Dashboard Principles

- Information density
- Fast scanning
- Compact analytics
- Role-based navigation
- Modular reusable cards

### Navigation Structure

**Main**

- Dashboard
- Campaigns
- Users
- Training
- Leaderboard

Navigation items depend on the user role.

**Analytics**

- Analytics
- Reports

**System**

- Settings

### Role-Based Visibility

Navigation changes dynamically based on:

- Admin
- Analyst
- User roles

---

## 11. Gamification System

### Gamification Features

- XP points
- Badges
- Leaderboards
- Security score
- Training progression

### Goal

Encourage positive security behaviour through rewards and competition.
