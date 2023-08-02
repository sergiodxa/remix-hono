import { MiddlewareHandler } from "hono";

interface Options {
	enabled?: boolean;
}

/**
 * Enable or disable trailing slashes for SEO purpose.
 */
export function trailingSlash({ enabled }: Options): MiddlewareHandler {
	return async function middleware(context, next) {
		let url = new URL(context.req.url);
		let hasTrailingSlash = url.pathname.endsWith("/");

		if (enabled && !hasTrailingSlash) {
			url.pathname += "/";
			return context.redirect(url.toString());
		}

		if (!enabled && hasTrailingSlash) {
			url.pathname = url.pathname.slice(0, -1);
			return context.redirect(url.toString());
		}

		return await next();
	};
}
