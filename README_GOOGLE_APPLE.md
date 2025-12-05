# Google & Apple Sign-In — setup guide (FitConnect)

This guide shows the minimal steps to get Google Sign-In working in Expo Go (via expo-auth-session proxy) and how to prepare for native sign-in (custom dev client / EAS).

1) Create a Web OAuth Client ID (Google Cloud Console)

- Open <https://console.cloud.google.com/apis/credentials>
- Click "Create Credentials" → "OAuth client ID"
- Choose "Web application" as application type
- For "Authorized redirect URIs" add the Expo proxy redirect URI:
  - `https://auth.expo.io/@<EXPO_USERNAME>/FitConnect`
  - Replace `<EXPO_USERNAME>` with your Expo username (set it in `app.json.extra.EXPO_USERNAME` or find it with `npx expo whoami`).
- Create client and copy the Client ID (it looks like `1234-abcdefg.apps.googleusercontent.com`).

2) Put the client ID in `app.json`

- Open `app.json` at project root
- Under `expo.extra.GOOGLE_WEB_CLIENT_ID` replace the placeholder `YOUR_WEB_CLIENT_ID.apps.googleusercontent.com` with your real Client ID.

Example:

```jsonc
"extra": {
  "GOOGLE_WEB_CLIENT_ID": "1234-abcdefg.apps.googleusercontent.com",
  "EXPO_USERNAME": "your-expo-username"
}
```

3) Test in Expo Go

- Start Metro: `npx expo start -c`
- Open the app in Expo Go and press "Continuer avec Google". The flow should open in the browser and redirect back via the Expo proxy.
- If the flow fails with missing id_token, ensure the redirect URI in Google Console exactly matches the proxy URI.

4) Native sign-in (GoogleSignin / AppleAuth)

- Expo Go does not include arbitrary native modules. To test native Google/Apple sign-in, create a development build (custom dev client) with EAS:
  - Install EAS CLI: `npm install -g eas-cli`
  - Configure `eas.json` and `app.json` if needed
  - Run `eas build --profile development --platform ios` (and Android) to produce a dev-client you can install on device
  - The dev client includes native modules and will allow `@react-native-google-signin/google-signin` and `@invertase/react-native-apple-authentication` to work.

5) Apple Sign-In notes

- Apple Sign-In only works on iOS 13+ and requires native support. In Expo Go the native module may not be available — use a development build or a production build to test.

6) If you prefer, I can:

- Insert the Web Client ID for you if you paste it here, or
- Generate an `eas.json` + checklist for building custom dev clients.

---
If you want me to update the project with your client ID, paste it here and I will commit the change and restart Metro for you.
