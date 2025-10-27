
import 'dotenv/config';
import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { HTTPClientTransport } from "@modelcontextprotocol/sdk/client/http.js";
import http from 'http';

// ---------- ENV CONFIG ----------
const MODEL = process.env.ANTHROPIC_MODEL || "claude-3-7-sonnet";
const MCP_TRANSPORT = (process.env.MCP_TRANSPORT || "stdio").toLowerCase();
// stdio mode
const MCP_COMMAND = process.env.MCP_COMMAND || "node";
const MCP_ARGS = (() => {
  try {
    return JSON.parse(process.env.MCP_ARGS || '["/app/packages/mcp-bookings/build/index.js"]');
  } catch {
    return ["/app/packages/mcp-bookings/build/index.js"];
  }
})();
// http mode
const MCP_URL = process.env.MCP_URL || "http://mcp:8000/";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

function getMcpTransport() {
  if (MCP_TRANSPORT === "http") {
    return new HTTPClientTransport({ url: MCP_URL });
  }
  // default: stdio
  return new StdioClientTransport({ command: MCP_COMMAND, args: MCP_ARGS });
}

const mcpClient = new Client({ name: 'chat-backend', version: '1.0.0' });
const transport = getMcpTransport();
await mcpClient.connect(transport);

const tools = [
  {
    name: 'create_booking',
    description: 'Create a new booking',
    input_schema: {
      type: 'object',
      properties: {
        guestEmail: { type: 'string' },
        checkIn: { type: 'string' },
        checkOut: { type: 'string' },
        roomType: { type: 'string' }
      },
      required: ['guestEmail','checkIn','checkOut','roomType']
    }
  },
  {
    name: 'message_guest',
    description: 'Send a message to a guest',
    input_schema: {
      type: 'object',
      properties: {
        bookingId: { type: 'string' },
        message: { type: 'string' }
      },
      required: ['bookingId','message']
    }
  }
];

async function handleChat(userPrompt: string) {
  const msg = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 800,
    tools,
    messages: [{ role: 'user', content: userPrompt }]
  });

  for (const block of msg.content) {
    if (block.type === 'tool_use') {
      const { name, input, id } = block as any;
      const result = await mcpClient.callTool({ name, arguments: input });
      const followup = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 800,
        messages: [
          { role: 'assistant', content: [block] },
          { role: 'tool', content: [{ type: 'tool_result', tool_use_id: id, content: JSON.stringify(result) }] }
        ]
      });
      return followup.content.map((c: any) => c.text || '').join('
');
    }
  }
  return msg.content.map((c: any) => c.text || '').join('
');
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/chat') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { prompt } = JSON.parse(body || '{}');
        const answer = await handleChat(prompt || 'Hello');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ answer }));
      } catch (e: any) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('POST /chat {"prompt": "Create a booking..."}
');
  }
});

server.listen(8787, () => console.log('Chat backend listening on http://0.0.0.0:8787'));
