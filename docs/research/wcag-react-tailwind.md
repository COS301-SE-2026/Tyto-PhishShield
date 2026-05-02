# WCAG 2.1 AA Compliance — React & Tailwind CSS

---

## Overview

Web Content Accessibility Guidelines (WCAG 2.1) is an internationally recognised standard developed by the W3C (World Wide Web Consortium) that defines how to make web content more accessible to people with disabilities. This includes users with visual, auditory, motor, and cognitive impairments.

**Level AA** is the required industry standard and the target compliance level for this project. It sits between the basic Level A and the stricter Level AAA, and is the benchmark required by most legal and institutional frameworks worldwide.

> Reference: https://www.w3.org/WAI/WCAG21/quickref/?versions=2.1&levels=aa

---

## Key Requirements & Implementation

### 1. Screen Orientation

**Requirement:** Content must adapt to different screen orientations (portrait and landscape) on mobile devices and not be restricted to a single orientation unless that orientation is essential to the functionality.

**Implementation with Tailwind CSS:**

Tailwind's responsive utilities handle orientation-based layouts without custom media queries:

```html
<div class="flex flex-col md:flex-row">
  <!-- Stacks vertically on mobile, horizontal on wider screens -->
</div>
```

For explicit orientation control:

```css
@media (orientation: landscape) {
  /* landscape-specific overrides if needed */
}
```

---

### 2. Keyboard Navigation

**Requirement:** All functionality must be operable via keyboard alone. Users who cannot use a mouse rely entirely on keyboard navigation.

**Common keyboard controls:**

| Key | Action |
|---|---|
| `Tab` | Move focus forward through interactive elements |
| `Shift + Tab` | Move focus backward |
| `Enter` | Activate buttons and links |
| `Space` | Toggle checkboxes, activate buttons |
| `Arrow keys` | Navigate within components (menus, sliders, tabs) |

**Implementation with Tailwind CSS:**

Tailwind provides focus utilities to make the current keyboard focus position clearly visible:

```html
<button class="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
  Submit
</button>
```

Never suppress the default focus outline without providing a visible alternative. The `focus:ring` utilities are the recommended replacement.

For components that require custom keyboard handling (e.g. dropdown menus, modals), use the `onKeyDown` handler in React:

```tsx
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    // activate action
  }
  if (e.key === 'Escape') {
    // close modal / dropdown
  }
};
```

---

### 3. Colour Contrast

**Requirement:** Text must have a minimum contrast ratio against its background to be readable by users with colour blindness or low vision.

| Text Type | Minimum Contrast Ratio (AA) |
|---|---|
| Normal text (below 18pt) | 4.5:1 |
| Large text (18pt+ or 14pt bold) | 3:1 |
| UI components and graphical elements | 3:1 |

**Implementation with Tailwind CSS:**

Tailwind's default colour palette is designed with accessible contrast in mind, but always verify combinations. For example, light grey text on a white background will fail contrast checks.

Recommended pairings:

```html
<!-- High contrast: dark text on light background -->
<p class="text-gray-900 bg-white">Readable text</p>

<!-- Accessible button -->
<button class="bg-blue-600 text-white hover:bg-blue-700">
  Action
</button>
```

Use a contrast checker tool (such as WebAIM Contrast Checker) to verify any custom colour choices before committing them to the design system.

---

### 4. Screen Reader Support

**Requirement:** Content must be perceivable and navigable by screen readers (e.g. NVDA, JAWS, VoiceOver). This means providing text alternatives for visual-only content and ensuring interactive elements are properly labelled.

**Tailwind `sr-only` utility:**

The `sr-only` class visually hides an element while keeping it readable by screen readers. Use it to add descriptive labels that are not needed visually but are essential for assistive technology.

```tsx
<button>
  <svg aria-hidden="true" />
  <span className="sr-only">Submit form</span>
</button>
```

**ARIA labels for icon-only buttons:**

```tsx
<button aria-label="Close dialog">
  <XIcon className="h-5 w-5" />
</button>
```

**Semantic HTML:**

Prefer native HTML elements over generic `div` or `span` where possible, as they carry implicit ARIA roles:

```tsx
// Preferred
<nav>, <main>, <header>, <footer>, <button>, <a href="...">

// Avoid for interactive elements
<div onClick={...}>Click me</div>  // not keyboard accessible, no role
```

---

### 5. ARIA Live Regions

**Requirement:** Dynamic content changes (e.g. form submission feedback, data updates, error messages) must be communicated to screen readers. Without an ARIA live region, a screen reader user will not be aware that the page content has changed.

**Implementation:**

```tsx
// Announcement banner component
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  Data updated successfully
</div>
```

**`aria-live` values:**

| Value | Behaviour |
|---|---|
| `polite` | Announces when the user is idle — use for non-urgent updates |
| `assertive` | Interrupts immediately — use for errors or critical alerts only |

**React implementation pattern:**

```tsx
const [announcement, setAnnouncement] = useState('');

const handleSave = async () => {
  await saveData();
  setAnnouncement('Data saved successfully.');
};

return (
  <>
    <button onClick={handleSave}>Save</button>
    <div role="status" aria-live="polite" className="sr-only">
      {announcement}
    </div>
  </>
);
```

---

### 6. Data Visualisation Accessibility

**Requirement:** Charts and graphs convey information visually, which excludes users who are blind or have low vision. Any data presented in a graph must also be available in an accessible text-based format.

**Implementation:**

Always provide a toggle to switch between a chart view and a data table view:

```tsx
const [view, setView] = useState<'chart' | 'table'>('chart');

return (
  <div>
    <div className="flex gap-2 mb-4">
      <button
        onClick={() => setView('chart')}
        aria-pressed={view === 'chart'}
        className="px-3 py-1 rounded border focus:ring-2 focus:ring-blue-500"
      >
        Chart view
      </button>
      <button
        onClick={() => setView('table')}
        aria-pressed={view === 'table'}
        className="px-3 py-1 rounded border focus:ring-2 focus:ring-blue-500"
      >
        Table view
      </button>
    </div>

    {view === 'chart' ? (
      <div aria-hidden="true">
        {/* Recharts or other graph component */}
      </div>
    ) : (
      <table>
        <caption>Campaign results by month</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Reports</th>
            <th scope="col">XP Awarded</th>
          </tr>
        </thead>
        <tbody>
          {/* data rows */}
        </tbody>
      </table>
    )}
  </div>
);
```

Add a visually hidden caption or `aria-label` to chart containers so screen readers can identify what the chart represents even when `aria-hidden="true"` is applied.

---

## Testing Tools

### Lighthouse

Lighthouse is a free auditing tool built into Chrome DevTools that produces an accessibility score alongside performance, SEO, and best practices scores.

**How to run:**
1. Open Chrome DevTools (`F12`)
2. Navigate to the **Lighthouse** tab
3. Select **Accessibility** and run the audit
4. Review flagged issues and follow the suggested fixes

Lighthouse is best used as a final check before deployment. It catches common issues but does not replace manual testing or `react-axe`.

---

### react-axe (`@axe-core/react`)

`react-axe` runs automated accessibility checks during development and logs warnings directly to the browser console. It should only run in development environments as it adds overhead and logs errors to the console.

**Installation:**

```bash
npm install --save-dev axe-core @axe-core/react
```

**Setup in `index.tsx` / `main.tsx`:**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

if (process.env.NODE_ENV !== 'production') {
  import('@axe-core/react').then((axe) => {
    axe.default(React, ReactDOM, 1000);
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

> **Important:** This must only run outside of production. The conditional check on `NODE_ENV` ensures it is excluded from production builds automatically.

**What it catches:**

- Missing `alt` attributes on images
- Insufficient colour contrast
- Missing form labels
- Invalid ARIA attribute usage
- Interactive elements with no accessible name

---

## Tailwind CSS Accessibility Reference

For teams unfamiliar with Tailwind CSS, it is a utility-first CSS framework where styles are applied directly as class names in markup rather than in separate CSS files.

> Documentation: https://tailwindcss.com/

Key accessibility-related Tailwind utilities:

| Utility | Purpose |
|---|---|
| `sr-only` | Visually hides element but keeps it accessible to screen readers |
| `not-sr-only` | Reverses `sr-only` (useful for focus-visible states) |
| `focus:ring-2` | Adds a visible focus ring when element is focused via keyboard |
| `focus:ring-blue-500` | Sets the colour of the focus ring |
| `focus:ring-offset-2` | Adds spacing between the element and the focus ring |
| `focus:outline-none` | Removes default browser outline (only use alongside a custom `focus:ring`) |
| `aria-*` variants | Apply styles conditionally based on ARIA state (e.g. `aria-selected:bg-blue-100`) |

---

## Summary Checklist

- Screen orientation is not locked unless functionally required
- All interactive elements are reachable and operable by keyboard
- Visible focus indicators are present on all focusable elements
- Text and UI elements meet minimum contrast ratios (4.5:1 for normal text)
- Icon-only buttons have `aria-label` or `sr-only` text
- Dynamic content updates are announced via `aria-live` regions
- Charts and graphs have an accessible table alternative
- `react-axe` is configured for development environments only
- Lighthouse accessibility audit is run before deployment
