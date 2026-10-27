import { describe, expect, it } from "vitest";
import { parseLeadCsvPreview } from "../domain/csv-import";

describe("parseLeadCsvPreview", () => {
  it("handles multiline quoted fields, escaped quotes and a BOM", () => {
    const preview = parseLeadCsvPreview(
      '\uFEFFname,email,source\r\n"Pat ""P""",pat@example.com,"Partner\nEast"',
    );
    expect(preview.issues).toEqual([]);
    expect(preview.validRows[0]).toMatchObject({
      name: 'Pat "P"',
      source: "Partner\nEast",
    });
  });
  it("blocks malformed quotes, duplicate headers and mismatched columns", () => {
    for (const csv of [
      'name,email\n"Pat,pat@example.com',
      "name,email\nPat,pat@example.com,extra",
      "name,email,email\nPat,pat@example.com,pat@example.com",
      'name,email\nPa"t,pat@example.com',
    ]) {
      expect(parseLeadCsvPreview(csv).issues.length).toBeGreaterThan(0);
    }
  });
  it("builds a usable preview with warnings for optional gaps and duplicate rows", () => {
    const preview = parseLeadCsvPreview(
      `name,email,phone,source,status\nAvery Smith,avery@example.com,,Referral,hot\nJordan Lee,jordan@example.com,+1-555-0102,,contacted\nAvery Smith,avery@example.com,+1-555-0101,Website,new`,
    );

    expect(preview.missingHeaders).toEqual([]);
    expect(preview.unknownHeaders).toEqual([]);
    expect(preview.validRows).toHaveLength(3);
    expect(preview.duplicateEmails).toEqual(["avery@example.com"]);
    expect(preview.validRows[0]).toMatchObject({
      rowNumber: 2,
      status: "hot",
    });
    expect(preview.validRows[0].warnings).toContain("No phone provided");
    expect(preview.validRows[1].warnings).toContain("No source provided");
    expect(preview.validRows[2].warnings).toContain(
      "Duplicate email appears multiple times in this import",
    );
  });

  it("reports header and row-level validation failures", () => {
    const preview = parseLeadCsvPreview(
      `name,status,owner\nBad Row,invalid,Raul\n,hot,Raul`,
    );

    expect(preview.validRows).toEqual([]);
    expect(preview.missingHeaders).toEqual(["email"]);
    expect(preview.unknownHeaders).toEqual(["owner"]);
    expect(preview.issues).toEqual([
      { rowNumber: 2, message: "Missing required email" },
      { rowNumber: 2, message: "Unsupported status: invalid" },
      { rowNumber: 3, message: "Missing required name" },
      { rowNumber: 3, message: "Missing required email" },
    ]);
  });

  it("supports quoted values with commas", () => {
    const preview = parseLeadCsvPreview(
      `name,email,source,status\n"Pat, Jr.",pat@example.com,"Partner, East",replied`,
    );

    expect(preview.validRows).toHaveLength(1);
    expect(preview.validRows[0]).toMatchObject({
      name: "Pat, Jr.",
      source: "Partner, East",
      status: "replied",
    });
  });
});
