import { create } from 'zustand';
import { Session } from '../types';
import { LazyStore } from '@tauri-apps/plugin-store';

const store = new LazyStore('sessions.json');

interface SessionState {
  sessions: Session[];
  isLoading: boolean;
  error: string | null;
  loadSessions: () => Promise<void>;
  addSession: (session: Session) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  updateSession: (session: Session) => Promise<void>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  sessions: [],
  isLoading: false,
  error: null,
  loadSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log('Attempting to load sessions...');
      const val = await store.get<Session[]>('sessions');
      console.log('Loaded sessions value:', val);
      
      if (Array.isArray(val)) {
        set({ sessions: val });
      } else {
        console.log('No valid sessions found, initializing empty list');
        await store.set('sessions', []);
        await store.save();
        set({ sessions: [] });
      }
    } catch (err) {
      console.error('Failed to load sessions:', err);
      set({ error: 'Failed to load sessions' });
    } finally {
      set({ isLoading: false });
    }
  },
  addSession: async (session) => {
    try {
      const sessions = [...get().sessions, session];
      set({ sessions });
      await store.set('sessions', sessions);
      await store.save();
    } catch (err) {
      console.error('Failed to add session:', err);
    }
  },
  deleteSession: async (id) => {
    try {
      const sessions = get().sessions.filter(s => s.id !== id);
      set({ sessions });
      await store.set('sessions', sessions);
      await store.save();
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  },
  updateSession: async (updatedSession) => {
    try {
      const sessions = get().sessions.map(s => s.id === updatedSession.id ? updatedSession : s);
      set({ sessions });
      await store.set('sessions', sessions);
      await store.save();
    } catch (err) {
      console.error('Failed to update session:', err);
    }
  }
}));
