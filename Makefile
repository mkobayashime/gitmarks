oxlint = bunx oxlint
oxfmt = bunx oxfmt
typecheck = bunx tsgo --noEmit
wxt = bunx wxt

deps: PHONY
ifeq ($(CI), true)
	bun install --frozen-lockfile
else
	bun install
endif

lint: deps PHONY
	$(oxfmt) --check
	$(oxlint) --type-aware

lint.fix: deps PHONY
	$(oxfmt)
	$(oxlint) --fix --type-aware

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
