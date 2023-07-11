import type { ServerBuild } from "@remix-run/cloudflare";
import type { Context } from "hono";

import { describe, test, expect, vi, beforeEach } from "vitest";

import { createHonoHandler } from "../src/cloudflare";

describe(createHonoHandler, () => {
	let build = {
		assets: {
			entry: { imports: [], module: "entry/module.js" },
			routes: {
				root: {
					hasAction: false,
					hasCatchBoundary: false,
					hasErrorBoundary: false,
					hasLoader: false,
					id: "root",
					module: "root.js",
					path: "/",
				},
			},
			url: "https://example.com",
			version: "1.0.0",
		},
		assetsBuildDirectory: "/tmp/1234",
		entry: {
			module: {
				default: () => new Response("body"),
			},
		},
		future: {
			v2_dev: true,
			v2_errorBoundary: true,
			v2_headers: true,
			v2_meta: true,
			v2_normalizeFormMethod: true,
			v2_routeConvention: true,
			unstable_postcss: false,
			unstable_tailwind: false,
		},
		publicPath: "/",
		routes: {
			root: {
				path: "/",
				id: "root",
				module: {
					default: () => new Response("body"),
				},
			},
		},
	} satisfies ServerBuild;

	let context = {
		req: { raw: new Request("https://example.com") },
	} as unknown as Context<Record<string, never>, "", Record<string, never>>;

	let getLoadContext = vi.fn().mockResolvedValue("loadContext");
	let next = vi.fn().mockResolvedValue("next");

	beforeEach(() => {
		vi.resetAllMocks();
	});

	test("should be a function", () => {
		expect(createHonoHandler).toBeInstanceOf(Function);
	});

	test("should invoke requestHandler with the correct arguments", async () => {
		let middleware = createHonoHandler({ build, getLoadContext });
		let result = await middleware(context, next);
		expect(result).toBeInstanceOf(Response);
	});

	test("should invoke getLoadContext with the correct arguments", async () => {
		let middleware = createHonoHandler({ build, getLoadContext });

		await middleware(context, next);

		expect(getLoadContext).toHaveBeenCalledWith(context);
	});
});
