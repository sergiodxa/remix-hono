import { createMiddleware } from "hono/factory";

const https = "https:";

/**
 * Enforce HTTPS connections.
 */
export function httpsOnly() {
	return createMiddleware(async (c, next) => {
		let url = new URL(c.req.url);

		if (url.protocol === https) {
			return await next();
		}

		url.protocol = https;
		c.redirect(url.toString());
	});
}
