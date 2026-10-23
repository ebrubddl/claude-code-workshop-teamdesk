import {
  PRIORITY_LABELS,
  TASK_PRIORITIES,
  TASK_TITLE_MAX_LENGTH,
  type TaskPriority,
} from "@repo/db/shared";
import { createFileRoute } from "@tanstack/react-router";
import { ListFilter, ListTodo, Plus, X } from "lucide-react";
import {
  type FormEvent,
  type MouseEvent,
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from "react";
import FormError from "#/components/form-error";
import MemberPicker from "#/components/member-picker";
import PageError from "#/components/page-error";
import TaskList from "#/components/task-list";
import { Button } from "#/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "#/components/ui/empty";
import { Input } from "#/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "#/components/ui/native-select";
import { useActingMember } from "#/hooks/use-acting-member";
import { useAction } from "#/hooks/use-action";
import { getTrpc } from "#/integrations/trpc/client";

export const Route = createFileRoute("/tasks")({
  loader: async () => {
    const trpc = getTrpc();
    const [members, tasks] = await Promise.all([
      trpc.members.list.query(),
      trpc.tasks.list.query(),
    ]);
    return { members, tasks };
  },
  component: TasksPage,
  errorComponent: PageError,
});

function TasksPage() {
  const { members, tasks } = Route.useLoaderData();
  const { actingMember, setActingMemberId } = useActingMember(members);
  const createTask = useAction();
  const updateTask = useAction();
  const actorId = actingMember?.id ?? "";
  const [selectedPriorities, setSelectedPriorities] = useState<
    ReadonlySet<TaskPriority>
  >(new Set());

  const visibleTasks = useMemo(
    () =>
      selectedPriorities.size === 0
        ? tasks
        : tasks.filter((task) => selectedPriorities.has(task.priority)),
    [selectedPriorities, tasks]
  );

  const summary = useMemo(() => {
    const open = tasks.filter((task) => task.completedAt === null);
    const byPriority: Record<TaskPriority, number> = {
      high: 0,
      low: 0,
      medium: 0,
    };
    for (const task of tasks) {
      byPriority[task.priority] += 1;
    }
    return {
      byPriority,
      done: tasks.length - open.length,
      high: open.filter((task) => task.priority === "high").length,
      open: open.length,
    };
  }, [tasks]);

  const handleClearFilter = useCallback(
    () => setSelectedPriorities(new Set()),
    []
  );

  const handleTogglePriority = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      const priority = event.currentTarget.value as TaskPriority;
      setSelectedPriorities((current) => {
        const next = new Set(current);
        if (!next.delete(priority)) {
          next.add(priority);
        }
        return next;
      });
    },
    []
  );

  const handleCreate = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      const ok = await createTask.run(() =>
        getTrpc().tasks.create.mutate({
          actorId,
          task: {
            assigneeId: String(data.get("assigneeId") ?? "") || null,
            dueOn: String(data.get("dueOn") ?? "") || null,
            priority: String(data.get("priority") ?? "medium") as TaskPriority,
            title: String(data.get("title") ?? ""),
          },
        })
      );
      if (ok) {
        form.reset();
      }
    },
    [actorId, createTask.run]
  );

  const handleComplete = useCallback(
    (taskId: string) =>
      updateTask.run(() =>
        getTrpc().tasks.complete.mutate({ actorId, taskId })
      ),
    [actorId, updateTask.run]
  );

  const handleAssign = useCallback(
    (taskId: string, assigneeId: string | null) =>
      updateTask.run(() =>
        getTrpc().tasks.assign.mutate({ actorId, assigneeId, taskId })
      ),
    [actorId, updateTask.run]
  );

  const handleSetPriority = useCallback(
    (taskId: string, priority: TaskPriority) =>
      updateTask.run(() =>
        getTrpc().tasks.setPriority.mutate({ actorId, priority, taskId })
      ),
    [actorId, updateTask.run]
  );

  return (
    <main className="page-wrap px-4 pt-12 pb-12 sm:pt-16">
      <section className="rise-in flex max-w-3xl flex-col gap-4">
        <p className="island-kicker m-0">Planning</p>
        <h1 className="glass-title m-0 text-5xl text-foreground sm:text-6xl">
          Tasks
        </h1>
        <p className="m-0 max-w-xl text-foreground/70 text-lg leading-relaxed">
          Shared jobs for the team. Hand them out and tick them off.
        </p>
        <MemberPicker
          members={members}
          onChange={setActingMemberId}
          value={actingMember?.id}
        />
      </section>

      <dl
        className="rise-in mt-10 grid max-w-2xl grid-cols-3 gap-3"
        style={{ animationDelay: "80ms" }}
      >
        <Stat label="Open" value={summary.open} />
        <Stat
          highlight={summary.high > 0}
          label="High priority"
          value={summary.high}
        />
        <Stat label="Done" value={summary.done} />
      </dl>

      <form
        className="rise-in glass mt-6 p-6 sm:p-8"
        onSubmit={handleCreate}
        style={{ animationDelay: "140ms" }}
      >
        <p className="island-kicker mb-4">New task</p>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] sm:items-end">
          <label
            className="grid gap-1.5 font-medium text-sm"
            htmlFor="task-title"
          >
            Title
            <Input
              className="h-9"
              id="task-title"
              maxLength={TASK_TITLE_MAX_LENGTH}
              name="title"
              placeholder="What needs doing?"
              required
            />
          </label>
          <label
            className="grid gap-1.5 font-medium text-sm"
            htmlFor="task-assignee"
          >
            Assignee
            <NativeSelect
              className="[&_select]:h-9"
              defaultValue=""
              id="task-assignee"
              name="assigneeId"
            >
              <NativeSelectOption value="">Unassigned</NativeSelectOption>
              {members.map((member) => (
                <NativeSelectOption key={member.id} value={member.id}>
                  {member.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
          <label
            className="grid gap-1.5 font-medium text-sm"
            htmlFor="task-priority"
          >
            Priority
            <NativeSelect
              className="[&_select]:h-9"
              defaultValue="medium"
              id="task-priority"
              name="priority"
            >
              {TASK_PRIORITIES.map((priority) => (
                <NativeSelectOption key={priority} value={priority}>
                  {PRIORITY_LABELS[priority]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
          <label
            className="grid gap-1.5 font-medium text-sm"
            htmlFor="task-due"
          >
            Due date
            <Input
              className="h-9 sm:w-44"
              id="task-due"
              name="dueOn"
              type="date"
            />
          </label>
          <Button
            className="h-9 px-5"
            disabled={createTask.pending}
            type="submit"
          >
            <Plus aria-hidden="true" />
            {createTask.pending ? "Adding…" : "Add task"}
          </Button>
        </div>
        <FormError message={createTask.error} />
      </form>

      <section className="mt-10">
        <FormError message={updateTask.error} />
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <fieldset className="segmented">
            <legend className="sr-only">Filter by priority</legend>
            {TASK_PRIORITIES.map((priority) => (
              <button
                aria-pressed={selectedPriorities.has(priority)}
                key={priority}
                onClick={handleTogglePriority}
                type="button"
                value={priority}
              >
                {PRIORITY_LABELS[priority]}
                <span className="text-xs tabular-nums opacity-60">
                  {summary.byPriority[priority]}
                </span>
              </button>
            ))}
          </fieldset>
          {selectedPriorities.size > 0 ? (
            <Button onClick={handleClearFilter} size="sm" variant="ghost">
              <X aria-hidden="true" />
              Clear
            </Button>
          ) : null}
        </div>
        <TaskList
          disabled={updateTask.pending}
          emptyState={
            tasks.length > 0 ? (
              <TasksEmpty
                action={
                  <Button
                    onClick={handleClearFilter}
                    size="sm"
                    variant="outline"
                  >
                    Clear filter
                  </Button>
                }
                description="No tasks match the selected priorities."
                icon={<ListFilter />}
                title="Nothing here"
              />
            ) : (
              <TasksEmpty
                description="Add the first one with the form above."
                icon={<ListTodo />}
                title="No tasks yet"
              />
            )
          }
          members={members}
          onAssign={handleAssign}
          onComplete={handleComplete}
          onSetPriority={handleSetPriority}
          tasks={visibleTasks}
        />
      </section>
    </main>
  );
}

function Stat({
  highlight = false,
  label,
  value,
}: {
  highlight?: boolean;
  label: string;
  value: number;
}) {
  return (
    <div className="glass px-5 py-4 [--glass-radius:22px]">
      <dt className="font-medium text-foreground/60 text-xs">{label}</dt>
      <dd
        className={
          highlight
            ? "m-0 font-semibold text-4xl text-destructive tabular-nums tracking-tight"
            : "m-0 font-semibold text-4xl text-foreground tabular-nums tracking-tight"
        }
      >
        {value}
      </dd>
    </div>
  );
}

function TasksEmpty({
  action,
  description,
  icon,
  title,
}: {
  action?: ReactNode;
  description: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <Empty className="glass py-14">
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}
