# Admin Panel Architecture Overview - LexCMS

## 1. PROJECT STRUCTURE

### Directory Layout
```
/home/user/cms/src/
├── admin/                          # Admin panel frontend
│   ├── pages/                     # Page components (18 files)
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   ├── ContentList.tsx
│   │   ├── ContentForm.tsx
│   │   ├── PostFormPage.tsx
│   │   ├── PageFormPage.tsx
│   │   ├── Categories.tsx
│   │   ├── Tags.tsx
│   │   ├── UsersImproved.tsx
│   │   ├── RolesPageImproved.tsx
│   │   ├── PermissionsPageImproved.tsx
│   │   ├── Settings.tsx
│   │   ├── ThemesPage.tsx
│   │   ├── AppearanceMenusPage.tsx
│   │   ├── MediaLibraryPage.tsx
│   │   ├── PluginsInstalledPage.tsx
│   │   ├── PluginsAvailablePage.tsx
│   │   └── PluginsMarketplacePage.tsx
│   ├── components/                # Reusable components
│   │   ├── AdminLayout.tsx       # Main layout wrapper
│   │   ├── CKEditorField.tsx     # Rich text editor
│   │   ├── CategoryTagSelector.tsx
│   │   ├── ContentEditorPage.tsx
│   │   ├── ImageEditor.tsx
│   │   ├── MediaPicker.tsx
│   │   ├── RevisionHistory.tsx
│   │   ├── SeoFields.tsx
│   │   └── icons.ts
│   └── assets/
│       ├── css/
│       │   ├── admin.css          # Tailwind-based styles (364 lines)
│       │   └── ckeditor.css
│       └── js/
│           ├── ckeditor-bundle.js
│           ├── ckeditor-entry.ts
│           ├── ckeditor-init.js
│           └── media-library.js
├── routes/
│   └── admin.ts                   # Main admin router (3,744 lines)
├── controllers/                   # Business logic
│   ├── authController.ts
│   ├── categoryController.ts
│   ├── commentController.ts
│   ├── contentController.ts
│   ├── contentFilterController.ts
│   ├── contentTypeController.ts
│   ├── mediaController.ts
│   ├── menuController.ts
│   ├── permissionController.ts
│   ├── pluginController.ts
│   ├── roleController.ts
│   ├── tagController.ts
│   ├── twoFactorController.ts
│   └── userController.ts
└── db/
    └── schema.ts                  # Database models (50+ tables)
```

---

## 2. ADMIN PANEL ROUTES & ENDPOINTS

### Authentication Routes
```typescript
GET    /admin/login                  # Login form
POST   /admin/login                  # Process login
POST   /admin/login/verify-2fa       # Verify 2FA code
POST   /admin/logout                 # Logout
```

### Dashboard & Content Management
```typescript
GET    /admin/                       # Dashboard
GET    /admin/content                # Content list
GET    /admin/content/new            # New content form
POST   /admin/content/new            # Create content
GET    /admin/content/edit/:id       # Edit content form
POST   /admin/content/edit/:id       # Update content
POST   /admin/content/delete/:id     # Delete content

GET    /admin/posts                  # Posts list
GET    /admin/posts/new              # New post form
POST   /admin/posts/new              # Create post
GET    /admin/posts/edit/:id         # Edit post
POST   /admin/posts/edit/:id         # Update post
POST   /admin/posts/delete/:id       # Delete post

GET    /admin/pages                  # Pages list
GET    /admin/pages/new              # New page form
POST   /admin/pages/new              # Create page
GET    /admin/pages/edit/:id         # Edit page
POST   /admin/pages/edit/:id         # Update page
POST   /admin/pages/delete/:id       # Delete page
```

### Media Management
```typescript
GET    /admin/media                  # Media library
GET    /admin/media/data             # Media data API
GET    /admin/media/:id              # Media details
POST   /admin/media                  # Upload media
DELETE /admin/media/:id              # Delete media
```

### Appearance & Themes
```typescript
GET    /admin/appearance/themes                          # Themes manager
POST   /admin/appearance/themes/activate                 # Activate theme
POST   /admin/appearance/themes/custom-settings          # Save theme settings
GET    /admin/api/admin/themes/cache/stats              # Cache statistics
POST   /admin/api/admin/themes/cache/clear              # Clear cache
POST   /admin/api/admin/themes/cache/warmup             # Warmup cache
GET    /admin/api/admin/themes/config/export            # Export config
POST   /admin/api/admin/themes/config/import            # Import config
POST   /admin/api/admin/themes/customizer/session       # Create customizer session
GET    /admin/api/admin/themes/customizer/state/:id     # Get customizer state
POST   /admin/api/admin/themes/customizer/change        # Apply change
POST   /admin/api/admin/themes/customizer/undo          # Undo change
POST   /admin/api/admin/themes/customizer/redo          # Redo change
POST   /admin/api/admin/themes/customizer/save-draft    # Save draft
POST   /admin/api/admin/themes/customizer/publish       # Publish changes
```

### Menus & Navigation
```typescript
GET    /admin/appearance/menus                          # Menu manager
POST   /admin/api/admin/menus/reorder                   # Reorder menu items
POST   /admin/api/admin/menus/update                    # Update menu
POST   /admin/api/admin/menus/delete                    # Delete menu item
```

### Access Control (Users, Roles, Permissions)
```typescript
GET    /admin/users                  # Users list
POST   /admin/users/new              # Create user
POST   /admin/users/edit/:id         # Update user
POST   /admin/users/delete/:id       # Delete user
POST   /admin/users/2fa/:id          # Toggle 2FA

GET    /admin/roles                  # Roles list
POST   /admin/roles/new              # Create role
POST   /admin/roles/edit/:id         # Update role
POST   /admin/roles/delete/:id       # Delete role

GET    /admin/permissions            # Permissions list
POST   /admin/permissions/new        # Create permission
POST   /admin/permissions/delete/:id # Delete permission
```

### Categories & Tags
```typescript
GET    /admin/categories             # Categories list
POST   /admin/categories/new         # Create category
POST   /admin/categories/edit/:id    # Update category
POST   /admin/categories/delete/:id  # Delete category

GET    /admin/tags                   # Tags list
POST   /admin/tags/new               # Create tag
POST   /admin/tags/edit/:id          # Update tag
POST   /admin/tags/delete/:id        # Delete tag
```

### Plugins
```typescript
GET    /admin/plugins                # All plugins list
POST   /admin/plugins/activate/:id   # Activate plugin
POST   /admin/plugins/deactivate/:id # Deactivate plugin
POST   /admin/plugins/uninstall/:id  # Uninstall plugin
POST   /admin/plugins/config/:id     # Save plugin config
GET    /admin/plugins/available      # Available plugins (marketplace)
```

### Settings
```typescript
GET    /admin/settings               # Settings by category
POST   /admin/settings               # Update settings
```

### Widgets
```typescript
GET    /admin/api/admin/widgets      # Get widgets
POST   /admin/api/admin/widgets      # Create widget
POST   /admin/api/admin/widgets/:id  # Update widget
DELETE /admin/api/admin/widgets/:id  # Delete widget
POST   /admin/api/admin/widgets/reorder          # Reorder widgets
POST   /admin/api/admin/widgets/validate         # Validate widget config
```

---

## 3. ADMIN LAYOUT & COMPONENTS

### AdminLayout Component
**File:** `/home/user/cms/src/admin/components/AdminLayout.tsx`

**Structure:**
- **Sidebar Navigation** (18rem wide)
  - Dashboard link
  - Content menu (Posts, Pages, Categories, Tags, Media)
  - Access Control menu (Users, Roles, Permissions)
  - Appearance menu (Themes, Menus)
  - Plugins menu
  - Settings menu (10+ categories)

- **Header** (with actions)
  - Mobile menu toggle
  - Search bar
  - Theme toggle (light/dark mode)
  - Notifications button with badge
  - Profile dropdown menu

- **Main Content Area**
  - Responsive grid layout
  - Scrollable content region
  - Support for nested pages

**Key Features:**
- Responsive design (mobile-first with Tailwind)
- Dark mode support with localStorage persistence
- Navigation state tracking (active pages highlighted)
- Settings availability indicators
- User profile information and logout

---

## 4. PAGE COMPONENTS (18 Total)

### Dashboard Pages
1. **Dashboard.tsx** - Statistics cards, recent posts table
   - Total posts, users, comments, views stats
   - Recent posts listing

2. **Login.tsx** - Authentication page
   - Email/password form
   - 2FA support
   - Error message display

### Content Management
3. **ContentList.tsx** - Generic content listing
   - Filterable table with status, author, date
   - Delete/edit actions
   - Pagination support

4. **ContentForm.tsx** - Generic content editor
5. **PostFormPage.tsx** - Blog post editor
6. **PageFormPage.tsx** - Static page editor
   - Built-in CKEditor integration
   - SEO fields (meta description, OG tags, schema)
   - Category/tag selectors
   - Revision history

### Taxonomies
7. **Categories.tsx** - Category management
   - Create, edit, delete categories
   - Hierarchical organization support

8. **Tags.tsx** - Tag management
   - Simple tag CRUD

### Access Control
9. **UsersImproved.tsx** - User management
   - User list with status badges
   - Role assignment
   - 2FA status indicator
   - Inline editing

10. **RolesPageImproved.tsx** - Role management
    - Create/edit/delete roles
    - Permission assignment per role
    - System roles indicator

11. **PermissionsPageImproved.tsx** - Permission management
    - Permission CRUD
    - Module-based organization

### Appearance & Customization
12. **ThemesPage.tsx** - Theme management
    - Active/available themes
    - Custom settings per theme
    - Screenshots/preview

13. **AppearanceMenusPage.tsx** - Menu editor
    - Drag-and-drop reordering
    - Custom menu items
    - Content/category/tag references
    - Nested menus support

### Media
14. **MediaLibraryPage.tsx** - Media management
    - Image upload/drag-drop
    - File browsing and organization
    - Image editor integration

### Plugins
15. **PluginsInstalledPage.tsx** - Active plugins
    - Activate/deactivate/uninstall
    - Plugin configuration UI

16. **PluginsAvailablePage.tsx** - Plugin installation
    - Browse available plugins
    - One-click install

17. **PluginsMarketplacePage.tsx** - Plugin marketplace
    - Featured plugins
    - Plugin discovery

### System
18. **Settings.tsx** - Site configuration
    - Categories: General, Reading, Writing, Discussion, Media, Permalinks, Privacy, SEO, CAPTCHA, Advanced
    - Dynamic field rendering
    - Availability indicators

---

## 5. CSS/STYLING APPROACH

### File Location
`/home/user/cms/src/admin/assets/css/admin.css` (364 lines)

### Technology Stack
- **Framework:** Tailwind CSS v3.4
- **Approach:** Utility-first CSS with Tailwind `@layer components`
- **Dark Mode:** Built-in with `dark:` prefix support
- **Color Scheme:** Purple accent (#7c3aed), gray grayscale, danger reds/greens

### CSS Component Classes
```css
/* Layout */
.admin-layout              /* Main flex container */
.admin-sidebar             /* Left navigation */
.admin-main                /* Content wrapper */
.admin-header              /* Top bar */
.admin-content             /* Scrollable content area */
.admin-container           /* Content grid wrapper */

/* Navigation */
.admin-nav                 /* Nav container */
.admin-nav-item            /* Nav links */
.admin-nav-item.active     /* Active state with purple accent */
.admin-nav-icon            /* Icon styling */
.admin-nav-group           /* Nav grouping */
.admin-nav-subitem         /* Sub-menu items */

/* Cards & Widgets */
.stats-card                /* Dashboard stat cards */
.stats-icon-container      /* Icon background (orange/green/blue/teal variants) */
.table-card                /* Table wrapper */
.admin-table               /* Table styles */

/* Forms */
.form-card                 /* Form wrapper */
.form-label                /* Form labels */
.form-input                /* Text inputs */
.form-select               /* Select dropdowns */
.form-textarea             /* Textareas */
.form-checkbox             /* Checkboxes */
.form-radio                /* Radio buttons */

/* Status Badges */
.badge-success             /* Green badges */
.badge-warning             /* Orange badges */
.badge-danger              /* Red badges */
.badge-neutral             /* Gray badges */

/* Buttons */
.btn-action                /* Primary purple button */
.btn-secondary             /* Secondary white/gray button */
.btn-action-outline        /* Outlined purple button */
.btn-icon                  /* Icon-only button */

/* Pagination */
.admin-pagination          /* Pagination wrapper */
.pagination-btn            /* Pagination buttons */
.pagination-number.active  /* Active page indicator */

/* Modals */
.modal-backdrop             /* Overlay */
.modal-container            /* Modal box */
.modal-header               /* Modal title area */
.modal-footer               /* Modal action buttons */

/* Responsive Design */
- Desktop sidebar always visible (md:block)
- Mobile sidebar collapsible
- Grid layout: 2 columns (md), 4 columns (xl) for stats
- Responsive tables with horizontal scroll on mobile
```

### Inline Styling
The AdminLayout component uses extensive inline `<style>` tags for:
- Advanced sidebar gradient backgrounds
- Dark mode specific colors
- Scrollbar styling (webkit)
- Complex navigation hover and active states
- Material Design Icons integration

---

## 6. NOTIFICATION SYSTEM

### Current Implementation
**Status:** Basic `alert()` implementation (not ideal)

**Location:** Client-side in individual page components
- `UsersImproved.tsx`: 6 alert() calls
- `ContentList.tsx`: 2 alert() calls
- `Categories.tsx`: 2 alert() calls
- `Tags.tsx`: 2 alert() calls
- `PluginsInstalledPage.tsx`: 8 alert() calls
- `PluginsAvailablePage.tsx`: 1 alert() call
- `RolesPageImproved.tsx`: 1 alert() call
- `AppearanceMenusPage.tsx`: 3 alert() calls
- `PermissionsPageImproved.tsx`: 1 alert() call

### Backend Notification System
**File:** `/home/user/cms/src/routes/notifications.ts` (238 lines)

**Available Endpoints:**
```typescript
GET    /api/notifications                    # Get user notifications
GET    /api/notifications/unread-count       # Unread count
GET    /api/notifications/stats              # Notification stats
PATCH  /api/notifications/:id/read           # Mark as read
POST   /api/notifications/read-all           # Mark all as read
DELETE /api/notifications/:id                # Delete notification
DELETE /api/notifications                   # Delete all
GET    /api/notifications/preferences        # Get preferences
PATCH  /api/notifications/preferences        # Update preferences
```

**Database Tables:**
- `notifications` - Notification records
- `notificationPreferences` - User notification settings

**Service:** `notificationService` from `../lib/email/index.ts`

### Gaps
- No toast/modal notifications in admin UI
- No real-time notification push
- Notification button in header is placeholder
- No notification panel/dropdown UI

---

## 7. DASHBOARD COMPONENTS & LAYOUT

### Dashboard Layout (`Dashboard.tsx`)
```
┌────────────────────────────────────────────────────────┐
│ Dashboard                                              │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ ┌────────┐ │
│  │ Posts    │  │ Users    │  │Comments  │ │ Views  │ │
│  │   123    │  │    45    │  │   89     │ │ 12,456 │ │
│  └──────────┘  └──────────┘  └──────────┘ └────────┘ │
│                                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Recent Posts                                     │ │
│  ├──────────────────────────────────────────────────┤ │
│  │ Title | Author | Status | Created | Actions     │ │
│  ├──────────────────────────────────────────────────┤ │
│  │ Post 1 | Admin | Draft | 2025-11-08| Edit Delete│ │
│  │ Post 2 | Admin | Draft | 2025-11-07| Edit Delete│ │
│  └──────────────────────────────────────────────────┘ │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### Stats Card Structure
- Icon container (colored background)
- Label (gray text)
- Value (large number)
- Color variants: orange, green, blue, teal

### Page Header Pattern
```html
<div class="page-header">
  <h1 class="page-title">Page Title</h1>
  <div class="page-actions">
    <!-- Primary CTA button -->
  </div>
</div>
```

---

## 8. AUTHENTICATION & AUTHORIZATION

### Auth Flow
1. User submits email/password at `/admin/login`
2. `adminAuth` middleware verifies JWT token
3. Token stored in HTTP-only cookie `auth_token`
4. 2FA optional verification at `/admin/login/verify-2fa`
5. Session expires redirect to login

### Middleware
**File:** `/home/user/cms/src/routes/admin.ts` (lines 152-185)

```typescript
async function adminAuth(c: Context, next: Next) {
  // Skip auth for /assets/
  // Get token from cookie
  // Verify JWT token
  // Check user still exists in DB
  // Set user context for downstream routes
}
```

### Permission System
- Role-based access control (RBAC)
- Fine-grained permissions per module
- Permission checking: `userPermissions.includes(permission)`

---

## 9. DATA LAYER & DATABASE INTEGRATION

### ORM: Drizzle ORM
**File:** `/home/user/cms/src/db/schema.ts`

### Core Tables Used in Admin
```
roles                    # User roles
permissions              # Granular permissions
rolePermissions          # Role-permission mapping
users                    # Admin users
user2FA                  # 2FA configuration
contentTypes             # Content type definitions
categories               # Post/content categories
tags                     # Content tags
content                  # Posts and pages
contentCategories        # Content-category junction
contentTags              # Content-tag junction
contentSeo               # SEO metadata per content
contentMeta              # Custom metadata
comments                 # Post comments
contentFilters           # Content filtering
media                    # Uploaded files/images
mediaSizes               # Image variant sizes
mediaSeo                 # Media SEO data
menus                    # Navigation menus
menuItems                # Menu items with hierarchy
widgets                  # Dashboard/page widgets
widgetAreas              # Widget placement areas
settings                 # Site-wide settings (key-value)
contentRevisions         # Content version history
plugins                  # Installed plugins
pluginHooks              # Plugin hook registrations
notifications            # User notifications
notificationPreferences  # Notification settings per user
auditLogs                # Activity logging
```

### Service Layer Examples
- `contentService` - Content CRUD operations
- `themeService` - Theme management
- `menuService` - Menu operations
- `menuItemService` - Menu item hierarchy
- `mediaService` - Media uploads/management
- `roleService` - Role operations
- `permissionService` - Permission operations
- `userService` - User management
- `pluginService` - Plugin lifecycle

---

## 10. KEY FEATURES & CAPABILITIES

### Content Management
- Multi-type content support (Posts, Pages, Custom types)
- SEO optimization (meta tags, OG, Twitter, schema.json)
- Categories and tags
- Rich text editing (CKEditor)
- Content revisions/history
- Custom metadata
- Draft/published status workflow

### Media Management
- File upload support
- Image optimization (multiple sizes/variants)
- Media library browsing
- Image editor integration
- SEO for media files

### User & Access Management
- User creation/modification/deletion
- Role-based permissions
- 2FA authentication
- Activity audit logs
- Permission fine-tuning per role

### Theme Management
- Theme activation/switching
- Custom theme settings
- Live preview/customizer
- Config export/import
- Cache management (stats, warmup, clear)
- Draft customizations

### Plugin System
- Plugin installation/activation/deactivation/uninstall
- Plugin configuration UI
- Plugin marketplace
- Hook system for extensibility
- Plugin-specific routes and controllers

### Site Configuration
- 10+ settings categories
- Dynamic field types (text, textarea, select, boolean, etc.)
- Custom settings per theme
- Image/file upload settings

### Menu System
- Drag-and-drop reordering
- Nested menu support
- Link types: custom URL, content, category, tag
- Visual menu builder

---

## 11. COMPONENT COMMUNICATION

### Pattern: Server-Rendered with Client-Side Enhancements

1. **Page Render** - Server (Hono) renders HTML via TSX components
2. **Data Fetch** - Client-side JavaScript makes API calls
3. **State Management** - localStorage for theme preference
4. **Form Submission** - HTML forms POST to `/admin/*` endpoints
5. **Redirects** - Server redirects on success, re-renders on error

### Inline JavaScript in Components
Examples:
```typescript
// Theme toggle
function toggleTheme() { ... }

// Profile dropdown
function toggleProfileMenu() { ... }

// Mobile menu
function toggleMobileMenu() { ... }

// Search filtering
function filterContent() { ... }

// Form submission handling
```

---

## 12. BUILD & ASSET COMPILATION

### Admin CSS
- **Source:** `/home/user/cms/src/admin/assets/css/admin.css`
- **Compiled:** `/public/admin/assets/css/admin-compiled.css`
- **Build Script:** `/home/user/cms/scripts/build-admin-css.ts`

### CKEditor
- **Bundle:** `/home/user/cms/src/admin/assets/js/ckeditor-bundle.js`
- **Entry:** `/home/user/cms/src/admin/assets/js/ckeditor-entry.ts`
- **Init:** `/home/user/cms/src/admin/assets/js/ckeditor-init.js`

### Media Library JS
- **File:** `/home/user/cms/src/admin/assets/js/media-library.js`

---

## 13. CURRENT LIMITATIONS & GAPS

### Notification System
- [ ] Toast/modal notifications not implemented
- [ ] Placeholder notification button with no functionality
- [ ] No real-time updates
- [ ] Basic browser alerts for error handling

### Mobile Experience
- [ ] Mobile menu toggle shows alert placeholder
- [ ] Limited mobile responsiveness testing
- [ ] No touch-optimized drag-and-drop

### UI/UX
- [ ] No loading states/skeleton screens
- [ ] No form validation feedback
- [ ] No progress indicators for long operations
- [ ] No keyboard navigation optimizations
- [ ] Limited ARIA/accessibility attributes

### Performance
- [ ] No pagination limits on large datasets
- [ ] No image lazy-loading in tables
- [ ] No request debouncing on filters
- [ ] Admin CSS not minified in development view

### Editor Integration
- [ ] Media picker integration incomplete
- [ ] Limited media sorting/filtering in editor
- [ ] No draft auto-save

---

## 14. RECOMMENDED NEXT STEPS

1. **Implement Toast Notification System**
   - Replace browser alerts with styled toasts
   - Add success/error/warning/info variants
   - Implement auto-dismiss with manual close

2. **Add Loading States**
   - Button loading spinners
   - Table skeleton loaders
   - Form submission states

3. **Enhance Form Validation**
   - Client-side validation
   - Async field validation
   - Error message display

4. **Improve Mobile Experience**
   - Implement mobile menu toggle
   - Touch-friendly components
   - Responsive table redesign

5. **Add Real-time Features**
   - WebSocket notification updates
   - Collaborative editing indicators
   - Live activity feeds

6. **Accessibility Improvements**
   - ARIA labels and roles
   - Keyboard navigation
   - Focus management
   - Screen reader testing

---

