import { describe, expect, it } from "bun:test";
import { BASE_URL } from "~/test/utils/setup";

describe("e2e", () => {
  describe("i18n", () => {
    it("sets the correct locale based on the accept language header", async () => {
      const response = await fetch(BASE_URL, {
        headers: {
          "Accept-Language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7",
        },
      });
      expect(response.status).toBe(200);
      expect(await response.text()).toBe("Hallo Welt!");
    });

    it("falls back to the fallback locale if there is no accept language header", async () => {
      const response = await fetch(BASE_URL);
      expect(response.status).toBe(200);
      expect(await response.text()).toBe("Hello World!");
    });
  });
});
