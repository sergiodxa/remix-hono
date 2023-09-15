import type { AppLoadContext, ServerBuild } from "@remix-run/server-runtime";
import type { Context, MiddlewareHandler, Env, Input } from "hono";

import { createRequestHandler } from "@remix-run/server-runtime";

export interface RemixMiddlewareOptions<
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

export function remix<
	E extends Env = Record<string, never>,
	P extends string = "",
	I extends Input = Record<string, never>,
>({
	mode,
	build,
	getLoadContext = (context) => context.env as unknown as AppLoadContext,
}: RemixMiddlewareOptions<E, P, I>): MiddlewareHandler<E, P, I> {
	return async function middleware(context) {
		let requestHandler = createRequestHandler(build, mode);
		let loadContext = getLoadContext(context);
		return await requestHandler(
			context.req.raw,
			loadContext instanceof Promise ? await loadContext : loadContext,
		);
	};
}

export { createRequestHandler } from "@remix-run/server-runtime";
