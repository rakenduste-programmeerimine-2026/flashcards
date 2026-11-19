import { describe, expect, it } from "vitest";
import { createMemoryRateLimiter } from "./index";

function limiter(limit = 3, windowMs = 60_000) {
  const clock = { now: 1_000_000 };
  return {
    clock,
    limiter: createMemoryRateLimiter({ limit, windowMs, now: () => clock.now }),
  };
}

describe("memory rate limiter", () => {
  it("allows up to the limit and then says how long to wait", () => {
    const { limiter: l, clock } = limiter(3);

    expect(l.check("a")).toEqual({ allowed: true });
    clock.now += 10_000;
    expect(l.check("a")).toEqual({ allowed: true });
    expect(l.check("a")).toEqual({ allowed: true });

    // The oldest request was 10 s ago, so it leaves the window in 50 s.
    expect(l.check("a")).toEqual({ allowed: false, retryAfterSeconds: 50 });
  });

  it("lets requests through again once the oldest one leaves the window", () => {
    const { limiter: l, clock } = limiter(2);
    l.check("a");
    l.check("a");
    expect(l.check("a").allowed).toBe(false);

    clock.now += 60_001;

    expect(l.check("a")).toEqual({ allowed: true });
  });

  it("does not count rejected requests, so waiting always works", () => {
    const { limiter: l, clock } = limiter(1);
    l.check("a");
    for (let i = 0; i < 20; i++) {
      clock.now += 1000;
      expect(l.check("a").allowed).toBe(false);
    }

    clock.now += 40_001; // 60 s after the one accepted request

    expect(l.check("a").allowed).toBe(true);
  });

  it("keeps a separate allowance for every key", () => {
    const { limiter: l } = limiter(1);

    expect(l.check("a").allowed).toBe(true);
    expect(l.check("a").allowed).toBe(false);
    expect(l.check("b").allowed).toBe(true);
  });

  it("never asks to wait less than a second", () => {
    const { limiter: l, clock } = limiter(1, 1000);
    l.check("a");
    clock.now += 999;

    expect(l.check("a")).toEqual({ allowed: false, retryAfterSeconds: 1 });
  });
});
