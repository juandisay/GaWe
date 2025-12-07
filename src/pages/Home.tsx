import { useSessionStore } from '../stores/sessionStore';
import { Layout } from '../components/Layout';
import { useNavigate } from 'react-router-dom';
import { Play, Trash2, Edit, Clock, List, Plus, PlusSquare } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { Session } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { motion } from 'framer-motion';
import { confirm } from '@tauri-apps/plugin-dialog';

export const Home = () => {
  const { sessions, deleteSession } = useSessionStore();
  const navigate = useNavigate();

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    
    const confirmed = await confirm(
      'Are you sure you want to delete this session? This action cannot be undone.',
      { title: 'Delete Session', kind: 'warning' }
    );

    if (confirmed) {
      await deleteSession(id);
    }
  };

  const handleStart = async (session: Session) => {
    try {
      await invoke('load_session', { session });
      await invoke('start_timer');
      navigate('/focus');
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <Layout>
      <div className="p-8 max-w-7xl mx-auto">
        <header className="mb-10 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-400">Select a session to start focusing</p>
          </div>
          <Button onClick={() => navigate('/config')} variant="primary" className="gap-2">
            <Plus size={20} /> New Session
          </Button>
        </header>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {sessions.map((session) => {
             const totalDuration = session.tasks.reduce((acc, t) => acc + t.duration_minutes, 0);
             const taskCount = session.tasks.length;
             
             return (
              <motion.div key={session.id} variants={item}>
                <Card className="group hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                        <List size={20} />
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => { e.stopPropagation(); navigate(`/config?id=${session.id}`); }}
                          title="Edit"
                          className="h-8 w-8 text-gray-400 hover:text-white"
                        >
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDelete(e, session.id)}
                          title="Delete"
                          className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="mb-1">{session.name}</CardTitle>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1"><Clock size={14} /> {totalDuration} min</span>
                      <span className="flex items-center gap-1"><List size={14} /> {taskCount} tasks</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => handleStart(session)}
                      className="w-full gap-2 group-hover:bg-blue-600 group-hover:shadow-lg group-hover:shadow-blue-500/25"
                    >
                      <Play size={18} fill="currentColor" /> Start Session
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
          
          {sessions.length === 0 && (
            <motion.div variants={item} className="col-span-full">
              <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-surface/50 rounded-3xl border border-dashed border-white/10">
                <div className="w-16 h-16 rounded-full bg-surface mb-4 flex items-center justify-center">
                  <PlusSquare size={32} className="text-gray-600" />
                </div>
                <p className="text-xl font-medium text-gray-300 mb-2">No sessions found</p>
                <p className="text-sm text-gray-500 mb-6">Create a new session to get started</p>
                <Button onClick={() => navigate('/config')} variant="secondary">
                  Create Session
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};
