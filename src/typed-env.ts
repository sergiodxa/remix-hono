import type { Context } from "hono";
import type { z } from "zod";

import { env } from "hono/adapter";

export function typedEnv<Schema extends z.ZodTypeAny>(
	context: Context,
	schema: Schema,
	key?: keyof Schema["_def"]["shape"],
): z.output<Schema> | z.output<Schema>[keyof Schema["_def"]["shape"]] {
	let typed = schema.parse(env(context));
	if (!key) return typed;
	return typed[key];
}
