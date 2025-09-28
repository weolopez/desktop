# Tasks: IndexedDB Storage Migration for WE-OS

**Input**: Design documents from `/specs/001-move-from-using/`
**Prerequisites**: plan.md (required), research.md, data-model.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
   → quickstart.md: Extract test scenarios
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB connections, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

## Phase 3.1: Setup
- [ ] T001 Create storage-service.js in src/services/ with basic IndexedDB open function for WEOS_DESKTOP database (version 1)
- [ ] T002 [P] Add browser support check in storage-service.js with notification for unsupported IndexedDB

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [ ] T003 [P] Contract test for setItem success in tests/contract/test-storage-setItem.js (expect promise resolve with {status: 'ok'})
- [ ] T004 [P] Contract test for getItem success in tests/contract/test-storage-getItem.js (expect promise resolve with value)
- [ ] T005 [P] Contract test for removeItem success in tests/contract/test-storage-removeItem.js (expect promise resolve)
- [ ] T006 [P] Integration test for preference persistence across sessions in tests/integration/test-preferences-persistence.html (simulate close/reopen)
- [ ] T007 [P] Integration test for session recovery on refresh in tests/integration/test-session-recovery.html (check window states)
- [ ] T008 [P] Integration test for large data storage in tests/integration/test-large-data.html (store >5MB data, verify retrieval)

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [ ] T009 Implement preferences object store in src/services/storage-service.js (keyPath: 'key', fields: key, value, timestamp)
- [ ] T010 Implement sessions object store in src/services/storage-service.js (keyPath: 'id', fields: id, data, created, updated)
- [ ] T011 Implement extended object store in src/services/storage-service.js (keyPath: 'id', fields: id, type, content, metadata)
- [ ] T012 Implement setItem method in src/services/storage-service.js (async transaction, store based on type)
- [ ] T013 Implement getItem method in src/services/storage-service.js (async read from store)
- [ ] T014 Implement removeItem method in src/services/storage-service.js (async delete from store)
- [ ] T015 Add error handling in src/services/storage-service.js (quota/denial: notify user, pause writes)

## Phase 3.4: Integration
- [ ] T016 Integrate StorageService with desktop-component.js (replace localStorage calls with StorageService methods)
- [ ] T017 Add event emissions for storage events in src/services/storage-service.js (e.g., 'storage:updated', 'storage:error')
- [ ] T018 Handle concurrent writes via transactions in src/services/storage-service.js (atomicity for multi-store ops)

## Phase 3.5: Polish
- [ ] T019 [P] Unit tests for object store creation in tests/unit/test-storage-stores.js
- [ ] T020 Performance test for async operations (<50ms latency) in tests/performance/test-storage-speed.html
- [ ] T021 [P] Update docs/storage.md with IndexedDB usage guide
- [ ] T022 Refactor for code duplication in storage-service.js (e.g., common transaction wrapper)
- [ ] T023 Run quickstart validation: Verify persistence, recovery, large data in browser

## Dependencies
- T001-T002 before T003-T008 (setup before tests)
- T003-T005 before T012-T014 (contracts before methods)
- T009-T011 before T012-T014 (stores before methods)
- T006-T008 before T016 (integration tests before integration)
- T012-T015 before T017-T018 (methods before events/integration)
- All core/integration before polish (T019-T023)

## Parallel Example
```
# Launch T003-T005 together (independent contract tests):
Task: "Contract test for setItem success in tests/contract/test-storage-setItem.js"
Task: "Contract test for getItem success in tests/contract/test-storage-getItem.js"
Task: "Contract test for removeItem success in tests/contract/test-storage-removeItem.js"

# Launch T006-T008 together (independent integration tests):
Task: "Integration test for preference persistence in tests/integration/test-preferences-persistence.html"
Task: "Integration test for session recovery in tests/integration/test-session-recovery.html"
Task: "Integration test for large data storage in tests/integration/test-large-data.html"

# Launch T019 and T021 together (unit tests and docs):
Task: "Unit tests for object store creation in tests/unit/test-storage-stores.js"
Task: "Update docs/storage.md with IndexedDB usage guide"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - No external contracts; generated internal storage method tests [P]

2. **From Data Model**:
   - Each object store → creation task [P]
   - Methods → implementation tasks

3. **From User Stories**:
   - Each story → integration test [P]
   - Quickstart scenarios → validation tasks

4. **Ordering**:
   - Setup → Tests → Stores → Methods → Integration → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests
- [x] All entities have model tasks
- [x] All tests come before implementation
- [x] Parallel tasks truly independent
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task