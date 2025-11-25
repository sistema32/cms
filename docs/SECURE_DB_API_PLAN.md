# Secure Plugin DB API Implementation Plan

## Goal
Implement a secure, scoped, and type-safe Database Access Layer (DAL) for plugins to replace raw SQL queries. This resolves cross-driver compatibility issues (like `RETURNING id`) and prevents SQL injection and cross-plugin data access.

## Architecture
*   **`PluginDB` Class**: A wrapper around the core database connection.
*   **Scoping**: Automatically prefixes table names with the plugin ID (e.g., `lexslider_sliders`).
*   **Fluent API**: `api.db.collection('sliders').create(...)`, `.find(...)`, `.update(...)`, `.delete(...)`.
*   **Driver Abstraction**: Handles driver-specific SQL generation (SQLite vs Postgres vs MySQL).

## Steps

### 1. Core Implementation
- [ ] Create `src/lib/plugin-system/PluginDB.ts`
    - Implement `PluginDB` class.
    - Implement `Collection` class with CRUD methods (`create`, `find`, `findOne`, `update`, `delete`).
    - Implement `query` method for raw SQL (still scoped/validated if needed, but discouraged).
- [ ] Integrate into `PluginAPI.ts`
    - Initialize `PluginDB` in `PluginAPI` constructor.
    - Expose `api.db` property.

### 2. LexSlider Refactor
- [ ] Refactor `plugins/lexslider/api/sliders.ts`
    - Replace `api.query` with `api.db.collection('sliders')` methods.
    - Remove manual `RETURNING id` logic (handled by `PluginDB`).
- [ ] Refactor `plugins/lexslider/api/slides.ts`
    - Replace `api.query` with `api.db.collection('slides')` methods.

### 3. Verification
- [ ] Verify `createSlider` returns correct ID.
- [ ] Verify `duplicateSlider` works.
- [ ] Verify `createSlide` works.
- [ ] Verify list and update operations.

## API Reference (Draft)

```typescript
interface PluginDB {
  collection(name: string): Collection;
}

interface Collection {
  find(query?: Record<string, any>, options?: FindOptions): Promise<any[]>;
  findOne(query: Record<string, any>): Promise<any>;
  create(data: Record<string, any>): Promise<any>; // Returns created object with ID
  update(id: string | number, data: Record<string, any>): Promise<any>;
  delete(id: string | number): Promise<void>;
}
```
