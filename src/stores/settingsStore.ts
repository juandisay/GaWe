import { create } from "zustand";
import { LazyStore } from "@tauri-apps/plugin-store";

const store = new LazyStore("settings.json");

interface SettingsState {
  activityMonitoring: boolean;
  activityThreshold: number; // seconds

  musicVolume: number;
  musicFilePath: string | null;
  musicAutoPlay: boolean;
  musicLoop: boolean;

  loadSettings: () => Promise<void>;
  setActivityMonitoring: (enabled: boolean) => Promise<void>;
  setActivityThreshold: (seconds: number) => Promise<void>;
  setMusicVolume: (volume: number) => Promise<void>;
  setMusicFilePath: (path: string | null) => Promise<void>;
  setMusicAutoPlay: (enabled: boolean) => Promise<void>;
  setMusicLoop: (enabled: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  activityMonitoring: false,
  activityThreshold: 300,
  musicVolume: 0.5,
  musicFilePath: null,
  musicAutoPlay: false,
  musicLoop: false,

  loadSettings: async () => {
    const saved = await store.get<Partial<SettingsState>>("settings");
    if (saved) {
      set({
        activityMonitoring: saved.activityMonitoring ?? false,
        activityThreshold: saved.activityThreshold ?? 300,
        musicVolume: saved.musicVolume ?? 0.5,
        musicFilePath: saved.musicFilePath ?? null,
        musicAutoPlay: saved.musicAutoPlay ?? false,
        musicLoop: saved.musicLoop ?? false,
      });
    }
  },

  setActivityMonitoring: async (enabled) => {
    set({ activityMonitoring: enabled });
    await store.set("settings", { ...get(), activityMonitoring: enabled });
    await store.save();
  },

  setActivityThreshold: async (seconds) => {
    set({ activityThreshold: seconds });
    await store.set("settings", { ...get(), activityThreshold: seconds });
    await store.save();
  },

  setMusicVolume: async (volume) => {
    set({ musicVolume: volume });
    await store.set("settings", { ...get(), musicVolume: volume });
    await store.save();
  },

  setMusicFilePath: async (path) => {
    set({ musicFilePath: path });
    await store.set("settings", { ...get(), musicFilePath: path });
    await store.save();
  },

  setMusicAutoPlay: async (enabled) => {
    set({ musicAutoPlay: enabled });
    await store.set("settings", { ...get(), musicAutoPlay: enabled });
    await store.save();
  },

  setMusicLoop: async (enabled) => {
    set({ musicLoop: enabled });
    await store.set("settings", { ...get(), musicLoop: enabled });
    await store.save();
  },
}));
