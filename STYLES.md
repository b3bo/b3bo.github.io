# Neighborhood Finder Style Guide

**For AI Agents/LLMs Working on This Project**

This guide explains the design system, spacing conventions, and styling rules for the Neighborhood Finder application.

---

## Before You Start

**REQUIRED READING:**

1. **Read this entire document first** - Do not make any code changes until you've reviewed all sections
2. **Read `TAILWIND_BUILD.md`** - Understand the build system and folder structure
3. **Only modify code when explicitly requested** - Never make changes proactively

**After reading, follow these steps for ANY code modification:**

### Step 1: Understand the Request
- Read the user's request carefully
- Identify which files need changes
- Determine if changes affect HTML, CSS, or JavaScript

### Step 2: Read Existing Code
- **ALWAYS use the Read tool** to examine files before editing
- Understand the current structure and patterns
- Look for similar existing components to match

### Step 3: Plan Your Changes
- Identify which Tailwind classes to use (refer to Component Patterns section)
- Ensure ALL color classes have `dark:` variants
- Verify spacing follows 8px base unit (use `space-y-*`, `px-*`, `py-*`)
- Check that no inline styles or hard-coded colors will be introduced

### Step 4: Make Changes
- Use Edit tool with exact string matching
- Follow existing code style and indentation
- Add dark mode variants to ALL background, text, and border classes
- Test that changes match the design patterns in this guide

### Step 5: Build & Test
- Run `npm run build:neighborhoods` to compile Tailwind CSS
- Test in both light and dark modes
- Verify responsive behavior at mobile (375px) and desktop (1920px) widths
- Check hover states and interactive elements

**IMPORTANT:** If you're unsure about any change, ask the user for clarification before proceeding.

---

## Core Principles

1. **Pure Tailwind Utilities** - No custom CSS classes (except Google Maps overrides)
2. **Single Source of Truth** - All colors in `@theme` block
3. **Consistent Spacing** - 8px base unit for vertical rhythm
4. **Fluid Typography** - Responsive font sizes with `clamp()`
5. **Mobile-First** - Design for small screens, enhance for desktop
6. **Light/Dark Mode** - All components support theme switching

---

## Design System Location

**File:** `assets/css/neighborhoods/styles.css`

All design tokens (colors, spacing, typography) are defined in the `@theme` block. **Never hard-code colors or spacing values** - always use Tailwind utilities.

---

## Color System (3-Layer Architecture)

### Layer 1: Design Tokens (Agent Rebrand Section)

These are the raw color values agents change for rebranding:

```css
/* === AGENT REBRAND SECTION START === */
--color-brand-base: #4c8f96;      /* Main brand color */
--color-brand-hover: #3a7179;     /* Hover state */
--color-brand-light: rgba(76, 143, 150, 0.1);  /* Light tint */
--color-brand-rgb: 76, 143, 150;  /* RGB for alpha */
/* === AGENT REBRAND SECTION END === */
```

### Layer 2: Semantic Aliases

These map design tokens to component purposes (defined in @theme, rarely changed):

```css
--color-primary: var(--color-brand-base);
--color-text-primary: var(--color-neutral-800);
--color-bg-sidebar: white;
--color-border: var(--color-neutral-200);
```

### Layer 3: Tailwind Utilities

Used in HTML - agents never change these:

```html
<button class="bg-brand-500 hover:bg-brand-600 text-white">
```

---

## Spacing Rules

### Vertical Spacing (8px Base Unit)

**Always use Tailwind's `space-y-*` utilities for consistent rhythm:**

| Use Case | Class | Pixels | When to Use |
|----------|-------|--------|-------------|
| Tight | `space-y-2` | 16px | Within components, related items |
| Default | `space-y-3` | 24px | Between sections, filter groups |
| Large | `space-y-4` | 32px | Major divisions, panel sections |
| XL | `space-y-6` | 48px | Hero sections, page breaks |

**Examples:**

```html
<!-- Filter group (tight spacing) -->
<div class="space-y-2">
  <label>Price Range</label>
  <input>
  <input>
</div>

<!-- Between filter groups (default spacing) -->
<div class="space-y-3">
  <div><!-- Price filter --></div>
  <div><!-- Amenities filter --></div>
</div>
```

### Horizontal Spacing (Container Padding)

**Use responsive padding classes:**

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Sidebar | `px-5` (20px) | `px-5` | `px-5` |
| Cards | `px-4` (16px) | `sm:px-5` (20px) | `lg:px-6` (24px) |
| Containers | `px-4` | `sm:px-6` | `lg:px-8` |

**Examples:**

```html
<!-- Sidebar (fixed 20px padding) -->
<div class="w-[460px] px-5">

<!-- Responsive container -->
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
```

---

## Typography Scale

**Fluid responsive typography** - automatically scales between mobile and desktop:

| Class | Mobile | Desktop | Use Case |
|-------|--------|---------|----------|
| `text-xs` | 12px | 14px | Captions, metadata |
| `text-sm` | 14px | 16px | Body text, labels |
| `text-base` | 16px | 18px | Primary content |
| `text-lg` | 18px | 20px | Subheadings |
| `text-xl` | 20px | 24px | Card titles |
| `text-2xl` | 24px | 30px | Section headings |
| `text-3xl` | 30px | 36px | Page titles |

**Font weights:**
- `font-normal` (400) - Body text
- `font-medium` (500) - Emphasis, labels
- `font-semibold` (600) - Headings, buttons
- `font-bold` (700) - Strong emphasis

---

## Dark Mode

### Using Dark Mode Classes

All components must include `dark:` variants for background, text, and border colors.

**Pattern:**
```html
<div class="bg-white dark:bg-dark-bg-elevated
            text-neutral-800 dark:text-dark-text-primary
            border-neutral-200 dark:border-dark-border">
```

### Dark Mode Color Palette

| Use Case | Light Mode | Dark Mode |
|----------|------------|-----------|
| Base background | `bg-white` | `dark:bg-dark-bg-base` |
| Elevated (cards) | `bg-white` | `dark:bg-dark-bg-elevated` |
| Hover states | `bg-neutral-50` | `dark:bg-dark-bg-elevated-2` |
| Primary text | `text-neutral-800` | `dark:text-dark-text-primary` |
| Secondary text | `text-neutral-600` | `dark:text-dark-text-secondary` |
| Borders | `border-neutral-200` | `dark:border-dark-border` |
| Brand buttons | `bg-brand-500` | `dark:bg-brand-dark` |

---

## Component Patterns

### Buttons

```html
<!-- Primary button -->
<button class="bg-brand-500 hover:bg-brand-600 dark:bg-brand-dark dark:hover:bg-brand-dark-hover
               text-white py-2.5 px-4 rounded-lg font-medium transition-colors duration-200">
  Button Text
</button>

<!-- Secondary button -->
<button class="bg-white hover:bg-neutral-50 dark:bg-dark-bg-elevated dark:hover:bg-dark-bg-elevated-2
               text-neutral-700 dark:text-dark-text-primary border border-neutral-300 dark:border-dark-border
               py-2.5 px-4 rounded-lg font-medium">
  Secondary
</button>

<!-- Ghost button -->
<button class="hover:bg-neutral-100 dark:hover:bg-dark-bg-elevated-2
               text-neutral-600 dark:text-dark-text-secondary py-2 px-3 rounded-lg transition-colors">
  Ghost
</button>
```

### Cards

```html
<div class="bg-white dark:bg-dark-bg-elevated rounded-lg shadow-sm
            border border-neutral-200 dark:border-dark-border p-4
            cursor-pointer transition-all duration-200
            hover:shadow-md hover:border-brand-500 dark:hover:bg-dark-bg-elevated-2">
  <h3 class="text-lg font-semibold text-neutral-800 dark:text-dark-text-primary mb-2">
    Card Title
  </h3>
  <div class="space-y-1 text-sm text-neutral-600 dark:text-dark-text-secondary">
    <!-- Card content -->
  </div>
</div>
```

### Filter Tags

```html
<!-- Default tag -->
<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
             bg-neutral-100 dark:bg-dark-bg-elevated-2
             text-neutral-600 dark:text-dark-text-secondary text-sm">
  Tag
</span>

<!-- Active tag -->
<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full
             bg-brand-100 dark:bg-brand-dark/20
             text-brand-700 dark:text-brand-dark text-sm font-medium">
  Active
</span>
```

### Input Fields

```html
<input class="bg-white dark:bg-dark-bg-elevated
              border-neutral-300 dark:border-dark-border
              text-neutral-800 dark:text-dark-text-primary
              placeholder-neutral-400 dark:placeholder-neutral-600
              focus:border-brand-500 dark:focus:border-brand-dark
              px-4 py-2 rounded-lg w-full">
```

### Dividers

```html
<!-- Horizontal divider -->
<div class="border-b border-neutral-200 dark:border-dark-border"></div>

<!-- With spacing -->
<div class="my-4 border-b border-neutral-200 dark:border-dark-border"></div>
```

---

## Rules for AI Agents

### DO:
- ✅ Use Tailwind utility classes exclusively
- ✅ Use `space-y-*` for vertical spacing between elements
- ✅ Use `px-*`, `py-*` for component padding
- ✅ Use semantic color classes (`bg-brand-500`, `text-neutral-800`)
- ✅ **Always add `dark:` variants** for bg, text, and border colors
- ✅ Use responsive variants (`sm:`, `md:`, `lg:`)
- ✅ Match existing spacing patterns in similar components
- ✅ Maintain 8px base unit for spacing (multiples of 2, 3, 4, 6, 8, 12)

### DON'T:
- ❌ **Never** use inline `style=""` attributes
- ❌ **Never** hard-code hex colors (`#4c8f96`)
- ❌ **Never** hard-code RGB values (`rgb(76, 143, 150)`)
- ❌ **Never** create custom CSS classes (except for animations/Google Maps overrides)
- ❌ **Never** use arbitrary spacing values that break the 8px grid
- ❌ **Never** mix `space-y-*` with manual margins on children
- ❌ **Never** forget `dark:` variants on color-related classes

---

## Mobile Responsiveness

**Mobile-first approach:**

```html
<!-- Base: Mobile (< 640px) -->
<div class="text-sm px-4 space-y-2">

<!-- Tablet (640px+) -->
<div class="text-sm sm:text-base sm:px-6 sm:space-y-3">

<!-- Desktop (1024px+) -->
<div class="text-sm sm:text-base lg:text-lg lg:px-8 lg:space-y-4">
```

**Breakpoints:**
- `sm:` - 640px (tablet portrait)
- `md:` - 768px (tablet landscape)
- `lg:` - 1024px (desktop)
- `xl:` - 1280px (large desktop)

---

## Testing Your Changes

1. **Build CSS:** `npm run build:neighborhoods`
2. **Visual Check:** Compare spacing/colors with existing components
3. **Test Light Mode:** Verify appearance in default theme
4. **Test Dark Mode:** Toggle theme, verify all colors/contrast
5. **Mobile Test:** Resize browser to 375px width
6. **Desktop Test:** Test at 1920px width
7. **Hover States:** Verify all interactive elements have hover feedback in both themes

---

## Theme Toggle

The theme toggle is managed by `assets/js/theme.js`:

```javascript
// Get current theme
ThemeManager.getCurrentTheme(); // 'light' or 'dark'

// Toggle theme
ThemeManager.toggle();

// Set specific theme
ThemeManager.setTheme('dark');
```

Theme preference is stored in localStorage and respects system preferences.

---

## Need Help?

- **Rebranding:** See `docs/REBRAND_GUIDE.md`
- **Build Issues:** See `TAILWIND_BUILD.md`
- **Color Reference:** Check `assets/css/neighborhoods/styles.css` `@theme` block
