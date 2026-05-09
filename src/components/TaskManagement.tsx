import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle, 
  Plus, 
  User, 
  Trash2, 
  Play, 
  CheckCircle, 
  XCircle,
  MoreVertical,
  Link as LinkIcon,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { InvestigationState, Task } from '../types';
import { cn } from '../lib/utils';

interface TaskManagementProps {
  state: InvestigationState;
  onUpdateState: (newState: Partial<InvestigationState>) => void;
}

export function TaskManagement({ state, onUpdateState }: TaskManagementProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [sortByPriority, setSortByPriority] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignee: '',
    priority: 'medium' as Task['priority'],
    dependencies: [] as string[]
  });

  const addTask = () => {
    if (!newTask.title.trim()) return;

    const task: Task = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      title: newTask.title,
      description: newTask.description,
      assignee: newTask.assignee || 'Unassigned',
      status: 'pending',
      priority: newTask.priority,
      dependencies: newTask.dependencies,
      progress: 0,
      createdAt: new Date().toLocaleString(),
      updatedAt: new Date().toLocaleString()
    };

    onUpdateState({
      tasks: [task, ...state.tasks]
    });

    setNewTask({ title: '', description: '', assignee: '', priority: 'medium', dependencies: [] });
    setIsAdding(false);
  };

  const updateTaskStatus = (id: string, status: Task['status']) => {
    onUpdateState({
      tasks: state.tasks.map(t => t.id === id ? { 
        ...t, 
        status, 
        progress: status === 'completed' ? 100 : t.progress,
        updatedAt: new Date().toLocaleString() 
      } : t)
    });
  };

  const updateTaskProgress = (id: string, progress: number) => {
    onUpdateState({
      tasks: state.tasks.map(t => t.id === id ? { 
        ...t, 
        progress, 
        updatedAt: new Date().toLocaleString() 
      } : t)
    });
  };

  const updateTaskPriority = (id: string, priority: Task['priority']) => {
    onUpdateState({
      tasks: state.tasks.map(t => t.id === id ? { 
        ...t, 
        priority, 
        updatedAt: new Date().toLocaleString() 
      } : t)
    });
  };

  const removeTask = (id: string) => {
    onUpdateState({
      tasks: state.tasks.filter(t => t.id !== id)
    });
  };

  const areDependenciesMet = (task: Task) => {
    if (!task.dependencies || task.dependencies.length === 0) return true;
    return task.dependencies.every(depId => {
      const depTask = state.tasks.find(t => t.id === depId);
      return depTask?.status === 'completed';
    });
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'pending': return <Circle className="w-4 h-4 opacity-40" />;
      case 'running': return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'completed': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const priorityWeight = {
    high: 3,
    medium: 2,
    low: 1
  };

  const sortedTasks = [...state.tasks].sort((a, b) => {
    if (sortByPriority) {
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    }
    return 0; // Keep original order (newest first as per addTask implementation)
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="text-[10px] font-bold uppercase opacity-50 tracking-widest">Investigation Backlog</div>
          <button 
            onClick={() => setSortByPriority(!sortByPriority)}
            className={cn(
              "text-[8px] font-bold uppercase px-2 py-0.5 border transition-all",
              sortByPriority ? "bg-ink text-bg border-ink" : "border-ink/20 opacity-50 hover:opacity-100"
            )}
          >
            Sort by Priority
          </button>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-ink text-bg px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest hover:bg-ink/90 transition-all"
        >
          <Plus className="w-3 h-3" />
          Create Task
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border border-ink p-4 bg-white shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] space-y-4"
          >
            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase opacity-40">Task Title</label>
              <input 
                type="text" 
                value={newTask.title}
                onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Analyze domain DNS history"
                className="w-full bg-transparent border-b border-ink/20 p-1 text-xs outline-none focus:border-ink transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase opacity-40">Description</label>
              <textarea 
                value={newTask.description}
                onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed steps or objectives..."
                rows={2}
                className="w-full bg-transparent border border-ink/10 p-2 text-xs outline-none focus:border-ink transition-colors resize-none"
              />
            </div>
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <label className="text-[9px] font-bold uppercase opacity-40">Assignee</label>
                <div className="flex items-center gap-2 border-b border-ink/20 p-1">
                  <User className="w-3 h-3 opacity-40" />
                  <input 
                    type="text" 
                    value={newTask.assignee}
                    onChange={(e) => setNewTask(prev => ({ ...prev, assignee: e.target.value }))}
                    placeholder="Agent Name"
                    className="w-full bg-transparent text-xs outline-none"
                  />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <label className="text-[9px] font-bold uppercase opacity-40">Priority</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setNewTask(prev => ({ ...prev, priority: p }))}
                      className={cn(
                        "flex-1 py-1 text-[8px] font-bold uppercase border transition-all",
                        newTask.priority === p 
                          ? "bg-ink text-bg border-ink" 
                          : "border-ink/10 opacity-50 hover:opacity-100"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-bold uppercase opacity-40">Dependencies</label>
              <div className="flex flex-wrap gap-2">
                {state.tasks.length === 0 ? (
                  <span className="text-[8px] opacity-30 italic">No existing tasks to depend on.</span>
                ) : (
                  state.tasks.map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        const deps = newTask.dependencies.includes(t.id)
                          ? newTask.dependencies.filter(id => id !== t.id)
                          : [...newTask.dependencies, t.id];
                        setNewTask(prev => ({ ...prev, dependencies: deps }));
                      }}
                      className={cn(
                        "px-2 py-1 text-[8px] font-bold uppercase border transition-all flex items-center gap-1",
                        newTask.dependencies.includes(t.id)
                          ? "bg-ink text-bg border-ink"
                          : "border-ink/10 opacity-50 hover:opacity-100"
                      )}
                    >
                      <LinkIcon className="w-2 h-2" />
                      {t.title}
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-[10px] font-bold uppercase opacity-60 hover:opacity-100"
              >
                Cancel
              </button>
              <button 
                onClick={addTask}
                className="px-6 py-2 bg-ink text-bg text-[10px] font-bold uppercase tracking-widest"
              >
                Add Task
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {state.tasks.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-ink/20 opacity-40 italic text-xs">
            No active tasks. Initialize investigation steps to populate backlog.
          </div>
        ) : (
          sortedTasks.map((task) => (
            <div 
              key={task.id}
              className={cn(
                "border border-ink p-4 bg-white transition-all group",
                task.status === 'completed' ? "opacity-60" : "shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]"
              )}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getStatusIcon(task.status)}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className={cn(
                        "text-sm font-bold uppercase italic tracking-tight",
                        task.status === 'completed' && "line-through"
                      )}>
                        {task.title}
                      </h4>
                      <div className="flex gap-1">
                        {(['low', 'medium', 'high'] as const).map((p) => (
                          <button
                            key={p}
                            onClick={() => updateTaskPriority(task.id, p)}
                            className={cn(
                              "text-[7px] font-bold uppercase px-1.5 py-0.5 border transition-all",
                              task.priority === p 
                                ? (p === 'high' ? "bg-red-500 text-white border-red-500" :
                                   p === 'medium' ? "bg-blue-500 text-white border-blue-500" :
                                   "bg-gray-500 text-white border-gray-500")
                                : "border-ink/10 opacity-30 hover:opacity-100"
                            )}
                          >
                            {p}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] opacity-60 font-mono">{task.description}</p>
                    {task.dependencies && task.dependencies.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        <span className="text-[7px] font-bold uppercase opacity-40 flex items-center gap-1 mr-1">
                          <LinkIcon className="w-2 h-2" />
                          Depends on:
                        </span>
                        {task.dependencies.map(depId => {
                          const depTask = state.tasks.find(t => t.id === depId);
                          return (
                            <span 
                              key={depId}
                              className={cn(
                                "text-[7px] font-bold uppercase px-1.5 py-0.5 border",
                                depTask?.status === 'completed' 
                                  ? "bg-green-500/10 text-green-600 border-green-600/20"
                                  : "bg-ink/5 text-ink/40 border-ink/10"
                              )}
                            >
                              {depTask?.title || depId}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-[8px] font-bold uppercase px-2 py-0.5 bg-ink/5 border border-ink/10 flex items-center gap-1">
                    <User className="w-2 h-2" />
                    {task.assignee}
                  </div>
                  <button 
                    onClick={() => removeTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[8px] font-mono uppercase opacity-40">
                  <span>Progress</span>
                  <span>{task.progress}%</span>
                </div>
                <div className="h-1 bg-ink/5 border border-ink/10 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${task.progress}%` }}
                    className={cn(
                      "h-full transition-all",
                      task.status === 'completed' ? "bg-green-500" : 
                      task.status === 'failed' ? "bg-red-500" : "bg-ink"
                    )}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {task.status !== 'completed' && task.status !== 'running' && (
                    <div className="flex items-center gap-2">
                      <button 
                        disabled={!areDependenciesMet(task)}
                        onClick={() => updateTaskStatus(task.id, 'running')}
                        className={cn(
                          "flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-1 border transition-all",
                          areDependenciesMet(task)
                            ? "border-ink hover:bg-ink hover:text-bg"
                            : "border-ink/10 text-ink/20 cursor-not-allowed"
                        )}
                      >
                        <Play className="w-2 h-2" /> Start
                      </button>
                      {!areDependenciesMet(task) && (
                        <div className="flex items-center gap-1 text-[8px] text-red-500 font-bold uppercase animate-pulse">
                          <AlertTriangle className="w-2 h-2" />
                          Blocked by dependencies
                        </div>
                      )}
                    </div>
                  )}
                  {task.status === 'running' && (
                    <button 
                      onClick={() => updateTaskStatus(task.id, 'completed')}
                      className="flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-1 border border-green-600 text-green-600 hover:bg-green-600 hover:text-white transition-all"
                    >
                      <CheckCircle className="w-2 h-2" /> Complete
                    </button>
                  )}
                  {task.status === 'running' && (
                    <button 
                      onClick={() => updateTaskStatus(task.id, 'failed')}
                      className="flex items-center gap-1 text-[9px] font-bold uppercase px-2 py-1 border border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                    >
                      <XCircle className="w-2 h-2" /> Fail
                    </button>
                  )}
                  {task.status === 'running' && (
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={task.progress}
                      onChange={(e) => updateTaskProgress(task.id, parseInt(e.target.value))}
                      className="w-24 accent-ink"
                    />
                  )}
                </div>
                <div className="text-[8px] font-mono opacity-30">
                  Updated: {task.updatedAt}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
