import { describe, expect, it, vi } from "vitest";
import { artificialDelay } from "./artificialDelay.js";

describe("artificialDelay", () => {
  it("skips waiting when delay is zero", () => {
    const next = vi.fn();
    artificialDelay(0)({} as never, {} as never, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("waits before calling next when delay is set", async () => {
    vi.useFakeTimers();
    const next = vi.fn();

    artificialDelay(250)({} as never, {} as never, next);
    expect(next).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(250);
    expect(next).toHaveBeenCalledOnce();

    vi.useRealTimers();
  });
});
