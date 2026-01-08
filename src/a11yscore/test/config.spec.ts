import { describe, expect, it } from "vitest";
import { addIdToConfigEntries } from "../utils/config";

describe("addIdToConfigEntries", () => {
  it("adds an id property to config entries", () => {
    const input = {
      foo: { value: 1 },
      bar: { value: 2 },
    };
    const expected = {
      foo: { id: "foo", value: 1 },
      bar: { id: "bar", value: 2 },
    };
    expect(addIdToConfigEntries<string, { value: number }>(input)).toEqual(
      expected,
    );
  });
});
