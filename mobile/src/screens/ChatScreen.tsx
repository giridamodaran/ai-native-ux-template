
import React, { useMemo, useRef, useState } from "react";
import { View, FlatList, RefreshControl, Text } from "react-native";
import { chat } from "@/services/api";
import type { ChatMessage } from "@/types/chat";
import MessageBubble from "@/components/MessageBubble";
import Composer from "@/components/Composer";

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const sorted = useMemo(() => messages.sort((a, b) => a.createdAt - b.createdAt), [messages]);

  async function send(text: string) {
    const userMsg: ChatMessage = { id: `${Date.now()}-u`, role: "user", text, createdAt: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const answer = await chat(text);
      const aiMsg: ChatMessage = { id: `${Date.now()}-a`, role: "assistant", text: answer || "(no response)", createdAt: Date.now() };
      setMessages(prev => [...prev, aiMsg]);
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    } catch (e: any) {
      const aiMsg: ChatMessage = { id: `${Date.now()}-e`, role: "assistant", text: `Error: ${e.message}`, createdAt: Date.now() };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={listRef}
        data={sorted}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble msg={item} />}
        contentContainerStyle={{ paddingVertical: 12 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => {}} />}
        ListHeaderComponent={
          <View style={{ padding: 12 }}>
            <Text style={{ fontSize: 12, color: "#666" }}>
              Backend: {process.env.EXPO_PUBLIC_BACKEND_URL || "(default emulator URL)"}{"
"}
              Tip (Android): use 10.0.2.2:8787 to reach your host machine
            </Text>
          </View>
        }
      />
      <Composer onSend={send} loading={loading} />
    </View>
  );
}
