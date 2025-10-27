
export type Role = "user" | "assistant";
export interface ChatMessage { id: string; role: Role; text: string; createdAt: number; }
