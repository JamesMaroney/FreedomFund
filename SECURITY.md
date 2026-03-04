# Security

Freedom Fund is designed to be a simple, private personal finance tracker. This document explains what data the app collects, where it lives, and what the security tradeoffs are so you can make an informed decision about using it.

---

## The short version

- **No account, no login, no server.** The app has no backend. Nothing you enter is ever sent anywhere.
- **All data stays on your device.** Your deposit history, goals, and settings are stored exclusively in your browser's `localStorage`.
- **The app never touches your bank.** It opens Ally Bank's website in a new tab — that's it. No credentials, no API access, no read or write access to any financial account.

---

## Data storage

All app state — deposit history, streak, goals, tip presets — is stored in your browser's **`localStorage`** under the key `freedom-fund-state`. This means:

- Data is local to the browser and device you use. It is not synced to any cloud or server.
- If you clear your browser data or use a different browser/device, your history will be gone.
- The data is not encrypted at rest. Anyone with physical or remote access to your browser profile could read it. It contains dollar amounts and timestamps — no account numbers, passwords, or personally identifying information.

---

## Network requests

The app makes the following outbound requests:

| Request | When | Why |
|---|---|---|
| `https://fonts.googleapis.com` | On every page load | Loads DM Mono and Plus Jakarta Sans fonts |
| `https://jamesmaroney.github.io` | First load + PWA updates | Fetches the app itself and service worker updates |
| `https://secure.ally.com/payments/transfers` | When you tap "Send to Ally" | Opens Ally Bank in a new tab so you can manually initiate a transfer |

There are no analytics, tracking pixels, telemetry, or advertising requests of any kind.

### Google Fonts

Loading fonts from Google Fonts means Google's servers receive your IP address and user-agent at page load time, the same as any website that uses Google Fonts. If this is a concern, you can self-host the fonts — see [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## The Ally link

When you tap **Send to Ally**, the app:

1. Copies the transfer amount (e.g. `42.50`) to your clipboard
2. Opens `https://secure.ally.com/payments/transfers` in a new tab using `rel="noopener noreferrer"`, which prevents the Ally tab from accessing this app's window

The app does **not**:
- Log in to Ally on your behalf
- Read your Ally balance or transaction history
- Store or transmit your Ally credentials
- Use any bank API

You initiate and authorize the transfer yourself, manually, inside Ally's own secure interface.

---

## Open source

The full source code is available at [github.com/JamesMaroney/FreedomFund](https://github.com/JamesMaroney/FreedomFund). You can audit exactly what the app does before using it.

---

## Reporting a vulnerability

If you find a security issue, please [open a GitHub issue](https://github.com/JamesMaroney/FreedomFund/issues) or email the maintainer directly. Given that this app has no backend and handles no credentials, the practical attack surface is limited — but responsible disclosure is always appreciated.
