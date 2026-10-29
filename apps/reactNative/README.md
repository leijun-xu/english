# English App React Native

Expo SDK 58 + React Native 0.88 mobile client. It mirrors the login, word book,
course purchase, spelling practice, AI chat, settings, reminders, and analytics
features in `apps/react-web`.

## Configuration

Create `.env.local` when running on a physical device. Replace the IP with the
LAN address of the computer running the backend:

```bash
EXPO_PUBLIC_SERVER_URL=http://192.168.1.10:3000
EXPO_PUBLIC_AI_URL=http://192.168.1.10:3001
EXPO_PUBLIC_SOCKET_URL=http://192.168.1.10:3002
EXPO_PUBLIC_UPLOAD_URL=http://192.168.1.10:9000
```

iOS Simulator defaults to `localhost`; Android Emulator defaults to `10.0.2.2`.
For the current online environment, API and AI requests use
`http://120.26.245.143`, Socket.IO uses port `3000`, and uploaded assets use
port `9000`.

## Run

```bash
pnpm start
pnpm ios
pnpm android
pnpm type-check
```

Speech recognition contains native code, so use an Expo development build for
that feature. The rest of the application can be inspected with Expo Go.
