import type { Context } from "hono";
import { env } from "hono/adapter";
import type { z } from "zod";

export function typedEnv<Schema extends z.ZodTypeAny>(
	c: Context,
	schema: Schema,
	key?: keyof Schema["_def"]["shape"],
): z.output<Schema> | z.output<Schema>[keyof Schema["_def"]["shape"]] {
	let typed = schema.parse(env(c));
	if (!key) return typed;
	return typed[key];
}
