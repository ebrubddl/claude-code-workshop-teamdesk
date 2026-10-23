# Task priority

Status: draft · Target: ~20 minutes to build

## Goal

Let users give each task a priority (Low, Medium, High) and filter the tasks page by priority.

## Decisions (from interview)

- **Set priority:** in the "New task" form and later from a dropdown on each task row (same pattern as the Assignee select).
- **Default:** `medium`. Every task always has a priority; existing rows migrate to `medium`.
- **Filter:** multi-select chips (Low / Medium / High) on the tasks page. No chips selected = show all. Filtering is client-side on the already-loaded list; no change to `tasks.list`.
- **Display:** a small badge next to the task title. List order is unchanged.

## Assumptions (not discussed; flag if wrong)

- Any member may change priority on any task, matching `assign` (`requireMember` only).
- Priority can be changed on completed tasks' rows? No: the row dropdown is disabled for completed tasks, like Assignee.
- Filter state is local component state; it resets on reload.

## Changes

1. **DB** (`packages/db`)
   - `src/schema.ts`: add `priority` text column to `tasks`, `NOT NULL DEFAULT 'medium'`.
   - New migration `migrations/0002_*.sql` (generate via drizzle-kit) adding the column.
   - `src/shared.ts`: export `TASK_PRIORITIES = ["low","medium","high"] as const`, `TaskPriority` type; add `priority: TaskPriority` to `Task`.
   - `src/tasks.ts`: persist `priority` in `insertTask`; add `setTaskPriority(db, taskId, priority)` returning the updated task or undefined.
2. **Service** (`packages/services/src/tasks.ts`)
   - `createTaskInput`: add `priority: z.enum(TASK_PRIORITIES).default("medium")`.
   - New `setPriority(actorId, taskId, priority)`: `requireMember`, then `setTaskPriority`; `NotFoundError` if missing.
3. **tRPC** (`apps/web/src/server/trpc/routers/tasks.ts`)
   - New `setPriority` mutation: `{ actorId, taskId, priority }`.
4. **UI**
   - `routes/tasks.tsx`: Priority select in the new-task form (default Medium); `handleSetPriority`; chip filter state and `visibleTasks` passed to `TaskList`.
   - `components/task-list.tsx`: priority badge, priority `NativeSelect` (label `Priority for <title>`, disabled when `disabled` or task completed), new `onSetPriority` prop.
   - Filter chips: three toggle buttons (`aria-pressed`) above the list. Empty-filter result shows "No tasks match the selected priorities."

## Out of scope

Sorting by priority, server-side filtering, persisting filter state, a "no priority" value, priority-based notifications.

## Acceptance criteria

- Creating a task without choosing a priority yields `medium`.
- Creating with High shows a High badge on the row.
- Changing a row's dropdown updates the badge and persists after reload.
- Selecting the High chip shows only High tasks; adding Low shows High + Low; deselecting all shows everything.
- Existing tasks appear as Medium after migration.
- Invalid priority values are rejected by the API.

## Tests

- `packages/db/src/tasks.test.ts`: insert default/explicit priority; `setTaskPriority`.
- `packages/services/src/tasks.test.ts`: create default, `setPriority` happy path, unknown task -> `NotFoundError`, unknown actor rejected.
