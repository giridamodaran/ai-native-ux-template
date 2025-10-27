
import React from "react";
import { View, Text } from "react-native";
import type { ChatMessage } from "@/types/chat";

export default function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <View style={{
      alignSelf: isUser ? "flex-end" : "flex-start",
      backgroundColor: isUser ? "#DCF8C6" : "#F1F1F1",
      margin: 8,
      padding: 10,
      borderRadius: 12,
      maxWidth: "85%"
    }}>
      <Text style={{ color: "#222" }}>{msg.text}</Text>
    </View>
  );
}
