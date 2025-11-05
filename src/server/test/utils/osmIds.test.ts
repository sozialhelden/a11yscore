import { describe, expect, test } from "bun:test";
import { decodeOsmId, encodeOsmId } from "~/utils/osmIds";

describe("unit", () => {
  describe("osmIds", () => {
    for (const { osmId, encoded } of [
      {
        osmId: 123456,
        encoded: "w3yzen",
      },
      {
        osmId: -83930,
        encoded: "rp4q9z",
      },
      {
        osmId: 0,
        encoded: "wy9",
      },
    ]) {
      test("it should encode osm-ids as hashid", () => {
        expect(encodeOsmId(osmId)).toBe(encoded);
      });
      test("it should decode hashid as osm-ids", () => {
        expect(decodeOsmId(encoded)).toBe(osmId);
      });
    }
  });
});
