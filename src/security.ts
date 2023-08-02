import type { MiddlewareHandler } from "hono";

/**
 * Enforce HTTPS connections.
 */
export function httpsOnly(): MiddlewareHandler {
	return async function middleware(context, next) {
		let url = new URL(context.req.url);
		if (url.protocol !== "http:") return await next();
		url.protocol = "https:";
		context.redirect(url.toString());
	};
}
