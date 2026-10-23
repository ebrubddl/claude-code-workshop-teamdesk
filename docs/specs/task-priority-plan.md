# Plan: Task priority (Low / Medium / High)

## Context
Spec: `claude-code-workshop-teamdesk/docs/specs/task-priority.md`. Users need to give each task a priority, see it as a badge, change it per row, and filter the tasks page by priority with multi-select chips (client-side only). Every task always has a priority; default and migrated value is `medium`. Out of scope: sorting, server-side filtering, persisted filters.

The work is split into 3 phases that build bottom-up. Each phase ends green (typecheck + tests), so it can be committed and reviewed on its own.

All paths below are relative to `claude-code-workshop-teamdesk/`.

---

## Phase 1: Data layer (`packages/db`)
**Goal:** the column exists, existing rows read as `medium`, and the DB helpers read and write priority.

1. `src/shared.ts`: add `export const TASK_PRIORITIES = ["low", "medium", "high"] as const;` and `export type TaskPriority = (typeof TASK_PRIORITIES)[number];` next to `TASK_TITLE_MAX_LENGTH`. Add `priority: TaskPriority` to `interface Task` (keep fields alphabetical).
2. `src/schema.ts` (`tasks` table, ~line 79): add `priority: text("priority", { enum: TASK_PRIORITIES }).notNull().default("medium")` (import from `./shared.ts`, or use plain `text` if the import would create a cycle).
3. Migration: run `bun run generate` in `packages/db` (drizzle-kit). This should produce `migrations/0002_*.sql` (`ALTER TABLE tasks ADD priority text DEFAULT 'medium' NOT NULL;`) plus updated `meta/_journal.json` and `0002_snapshot.json`. SQLite fills existing rows with the default, so existing tasks become `medium`. Rename the file to something descriptive (e.g. `0002_task_priority.sql`) only if the journal tag is kept in sync.
4. `src/tasks.ts`:
   - `toTask`: map `priority: row.priority`.
   - `insertTask`: add `priority: TaskPriority` to the input and pass it to `.values(...)`.
   - New `setTaskPriority(db, id, priority): Promise<Task | null>`, a copy of the `setTaskAssignee` pattern. (The spec says "undefined", but the existing helpers return `null`, so this follows them.)
5. Tests in `src/tasks.test.ts`: insert with explicit `high`; `setTaskPriority` updates and returns the task; returns `null` for an unknown id. (The "default medium" case is covered at the service level, because `insertTask` requires the field.)

**Verify:** `bun test` and `bun run typecheck` in `packages/db`.

---

## Phase 2: Service + API (`packages/services`, tRPC router)
**Goal:** the API creates tasks with a priority, updates priority, and rejects invalid values.

1. `packages/services/src/tasks.ts`:
   - `createTaskInput`: add `priority: z.enum(TASK_PRIORITIES).default("medium")`. Because `create` already spreads `data` into `insertTask`, priority is passed through automatically.
   - `TasksService`: add `setPriority: (actorId, taskId, priority: TaskPriority) => Promise<Task>`.
   - Implementation: same shape as `assign`: `await requireMember(db, actorId)`, then `setTaskPriority`, then `throw new NotFoundError("Task", taskId)` if the result is null.
2. `apps/web/src/server/trpc/routers/tasks.ts`: add a `setPriority` mutation with input `z.object({ actorId: z.string(), priority: z.enum(TASK_PRIORITIES), taskId: z.string() })` that calls `ctx.services.tasks.setPriority(...)`. Zod rejects invalid priorities.
3. Tests in `packages/services/src/tasks.test.ts` (use the existing `createTeam` fixture and `TODAY`):
   - create without a priority gives `medium`; create with `high` gives `high`
   - `setPriority` happy path
   - unknown task rejects with `{ code: "NOT_FOUND" }`
   - unknown actor is rejected
   - (optional) `createTaskInput.parse({ title, priority: "urgent" })` throws, which covers "invalid rejected"

**Verify:** `bun run test` and `bun run check` from the repo root.

---

## Phase 3: UI (`apps/web`)
**Goal:** users can set priority on create, see it as a badge, change it per row, and filter with chips.

1. `src/components/task-list.tsx`:
   - New prop `onSetPriority: (taskId: string, priority: TaskPriority) => void`. Add a `handleSetPriority` callback that follows the `handleAssign` pattern and reads `data-task-id`.
   - Badge next to the title using `#/components/ui/badge` (for example `variant` outline/secondary, with High stronger). Wrap the title and badge in a flex row.
   - A second `NativeSelect` with `aria-label={`Priority for ${task.title}`}`, `disabled={disabled || task.completedAt !== null}` and options Low/Medium/High.
   - Add an `emptyMessage` prop, or similar, so the list can show "No tasks match the selected priorities." when a filter is active, instead of the "No tasks yet" text.
2. `src/routes/tasks.tsx`:
   - New-task form: add `<NativeSelect aria-label="Priority" name="priority" defaultValue="medium">` and send `priority` in `handleCreate` (cast to `TaskPriority`).
   - `handleSetPriority`, the same as `handleAssign`, via `updateTask.run(() => getTrpc().tasks.setPriority.mutate(...))`.
   - Filter: `const [priorityFilter, setPriorityFilter] = useState<ReadonlySet<TaskPriority>>(new Set())`. Show three `Button`s (`variant` toggles between default and outline, `aria-pressed`, `size="sm"`) above `TaskList`. Compute `visibleTasks = useMemo(() => filter.size === 0 ? tasks : tasks.filter(t => filter.has(t.priority)), ...)` and pass it to `TaskList`.
   - Labels: add a small `PRIORITY_LABELS: Record<TaskPriority, string>` map, either in the component file or in `shared.ts` if both files need it.
3. Confirm that `useAction` revalidates the loader after a mutation (assign already relies on this). If it does, the badge updates and the change persists after reload with no extra work.

**Verify (end-to-end):** `bun run db:apply` (applies migration 0002 locally), then `bun run dev`, open `/tasks` and check each acceptance criterion:
- a new task with no priority choice shows Medium; a new task with High shows a High badge
- changing a row's dropdown updates the badge and persists after reload; the dropdown is disabled on completed tasks
- the High chip shows only High tasks; High + Low shows both; with no chips selected, everything shows; a filter with no matches shows the empty message
- tasks that existed before the migration show Medium

Finish with `bun run check` and `bun run test`.
