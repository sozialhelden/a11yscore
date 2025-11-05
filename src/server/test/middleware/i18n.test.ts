import { describe, expect, it } from "bun:test";
import { BASE_URL } from "~/test/setup";

describe("e2e", () => {
  describe("i18n", () => {
    for (const { header, expected } of [
      {
        header: "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
        expected: "Ist rollstuhlgerecht",
      },
      {
        header: "en-US;q=0.8,en;q=0.7,de-DE,de;q=0.6",
        expected: "Is accessible with wheelchair",
      },
    ]) {
      it("sets the correct locale based on the accept language header", async () => {
        const response = await fetch(`${BASE_URL}/a11yscore/v1/osm-tags`, {
          headers: { "Accept-Language": header },
        });
        expect(response.status).toBe(200);
        expect(await response.text()).toContain(expected);
      });
    }

    it("falls back to the fallback locale if there is no accept language header", async () => {
      const response = await fetch(`${BASE_URL}/a11yscore/v1/osm-tags`);
      expect(response.status).toBe(200);
      expect(await response.text()).toContain("Is accessible with wheelchair");
    });
  });
});
