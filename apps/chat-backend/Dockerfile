
# apps/chat-backend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

# --- Build MCP server ---
COPY packages/mcp-bookings/package.json packages/mcp-bookings/tsconfig.json ./packages/mcp-bookings/
COPY packages/mcp-bookings/src ./packages/mcp-bookings/src
WORKDIR /app/packages/mcp-bookings
RUN npm install && npm run build

# --- Build chat backend ---
WORKDIR /app
COPY apps/chat-backend/package.json apps/chat-backend/tsconfig.json ./apps/chat-backend/
COPY apps/chat-backend/src ./apps/chat-backend/src
WORKDIR /app/apps/chat-backend
RUN npm install && npm run build

# --- Runtime image ---
FROM node:20-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

# backend runtime deps
COPY --from=builder /app/apps/chat-backend/package.json ./apps/chat-backend/package.json
RUN cd apps/chat-backend && npm install --omit=dev

# backend dist
COPY --from=builder /app/apps/chat-backend/dist ./apps/chat-backend/dist
# built MCP (spawned in stdio mode)
COPY --from=builder /app/packages/mcp-bookings/build ./packages/mcp-bookings/build

# Defaults (overridable)
ENV MCP_TRANSPORT=stdio     MCP_COMMAND=node     MCP_ARGS='["/app/packages/mcp-bookings/build/index.js"]'     ANTHROPIC_MODEL=claude-3-7-sonnet

EXPOSE 8787
WORKDIR /app/apps/chat-backend
CMD ["node", "dist/server.js"]
