import { describe, expect, it } from "vitest";
import { readVisualTestFixture } from "./useVisualTest";

describe("readVisualTestFixture", () => {
  it("keeps the fixture disabled without the explicit development flag", () => {
    expect(readVisualTestFixture("?locale=zh-CN&workflowStep=2")).toEqual({ enabled: false });
  });

  it("parses every supported deterministic state", () => {
    expect(readVisualTestFixture(
      "?visualTest=1&locale=zh-CN&verbIndex=7&taskIndex=4&unifiesProgress=.75&workflowStep=2&mediaTime=12.5",
    )).toEqual({
      enabled: true,
      locale: "zh-CN",
      verbIndex: 7,
      taskIndex: 4,
      unifiesProgress: 0.75,
      workflowStep: 2,
      mediaTime: 12.5,
    });
  });

  it("rejects invalid values and bounds numeric states", () => {
    expect(readVisualTestFixture(
      "?visualTest=1&locale=fr&verbIndex=-3&taskIndex=999&unifiesProgress=2&workflowStep=1.7&mediaTime=nope",
    )).toEqual({
      enabled: true,
      locale: undefined,
      verbIndex: 0,
      taskIndex: 99,
      unifiesProgress: 1,
      workflowStep: 2,
      mediaTime: undefined,
    });
  });
});
