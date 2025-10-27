
import { useEffect } from "react";
import * as Linking from "expo-linking";
import { router } from "expo-router";

export default function useDeepLinking() {
  useEffect(() => {
    const getUrlAsync = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) handleUrl(initialUrl);
    };

    const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    getUrlAsync();
    return () => sub.remove();
  }, []);
}

function handleUrl(url: string) {
  const parsed = Linking.parse(url);
  if (parsed.path?.startsWith("offer/create")) {
    const { reservationId, discountPct } = parsed.queryParams || {};
    router.push({
      pathname: "screens/OfferCreateScreen",
      params: { reservationId: String(reservationId || ""), discountPct: String(discountPct || "") }
    });
  }
}
