use std::fs::File;
use std::sync::{mpsc, Arc, Mutex};
use std::thread;
use std::time::Duration;
use rodio::{Decoder, OutputStreamBuilder, Sink, Source};
use rodio::source::SineWave;

enum AudioCommand {
    Play(String, bool),
    PlayBell,
    Pause,
    Stop,
    SetVolume(f32),
}

pub struct AudioManager {
    sender: Arc<Mutex<mpsc::Sender<AudioCommand>>>,
}

impl AudioManager {
    pub fn new() -> Self {
        let (tx, rx) = mpsc::channel();

        thread::spawn(move || {
            // Initialize audio output stream in this thread
            let device_result = OutputStreamBuilder::open_default_stream();
            
            if let Ok(stream) = device_result {
                let mut sink: Option<Sink> = None;
                let mut current_volume = 0.5;

                while let Ok(command) = rx.recv() {
                    match command {
                        AudioCommand::Play(path, loop_enabled) => {
                            // Stop existing
                            if let Some(old_sink) = sink.take() {
                                old_sink.stop();
                            }

                            if let Ok(file) = File::open(&path) {
                                // rodio 0.21 recommends Decoder::try_from for files
                                if let Ok(source) = Decoder::try_from(file) {
                                    // connect_new returns Sink directly, not Result
                                    let new_sink = Sink::connect_new(&stream.mixer());
                                    new_sink.set_volume(current_volume);
                                    if loop_enabled {
                                        new_sink.append(source.repeat_infinite());
                                    } else {
                                        new_sink.append(source);
                                    }
                                    sink = Some(new_sink);
                                }
                            }
                        }
                        AudioCommand::PlayBell => {
                            // Play bell sound from resource file
                            // Try to find the bell file relative to the executable (better for packaged apps)
                            let mut bell_path_buf = std::env::current_exe().map(|mut p| {
                                p.pop(); // Remove executable name
                                if p.ends_with("MacOS") {
                                    p.pop(); // Remove MacOS
                                    p.push("Resources"); // Go to Resources in .app bundle
                                }
                                p
                            }).unwrap_or_else(|_| std::env::current_dir().unwrap_or_default());
                            
                            // If we are in dev mode (cargo run), we might be in src-tauri or project root
                            // Check if "dist" exists here, if not, try to go up one level
                            if !bell_path_buf.join("dist").exists() {
                                if let Ok(cwd) = std::env::current_dir() {
                                    bell_path_buf = cwd;
                                }
                            }
                            
                            bell_path_buf.push("dist");
                            bell_path_buf.push("tone");
                            bell_path_buf.push("bell.mp3");

                            let mut played_file = false;
                            
                            if let Some(bell_path) = bell_path_buf.to_str() {
                                if let Ok(file) = File::open(bell_path) {
                                    if let Ok(source) = Decoder::try_from(file) {
                                        // Create a fresh sink for file playback
                                        let bell_sink = Sink::connect_new(&stream.mixer());
                                        bell_sink.set_volume(0.8);
                                        bell_sink.append(source);
                                        bell_sink.detach();
                                        played_file = true;
                                    }
                                }
                            }

                            if !played_file {
                                // Fallback to SineWave
                                // Create a fresh sink for fallback playback
                                let bell_sink = Sink::connect_new(&stream.mixer());

                                let source = SineWave::new(880.0)
                                    .take_duration(Duration::from_secs_f32(0.2))
                                    .amplify(0.5);
                                    
                                let source2 = SineWave::new(1760.0)
                                    .take_duration(Duration::from_secs_f32(0.2))
                                    .amplify(0.3);

                                bell_sink.set_volume(0.8);
                                bell_sink.append(source.mix(source2));
                                bell_sink.detach();
                            }
                        }
                        AudioCommand::Pause => {
                            if let Some(ref s) = sink {
                                if s.is_paused() {
                                    s.play();
                                } else {
                                    s.pause();
                                }
                            }
                        }
                        AudioCommand::Stop => {
                            if let Some(ref s) = sink {
                                s.stop();
                            }
                            sink = None;
                        }
                        AudioCommand::SetVolume(vol) => {
                            current_volume = vol;
                            if let Some(ref s) = sink {
                                s.set_volume(vol);
                            }
                        }
                    }
                }
            } else {
                eprintln!("Failed to initialize audio output stream");
                // Drain channel
                while let Ok(_) = rx.recv() {} 
            }
        });

        Self {
            sender: Arc::new(Mutex::new(tx)),
        }
    }

    pub fn play(&self, path: String, loop_enabled: bool) -> Result<(), String> {
        self.sender.lock().unwrap().send(AudioCommand::Play(path, loop_enabled)).map_err(|e| e.to_string())
    }

    pub fn play_bell(&self) {
        let _ = self.sender.lock().unwrap().send(AudioCommand::PlayBell);
    }

    pub fn pause(&self) {
        let _ = self.sender.lock().unwrap().send(AudioCommand::Pause);
    }

    pub fn stop(&self) {
        let _ = self.sender.lock().unwrap().send(AudioCommand::Stop);
    }

    pub fn set_volume(&self, volume: f32) {
        let _ = self.sender.lock().unwrap().send(AudioCommand::SetVolume(volume));
    }
}
