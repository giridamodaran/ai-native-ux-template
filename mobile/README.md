
# AI Native UX — Mobile (React Native / Expo)

## Run

```bash
cd mobile
npm i
# Optional for devices on same Wi‑Fi:
# export EXPO_PUBLIC_BACKEND_URL="http://<your-host-ip>:8787"
npm start
```

- **Android emulator** → `http://10.0.2.2:8787`
- **iOS simulator** → `http://127.0.0.1:8787`
- **Physical device** → set `EXPO_PUBLIC_BACKEND_URL` to your laptop IP (e.g., `http://192.168.1.10:8787`)

## Deep link test

```bash
# macOS (iOS Simulator):
xcrun simctl openurl booted "aiux://offer/create?reservationId=ABC123&discountPct=15"
```

This opens **OfferCreateScreen** with the params.
