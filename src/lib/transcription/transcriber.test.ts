import { describe, expect, it } from "vitest";
import { parseTranscriptJson } from "./transcriber";

const valid = {
  language: "zh",
  text: "大家好",
  englishText: "Hello everyone",
  segments: [{ start: 0, end: 1.5, text: "大家好" }],
};

describe("parseTranscriptJson", () => {
  it("accepts a well-formed transcript", () => {
    expect(parseTranscriptJson(JSON.stringify(valid))).toEqual(valid);
  });

  it("rejects text that is not JSON", () => {
    expect(() => parseTranscriptJson("Here is the transcript: ...")).toThrow("not valid JSON");
  });

  it("rejects output missing the English translation", () => {
    const missing: Partial<typeof valid> = { ...valid };
    delete missing.englishText;
    expect(() => parseTranscriptJson(JSON.stringify(missing))).toThrow("englishText");
  });

  it("rejects negative timestamps", () => {
    const bad = { ...valid, segments: [{ start: -1, end: 1, text: "x" }] };
    expect(() => parseTranscriptJson(JSON.stringify(bad))).toThrow("segments.0.start");
  });
});
