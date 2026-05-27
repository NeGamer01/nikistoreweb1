import type { PanelCreationSuccess } from "./pterodactyl";

const store = globalThis as typeof globalThis & {
  __nikiPanelResults?: Map<string, PanelCreationSuccess>;
  __nikiPanelLocks?: Set<string>;
};

function results() {
  if (!store.__nikiPanelResults) store.__nikiPanelResults = new Map();
  return store.__nikiPanelResults;
}

function locks() {
  if (!store.__nikiPanelLocks) store.__nikiPanelLocks = new Set();
  return store.__nikiPanelLocks;
}

export function getPanelResult(orderId: string) {
  return results().get(orderId);
}

export function savePanelResult(orderId: string, result: PanelCreationSuccess) {
  results().set(orderId, result);
}

export function tryAcquirePanelLock(orderId: string) {
  const set = locks();
  if (set.has(orderId)) return false;
  set.add(orderId);
  return true;
}

export function releasePanelLock(orderId: string) {
  locks().delete(orderId);
}
