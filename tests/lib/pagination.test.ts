import { describe, it, expect } from "vitest";
import { parseLimit, parseOffset, parsePage } from "@/lib/pagination";

const q = (query: string) => new URLSearchParams(query);

describe("pagination params", () => {
  it.each([
    ["", 50],
    ["limit=abc", 50],
    ["limit=", 50],
    ["limit=1.5", 50],
    ["limit=-1", 1],
    ["limit=0", 1],
    ["limit=20", 20],
    ["limit=5000", 100],
  ])("limit from %j is %i", (query, expected) => {
    expect(parseLimit(q(query), 50)).toBe(expected);
  });

  it.each([
    ["", 0],
    ["offset=abc", 0],
    ["offset=-10", 0],
    ["offset=40", 40],
    ["offset=99999999999", 2_147_483_647],
  ])("offset from %j is %i", (query, expected) => {
    expect(parseOffset(q(query))).toBe(expected);
  });

  it.each([
    ["", { page: 1, limit: 12, skip: 0 }],
    ["page=0", { page: 1, limit: 12, skip: 0 }],
    ["page=-3&limit=abc", { page: 1, limit: 12, skip: 0 }],
    ["page=3&limit=10", { page: 3, limit: 10, skip: 20 }],
    ["page=99999999999&limit=100", { page: 99999999999, limit: 100, skip: 2_147_483_647 }],
  ])("page from %j", (query, expected) => {
    expect(parsePage(q(query), 12)).toEqual(expected);
  });
});
