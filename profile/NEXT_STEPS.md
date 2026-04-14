# Next Steps (JS → Debug → Go → Music → Done)

Given your current app state, here is the practical sequence:

1. **JS**
   - Keep the React component as the source of truth (`profile/MusicShortsProApp.jsx`).
   - Make sure your host project has dependencies installed:
     - `react`
     - `firebase`
     - `lucide-react`
   - Ensure Tailwind classes are available in your app theme/build.

2. **Debug**
   - Run the app and test these flows manually:
     - anonymous/custom-token sign-in
     - profile auto-create (`credits: 15`)
     - generate action with credit deduction
     - vault write/read via realtime snapshots
     - low-credit modal open and purchase update
   - Watch browser console for Firebase permission/config errors.

3. **Go**
   - If all flows pass, wire this component into your route/page entrypoint.
   - Set production Firebase config values in your deployment environment.
   - Apply `profile/FIRESTORE_RULES.example` (or equivalent) so users can access only their own subtree.
   - Enable secure payments (`allowClientSideTopUp: false`) and implement `/api/payments/checkout`.

4. **Music**
   - Replace placeholder output URLs with your real media generation endpoint.
   - Connect `fetchWithRetry`-style API logic (or your backend call) before vault save.
   - Store extra metadata (duration, BPM, genre, model version, render status).

5. **Done**
   - Add basic automated checks (lint/build).
   - Add smoke tests for auth + create vault item.
   - Run `bash profile/scripts/smoke_check.sh`.
   - Run `bash profile/scripts/terminal_env_check.sh` before release.
   - Ship.

---

If you want, next I can add a minimal `README` runbook and a Firestore rules starter for this exact collection structure.
