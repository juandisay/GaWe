use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_notification::NotificationExt;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use crate::models::{Session, TaskType};
use crate::audio::AudioManager;

#[derive(Clone, serde::Serialize)]
pub struct TimerUpdate {
    pub remaining_seconds: u32,
    pub current_task_index: usize,
    pub is_running: bool,
    pub current_task_name: String,
    pub is_break: bool,
    pub session_id: String,
}

pub struct TimerState {
    pub session: Option<Session>,
    pub current_task_index: usize,
    pub remaining_seconds: u32,
    pub is_running: bool,
    pub handle: Option<tauri::async_runtime::JoinHandle<()>>,
}

pub struct TimerManager {
    pub state: Arc<Mutex<TimerState>>,
}

impl TimerManager {
    pub fn new() -> Self {
        Self {
            state: Arc::new(Mutex::new(TimerState {
                session: None,
                current_task_index: 0,
                remaining_seconds: 0,
                is_running: false,
                handle: None,
            })),
        }
    }

    pub fn load_session(&self, session: Session) {
        let mut guard = self.state.lock().unwrap();
        // Reset state
        guard.current_task_index = 0;
        if let Some(first_task) = session.tasks.first() {
            guard.remaining_seconds = first_task.duration_minutes * 60;
        } else {
            guard.remaining_seconds = 0;
        }
        guard.session = Some(session);
        guard.is_running = false;
        if let Some(handle) = guard.handle.take() {
            handle.abort();
        }
    }

    pub fn start(&self, app: AppHandle) {
        let state = self.state.clone();
        let mut guard = state.lock().unwrap();
        
        if guard.is_running || guard.session.is_none() {
            return;
        }
        
        guard.is_running = true;
        
        // Cancel any existing task just in case
        if let Some(handle) = guard.handle.take() {
            handle.abort();
        }

        let state_clone = state.clone();
        let app_clone = app.clone();

        let handle = tauri::async_runtime::spawn(async move {
            loop {
                tokio::time::sleep(Duration::from_secs(1)).await;
                
                let mut guard = state_clone.lock().unwrap();
                if !guard.is_running {
                    break;
                }

                if guard.remaining_seconds > 0 {
                    guard.remaining_seconds -= 1;
                    
                    let session = guard.session.as_ref().unwrap();
                    let current_task = &session.tasks[guard.current_task_index];
                    
                    let update = TimerUpdate {
                        remaining_seconds: guard.remaining_seconds,
                        current_task_index: guard.current_task_index,
                        is_running: true,
                        current_task_name: current_task.name.clone(),
                        is_break: matches!(current_task.task_type, TaskType::Break),
                        session_id: session.id.clone(),
                    };
                    let _ = app_clone.emit("timer-update", update);
                } else {
                    // Task finished
                    // Move to next task
                    let session_len = guard.session.as_ref().unwrap().tasks.len();
                    if guard.current_task_index + 1 < session_len {
                        guard.current_task_index += 1;
                        
                        let (next_task_name, duration) = {
                            let session = guard.session.as_ref().unwrap();
                            let next_task = &session.tasks[guard.current_task_index];
                            (next_task.name.clone(), next_task.duration_minutes)
                        };
                        
                        guard.remaining_seconds = duration * 60;
                        
                        // Notify task change
                        let _ = app_clone.emit("task-changed", next_task_name.clone());
                        let _ = app_clone.notification()
                            .builder()
                            .title("Task Finished")
                            .body(format!("Next: {}", next_task_name))
                            .show();
                        
                        // Ring the bell
                        let audio_manager = app_clone.state::<AudioManager>();
                        audio_manager.play_bell();

                    } else {
                        // Session finished
                        guard.is_running = false;
                        let _ = app_clone.emit("session-finished", ());
                        let _ = app_clone.notification()
                            .builder()
                            .title("Session Finished")
                            .body("All tasks completed!")
                            .show();
                        
                        // Ring the bell for session finish too
                        let audio_manager = app_clone.state::<AudioManager>();
                        audio_manager.play_bell();
                        
                        break;
                    }
                }
            }
        });
        
        guard.handle = Some(handle);
    }

    pub fn pause(&self) {
        let mut guard = self.state.lock().unwrap();
        guard.is_running = false;
        if let Some(handle) = guard.handle.take() {
            handle.abort();
        }
    }

    pub fn get_status(&self) -> Option<TimerUpdate> {
        let guard = self.state.lock().unwrap();
        if let Some(session) = &guard.session {
            if guard.current_task_index < session.tasks.len() {
                let current_task = &session.tasks[guard.current_task_index];
                return Some(TimerUpdate {
                    remaining_seconds: guard.remaining_seconds,
                    current_task_index: guard.current_task_index,
                    is_running: guard.is_running,
                    current_task_name: current_task.name.clone(),
                    is_break: matches!(current_task.task_type, TaskType::Break),
                    session_id: session.id.clone(),
                });
            }
        }
        None
    }
}
