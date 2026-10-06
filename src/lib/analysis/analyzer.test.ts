import { describe, expect, it } from "vitest";
import { AnalysisOutputError, parseAnalysisJson } from "./analyzer";

const valid = {
  coreQuestion: "Why do I get jealous when my friend succeeds?",
  summary: "Jealousy often signals an unmet need.",
  audienceRelevance: "Most readers have felt this.",
  claims: [
    { text: "Jealousy points to what we want.", type: "teacher_statement", framing: "According to the teacher's framework..." },
  ],
  identifyingDetails: [],
};

describe("parseAnalysisJson", () => {
  it("accepts a well-formed analysis", () => {
    expect(parseAnalysisJson(JSON.stringify(valid))).toEqual(valid);
  });

  it("rejects an unknown claim type", () => {
    const bad = { ...valid, claims: [{ text: "x", type: "opinion", framing: "" }] };
    expect(() => parseAnalysisJson(JSON.stringify(bad))).toThrow("claims.0.type");
  });

  it("rejects output that is not JSON", () => {
    expect(() => parseAnalysisJson("Sure! Here is the analysis")).toThrow("not valid JSON");
  });

  it("flags bad output as an escalation error", () => {
    expect(() => parseAnalysisJson("not json")).toThrow(AnalysisOutputError);
  });
});
