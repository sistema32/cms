# DaisyUI Integration Guide

## Overview

DaisyUI has been integrated into LexCMS to provide pre-built UI components that work seamlessly with Tailwind CSS. The integration is configured to use the Mosaic violet color scheme (#8470ff) as the primary color.

## Installation

DaisyUI is already installed and configured. No additional setup is needed.

## Configuration

The DaisyUI configuration is in `tailwind.config.js`:

```javascript
daisyui: {
  themes: [
    {
      light: {
        primary: '#8470ff', // Mosaic violet
        'primary-focus': '#755ff8',
        'primary-content': '#ffffff',
      },
      dark: {
        primary: '#8470ff',
        'primary-focus': '#755ff8',
        'primary-content': '#ffffff',
      },
    },
  ],
  darkTheme: 'dark',
  base: true,
  styled: true,
  utils: true,
}
```

## Available Components

DaisyUI provides the following component categories:

### Actions
- **Button**: `<button class="btn">Button</button>`
- **Dropdown**: `<div class="dropdown">...</div>`
- **Modal**: `<dialog class="modal">...</dialog>`
- **Swap**: `<label class="swap">...</label>`

### Data Display
- **Accordion**: `<div class="collapse">...</div>`
- **Avatar**: `<div class="avatar">...</div>`
- **Badge**: `<span class="badge">Badge</span>`
- **Card**: `<div class="card">...</div>`
- **Carousel**: `<div class="carousel">...</div>`
- **Table**: `<table class="table">...</table>`
- **Timeline**: `<ul class="timeline">...</ul>`

### Data Input
- **Checkbox**: `<input type="checkbox" class="checkbox" />`
- **File Input**: `<input type="file" class="file-input" />`
- **Radio**: `<input type="radio" class="radio" />`
- **Range**: `<input type="range" class="range" />`
- **Select**: `<select class="select">...</select>`
- **Text Input**: `<input type="text" class="input" />`
- **Textarea**: `<textarea class="textarea">...</textarea>`
- **Toggle**: `<input type="checkbox" class="toggle" />`

### Feedback
- **Alert**: `<div role="alert" class="alert">...</div>`
- **Loading**: `<span class="loading loading-spinner"></span>`
- **Progress**: `<progress class="progress" value="70" max="100"></progress>`
- **Toast**: `<div class="toast">...</div>`

### Layout
- **Divider**: `<div class="divider">OR</div>`
- **Drawer**: `<div class="drawer">...</div>`
- **Footer**: `<footer class="footer">...</footer>`
- **Hero**: `<div class="hero">...</div>`
- **Join**: `<div class="join">...</div>`
- **Navbar**: `<div class="navbar">...</div>`
- **Stack**: `<div class="stack">...</div>`

### Navigation
- **Breadcrumbs**: `<div class="breadcrumbs">...</div>`
- **Link**: `<a class="link">Link</a>`
- **Menu**: `<ul class="menu">...</ul>`
- **Pagination**: `<div class="join">...</div>`
- **Steps**: `<ul class="steps">...</ul>`
- **Tab**: `<div class="tabs">...</div>`

## Usage Examples

### Button Variants

```tsx
// Primary button (uses Mosaic violet)
<button class="btn btn-primary">Primary</button>

// Other variants
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-accent">Accent</button>
<button class="btn btn-ghost">Ghost</button>
<button class="btn btn-link">Link</button>

// Sizes
<button class="btn btn-xs">Tiny</button>
<button class="btn btn-sm">Small</button>
<button class="btn btn-md">Normal</button>
<button class="btn btn-lg">Large</button>

// States
<button class="btn btn-primary" disabled>Disabled</button>
<button class="btn btn-primary loading">Loading</button>
```

### Cards

```tsx
<div class="card bg-base-100 shadow-xl">
  <figure><img src="/image.jpg" alt="Album" /></figure>
  <div class="card-body">
    <h2 class="card-title">Card Title</h2>
    <p>Card description goes here</p>
    <div class="card-actions justify-end">
      <button class="btn btn-primary">Action</button>
    </div>
  </div>
</div>
```

### Forms

```tsx
<div class="form-control w-full max-w-xs">
  <label class="label">
    <span class="label-text">Email</span>
  </label>
  <input
    type="text"
    placeholder="Type here"
    class="input input-bordered w-full max-w-xs"
  />
  <label class="label">
    <span class="label-text-alt">Alt label</span>
  </label>
</div>
```

### Alerts

```tsx
<div role="alert" class="alert alert-info">
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
  </svg>
  <span>New software update available.</span>
</div>
```

### Modals

```tsx
<button class="btn" onclick="my_modal.showModal()">Open Modal</button>

<dialog id="my_modal" class="modal">
  <div class="modal-box">
    <h3 class="font-bold text-lg">Hello!</h3>
    <p class="py-4">Press ESC key or click outside to close</p>
  </div>
  <form method="dialog" class="modal-backdrop">
    <button>close</button>
  </form>
</dialog>
```

## Compatibility with Mosaic Design

DaisyUI and the existing Mosaic design are fully compatible:

1. **Color Scheme**: DaisyUI's primary color is set to match Mosaic's violet (#8470ff)
2. **Dark Mode**: Both use `class`-based dark mode
3. **Utility Classes**: DaisyUI uses `@layer components`, so Tailwind utilities still work
4. **Custom Styles**: Existing custom CSS classes are preserved

## Best Practices

1. **Use DaisyUI components for common UI patterns** (buttons, forms, modals)
2. **Combine with Tailwind utilities** for fine-tuning
3. **Maintain Mosaic design language** by using violet as the primary color
4. **Test dark mode** to ensure components look good in both themes

## Rebuilding CSS

After making changes to Tailwind config or adding new components:

```bash
deno task css:build:admin
```

Or for automatic rebuilding during development:

```bash
deno task css:watch:admin
```

## Documentation

Full DaisyUI documentation: https://daisyui.com/

## Examples

See `/src/admin/pages/ComponentsDemo.tsx` for live examples of DaisyUI components in the admin panel.
