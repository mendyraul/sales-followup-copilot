import { describe, it, expect } from "vitest";
import { normalizeFeedback } from "../lib/feedback-capture.js";

describe("feedback capture", () => {
  it("normalizes valid payload", () => {
    const out = normalizeFeedback({
      issueId: " lead-1 ",
      message: "  Customer asked for a discount.  ",
      source: "ui",
      sentiment: "negative"
    });

    expect(out.issueId).toBe("lead-1");
    expect(out.message).toBe("Customer asked for a discount.");
    expect(out.source).toBe("ui");
    expect(out.sentiment).toBe("negative");
    expect(out.createdAt).toBeTruthy();
  });

  it("defaults source to manual", () => {
    const out = normalizeFeedback({ issueId: "a", message: "ok" });
    expect(out.source).toBe("manual");
  });

  it("rejects invalid source", () => {
    expect(() => normalizeFeedback({ issueId: "a", message: "ok", source: "sms" })).toThrow(/invalid source/);
  });
});
