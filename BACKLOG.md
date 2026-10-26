# TripWise backlog

## Shipped in 1.1.0

- Marking settlement transfers as paid and undoing them
- Sharing the payment plan as text
- Invite codes and `tripwise://join/<code>` links, joining by claiming an existing participant, leaving a trip
- Viewer-aware UI that hides edit actions RLS would reject
- European Central Bank reference rates (Frankfurter) as an editable prefill in the expense form
- CSV and PDF export of trip expenses, balances and payments
- Copying demo trips into a signed-in account

## Deferred

- Live multi-user collaboration and presence (members currently see changes after a refresh)
- Push notifications, including reminders for unpaid settlements (needs FCM credentials and a server-side sender)
- QR invite scanning (invite codes and links cover the flow today)
- HTTPS invite links (App Links) that open the store when the app is not installed; needs a verified domain
- Receipt OCR
- Exchange rates for currencies the ECB does not publish
- Revoking or listing active invite codes in the UI (the `trip_invites` RLS policies already allow it)
- Paid subscriptions and advertising
- Production AI features

No current UI presents deferred features as available.
