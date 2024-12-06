import { afterAll, describe, expect, mock, test } from "bun:test";
import { Context } from "hono";
import { httpsOnly } from "../src/security";

describe(httpsOnly.name, () => {
	afterAll(() => {
		mock.restore();
	});

	test("calls `next` if protocol is `https`", async () => {
		let next = mock().mockResolvedValueOnce(true);
		let c = {
			req: {
				url: "https://example.com",
			},
		} as unknown as Context;

		let middleware = httpsOnly();

		await middleware(c, next);

		expect(next).toHaveBeenCalledTimes(1);
	});

	test("enforces `https`", async () => {
		let next = mock().mockResolvedValueOnce(true);
		let c = {
			req: {
				url: "http://example.com",
			},
			redirect: mock(),
		} as unknown as Context;

		let middleware = httpsOnly();

		await middleware(c, next);

		expect(next).not.toHaveBeenCalled();
		expect(c.redirect).toBeCalledWith("https://example.com/");
	});
});
