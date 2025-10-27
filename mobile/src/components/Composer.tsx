
import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, Text, KeyboardAvoidingView, Platform } from "react-native";

export default function Composer({ onSend, loading }: { onSend: (t: string) => void; loading?: boolean }) {
  const [text, setText] = useState("");
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ flexDirection: "row", padding: 8, borderTopWidth: 1, borderTopColor: "#eee" }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type your message…"
          style={{ flex: 1, padding: 12, backgroundColor: "#fafafa", borderRadius: 10, marginRight: 8 }}
          editable={!loading}
        />
        <TouchableOpacity
          onPress={() => { if (text.trim().length) { onSend(text.trim()); setText(""); } }}
          disabled={loading}
          style={{ backgroundColor: loading ? "#aaa" : "#0a84ff", paddingHorizontal: 14, borderRadius: 10, justifyContent: "center" }}
        >
          <Text style={{ color: "#fff", fontWeight: "600" }}>{loading ? "…" : "Send"}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
