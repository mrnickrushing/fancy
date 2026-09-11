# Oh! You Fancy Focaccia — the order book, on a phone

Amanda's admin, as an app. It talks to the same Express + Postgres server the
website runs on, and shows the same order book as `/admin` — accept an order at
the market without opening a laptop, and hear about a new one the moment it
arrives.

It is an **owner's app**. Customers order from the website; nothing here is for
them.

## What it does

| | |
|---|---|
| **Today** | What is waiting on you, what is wanted today, what is still owed, and the next thirty days |
| **Orders** | The whole book — search, filter by status, sort; write an order in by hand |
| **Order detail** | Accept or decline, set the total, record payments as they come in, send the confirmation or a receipt, write a one-off email, edit the details, cancel or delete |
| **Customers** | Who keeps coming back, what they have spent, and every order they have placed |
| **Days off** | Block a range and it disappears from the order form |
| **Bill of fare** | Prices, descriptions, and what is available this week — the same menu the website reads |
| **Reviews** | Nothing reaches the website until it is approved here |
| **Settings** | Notice period, deposit, the wording about paying, the email outbox, your password |

New website orders arrive as a push notification.

## How it is built

Expo SDK 54 with `expo-router`, TypeScript, `@tanstack/react-query` for
fetching, `zustand` for auth, `axios`, and `expo-secure-store` for the
credentials. The three faces are the website's own — Bodoni Moda, EB Garamond,
Italianno — and `src/theme/colors.ts` is a transcription of the tokens in
`design/_build.py`. When one moves, both move.

```
app/                      expo-router routes
  _layout.tsx             fonts, react-query, the auth gate, OTA check
  login.tsx               sign-in
  (tabs)/                 Today · Orders · Customers · Days Off · More
                          (menu, reviews and settings live here too, reached from More)
  order/[id].tsx          one order, end to end
  customer/[key].tsx      one customer and their history
  new-order.tsx           an order taken in person
src/
  api/                    the client, and one module per resource
  components/             Button, Card, Badge, Input, Screen, StatCard, …
  hooks/                  useOrders, useMenu, useResources, usePushNotifications
  store/auth.ts           zustand
  theme/                  the website's tokens
  utils/                  dates, money, filtering — the parts worth testing
```

## Signing in

There is no separate sign-in endpoint. The server checks HTTP Basic on every
`/api/admin` request, so a successful read *is* the sign-in, and the credentials
have to be kept — they live in the keychain by way of `expo-secure-store`.

Use the same username and password as the website's admin page. Changing the
password in Settings changes it in both places at once, and signs out any
browser session that was open.

## Running it

```bash
cd app
npm install
cp .env.example .env     # then point EXPO_PUBLIC_API_URL wherever you want
npx expo start
```

Press `i`, `a`, or scan the code with Expo Go. To work against a server running
on your own machine, set `EXPO_PUBLIC_API_URL=http://localhost:3000` first.

| Variable | What it is |
|---|---|
| `EXPO_PUBLIC_API_URL` | The backend this build talks to. Defaults to `https://ohyoufancyfocaccia.com` |
| `EXPO_PUBLIC_API_URL_DEV` | The same server run locally, for convenience |

## Checks

```bash
npm run typecheck
npm test           # vitest, over src/utils
npx expo-doctor
```

## Building and shipping

| | |
|---|---|
| Expo project | `@rushingtechnologies/ohyoufancyfocaccia-admin` (`05ee10d4-e4eb-4a78-a1ca-d6d35874adbf`) |
| Bundle identifier | `com.nickrushing.ohyoufancyfocaccia`, iOS and Android alike |
| App Store Connect | Apple ID `6811223231`, listed as **Bread Lady** |
| Apple team | `PH4AKDQ4Q7` |
| OTA channel | `production`, `runtimeVersion` following `appVersion` |

The store listing is **Bread Lady**, and `expo.name` matches it, so the name
under the icon on Amanda's phone is the name in the App Store. The repository,
the slug and the bundle identifier all still say `ohyoufancyfocaccia`; they are
identifiers rather than names, and renaming a slug or a bundle id costs more
than it is worth.

The App ID carries the **Push Notifications** capability, which is what lets
Expo mint a token for it. Its Broadcast sub-capability is deliberately off.

```bash
cd app
eas build --platform ios --profile production            # build
eas build --platform ios --profile production --auto-submit  # build and send to TestFlight
eas update --channel production --message "..."          # OTA, no review
```

The first build asks for signing credentials. `ios.credentialsSource` is
`remote`, so EAS keeps the distribution certificate and the push key; it needs
to authenticate with Apple once to create them.

Before shipping:

```bash
npm run typecheck && npm test && npx expo-doctor
```
