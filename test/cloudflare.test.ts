import { createWorkersKVSessionStorage } from "@react-router/cloudflare";
import { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { createCookieSessionStorage } from "react-router";
import { describe, test, expect, vi, beforeEach, afterAll } from "vitest";

import {
	cookieSession,
	staticAssets,
	workerKVSession,
} from "../src/cloudflare";
import { session } from "../src/session";

vi.mock("@react-router/cloudflare", () => {
	return {
		createWorkersKVSessionStorage: vi.fn(),
	};
});
vi.mock("react-router", () => {
	return {
		createCookieSessionStorage: vi.fn(),
	};
});

vi.mock("../src/session.ts", () => {
	return {
		session: vi
			.fn()
			.mockImplementation(
				(options: {
					autoCommit?: boolean;
					createSessionStorage(c: Context): void;
				}) =>
					createMiddleware(async (c) => {
						options.createSessionStorage(c);
					}),
			),
	};
});

describe("middleware", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterAll(() => {
		vi.resetAllMocks();
	});

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

		test("calls `next` if the fetch throw", async () => {
			let fetch = vi.fn().mockRejectedValueOnce(new Error("Fetch error"));
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

		test("throws if the binding is not set", async () => {
			let next = vi.fn().mockResolvedValueOnce(true);

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
			let next = vi.fn().mockResolvedValueOnce(true);

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
			let next = vi.fn().mockResolvedValueOnce(true);

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
			let next = vi.fn().mockResolvedValueOnce(true);

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

			middleware(
				{
					env: { KV_BINDING: "kv", SECRET: "s3cr3t" },
				} as unknown as Context,
				next,
			);

			expect(session).toHaveBeenCalledTimes(1);
			expect(session).toHaveBeenCalledWith({
				autoCommit: true,
				createSessionStorage: expect.any(Function),
			});
			expect(createWorkersKVSessionStorage).toHaveBeenCalledTimes(1);
			expect(createWorkersKVSessionStorage).toHaveBeenCalledWith({
				cookie: { name: "session", secrets: ["s3cr3t"] },
				kv: "kv",
			});
		});
	});

	describe(cookieSession.name, () => {
		test("throws if the secrets for the cookieSession are not set.", async () => {
			let next = vi.fn().mockResolvedValueOnce(true);

			let middleware = cookieSession<"SECRET">({
				autoCommit: true,
				cookie: {
					name: "session",
					secrets(c) {
						return [c.env.SECRET];
					},
				},
			});

			await expect(
				middleware(
					{
						env: {},
					} as unknown as Context,
					next,
				),
			).rejects.toThrowError("The secrets for the cookieSession are not set.");
		});

		test("calls `createWorkersKVSessionStorage`", async () => {
			let next = vi.fn().mockResolvedValueOnce(true);

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
					env: { KV_BINDING: "kv", SECRET: "s3cr3t" },
				} as unknown as Context,
				next,
			);

			expect(session).toHaveBeenCalledTimes(1);
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
