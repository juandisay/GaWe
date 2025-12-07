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

            #[cfg(desktop)]
            {
                use tauri::menu::{Menu, MenuItem};
                use tauri::tray::{TrayIconBuilder, TrayIconEvent, MouseButton};

                let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
                let show_i = MenuItem::with_id(app, "show", "Show AgentTrons", true, None::<&str>)?;
                let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

                let _tray = TrayIconBuilder::new()
                    .menu(&menu)
                    .show_menu_on_left_click(false)
                    .on_tray_icon_event(|tray, event| {
                        if let TrayIconEvent::Click {
                            button: MouseButton::Left,
                            ..
                        } = event
                        {
                            let app = tray.app_handle();
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    })
                    .on_menu_event(|app, event| {
                match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                }
            })
            .build(app)?;
        }
        Ok(())
    })
    .on_window_event(|window, event| {
        if let tauri::WindowEvent::CloseRequested { api, .. } = event {
            window.hide().unwrap();
            api.prevent_close();
        }
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
