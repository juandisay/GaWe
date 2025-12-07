pub mod models;
pub mod timer;
pub mod commands;
pub mod activity;
pub mod audio;

use timer::TimerManager;
use activity::ActivityManager;
use audio::AudioManager;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let timer_manager = TimerManager::new();
    let activity_manager = ActivityManager::new();
    let audio_manager = AudioManager::new();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_notification::init())
        .manage(timer_manager)
        .manage(activity_manager)
        .manage(audio_manager)
        .setup(|app| {
            let activity_manager = app.state::<ActivityManager>();
            activity_manager.start_monitoring(app.handle().clone());
            Ok(())
        })
    .invoke_handler(tauri::generate_handler![
            commands::start_timer,
            commands::pause_timer,
            commands::load_session,
            commands::get_timer_status,
            commands::set_activity_monitoring,
            commands::play_music,
            commands::pause_music,
            commands::stop_music,
            commands::set_volume
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
