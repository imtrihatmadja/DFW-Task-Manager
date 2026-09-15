import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Task, TaskStatus } from '../types';
import { useProjectStore } from '../store/projectStore';
import { useUserStore } from '../store/userStore';
import { GripVertical } from 'lucide-react';

interface BoardViewProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const COLUMNS: TaskStatus[] = ['To Do', 'In Progress', 'Review', 'Done'];

export default function BoardView({ tasks, onTaskClick }: BoardViewProps) {
  const { updateTask } = useProjectStore();
  const { users } = useUserStore();

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceStatus = result.source.droppableId as TaskStatus;
    const destStatus = result.destination.droppableId as TaskStatus;
    const taskId = result.draggableId;

    if (sourceStatus !== destStatus) {
      updateTask(taskId, { status: destStatus }).catch(err => {
        console.error("Failed to update task status:", err);
      });
    }
  };

  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((t) => t.status === status);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex space-x-6 overflow-x-auto pb-4 items-start min-h-[500px]">
        {COLUMNS.map((status) => (
          <div key={status} className="flex-shrink-0 w-80 flex flex-col bg-gray-50 rounded-lg">
            <div className="p-3 border-b border-gray-200 bg-gray-100 rounded-t-lg">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex justify-between items-center">
                {status}
                <span className="bg-gray-200 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                  {getTasksByStatus(status).length}
                </span>
              </h3>
            </div>
            
            <Droppable droppableId={status}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 p-3 min-h-[150px] transition-colors ${
                    snapshot.isDraggingOver ? 'bg-teal-50' : ''
                  }`}
                >
                  {getTasksByStatus(status).map((task, index) => (
                    // @ts-ignore
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          onClick={() => onTaskClick(task)}
                          className={`bg-white p-4 mb-3 rounded shadow-sm border ${
                            snapshot.isDragging ? 'border-teal-500 shadow-md' : 'border-gray-200'
                          } hover:border-gray-300 transition-shadow cursor-pointer`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${
                              task.priority === 'High' ? 'bg-red-100 text-red-700' :
                              task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {task.priority}
                            </span>
                            <GripVertical className="h-4 w-4 text-gray-300" />
                          </div>
                          
                          <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                            {task.title}
                          </h4>
                          
                          {task.dueDate && (
                            <div className="text-xs text-gray-500 mt-2">
                              Due: {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                            {task.assignees.length > 0 ? (
                              <div className="flex items-center -space-x-1.5 overflow-hidden">
                                {task.assignees.slice(0, 3).map((assigneeId, aIdx) => {
                                  const cleanId = String(assigneeId).trim().toLowerCase();
                                  const u = users.find(user => user.uid === assigneeId || (user.email && user.email.toLowerCase() === cleanId));
                                  return (
                                    <div 
                                      key={aIdx} 
                                      title={u ? (u.displayName || u.email) : assigneeId}
                                      className="w-5 h-5 rounded-full bg-teal-600 text-white text-[9px] font-bold flex items-center justify-center border border-white shadow-xs overflow-hidden"
                                    >
                                      {u?.photoURL ? (
                                        <img src={u.photoURL} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        (u?.displayName || cleanId).charAt(0).toUpperCase()
                                      )}
                                    </div>
                                  );
                                })}
                                {task.assignees.length > 3 && (
                                  <span className="text-[10px] text-gray-500 font-medium pl-1.5">
                                    +{task.assignees.length - 3}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="text-[11px] text-gray-400 border border-dashed border-gray-300 px-2 py-0.5 rounded">
                                Unassigned
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
