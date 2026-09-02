import {
  Task,
  TaskList,
  TaskFilter,
  TaskSort,
  StatusSummary,
} from "../types";

/**
 * Sorts tasks according to the sort criteria.
 * Pure function - no side effects or mutations.
 *
 * @param tasks Array of tasks to sort
 * @param sortBy Sort specification (field and order)
 * @returns New sorted array
 */
function sortTasks(tasks: Task[], sortBy: TaskSort): Task[] {
  const { by, order } = sortBy;
  const isAscending = order === "asc";

  return [...tasks].sort((a, b) => {
    let comparison = 0;

    switch (by) {
      case "dueDate": {
        // Handle undefined due dates: treat as latest (lowest priority in sort)
        const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_VALUE;
        const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_VALUE;
        comparison = aDate - bDate;
        break;
      }

      case "priority": {
        // Define priority order: High > Medium > Low
        const priorityOrder: Record<typeof a.priority, number> = {
          High: 3,
          Medium: 2,
          Low: 1,
        };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
      }

      case "createdAt": {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        comparison = aTime - bTime;
        break;
      }
    }

    // Reverse if descending order
    return isAscending ? comparison : -comparison;
  });
}

/**
 * Filters tasks according to the filter criteria.
 * Pure function - no side effects or mutations.
 *
 * @param tasks Array of tasks to filter
 * @param filter Filter specification (status, priority, dueDate, listId)
 * @returns New filtered array
 */
function filterTasks(tasks: Task[], filter: TaskFilter): Task[] {
  return tasks.filter((task) => {
    // Filter by status if specified
    if (filter.status !== undefined && task.status !== filter.status) {
      return false;
    }

    // Filter by priority if specified
    if (filter.priority !== undefined && task.priority !== filter.priority) {
      return false;
    }

    // Filter by dueDate if specified — include tasks due on or before the given date
    if (filter.dueDate !== undefined) {
      // If task has no due date, it doesn't match the filter
      if (!task.dueDate) {
        return false;
      }
      // Compare ISO date strings directly (they sort lexicographically correctly)
      if (task.dueDate > filter.dueDate) {
        return false;
      }
    }

    // Filter by listId if specified
    if (filter.listId !== undefined && task.listId !== filter.listId) {
      return false;
    }

    return true;
  });
}

/**
 * getTasks — filter and sort a task array
 *
 * Applies filter first, then sort. Returns filtered and sorted tasks.
 * Pure function - no side effects or mutations.
 *
 * @param tasks Array of tasks to query
 * @param filter Optional filter criteria (status, priority, dueDate, listId)
 * @param sort Optional sort criteria (field and order)
 * @returns New array of filtered and sorted tasks
 */
export function getTasks(
  tasks: Task[],
  filter?: TaskFilter,
  sort?: TaskSort
): Task[] {
  // Step 1: Apply filter
  let result = filter ? filterTasks(tasks, filter) : [...tasks];

  // Step 2: Apply sort
  if (sort) {
    result = sortTasks(result, sort);
  }

  return result;
}

/**
 * getSummary — compute status counts for a task array
 *
 * Counts tasks grouped by status: "To Do", "In Progress", "Done".
 * Pure function - no side effects or mutations.
 *
 * @param tasks Array of tasks to summarize
 * @returns StatusSummary with counts for each status
 */
export function getSummary(tasks: Task[]): StatusSummary {
  const summary: StatusSummary = {
    todo: 0,
    inProgress: 0,
    done: 0,
  };

  for (const task of tasks) {
    switch (task.status) {
      case "To Do":
        summary.todo++;
        break;
      case "In Progress":
        summary.inProgress++;
        break;
      case "Done":
        summary.done++;
        break;
    }
  }

  return summary;
}

/**
 * getListById — find a task list by id
 *
 * Simple lookup function that returns the list if found, undefined otherwise.
 * Pure function - no side effects or mutations.
 *
 * @param lists Array of task lists to search
 * @param id ID of the list to find
 * @returns TaskList if found, undefined otherwise
 */
export function getListById(
  lists: TaskList[],
  id: string
): TaskList | undefined {
  return lists.find((list) => list.id === id);
}
