
# Architecture

```mermaid
flowchart LR
  subgraph Client Surfaces
    A1[Web: Command Palette + Chat]
    A2[iOS App
(App Intents)]
    A3[Android App
(App Actions/Shortcuts)]
  end
  subgraph Assistant & Orchestration
    B1[Claude (API/Desktop)
Multimodal LLM]
    B2[MCP Host/Client
(Claude Desktop or custom)]
  end
  subgraph Tooling via MCP
    C1[MCP Server: Booking API
(create_booking, cancel_booking)]
    C2[MCP Server: Messaging
(send_guest_message, notify_ops)]
    C3[MCP Server: Filesystem / Reports]
  end
  subgraph App & Data
    D1[Domain Microservices
(Reservations, Pricing, Guests)]
    D2[DB/Events/Queues]
  end
  subgraph Privacy, Governance & Logs
    E1[Action Logs & Audit Trail]
    E2[Policy / RBAC / PII redaction]
    E3[Transparency labels & provenance]
  end
  subgraph Optional On‑device AI
    F1[Android: LiteRT + QNN Delegate
(NPU inference)]
  end
  A1 -->|prompt| B1
  A2 -->|intent| B1
  A3 -->|intent| B1
  B1 <-->|tools| B2
  B2 <-->|JSON-RPC| C1
  B2 <-->|JSON-RPC| C2
  B2 <-->|JSON-RPC| C3
  C1 --> D1 --> D2
  C2 --> D1
  C3 --> D2
  B2 --> E1
  D1 --> E1
  E1 --> E2
  E1 --> E3
  A3 -.local models.-> F1
```

## References
- MCP SDKs: https://modelcontextprotocol.io/
- App Intents (iOS): https://developer.apple.com/documentation/appintents/
- App Actions (Android): https://developer.android.com/reference/app-actions/built-in-intents
