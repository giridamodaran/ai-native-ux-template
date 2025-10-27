
import { Platform } from "react-native";

const DEFAULTS = {
  ANDROID: "http://10.0.2.2:8787",
  IOS: "http://127.0.0.1:8787"
};

export const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || (Platform.OS === "android" ? DEFAULTS.ANDROID : DEFAULTS.IOS);

export async function chat(prompt: string): Promise<string> {
  const res = await fetch(`${BACKEND_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt })
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Backend error ${res.status}: ${body}`);
  }
  const data = await res.json().catch(() => ({}));
  return data.answer ?? "";
}
