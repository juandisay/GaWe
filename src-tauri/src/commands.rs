use tauri::{AppHandle, State};
use crate::models::Session;
use crate::timer::TimerManager;
use crate::activity::ActivityManager;
use crate::audio::AudioManager;

#[tauri::command]
pub fn start_timer(app: AppHandle, state: State<'_, TimerManager>) {
    state.start(app);
}

#[tauri::command]
pub fn pause_timer(state: State<'_, TimerManager>) {
    state.pause();
}

#[tauri::command]
pub fn load_session(session: Session, state: State<'_, TimerManager>) {
    state.load_session(session);
}

#[tauri::command]
pub fn get_timer_status(state: State<'_, TimerManager>) -> Option<crate::timer::TimerUpdate> {
    state.get_status()
}

#[tauri::command]
pub fn set_activity_monitoring(enabled: bool, threshold: u64, state: State<'_, ActivityManager>) {
    state.set_enabled(enabled);
    state.set_threshold(threshold);
}

#[tauri::command]
pub fn play_music(file_path: String, loop_enabled: bool, state: State<'_, AudioManager>) -> Result<(), String> {
    state.play(file_path, loop_enabled)
}

#[tauri::command]
pub fn pause_music(state: State<'_, AudioManager>) {
    state.pause();
}

#[tauri::command]
pub fn stop_music(state: State<'_, AudioManager>) {
    state.stop();
}

#[tauri::command]
pub fn set_volume(volume: f32, state: State<'_, AudioManager>) {
    state.set_volume(volume);
}
