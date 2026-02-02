wxt = bunx wxt

deps: PHONY
ifeq ($(CI), true)
	bun install --frozen-lockfile
else
	bun install
endif

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

compile: deps PHONY
	tsc --noEmit

postinstall: deps PHONY
	$(wxt) prepare

PHONY:
