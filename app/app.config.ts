import { ExpoConfig, ConfigContext } from 'expo/config';

// Extends the static app.json. The API base URL reaches the app through
// `extra` so a build can be pointed at a local server with EXPO_PUBLIC_API_URL
// without editing anything that is committed.
//
// There is no `updates` block and no `extra.eas.projectId` yet: `eas init`
// writes both, and inventing a project id here would only produce an app that
// fails to fetch its own updates. Until it is run, OTA is off and push
// registration returns nothing rather than throwing.
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  extra: {
    ...config.extra,
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://ohyoufancyfocaccia.com',
  },
});
