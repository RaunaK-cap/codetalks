import { describe, expect, test } from "bun:test";
import { InterviewStatus } from "@repo/contracts";
import { assertMove, canMove, isTerminal } from "./interview-machine";

describe("interview machine", () => {
  test("happy path is allowed", () => {
    expect(canMove("preparing", "ready")).toBe(true);
    expect(canMove("ready", "live")).toBe(true);
    expect(canMove("live", "finishing")).toBe(true);
    expect(canMove("finishing", "reported")).toBe(true);
  });

  test("cannot skip the call or go backwards", () => {
    expect(canMove("ready", "reported")).toBe(false);
    expect(canMove("live", "ready")).toBe(false);
    expect(canMove("reported", "live")).toBe(false);
  });

  test("a live call can only end by finishing, never by failing", () => {
    expect(canMove("live", "failed")).toBe(false);
  });

  test("terminal states have no exits", () => {
    for (const s of InterviewStatus.options) {
      expect(isTerminal(s)).toBe(["reported", "report_failed", "failed"].includes(s));
    }
  });

  test("assertMove throws a 409", () => {
    expect(() => assertMove("reported", "live")).toThrow(/cannot become live/);
  });
});
