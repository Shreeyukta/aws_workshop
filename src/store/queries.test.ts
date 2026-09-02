import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { getTasks, getSummary, getListById } from "./queries";
import {
  Task,
  TaskList,
  TaskFilter,
  TaskSort,
  StatusSummary,
} from "../types";

// ============================================================================
// Test Data Generators
// ============================================================================

/**
 * Generator for valid Status values
 */
const statusArb = fc.constantFrom("To Do", "In Progress", "Done");

/**
 * Generator for valid Priority values
 */
const priorityArb = fc.constantFrom("Low", "Medium", "High");

/**
 * Generator for ISO 8601 date strings
 */
const isoDateArb = fc.date().map((d) => d.toISOString().split("T")[0]);

/**
 * Generator for ISO 8601 timestamps
 */
const isoTimestampArb = fc
  .date({ min: new Date("2000-01-01"), max: new Date() })
  .map((d) => d.toISOString());

/**
 * Generator for Task objects
 */
const taskArb = fc
  .tuple(
    fc.uuid(),
    fc.uuid(),
    fc.stringMatching(/^.{1,500}$/), // title: 1-500 chars
    statusArb,
    priorityArb,
    fc.option(isoDateArb, { freq: 3 }), // dueDate: 75% chance of being present
    isoTimestampArb,
    isoTimestampArb
  )
  .map(([id, listId, title, status, priority, dueDate, createdAt, updatedAt]) => ({
    id,
    listId,
    title,
    status,
    priority,
    dueDate,
    createdAt,
    updatedAt,
  }));

/**
 * Generator for TaskList objects
 */
const taskListArb = fc
  .tuple(fc.uuid(), fc.stringMatching(/^.{1,100}$/), fc.boolean())
  .map(([id, name, isInbox]) => ({
    id,
    name,
    isInbox,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

// ============================================================================
// Unit Tests: getTasks with filters
// ============================================================================

describe("getTasks", () => {
  describe("filtering by status", () => {
    it("should return only tasks matching the specified status", () => {
      const tasks: Task[] = [
        {
          id: "1",
          listId: "list1",
          title: "Task 1",
          status: "To Do",
          priority: "Medium",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "2",
          listId: "list1",
          title: "Task 2",
          status: "In Progress",
          priority: "Medium",
          createdAt: "2024-01-02T00:00:00Z",
          updatedAt: "2024-01-02T00:00:00Z",
        },
        {
          id: "3",
          listId: "list1",
          title: "Task 3",
          status: "Done",
          priority: "Medium",
          createdAt: "2024-01-03T00:00:00Z",
          updatedAt: "2024-01-03T00:00:00Z",
        },
      ];

      const result = getTasks(tasks, { status: "To Do" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });

    it("should return empty array when no tasks match the status filter", () => {
      const tasks: Task[] = [
        {
          id: "1",
          listId: "list1",
          title: "Task 1",
          status: "To Do",
          priority: "Medium",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      const result = getTasks(tasks, { status: "Done" });
      expect(result).toHaveLength(0);
    });
  });

  describe("filtering by priority", () => {
    it("should return only tasks matching the specified priority", () => {
      const tasks: Task[] = [
        {
          id: "1",
          listId: "list1",
          title: "Task 1",
          status: "To Do",
          priority: "High",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "2",
          listId: "list1",
          title: "Task 2",
          status: "To Do",
          priority: "Low",
          createdAt: "2024-01-02T00:00:00Z",
          updatedAt: "2024-01-02T00:00:00Z",
        },
      ];

      const result = getTasks(tasks, { priority: "High" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });
  });

  describe("filtering by dueDate", () => {
    it("should return tasks due on or before the specified date", () => {
      const tasks: Task[] = [
        {
          id: "1",
          listId: "list1",
          title: "Task 1",
          status: "To Do",
          priority: "Medium",
          dueDate: "2024-01-10",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "2",
          listId: "list1",
          title: "Task 2",
          status: "To Do",
          priority: "Medium",
          dueDate: "2024-01-20",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      const result = getTasks(tasks, { dueDate: "2024-01-15" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });

    it("should exclude tasks without a due date when filtering by dueDate", () => {
      const tasks: Task[] = [
        {
          id: "1",
          listId: "list1",
          title: "Task 1",
          status: "To Do",
          priority: "Medium",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
          // no dueDate
        },
      ];

      const result = getTasks(tasks, { dueDate: "2024-01-15" });
      expect(result).toHaveLength(0);
    });
  });

  describe("filtering by listId", () => {
    it("should return only tasks belonging to the specified list", () => {
      const tasks: Task[] = [
        {
          id: "1",
          listId: "list1",
          title: "Task 1",
          status: "To Do",
          priority: "Medium",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "2",
          listId: "list2",
          title: "Task 2",
          status: "To Do",
          priority: "Medium",
          createdAt: "2024-01-02T00:00:00Z",
          updatedAt: "2024-01-02T00:00:00Z",
        },
      ];

      const result = getTasks(tasks, { listId: "list1" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });
  });

  describe("combining multiple filters", () => {
    it("should apply multiple filters in combination", () => {
      const tasks: Task[] = [
        {
          id: "1",
          listId: "list1",
          title: "Task 1",
          status: "To Do",
          priority: "High",
          dueDate: "2024-01-10",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "2",
          listId: "list1",
          title: "Task 2",
          status: "In Progress",
          priority: "High",
          dueDate: "2024-01-10",
          createdAt: "2024-01-02T00:00:00Z",
          updatedAt: "2024-01-02T00:00:00Z",
        },
        {
          id: "3",
          listId: "list1",
          title: "Task 3",
          status: "To Do",
          priority: "Low",
          dueDate: "2024-01-10",
          createdAt: "2024-01-03T00:00:00Z",
          updatedAt: "2024-01-03T00:00:00Z",
        },
      ];

      const result = getTasks(tasks, {
        status: "To Do",
        priority: "High",
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("1");
    });
  });

  describe("sorting by dueDate", () => {
    it("should sort tasks by dueDate in ascending order", () => {
      const tasks: Task[] = [
        {
          id: "1",
          listId: "list1",
          title: "Task 1",
          status: "To Do",
          priority: "Medium",
          dueDate: "2024-01-20",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "2",
          listId: "list1",
          title: "Task 2",
          status: "To Do",
          priority: "Medium",
          dueDate: "2024-01-10",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      const result = getTasks(tasks, undefined, {
        by: "dueDate",
        order: "asc",
      });
      expect(result[0].id).toBe("2");
      expect(result[1].id).toBe("1");
    });

    it("should sort tasks by dueDate in descending order", () => {
      const tasks: Task[] = [
        {
          id: "1",
          listId: "list1",
          title: "Task 1",
          status: "To Do",
          priority: "Medium",
          dueDate: "2024-01-10",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "2",
          listId: "list1",
          title: "Task 2",
          status: "To Do",
          priority: "Medium",
          dueDate: "2024-01-20",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      const result = getTasks(tasks, undefined, {
        by: "dueDate",
        order: "desc",
      });
      expect(result[0].id).toBe("2");
      expect(result[1].id).toBe("1");
    });

    it("should sort tasks without dueDate to the end in asc order", () => {
      const tasks: Task[] = [
        {
          id: "1",
          listId: "list1",
          title: "Task with due date",
          status: "To Do",
          priority: "Medium",
          dueDate: "2024-01-10",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "2",
          listId: "list1",
          title: "Task without due date",
          status: "To Do",
          priority: "Medium",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      const result = getTasks(tasks, undefined, {
        by: "dueDate",
        order: "asc",
      });
      expect(result[0].id).toBe("1");
      expect(result[1].id).toBe("2");
    });
  });

  describe("sorting by priority", () => {
    it("should sort tasks by priority: High > Medium > Low in ascending order", () => {
      const tasks: Task[] = [
        {
          id: "1",
          listId: "list1",
          title: "Task 1",
          status: "To Do",
          priority: "Low",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "2",
          listId: "list1",
          title: "Task 2",
          status: "To Do",
          priority: "High",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "3",
          listId: "list1",
          title: "Task 3",
          status: "To Do",
          priority: "Medium",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      const result = getTasks(tasks, undefined, {
        by: "priority",
        order: "asc",
      });
      expect(result.map((t) => t.priority)).toEqual(["Low", "Medium", "High"]);
    });

    it("should sort tasks by priority in descending order", () => {
      const tasks: Task[] = [
        {
          id: "1",
          listId: "list1",
          title: "Task 1",
          status: "To Do",
          priority: "Low",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "2",
          listId: "list1",
          title: "Task 2",
          status: "To Do",
          priority: "High",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      const result = getTasks(tasks, undefined, {
        by: "priority",
        order: "desc",
      });
      expect(result.map((t) => t.priority)).toEqual(["High", "Low"]);
    });
  });

  describe("sorting by createdAt", () => {
    it("should sort tasks by createdAt in ascending order", () => {
      const tasks: Task[] = [
        {
          id: "1",
          listId: "list1",
          title: "Task 1",
          status: "To Do",
          priority: "Medium",
          createdAt: "2024-01-03T00:00:00Z",
          updatedAt: "2024-01-03T00:00:00Z",
        },
        {
          id: "2",
          listId: "list1",
          title: "Task 2",
          status: "To Do",
          priority: "Medium",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      const result = getTasks(tasks, undefined, {
        by: "createdAt",
        order: "asc",
      });
      expect(result[0].id).toBe("2");
      expect(result[1].id).toBe("1");
    });

    it("should sort tasks by createdAt in descending order", () => {
      const tasks: Task[] = [
        {
          id: "1",
          listId: "list1",
          title: "Task 1",
          status: "To Do",
          priority: "Medium",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "2",
          listId: "list1",
          title: "Task 2",
          status: "To Do",
          priority: "Medium",
          createdAt: "2024-01-03T00:00:00Z",
          updatedAt: "2024-01-03T00:00:00Z",
        },
      ];

      const result = getTasks(tasks, undefined, {
        by: "createdAt",
        order: "desc",
      });
      expect(result[0].id).toBe("2");
      expect(result[1].id).toBe("1");
    });
  });

  describe("filter then sort", () => {
    it("should apply filter first, then sort", () => {
      const tasks: Task[] = [
        {
          id: "1",
          listId: "list1",
          title: "Task 1",
          status: "To Do",
          priority: "Low",
          createdAt: "2024-01-03T00:00:00Z",
          updatedAt: "2024-01-03T00:00:00Z",
        },
        {
          id: "2",
          listId: "list1",
          title: "Task 2",
          status: "Done",
          priority: "High",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "3",
          listId: "list1",
          title: "Task 3",
          status: "To Do",
          priority: "Medium",
          createdAt: "2024-01-02T00:00:00Z",
          updatedAt: "2024-01-02T00:00:00Z",
        },
      ];

      const result = getTasks(
        tasks,
        { status: "To Do" },
        { by: "priority", order: "desc" }
      );
      expect(result).toHaveLength(2);
      expect(result[0].priority).toBe("Medium");
      expect(result[1].priority).toBe("Low");
    });
  });

  describe("purity - no mutations", () => {
    it("should not mutate the original tasks array", () => {
      const tasks: Task[] = [
        {
          id: "1",
          listId: "list1",
          title: "Task 1",
          status: "To Do",
          priority: "Medium",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];
      const originalLength = tasks.length;

      getTasks(tasks, { status: "Done" });
      expect(tasks.length).toBe(originalLength);
    });
  });

  describe("no filter or sort", () => {
    it("should return a copy of the array when no filter or sort is provided", () => {
      const tasks: Task[] = [
        {
          id: "1",
          listId: "list1",
          title: "Task 1",
          status: "To Do",
          priority: "Medium",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ];

      const result = getTasks(tasks);
      expect(result).toEqual(tasks);
      expect(result).not.toBe(tasks); // Different reference
    });
  });
});

// ============================================================================
// Unit Tests: getSummary
// ============================================================================

describe("getSummary", () => {
  it("should count tasks by status", () => {
    const tasks: Task[] = [
      {
        id: "1",
        listId: "list1",
        title: "Task 1",
        status: "To Do",
        priority: "Medium",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
      {
        id: "2",
        listId: "list1",
        title: "Task 2",
        status: "In Progress",
        priority: "Medium",
        createdAt: "2024-01-02T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z",
      },
      {
        id: "3",
        listId: "list1",
        title: "Task 3",
        status: "Done",
        priority: "Medium",
        createdAt: "2024-01-03T00:00:00Z",
        updatedAt: "2024-01-03T00:00:00Z",
      },
      {
        id: "4",
        listId: "list1",
        title: "Task 4",
        status: "To Do",
        priority: "Medium",
        createdAt: "2024-01-04T00:00:00Z",
        updatedAt: "2024-01-04T00:00:00Z",
      },
    ];

    const result = getSummary(tasks);
    expect(result).toEqual({
      todo: 2,
      inProgress: 1,
      done: 1,
    });
  });

  it("should return zero counts for an empty array", () => {
    const result = getSummary([]);
    expect(result).toEqual({
      todo: 0,
      inProgress: 0,
      done: 0,
    });
  });

  it("should not mutate the input array", () => {
    const tasks: Task[] = [
      {
        id: "1",
        listId: "list1",
        title: "Task 1",
        status: "To Do",
        priority: "Medium",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ];
    const originalLength = tasks.length;

    getSummary(tasks);
    expect(tasks.length).toBe(originalLength);
  });
});

// ============================================================================
// Unit Tests: getListById
// ============================================================================

describe("getListById", () => {
  it("should return the list when found by id", () => {
    const lists: TaskList[] = [
      {
        id: "list1",
        name: "Work",
        isInbox: false,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
      {
        id: "list2",
        name: "Personal",
        isInbox: false,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ];

    const result = getListById(lists, "list1");
    expect(result?.name).toBe("Work");
  });

  it("should return undefined when list is not found", () => {
    const lists: TaskList[] = [
      {
        id: "list1",
        name: "Work",
        isInbox: false,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ];

    const result = getListById(lists, "nonexistent");
    expect(result).toBeUndefined();
  });

  it("should return undefined when lists array is empty", () => {
    const result = getListById([], "any-id");
    expect(result).toBeUndefined();
  });

  it("should not mutate the input array", () => {
    const lists: TaskList[] = [
      {
        id: "list1",
        name: "Work",
        isInbox: false,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ];
    const originalLength = lists.length;

    getListById(lists, "list1");
    expect(lists.length).toBe(originalLength);
  });
});

// ============================================================================
// Property-Based Tests
// ============================================================================

describe("getTasks — property-based tests", () => {
  it("**Validates: Requirements 3.4, 3.5, 6.3** — getTasks always returns a subset or equal to input", () => {
    fc.assert(
      fc.property(fc.array(taskArb), (tasks) => {
        const result = getTasks(tasks);
        expect(result.length).toBeLessThanOrEqual(tasks.length);
      })
    );
  });

  it("**Validates: Requirements 3.4, 3.5** — getTasks with filter returns tasks where all match filter criteria", () => {
    fc.assert(
      fc.property(fc.array(taskArb), statusArb, (tasks, status) => {
        const result = getTasks(tasks, { status });
        result.forEach((task) => {
          expect(task.status).toBe(status);
        });
      })
    );
  });

  it("**Validates: Requirements 3.4** — getTasks with priority filter returns only tasks with that priority", () => {
    fc.assert(
      fc.property(fc.array(taskArb), priorityArb, (tasks, priority) => {
        const result = getTasks(tasks, { priority });
        result.forEach((task) => {
          expect(task.priority).toBe(priority);
        });
      })
    );
  });

  it("**Validates: Requirements 3.5** — getTasks sorts in ascending order by createdAt correctly", () => {
    fc.assert(
      fc.property(fc.array(taskArb, { minLength: 1 }), (tasks) => {
        const result = getTasks(tasks, undefined, {
          by: "createdAt",
          order: "asc",
        });
        for (let i = 1; i < result.length; i++) {
          const prev = new Date(result[i - 1].createdAt).getTime();
          const curr = new Date(result[i].createdAt).getTime();
          expect(prev).toBeLessThanOrEqual(curr);
        }
      })
    );
  });

  it("**Validates: Requirements 3.5** — getTasks sorts in descending order by createdAt correctly", () => {
    fc.assert(
      fc.property(fc.array(taskArb, { minLength: 1 }), (tasks) => {
        const result = getTasks(tasks, undefined, {
          by: "createdAt",
          order: "desc",
        });
        for (let i = 1; i < result.length; i++) {
          const prev = new Date(result[i - 1].createdAt).getTime();
          const curr = new Date(result[i].createdAt).getTime();
          expect(prev).toBeGreaterThanOrEqual(curr);
        }
      })
    );
  });

  it("**Validates: Requirements 6.3** — getTasks with listId returns only tasks from that list", () => {
    fc.assert(
      fc.property(fc.array(taskArb), fc.uuid(), (tasks, listId) => {
        const result = getTasks(tasks, { listId });
        result.forEach((task) => {
          expect(task.listId).toBe(listId);
        });
      })
    );
  });
});

describe("getSummary — property-based tests", () => {
  it("**Validates: Requirements 3.3** — getSummary total equals input array length", () => {
    fc.assert(
      fc.property(fc.array(taskArb), (tasks) => {
        const summary = getSummary(tasks);
        expect(summary.todo + summary.inProgress + summary.done).toBe(
          tasks.length
        );
      })
    );
  });

  it("**Validates: Requirements 3.3** — getSummary counts are never negative", () => {
    fc.assert(
      fc.property(fc.array(taskArb), (tasks) => {
        const summary = getSummary(tasks);
        expect(summary.todo).toBeGreaterThanOrEqual(0);
        expect(summary.inProgress).toBeGreaterThanOrEqual(0);
        expect(summary.done).toBeGreaterThanOrEqual(0);
      })
    );
  });
});

describe("getListById — property-based tests", () => {
  it("**Validates: Requirements 6.3** — getListById returns undefined for non-existent id", () => {
    fc.assert(
      fc.property(
        fc.array(taskListArb),
        fc.uuid(),
        (lists, idToFind) => {
          // Make sure the idToFind doesn't exist in the list
          const existingIds = lists.map((l) => l.id);
          if (!existingIds.includes(idToFind)) {
            const result = getListById(lists, idToFind);
            expect(result).toBeUndefined();
          }
        }
      )
    );
  });

  it("**Validates: Requirements 6.3** — getListById returns the matching list when found", () => {
    fc.assert(
      fc.property(fc.array(taskListArb, { minLength: 1 }), (lists) => {
        const list = lists[0];
        const result = getListById(lists, list.id);
        expect(result).toEqual(list);
      })
    );
  });
});
