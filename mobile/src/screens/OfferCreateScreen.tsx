
import React from "react";
import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function OfferCreateScreen() {
  const params = useLocalSearchParams<{ reservationId?: string; discountPct?: string }>();
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 10 }}>Offer Creation</Text>
      <Text>Reservation ID: {params.reservationId || "-"}</Text>
      <Text>Discount %: {params.discountPct || "-"}</Text>
      <Text style={{ marginTop: 14, color: "#666" }}>
        Open via deep link:
        {"
"}aiux://offer/create?reservationId=ABC123&discountPct=15
      </Text>
    </View>
  );
}
