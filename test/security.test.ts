import { Context } from "hono";
import { describe, test, expect, vi, beforeEach, afterAll } from "vitest";

import { httpsOnly } from "../src/security";

describe(httpsOnly.name, () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterAll(() => {
		vi.resetAllMocks();
	});

	test("calls `next` if protocol is `https`", async () => {
		let next = vi.fn().mockResolvedValueOnce(true);
		let c = {
			req: {
				url: "https://example.com",
			},
		} as unknown as Context;

		let middleware = httpsOnly();

		await middleware(c, next);

		expect(next).toHaveBeenCalledOnce();
	});

	test("enforces `https`", async () => {
		let next = vi.fn().mockResolvedValueOnce(true);
		let c = {
			req: {
				url: "http://example.com",
			},
			redirect: vi.fn(),
		} as unknown as Context;

		let middleware = httpsOnly();

		await middleware(c, next);

		expect(next).not.toHaveBeenCalled();
		expect(c.redirect).toBeCalledWith("https://example.com/");
	});
});
