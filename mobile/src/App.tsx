
import React from "react";
import { SafeAreaView, StatusBar } from "react-native";
import { Stack } from "expo-router";
import useDeepLinking from "./hooks/useDeepLinking";

export default function App() {
  useDeepLinking();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <StatusBar barStyle="dark-content" />
      <Stack screenOptions={{ headerShown: true }}>
        <Stack.Screen name="screens/ChatScreen" options={{ title: "Assistant" }} />
        <Stack.Screen name="screens/OfferCreateScreen" options={{ title: "Create Offer" }} />
      </Stack>
    </SafeAreaView>
  );
}
