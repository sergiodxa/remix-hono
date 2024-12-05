import type { Context } from "hono";
import type { AppLoadContext, ServerBuild } from "react-router";

import { createMiddleware } from "hono/factory";
import { createRequestHandler } from "react-router";

export interface RemixMiddlewareOptions {
	build: ServerBuild;
	mode?: "development" | "production";
	getLoadContext?(c: Context): Promise<AppLoadContext> | AppLoadContext;
}

export function remix({
	mode,
	build,
	getLoadContext = (c) => c.env as unknown as AppLoadContext,
}: RemixMiddlewareOptions) {
	return createMiddleware(async (c) => {
		let requestHandler = createRequestHandler(build, mode);
		let loadContext = getLoadContext(c);
		return await requestHandler(
			c.req.raw,
			loadContext instanceof Promise ? await loadContext : loadContext,
		);
	});
}

export { createRequestHandler } from "react-router";
