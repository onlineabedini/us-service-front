# Layout System Documentation

This document describes the new centralized layout system that provides consistent, responsive layouts across the entire application.

## Layout Components

### 1. RootLayout
The base layout component that provides:
- Global background gradient
- Notification system (Toaster)
- Proper centering for all screen sizes
- Base responsive structure

### 2. PublicLayout
For public pages (landing, about, FAQ, etc.):
- Includes sticky navbar at top
- Footer at bottom
- Centered content container
- Optional navbar/footer control

### 3. AuthLayout
For authentication pages (login, register, forgot password):
- Centered authentication forms
- Vitago branding
- Consistent styling across auth flows
- Responsive card-based design

### 4. AdminLayout
For admin panel with features:
- **Closable responsive sidebar** with keyboard shortcuts (Ctrl+B)
- Mobile-responsive with overlay
- Modern navigation design
- Auto-close on mobile
- ESC key support for mobile

### 5. DashboardLayout
For user profile and dashboard pages:
- Extends PublicLayout
- Consistent page headers
- Card-based content wrapper
- Responsive design

### 6. MarketplaceLayout
For marketplace and complex sidebar pages:
- Minimal wrapper for custom layouts
- Full-height container
- Supports custom sidebar implementations

### 7. ResponsiveLayout
Utility layout for responsive behavior:
- Device detection
- Responsive padding
- Screen size utilities

## Usage Examples

```tsx
// Public page
<PublicLayout>
  <YourComponent />
</PublicLayout>

// Auth page
<AuthLayout title="Sign In" description="Access your account">
  <LoginForm />
</AuthLayout>

// Admin page (automatic through routing)
// Uses AdminLayout with nested routes

// Dashboard page
<DashboardLayout title="Profile" subtitle="Manage your account">
  <ProfileContent />
</DashboardLayout>
```

## Key Features

### Responsive Design
- All layouts are mobile-first responsive
- Consistent breakpoints: sm(640), md(768), lg(1024), xl(1280), 2xl(1536)
- Automatic content centering
- Safe area support for mobile devices

### Admin Panel Features
- **Closable sidebar** - toggle with button or Ctrl+B
- Mobile responsive with overlay
- ESC key closes sidebar on mobile
- Keyboard shortcut hints
- Modern navigation with active states

### Accessibility
- Proper focus management
- Keyboard navigation support
- Screen reader friendly
- Color contrast compliance

### Performance
- Lazy loading support
- Optimized re-renders
- Responsive hooks with cleanup

## Hooks

### useLayout
Manages layout configuration:
```tsx
const { config, updateConfig } = useLayout({
  showNavbar: true,
  showFooter: false,
  containerSize: 'lg'
});
```

### useResponsive
Responsive behavior detection:
```tsx
const { isMobile, isTablet, breakpoint } = useResponsive();
```

### useKeyboardShortcuts
Keyboard shortcut management:
```tsx
useKeyboardShortcuts({
  'ctrl+b': () => toggleSidebar(),
  'escape': () => closeMobileMenu()
});
```

## Migration Notes

The old layout system has been replaced with this centralized approach:
- ❌ Old: Each page manually imports Navbar/Footer
- ✅ New: Layouts handle structure automatically
- ❌ Old: Inconsistent responsive behavior
- ✅ New: Unified responsive system
- ❌ Old: Fixed admin sidebar
- ✅ New: Closable, responsive admin sidebar

## File Structure

```
src/
├── layouts/
│   ├── index.ts              # Export all layouts
│   ├── RootLayout.tsx        # Base layout
│   ├── PublicLayout.tsx      # Public pages
│   ├── AuthLayout.tsx        # Auth pages
│   ├── AdminLayout.tsx       # Admin panel
│   ├── DashboardLayout.tsx   # User dashboards
│   ├── MarketplaceLayout.tsx # Marketplace
│   ├── ResponsiveLayout.tsx  # Responsive utilities
│   └── README.md            # This file
├── hooks/
│   └── use-layout.tsx       # Layout management hooks
└── components/
    └── layout/
        ├── container.tsx    # Reusable container
        ├── responsive.tsx   # Responsive utilities
        └── ...
```

## Best Practices

1. **Always use appropriate layout**: Choose the layout that matches your page type
2. **Consistent container sizes**: Use standard container sizes for consistency
3. **Mobile-first**: Design for mobile, enhance for desktop
4. **Keyboard accessibility**: Support keyboard navigation
5. **Performance**: Use responsive hooks with proper cleanup 