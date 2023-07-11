import type { ServerBuild } from "@remix-run/cloudflare";

import { Hono } from "hono";
import { describe, test, expect, vi, beforeEach } from "vitest";

import { remix } from "../src/cloudflare";

const build = {
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

describe("middleware", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	test("getLoadContext could return a promise value", async () => {
		let getLoadContext = vi.fn().mockResolvedValueOnce("loadContext");

		let server = new Hono();
		server.use("*", remix({ mode: "development", build, getLoadContext }));

		let response = await server.request("/");

		expect(response).toBeInstanceOf(Response);
		expect(getLoadContext).toHaveBeenCalledTimes(1);
	});

	test("getLoadContext could return a non-promise value", async () => {
		let getLoadContext = vi.fn().mockReturnValueOnce("loadContext");

		let server = new Hono();
		server.use("*", remix({ mode: "development", build, getLoadContext }));

		let response = await server.request("/");

		expect(response).toBeInstanceOf(Response);
		expect(getLoadContext).toHaveBeenCalledTimes(1);
	});

	test("getLoadContext could be omitted", async () => {
		let server = new Hono();
		server.use("*", remix({ mode: "development", build }));

		let response = await server.request("/");

		expect(response).toBeInstanceOf(Response);
	});
});
