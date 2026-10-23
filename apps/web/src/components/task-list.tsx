import {
  type Member,
  PRIORITY_LABELS,
  TASK_PRIORITIES,
  type Task,
  type TaskPriority,
} from "@repo/db/shared";
import { Check } from "lucide-react";
import {
  type ChangeEvent,
  type MouseEvent,
  type ReactNode,
  useCallback,
} from "react";
import { Badge } from "#/components/ui/badge";
import {
  NativeSelect,
  NativeSelectOption,
} from "#/components/ui/native-select";
import { formatDay } from "#/lib/datetime";

const PRIORITY_BADGE_CLASSES: Record<TaskPriority, string> = {
  high: "border-transparent bg-red-500/15 font-semibold text-red-800 dark:text-red-200",
  low: "border-transparent bg-sky-500/15 text-sky-800 dark:text-sky-200",
  medium:
    "border-transparent bg-amber-500/20 text-amber-900 dark:text-amber-200",
};

interface TaskListProps {
  disabled: boolean;
  emptyState: ReactNode;
  members: readonly Member[];
  onAssign: (taskId: string, assigneeId: string | null) => void;
  onComplete: (taskId: string) => void;
  onSetPriority: (taskId: string, priority: TaskPriority) => void;
  tasks: readonly Task[];
}

export default function TaskList({
  disabled,
  emptyState,
  members,
  onAssign,
  onComplete,
  onSetPriority,
  tasks,
}: TaskListProps) {
  const handleAssign = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const { taskId } = event.currentTarget.dataset;
      if (taskId) {
        onAssign(taskId, event.currentTarget.value || null);
      }
    },
    [onAssign]
  );

  const handleSetPriority = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      const { taskId } = event.currentTarget.dataset;
      if (taskId) {
        onSetPriority(taskId, event.currentTarget.value as TaskPriority);
      }
    },
    [onSetPriority]
  );

  const handleComplete = useCallback(
    (event: MouseEvent<HTMLButtonElement>) =>
      onComplete(event.currentTarget.value),
    [onComplete]
  );

  if (tasks.length === 0) {
    return emptyState;
  }
  return (
    <ul className="m-0 grid list-none gap-3 p-0">
      {tasks.map((task) => (
        <li
          className={
            task.completedAt
              ? "glass flex flex-col gap-3 p-4 opacity-70 [--glass-radius:22px] sm:flex-row sm:items-center sm:gap-4"
              : "glass flex flex-col gap-3 p-4 [--glass-radius:22px] sm:flex-row sm:items-center sm:gap-4"
          }
          key={task.id}
        >
          <div className="flex min-w-0 flex-1 items-center gap-3">
            {task.completedAt ? (
              <span
                aria-hidden="true"
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-white"
              >
                <Check className="size-3.5" strokeWidth={3} />
              </span>
            ) : (
              <button
                aria-label={`Complete ${task.title}`}
                className="group flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-foreground/25 transition-colors hover:border-primary hover:bg-primary/10 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30 disabled:pointer-events-none disabled:opacity-50"
                disabled={disabled}
                onClick={handleComplete}
                type="button"
                value={task.id}
              >
                <Check
                  className="size-3.5 text-primary opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                  strokeWidth={3}
                />
              </button>
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className={
                    task.completedAt
                      ? "m-0 font-medium text-foreground/50 line-through"
                      : "m-0 font-medium text-foreground"
                  }
                >
                  {task.title}
                </p>
                <Badge
                  className={PRIORITY_BADGE_CLASSES[task.priority]}
                  variant="outline"
                >
                  {PRIORITY_LABELS[task.priority]}
                </Badge>
              </div>
              <p className="m-0 text-foreground/60 text-xs">
                {task.dueOn ? `Due ${formatDay(task.dueOn)}` : "No due date"}
                {task.completedAt
                  ? `, done ${formatDay(task.completedAt)}`
                  : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pl-9 sm:pl-0">
            <NativeSelect
              aria-label={`Assignee for ${task.title}`}
              data-task-id={task.id}
              disabled={disabled || task.completedAt !== null}
              onChange={handleAssign}
              size="sm"
              value={task.assigneeId ?? ""}
            >
              <NativeSelectOption value="">Unassigned</NativeSelectOption>
              {members.map((member) => (
                <NativeSelectOption key={member.id} value={member.id}>
                  {member.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            <NativeSelect
              aria-label={`Priority for ${task.title}`}
              data-task-id={task.id}
              disabled={disabled || task.completedAt !== null}
              onChange={handleSetPriority}
              size="sm"
              value={task.priority}
            >
              {TASK_PRIORITIES.map((priority) => (
                <NativeSelectOption key={priority} value={priority}>
                  {PRIORITY_LABELS[priority]}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </li>
      ))}
    </ul>
  );
}
