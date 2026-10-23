import {
  PRIORITY_LABELS,
  TASK_PRIORITIES,
  TASK_TITLE_MAX_LENGTH,
  type TaskPriority,
} from "@repo/db/shared";
import { createFileRoute } from "@tanstack/react-router";
import {
  type FormEvent,
  type MouseEvent,
  useCallback,
  useMemo,
  useState,
} from "react";
import FormError from "#/components/form-error";
import MemberPicker from "#/components/member-picker";
import PageError from "#/components/page-error";
import TaskList from "#/components/task-list";
import { Button } from "#/components/ui/button";
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
    <main className="page-wrap px-4 py-12">
      <section className="flex max-w-3xl flex-col gap-4">
        <p className="island-kicker m-0">Teamdesk</p>
        <h1 className="display-title m-0 text-4xl text-foreground sm:text-5xl">
          Tasks
        </h1>
        <p className="m-0 text-base text-muted-foreground leading-8">
          Shared jobs for the team. Hand them out and tick them off.
        </p>
        <MemberPicker
          members={members}
          onChange={setActingMemberId}
          value={actingMember?.id}
        />
      </section>

      <form className="island-shell mt-10 p-6 sm:p-8" onSubmit={handleCreate}>
        <p className="island-kicker mb-3">New task</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            aria-label="Title"
            maxLength={TASK_TITLE_MAX_LENGTH}
            name="title"
            placeholder="What needs doing?"
            required
          />
          <NativeSelect aria-label="Assignee" defaultValue="" name="assigneeId">
            <NativeSelectOption value="">Unassigned</NativeSelectOption>
            {members.map((member) => (
              <NativeSelectOption key={member.id} value={member.id}>
                {member.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <NativeSelect
            aria-label="Priority"
            defaultValue="medium"
            name="priority"
          >
            {TASK_PRIORITIES.map((priority) => (
              <NativeSelectOption key={priority} value={priority}>
                {PRIORITY_LABELS[priority]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Input
            aria-label="Due date"
            className="sm:w-44"
            name="dueOn"
            type="date"
          />
          <Button disabled={createTask.pending} type="submit">
            {createTask.pending ? "Adding…" : "Add task"}
          </Button>
        </div>
        <FormError message={createTask.error} />
      </form>

      <section className="mt-10">
        <FormError message={updateTask.error} />
        <div className="mb-4 flex flex-wrap gap-2">
          {TASK_PRIORITIES.map((priority) => (
            <Button
              aria-pressed={selectedPriorities.has(priority)}
              key={priority}
              onClick={handleTogglePriority}
              size="sm"
              value={priority}
              variant={selectedPriorities.has(priority) ? "default" : "outline"}
            >
              {PRIORITY_LABELS[priority]}
            </Button>
          ))}
        </div>
        <TaskList
          disabled={updateTask.pending}
          emptyMessage={
            tasks.length > 0
              ? "No tasks match the selected priorities."
              : undefined
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
