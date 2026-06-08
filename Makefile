.PHONY: install dev build lint format typecheck test check e2e e2e-update e2e-ui e2e-build

PLAYWRIGHT_IMAGE := mcr.microsoft.com/playwright:v1.60.0-noble
PLAYWRIGHT_LOCAL_IMAGE := pwarush/playwright:local
HOST_UID := $(shell id -u)
HOST_GID := $(shell id -g)

# Container engine: prefer docker, fall back to podman. Override with
# `make CONTAINER_ENGINE=podman e2e`.
CONTAINER_ENGINE ?= $(shell command -v docker >/dev/null 2>&1 && echo docker || echo podman)

# User mapping differs by engine. Docker's daemon runs as root, so we force the
# host uid/gid to keep generated files (snapshots, playwright-report) owned by the
# host user. Podman rootless already maps the host user into the container, and a
# bare `-u` would break that mapping (the uid has no /etc/passwd entry); the
# idiomatic fix is `--userns=keep-id`.
ifeq ($(CONTAINER_ENGINE),podman)
CONTAINER_USER_MAP := --userns=keep-id
else
CONTAINER_USER_MAP := -u $(HOST_UID):$(HOST_GID)
endif

DOCKER_RUN_BASE := $(CONTAINER_ENGINE) run --rm --ipc=host --network host \
	-v $(CURDIR):/work -w /work \
	$(CONTAINER_USER_MAP) \
	-e CI=$(CI) -e HOME=/tmp
DOCKER_RUN := $(DOCKER_RUN_BASE) $(PLAYWRIGHT_IMAGE)
DOCKER_RUN_TTY := $(DOCKER_RUN_BASE) -it $(PLAYWRIGHT_IMAGE)

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
