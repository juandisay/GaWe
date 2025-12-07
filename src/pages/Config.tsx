import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSessionStore } from '../stores/sessionStore';
import { Layout } from '../components/Layout';
import { Task, TaskType, Session } from '../types';
import { X, Save, Briefcase, Coffee, Plus, Clock, Trash2, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { confirm } from '@tauri-apps/plugin-dialog';

interface TaskItemProps {
  task: Task;
  index: number;
  updateTask: (index: number, field: keyof Task, value: any) => void;
  removeTask: (index: number) => void;
  moveTask: (index: number, direction: 'up' | 'down') => void;
  isFirst: boolean;
  isLast: boolean;
}

const TaskItem = ({ task, index, updateTask, removeTask, moveTask, isFirst, isLast }: TaskItemProps) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={task}
      id={task.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      dragListener={false}
      dragControls={dragControls}
      className={`group relative flex items-center gap-4 p-4 pr-6 rounded-2xl border transition-all duration-200 cursor-default mb-4 ${
        task.task_type === 'Work' 
          ? 'bg-surface border-white/5 hover:border-blue-500/20' 
          : 'bg-surface/40 border-white/5 hover:border-green-500/20'
      }`}
    >
      {/* Drag/Index Handle */}
      <div 
        onPointerDown={(e) => dragControls.start(e)}
        className={`w-12 h-16 rounded-xl flex items-center justify-center text-sm font-bold cursor-move touch-none select-none active:cursor-grabbing ${
          task.task_type === 'Work' ? 'bg-blue-500/5 text-blue-500/70' : 'bg-green-500/5 text-green-500/70'
        }`}
      >
        <div className="flex flex-col items-center gap-1">
           {/* Show Grip icon on hover, index otherwise? or just index is fine. Let's keep index but make it clear it's draggable */}
           <span className="group-hover:hidden">{index + 1}</span>
           <GripVertical size={16} className="hidden group-hover:block opacity-50" />
        </div>
      </div>
      
      {/* Task Content */}
      <div className="flex-1 py-1">
        <input
          type="text"
          value={task.name}
          onChange={(e) => updateTask(index, 'name', e.target.value)}
          className="w-full bg-transparent border-none p-0 text-lg font-medium text-white placeholder-gray-600 focus:ring-0 focus:outline-none cursor-text"
          placeholder="Task Name"
        />
        <div className="text-xs font-medium uppercase tracking-wide opacity-50 mt-1 flex items-center gap-2">
          <span className={task.task_type === 'Work' ? 'text-blue-400' : 'text-green-400'}>
            {task.task_type}
          </span>
        </div>
      </div>

      {/* Duration & Actions */}
      <div className="flex items-center gap-4">
        {/* Duration Pill */}
        <div className="flex items-center bg-background/50 rounded-lg border border-white/5 px-3 py-2 gap-2 group-focus-within:border-white/10 transition-colors">
          <Clock size={14} className="text-gray-500" />
          <input
            type="number"
            value={task.duration_minutes}
            onChange={(e) => updateTask(index, 'duration_minutes', e.target.value)}
            className="w-8 bg-transparent text-right font-mono font-medium text-white focus:outline-none cursor-text"
            min="1"
            max="180"
          />
          <span className="text-xs text-gray-500 font-medium select-none">min</span>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-surface/80 backdrop-blur rounded-lg border border-white/5 p-1 shadow-xl">
          <button 
            onClick={() => moveTask(index, 'up')} 
            disabled={isFirst}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md disabled:opacity-20 transition-colors cursor-pointer"
          >
              <ChevronUp size={16} />
          </button>
          <button 
            onClick={() => moveTask(index, 'down')} 
            disabled={isLast}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-md disabled:opacity-20 transition-colors cursor-pointer"
          >
              <ChevronDown size={16} />
          </button>
          <div className="w-px h-4 bg-white/10 mx-1" />
          <button 
            onClick={() => removeTask(index)} 
            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </Reorder.Item>
  );
};

export const Config = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('id');
  const { sessions, addSession, updateSession, deleteSession } = useSessionStore();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (sessionId) {
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        setName(session.name);
        setTasks(session.tasks);
      }
    }
  }, [sessionId, sessions]);

  const addTask = (type: TaskType) => {
    setTasks([...tasks, {
      id: crypto.randomUUID(),
      name: type === 'Work' ? 'Focus Task' : 'Break',
      duration_minutes: type === 'Work' ? 25 : 5,
      task_type: type
    }]);
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const updateTask = (index: number, field: keyof Task, value: any) => {
    let newValue = value;
    if (field === 'duration_minutes') {
        const val = parseInt(value) || 0;
        newValue = Math.max(1, Math.min(180, val));
    }

    const newTasks = [...tasks];
    newTasks[index] = { ...newTasks[index], [field]: newValue };
    setTasks(newTasks);
  };

  const moveTask = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === tasks.length - 1)) return;
    const newTasks = [...tasks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newTasks[index], newTasks[targetIndex]] = [newTasks[targetIndex], newTasks[index]];
    setTasks(newTasks);
  };

  const handleSave = async () => {
    if (!name) return;
    const session: Session = {
      id: sessionId || crypto.randomUUID(),
      name,
      tasks,
      created_at: new Date().toISOString()
    };
    
    if (sessionId) {
      await updateSession(session);
    } else {
      await addSession(session);
    }
    navigate('/');
  };

  const handleDelete = async () => {
    if (!sessionId) return;
    
    const confirmed = await confirm(
      'Are you sure you want to delete this session? This action cannot be undone.',
      { title: 'Delete Session', kind: 'warning' }
    );

    if (confirmed) {
      await deleteSession(sessionId);
      navigate('/');
    }
  };

  const totalDuration = tasks.reduce((acc, t) => acc + (t.duration_minutes || 0), 0);

  return (
    <Layout>
      <div className="p-8 max-w-5xl mx-auto min-h-screen">
        {/* Header Actions */}
        <header className="flex justify-between items-center mb-12">
          <Button 
            onClick={() => navigate('/')} 
            variant="ghost" 
            className="text-gray-400 hover:text-white pl-0 gap-2"
          >
            ← Back
          </Button>
          
          <div className="flex gap-3 items-center">
             <div className="bg-surface/50 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/5 flex items-center gap-2 text-gray-400 text-sm">
                <Clock size={16} className="text-blue-400" />
                <span>Total: <span className="text-white font-semibold">{totalDuration}m</span></span>
             </div>
             
            {sessionId && (
              <Button
                onClick={handleDelete}
                variant="danger"
                size="icon"
                title="Delete Session"
              >
                <Trash2 size={18} />
              </Button>
            )}

            <Button
              onClick={handleSave}
              disabled={!name || tasks.length === 0}
              variant="primary"
              className="gap-2 font-semibold shadow-blue-500/20"
            >
              <Save size={18} /> Save Changes
            </Button>
          </div>
        </header>

        {/* Hero Session Name Input */}
        <div className="mb-12 max-w-3xl">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Untitled Session"
            className="w-full bg-transparent text-5xl font-bold text-white placeholder-gray-700 border-none p-0 focus:ring-0 focus:outline-none transition-colors"
          />
          <p className="text-gray-500 mt-3 text-lg">
            Design your focus flow by adding work and break blocks below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Main Task List */}
          <div className="lg:col-span-8 space-y-6">
             <div className="flex justify-between items-end px-2 pb-2 border-b border-white/5">
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Sequence</h2>
                <span className="text-xs text-gray-600 font-mono">{tasks.length} BLOCKS</span>
             </div>
            
            <Reorder.Group axis="y" values={tasks} onReorder={setTasks} className="space-y-4">
              <AnimatePresence mode='popLayout'>
                {tasks.map((task, index) => (
                  <TaskItem 
                    key={task.id}
                    task={task}
                    index={index}
                    updateTask={updateTask}
                    removeTask={removeTask}
                    moveTask={moveTask}
                    isFirst={index === 0}
                    isLast={index === tasks.length - 1}
                  />
                ))}
              </AnimatePresence>
            </Reorder.Group>

            {tasks.length === 0 && (
              <div className="text-center py-20 border border-dashed border-white/5 rounded-3xl bg-surface/20">
                <div className="w-16 h-16 rounded-full bg-surface mb-4 flex items-center justify-center mx-auto shadow-inner">
                   <Plus size={24} className="text-gray-600" />
                </div>
                <h3 className="text-gray-300 font-medium mb-1">Empty Session</h3>
                <p className="text-gray-500 text-sm">Add tasks from the panel to start building your flow</p>
              </div>
            )}
          </div>

          {/* Sticky Sidebar - Add Tasks */}
          <div className="lg:col-span-4">
            <div className="sticky top-8 space-y-6">
              <div className="p-1">
                 <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Add Blocks</h2>
                 <div className="grid grid-cols-1 gap-4">
                    <button
                      onClick={() => addTask('Work')}
                      className="group relative overflow-hidden p-5 rounded-2xl bg-surface border border-white/5 hover:border-blue-500/50 text-left transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-0.5 cursor-pointer"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                         <Briefcase size={64} className="text-blue-500" />
                      </div>
                      <div className="relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-3 group-hover:scale-110 transition-transform">
                          <Briefcase size={20} />
                        </div>
                        <h3 className="font-semibold text-white mb-1">Focus Block</h3>
                        <p className="text-sm text-gray-500 group-hover:text-gray-400">Deep work session, default 25m</p>
                      </div>
                    </button>

                    <button
                      onClick={() => addTask('Break')}
                      className="group relative overflow-hidden p-5 rounded-2xl bg-surface border border-white/5 hover:border-green-500/50 text-left transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10 hover:-translate-y-0.5 cursor-pointer"
                    >
                       <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                         <Coffee size={64} className="text-green-500" />
                      </div>
                      <div className="relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 mb-3 group-hover:scale-110 transition-transform">
                          <Coffee size={20} />
                        </div>
                        <h3 className="font-semibold text-white mb-1">Short Break</h3>
                        <p className="text-sm text-gray-500 group-hover:text-gray-400">Rest & recharge, default 5m</p>
                      </div>
                    </button>
                 </div>
              </div>

              {/* Tips or Summary Card */}
              <div className="p-5 rounded-2xl bg-surface/30 border border-white/5">
                 <h4 className="text-sm font-medium text-gray-300 mb-2">Pro Tip</h4>
                 <p className="text-xs text-gray-500 leading-relaxed">
                   Alternate between Focus and Break blocks to maintain peak productivity. 
                   The Pomodoro technique suggests 4 focus blocks followed by a longer break.
                 </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
