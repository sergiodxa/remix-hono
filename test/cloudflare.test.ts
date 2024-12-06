import { afterAll, describe, expect, mock, test } from "bun:test";
import { createWorkersKVSessionStorage } from "@react-router/cloudflare";
import { Context } from "hono";
import { createCookieSessionStorage } from "react-router";
import {
	cookieSession,
	staticAssets,
	workerKVSession,
} from "../src/cloudflare";
import { session } from "../src/session";

describe("cloudflare", () => {
	afterAll(() => {
		mock.restore();
	});

	describe(staticAssets.name, () => {
		test("calls `next` if the response is not 2xx", async () => {
			let fetch = mock().mockResolvedValueOnce(
				new Response("", { status: 404 }),
			);
			let next = mock().mockResolvedValueOnce(true);

			let url = "https://example.com";

			let middleware = staticAssets();

			await middleware(
				{
					env: { ASSETS: { fetch } },
					req: { url, raw: new Request(url) },
				} as unknown as Context,
				next,
			);

			expect(fetch).toHaveBeenCalledTimes(1);
			expect(next).toHaveBeenCalledTimes(1);
		});

		test("returns the asset if the response is 2xx", async () => {
			let fetch = mock().mockResolvedValueOnce(
				new Response("body", { status: 200 }),
			);
			let next = mock().mockResolvedValueOnce(true);

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

			expect(fetch).toHaveBeenCalledTimes(1);
			expect(next).not.toHaveBeenCalledTimes(1);

			await expect(response.text()).resolves.toBe("body");
		});

		test("calls `next` if the fetch throw", async () => {
			let fetch = mock().mockRejectedValueOnce(new Error("Fetch error"));
			let next = mock().mockResolvedValueOnce(true);

			let url = "https://example.com";

			let middleware = staticAssets();

			await middleware(
				{
					env: { ASSETS: { fetch } },
					req: { url, raw: new Request(url) },
				} as unknown as Context,
				next,
			);

			expect(fetch).toHaveBeenCalledTimes(1);
			expect(next).toHaveBeenCalledTimes(1);
		});

		test("throws if the binding is not set", async () => {
			let next = mock().mockResolvedValueOnce(true);

			let url = "https://example.com";

			let middleware = staticAssets();

			await expect(
				middleware(
					{
						env: {},
						req: { url, raw: new Request(url) },
					} as unknown as Context,
					next,
				),
			).rejects.toThrowError("The binding ASSETS is not set.");
		});
	});

	describe(workerKVSession.name, () => {
		test("throws if the binding is not set", async () => {
			let next = mock().mockResolvedValueOnce(true);

			let middleware = workerKVSession<"KV_BINDING", "SECRET">({
				autoCommit: true,
				cookie: {
					name: "session",
					secrets(c) {
						return [c.env.SECRET];
					},
				},
				binding: "KV_BINDING",
			});

			await expect(
				middleware(
					{
						env: {},
					} as unknown as Context,
					next,
				),
			).rejects.toThrowError("The binding for the kvSession is not set.");
		});

		test("throws if the secrets for the kvSession are not set.", async () => {
			let next = mock().mockResolvedValueOnce(true);

			let middleware = workerKVSession<"KV_BINDING", "SECRET">({
				autoCommit: true,
				cookie: {
					name: "session",
					secrets(c) {
						return [c.env.SECRET];
					},
				},
				binding: "KV_BINDING",
			});

			await expect(
				middleware(
					{
						env: { KV_BINDING: "" },
					} as unknown as Context,
					next,
				),
			).rejects.toThrowError("The secrets for the kvSession are not set.");
		});

		test("calls `createWorkersKVSessionStorage`", async () => {
			let next = mock().mockResolvedValueOnce(true);

			let middleware = workerKVSession<"KV_BINDING", "SECRET">({
				autoCommit: true,
				cookie: {
					name: "session",
					secrets(c) {
						return [c.env.SECRET];
					},
				},
				binding: "KV_BINDING",
			});

			let kv = { get: mock(), put: mock() };

			middleware(
				{
					set: mock(),
					get: mock(),
					req: {
						raw: {
							headers: {
								get: mock().mockReturnValue("session=cookie"),
							},
						},
					},
					header: mock(),
					env: { KV_BINDING: kv, SECRET: "s3cr3t" },
				} as unknown as Context,
				next,
			);

			expect(session).toHaveBeenCalledTimes(3);
			expect(session).toHaveBeenCalledWith({
				autoCommit: true,
				createSessionStorage: expect.any(Function),
			});
			expect(createWorkersKVSessionStorage).toHaveBeenCalledTimes(1);
			expect(createWorkersKVSessionStorage).toHaveBeenCalledWith({
				cookie: { name: "session", secrets: ["s3cr3t"] },
				kv,
			});
		});
	});

	describe(cookieSession.name, () => {
		test("throws if the secrets for the cookieSession are not set.", async () => {
			let next = mock().mockResolvedValueOnce(true);

			let middleware = cookieSession<"SECRET">({
				autoCommit: true,
				cookie: {
					name: "session",
					secrets(c) {
						return [c.env.SECRET];
					},
				},
			});

			expect(
				middleware(
					{
						set: mock(),
						get: mock(),
						req: {
							raw: {
								headers: {
									get: mock().mockReturnValue("session=cookie"),
								},
							},
						},
						header: mock(),
						env: {},
					} as unknown as Context,
					next,
				),
			).rejects.toThrowError("The secrets for the cookieSession are not set.");
		});

		test("calls `createWorkersKVSessionStorage`", async () => {
			let next = mock().mockResolvedValueOnce(true);

			let middleware = cookieSession<"SECRET">({
				autoCommit: true,
				cookie: {
					name: "session",
					secrets(c) {
						return [c.env.SECRET];
					},
				},
			});

			middleware(
				{
					set: mock(),
					get: mock(),
					req: {
						raw: {
							headers: {
								get: mock().mockReturnValue("session=cookie"),
							},
						},
					},
					header: mock(),
					env: {
						KV_BINDING: { get: mock() },
						SECRET: "s3cr3t",
					},
				} as unknown as Context,
				next,
			);

			expect(session).toHaveBeenCalledTimes(5);
			expect(session).toHaveBeenCalledWith({
				autoCommit: true,
				createSessionStorage: expect.any(Function),
			});

			expect(createCookieSessionStorage).toHaveBeenCalledTimes(1);
			expect(createCookieSessionStorage).toHaveBeenCalledWith({
				cookie: { name: "session", secrets: ["s3cr3t"] },
			});
		});
	});
});
