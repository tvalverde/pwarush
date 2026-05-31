.PHONY: install dev build lint format typecheck test check e2e e2e-update e2e-ui e2e-build

PLAYWRIGHT_IMAGE := mcr.microsoft.com/playwright:v1.60.0-noble
PLAYWRIGHT_LOCAL_IMAGE := pwarush/playwright:local
HOST_UID := $(shell id -u)
HOST_GID := $(shell id -g)
DOCKER_RUN_BASE := docker run --rm --ipc=host --network host \
	-v $(CURDIR):/work -w /work \
	-u $(HOST_UID):$(HOST_GID) \
	-e CI=$(CI) -e HOME=/tmp
DOCKER_RUN := $(DOCKER_RUN_BASE) $(PLAYWRIGHT_IMAGE)
DOCKER_RUN_TTY := $(DOCKER_RUN_BASE) -it $(PLAYWRIGHT_IMAGE)

# Install dependencies
install:
	npm ci

# Start development server
dev:
	npm run dev

# Build for production
build:
	npm run build

# Run linter (Biome)
lint:
	npm run lint

# Format code (Biome)
format:
	npm run format

# Check TypeScript types
typecheck:
	npm run typecheck

# Run tests once
test:
	npm test -- --run

# Full quality gate check
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
	docker build -t $(PLAYWRIGHT_LOCAL_IMAGE) -f docker/playwright.Dockerfile .
