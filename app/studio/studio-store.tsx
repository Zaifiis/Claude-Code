"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  applyOrder,
  normaliseRanks,
  reorderVisible,
  sortActive,
  sortArchived,
  syncArchiveState,
  UNRANKED,
} from "@/lib/studio/ranking";
import {
  CHANNELS,
  DEFAULT_TODO_PRIORITY,
  type Idea,
  type IdeaPatch,
  PLATFORMS,
  type Status,
  STATUSES,
  type Todo,
  type TodoPatch,
  type TodoPriority,
} from "@/types/studio";

/** Shown in the top bar, so autosave is never something you have to trust blindly. */
export type SaveState = "idle" | "saving" | "saved" | "error";

const API = "/api/studio";
const AUTOSAVE_DELAY = 600;
const SAVED_BADGE_DURATION = 1800;
const JSON_HEADERS = { "Content-Type": "application/json" } as const;

function newId(): string {
  const webCrypto = globalThis.crypto;
  if (typeof webCrypto?.randomUUID === "function") return webCrypto.randomUUID();
  if (typeof webCrypto?.getRandomValues === "function") {
    const bytes = webCrypto.getRandomValues(new Uint8Array(16));
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function blankIdea(id: string, defaults: IdeaPatch): Idea {
  const now = new Date().toISOString();
  return {
    id,
    title: "",
    channel: CHANNELS[0],
    platform: PLATFORMS[0],
    pillar: "",
    // New ideas land at the bottom of the ranked list, ready to be dragged up.
    rank: UNRANKED - 1,
    status: "Idea",
    titleOptions: [],
    thumbnailIdea: "",
    hooks: [],
    script: "",
    inspiration: [],
    shotIdeas: [],
    caption: "",
    targetDate: "",
    owner: "",
    notes: "",
    performanceNote: "",
    archived: false,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    ...defaults,
  };
}

interface StudioValue {
  /** Active ideas in make-next order. Index 0 is the next thing to make. */
  active: Idea[];
  /** Published ideas, most recently published first. */
  archived: Idea[];
  byId: Map<string, Idea>;
  /** Every content pillar in use, for the tag filter. */
  pillars: string[];
  /** How many ideas are waiting at each status. */
  counts: Record<Status, number>;
  saveState: SaveState;
  /** Quick capture. Returns the new id so the caller can open it. */
  create: (title: string, defaults?: IdeaPatch) => string;
  /** Optimistic field write. Text debounces; pickers save at once. */
  update: (id: string, patch: IdeaPatch, when?: "debounced" | "now") => void;
  /** Moves a card within the list the user can currently see. */
  moveVisible: (visibleIds: string[], fromIndex: number, toIndex: number) => void;
  moveToTop: (id: string) => void;
  remove: (id: string) => void;
  /** Writes any debounced edits immediately. */
  flush: () => void;
  /** Pulls server truth back, for when something outside this app changed it. */
  refresh: () => void;

  /** The to-do list, oldest first, with finished ones still shown. */
  todos: Todo[];
  addTodo: (text: string, priority?: TodoPriority) => void;
  toggleTodo: (id: string, done: boolean) => void;
  editTodo: (id: string, patch: TodoPatch) => void;
  removeTodo: (id: string) => void;
  clearDoneTodos: () => void;
}

const StudioContext = createContext<StudioValue | null>(null);

export function useStudio(): StudioValue {
  const value = useContext(StudioContext);
  if (!value) throw new Error("useStudio must be used inside <StudioProvider>.");
  return value;
}

export function StudioProvider({
  initialIdeas,
  initialTodos,
  children,
}: {
  initialIdeas: Idea[];
  initialTodos: Todo[];
  children: React.ReactNode;
}) {
  const [ideas, setIdeas] = useState<Idea[]>(() => normaliseRanks(initialIdeas));
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [saveState, setSaveStateRaw] = useState<SaveState>("idle");

  const todosRef = useRef(todos);
  const commitTodos = useCallback((next: Todo[]) => {
    todosRef.current = next;
    setTodos(next);
  }, []);

  // Mutations read the ref and write both, so no state updater ever has to run
  // a side effect (which React would double-invoke in development).
  const ideasRef = useRef(ideas);
  const stateRef = useRef<SaveState>("idle");
  const inFlightRef = useRef(0);
  const pendingRef = useRef(new Map<string, IdeaPatch>());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commit = useCallback((next: Idea[]) => {
    ideasRef.current = next;
    setIdeas(next);
  }, []);

  const setSaveState = useCallback((next: SaveState) => {
    stateRef.current = next;
    setSaveStateRaw(next);
  }, []);

  /** Pulls server truth back after a failed write, so the UI cannot drift. */
  const refresh = useCallback(async () => {
    try {
      const response = await fetch(`${API}/ideas`, { cache: "no-store" });
      if (!response.ok) return;
      const body = (await response.json()) as { ideas?: Idea[] };
      if (!Array.isArray(body.ideas)) return;
      commit(normaliseRanks(body.ideas));
      setSaveState("idle");
    } catch {
      // Offline. Optimistic state stays on screen and the next write retries.
    }
  }, [commit, setSaveState]);

  const send = useCallback(
    async (path: string, init: RequestInit) => {
      inFlightRef.current += 1;
      setSaveState("saving");
      try {
        const response = await fetch(path, init);
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        inFlightRef.current -= 1;
        if (inFlightRef.current === 0 && stateRef.current !== "error") setSaveState("saved");
      } catch {
        inFlightRef.current -= 1;
        setSaveState("error");
        void refresh();
      }
    },
    [refresh, setSaveState],
  );

  const persistOrder = useCallback(
    (orderedIds: string[]) => {
      void send(`${API}/reorder`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ orderedIds }),
      });
    },
    [send],
  );

  const flush = useCallback(
    (keepalive = false) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const queued = [...pendingRef.current.entries()];
      pendingRef.current.clear();

      for (const [id, patch] of queued) {
        void send(`${API}/ideas/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: JSON_HEADERS,
          body: JSON.stringify(patch),
          keepalive,
        });
      }
    },
    [send],
  );

  const update = useCallback<StudioValue["update"]>(
    (id, patch, when = "debounced") => {
      const current = ideasRef.current.find((idea) => idea.id === id);
      if (!current) return;

      const merged = syncArchiveState(
        { ...current, ...patch, updatedAt: new Date().toISOString() },
        current.archived,
      );
      commit(normaliseRanks(ideasRef.current.map((idea) => (idea.id === id ? merged : idea))));

      pendingRef.current.set(id, { ...pendingRef.current.get(id), ...patch });

      if (when === "now") {
        flush();
        return;
      }
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => flush(), AUTOSAVE_DELAY);
    },
    [commit, flush],
  );

  const create = useCallback<StudioValue["create"]>(
    (title, defaults = {}) => {
      const id = newId();
      const trimmed = title.trim();
      commit(normaliseRanks([...ideasRef.current, blankIdea(id, { ...defaults, title: trimmed })]));
      void send(`${API}/ideas`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ ...defaults, id, title: trimmed }),
      });
      return id;
    },
    [commit, send],
  );

  const moveVisible = useCallback<StudioValue["moveVisible"]>(
    (visibleIds, fromIndex, toIndex) => {
      if (fromIndex === toIndex) return;
      const fullIds = sortActive(ideasRef.current).map((idea) => idea.id);
      const orderedIds = reorderVisible(fullIds, visibleIds, fromIndex, toIndex);
      commit(applyOrder(ideasRef.current, orderedIds));
      persistOrder(orderedIds);
    },
    [commit, persistOrder],
  );

  const moveToTop = useCallback(
    (id: string) => {
      const rest = sortActive(ideasRef.current)
        .map((idea) => idea.id)
        .filter((other) => other !== id);
      const orderedIds = [id, ...rest];
      commit(applyOrder(ideasRef.current, orderedIds));
      persistOrder(orderedIds);
    },
    [commit, persistOrder],
  );

  const remove = useCallback(
    (id: string) => {
      pendingRef.current.delete(id);
      commit(normaliseRanks(ideasRef.current.filter((idea) => idea.id !== id)));
      void send(`${API}/ideas/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
    [commit, send],
  );

  // --- to-dos --------------------------------------------------------------

  const addTodo = useCallback(
    (text: string, priority: TodoPriority = DEFAULT_TODO_PRIORITY) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const id = newId();
      const now = new Date().toISOString();
      commitTodos([
        ...todosRef.current,
        {
          id,
          text: trimmed,
          notes: "",
          priority,
          due: "",
          dueTime: "",
          done: false,
          createdAt: now,
          doneAt: null,
        },
      ]);
      void send(`${API}/todos`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ id, text: trimmed, priority }),
      });
    },
    [commitTodos, send],
  );

  const patchTodo = useCallback(
    (id: string, patch: TodoPatch) => {
      commitTodos(
        todosRef.current.map((todo) =>
          todo.id === id
            ? {
                ...todo,
                ...patch,
                doneAt: patch.done === undefined ? todo.doneAt : patch.done ? new Date().toISOString() : null,
              }
            : todo,
        ),
      );
      void send(`${API}/todos/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: JSON_HEADERS,
        body: JSON.stringify(patch),
      });
    },
    [commitTodos, send],
  );

  const toggleTodo = useCallback(
    (id: string, done: boolean) => patchTodo(id, { done }),
    [patchTodo],
  );

  const editTodo = useCallback(
    (id: string, patch: TodoPatch) => patchTodo(id, patch),
    [patchTodo],
  );

  const removeTodo = useCallback(
    (id: string) => {
      commitTodos(todosRef.current.filter((todo) => todo.id !== id));
      void send(`${API}/todos/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
    [commitTodos, send],
  );

  const clearDoneTodos = useCallback(() => {
    commitTodos(todosRef.current.filter((todo) => !todo.done));
    void send(`${API}/todos`, { method: "DELETE" });
  }, [commitTodos, send]);

  // Never lose a keystroke to a closed tab or a backgrounded phone.
  useEffect(() => {
    const flushNow = () => {
      if (pendingRef.current.size > 0) flush(true);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushNow();
    };

    window.addEventListener("pagehide", flushNow);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flushNow);
      document.removeEventListener("visibilitychange", onVisibility);
      flushNow();
    };
  }, [flush]);

  // Let the "Saved" badge settle back to quiet once the write has landed.
  useEffect(() => {
    if (saveState !== "saved") return;
    const timer = setTimeout(() => setSaveState("idle"), SAVED_BADGE_DURATION);
    return () => clearTimeout(timer);
  }, [saveState, setSaveState]);

  const value = useMemo<StudioValue>(() => {
    const counts = Object.fromEntries(STATUSES.map((status) => [status, 0])) as Record<Status, number>;
    for (const idea of ideas) counts[idea.status] += 1;

    return {
      active: sortActive(ideas),
      archived: sortArchived(ideas),
      byId: new Map(ideas.map((idea) => [idea.id, idea])),
      pillars: [...new Set(ideas.map((idea) => idea.pillar.trim()).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b),
      ),
      counts,
      saveState,
      create,
      update,
      moveVisible,
      moveToTop,
      remove,
      flush: () => flush(),
      refresh: () => void refresh(),
      todos,
      addTodo,
      toggleTodo,
      editTodo,
      removeTodo,
      clearDoneTodos,
    };
  }, [
    ideas,
    saveState,
    create,
    update,
    moveVisible,
    moveToTop,
    remove,
    flush,
    refresh,
    todos,
    addTodo,
    toggleTodo,
    editTodo,
    removeTodo,
    clearDoneTodos,
  ]);

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}
