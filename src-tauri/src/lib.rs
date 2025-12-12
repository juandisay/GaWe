pub mod activity;
pub mod audio;
pub mod commands;
pub mod models;
pub mod timer;

use activity::ActivityManager;
use audio::AudioManager;
use tauri::Manager;
use timer::TimerManager;

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
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let app = window.app_handle();
                let timer_manager = app.state::<TimerManager>();

                // Check if timer is running
                if let Some(status) = timer_manager.get_status() {
                    if status.is_running {
                        // Prevent closing immediately
                        api.prevent_close();

                        use tauri_plugin_dialog::{DialogExt, MessageDialogKind};
                        
                        let _ = app.dialog()
                            .message("A Pomodoro session is currently running.\nPlease stop the timer before exiting.")
                            .title("Session Active")
                            .kind(MessageDialogKind::Warning)
                            .show(|_| {});
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
