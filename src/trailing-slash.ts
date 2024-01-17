import { createMiddleware } from "hono/factory";

interface Options {
	enabled?: boolean;
}

/**
 * Enable or disable trailing slashes for SEO purpose.
 */
export function trailingSlash({ enabled }: Options) {
	return createMiddleware(async (c, next) => {
		let url = new URL(c.req.url);
		let hasTrailingSlash = url.pathname.endsWith("/");

		if (enabled && !hasTrailingSlash) {
			url.pathname += "/";
			return c.redirect(url.toString());
		}

		if (!enabled && hasTrailingSlash) {
			url.pathname = url.pathname.slice(0, -1);
			return c.redirect(url.toString());
		}

		return await next();
	});
}
