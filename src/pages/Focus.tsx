import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { TimerUpdate } from "../types";
import {
  Play,
  Pause,
  Square,
  Maximize,
  Minimize,
  Music,
  Volume2,
  Edit,
} from "lucide-react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useSettingsStore } from "../stores/settingsStore";
import { Button } from "../components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";

import { ask } from "@tauri-apps/plugin-dialog";

export const Focus = () => {
  const navigate = useNavigate();
  const [timerState, setTimerState] = useState<TimerUpdate | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const settings = useSettingsStore();
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [showMusicControls, setShowMusicControls] = useState(false);
  const hasAutoPlayed = useRef(false);

  useEffect(() => {
    settings.loadSettings();

    // Initial status
    invoke<TimerUpdate | null>("get_timer_status").then((status) => {
      if (status) {
        setTimerState(status);
      } else {
        // If no active session, go back home
        navigate("/");
      }
    });

    // Listeners
    const unlistenUpdate = listen<TimerUpdate>("timer-update", (event) => {
      setTimerState(event.payload);
    });

    const unlistenFinish = listen("session-finished", () => {
      // Stop music when session finishes
      invoke("stop_music");
      navigate("/");
    });

    return () => {
      unlistenUpdate.then((f) => f());
      unlistenFinish.then((f) => f());
      invoke("stop_music").catch(console.error);
    };
  }, [navigate]);

  // Auto-play music logic (start when session starts; stop when session stops)
  useEffect(() => {
    if (!settings.musicAutoPlay || !settings.musicFilePath) return;

    const shouldPlay = Boolean(timerState?.is_running);

    if (shouldPlay && !isMusicPlaying) {
      invoke("play_music", {
        filePath: settings.musicFilePath,
        loopEnabled: settings.musicLoop,
      })
        .then(() => setIsMusicPlaying(true))
        .catch(console.error);
      hasAutoPlayed.current = true;
    } else if (isMusicPlaying && !shouldPlay) {
      invoke("pause_music").catch(console.error);
      setIsMusicPlaying(false);
      hasAutoPlayed.current = false;
    }
  }, [
    timerState?.is_running,
    settings.musicAutoPlay,
    settings.musicFilePath,
    settings.musicLoop,
  ]);

  useEffect(() => {
    invoke("set_volume", { volume: settings.musicVolume }).catch(console.error);
  }, [settings.musicVolume]);

  const toggleTimer = async () => {
    if (!timerState) return;

    if (timerState.is_running) {
      await invoke("pause_timer");
      await invoke("pause_music");
      setIsMusicPlaying(false);
      // Optimistic update
      setTimerState((prev) => (prev ? { ...prev, is_running: false } : null));
    } else {
      await invoke("start_timer");
      setTimerState((prev) => (prev ? { ...prev, is_running: true } : null));
    }
  };

  const toggleFullscreen = async () => {
    const window = getCurrentWindow();
    // Toggle based on current state
    const isFull = await window.isFullscreen();
    await window.setFullscreen(!isFull);
    setIsFullscreen(!isFull);
  };

  const toggleMusic = async () => {
    if (isMusicPlaying) {
      await invoke("pause_music");
      setIsMusicPlaying(false);
    } else {
      if (settings.musicFilePath) {
        await invoke("play_music", {
          filePath: settings.musicFilePath,
          loopEnabled: settings.musicLoop,
        });
        setIsMusicPlaying(true);
      } else {
        if (confirm("No music file selected. Go to settings?")) {
          navigate("/settings");
        }
      }
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.code || e.key;
      if ((key === "Space" || key === " ") && !e.repeat) {
        const target = e.target as HTMLElement | null;
        const isEditable =
          !!target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            (target as HTMLElement).isContentEditable);
        if (isEditable) return;
        e.preventDefault();
        toggleTimer();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleTimer]);

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!timerState)
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background text-white">
        <div className="animate-pulse">Loading Session...</div>
      </div>
    );

  const isBreak = timerState.is_break;
  const bgColor = isBreak ? "bg-[#0f1811]" : "bg-[#0b0c15]";
  const accentColor = isBreak ? "text-green-400" : "text-blue-400";
  const ringColor = isBreak ? "border-green-500/30" : "border-blue-500/30";

  return (
    <div
      className={`h-screen w-screen relative overflow-hidden transition-colors duration-1000 ${bgColor} text-white flex flex-col`}
    >
      {/* Ambient Background */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vh] h-[80vh] rounded-full blur-[150px] ${
            isBreak ? "bg-green-900/20" : "bg-blue-900/20"
          }`}
        />
      </div>

      {/* Header Controls */}
      <div className="absolute top-0 left-0 w-full p-8 flex justify-end items-start z-10">
        <div className="flex gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              invoke("pause_timer");
              invoke("pause_music");
              navigate(`/config?id=${timerState?.session_id}`);
            }}
            className="hover:bg-white/10 text-gray-400 hover:text-white"
            title="Edit Session"
          >
            <Edit size={24} />
          </Button>

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowMusicControls(!showMusicControls)}
              className={`hover:bg-white/10 ${
                showMusicControls ? "text-white bg-white/10" : "text-gray-400"
              }`}
            >
              <Music size={24} />
            </Button>

            <AnimatePresence>
              {showMusicControls && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  className="absolute top-12 right-0 bg-surface/90 p-4 rounded-xl border border-white/10 w-64 backdrop-blur-xl shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-300">
                      Background Music
                    </span>
                    <button
                      onClick={toggleMusic}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    >
                      {isMusicPlaying ? (
                        <Pause size={16} />
                      ) : (
                        <Play size={16} />
                      )}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Volume2 size={16} className="text-gray-400" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={settings.musicVolume}
                      onChange={(e) =>
                        settings.setMusicVolume(Number(e.target.value))
                      }
                      className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-white"
                    />
                  </div>
                  <div className="mt-3 text-xs text-gray-500 truncate flex items-center gap-2">
                    <Music size={12} />
                    {settings.musicFilePath
                      ? settings.musicFilePath.split("/").pop()
                      : "No file selected"}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="hover:bg-white/10 text-gray-400 hover:text-white cursor-pointer"
          >
            {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center z-0 relative">
        <motion.div
          key={timerState.is_break ? "break" : "focus"}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div
            className={`mb-6 inline-flex px-4 py-1.5 rounded-full bg-white/5 border border-white/5 text-sm font-medium tracking-widest uppercase ${accentColor}`}
          >
            {timerState.is_break ? "Time to Recharge" : "Focus Session"}
          </div>

          <h2 className="text-3xl font-medium text-gray-300 mb-20 opacity-80">
            {timerState.current_task_name}
          </h2>

          <div className="relative mb-20 group cursor-default">
            {/* Timer Ring Effect */}
            <div
              className={`absolute -inset-8 rounded-full border border-dashed opacity-20 transition-all duration-1000 pointer-events-none ${ringColor} ${
                timerState.is_running
                  ? "animate-[spin_60s_linear_infinite]"
                  : ""
              }`}
            />

            <div className="text-[10rem] md:text-[14rem] leading-none font-sans font-bold tracking-tighter tabular-nums select-none drop-shadow-2xl">
              {formatTime(timerState.remaining_seconds)}
            </div>
          </div>

          <div className="flex gap-6 justify-center items-center">
            <button
              onClick={async () => {
                if (timerState.is_running) {
                  const confirmed = await ask(
                    "This will end your current session. Are you sure?",
                    {
                      title: "Stop Session",
                      kind: "warning",
                    }
                  );
                  if (!confirmed) return;
                }
                await invoke("pause_timer");
                await invoke("stop_music");
                navigate("/");
              }}
              className="group p-4 rounded-full hover:bg-white/10 transition-all duration-300 text-gray-400 hover:text-white cursor-pointer"
              title="Stop Session"
            >
              <Square
                size={24}
                fill="currentColor"
                className="group-hover:scale-110 transition-transform"
              />
            </button>

            <button
              onClick={toggleTimer}
              className={`p-8 rounded-[2rem] transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-white/5 cursor-pointer ${
                isBreak
                  ? "bg-green-500 text-black hover:bg-green-400"
                  : "bg-white text-black hover:bg-gray-200"
              }`}
            >
              {timerState.is_running ? (
                <Pause size={48} fill="currentColor" />
              ) : (
                <Play size={48} fill="currentColor" className="ml-2" />
              )}
            </button>

            {/* Placeholder for Skip Button if needed later */}
            <div className="w-14" />
          </div>
        </motion.div>
      </div>

      {/* Footer info */}
      <div className="absolute bottom-8 w-full text-center text-gray-500 text-sm">
        Task {timerState.current_task_index + 1}
      </div>
    </div>
  );
};
