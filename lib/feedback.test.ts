import { afterEach, describe, expect, it } from "vitest";
import { captureFeedback, listFeedback, resetFeedbackStore } from "./feedback";

describe("feedback capture", () => {
  afterEach(() => resetFeedbackStore());

  it("captures feedback for a lead", () => {
    const record = captureFeedback({
      leadId: "lead-123",
      rating: "positive",
      notes: "Strong response to follow-up",
    });

    expect(record.id).toBeTruthy();
    expect(record.leadId).toBe("lead-123");
    expect(record.rating).toBe("positive");

    const records = listFeedback("lead-123");
    expect(records).toHaveLength(1);
    expect(records[0]?.notes).toContain("Strong response");
  });

  it("rejects empty lead id", () => {
    expect(() =>
      captureFeedback({ leadId: "", rating: "neutral", notes: "N/A" }),
    ).toThrow("leadId is required");
  });
});
