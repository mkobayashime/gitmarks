biome = bunx biome
eslint = bunx eslint
typecheck = bunx tsgo --noEmit
wxt = bunx wxt

deps: PHONY
ifeq ($(CI), true)
	bun install --frozen-lockfile
else
	bun install
endif

lint: deps PHONY
	$(biome) check .
	$(eslint) .

lint.fix: deps PHONY
	$(biome) check --fix .
	$(eslint) --fix .

typecheck: deps PHONY
	$(typecheck)

typecheck.watch: deps PHONY
	$(typecheck) --watch

dev: deps PHONY
	$(wxt)

dev.firefox: deps PHONY
	$(wxt) -b firefox

build: deps PHONY
	$(wxt) build

build.firefox: deps PHONY
	$(wxt) build -b firefox

zip: deps PHONY
	$(wxt) zip

zip.firefox: deps PHONY
	$(wxt) zip -b firefox

postinstall: deps PHONY
	$(wxt) prepare

PHONY:
