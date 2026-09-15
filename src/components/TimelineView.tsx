import { Task } from '../types';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, startOfDay, endOfDay } from 'date-fns';

interface TimelineViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export default function TimelineView({ tasks, onTaskClick }: TimelineViewProps) {
  // Generate dates for the current week and next 3 weeks
  const today = new Date();
  const startDate = startOfWeek(today, { weekStartsOn: 1 });
  const endDate = endOfWeek(addDays(today, 21), { weekStartsOn: 1 });
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  const sortedTasks = [...tasks].sort((a, b) => {
    const dateA = a.startDate || a.dueDate || 0;
    const dateB = b.startDate || b.dueDate || 0;
    return dateA - dateB;
  }).filter(t => t.dueDate || t.startDate);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header - Dates */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <div className="w-48 flex-shrink-0 p-3 border-r border-gray-200 font-medium text-sm text-gray-500">
            Task
          </div>
          <div className="flex-1 flex">
            {days.map((day, i) => (
              <div 
                key={i} 
                className={`flex-1 min-w-[40px] text-center py-2 text-xs border-r border-gray-100 ${
                  isSameDay(day, today) ? 'bg-teal-50 text-teal-700 font-bold' : 'text-gray-500'
                }`}
              >
                <div className="uppercase text-[10px]">{format(day, 'EEE')}</div>
                <div>{format(day, 'd')}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Body - Tasks */}
        <div className="divide-y divide-gray-100">
          {sortedTasks.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No tasks with dates assigned.
            </div>
          ) : (
            sortedTasks.map(task => {
              const taskStart = task.startDate ? new Date(task.startDate) : (task.dueDate ? new Date(task.dueDate) : null);
              const taskEnd = task.dueDate ? new Date(task.dueDate) : (task.startDate ? new Date(task.startDate) : null);
              
              if (!taskStart || !taskEnd || isNaN(taskStart.getTime()) || isNaN(taskEnd.getTime())) return null;

              return (
                <div key={task.id} className="flex hover:bg-gray-50 group cursor-pointer" onClick={() => onTaskClick(task)}>
                  <div className="w-48 flex-shrink-0 p-3 border-r border-gray-200 text-sm font-medium text-gray-900 truncate">
                    {task.title}
                  </div>
                  <div className="flex-1 flex relative py-2">
                    {/* Background grid */}
                    {days.map((day, i) => (
                      <div key={i} className="flex-1 min-w-[40px] border-r border-gray-100"></div>
                    ))}
                    
                    {/* Task Bar */}
                    <div className="absolute top-0 bottom-0 left-0 right-0 flex pointer-events-none px-1">
                      {days.map((day, i) => {
                        const dayTime = day.getTime();
                        const isStart = isSameDay(day, taskStart);
                        const isEnd = isSameDay(day, taskEnd);
                        const rangeStart = startOfDay(taskStart.getTime() <= taskEnd.getTime() ? taskStart : taskEnd).getTime();
                        const rangeEnd = endOfDay(taskStart.getTime() <= taskEnd.getTime() ? taskEnd : taskStart).getTime();
                        const isWithinRange = dayTime >= rangeStart && dayTime <= rangeEnd;
                        
                        if (isStart || isEnd || isWithinRange) {
                          return (
                            <div key={i} className="flex-1 min-w-[40px] flex items-center h-full">
                              <div className={`h-6 bg-teal-500 w-full ${isStart ? 'rounded-l-md ml-1' : ''} ${isEnd ? 'rounded-r-md mr-1' : ''}`}></div>
                            </div>
                          );
                        }
                        
                        return <div key={i} className="flex-1 min-w-[40px]"></div>;
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
