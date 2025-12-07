I will finalize the requested features: "Minimize to Tray", "Activity Monitoring", and "Session Loading".

## 1. Minimize to Tray
- **Goal**: Prevent the app from exiting when the window is closed; instead, hide it to the system tray.
- **Implementation**:
    - Modify `src-tauri/src/lib.rs` to intercept the `WindowEvent::CloseRequested` event.
    - Call `event.prevent_close()` and `window.hide()` to keep the process running in the background.
    - Ensure the Tray Menu "Show AgentTrons" item properly restores the window.

## 2. Activity Monitoring Verification
- **Current State**: The backend logic in `src-tauri/src/activity.rs` is sound (uses `user-idle` polling).
- **Missing Piece**: The frontend (`Settings.tsx` or similar) needs to actually **call** `set_activity_monitoring` to enable it.
- **Action**:
    - Create/Update `src/pages/Settings.tsx` to include a toggle for Activity Monitoring.
    - Ensure this toggle calls the Rust command `set_activity_monitoring`.
    - Add a listener in `App.tsx` or `Layout.tsx` for the `activity-warning` event to show a frontend toast/alert in addition to the system notification.

## 3. Session Loading Verification
- **Current State**: I previously updated `App.tsx` to call `loadSessions()` on mount, and `sessionStore.ts` to handle empty states.
- **Action**: I will double-check that the `lazy-store` file (`sessions.json`) is being created correctly. The code looks correct, but I will add a small log or visual indicator if the list is empty to reassure the user.

## Execution Steps
1.  **Backend (`lib.rs`)**: Add `on_window_event` handler for `CloseRequested`.
2.  **Frontend (`Settings.tsx`)**: Implement the UI to enable/disable activity monitoring.
3.  **Frontend (`App.tsx`)**: Add event listener for `activity-warning` (optional but good for UX).
4.  **Verify**: Ensure `loadSessions` is working (already done in previous step, but I will confirm via code review).
