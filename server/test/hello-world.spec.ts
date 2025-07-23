import { expect, test } from "bun:test";
import { BASE_URL } from "~/utils/env";

test("it displays hello world", async () => {
	const response = await fetch(BASE_URL);

	expect(response.status).toBe(200);
	expect(await response.text()).toBe("Hello World!");
});
