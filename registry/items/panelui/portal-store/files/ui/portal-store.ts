import type { ReactNode } from 'react';

/** One portal's content, and whether it is on its way out. */
export interface PortalEntry {
  node: ReactNode;
  /**
   * Set for the one frame between the owner going away and the content being
   * removed. The host stops the entry taking touches while it is set.
   */
  leaving: boolean;
}

export type PortalMap = ReadonlyMap<string, PortalEntry>;

/** Runs `callback` on a later frame and returns a function that cancels it. */
export type PortalScheduler = (callback: () => void) => () => void;

const nextFrame: PortalScheduler = (callback) => {
  if (typeof requestAnimationFrame === 'function') {
    const id = requestAnimationFrame(callback);
    return () => cancelAnimationFrame(id);
  }
  const id = setTimeout(callback, 16);
  return () => clearTimeout(id);
};

/**
 * What every portal has put on screen, keyed by portal.
 *
 * Removal takes two commits rather than one. An overlay's views usually carry
 * an `exiting` animation, and Reanimated keeps a removed view on screen until
 * that animation ends. The view keeps the props it had when it was removed but
 * not its handlers, so a full-screen backdrop left fading out takes every touch
 * and does nothing with it: a tap on the button that opened the overlay is
 * simply lost. So `unmount` first marks the entry `leaving`, which the host
 * turns into `pointerEvents="none"`, and removes it a frame later. Whatever
 * stays behind to animate has already stopped taking touches.
 */
export class PortalStore {
  private portals = new Map<string, PortalEntry>();
  private snapshot: PortalMap = this.portals;
  private listeners = new Set<() => void>();
  private pending = new Map<string, () => void>();
  private schedule: PortalScheduler;

  constructor(schedule: PortalScheduler = nextFrame) {
    this.schedule = schedule;
  }

  mount = (key: string, node: ReactNode) => {
    // A remount inside the leaving frame (StrictMode, or a quick reopen) keeps
    // the entry instead of losing it to the removal already scheduled.
    this.cancel(key);
    this.portals.set(key, { node, leaving: false });
    this.emit();
  };

  unmount = (key: string) => {
    const entry = this.portals.get(key);
    if (!entry || entry.leaving) return;
    this.portals.set(key, { node: entry.node, leaving: true });
    this.emit();
    this.pending.set(
      key,
      this.schedule(() => {
        this.pending.delete(key);
        if (!this.portals.get(key)?.leaving) return;
        this.portals.delete(key);
        this.emit();
      })
    );
  };

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  getSnapshot = (): PortalMap => this.snapshot;

  private cancel(key: string) {
    const cancel = this.pending.get(key);
    if (!cancel) return;
    cancel();
    this.pending.delete(key);
  }

  private emit() {
    this.snapshot = new Map(this.portals);
    this.listeners.forEach((listener) => listener());
  }
}
