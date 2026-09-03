import { describe, it, expect } from "vitest";
import { classifyError } from "../src/fallback/error-classifier.js";
import { ProviderRequestError } from "../src/types/index.js";

describe("error-classifier", () => {
  it("429 → RATE_LIMIT + fallbackable", () => {
    const c = classifyError(new ProviderRequestError("rl", 429, { error: {} }));
    expect(c.type).toBe("RATE_LIMIT");
    expect(c.fallbackable).toBe(true);
  });

  it("429 with quota body → QUOTA + fallbackable", () => {
    const c = classifyError(
      new ProviderRequestError("q", 429, { error: { message: "insufficient_quota" } })
    );
    expect(c.type).toBe("QUOTA");
    expect(c.fallbackable).toBe(true);
  });

  it("500 → SERVER_ERROR + fallbackable", () => {
    const c = classifyError(new ProviderRequestError("boom", 500));
    expect(c.type).toBe("SERVER_ERROR");
    expect(c.fallbackable).toBe(true);
  });

  it("504 → TIMEOUT + fallbackable", () => {
    const c = classifyError(new ProviderRequestError("t", 504));
    expect(c.type).toBe("TIMEOUT");
    expect(c.fallbackable).toBe(true);
  });

  it("401 → AUTH + NOT fallbackable", () => {
    const c = classifyError(new ProviderRequestError("nope", 401));
    expect(c.type).toBe("AUTH");
    expect(c.fallbackable).toBe(false);
  });

  it("400 → BAD_REQUEST + NOT fallbackable", () => {
    const c = classifyError(new ProviderRequestError("bad", 400));
    expect(c.type).toBe("BAD_REQUEST");
    expect(c.fallbackable).toBe(false);
  });

  it("AbortError → TIMEOUT + fallbackable", () => {
    const err = Object.assign(new Error("The operation was aborted"), {
      name: "AbortError",
    });
    const c = classifyError(err);
    expect(c.type).toBe("TIMEOUT");
    expect(c.fallbackable).toBe(true);
  });

  it("ECONNRESET → CONNECTION + fallbackable", () => {
    const err = Object.assign(new Error("socket hang up"), {
      code: "ECONNRESET",
    });
    const c = classifyError(err);
    expect(c.type).toBe("CONNECTION");
    expect(c.fallbackable).toBe(true);
  });

  it("not implemented → NOT_IMPLEMENTED + NOT fallbackable", () => {
    const c = classifyError(new Error("Google adapter not implemented in MVP"));
    expect(c.type).toBe("NOT_IMPLEMENTED");
    expect(c.fallbackable).toBe(false);
  });
});
