import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import type { AppLoadContext, ServerBuild } from "react-router";
import { createRequestHandler } from "react-router";

export interface ReactRouterMiddlewareOptions {
	build: ServerBuild;
	mode?: "development" | "production";
	getLoadContext?(c: Context): Promise<AppLoadContext> | AppLoadContext;
}

export function reactRouter({
	mode,
	build,
	getLoadContext = (c) => c.env as unknown as AppLoadContext,
}: ReactRouterMiddlewareOptions) {
	return createMiddleware(async (c) => {
		let requestHandler = createRequestHandler(build, mode);
		let loadContext = getLoadContext(c);
		return await requestHandler(
			c.req.raw,
			loadContext instanceof Promise ? await loadContext : loadContext,
		);
	});
}
