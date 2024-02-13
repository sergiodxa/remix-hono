import { Context } from "hono";
import { describe, test, expect, vi, beforeEach, afterAll } from "vitest";

import { trailingSlash } from "../src/trailing-slash";

describe(trailingSlash.name, () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterAll(() => {
		vi.resetAllMocks();
	});

	test("enforces trailing slash", async () => {
		let next = vi.fn().mockResolvedValueOnce(true);
		let c = {
			req: {
				url: "https://example.com/marketing",
			},
			redirect: vi.fn(),
		} as unknown as Context;

		let middleware = trailingSlash({ enabled: true });

		await middleware(c, next);

		expect(c.redirect).toBeCalledWith("https://example.com/marketing/");
	});

	test("calls `next` if trailing slash is enforced and already has trailing slash", async () => {
		let next = vi.fn().mockResolvedValueOnce(true);
		let c = {
			req: {
				url: "https://example.com/marketing/",
			},
			redirect: vi.fn(),
		} as unknown as Context;

		let middleware = trailingSlash({ enabled: true });

		await middleware(c, next);

		expect(c.redirect).not.toBeCalled();
		expect(next).toHaveBeenCalledOnce();
	});

	test("default removes trailing slash if any", async () => {
		let next = vi.fn().mockResolvedValueOnce(true);
		let c = {
			req: {
				url: "https://example.com/marketing/",
			},
			redirect: vi.fn(),
		} as unknown as Context;

		let middleware = trailingSlash();

		await middleware(c, next);

		expect(c.redirect).toBeCalledWith("https://example.com/marketing");
	});

	test("default calls `next` if `/`", async () => {
		let next = vi.fn().mockResolvedValueOnce(true);
		let c = {
			req: {
				url: "https://example.com/",
			},
			redirect: vi.fn(),
		} as unknown as Context;

		let middleware = trailingSlash();

		await middleware(c, next);

		expect(c.redirect).not.toBeCalled();
		expect(next).toHaveBeenCalledOnce();
	});

	test("default calls `next` if no trailing slash", async () => {
		let next = vi.fn().mockResolvedValueOnce(true);
		let c = {
			req: {
				url: "https://example.com/marketing",
			},
			redirect: vi.fn(),
		} as unknown as Context;

		let middleware = trailingSlash();

		await middleware(c, next);

		expect(c.redirect).not.toBeCalled();
		expect(next).toHaveBeenCalledOnce();
	});
});
