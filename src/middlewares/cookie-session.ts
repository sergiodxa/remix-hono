import type { Context, MiddlewareHandler } from "hono";

import {
	CookieOptions,
	SessionData,
	createCookieSessionStorage,
} from "@remix-run/cloudflare";

import { session } from "./session";

type GetSecretsFunction<Secret extends string> = (
	context: Context<{ Bindings: BindingsObject<Secret> }>,
) => string[];

type BindingsObject<Secret extends string> = {
	[K in Secret]: string;
};

export function cookieSession<
	SecretBinding extends string,
	Data = SessionData,
	FlashData = Data,
>(options: {
	autoCommit?: boolean;
	cookie: Omit<CookieOptions, "secrets"> & {
		name: string;
		secrets: GetSecretsFunction<SecretBinding>;
	};
}): MiddlewareHandler {
	return session<
		{ Bindings: BindingsObject<SecretBinding> },
		"",
		Record<string, unknown>,
		Data,
		FlashData
	>({
		autoCommit: options.autoCommit,
		createSessionStorage(context) {
			let secrets = options.cookie.secrets(context);

			if (secrets.length === 0) {
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
