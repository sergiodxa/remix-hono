/* eslint-disable unicorn/no-empty-file */
/* eslint-disable unicorn/prefer-module */
module.exports = {
	root: true,
	parser: "@typescript-eslint/parser",
	plugins: ["@typescript-eslint", "prefer-let", "import", "promise", "unicorn"],
	extends: [
		"prettier",
		"plugin:@typescript-eslint/recommended",
		"plugin:import/errors",
		"plugin:import/typescript",
		"plugin:import/warnings",
		"plugin:promise/recommended",
		"plugin:unicorn/recommended",
	],
	settings: {
		"import/resolver": { typescript: {} },
	},
	rules: {
		"@typescript-eslint/explicit-module-boundary-types": "off",

		"no-unused-vars": "off",
		"no-var": "off",
		"prefer-const": "off",

		"prefer-let/prefer-let": 2,

		"import/order": [
			"error",
			{
				alphabetize: {
					order: "asc",
				},
				groups: [
					"type",
					"builtin",
					"external",
					"internal",
					"parent",
					["sibling", "index"],
				],
				"newlines-between": "always",
				pathGroups: [],
				pathGroupsExcludedImportTypes: [],
			},
		],
	},
};
