import { createMiddleware } from "hono/factory";

interface Options {
	enabled?: boolean;
}

/**
 * Enable or disable trailing slashes for SEO purpose.
 */
export function trailingSlash(options?: Options) {
	return createMiddleware(async (c, next) => {
		let url = new URL(c.req.url);
		let hasTrailingSlash = url.pathname.endsWith("/");
		let isRoot = url.pathname === "/";

		if (options?.enabled && !hasTrailingSlash) {
			url.pathname += "/";
			return c.redirect(url.toString());
		}

		if (!options?.enabled && hasTrailingSlash && !isRoot) {
			url.pathname = url.pathname.slice(0, -1);
			return c.redirect(url.toString());
		}

		return await next();
	});
}
