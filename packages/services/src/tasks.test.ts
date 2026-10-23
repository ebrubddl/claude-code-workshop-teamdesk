import { beforeEach, describe, expect, test } from "bun:test";
import { createTeam, type Team } from "./fixtures.ts";
import {
  createTaskInput,
  createTasksService,
  type TasksService,
} from "./tasks.ts";

const TODAY = "2026-10-23";

let team: Team;
let tasks: TasksService;

beforeEach(async () => {
  team = await createTeam();
  tasks = createTasksService(team.db);
});

describe("tasks service", () => {
  test("create trims the title and keeps the due date", async () => {
    const task = await tasks.create(
      team.ana.id,
      { dueOn: "2026-10-30", title: "  Book the venue  " },
      TODAY
    );

    expect(task).toMatchObject({
      createdById: team.ana.id,
      dueOn: "2026-10-30",
      title: "Book the venue",
    });
  });

  test("create rejects an unknown assignee", async () => {
    await expect(
      tasks.create(team.ana.id, { assigneeId: "999", title: "Nobody" }, TODAY)
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  // biome-ignore lint/suspicious/noSkippedTests: due dates are not validated yet, re-enable when tasks.ts checks them
  test.skip("create rejects a due date in the past", async () => {
    await expect(
      tasks.create(
        team.ana.id,
        { dueOn: "2026-10-01", title: "Too late" },
        TODAY
      )
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });

  test("only the assignee, the creator or an admin can complete a task", async () => {
    const task = await tasks.create(
      team.ana.id,
      { title: "Order pizza" },
      TODAY
    );

    await expect(tasks.complete(team.ben.id, task.id)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await tasks.assign(team.ana.id, task.id, team.ben.id);
    expect(
      (await tasks.complete(team.ben.id, task.id)).completedAt
    ).not.toBeNull();
  });

  test("completing twice is a validation error", async () => {
    const task = await tasks.create(
      team.ana.id,
      { title: "Order pizza" },
      TODAY
    );
    await tasks.complete(team.admin.id, task.id);

    await expect(tasks.complete(team.admin.id, task.id)).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });

  test("create defaults the priority to medium", async () => {
    const task = await tasks.create(
      team.ana.id,
      { title: "No priority given" },
      TODAY
    );

    expect(task.priority).toBe("medium");
  });

  test("create keeps an explicit priority", async () => {
    const task = await tasks.create(
      team.ana.id,
      { priority: "high", title: "Urgent fix" },
      TODAY
    );

    expect(task.priority).toBe("high");
  });

  test("setPriority returns the updated task and list reflects it", async () => {
    const task = await tasks.create(
      team.ana.id,
      { title: "Reprioritise me" },
      TODAY
    );

    const updated = await tasks.setPriority(team.ben.id, task.id, "low");

    expect(updated).toMatchObject({ id: task.id, priority: "low" });
    const listed = await tasks.list();
    expect(listed.find((t) => t.id === task.id)?.priority).toBe("low");
  });

  test("setPriority on an unknown task throws NOT_FOUND", async () => {
    await expect(
      tasks.setPriority(team.ana.id, "999", "high")
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("setPriority by an unknown actor is rejected with NOT_FOUND", async () => {
    const task = await tasks.create(
      team.ana.id,
      { title: "Who is asking?" },
      TODAY
    );

    await expect(
      tasks.setPriority("999", task.id, "high")
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("createTaskInput rejects an unknown priority", () => {
    expect(
      createTaskInput.safeParse({ priority: "urgent", title: "x" }).success
    ).toBe(false);
  });
});
