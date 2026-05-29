import keetanetworkConfig from '@keetanetwork/eslint-config-typescript';

/** @type {import('eslint').Linter.Config[]} */
export default [
	{
		ignores: ['**/*', '!src/**']
	},
	...keetanetworkConfig
];
