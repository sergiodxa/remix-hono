import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import type { FlatNamespace, TFunction } from "i18next";
import type { RemixI18NextOption } from "remix-i18next/server";
import { RemixI18Next } from "remix-i18next/server";

type Env = {
	Variables: Record<symbol, unknown>;
};

const i18nSymbol = Symbol();
const LocaleSymbol = Symbol();
const TSymbol = Symbol();

export function i18next(options: RemixI18NextOption | RemixI18Next) {
	return createMiddleware<Env>(async (c, next) => {
		let i18n =
			options instanceof RemixI18Next ? options : new RemixI18Next(options);

		let locale = await i18n.getLocale(c.req.raw);

		let t = await i18n.getFixedT(locale);

		c.set(i18nSymbol, i18n);
		c.set(LocaleSymbol, locale);
		c.set(TSymbol, t);

		await next();
	});
}

i18next.get = function get(c: Context<Env>) {
	let i18n = c.get(i18nSymbol) as RemixI18Next | undefined;
	if (!i18n) {
		throw new Error(
			"The i18next middleware must run before calling `i18next.getI18n()`",
		);
	}
	return i18n;
};

i18next.getLocale = function getLocale(c: Context<Env>) {
	let locale = c.get(LocaleSymbol) as string | undefined;
	if (!locale) {
		throw new Error(
			"The i18next middleware must run before calling `i18next.getLocale()`",
		);
	}
	return locale;
};

i18next.getFixedT = function getFixedT<
	Ns extends FlatNamespace = "translation",
>(c: Context<Env>, { namespace }: { namespace?: Ns } = {}) {
	// If `namespace` is set, we return a new `t` function that is bound to the
	// given namespace. Otherwise, we return the default `t` function.
	if (namespace) {
		let i18n = i18next.get(c);
		let locale = i18next.getLocale(c);
		return i18n.getFixedT<Ns>(locale, namespace);
	}

	let t = c.get(TSymbol) as TFunction<Ns> | undefined;
	if (!t) {
		throw new Error(
			"The i18next middleware must run before calling `i18next.getFixedT()`",
		);
	}
	return Promise.resolve(t);
};
