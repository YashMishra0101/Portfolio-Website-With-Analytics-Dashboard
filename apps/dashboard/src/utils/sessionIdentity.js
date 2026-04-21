const CLIENT_ID_KEY = "adminClientId";
const SESSION_ID_KEY = "adminSessionId";
const SESSION_STARTED_AT_KEY = "adminSessionStartedAt";

const scopedKey = (key, displayMode) => `${key}:${displayMode}`;

const createId = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
};

export const getAdminClientId = (displayMode = getDisplayMode()) => {
  const key = scopedKey(CLIENT_ID_KEY, displayMode);
  const existingId = localStorage.getItem(key);
  if (existingId) return existingId;

  const newId = createId();
  localStorage.setItem(key, newId);
  return newId;
};

export const createAdminSession = () => {
  const displayMode = getDisplayMode();

  return {
    id: createId(),
    clientId: getAdminClientId(displayMode),
    startedAt: Date.now(),
    displayMode,
  };
};

export const persistAdminSession = (session) => {
  localStorage.setItem(scopedKey(SESSION_ID_KEY, session.displayMode), session.id);
  localStorage.setItem(
    scopedKey(SESSION_STARTED_AT_KEY, session.displayMode),
    session.startedAt.toString()
  );
};

export const getStoredAdminSession = () => {
  const displayMode = getDisplayMode();

  return {
    id: localStorage.getItem(scopedKey(SESSION_ID_KEY, displayMode)),
    startedAt: localStorage.getItem(scopedKey(SESSION_STARTED_AT_KEY, displayMode)),
    clientId: localStorage.getItem(scopedKey(CLIENT_ID_KEY, displayMode)),
    displayMode,
  };
};

export const clearStoredAdminSession = () => {
  const displayMode = getDisplayMode();
  localStorage.removeItem(scopedKey(SESSION_ID_KEY, displayMode));
  localStorage.removeItem(scopedKey(SESSION_STARTED_AT_KEY, displayMode));
};

export function getDisplayMode() {
  if (window.matchMedia?.("(display-mode: standalone)").matches) {
    return "standalone";
  }

  if (window.matchMedia?.("(display-mode: fullscreen)").matches) {
    return "fullscreen";
  }

  if (window.matchMedia?.("(display-mode: minimal-ui)").matches) {
    return "minimal-ui";
  }

  if (navigator.standalone) {
    return "standalone";
  }

  return "browser";
}

export const getDisplayModeLabel = (displayMode) => {
  if (displayMode === "standalone" || displayMode === "fullscreen") {
    return "Installed App";
  }

  if (displayMode === "minimal-ui") {
    return "Minimal UI";
  }

  return "Browser";
};
