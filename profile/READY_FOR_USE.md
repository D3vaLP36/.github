# MusicShortsPro — Ready for Use Guide

## 1) Install dependencies

```bash
npm install react firebase lucide-react
```

If you use Tailwind classes (as this component does), ensure Tailwind is already configured in your host app.

## 2) Provide runtime globals before mounting

In your app shell (or index html bootstrap), define:

- `window.__firebase_config` (JSON string)
- `window.__app_id` (optional)
- `window.__initial_auth_token` (optional)
- `window.__museshorts_runtime` (optional JSON string for high-speed/access-control behavior)

Example:

```html
<script>
  window.__firebase_config = JSON.stringify({
    apiKey: '...your-key...',
    authDomain: '...your-project.firebaseapp.com',
    projectId: '...your-project-id...',
    storageBucket: '...your-project.appspot.com',
    messagingSenderId: '...sender-id...',
    appId: '...app-id...'
  });
  window.__app_id = 'museshorts-pro-v5';
  // window.__initial_auth_token = 'optional-custom-token';
  window.__museshorts_runtime = JSON.stringify({
    highSpeedMode: true,
    requireCustomToken: true,
    handshakeDelayMs: 450,
    allowClientSideTopUp: false,
    paymentsApiBase: '/api/payments'
  });
</script>
```

> Access-control note: when `requireCustomToken` is `true`, anonymous auth is blocked by design.
> Payment note: set `allowClientSideTopUp: false` in production and use a server-side checkout endpoint.

## 3) Mount the component

```jsx
import App from './profile/MusicShortsProApp';

export default function Page() {
  return <App />;
}
```

## 4) Firestore structure expected by the component

- `artifacts/{appId}/users/{uid}/profile/stats`
- `artifacts/{appId}/users/{uid}/vault/{docId}`

## 5) Minimum rule behavior to verify

- Authenticated user can read/write only their own `users/{uid}` subtree.
- Profile doc can be created if absent.
- Vault documents can be created and listed.
- Starter rules are provided in `profile/FIRESTORE_RULES.example`.

## 6) Smoke test checklist

1. Load app and verify sign-in (anonymous or custom token).
2. Verify profile auto-creates with `credits: 15`.
3. Run one generation and confirm credits decrement.
4. Confirm vault item appears in list.
5. Trigger low-credit flow and verify pricing modal appears.
6. Generate output and click **Save Screenshot** in the preview overlay to verify capture/download.
7. Toggle high-speed mode in `__museshorts_runtime` and verify faster handshake response.
8. In **Vault**, use **Play** to load item back into Studio preview and **Download Master** to save the asset.

## 7) Terminal environment check

Run:

```bash
bash profile/scripts/terminal_env_check.sh
```

This confirms basic CLI readiness and prints the required runtime globals for deployment.

## 8) Local smoke check

Run:

```bash
bash profile/scripts/smoke_check.sh
```

This verifies required files and key component symbols before a manual run.

## 9) Payment endpoint contract (secure mode)

When `allowClientSideTopUp` is `false`, the app calls:

- `POST {paymentsApiBase}/checkout`

Expected JSON request:

```json
{
  "uid": "firebase-user-id",
  "appId": "museshorts-pro-v5",
  "credits": 500
}
```

Expected JSON response:

```json
{
  "checkoutUrl": "https://your-payment-provider/checkout/session-id"
}
```

---

If all checks pass, the component is ready for practical use in your app.
