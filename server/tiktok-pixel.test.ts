import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const PIXEL_ID = "D7MN3UJC77U1944D4IPG";
const SDK_URL = "https://analytics.tiktok.com/i18n/pixel/events.js";
const SCRIPT_ID = "cashgift-tiktok-pixel-sdk";

type Command = [string, ...unknown[]];
type Queue = Command[] & {
  _i?: Record<string, Queue>;
  _t?: Record<string, number>;
  _o?: Record<string, Record<string, unknown>>;
  _u?: string;
};

type FakeScript = {
  id: string;
  type: string;
  async: boolean;
  src: string;
};

type StorageMock = Pick<Storage, "getItem" | "setItem">;

function createStorage(initial: Record<string, string> = {}): StorageMock {
  const values = new Map(Object.entries(initial));

  return {
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value);
    }),
  };
}

function createBrowser(storage: StorageMock, globalPrivacyControl = false) {
  const scripts: FakeScript[] = [];
  const document = {
    createElement: vi.fn(() => ({ id: "", type: "", async: false, src: "" }) as FakeScript),
    getElementById: vi.fn((id: string) => scripts.find((script) => script.id === id) ?? null),
    head: {
      appendChild: vi.fn((script: FakeScript) => {
        scripts.push(script);
        return script;
      }),
    },
  };
  const window = { localStorage: storage, navigator: { globalPrivacyControl } };

  vi.stubGlobal("window", window);
  vi.stubGlobal("document", document);
  vi.stubGlobal("localStorage", storage);

  return { document, scripts, window };
}

function getQueue(window: object): Queue {
  return (window as { ttq?: Queue }).ttq ?? ([] as Queue);
}

function commands(queue: Queue, method: string): Command[] {
  return queue.filter(([queuedMethod]) => queuedMethod === method);
}

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("TikTok Pixel US-focused privacy choices", () => {
  it("enables default tracking without recording it as affirmative visitor consent", async () => {
    const storage = createStorage();
    const { scripts, window } = createBrowser(storage);
    const pixel = await import("../client/src/lib/tiktok-pixel");

    expect(pixel.getTrackingChoice()).toBeNull();
    expect(pixel.isTikTokTrackingAllowed()).toBe(true);
    pixel.initializeTikTokPixel();
    expect(pixel.trackFinalCta()).toBe(true);
    expect(scripts).toHaveLength(1);
    expect(commands(getQueue(window), "track")).toEqual([["track", "clickbutton"]]);
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("preserves a saved opt-out and does not load the pixel or send events", async () => {
    const storage = createStorage({ "cashgift-tiktok-consent": "false" });
    const { scripts, window } = createBrowser(storage);
    const pixel = await import("../client/src/lib/tiktok-pixel");

    expect(pixel.getTrackingChoice()).toBe(false);
    pixel.initializeTikTokPixel();
    expect(pixel.trackFinalCta()).toBe(false);
    expect(scripts).toHaveLength(0);
    expect((window as { ttq?: Queue }).ttq).toBeUndefined();
  });

  it("honors Global Privacy Control before loading even if tracking was saved as enabled", async () => {
    const storage = createStorage({ "cashgift-tiktok-consent": "true" });
    const { scripts, window } = createBrowser(storage, true);
    const pixel = await import("../client/src/lib/tiktok-pixel");

    expect(pixel.isGlobalPrivacyControlEnabled()).toBe(true);
    expect(pixel.isTikTokTrackingAllowed()).toBe(false);
    pixel.initializeTikTokPixel();
    expect(pixel.trackFinalCta()).toBe(false);
    pixel.setTrackingChoice(true);
    expect(pixel.isTikTokTrackingAllowed()).toBe(false);
    expect(pixel.getTrackingChoice()).toBe(false);
    expect(scripts).toHaveLength(0);
    expect((window as { ttq?: Queue }).ttq).toBeUndefined();
  });

  it("revokes an initialized pixel when Global Privacy Control becomes active", async () => {
    const storage = createStorage();
    const { window } = createBrowser(storage);
    const pixel = await import("../client/src/lib/tiktok-pixel");
    pixel.initializeTikTokPixel();
    window.navigator.globalPrivacyControl = true;

    expect(pixel.trackFinalCta()).toBe(false);
    expect(pixel.getTrackingChoice()).toBe(false);
    const queue = getQueue(window);
    expect(commands(queue, "revokeConsent")).toEqual([["revokeConsent"]]);
    expect(commands(queue, "holdConsent")).toEqual([["holdConsent"]]);
    expect(commands(queue, "track")).toHaveLength(0);
  });

  it("loads the supplied SDK ID and queues one page call after affirmative consent", async () => {
    const storage = createStorage();
    const { scripts, window } = createBrowser(storage);
    const pixel = await import("../client/src/lib/tiktok-pixel");

    pixel.setTrackingChoice(true);

    const queue = getQueue(window);
    expect(storage.setItem).toHaveBeenCalledWith("cashgift-tiktok-consent", "true");
    expect((window as { TiktokAnalyticsObject?: string }).TiktokAnalyticsObject).toBe("ttq");
    expect(scripts).toEqual([
      expect.objectContaining({
        id: SCRIPT_ID,
        type: "text/javascript",
        async: true,
        src: `${SDK_URL}?sdkid=${PIXEL_ID}&lib=ttq`,
      }),
    ]);
    expect(queue._i?.[PIXEL_ID]?._u).toBe(SDK_URL);
    expect(queue._t?.[PIXEL_ID]).toEqual(expect.any(Number));
    expect(queue._o?.[PIXEL_ID]).toEqual({});
    expect(commands(queue, "page")).toEqual([["page"]]);
  });

  it("tracks the exact lowercase custom CTA event once per invocation", async () => {
    const storage = createStorage();
    const { window } = createBrowser(storage);
    const pixel = await import("../client/src/lib/tiktok-pixel");

    pixel.setTrackingChoice(true);

    expect(pixel.trackFinalCta()).toBe(true);
    const queue = getQueue(window);
    expect(commands(queue, "track")).toEqual([["track", "clickbutton"]]);
  });

  it("does not duplicate the SDK script or page call on repeated initialization", async () => {
    const storage = createStorage();
    const { scripts, window } = createBrowser(storage);
    const pixel = await import("../client/src/lib/tiktok-pixel");

    pixel.setTrackingChoice(true);
    pixel.initializeTikTokPixel();
    pixel.initializeTikTokPixel();
    pixel.setTrackingChoice(true);

    const queue = getQueue(window);
    expect(scripts).toHaveLength(1);
    expect(commands(queue, "page")).toEqual([["page"]]);
    expect(Object.keys(queue._i ?? {})).toEqual([PIXEL_ID]);
  });

  it("revokes and holds consent after denial, then prevents CTA tracking", async () => {
    const storage = createStorage();
    const { window } = createBrowser(storage);
    const pixel = await import("../client/src/lib/tiktok-pixel");

    pixel.setTrackingChoice(true);
    pixel.setTrackingChoice(false);

    const queue = getQueue(window);
    expect(commands(queue, "revokeConsent")).toEqual([["revokeConsent"]]);
    expect(commands(queue, "holdConsent")).toEqual([["holdConsent"]]);
    expect(pixel.trackFinalCta()).toBe(false);
    expect(commands(queue, "track")).toHaveLength(0);
  });

  it("uses the in-memory choice when browser storage throws", async () => {
    const failingStorage: StorageMock = {
      getItem: vi.fn(() => {
        throw new Error("storage unavailable");
      }),
      setItem: vi.fn(() => {
        throw new Error("storage unavailable");
      }),
    };
    const { scripts } = createBrowser(failingStorage);
    const pixel = await import("../client/src/lib/tiktok-pixel");

    pixel.setTrackingChoice(true);

    expect(pixel.getTrackingChoice()).toBe(true);
    expect(scripts).toHaveLength(1);

    pixel.setTrackingChoice(false);
    expect(pixel.getTrackingChoice()).toBe(false);
    expect(pixel.trackFinalCta()).toBe(false);
  });

  it("honors an in-page opt-out when storage is readable but cannot be written", async () => {
    const storage = createStorage();
    storage.setItem = vi.fn(() => { throw new Error("write blocked"); });
    createBrowser(storage);
    const pixel = await import("../client/src/lib/tiktok-pixel");

    pixel.setTrackingChoice(false);
    expect(pixel.getTrackingChoice()).toBe(false);
    expect(pixel.isTikTokTrackingAllowed()).toBe(false);
    expect(pixel.trackFinalCta()).toBe(false);
  });
});
