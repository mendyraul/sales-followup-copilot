import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HomePage from "../app/workspace-page";
describe("workspace loading state", () => {
  it("shows the local demo boundary while loading saved data", () => {
    const html = renderToStaticMarkup(<HomePage />);
    expect(html).toContain("SENDING DISABLED");
    expect(html).toContain("Opening your workspace");
    expect(html).not.toContain("Acme Dental");
  });
});
