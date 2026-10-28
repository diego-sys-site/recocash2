import { afterEach, describe, expect, it, vi } from "vitest";
import { scheduleAfterPageLoad } from "../client/src/lib/deferred-task";

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

function browser(readyState: string, idle = true) {
  let load: (() => void) | undefined;
  let idleTask: (() => void) | undefined;
  let timeoutTask: (() => void) | undefined;
  const window = {
    addEventListener: vi.fn((_event: string, callback: () => void) => { load = callback; }),
    removeEventListener: vi.fn(),
    requestIdleCallback: idle ? vi.fn((callback: () => void) => { idleTask = callback; return 7; }) : undefined,
    cancelIdleCallback: vi.fn(),
    setTimeout: vi.fn((callback: () => void) => { timeoutTask = callback; return 8; }),
    clearTimeout: vi.fn(),
  };
  vi.stubGlobal("window", window);
  vi.stubGlobal("document", { readyState });
  return { window, load: () => load?.(), idle: () => idleTask?.(), timeout: () => timeoutTask?.() };
}

describe("noncritical startup scheduling", () => {
  it("waits for page load and then browser idle before running", () => {
    const env = browser("loading");
    const work = vi.fn();
    scheduleAfterPageLoad(work);
    expect(work).not.toHaveBeenCalled();
    expect(env.window.requestIdleCallback).not.toHaveBeenCalled();
    env.load();
    expect(env.window.requestIdleCallback).toHaveBeenCalledWith(expect.any(Function), { timeout: 2000 });
    expect(work).not.toHaveBeenCalled();
    env.idle();
    expect(work).toHaveBeenCalledTimes(1);
  });

  it("schedules idle immediately after an already-completed page load", () => {
    const env = browser("complete");
    const work = vi.fn();
    scheduleAfterPageLoad(work);
    expect(env.window.addEventListener).not.toHaveBeenCalled();
    env.idle();
    expect(work).toHaveBeenCalledTimes(1);
  });

  it("cancels scheduled work on unmount", () => {
    const env = browser("complete");
    const work = vi.fn();
    const cancel = scheduleAfterPageLoad(work);
    cancel();
    env.idle();
    expect(work).not.toHaveBeenCalled();
    expect(env.window.cancelIdleCallback).toHaveBeenCalledWith(7);
  });

  it("uses and cancels a timer fallback when idle callbacks are unavailable", () => {
    const env = browser("complete", false);
    const work = vi.fn();
    const cancel = scheduleAfterPageLoad(work);
    expect(env.window.setTimeout).toHaveBeenCalledWith(expect.any(Function), 120);
    cancel();
    env.timeout();
    expect(work).not.toHaveBeenCalled();
    expect(env.window.clearTimeout).toHaveBeenCalledWith(8);
  });
});
