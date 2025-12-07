use std::sync::{Arc, Mutex};
use std::time::Duration;
use tauri::{AppHandle, Emitter};
use tauri_plugin_notification::NotificationExt;
use user_idle::UserIdle;

pub struct ActivityState {
    pub is_enabled: Arc<Mutex<bool>>,
    pub threshold_seconds: Arc<Mutex<u64>>,
    pub notified: Arc<Mutex<bool>>,
}

pub struct ActivityManager {
    pub state: Arc<ActivityState>,
}

impl ActivityManager {
    pub fn new() -> Self {
        let is_enabled = Arc::new(Mutex::new(false));
        let threshold_seconds = Arc::new(Mutex::new(300)); // Default 5 minutes
        let notified = Arc::new(Mutex::new(false));

        let state = Arc::new(ActivityState {
            is_enabled: is_enabled.clone(),
            threshold_seconds: threshold_seconds.clone(),
            notified: notified.clone(),
        });

        Self { state }
    }

    pub fn start_monitoring(&self, app: AppHandle) {
        let state = self.state.clone();
        
        tauri::async_runtime::spawn(async move {
            loop {
                tokio::time::sleep(Duration::from_secs(5)).await;
                
                let is_enabled = *state.is_enabled.lock().unwrap();
                if !is_enabled {
                    continue;
                }

                let threshold = *state.threshold_seconds.lock().unwrap();
                
                // Get system idle time
                if let Ok(idle_time) = UserIdle::get_time() {
                    let idle_seconds = idle_time.as_seconds();
                    
                    if idle_seconds > threshold {
                        // Only notify if not already notified for this idle period
                        let mut notified_guard = state.notified.lock().unwrap();
                        if !*notified_guard {
                            // Trigger notification
                            let _ = app.emit("activity-warning", ());
                            let _ = app.notification()
                                .builder()
                                .title("Are you still there?")
                                .body("We haven't detected any activity for a while. Stay focused!")
                                .show();
                            
                            *notified_guard = true;
                        }
                    } else {
                        // Reset notified flag if user became active
                        let mut notified_guard = state.notified.lock().unwrap();
                        if *notified_guard {
                            *notified_guard = false;
                        }
                    }
                }
            }
        });
    }

    pub fn set_enabled(&self, enabled: bool) {
        if let Ok(mut e) = self.state.is_enabled.lock() {
            *e = enabled;
        }
    }

    pub fn set_threshold(&self, seconds: u64) {
        if let Ok(mut t) = self.state.threshold_seconds.lock() {
            *t = seconds;
        }
    }
}
