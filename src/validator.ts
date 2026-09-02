import { ValidationResult, Status, Priority } from "./types";

/**
 * Validates a task title.
 *
 * Rules:
 * - Must not be empty or whitespace-only
 * - Maximum 500 characters
 *
 * @param title The task title to validate
 * @returns ValidationResult with ok=true or an error message
 */
export function validateTaskTitle(title: string): ValidationResult {
  if (!title || title.trim().length === 0) {
    return { ok: false, message: "Task title cannot be empty" };
  }

  if (title.length > 500) {
    return { ok: false, message: "Task title must not exceed 500 characters" };
  }

  return { ok: true };
}

/**
 * Validates a list name.
 *
 * Rules:
 * - Must not be empty or whitespace-only
 *
 * @param name The list name to validate
 * @returns ValidationResult with ok=true or an error message
 */
export function validateListName(name: string): ValidationResult {
  if (!name || name.trim().length === 0) {
    return { ok: false, message: "List name cannot be empty" };
  }

  return { ok: true };
}

/**
 * Validates a due date string.
 *
 * Rules:
 * - Optional (undefined or empty string is valid)
 * - If provided, must be a valid ISO 8601 date string
 *
 * @param date The due date string to validate (ISO 8601 format or undefined)
 * @returns ValidationResult with ok=true or an error message
 */
export function validateDueDate(date: string | undefined): ValidationResult {
  // Optional field - undefined or empty string is valid
  if (!date || date.trim().length === 0) {
    return { ok: true };
  }

  // Check if the date string is a valid ISO 8601 date format
  // ISO 8601 date format: YYYY-MM-DD
  const iso8601DatePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!iso8601DatePattern.test(date)) {
    return {
      ok: false,
      message: "Due date must be in ISO 8601 format (YYYY-MM-DD)",
    };
  }

  // Validate that the date is actually valid (e.g., not 2024-02-30)
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    return { ok: false, message: "Invalid date" };
  }

  // Ensure the parsed date matches the input (to catch cases like 2024-13-45)
  const isoDateString = parsedDate.toISOString().split("T")[0];
  if (isoDateString !== date) {
    return { ok: false, message: "Invalid date" };
  }

  return { ok: true };
}

/**
 * Validates a task status.
 *
 * Rules:
 * - Must be one of: "To Do", "In Progress", "Done"
 *
 * @param status The status value to validate
 * @returns ValidationResult with ok=true or an error message
 */
export function validateStatus(status: string): ValidationResult {
  const validStatuses: Status[] = ["To Do", "In Progress", "Done"];

  if (!validStatuses.includes(status as Status)) {
    return {
      ok: false,
      message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
    };
  }

  return { ok: true };
}

/**
 * Validates a task priority.
 *
 * Rules:
 * - Must be one of: "Low", "Medium", "High"
 *
 * @param priority The priority value to validate
 * @returns ValidationResult with ok=true or an error message
 */
export function validatePriority(priority: string): ValidationResult {
  const validPriorities: Priority[] = ["Low", "Medium", "High"];

  if (!validPriorities.includes(priority as Priority)) {
    return {
      ok: false,
      message: `Invalid priority. Must be one of: ${validPriorities.join(", ")}`,
    };
  }

  return { ok: true };
}
