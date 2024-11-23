import type { ServerBuild } from "react-router";

import { Hono } from "hono";
import { describe, test, expect, vi, beforeEach, afterAll } from "vitest";

import { remix } from "../src/handler";

const build = {
	assets: {
		entry: { imports: [], module: "entry/module.js" },
		routes: {
			root: {
				hasAction: false,
				hasErrorBoundary: false,
				hasLoader: false,
				hasClientAction: false,
				hasClientLoader: false,
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
	future: {},
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
	isSpaMode: false,
} satisfies ServerBuild;

describe(remix.name, () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterAll(() => {
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
