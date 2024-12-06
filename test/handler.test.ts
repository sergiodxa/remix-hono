import { afterAll, describe, expect, mock, test } from "bun:test";
import { Hono } from "hono";
import type { ServerBuild } from "react-router";
import { reactRouter } from "../src/handler";

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

describe(reactRouter.name, () => {
	afterAll(() => {
		mock.restore();
	});

	test("getLoadContext could return a promise value", async () => {
		let getLoadContext = mock().mockResolvedValueOnce("loadContext");

		let server = new Hono();
		server.use(
			"*",
			reactRouter({ mode: "development", build, getLoadContext }),
		);

		let response = await server.request("/");

		expect(response).toBeInstanceOf(Response);
		expect(getLoadContext).toHaveBeenCalledTimes(1);
	});

	test("getLoadContext could return a non-promise value", async () => {
		let getLoadContext = mock().mockReturnValueOnce("loadContext");

		let server = new Hono();
		server.use(
			"*",
			reactRouter({ mode: "development", build, getLoadContext }),
		);

		let response = await server.request("/");

		expect(response).toBeInstanceOf(Response);
		expect(getLoadContext).toHaveBeenCalledTimes(1);
	});

	test("getLoadContext could be omitted", async () => {
		let server = new Hono();
		server.use("*", reactRouter({ mode: "development", build }));

		let response = await server.request("/");

		expect(response).toBeInstanceOf(Response);
	});
});
