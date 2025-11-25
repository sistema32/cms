# LexCMS Hook System & WordPress Compatibility

This document details the hook system in LexCMS, its current state, and the roadmap for WordPress compatibility.

## 1. Native Hooks (Current)

LexCMS uses a `HookManager` that supports both **Actions** (events) and **Filters** (data modification).

### 🔧 Filters (Modify Data)
Filters take a value, pass it through registered callbacks, and return the modified value.

| Filter Name | Arguments | Returns | Description |
|-------------|-----------|---------|-------------|
| `media:getUrl` | `url` (string), `mediaData` (object) | `string` | Modifies the URL of a media item (e.g., for CDNs). |

### ⚡ Actions (Events)
Actions allow plugins to execute code at specific points without returning a value.

| Action Name | Arguments | Description |
|-------------|-----------|-------------|
| `media:afterUpload` | `newMedia` (object) | Triggered after a file is successfully uploaded. |
| `media:beforeDelete` | `media` (object) | Triggered before a file is deleted. |

---

## 2. Planned Hooks (WordPress Compatibility)

To support the **LexSlider** plugin and others, we are implementing the following hooks.

### 🎨 Frontend Filters (Content Injection)
Unlike WordPress which uses Actions (`wp_head`) with output buffering, LexCMS uses **Filters** to build HTML strings for injection.

| LexCMS Filter | WP Equivalent | Arguments | Returns | Description |
|---------------|---------------|-----------|---------|-------------|
| `theme:head` | `wp_head` (Action) | `html` (string) | `string` | Injects styles/scripts into `<head>`. Plugins should append to the string. |
| `theme:footer` | `wp_footer` (Action) | `html` (string) | `string` | Injects scripts/content before `</body>`. |
| `content:render` | `the_content` | `content` (string) | `string` | Filters post content (processes shortcodes). |
| `theme:bodyClass`| `body_class` | `classes` (string) | `string` | Modifies the CSS classes on the `<body>` tag. |
| `content:title` | `the_title` | `title` (string) | `string` | Filters the post title. |
| `content:excerpt`| `the_excerpt` | `excerpt` (string)| `string` | Filters the post excerpt. |

### ⚙️ System Actions (Lifecycle)
| LexCMS Action | WP Equivalent | Arguments | Description |
|---------------|---------------|-----------|-------------|
| `system:init` | `init` | `void` | CMS initialization complete. Register custom types here. |
| `system:ready` | `wp_loaded` | `void` | All plugins loaded and system ready. |

### 📝 Content Actions (Lifecycle)
| LexCMS Action | WP Equivalent | Arguments | Description |
|---------------|---------------|-----------|-------------|
| `content:created` | `save_post` | `content` (object) | Triggered after content is created. |
| `content:updated` | `save_post` | `content` (object) | Triggered after content is updated. |
| `content:deleted` | `delete_post` | `id` (number) | Triggered after content is deleted. |

### 👤 User Actions (Auth)
| LexCMS Action | WP Equivalent | Arguments | Description |
|---------------|---------------|-----------|-------------|
| `user:login` | `wp_login` | `user` (object) | Triggered after successful login. |
| `user:register` | `user_register` | `user` (object) | Triggered after new user registration. |

---

## 3. WordPress Compatibility Layer (`WPCompat`)

We are building a compatibility layer to allow easier porting of WordPress plugins.

### Mappings

```typescript
// WordPress Style -> LexCMS Native

// Filters
add_filter('the_content', cb) -> hookManager.addFilter('content:render', cb)
add_filter('body_class', cb)  -> hookManager.addFilter('theme:bodyClass', cb)
add_filter('wp_title', cb)    -> hookManager.addFilter('theme:title', cb)

// Actions
add_action('init', cb)        -> hookManager.addAction('system:init', cb)
add_action('save_post', cb)   -> hookManager.addAction('content:updated', cb)

// Special Cases (WP Actions -> LexCMS Filters)
// Since we don't have output buffering, these become filters that append strings.
add_action('wp_head', cb)     -> hookManager.addFilter('theme:head', (html) => html + cb())
add_action('wp_footer', cb)   -> hookManager.addFilter('theme:footer', (html) => html + cb())

// Helpers
do_shortcode(content)         -> ShortcodeParser.process(content)
```

---

## 4. Missing WordPress Filters (To Implement)

Based on the [WordPress Filter Reference](https://developer.wordpress.org/apis/hooks/filter-reference/), here are key filters we should consider implementing:

### 📄 Content Filters (High Priority)
| WP Filter | LexCMS Equivalent | Priority | Description |
|-----------|-------------------|----------|-------------|
| `get_the_excerpt` | `content:excerpt` | High | Filter post excerpt before display |
| `get_the_archive_title` | `archive:title` | Medium | Filter archive page titles |
| `attachment_fields_to_edit` | `media:editFields` | Medium | Customize media edit form fields |
| `attachment_icon` | `media:icon` | Low | Filter attachment icon HTML |

### 🎨 Template Filters (High Priority for LexSlider)
| WP Filter | LexCMS Equivalent | Priority | Description |
|-----------|-------------------|----------|-------------|
| `template_include` | `theme:template` | **Critical** | Override template file to use |
| `404_template` | `theme:404Template` | Medium | Custom 404 template |
| `single_template` | `theme:singleTemplate` | Medium | Custom single post template |
| `page_template` | `theme:pageTemplate` | Medium | Custom page template |
| `archive_template` | `theme:archiveTemplate` | Low | Custom archive template |

### 🖼️ Media Filters (Medium Priority)
| WP Filter | LexCMS Equivalent | Priority | Description |
|-----------|-------------------|----------|-------------|
| `image_downsize` | `media:downsize` | High | Custom image size generation |
| `intermediate_image_sizes` | `media:imageSizes` | High | Register custom image sizes |
| `wp_get_attachment_image_attributes` | `media:imageAttributes` | Medium | Filter image tag attributes |
| `upload_mimes` | `media:allowedMimes` | Medium | Filter allowed upload MIME types |
| `upload_dir` | `media:uploadDir` | Low | Customize upload directory |

### 📝 Text Processing Filters (Low Priority)
| WP Filter | LexCMS Equivalent | Priority | Description |
|-----------|-------------------|----------|-------------|
| `attribute_escape` | `text:escapeAttr` | Low | Escape HTML attributes |
| `sanitize_key` | `text:sanitizeKey` | Low | Sanitize keys for settings |

### 🔗 Navigation Filters (Medium Priority)
| WP Filter | LexCMS Equivalent | Priority | Description |
|-----------|-------------------|----------|-------------|
| `wp_nav_menu_args` | `nav:menuArgs` | Medium | Filter menu arguments |
| `wp_nav_menu_items` | `nav:menuItems` | Medium | Filter menu HTML output |

### 🎯 Recommended Implementation Order
1. **Phase 1 (Critical for LexSlider)**: `template_include`, `image_downsize`, `intermediate_image_sizes`
2. **Phase 2 (Content Enhancement)**: `get_the_excerpt`, `content:excerpt`, `media:imageAttributes`
3. **Phase 3 (Navigation)**: `wp_nav_menu_args`, `wp_nav_menu_items`
4. **Phase 4 (Polish)**: Text processing and sanitization filters

---

## 5. WordPress Actions Reference

Based on the [WordPress Action Reference](https://developer.wordpress.org/apis/hooks/action-reference/), here are the key actions and their LexCMS equivalents.

### ⚙️ System Lifecycle Actions (Already Implemented)
| LexCMS Action | WP Equivalent | Status | Description |
|---------------|---------------|--------|-------------|
| `system:init` | `init` | ✅ Implemented | CMS initialization complete |
| `system:ready` | `wp_loaded` | 🔄 Mapped | All plugins loaded |
| `plugins:loaded` | `plugins_loaded` | 🔄 Mapped | After plugins are loaded |

### 📝 Content Lifecycle Actions
| LexCMS Action | WP Equivalent | Status | Description |
|---------------|---------------|--------|-------------|
| `content:created` | `save_post` (new) | ✅ Implemented | After content is created |
| `content:updated` | `save_post`, `edit_post` | ✅ Implemented | After content is updated |
| `content:deleted` | `deleted_post` | ✅ Implemented | After content is deleted |
| `content:beforeDelete` | `before_delete_post` | ✅ Implemented | Before content deletion |
| `content:trashed` | `trashed_post` | ✅ Mapped | After content is trashed |
| `content:untrashed` | `untrashed_post` | ✅ Mapped | After content is restored |

### 👤 User Actions
| LexCMS Action | WP Equivalent | Status | Description |
|---------------|---------------|--------|-------------|
| `user:login` | `wp_login` | ✅ Implemented | After successful login |
| `user:register` | `user_register` | ✅ Implemented | After user registration |
| `user:updated` | `profile_update` | ✅ Mapped | After user profile update |
| `user:deleted` | `delete_user` | ✅ Mapped | After user deletion |

### 🎨 Template Actions
| LexCMS Action | WP Equivalent | Status | Description |
|---------------|---------------|--------|-------------|
| `theme:setup` | `after_setup_theme` | ✅ Mapped | Theme initialization |
| `theme:switched` | `after_switch_theme` | ✅ Mapped | After theme change |
| `template:redirect` | `template_redirect` | ✅ Mapped | Before template determination |
| `template:getHeader` | `get_header` | ✅ Mapped | Before header.php loads |
| `template:getFooter` | `get_footer` | ✅ Mapped | Before footer.php loads |
| `template:getSidebar` | `get_sidebar` | ✅ Mapped | Before sidebar.php loads |

### 🖼️ Media Actions
| LexCMS Action | WP Equivalent | Status | Description |
|---------------|---------------|--------|-------------|
| `media:afterUpload` | `add_attachment` | ✅ Implemented | After file upload |
| `media:beforeDelete` | `delete_attachment` | ✅ Implemented | Before file deletion |
| `media:updated` | `edit_attachment` | ✅ Mapped | After attachment update |

### 🔧 Admin Actions
| LexCMS Action | WP Equivalent | Status | Description |
|---------------|---------------|--------|-------------|
| `admin:init` | `admin_init` | ✅ Implemented | Admin panel initialization |
| `admin:head` | `admin_head` | ✅ Mapped | Admin HTML head |
| `admin:footer` | `admin_footer` | ✅ Mapped | Admin HTML footer |
| `admin:enqueueScripts` | `admin_enqueue_scripts` | ✅ Mapped | Enqueue admin assets |

> **Note**: Admin hooks are now implemented. `admin:init` triggers on every authenticated admin request. `admin:head` and `admin:footer` are filters that can be used via the `getAdminHeadContent()` and `getAdminFooterContent()` helpers in `src/lib/admin/hooks.ts`.

### 📊 Implementation Summary

#### ✅ Fully Implemented (Code + Tests)
- All system lifecycle actions (`system:init`, `system:ready`, `plugins:loaded`)
- All content lifecycle actions (`content:created/updated/deleted/beforeDelete`)
- All user actions (`user:login/register`)
- All media actions (`media:afterUpload/beforeDelete`)

#### ✅ Mapped in WPCompat (Ready to Use)
- All template actions (`theme:setup`, `template:redirect`, `template:getHeader/Footer/Sidebar`)
- Extended content actions (`content:trashed/untrashed`)
- Extended user actions (`user:updated/deleted`)
- Extended media actions (`media:updated`)

#### ⏸️ Deferred (Not Needed for Current Use Cases)
- Admin panel actions (only needed if building admin panel plugins)

### ✅ Already Implemented
The following critical actions are already implemented:
- ✅ `system:init` (in `src/main.ts`)
- ✅ `content:created/updated/deleted/beforeDelete` (in `src/controllers/contentController.ts`)
- ✅ `user:login/register` (in `src/controllers/authController.ts`)
- ✅ `media:afterUpload/beforeDelete` (in `src/services/mediaService.ts`)
- ✅ **40+ WordPress hooks mapped** in `WPCompat.ts`
