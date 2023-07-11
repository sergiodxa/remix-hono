import type { AppLoadContext, ServerBuild } from "@remix-run/cloudflare";
import type { Context, MiddlewareHandler, Env, Input } from "hono";

import { createRequestHandler } from "@remix-run/cloudflare";

export interface createPagesFunctionHandlerParameters<
	E extends Env = Record<string, never>,
	P extends string = "",
	I extends Input = Record<string, never>,
> {
	build: ServerBuild;
	mode?: "development" | "production";
	getLoadContext?(
		event: Context<E, P, I>,
	): Promise<AppLoadContext> | AppLoadContext;
}

export function createHonoHandler<
	E extends Env = Record<string, never>,
	P extends string = "",
	I extends Input = Record<string, never>,
>({
	mode,
	build,
	getLoadContext = (context) => context.env as unknown as AppLoadContext,
}: createPagesFunctionHandlerParameters<E, P, I>): MiddlewareHandler {
	return async function middleware(context) {
		let requestHandler = createRequestHandler(build, mode);
		let loadContext = getLoadContext(context);
		return await requestHandler(
			context.req.raw,
			loadContext instanceof Promise ? await loadContext : loadContext,
		);
	};
}

export { createRequestHandler } from "@remix-run/cloudflare";
