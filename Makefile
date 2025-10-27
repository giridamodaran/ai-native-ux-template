
# =========
# CONFIG
# =========
REGISTRY           ?=
IMAGE_CHAT         ?= chat-backend
IMAGE_MCP          ?= mcp-bookings
TAG                ?= latest
PLATFORMS          ?= linux/amd64,linux/arm64
BUILDER_NAME       ?= aiux-builder

# Paths
CHAT_DOCKERFILE    ?= apps/chat-backend/Dockerfile
MCP_DOCKERFILE     ?= packages/mcp-bookings/Dockerfile
CHAT_CONTEXT       ?= .
MCP_CONTEXT        ?= packages/mcp-bookings

.PHONY: help
help:
	@echo "Targets: builder-init, build-chat, build-mcp, buildx-chat, buildx-mcp, push-chat, push-mcp, compose-up, compose-down, test, mcpb"

# =========
# BUILDX
# =========
.PHONY: builder-init
builder-init:
	@docker buildx ls | grep -q $(BUILDER_NAME) || docker buildx create --name $(BUILDER_NAME) --use
	docker buildx inspect --builder $(BUILDER_NAME) --bootstrap

# =========
# SINGLE-ARCH
# =========
.PHONY: build-chat
build-chat:
	docker build -f $(CHAT_DOCKERFILE) -t $(REGISTRY)$(IMAGE_CHAT):$(TAG) $(CHAT_CONTEXT)

.PHONY: build-mcp
build-mcp:
	docker build -f $(MCP_DOCKERFILE) -t $(REGISTRY)$(IMAGE_MCP):$(TAG) $(MCP_CONTEXT)

# =========
# MULTI-ARCH
# =========
.PHONY: buildx-chat
buildx-chat: builder-init
	docker buildx build --builder $(BUILDER_NAME) --platform $(PLATFORMS) 		-f $(CHAT_DOCKERFILE) -t $(REGISTRY)$(IMAGE_CHAT):$(TAG) --load $(CHAT_CONTEXT)

.PHONY: buildx-mcp
buildx-mcp: builder-init
	docker buildx build --builder $(BUILDER_NAME) --platform $(PLATFORMS) 		-f $(MCP_DOCKERFILE) -t $(REGISTRY)$(IMAGE_MCP):$(TAG) --load $(MCP_CONTEXT)

.PHONY: push-chat
push-chat: builder-init
	docker buildx build --builder $(BUILDER_NAME) --platform $(PLATFORMS) 		-f $(CHAT_DOCKERFILE) -t $(REGISTRY)$(IMAGE_CHAT):$(TAG) --push $(CHAT_CONTEXT)

.PHONY: push-mcp
push-mcp: builder-init
	docker buildx build --builder $(BUILDER_NAME) --platform $(PLATFORMS) 		-f $(MCP_DOCKERFILE) -t $(REGISTRY)$(IMAGE_MCP):$(TAG) --push $(MCP_CONTEXT)

# =========
# COMPOSE (single container, stdio mode)
# =========
.PHONY: compose-up
compose-up:
	docker compose up --build -d

.PHONY: compose-down
compose-down:
	docker compose down

.PHONY: test
test:
	curl -s -X POST http://localhost:8787/chat 	  -H 'Content-Type: application/json' 	  -d '{"prompt":"Create a booking for alex@example.com 2026-01-10 to 2026-01-12, Deluxe"}' | jq .

# =========
# CLAUDE DESKTOP EXT (.mcpb)
# =========
MCP_NAME          ?= mcp-bookings
MCP_PKG_DIR       ?= packages/mcp-bookings
MCP_BUILD_DIR     ?= $(MCP_PKG_DIR)/build
MCP_DIST_DIR      ?= dist/mcpb
MCP_SERVER_DIR    ?= $(MCP_DIST_DIR)/server
MCPB_OUT          ?= dist/$(MCP_NAME).mcpb
MCP_DISPLAY_NAME  ?= "Bookings MCP Server"
MCP_DESCRIPTION   ?= "Domain tools for bookings: create_booking, message_guest"
MCP_VERSION       ?= 1.0.0

.PHONY: mcpb
mcpb:
	@echo "==> Building MCP server (prod deps only)"
	rm -rf $(MCP_DIST_DIR) $(MCPB_OUT)
	mkdir -p $(MCP_SERVER_DIR)

	# Build TS -> JS and install prod deps
	cd $(MCP_PKG_DIR) && npm ci && npm run build
	cd $(MCP_PKG_DIR) && npm ci --omit=dev --ignore-scripts

	# Copy compiled JS and runtime deps
	rsync -a $(MCP_BUILD_DIR)/ $(MCP_SERVER_DIR)/build/
	rsync -a $(MCP_PKG_DIR)/package.json $(MCP_SERVER_DIR)/
	rsync -a $(MCP_PKG_DIR)/node_modules $(MCP_SERVER_DIR)/node_modules

	# manifest.json
	node -e '	  const fs=require("fs"); 	  const manifest={ 	    name: "$(MCP_NAME)", version: "$(MCP_VERSION)", 	    displayName: $(JSON.stringify("$(MCP_DISPLAY_NAME)")), 	    description: $(JSON.stringify("$(MCP_DESCRIPTION)")), 	    serverType: "stdio", 	    entry: { command: "node", args: ["server/build/index.js"] }, 	    author: { name: process.env.USER || "Your Org" }, 	    license: "MIT" 	  }; 	  fs.mkdirSync("$(MCP_DIST_DIR)", { recursive: true }); 	  fs.writeFileSync("$(MCP_DIST_DIR)/manifest.json", JSON.stringify(manifest,null,2)); 	'

	# Zip -> .mcpb
	cd $(MCP_DIST_DIR) && zip -qr ../$(MCP_NAME).mcpb manifest.json server
	@echo "✅ Built $(MCPB_OUT)"
