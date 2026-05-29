# This is the Makefile for the ledger-js-sdk project.
# It is used to automate the build, test, and cleanup processes.
#
# To get a list of targets run "make help".

# The default target -- makes the "dist" directory
# and creates a ".nvmrc" file.
all: dist .nvmrc

# This target provides a list of targets.
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  all           - Builds the project"
	@echo "  dist          - Builds the distribution directory"
	@echo "  do-lint       - Runs eslint on the project source"
	@echo "  test          - Runs the test suite"
	@echo "  clean         - Removes build artifacts"
	@echo "  distclean     - Removes all build artifacts and dependencies"
	@echo "  do-npm-pack   - Creates a distributable package for this project"

# Create a ".nvmrc" file if it does not exist
.nvmrc: package.json Makefile
	rm -f .nvmrc .nvmrc.new
	jq -rM '"v" + .engines.node' < package.json > .nvmrc.new
	mv .nvmrc.new .nvmrc

# This target creates the "node_modules" directory.
node_modules/.done: package.json package-lock.json Makefile
	rm -rf node_modules
	npm clean-install
	@touch node_modules/.done

# Creates the "node_modules" directory -- this target is for
# the directory itself, not its contents so it just
# depends on the contents and updates its timestamp.
node_modules: node_modules/.done
	@touch node_modules

# This target creates the distribution directory.
dist/.done: $(shell find src -type f) node_modules Makefile tsconfig.json tsconfig.build.json package.json
	npm run tsc -- --project tsconfig.build.json --emitDeclarationOnly --declaration --declarationDir dist/types
	npm run esbuild-esm
	npm run esbuild-cjs
	find dist -type f -name '*.test.*' | xargs rm -f
	test -e LICENSE && cp LICENSE dist/ || :
	sed 's@/dist@@g' < package.json | jq 'del(.devDependencies, .scripts, .engines) | .files = ["cjs", "esm", "types", "package.json"]' > dist/package.json.new
	jq --tab . < dist/package.json.new > dist/package.json
	test -e README.md && cp README.md dist/ || :
	@touch dist/.done

# Creates the distribution directory -- this target is for
# the directory itself, not its contents so it just
# depends on the contents and updates its timestamp.
dist: dist/.done
	@touch dist

# This is a synthetic target that creates a distributable
# package for this project.
do-npm-pack: dist node_modules Makefile
	cd dist && npm pack
	mv dist/keetanetwork-ledger-sdk-*.tgz .

# This is a synthetic target that runs this test suite.
test: node_modules
	npm run tsc -- --noEmit
	rm -rf .coverage
	npm run vitest run -- --config ./.vitest.config.js

# Run linting
do-lint: node_modules
	unset $(shell locale | cut -f 1 -d =) && LC_ALL=C git grep '[^[:print:][:space:]]' -- src && echo "Error: Found non-ASCII characters in the source code." && exit 1 || :
	npm run eslint -- --config eslint.config.mjs

# Files created during the "build" or "prepare" processes
# are cleaned up by the "clean" target.
#
# These files should also be added to the ".gitignore" file.
clean:
	rm -rf dist
	rm -rf .coverage
	rm -f .tsbuildinfo
	rm -f keetanetwork-ledger-sdk-*.tgz

# Files created during the "install" process are cleaned up
# by the "distclean" target.
#
# These files should also be added to the ".gitignore" file.
distclean: clean
	rm -rf node_modules
	rm -f .nvmrc

.PHONY: all help test clean distclean do-npm-pack do-lint
