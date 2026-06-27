.PHONY: setup install dev build lint format typecheck test check e2e e2e-update e2e-ui e2e-build

# Recipes run in bash (nvm and the multi-line setup recipe need it).
SHELL := /usr/bin/env bash

# --- Node toolchain (single source of truth: .nvmrc) ------------------------
# Every target runs under the project's Node WITHOUT a manual `nvm use`: we
# resolve the nvm-installed bin dir matching .nvmrc (e.g. "24" -> latest v24.x)
# and prepend it to PATH for all recipes. Run `make setup` once to install it.
NVM_DIR ?= $(HOME)/.nvm
NODE_REQ := $(shell cat .nvmrc 2>/dev/null)
NODE_BIN := $(shell ls -d $(NVM_DIR)/versions/node/v$(NODE_REQ)*/bin 2>/dev/null | sort -V | tail -1)
ifneq ($(NODE_BIN),)
export PATH := $(NODE_BIN):$(PATH)
else
$(warning Node $(NODE_REQ) no está instalado vía nvm en $(NVM_DIR) — ejecuta 'make setup'. Usando el node del PATH.)
endif

PLAYWRIGHT_IMAGE := mcr.microsoft.com/playwright:v1.60.0-noble
PLAYWRIGHT_LOCAL_IMAGE := pwarush/playwright:local
HOST_UID := $(shell id -u)
HOST_GID := $(shell id -g)

# Container engine: prefer podman (the supported rootless setup), fall back to
# docker. Preferring podman avoids picking a `podman-docker` shim (a `docker`
# that is really podman), which would wrongly select the docker flag branch.
# Override with `make CONTAINER_ENGINE=docker e2e`.
CONTAINER_ENGINE ?= $(shell command -v podman >/dev/null 2>&1 && echo podman || echo docker)

# Engine-specific flags:
# - User mapping: Docker's daemon runs as root, so we force the host uid/gid to
#   keep generated files (snapshots, playwright-report) owned by the host user.
#   Podman rootless already maps the host user, and a bare `-u` would break that
#   mapping (the image's pwuser has no matching entry); the idiomatic fix is
#   `--userns=keep-id`.
# - Networking: the webServer and the tests run in the SAME container, so
#   localhost already works without host networking. Docker keeps `--network host`
#   (harmless, matches prior behaviour/CI), but podman MUST omit it: combining
#   `--network host` with `--userns=keep-id` breaks writes to the bind mount
#   (EACCES creating files under /work).
ifeq ($(CONTAINER_ENGINE),podman)
CONTAINER_USER_MAP := --userns=keep-id
CONTAINER_NET :=
else
CONTAINER_USER_MAP := -u $(HOST_UID):$(HOST_GID)
CONTAINER_NET := --network host
endif

DOCKER_RUN_BASE := $(CONTAINER_ENGINE) run --rm --ipc=host $(CONTAINER_NET) \
	-v $(CURDIR):/work -w /work \
	$(CONTAINER_USER_MAP) \
	-e CI=$(CI) -e HOME=/tmp
DOCKER_RUN := $(DOCKER_RUN_BASE) $(PLAYWRIGHT_IMAGE)
DOCKER_RUN_TTY := $(DOCKER_RUN_BASE) -it $(PLAYWRIGHT_IMAGE)

# One-time bootstrap: install the project's Node (.nvmrc) via nvm and all deps.
# This is the only target that needs nvm's shell function (to install Node); the
# rest just rely on the PATH set above.
setup:
	@export NVM_DIR="$(NVM_DIR)"; \
	if [ ! -s "$$NVM_DIR/nvm.sh" ]; then \
		echo "✖ nvm no encontrado en $$NVM_DIR. Instálalo: https://github.com/nvm-sh/nvm"; \
		exit 1; \
	fi; \
	. "$$NVM_DIR/nvm.sh" && nvm install && nvm use && echo "→ usando $$(node -v)" && npm ci

install:
	npm ci

dev:
	npm run dev

build:
	npm run build

lint:
	npm run lint

format:
	npm run format

typecheck:
	npm run typecheck

test:
	npm test

check: lint typecheck test

# Run E2E tests inside the official Playwright container
# Uses node_modules from the host (must be installed beforehand via `make install`)
e2e:
	$(DOCKER_RUN) npx playwright test

# Regenerate Playwright snapshots inside the container
e2e-update:
	$(DOCKER_RUN) npx playwright test --update-snapshots

# Open Playwright UI mode inside the container (requires browser access)
e2e-ui:
	$(DOCKER_RUN_TTY) npx playwright test --ui-port=8080 --ui-host=0.0.0.0

# Build a local Playwright image with make and project tooling
e2e-build:
	$(CONTAINER_ENGINE) build -t $(PLAYWRIGHT_LOCAL_IMAGE) -f docker/playwright.Dockerfile .
