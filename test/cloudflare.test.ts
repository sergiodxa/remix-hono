import { Context } from "hono";
import { describe, test, expect, vi } from "vitest";

import { staticAssets } from "../src/cloudflare";

describe(staticAssets.name, () => {
	test("calls `next` if the response is not 2xx", async () => {
		let fetch = vi
			.fn()
			.mockResolvedValueOnce(new Response("", { status: 404 }));
		let next = vi.fn().mockResolvedValueOnce(true);

		let url = "https://example.com";

		let middleware = staticAssets();

		await middleware(
			{
				env: { ASSETS: { fetch } },
				req: { url, raw: new Request(url) },
			} as unknown as Context,
			next,
		);

		expect(fetch).toHaveBeenCalledOnce();
		expect(next).toHaveBeenCalledOnce();
	});

	test("returns the asset if the response is 2xx", async () => {
		let fetch = vi
			.fn()
			.mockResolvedValueOnce(new Response("body", { status: 200 }));
		let next = vi.fn().mockResolvedValueOnce(true);

		let url = "https://example.com";

		let middleware = staticAssets();

		let response = await middleware(
			{
				env: { ASSETS: { fetch } },
				req: { url, raw: new Request(url) },
			} as unknown as Context,
			next,
		);

		if (!response) throw new Error("staticAssets middleware didn't return");

		expect(fetch).toHaveBeenCalledOnce();
		expect(next).not.toHaveBeenCalledOnce();

		await expect(response.text()).resolves.toBe("body");
	});
});
