import { useEffect } from "react";
import { Layout } from "../components/Layout";
import { useSettingsStore } from "../stores/settingsStore";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { FolderOpen, Music, Volume2, Monitor } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Switch } from "../components/ui/Switch";
import { Input } from "../components/ui/Input";

export const Settings = () => {
  const settings = useSettingsStore();

  useEffect(() => {
    settings.loadSettings();
  }, []);

  // Sync activity settings with backend
  useEffect(() => {
    invoke("set_activity_monitoring", {
      enabled: settings.activityMonitoring,
      threshold: settings.activityThreshold,
    });
  }, [settings.activityMonitoring, settings.activityThreshold]);

  // Sync volume with backend (if music is playing)
  useEffect(() => {
    invoke("set_volume", { volume: settings.musicVolume });
  }, [settings.musicVolume]);

  const handleSelectMusic = async () => {
    const file = await open({
      multiple: false,
      filters: [
        {
          name: "Audio",
          extensions: ["mp3", "wav", "ogg", "flac"],
        },
      ],
    });
    if (file) {
      settings.setMusicFilePath(file as string);
    }
  };

  return (
    <Layout>
      <div className="p-8 max-w-4xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-gray-400">Manage your application preferences</p>
        </header>

        {/* Activity Monitoring */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                <Monitor size={20} />
              </div>
              <div>
                <CardTitle>Focus Reminders</CardTitle>
                <CardDescription>
                  Get notified when you lose focus
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-surface border border-white/5">
              <div>
                <label className="block font-medium">Activity Monitoring</label>
                <p className="text-sm text-gray-400">
                  Remind me if I'm inactive during a focus session
                </p>
              </div>
              <Switch
                checked={settings.activityMonitoring}
                onCheckedChange={(checked) =>
                  settings.setActivityMonitoring(checked)
                }
              />
            </div>

            {settings.activityMonitoring && (
              <div className="space-y-3 p-4">
                <div className="flex justify-between">
                  <label className="block font-medium text-sm text-gray-300">
                    Inactivity Threshold
                  </label>
                  <span className="text-sm text-blue-400 font-medium">
                    {Math.floor(settings.activityThreshold / 60)} minutes
                  </span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="1800"
                  step="60"
                  value={settings.activityThreshold}
                  onChange={(e) =>
                    settings.setActivityThreshold(Number(e.target.value))
                  }
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1 min</span>
                  <span>30 mins</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Background Music */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                <Music size={20} />
              </div>
              <div>
                <CardTitle>Background Music</CardTitle>
                <CardDescription>
                  Immersive audio for your sessions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-surface border border-white/5">
              <div>
                <label className="block font-medium">Auto-play Music</label>
                <p className="text-sm text-gray-400">
                  Automatically play music when a session starts
                </p>
              </div>
              <Switch
                checked={settings.musicAutoPlay}
                onCheckedChange={(checked) =>
                  settings.setMusicAutoPlay(checked)
                }
              />
            </div>

            {/* Music Loop */}
            <div className="flex items-center justify-between p-4 m-2 rounded-xl bg-surface border border-white/5">
              <div>
                <label className="block font-medium">Music Loop</label>
                <p className="text-sm text-gray-400">
                  Repeat the music file during a session
                </p>
              </div>
              <Switch
                checked={settings.musicLoop}
                onCheckedChange={(checked) => settings.setMusicLoop(checked)}
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Music File
                </label>
                <div className="flex gap-3">
                  <Input
                    type="text"
                    value={settings.musicFilePath || ""}
                    readOnly
                    placeholder="No file selected"
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSelectMusic}
                    variant="secondary"
                    className="gap-2"
                  >
                    <FolderOpen size={18} /> Browse
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
                  <Volume2 size={16} /> Default Volume
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.musicVolume}
                    onChange={(e) =>
                      settings.setMusicVolume(Number(e.target.value))
                    }
                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <span className="w-12 text-right text-gray-300 font-mono">
                    {Math.round(settings.musicVolume * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
