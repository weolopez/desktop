# Research: IndexedDB Storage Migration for WE-OS

**Date**: 2025-09-28  
**Feature**: 001-move-from-using  

## Research Tasks & Findings

### Task 1: IndexedDB Best Practices for Web Desktop Storage
- **Decision**: Implement IndexedDB with separate object stores for preferences (persistent key-value), sessions (temporary recoverable), and extended data (large files/configs). Use indexedDB.open() with versioned upgrades for schema changes. All operations async with promises.
- **Rationale**: IndexedDB provides structured, high-capacity storage (up to 50% of disk space), supports transactions for atomicity, and integrates well with web apps for offline persistence. Aligns with vanilla JS constitution.
- **Alternatives Considered**: 
  - localStorage: Limited to ~5MB, synchronous, string-only.
  - sessionStorage: Session-only, no cross-tab sync.
  - In-memory (Map): No persistence.

Key Best Practices:
- Use a single database 'WEOS_DESKTOP' with version 1.
- Object stores: 'preferences' (keyPath: 'key'), 'sessions' (autoIncrement), 'extended' (keyPath: 'id').
- Handle upgrade needed for schema evolution.
- Use IDBRequest.onerror for error handling.
- Browser quota: Request persistent storage via navigator.storage.persist() if available.

### Task 2: Patterns for localStorage to IndexedDB Migration in Vanilla JS
- **Decision**: Direct replacement: Replace localStorage.setItem/getItem with IndexedDB equivalents. No migration needed per spec update. Wrap in a StorageService class with promise-based API.
- **Rationale**: Simplifies implementation; existing data loss acceptable as per clarified spec. Patterns from MDN and web.dev emphasize async wrappers for compatibility.
- **Alternatives Considered**:
  - Bulk migration: Scan localStorage keys and import on first IndexedDB open (rejected per feedback).
  - Hybrid: Dual read/write with gradual migration (overkill for this scope).

Migration Patterns (if future need):
- On DB open, iterate localStorage, store in IndexedDB, then clear localStorage.
- But per spec: No migration, start fresh with IndexedDB.

### Resolved Unknowns
- No remaining NEEDS CLARIFICATION from spec.
- Dependencies: Pure IndexedDB, no polyfills (constitution compliant).
- Integration: StorageService exposes event-based API for components (e.g., 'storage:updated', 'storage:error').

### Risks & Mitigations
- Browser support: 95%+ modern browsers; fallback notification as clarified.
- Quota errors: User notification and pause as specified.
- Concurrency: Transactions ensure atomicity.

All research complete; proceed to Phase 1 design.