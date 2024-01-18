import { createMiddleware } from "hono/factory";

/**
 * Enforce HTTPS connections.
 */
export function httpsOnly() {
	return createMiddleware(async (c, next) => {
		let url = new URL(c.req.url);

		if (url.protocol !== "http:") {
			return await next();
		}

		url.protocol = "https:";
		c.redirect(url.toString());
	});
}
