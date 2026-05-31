import { describe, expect, it } from "vitest";
import { toFeedbackCreateData } from "../lib/feedback";

describe("feedback capture", () => {
  it("normalizes and accepts valid feedback", () => {
    const row = toFeedbackCreateData({
      leadId: "  lead_123  ",
      source: "manual",
      notes: "  Customer asked for pricing by Friday  ",
      rating: 4,
      sentiment: "positive"
    });

    expect(row.leadId).toBe("lead_123");
    expect(row.notes).toBe("Customer asked for pricing by Friday");
    expect(row.rating).toBe(4);
  });

  it("rejects out-of-range ratings", () => {
    expect(() =>
      toFeedbackCreateData({
        leadId: "lead_1",
        source: "manual",
        notes: "text",
        rating: 6
      })
    ).toThrow(/between 1 and 5/);
  });
});
