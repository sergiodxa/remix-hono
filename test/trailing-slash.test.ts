import { describe, test, expect, mock, afterAll } from "bun:test";
import { Context } from "hono";

import { trailingSlash } from "../src/trailing-slash";

describe(trailingSlash.name, () => {
	afterAll(() => {
		mock.restore();
	});

	test("enforces trailing slash", async () => {
		let next = mock().mockResolvedValueOnce(true);
		let c = {
			req: {
				url: "https://example.com/marketing",
			},
			redirect: mock(),
		} as unknown as Context;

		let middleware = trailingSlash({ enabled: true });

		await middleware(c, next);

		expect(c.redirect).toBeCalledWith("https://example.com/marketing/");
	});

	test("calls `next` if trailing slash is enforced and already has trailing slash", async () => {
		let next = mock().mockResolvedValueOnce(true);
		let c = {
			req: {
				url: "https://example.com/marketing/",
			},
			redirect: mock(),
		} as unknown as Context;

		let middleware = trailingSlash({ enabled: true });

		await middleware(c, next);

		expect(c.redirect).not.toBeCalled();
		expect(next).toHaveBeenCalledTimes(1);
	});

	test("default removes trailing slash if any", async () => {
		let next = mock().mockResolvedValueOnce(true);
		let c = {
			req: {
				url: "https://example.com/marketing/",
			},
			redirect: mock(),
		} as unknown as Context;

		let middleware = trailingSlash();

		await middleware(c, next);

		expect(c.redirect).toBeCalledWith("https://example.com/marketing");
	});

	test("default calls `next` if `/`", async () => {
		let next = mock().mockResolvedValueOnce(true);
		let c = {
			req: {
				url: "https://example.com/",
			},
			redirect: mock(),
		} as unknown as Context;

		let middleware = trailingSlash();

		await middleware(c, next);

		expect(c.redirect).not.toBeCalled();
		expect(next).toHaveBeenCalledTimes(1);
	});

	test("default calls `next` if no trailing slash", async () => {
		let next = mock().mockResolvedValueOnce(true);
		let c = {
			req: {
				url: "https://example.com/marketing",
			},
			redirect: mock(),
		} as unknown as Context;

		let middleware = trailingSlash();

		await middleware(c, next);

		expect(c.redirect).not.toBeCalled();
		expect(next).toHaveBeenCalledTimes(1);
	});
});
