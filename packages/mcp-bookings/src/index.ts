
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
// STDIO (default):
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
// HTTP (optional):
// import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/http.js";

import { z } from "zod";
import fetch from "node-fetch";

const server = new Server(
  { name: "bookings-mcp", version: "1.0.0" },
  { capabilities: { tools: {}, resources: {} } }
);

server.tool(
  "create_booking",
  "Create a new booking for a guest",
  {
    guestEmail: z.string().email(),
    checkIn: z.string().describe("ISO date"),
    checkOut: z.string().describe("ISO date"),
    roomType: z.string()
  },
  { title: "Create Booking" },
  async ({ guestEmail, checkIn, checkOut, roomType }) => {
    const res = await fetch(`${process.env.API_URL}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.API_TOKEN}`
      },
      body: JSON.stringify({ guestEmail, checkIn, checkOut, roomType })
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  }
);

server.tool(
  "message_guest",
  "Send a message to a guest for a booking",
  {
    bookingId: z.string(),
    message: z.string().min(1)
  },
  { title: "Message Guest" },
  async ({ bookingId, message }) => {
    const res = await fetch(`${process.env.API_URL}/messaging/guest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.API_TOKEN}`
      },
      body: JSON.stringify({ bookingId, message })
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();
    return { content: [{ type: "text", text: JSON.stringify(data) }] };
  }
);

// ---- Transport selection ----
// STDIO (default):
const transport = new StdioServerTransport();
await server.connect(transport);
console.log("MCP (STDIO) ready");

// HTTP (optional):
// const port = Number(process.env.PORT || 8000);
// const httpTransport = new StreamableHTTPServerTransport({ port, path: "/" });
// await server.connect(httpTransport);
// console.log(`MCP (HTTP) listening on http://0.0.0.0:${port}/`);
