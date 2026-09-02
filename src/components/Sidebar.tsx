import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTaskStore } from '../store/useTaskStore';
import { ConfirmDialog } from './ConfirmDialog';
import type { TaskList } from '../types';

/**
 * Sidebar component — displays all task lists with navigation links.
 *
 * Features:
 * - Lists all task lists; Inbox always appears first
 * - Highlights the active list based on current route (/lists/:listId)
 * - Inline "New list" input toggled by a "+ New list" button
 * - Rename in-place for non-Inbox lists (click name to edit, Enter/blur to save, Escape to cancel)
 * - Delete button for non-Inbox lists; shows ConfirmDialog with task count before deleting
 * - All interactive elements meet 44×44 CSS px minimum touch target
 *
 * Requirements: 6.1, 6.2, 6.3
 */
export function Sidebar() {
  const { state, actions, queries } = useTaskStore();
  const navigate = useNavigate();

  // ── New list state ──────────────────────────────────────────────────────────
  const [showNewListInput, setShowNewListInput] = useState(false);
  const [newListName, setNewListName] = useState('');
  const newListInputRef = useRef<HTMLInputElement>(null);

  // Focus the new list input when it appears
  useEffect(() => {
    if (showNewListInput) {
      newListInputRef.current?.focus();
    }
  }, [showNewListInput]);

  function handleAddList() {
    const trimmed = newListName.trim();
    if (!trimmed) return;
    const list = actions.addList(trimmed);
    setNewListName('');
    setShowNewListInput(false);
    navigate(`/lists/${list.id}`);
  }

  function handleNewListKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddList();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setNewListName('');
      setShowNewListInput(false);
    }
  }

  // ── Rename state ────────────────────────────────────────────────────────────
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Focus the rename input when it appears
  useEffect(() => {
    if (renamingId) {
      renameInputRef.current?.focus();
      // Select all text for easy replacement
      renameInputRef.current?.select();
    }
  }, [renamingId]);

  function startRename(list: TaskList) {
    setRenamingId(list.id);
    setRenameValue(list.name);
  }

  function commitRename() {
    if (!renamingId) return;
    const trimmed = renameValue.trim();
    if (trimmed) {
      actions.renameList(renamingId, trimmed);
    }
    setRenamingId(null);
    setRenameValue('');
  }

  function cancelRename() {
    setRenamingId(null);
    setRenameValue('');
  }

  function handleRenameKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitRename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelRename();
    }
  }

  // ── Delete state ────────────────────────────────────────────────────────────
  const [deletingList, setDeletingList] = useState<TaskList | null>(null);

  function handleDeleteConfirm() {
    if (!deletingList) return;
    actions.deleteList(deletingList.id);
    setDeletingList(null);
  }

  function handleDeleteCancel() {
    setDeletingList(null);
  }

  // ── Sorted lists: Inbox first ───────────────────────────────────────────────
  const sortedLists = [...state.lists].sort((a, b) => {
    if (a.isInbox) return -1;
    if (b.isInbox) return 1;
    return a.createdAt.localeCompare(b.createdAt);
  });

  // ── Task counts per list ────────────────────────────────────────────────────
  function getTaskCount(listId: string): number {
    return queries.getTasks({ listId }).length;
  }

  // ── Build confirm message ───────────────────────────────────────────────────
  function buildDeleteMessage(list: TaskList): string {
    const count = getTaskCount(list.id);
    if (count === 0) {
      return `Delete "${list.name}"? This cannot be undone.`;
    }
    return `Delete "${list.name}"? This will also permanently delete ${count} task${count === 1 ? '' : 's'}. This cannot be undone.`;
  }

  return (
    <>
      <nav
        aria-label="Task lists"
        className="flex h-full flex-col bg-gray-50 px-3 py-4"
      >
        {/* Header */}
        <h2 className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          My Lists
        </h2>

        {/* List items */}
        <ul className="flex-1 space-y-0.5 overflow-y-auto" role="list">
          {sortedLists.map((list) => (
            <li key={list.id} className="group">
              {renamingId === list.id ? (
                /* ── Rename mode ── */
                <div className="flex items-center gap-1 rounded-md px-2 py-1">
                  <input
                    ref={renameInputRef}
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={handleRenameKeyDown}
                    aria-label={`Rename list: ${list.name}`}
                    className="min-h-[36px] flex-1 rounded border border-blue-400 bg-white px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {/* Cancel rename button */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      // Prevent blur from firing before click
                      e.preventDefault();
                      cancelRename();
                    }}
                    aria-label="Cancel rename"
                    className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded text-gray-400 hover:bg-gray-200 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400"
                  >
                    <svg
                      className="h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                    </svg>
                  </button>
                </div>
              ) : (
                /* ── Normal / active mode ── */
                <div className="flex items-center gap-1">
                  {/* NavLink — highlights active route */}
                  <NavLink
                    to={`/lists/${list.id}`}
                    aria-label={`Go to list: ${list.name}`}
                    className={({ isActive }) =>
                      [
                        'flex min-h-[44px] flex-1 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-blue-100 text-blue-800'
                          : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900',
                      ].join(' ')
                    }
                  >
                    {/* Inbox icon or list icon */}
                    {list.isInbox ? (
                      <svg
                        className="h-4 w-4 shrink-0"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v11.75A2.75 2.75 0 0 0 16.75 18h-12A2.75 2.75 0 0 1 2 15.25V3.5Zm3.75 7a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5Zm0 3a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5ZM5.75 5a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-4 w-4 shrink-0"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path d="M3.5 2A1.5 1.5 0 0 0 2 3.5v3A1.5 1.5 0 0 0 3.5 8h3A1.5 1.5 0 0 0 8 6.5v-3A1.5 1.5 0 0 0 6.5 2h-3Zm0 9A1.5 1.5 0 0 0 2 12.5v3A1.5 1.5 0 0 0 3.5 17h3A1.5 1.5 0 0 0 8 15.5v-3A1.5 1.5 0 0 0 6.5 11h-3Zm6.5 1.5A1.5 1.5 0 0 1 11.5 11h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 10 15.5v-3Zm1.5-10A1.5 1.5 0 0 0 10 3.5v3A1.5 1.5 0 0 0 11.5 8h3A1.5 1.5 0 0 0 16 6.5v-3A1.5 1.5 0 0 0 14.5 2h-3Z" />
                      </svg>
                    )}

                    <span className="flex-1 truncate">{list.name}</span>

                    {/* Task count badge */}
                    <span
                      className="ml-auto shrink-0 rounded-full bg-gray-200 px-1.5 py-0.5 text-xs text-gray-600"
                      aria-label={`${getTaskCount(list.id)} tasks`}
                    >
                      {getTaskCount(list.id)}
                    </span>
                  </NavLink>

                  {/* Action buttons — visible on hover or always for non-Inbox */}
                  {!list.isInbox && (
                    <div className="flex shrink-0 items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      {/* Rename button */}
                      <button
                        type="button"
                        onClick={() => startRename(list)}
                        aria-label={`Rename list: ${list.name}`}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-gray-400 hover:bg-gray-200 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d="M2.695 14.763l-1.262 3.154a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.885L17.5 5.5a2.121 2.121 0 0 0-3-3L3.58 13.42a4 4 0 0 0-.885 1.343Z" />
                        </svg>
                      </button>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => setDeletingList(list)}
                        aria-label={`Delete list: ${list.name}`}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                      >
                        <svg
                          className="h-3.5 w-3.5"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 3.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>

        {/* ── New list section ──────────────────────────────────────────────── */}
        <div className="mt-3 border-t border-gray-200 pt-3">
          {showNewListInput ? (
            <div className="flex items-center gap-1">
              <input
                ref={newListInputRef}
                type="text"
                placeholder="List name…"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={handleNewListKeyDown}
                aria-label="New list name"
                className="min-h-[44px] flex-1 rounded-md border border-blue-400 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {/* Add button */}
              <button
                type="button"
                onClick={handleAddList}
                disabled={!newListName.trim()}
                aria-label="Create new list"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg
                  className="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                </svg>
              </button>
              {/* Cancel button */}
              <button
                type="button"
                onClick={() => {
                  setNewListName('');
                  setShowNewListInput(false);
                }}
                aria-label="Cancel new list"
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-gray-400 hover:bg-gray-200 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
              >
                <svg
                  className="h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowNewListInput(true)}
              className="flex min-h-[44px] w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-200 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
              <svg
                className="h-4 w-4 shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
              </svg>
              New list
            </button>
          )}
        </div>
      </nav>

      {/* Delete confirmation dialog — rendered outside nav to sit above everything */}
      {deletingList && (
        <ConfirmDialog
          message={buildDeleteMessage(deletingList)}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </>
  );
}

export default Sidebar;
