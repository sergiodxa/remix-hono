import type { Context, Env, Input, MiddlewareHandler } from "hono";
import type { RemixI18NextOption } from "remix-i18next";

import { Namespace, TFunction } from "i18next";
import { RemixI18Next } from "remix-i18next";

const i18nSymbol = Symbol();
const LocaleSymbol = Symbol();
const TSymbol = Symbol();

export function i18next<
	E extends Env = Record<string, never>,
	P extends string = "",
	I extends Input = Record<string, never>,
>(options: RemixI18NextOption | RemixI18Next): MiddlewareHandler<E, P, I> {
	return async function middleware(ctx, next) {
		let i18n =
			options instanceof RemixI18Next ? options : new RemixI18Next(options);

		let locale = await i18n.getLocale(ctx.req.raw);

		let t = await i18n.getFixedT(locale);

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		ctx.set<any>(i18nSymbol, i18n);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		ctx.set<any>(LocaleSymbol, locale);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		ctx.set<any>(TSymbol, t);

		await next();
	};
}

i18next.get = function get(ctx: Context) {
	let i18n = ctx.get(i18nSymbol) as RemixI18Next | undefined;
	if (!i18n) {
		throw new Error(
			"The i18next middleware must run before calling `i18next.getI18n()`",
		);
	}
	return i18n;
};

i18next.getLocale = function getLocale(ctx: Context) {
	let locale = ctx.get(LocaleSymbol) as string | undefined;
	if (!locale) {
		throw new Error(
			"The i18next middleware must run before calling `i18next.getLocale()`",
		);
	}
	return locale;
};

i18next.getFixedT = function getFixedT<Ns extends Namespace = "translation">(
	ctx: Context,
	{ namespace }: { namespace?: Ns } = {},
) {
	// If `namespace` is set, we return a new `t` function that is bound to the
	// given namespace. Otherwise, we return the default `t` function.
	if (namespace) {
		let i18n = i18next.get(ctx);
		let locale = i18next.getLocale(ctx);
		return i18n.getFixedT<Ns>(locale, namespace);
	}

	let t = ctx.get(TSymbol) as TFunction<Ns> | undefined;
	if (!t) {
		throw new Error(
			"The i18next middleware must run before calling `i18next.getFixedT()`",
		);
	}
	return Promise.resolve(t);
};
