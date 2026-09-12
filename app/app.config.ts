import { ExpoConfig, ConfigContext } from 'expo/config';

// Extends the static app.json. The API base URL reaches the app through
// `extra` so a build can be pointed at a local server with EXPO_PUBLIC_API_URL
// without editing anything that is committed.
//
// The EAS project and update channel are configured in app.json. The API URL
// remains environment-configurable so local and production builds can share
// this config without source edits.
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  extra: {
    ...config.extra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://ohyoufancyfocaccia.com',
  },
});
