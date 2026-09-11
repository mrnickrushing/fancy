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

## Before the first build

This app has not been through `eas init` yet, so `app.json` carries no
`extra.eas.projectId` and no `updates` block. That is deliberate — a made-up
project id produces an app that fails to fetch its own updates. Two things
follow from it, both of which fix themselves once it is run:

- **Push notifications register as a no-op.** `getExpoPushTokenAsync` needs a
  project to mint a token against, so the hook returns nothing instead of
  throwing. The server side is finished and tested; it is only the token that
  is missing.
- **OTA updates are off.** `Updates.isEnabled` is false, and the Updates screen
  says so rather than pretending.

```bash
cd app
eas init                 # writes the project id, and the updates url
eas build --platform ios --profile production
```

`eas.json` has no `submit` block yet either: it needs an App Store Connect app
id and an Apple team id, which exist only once the app is registered there.
