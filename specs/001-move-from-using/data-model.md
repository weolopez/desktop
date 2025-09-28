# Data Model: IndexedDB Storage for WE-OS

**Date**: 2025-09-28  
**Feature**: 001-move-from-using  

## Entities & Schema

### WEOS_DESKTOP Database
- **Database Name**: WEOS_DESKTOP
- **Version**: 1
- **Description**: Primary IndexedDB database for desktop state persistence.

#### Object Stores
1. **preferences** (Persistent user settings)
   - **Key Path**: 'key' (string, unique)
   - **Fields**:
     - key: string (e.g., 'wallpaperUrl', 'dockPosition')
     - value: JSON (any serializable data)
     - timestamp: number (ISO timestamp for last update)
   - **Indexes**: None (key-path sufficient)
   - **Validation**: Key length <= 255 chars, value < 1MB per item
   - **Lifecycle**: Created on DB init, persists across sessions

2. **sessions** (Temporary recoverable state)
   - **Key Path**: 'id' (string, e.g., session UUID)
   - **Fields**:
     - id: string (unique session ID)
     - data: JSON (window states, z-index, focus)
     - created: number (session start timestamp)
     - updated: number (last update timestamp)
   - **Indexes**: created (for cleanup if needed)
   - **Validation**: Data < 5MB per session, auto-expire after 7 days if not active
   - **Lifecycle**: Created on session start, updated on changes, deleted on explicit close or timeout

3. **extended** (Large datasets like files/configs)
   - **Key Path**: 'id' (string, unique file/config ID)
   - **Fields**:
     - id: string
     - type: string (e.g., 'virtual-file', 'config')
     - content: ArrayBuffer or JSON (binary/large data)
     - metadata: JSON (size, mimeType, created, modified)
   - **Indexes**: type, created
   - **Validation**: Content < 10MB per item, total store < 50MB
   - **Lifecycle**: Created on demand, persists until deleted

## Relationships
- Preferences → Sessions/Extended: Global settings apply to all (e.g., theme affects session rendering)
- Sessions → Extended: Session may reference extended data (e.g., open files)
- No foreign keys (denormalized for performance); use IDs for linking

## State Transitions
- Write (setItem): Validate → Transaction → Store → Event emit (success/error)
- Read (getItem): Transaction → Retrieve → Deserialize → Return promise
- Delete (removeItem): Transaction → Delete → Event emit
- Error States: Quota exceeded → Notify/pause; Unsupported → Disable features

## Validation Rules
- All values JSON.stringify/parse compatible
- Timestamps in ISO milliseconds
- Unique keys enforced by IndexedDB
- Async error propagation via promises

This model supports the functional requirements for larger, structured storage with atomic transactions.