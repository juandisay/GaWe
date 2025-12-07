export type TaskType = 'Work' | 'Break';

export interface Task {
  id: string;
  name: string;
  duration_minutes: number;
  task_type: TaskType;
}

export interface Session {
  id: string;
  name: string;
  tasks: Task[];
  created_at: string;
}

export interface TimerUpdate {
  remaining_seconds: number;
  current_task_index: number;
  is_running: boolean;
  current_task_name: string;
  is_break: boolean;
  session_id: string;
}
