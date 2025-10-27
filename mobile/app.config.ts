
import { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    name: "AI Native UX Mobile",
    slug: "ai-native-ux-mobile",
    scheme: "aiux",
    ios: { supportsTablet: true },
    android: {
      adaptiveIcon: { foregroundImage: "./assets/adaptive-icon.png", backgroundColor: "#ffffff" },
      package: "com.yourorg.ainativeux"
    },
    web: { bundler: "metro" },
    extra: {}
  };
};
