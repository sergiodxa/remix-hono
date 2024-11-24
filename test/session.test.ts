import { Context } from "hono";
import { createCookieSessionStorage } from "react-router";
import { describe, test, expect, vi, beforeEach, afterAll } from "vitest";

import { getSession, getSessionStorage, session } from "../src/session";

vi.mock("@react-router/node", () => {
	return {
		createCookieSessionStorage: vi.fn(),
	};
});

vi.stubEnv("SESSION_SECRET", "s3cr3t");

const sessionStorage = createCookieSessionStorage({
	cookie: {
		name: "session",
		httpOnly: true,
		secrets: [process.env.SESSION_SECRET!],
	},
});

const createSessionStorage = vi.fn().mockImplementation(() => sessionStorage);

const c = {
	set: vi.fn(),
	get: vi.fn(),
	req: {
		raw: {
			headers: {
				get: vi.fn().mockReturnValue("session=cookie"),
			},
		},
	},
	header: vi.fn(),
} as unknown as Context;

const spy = {
	getSession: vi
		.spyOn(sessionStorage, "getSession")
		.mockResolvedValue(await sessionStorage.getSession()),
	commitSession: vi.fn().mockResolvedValue("session cookie"),
};

describe(session.name, () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterAll(() => {
		vi.resetAllMocks();
	});

	test("calls `next` if no `autoCommit`", async () => {
		let next = vi.fn().mockResolvedValueOnce(true);

		let middleware = session({
			autoCommit: false,
			createSessionStorage,
		});

		await middleware(c, next);

		expect(createSessionStorage).toHaveBeenCalledOnce();
		expect(c.set).toHaveBeenNthCalledWith(1, "sessionStorage", sessionStorage);
		expect(next).toHaveBeenCalledOnce();
		expect(spy.getSession).not.toBeCalled();
	});

	test("`set-cookie` if `autoCommit`", async () => {
		let next = vi.fn().mockResolvedValueOnce(true);

		let middleware = session({
			autoCommit: true,
			createSessionStorage,
		});

		await middleware(c, next);

		expect(createSessionStorage).toHaveBeenCalledOnce();
		expect(c.set).toHaveBeenNthCalledWith(1, "sessionStorage", sessionStorage);
		expect(spy.getSession).toHaveBeenCalledOnce();

		let sessionInContext = await sessionStorage.getSession();

		expect(c.set).toHaveBeenNthCalledWith(2, "session", sessionInContext);
		expect(next).toHaveBeenCalledOnce();
		expect(c.header).toHaveBeenLastCalledWith(
			"set-cookie",
			await sessionStorage.commitSession(sessionInContext),
			{
				append: true,
			},
		);
	});
});

describe(getSessionStorage.name, () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterAll(() => {
		vi.resetAllMocks();
	});

	test("throws if no session storage", async () => {
		expect(() => getSessionStorage(c)).toThrowError(
			"A session middleware was not set.",
		);

		expect(c.get).toHaveBeenCalledWith("sessionStorage");
	});

	test("returns session storage", async () => {
		let sessionStorage = getSessionStorage({
			get: vi.fn().mockReturnValueOnce({}),
		} as unknown as Context);

		expect(sessionStorage).not.toBeNull();
	});
});

describe(getSession.name, () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterAll(() => {
		vi.resetAllMocks();
	});

	test("throws if no session storage", async () => {
		expect(() => getSession(c)).toThrowError(
			"A session middleware was not set.",
		);

		expect(c.get).toHaveBeenCalledWith("session");
	});

	test("returns session", async () => {
		let session = getSessionStorage({
			get: vi.fn().mockReturnValueOnce({}),
		} as unknown as Context);

		expect(session).not.toBeNull();
	});
});
