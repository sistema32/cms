# Detailed Fix Guide - Step by Step

## Part 1: Delete Unused Dead Code Files (Priority 1)

### Step 1.1: Delete PermissionsPage.tsx
```bash
rm /home/user/cms/src/admin/pages/PermissionsPage.tsx
```
- **File Size:** 217 lines
- **Reason:** Completely replaced by PermissionsPageImproved.tsx which is 107 lines longer with more features

### Step 1.2: Delete RolesPage.tsx
```bash
rm /home/user/cms/src/admin/pages/RolesPage.tsx
```
- **File Size:** 356 lines
- **Reason:** Completely replaced by RolesPageImproved.tsx which is 233 lines longer with more features

### Step 1.3: Delete Users.tsx
```bash
rm /home/user/cms/src/admin/pages/Users.tsx
```
- **File Size:** 216 lines
- **Reason:** Completely replaced by UsersImproved.tsx which is 378 lines longer with more features

---

## Part 2: Remove Unused Imports from admin.ts (Priority 2)

### File: `/home/user/cms/src/routes/admin.ts`

**Remove these three lines:**
```typescript
// Line 13 - DELETE
import { UsersPage } from "../admin/pages/Users.tsx";

// Line 15 - DELETE
import { RolesPage } from "../admin/pages/RolesPage.tsx";

// Line 17 - DELETE
import { PermissionsPage } from "../admin/pages/PermissionsPage.tsx";
```

**Keep these (already in file):**
```typescript
// Line 14 - KEEP
import { UsersPageImproved } from "../admin/pages/UsersImproved.tsx";

// Line 16 - KEEP
import { RolesPageImproved } from "../admin/pages/RolesPageImproved.tsx";

// Line 18 - KEEP
import { PermissionsPageImproved } from "../admin/pages/PermissionsPageImproved.tsx";
```

---

## Part 3: Fix Broken Middleware Imports (Priority 3 - CRITICAL)

### Fix 3.1: `/home/user/cms/src/routes/audit.ts`

**Lines to fix:** 7-8

**Current (BROKEN):**
```typescript
7:  import { authMiddleware } from "../middlewares/auth.ts";
8:  import { requirePermission } from "../middlewares/permissions.ts";
```

**Fixed:**
```typescript
7:  import { authMiddleware } from "../middleware/auth.ts";
8:  import { requirePermission } from "../middleware/permission.ts";
```

---

### Fix 3.2: `/home/user/cms/src/routes/webhooks.ts`

**Lines to fix:** 7-8

**Current (BROKEN):**
```typescript
7:  import { authMiddleware } from "../middlewares/auth.ts";
8:  import { requirePermission } from "../middlewares/permissions.ts";
```

**Fixed:**
```typescript
7:  import { authMiddleware } from "../middleware/auth.ts";
8:  import { requirePermission } from "../middleware/permission.ts";
```

---

### Fix 3.3: `/home/user/cms/src/routes/cache.ts`

**Lines to fix:** 7-8

**Current (BROKEN):**
```typescript
7:  import { authMiddleware } from "../middlewares/auth.ts";
8:  import { requirePermission } from "../middlewares/permissions.ts";
```

**Fixed:**
```typescript
7:  import { authMiddleware } from "../middleware/auth.ts";
8:  import { requirePermission } from "../middleware/permission.ts";
```

---

### Fix 3.4: `/home/user/cms/src/routes/backups.ts`

**Line to fix:** 8

**Current (BROKEN):**
```typescript
8:  import { authMiddleware, requirePermission } from "../middlewares/authMiddleware.ts";
```

**Fixed (split into two imports):**
```typescript
8:  import { authMiddleware } from "../middleware/auth.ts";
9:  import { requirePermission } from "../middleware/permission.ts";
```

---

### Fix 3.5: `/home/user/cms/src/routes/api-keys.ts`

**Line to fix:** 9

**Current (BROKEN):**
```typescript
9:  import { authMiddleware } from "../middlewares/authMiddleware.ts";
```

**Fixed:**
```typescript
9:  import { authMiddleware } from "../middleware/auth.ts";
```

---

### Fix 3.6: `/home/user/cms/src/routes/dashboard.ts`

**Line to fix:** 7

**Current (BROKEN):**
```typescript
7:  import { authMiddleware } from "../middlewares/authMiddleware.ts";
```

**Fixed:**
```typescript
7:  import { authMiddleware } from "../middleware/auth.ts";
```

---

### Fix 3.7: `/home/user/cms/src/routes/search.ts`

**Line to fix:** 7

**Current (BROKEN):**
```typescript
7:  import { authMiddleware } from "../middlewares/authMiddleware.ts";
```

**Fixed:**
```typescript
7:  import { authMiddleware } from "../middleware/auth.ts";
```

---

### Fix 3.8: `/home/user/cms/src/routes/jobs.ts`

**Line to fix:** 7

**Current (BROKEN):**
```typescript
7:  import { authMiddleware } from "../middlewares/authMiddleware.ts";
```

**Fixed:**
```typescript
7:  import { authMiddleware } from "../middleware/auth.ts";
```

---

### Fix 3.9: `/home/user/cms/src/routes/seo-advanced.ts`

**Line to fix:** 7

**Current (BROKEN):**
```typescript
7:  import { authMiddleware } from "../middlewares/authMiddleware.ts";
```

**Fixed:**
```typescript
7:  import { authMiddleware } from "../middleware/auth.ts";
```

---

### Fix 3.10: `/home/user/cms/src/routes/notifications.ts`

**Line to fix:** 7

**Current (BROKEN):**
```typescript
7:  import { authMiddleware } from "../middlewares/authMiddleware.ts";
```

**Fixed:**
```typescript
7:  import { authMiddleware } from "../middleware/auth.ts";
```

---

### Fix 3.11: `/home/user/cms/src/routes/security.ts`

**Line to fix:** 7

**Current (BROKEN):**
```typescript
7:  import { authMiddleware } from "../middlewares/authMiddleware.ts";
```

**Fixed:**
```typescript
7:  import { authMiddleware } from "../middleware/auth.ts";
```

---

## Summary of Changes

| Action | Count | Details |
|--------|-------|---------|
| Delete files | 3 | Users.tsx, RolesPage.tsx, PermissionsPage.tsx |
| Remove imports | 3 | From admin.ts |
| Fix imports - singular directory | 11 | Change middlewares/ to middleware/ |
| Fix imports - permission singular | 3 | Change permissions.ts to permission.ts |
| Split imports | 1 | backups.ts needs two separate imports |

**Total changes:** 21 fixes

---

## Verification Checklist

After making all changes, verify:

- [ ] All 3 deleted files are gone
- [ ] admin.ts no longer imports dead code pages
- [ ] All 11 routes have correct middleware imports
- [ ] No references to `/middlewares/auth.ts` remain in routes
- [ ] No references to `/middlewares/permissions.ts` remain in routes
- [ ] All imports point to `/middleware/` (singular) directory
- [ ] Run: `grep -r "from.*middlewares/" /home/user/cms/src/routes --include="*.ts"` returns no results

