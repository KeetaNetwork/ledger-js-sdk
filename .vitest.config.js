import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		coverage: {
			reporter: ['lcov'],
			reportsDirectory: '.coverage',
			exclude: [
				'src/**/*.test.ts'
			],
			enabled: true
		}
	}
})
