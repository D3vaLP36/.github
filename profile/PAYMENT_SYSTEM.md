# Payment System (Production Recommendation)

## Why

Client-side credit updates are useful for local demos, but production should use a secure checkout flow.

## Runtime switch

Use runtime config:

```js
window.__museshorts_runtime = JSON.stringify({
  allowClientSideTopUp: false,
  paymentsApiBase: '/api/payments'
});
```

## Required backend endpoints

### 1) Create checkout session

`POST /api/payments/checkout`

Request:

```json
{
  "uid": "firebase-user-id",
  "appId": "museshorts-pro-v5",
  "credits": 500
}
```

Response:

```json
{
  "checkoutUrl": "https://payments.example/checkout/session_123"
}
```

### 2) Webhook (provider -> your backend)

Handle provider webhook to confirm payment, then update Firestore server-side:

- `artifacts/{appId}/users/{uid}/profile/stats.credits += purchased_credits`
- set audit metadata (payment id, amount, timestamp)

## Security requirements

- Never trust client credit values in production.
- Validate purchased plan server-side.
- Verify webhook signatures.
- Use idempotency keys to prevent duplicate credit grants.
