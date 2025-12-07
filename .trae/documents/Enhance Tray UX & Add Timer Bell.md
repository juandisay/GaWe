I will implement the "Minimize to Tray" interaction and "Ring Bell on Task Change" features.

## 1. Minimize to Tray
- **Refinement**: I previously handled the `CloseRequested` event. I need to ensure that the **tray icon click** restores the window.
- **Verification**: The `lib.rs` code I reviewed already has:
  ```rust
  .on_menu_event(|app, event| {
      match event.id.as_ref() {
          "show" => { ... window.show(); window.set_focus(); ... }
          // ...
      }
  })
  ```
  And `TrayIconBuilder` is configured with `.show_menu_on_left_click(true)`.
  However, often users expect a single click on the icon itself (not just the menu) to show/toggle the window.
  I will modify `lib.rs` to handle `on_tray_icon_event` for `Click` events directly, improving the UX so a single click restores the app.

## 2. Ring Bell on Task Change
- **Goal**: Play a sound when a task finishes.
- **Implementation**:
  - **Audio Source**: I will embed a simple "bell" sound (using a sine wave or a small embedded buffer) in `audio.rs` to avoid external file dependencies for this core feature.
  - **Logic**:
    - Update `AudioManager` to handle a new command `PlayBell`.
    - In `timer.rs`, when the timer reaches 0 and switches tasks, I need to trigger this.
    - **Challenge**: `TimerManager` is running in a separate Tokio task and needs access to `AudioManager`.
    - **Solution**: Pass the `AppHandle` to the timer loop. Inside the loop, retrieve the `AudioManager` state using `app_clone.state::<AudioManager>()` and call its play method.

## Execution Steps
1.  **Backend (`audio.rs`)**: Add `AudioCommand::PlayBell` and implement generation of a simple beep/bell sound using `rodio::source::SineWave` or similar (since `rodio` supports procedural sources).
2.  **Backend (`timer.rs`)**: In the timer loop, access `AudioManager` state and call `play_bell()` when `guard.remaining_seconds` hits 0.
3.  **Backend (`lib.rs`)**: Enhance tray interaction to support direct clicking.

I will start by updating `audio.rs` to support the bell sound.