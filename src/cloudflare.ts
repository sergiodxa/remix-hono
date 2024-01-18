import type { Context } from "hono";

import {
	CookieOptions,
	SessionData,
	createWorkersKVSessionStorage,
	createCookieSessionStorage,
} from "@remix-run/cloudflare";
import { createMiddleware } from "hono/factory";
import { cacheHeader } from "pretty-cache-header";

import { session } from "./session";

interface StaticAssetsOptions {
	cache?: Parameters<typeof cacheHeader>[0];
}

export function staticAssets(options: StaticAssetsOptions = {}) {
	return createMiddleware(async (c, next) => {
		let binding = c.env?.ASSETS as Fetcher | undefined;

		if (!binding) throw new ReferenceError("The binding ASSETS is not set.");

		let response: Response;

		c.req.raw.headers.delete("if-none-match");

		try {
			response = await binding.fetch(c.req.url, c.req.raw.clone());

			// If the request failed, we just call the next middleware
			if (response.status >= 400) return await next();

			response = new Response(response.body, response);

			// If cache options are configured, we set the cache-control header
			if (options.cache) {
				response.headers.set("cache-control", cacheHeader(options.cache));
			}

			return response;
		} catch {
			return await next();
		}
	});
}

/* Middleware for sessions with Worker KV */
type WorkerKVBindingsObject<KV extends string, Secret extends string> = {
	[K in KV | Secret]: K extends KV ? KVNamespace : string;
};

type GetWorkerKVSecretsFunction<KV extends string, Secret extends string> = (
	c: Context<{ Bindings: WorkerKVBindingsObject<KV, Secret> }>,
) => string[];

export function workerKVSession<
	KVBinding extends string,
	SecretBinding extends string,
	Data = SessionData,
	FlashData = Data,
>(options: {
	autoCommit?: boolean;
	cookie: Omit<CookieOptions, "secrets"> & {
		name: string;
		secrets: GetWorkerKVSecretsFunction<KVBinding, SecretBinding>;
	};
	binding: KVBinding;
}) {
	return session<Data, FlashData>({
		autoCommit: options.autoCommit,
		createSessionStorage(c) {
			if (!(options.binding in c.env)) {
				throw new ReferenceError("The binding for the kvSession is not set.");
			}

			let secrets = options.cookie.secrets(c);

			if (secrets.filter(Boolean).length === 0) {
				throw new ReferenceError("The secrets for the kvSession are not set.");
			}

			return createWorkersKVSessionStorage<Data, FlashData>({
				kv: c.env[options.binding] as KVNamespace,
				cookie: { ...options.cookie, secrets },
			});
		},
	});
}

/* Middleware for sessions with Cookies */
type CookieBindingsObject<Secret extends string> = {
	[K in Secret]: string;
};

type GetCookieSecretsFunction<Secret extends string> = (
	c: Context<{ Bindings: CookieBindingsObject<Secret> }>,
) => string[];

export function cookieSession<
	SecretBinding extends string,
	Data = SessionData,
	FlashData = Data,
>(options: {
	autoCommit?: boolean;
	cookie: Omit<CookieOptions, "secrets"> & {
		name: string;
		secrets: GetCookieSecretsFunction<SecretBinding>;
	};
}) {
	return session<Data, FlashData>({
		autoCommit: options.autoCommit,
		createSessionStorage(c) {
			let secrets = options.cookie.secrets(c);

			if (secrets.filter(Boolean).length === 0) {
				throw new ReferenceError(
					"The secrets for the cookieSession are not set.",
				);
			}

			return createCookieSessionStorage<Data, FlashData>({
				cookie: { ...options.cookie, secrets },
			});
		},
	});
}
