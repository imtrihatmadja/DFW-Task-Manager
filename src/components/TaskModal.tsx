import React, { useState, useEffect, useRef } from 'react';
import { Task, TaskStatus, TaskPriority, Subtask, Comment, UserProfile } from '../types';
import { useAuthStore } from '../store/authStore';
import { useProjectStore } from '../store/projectStore';
import { useUserStore } from '../store/userStore';
import { X, Calendar, Plus, Trash2, MessageSquare, CheckSquare, MessageCircle, ChevronDown, ChevronUp, Send, Image as ImageIcon, Maximize2, Download, Paperclip, AtSign, UserPlus, UserCheck, Check } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { generateId } from '../lib/utils';

// Helper to compress and convert images/screenshots to base64 DataURL
const processImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File harus berformat gambar'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new (window as any).Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIMENSION = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

interface MentionDropdownProps {
  isOpen: boolean;
  query: string;
  users: UserProfile[];
  assignees: string[];
  onSelect: (user: UserProfile) => void;
  onClose: () => void;
  title?: string;
}

const MentionDropdown: React.FC<MentionDropdownProps> = ({
  isOpen,
  query,
  users,
  assignees,
  onSelect,
  onClose,
  title = "Pilih Anggota untuk di-Mention & Assign"
}) => {
  if (!isOpen) return null;

  const q = query.trim().toLowerCase();
  const filteredUsers = users.filter(u => {
    if (!q) return true;
    const nameMatch = u.displayName?.toLowerCase().includes(q);
    const emailMatch = u.email?.toLowerCase().includes(q);
    return nameMatch || emailMatch;
  });

  return (
    <div 
      className="absolute bottom-full mb-2 left-0 z-50 w-full max-w-sm bg-white border border-teal-200 rounded-lg shadow-xl overflow-hidden text-left"
      style={{ filter: 'drop-shadow(0 10px 20px rgba(13, 148, 136, 0.16))' }}
    >
      <div className="flex items-center justify-between px-3 py-2 bg-teal-800 text-white text-xs font-semibold">
        <div className="flex items-center space-x-1.5 min-w-0 pr-2">
          <AtSign className="w-3.5 h-3.5 text-teal-300 flex-shrink-0" />
          <span className="truncate">{title}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-teal-200 hover:text-white p-0.5 rounded transition-colors flex-shrink-0"
          title="Tutup"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="px-3 py-1.5 bg-teal-50/80 border-b border-teal-100 text-[11px] text-teal-900 flex items-center justify-between">
        <span className="font-medium">Pilih anggota (@mention):</span>
        <span className="text-[10px] bg-teal-100 text-teal-800 font-semibold px-1.5 py-0.5 rounded border border-teal-300">
          Otomatis Jadi Penanggung Jawab
        </span>
      </div>

      <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
        {filteredUsers.length === 0 ? (
          <div className="p-3 text-center text-xs text-gray-400 italic">
            Tidak ada anggota yang cocok dengan "{query}"
          </div>
        ) : (
          filteredUsers.map(user => {
            const isAssigned = assignees.includes(user.uid);
            return (
              <button
                key={user.uid}
                type="button"
                onClick={() => onSelect(user)}
                className="w-full text-left px-3 py-2 hover:bg-teal-50 transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full object-cover border border-gray-200 flex-shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs flex-shrink-0 border border-teal-200">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-gray-800 truncate group-hover:text-teal-900">
                      {user.displayName || user.email}
                    </div>
                    <div className="text-[10px] text-gray-400 truncate">
                      {user.email} &bull; {user.role === 'admin' ? 'Koordinator Nasional' : user.role === 'project_coordinator' ? 'Project Coordinator' : 'Field Officer'}
                    </div>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  {isAssigned ? (
                    <span className="inline-flex items-center text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded font-medium">
                      <Check className="w-2.5 h-2.5 mr-1 text-teal-600" />
                      Ditugaskan
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[10px] text-teal-700 bg-teal-50 border border-teal-300 px-2 py-0.5 rounded font-semibold group-hover:bg-teal-600 group-hover:text-white transition-colors">
                      <UserPlus className="w-2.5 h-2.5 mr-1" />
                      + Assign
                    </span>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

interface TaskModalProps {
  projectId: string;
  task?: Task | null;
  onClose: () => void;
}

export default function TaskModal({ projectId, task, onClose }: TaskModalProps) {
  const profile = useAuthStore(state => state.profile);
  const { createTask, updateTask, projects } = useProjectStore();
  const { users, fetchUsers, loadingUsers } = useUserStore();
  
  const project = projects.find(p => p.id === projectId);
  
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'To Do');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'Medium');
  // Handle dates formatting
  const [startDate, setStartDate] = useState(task?.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '');
  const [dueDate, setDueDate] = useState(task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
  const [assignees, setAssignees] = useState<string[]>(() => {
    if (task?.assignees && task.assignees.length > 0) {
      return task.assignees;
    }
    if (task) {
      return [];
    }
    return profile?.uid ? [profile.uid] : [];
  });
  const hasInteractedWithAssignees = useRef(false);

  useEffect(() => {
    // If opening to add a new task and assignees hasn't been manually altered, default to current user
    if (!task && profile?.uid && assignees.length === 0 && !hasInteractedWithAssignees.current) {
      setAssignees([profile.uid]);
    }
  }, [profile?.uid, task, assignees.length]);
  
  const [subtasks, setSubtasks] = useState<Subtask[]>(task?.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  
  // State for subtask comments
  const [expandedSubtaskComments, setExpandedSubtaskComments] = useState<Record<string, boolean>>({});
  const [subtaskCommentInputs, setSubtaskCommentInputs] = useState<Record<string, string>>({});
  const [subtaskImageAttachments, setSubtaskImageAttachments] = useState<Record<string, { dataUrl: string; name: string } | null>>({});
  const [dragOverSubtaskId, setDragOverSubtaskId] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title?: string } | null>(null);

  const [comments, setComments] = useState<Comment[]>(task?.comments || []);
  const [newCommentText, setNewCommentText] = useState('');

  // State for mentions & auto-assign notification
  const [mentionNotice, setMentionNotice] = useState<string | null>(null);

  // Main comment mention autocomplete state
  const [isMainMentionOpen, setIsMainMentionOpen] = useState(false);
  const [mainMentionQuery, setMainMentionQuery] = useState('');
  const mainCommentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Subtask comment mention autocomplete state
  const [activeSubtaskMentionId, setActiveSubtaskMentionId] = useState<string | null>(null);
  const [subtaskMentionQuery, setSubtaskMentionQuery] = useState('');
  const subtaskInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async () => {
    if (!task) return;
    try {
      const { deleteTask } = useProjectStore.getState();
      await deleteTask(task.id);
      onClose();
    } catch (error: any) {
      console.error("Failed to delete task:", error);
      setErrorMsg(`Failed to delete task: ${error.message || 'Check permissions'}`);
    }
    setIsDeleteModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !profile) return;
    
    setIsSubmitting(true);
    
    try {
      if (task) {
        await updateTask(task.id, {
          title,
          description,
          status,
          priority,
          assignees,
          subtasks,
          comments,
          startDate: startDate ? new Date(startDate).getTime() : null,
          dueDate: dueDate ? new Date(dueDate).getTime() : null,
        });
      } else {
        const finalAssignees = (assignees.length > 0)
          ? assignees
          : (profile.uid ? [profile.uid] : []);

        await createTask({
          projectId,
          title,
          description,
          status,
          priority,
          assignees: finalAssignees,
          subtasks,
          comments,
          tags: [],
          startDate: startDate ? new Date(startDate).getTime() : null,
          dueDate: dueDate ? new Date(dueDate).getTime() : null,
          createdAt: Date.now(),
          createdBy: profile.uid
        });
      }
      onClose();
    } catch (error: any) {
      console.error("Failed to save task:", error);
      setErrorMsg(`Gagal menyimpan tugas: ${error.message || 'Periksa hak akses Anda'}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setSubtasks([
      ...subtasks,
      { id: generateId(), title: newSubtaskTitle.trim(), isCompleted: false, comments: [] }
    ]);
    setNewSubtaskTitle('');
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(subtasks.map(st => st.id === id ? { ...st, isCompleted: !st.isCompleted } : st));
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };

  const toggleSubtaskCommentSection = (subtaskId: string) => {
    setExpandedSubtaskComments(prev => ({
      ...prev,
      [subtaskId]: !prev[subtaskId]
    }));
  };

  const toggleAllSubtaskComments = () => {
    const anyExpanded = subtasks.some(st => expandedSubtaskComments[st.id]);
    const nextState: Record<string, boolean> = {};
    if (!anyExpanded) {
      subtasks.forEach(st => {
        nextState[st.id] = true;
      });
    }
    setExpandedSubtaskComments(nextState);
  };

  const handleAttachImage = async (subtaskId: string, file: File) => {
    try {
      const dataUrl = await processImageFile(file);
      setSubtaskImageAttachments(prev => ({
        ...prev,
        [subtaskId]: {
          dataUrl,
          name: file.name || `screenshot-${Date.now().toString().slice(-4)}.png`
        }
      }));
      setExpandedSubtaskComments(prev => ({
        ...prev,
        [subtaskId]: true
      }));
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memproses file gambar.');
    }
  };

  const handleFileInputChange = (subtaskId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleAttachImage(subtaskId, files[0]);
    }
    e.target.value = '';
  };

  const handlePasteEvent = (subtaskId: string, e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, '');
          const screenshotFile = new File([file], `screenshot-${timestamp}.png`, { type: file.type });
          handleAttachImage(subtaskId, screenshotFile);
          break;
        }
      }
    }
  };

  const handleDropEvent = (subtaskId: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverSubtaskId(null);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        handleAttachImage(subtaskId, file);
      }
    }
  };

  const handleRemoveAttachment = (subtaskId: string) => {
    setSubtaskImageAttachments(prev => ({
      ...prev,
      [subtaskId]: null
    }));
  };

  // Helper to auto-assign mentioned user to this task
  const autoAssignUser = (targetUser: UserProfile) => {
    if (!assignees.includes(targetUser.uid)) {
      const updatedAssignees = [...assignees, targetUser.uid];
      setAssignees(updatedAssignees);

      // Persist assignment if task already exists
      if (task?.id) {
        updateTask(task.id, { assignees: updatedAssignees });
      }

      setMentionNotice(`✓ ${targetUser.displayName || targetUser.email} otomatis ditambahkan sebagai penanggung jawab tugas ini`);
    } else {
      setMentionNotice(`ⓘ ${targetUser.displayName || targetUser.email} di-mention (sudah menjadi penanggung jawab tugas)`);
    }

    setTimeout(() => {
      setMentionNotice(null);
    }, 4500);
  };

  // Helper to scan comment text for any @mentions and automatically assign matched users
  const extractAndAssignMentionedUsers = (text: string) => {
    if (!text) return;
    const lower = text.toLowerCase();
    const newlyAssigned: string[] = [];

    users.forEach(u => {
      const names = [
        u.displayName?.toLowerCase(),
        u.email.toLowerCase(),
        u.email.split('@')[0].toLowerCase()
      ].filter(Boolean) as string[];

      const matched = names.some(name => {
        const pattern = new RegExp(`(^|\\s)@${name.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}(?=[.,!?;:]?(\\s|$))`, 'i');
        return pattern.test(lower);
      });

      if (matched && !assignees.includes(u.uid) && !newlyAssigned.includes(u.uid)) {
        newlyAssigned.push(u.uid);
      }
    });

    if (newlyAssigned.length > 0) {
      const updated = Array.from(new Set([...assignees, ...newlyAssigned]));
      setAssignees(updated);
      if (task?.id) {
        updateTask(task.id, { assignees: updated });
      }
      const namesStr = newlyAssigned
        .map(uid => users.find(u => u.uid === uid)?.displayName || uid)
        .join(', ');
      setMentionNotice(`✓ ${namesStr} otomatis ditambahkan sebagai penanggung jawab tugas`);
      setTimeout(() => setMentionNotice(null), 4500);
    }
  };

  // Main comment input change with '@' detection
  const handleMainCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNewCommentText(val);

    const cursor = e.target.selectionStart || 0;
    const textBeforeCursor = val.slice(0, cursor);
    const atMatch = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9_\s]*)$/);

    if (atMatch) {
      const q = atMatch[1];
      if (q.length <= 25 && !q.includes('\n')) {
        setMainMentionQuery(q);
        setIsMainMentionOpen(true);
        return;
      }
    }
    setIsMainMentionOpen(false);
  };

  // Select user from Main comment mention dropdown
  const handleSelectMainMention = (user: UserProfile) => {
    const name = user.displayName || user.email.split('@')[0];
    const mentionText = `@${name} `;
    const text = newCommentText;
    const cursor = mainCommentTextareaRef.current?.selectionStart ?? text.length;
    const textBeforeCursor = text.slice(0, cursor);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    let updated = '';
    if (atIndex !== -1) {
      updated = text.slice(0, atIndex) + mentionText + text.slice(cursor);
    } else {
      updated = text + (text && !text.endsWith(' ') ? ' ' : '') + mentionText;
    }

    setNewCommentText(updated);
    setIsMainMentionOpen(false);
    setMainMentionQuery('');
    autoAssignUser(user);

    setTimeout(() => {
      if (mainCommentTextareaRef.current) {
        mainCommentTextareaRef.current.focus();
        const newPos = (atIndex !== -1 ? atIndex : text.length) + mentionText.length;
        mainCommentTextareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 50);
  };

  // Subtask comment input change with '@' detection
  const handleSubtaskCommentChange = (subtaskId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSubtaskCommentInputs(prev => ({ ...prev, [subtaskId]: val }));

    const cursor = e.target.selectionStart || val.length;
    const textBeforeCursor = val.slice(0, cursor);
    const atMatch = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9_\s]*)$/);

    if (atMatch) {
      const q = atMatch[1];
      if (q.length <= 25) {
        setActiveSubtaskMentionId(subtaskId);
        setSubtaskMentionQuery(q);
        return;
      }
    }
    if (activeSubtaskMentionId === subtaskId) {
      setActiveSubtaskMentionId(null);
    }
  };

  // Select user from Subtask comment mention dropdown
  const handleSelectSubtaskMention = (subtaskId: string, user: UserProfile) => {
    const name = user.displayName || user.email.split('@')[0];
    const mentionText = `@${name} `;
    const text = subtaskCommentInputs[subtaskId] || '';
    const inputEl = subtaskInputRefs.current[subtaskId];
    const cursor = inputEl?.selectionStart ?? text.length;
    const textBeforeCursor = text.slice(0, cursor);
    const atIndex = textBeforeCursor.lastIndexOf('@');

    let updated = '';
    if (atIndex !== -1) {
      updated = text.slice(0, atIndex) + mentionText + text.slice(cursor);
    } else {
      updated = text + (text && !text.endsWith(' ') ? ' ' : '') + mentionText;
    }

    setSubtaskCommentInputs(prev => ({ ...prev, [subtaskId]: updated }));
    setActiveSubtaskMentionId(null);
    setSubtaskMentionQuery('');
    autoAssignUser(user);

    setTimeout(() => {
      if (inputEl) {
        inputEl.focus();
        const newPos = (atIndex !== -1 ? atIndex : text.length) + mentionText.length;
        inputEl.setSelectionRange(newPos, newPos);
      }
    }, 50);
  };

  // Render text with interactive mention chips
  const renderCommentContent = (text: string) => {
    if (!text) return null;

    const userMap = new Map<string, UserProfile>();
    users.forEach(u => {
      if (u.displayName) userMap.set(u.displayName.toLowerCase(), u);
      userMap.set(u.email.toLowerCase(), u);
      userMap.set(u.email.split('@')[0].toLowerCase(), u);
    });

    const escapedKeys = Array.from(userMap.keys())
      .sort((a, b) => b.length - a.length)
      .map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    if (escapedKeys.length === 0) {
      return <span>{text}</span>;
    }

    const regex = new RegExp(`(^|\\s)(@(?:${escapedKeys.join('|')}))(?=[.,!?;:]?(?:\\s|$))`, 'gi');
    const parts = text.split(regex);

    return (
      <span>
        {parts.map((part, index) => {
          if (!part) return null;
          if (part.startsWith('@')) {
            const raw = part.substring(1).toLowerCase();
            const matched = userMap.get(raw);
            if (matched) {
              const isCurrentAssignee = assignees.includes(matched.uid);
              return (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 font-semibold text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200 text-xs shadow-2xs mx-0.5 transition-colors align-baseline"
                  title={`Penanggung Jawab: ${matched.displayName || matched.email} (${matched.role === 'admin' ? 'Koordinator Nasional' : matched.role === 'project_coordinator' ? 'Project Coordinator' : 'Field Officer'})`}
                >
                  <AtSign className="w-3 h-3 text-teal-600 inline flex-shrink-0" />
                  <span>{matched.displayName || matched.email}</span>
                  <span className="text-[9px] bg-teal-600 text-white font-medium px-1 rounded-xs flex-shrink-0">
                    {isCurrentAssignee ? 'Assignee' : '+ Ditugaskan'}
                  </span>
                </span>
              );
            }
          }
          return <span key={index}>{part}</span>;
        })}
      </span>
    );
  };

  const handleAddSubtaskComment = (subtaskId: string) => {
    const text = (subtaskCommentInputs[subtaskId] || '').trim();
    const attachment = subtaskImageAttachments[subtaskId];
    if ((!text && !attachment) || !profile) return;

    // Auto-assign any mentioned users in this subtask comment
    if (text) {
      extractAndAssignMentionedUsers(text);
    }

    const newComment: Comment = {
      id: 'c-sub-' + Date.now().toString() + '-' + Math.random().toString(36).substring(2, 6),
      userId: profile.uid,
      text: text || (attachment ? '(Lampiran Gambar/Screenshot)' : ''),
      createdAt: Date.now(),
      imageUrl: attachment?.dataUrl,
      imageName: attachment?.name
    };

    setSubtasks(prev => prev.map(st => {
      if (st.id === subtaskId) {
        return {
          ...st,
          comments: [...(st.comments || []), newComment]
        };
      }
      return st;
    }));

    setSubtaskCommentInputs(prev => ({
      ...prev,
      [subtaskId]: ''
    }));

    setSubtaskImageAttachments(prev => ({
      ...prev,
      [subtaskId]: null
    }));

    setActiveSubtaskMentionId(null);

    setExpandedSubtaskComments(prev => ({
      ...prev,
      [subtaskId]: true
    }));
  };

  const handleDeleteSubtaskComment = (subtaskId: string, commentId: string) => {
    setSubtasks(prev => prev.map(st => {
      if (st.id === subtaskId) {
        return {
          ...st,
          comments: (st.comments || []).filter(c => c.id !== commentId)
        };
      }
      return st;
    }));
  };

  const formatCommentDate = (timestamp: number) => {
    try {
      const d = new Date(timestamp);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return new Date(timestamp).toLocaleDateString();
    }
  };

  const handleAddComment = () => {
    if (!newCommentText.trim() || !profile) return;

    // Auto-assign any mentioned users in this main comment
    extractAndAssignMentionedUsers(newCommentText);

    setComments([
      ...comments,
      { id: generateId(), userId: profile.uid, text: newCommentText, createdAt: Date.now() }
    ]);
    setNewCommentText('');
    setIsMainMentionOpen(false);
  };

  const isAssigneeSelected = (member: UserProfile) => {
    return assignees.some(id => {
      if (!id) return false;
      if (id === member.uid) return true;
      if (member.email && id.toLowerCase() === member.email.toLowerCase()) return true;
      if (member.email === 'admin@dfw.or.id' && (id === 'admin' || id.toLowerCase() === 'admin@dfw.or.id')) return true;
      if (member.email === 'imam.trihatmadja@dfw.or.id' && (id === 'coordinator-imam' || id === 'coordinator-1')) return true;
      if (member.email === 'budi.santoso@dfw.or.id' && id === 'officer-1') return true;
      if (member.email === 'dewi.lestari@dfw.or.id' && id === 'officer-2') return true;
      return false;
    });
  };

  const toggleAssignee = (member: UserProfile) => {
    hasInteractedWithAssignees.current = true;
    const isSelected = isAssigneeSelected(member);
    if (isSelected) {
      setAssignees(assignees.filter(id => {
        if (!id) return false;
        if (id === member.uid) return false;
        if (member.email && id.toLowerCase() === member.email.toLowerCase()) return false;
        if (member.email === 'admin@dfw.or.id' && (id === 'admin' || id.toLowerCase() === 'admin@dfw.or.id')) return false;
        if (member.email === 'imam.trihatmadja@dfw.or.id' && (id === 'coordinator-imam' || id === 'coordinator-1')) return false;
        if (member.email === 'budi.santoso@dfw.or.id' && id === 'officer-1') return false;
        if (member.email === 'dewi.lestari@dfw.or.id' && id === 'officer-2') return false;
        return true;
      }));
    } else {
      setAssignees([...assignees, member.uid]);
    }
  };

  // Show all team members in the organization, sorted with current assignees & project members first
  const projectMembers = [...users].sort((a, b) => {
    const aSelected = isAssigneeSelected(a);
    const bSelected = isAssigneeSelected(b);
    if (aSelected && !bSelected) return -1;
    if (!aSelected && bSelected) return 1;

    const aInProj = project?.members?.some(m => m === a.uid || (a.email && m.toLowerCase() === a.email.toLowerCase()));
    const bInProj = project?.members?.some(m => m === b.uid || (b.email && m.toLowerCase() === b.email.toLowerCase()));
    if (aInProj && !bInProj) return -1;
    if (!aInProj && bInProj) return 1;

    return (a.displayName || a.email).localeCompare(b.displayName || b.email);
  });

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => !isSubmitting && onClose()}></div>
      <div className="relative bg-white rounded-lg text-left overflow-hidden shadow-xl w-full max-w-4xl">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">
              {task ? 'Edit Task' : 'New Task'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row h-[70vh]">
            {/* Left Column - Main Details */}
            <div className="flex-1 overflow-y-auto p-6 border-r border-gray-200">
              {/* Mention & Auto-Assign Notification Banner */}
              {mentionNotice && (
                <div className="mb-4 flex items-center justify-between px-3.5 py-2.5 bg-teal-50 border border-teal-300 rounded-lg text-teal-900 text-xs shadow-2xs">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
                    <span className="font-semibold">{mentionNotice}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMentionNotice(null)}
                    className="text-teal-600 hover:text-teal-900 p-0.5 rounded transition-colors"
                    title="Tutup pemberitahuan"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <form id="task-form" onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <input
                    type="text"
                    placeholder="Task Name"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full text-xl font-medium border-0 border-b border-transparent hover:border-gray-300 focus:border-teal-500 focus:ring-0 px-0 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Deskripsi Tugas</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Tambahkan detail informasi atau catatan inspeksi untuk tugas ini..."
                    className="block w-full border border-gray-300 rounded-md shadow-2xs focus:ring-teal-500 focus:border-teal-500 text-sm p-3 bg-white text-gray-800"
                  />
                </div>
              </form>

              {/* Subtasks Section */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <CheckSquare className="w-5 h-5 text-teal-600" />
                    <span className="text-gray-900 font-medium">Subtasks</span>
                    {subtasks.length > 0 && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                        {subtasks.filter(st => st.isCompleted).length}/{subtasks.length} Selesai
                      </span>
                    )}
                  </div>
                  {subtasks.length > 0 && (
                    <button
                      type="button"
                      onClick={toggleAllSubtaskComments}
                      className="text-xs text-teal-600 hover:text-teal-800 font-medium hover:underline flex items-center"
                    >
                      <MessageSquare className="w-3.5 h-3.5 mr-1" />
                      {subtasks.some(st => expandedSubtaskComments[st.id]) ? 'Tutup Semua Komentar' : 'Buka Semua Komentar'}
                    </button>
                  )}
                </div>

                <div className="space-y-2.5 mb-4">
                  {subtasks.map(st => {
                    const hasComments = st.comments && st.comments.length > 0;
                    const isExpanded = !!expandedSubtaskComments[st.id];
                    const latestComment = hasComments ? st.comments![st.comments!.length - 1] : null;
                    const latestCommentUser = latestComment ? users.find(u => u.uid === latestComment.userId) : null;

                    return (
                      <div
                        key={st.id}
                        className={`border rounded-lg p-2.5 transition-all ${
                          isExpanded
                            ? 'border-teal-300 bg-teal-50/20 shadow-xs'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        {/* Subtask Row Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center flex-1 min-w-0 mr-2">
                            <input
                              type="checkbox"
                              checked={st.isCompleted}
                              onChange={() => handleToggleSubtask(st.id)}
                              className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded cursor-pointer flex-shrink-0"
                            />
                            <span
                              className={`ml-3 text-sm truncate select-none ${
                                st.isCompleted ? 'text-gray-400 line-through' : 'text-gray-800 font-medium'
                              }`}
                            >
                              {st.title}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1.5 flex-shrink-0">
                            {/* Comment column / toggle button for this subtask */}
                            <button
                              type="button"
                              onClick={() => toggleSubtaskCommentSection(st.id)}
                              className={`inline-flex items-center px-2 py-1 text-xs rounded-md font-medium transition-colors ${
                                hasComments
                                  ? 'bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200'
                                  : 'text-gray-500 hover:text-teal-700 hover:bg-gray-100 border border-gray-200'
                              }`}
                              title={hasComments ? `${st.comments!.length} Komentar pada subtask ini` : 'Tambah komentar untuk subtask ini'}
                            >
                              <MessageSquare className="h-3.5 w-3.5 mr-1" />
                              {hasComments ? (
                                <span>{st.comments!.length} Komentar</span>
                              ) : (
                                <span>+ Komentar</span>
                              )}
                              {isExpanded ? (
                                <ChevronUp className="h-3 w-3 ml-1 text-gray-400" />
                              ) : (
                                <ChevronDown className="h-3 w-3 ml-1 text-gray-400" />
                              )}
                            </button>

                            {/* Delete Subtask */}
                            <button
                              type="button"
                              onClick={() => handleDeleteSubtask(st.id)}
                              className="text-gray-300 hover:text-red-600 p-1 rounded transition-colors"
                              title="Hapus Subtask"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Collapsed Preview of latest subtask comment */}
                        {!isExpanded && hasComments && latestComment && (
                          <div
                            onClick={() => toggleSubtaskCommentSection(st.id)}
                            className="mt-2 ml-7 text-xs text-gray-600 bg-gray-50 hover:bg-teal-50/50 rounded px-2.5 py-1.5 cursor-pointer flex items-center justify-between border border-gray-100 transition-colors"
                          >
                            <div className="truncate flex-1 mr-2 flex items-center">
                              <span className="font-semibold text-gray-700 mr-1.5">
                                {latestCommentUser?.displayName || 'User'}:
                              </span>
                              {latestComment.imageUrl && (
                                <span className="inline-flex items-center text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded mr-1.5 flex-shrink-0">
                                  <ImageIcon className="w-2.5 h-2.5 mr-0.5" /> Gambar
                                </span>
                              )}
                              <span className="text-gray-600 italic truncate">
                                "{latestComment.text || (latestComment.imageUrl ? 'Lampiran gambar' : '')}"
                              </span>
                            </div>
                            <span className="text-[10px] text-teal-600 whitespace-nowrap font-medium flex-shrink-0">
                              Lihat komentar ({st.comments!.length})
                            </span>
                          </div>
                        )}

                        {/* Expanded Comment Section / Thread for this Subtask */}
                        {isExpanded && (
                          <div className="mt-3 ml-7 pt-3 border-t border-gray-200/80 space-y-3">
                            <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                              <span className="flex items-center text-teal-800">
                                <MessageCircle className="h-3.5 w-3.5 mr-1 text-teal-600" />
                                Komentar & Catatan Subtask ({st.comments?.length || 0})
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleSubtaskCommentSection(st.id)}
                                className="text-gray-400 hover:text-gray-600 text-[11px]"
                              >
                                Tutup
                              </button>
                            </div>

                            {/* Existing comments on this subtask */}
                            {st.comments && st.comments.length > 0 ? (
                              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                                {st.comments.map(comment => {
                                  const commentUser = users.find(u => u.uid === comment.userId);
                                  return (
                                    <div
                                      key={comment.id}
                                      className="bg-white p-2.5 rounded-md border border-gray-200 text-xs shadow-2xs"
                                    >
                                      <div className="flex justify-between items-center mb-1">
                                        <div className="flex items-center space-x-1.5">
                                          {commentUser?.photoURL ? (
                                            <img
                                              src={commentUser.photoURL}
                                              alt=""
                                              className="h-4 w-4 rounded-full"
                                            />
                                          ) : (
                                            <div className="h-4 w-4 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-[9px]">
                                              {commentUser?.displayName?.charAt(0) || 'U'}
                                            </div>
                                          )}
                                          <span className="font-semibold text-gray-800">
                                            {commentUser?.displayName || commentUser?.email || 'User'}
                                          </span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <span className="text-[10px] text-gray-400">
                                            {formatCommentDate(comment.createdAt)}
                                          </span>
                                          {(profile?.role === 'admin' || profile?.uid === comment.userId) && (
                                            <button
                                              type="button"
                                              onClick={() => handleDeleteSubtaskComment(st.id, comment.id)}
                                              className="text-gray-300 hover:text-red-500"
                                              title="Hapus komentar subtask"
                                            >
                                              <Trash2 className="h-3 w-3" />
                                            </button>
                                          )}
                                        </div>
                                      </div>

                                      {comment.text && (
                                        <div className="text-gray-700 whitespace-pre-wrap ml-5.5 text-xs">
                                          {renderCommentContent(comment.text)}
                                        </div>
                                      )}

                                      {/* Attached Image / Screenshot thumbnail with click-to-zoom */}
                                      {comment.imageUrl && (
                                        <div className="mt-2 ml-5.5">
                                          <div
                                            onClick={() => setLightboxImage({ url: comment.imageUrl!, title: comment.imageName || comment.text || 'Lampiran Subtask' })}
                                            className="group relative inline-block rounded-md overflow-hidden border border-gray-200 cursor-pointer shadow-2xs hover:shadow-xs transition-all bg-gray-50 max-w-sm"
                                            title="Klik untuk melihat ukuran penuh"
                                          >
                                            <img
                                              src={comment.imageUrl}
                                              alt={comment.imageName || 'Lampiran subtask'}
                                              className="max-h-40 w-auto rounded-md object-contain"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-medium gap-1.5">
                                              <Maximize2 className="w-3.5 h-3.5" />
                                              <span>Perbesar</span>
                                            </div>
                                          </div>
                                          {comment.imageName && (
                                            <div className="text-[10px] text-gray-400 mt-1 truncate max-w-xs flex items-center gap-1">
                                              <ImageIcon className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />
                                              <span className="truncate">{comment.imageName}</span>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400 italic py-1">
                                Belum ada komentar untuk subtask ini. Tulis catatan atau lampirkan screenshot/foto di bawah.
                              </p>
                            )}

                            {/* Image attachment preview before sending */}
                            {subtaskImageAttachments[st.id] && (
                              <div className="relative inline-flex items-center gap-2.5 p-2 bg-teal-50/80 border border-teal-200 rounded-md">
                                <img
                                  src={subtaskImageAttachments[st.id]?.dataUrl}
                                  alt="Preview"
                                  className="h-12 w-12 object-cover rounded border border-teal-300 shadow-2xs cursor-pointer"
                                  onClick={() => setLightboxImage({ url: subtaskImageAttachments[st.id]!.dataUrl, title: subtaskImageAttachments[st.id]!.name })}
                                />
                                <div className="text-[11px] pr-6">
                                  <div className="font-semibold text-teal-900 truncate max-w-[200px]">
                                    {subtaskImageAttachments[st.id]?.name}
                                  </div>
                                  <div className="text-teal-700 flex items-center gap-1 mt-0.5 text-[10px]">
                                    <ImageIcon className="w-3 h-3 text-teal-600" />
                                    <span>Gambar/Screenshot siap dikirim</span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveAttachment(st.id)}
                                  className="absolute top-1.5 right-1.5 p-1 rounded-full bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 border border-gray-200 shadow-2xs transition-colors"
                                  title="Hapus lampiran"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}

                            {/* Add comment to this subtask input area with mention dropdown, paste, drag-and-drop, and attachment button */}
                            <div className="relative">
                              {/* Subtask Mention Dropdown */}
                              <MentionDropdown
                                isOpen={activeSubtaskMentionId === st.id}
                                query={subtaskMentionQuery}
                                users={users}
                                assignees={assignees}
                                onSelect={(u) => handleSelectSubtaskMention(st.id, u)}
                                onClose={() => setActiveSubtaskMentionId(null)}
                                title="Mention & Tugaskan Anggota"
                              />

                              <div
                                onDragOver={(e) => { e.preventDefault(); setDragOverSubtaskId(st.id); }}
                                onDragLeave={() => setDragOverSubtaskId(null)}
                                onDrop={(e) => handleDropEvent(st.id, e)}
                                className={`flex items-center space-x-1.5 p-1 rounded-md border transition-all bg-white shadow-2xs ${
                                  dragOverSubtaskId === st.id
                                    ? 'border-teal-500 ring-2 ring-teal-200 bg-teal-50/40'
                                    : 'border-gray-300 focus-within:ring-1 focus-within:ring-teal-500 focus-within:border-teal-500'
                                }`}
                              >
                                <input
                                  ref={(el) => { subtaskInputRefs.current[st.id] = el; }}
                                  type="text"
                                  placeholder="Tulis komentar... (Ketik @ untuk mention & tugaskan, atau tempel gambar)"
                                  value={subtaskCommentInputs[st.id] || ''}
                                  onChange={(e) => handleSubtaskCommentChange(st.id, e)}
                                  onPaste={(e) => handlePasteEvent(st.id, e)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Escape' && activeSubtaskMentionId === st.id) {
                                      e.preventDefault();
                                      setActiveSubtaskMentionId(null);
                                      return;
                                    }
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddSubtaskComment(st.id);
                                    }
                                  }}
                                  className="flex-1 text-xs border-0 focus:ring-0 py-1.5 px-2.5 text-gray-800 placeholder-gray-400 bg-transparent"
                                />

                                {/* Mention @ button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (activeSubtaskMentionId === st.id) {
                                      setActiveSubtaskMentionId(null);
                                    } else {
                                      setActiveSubtaskMentionId(st.id);
                                      setSubtaskMentionQuery('');
                                      subtaskInputRefs.current[st.id]?.focus();
                                    }
                                  }}
                                  className={`p-1.5 rounded-md transition-colors ${
                                    activeSubtaskMentionId === st.id
                                      ? 'text-teal-700 bg-teal-100 font-bold'
                                      : 'text-gray-400 hover:text-teal-600 hover:bg-teal-50'
                                  }`}
                                  title="Mention & Tugaskan Anggota (@)"
                                >
                                  <AtSign className="w-4 h-4" />
                                </button>

                                {/* Hidden file input */}
                                <input
                                  type="file"
                                  id={`subtask-file-input-${st.id}`}
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handleFileInputChange(st.id, e)}
                                />

                                {/* Attachment button */}
                                <label
                                  htmlFor={`subtask-file-input-${st.id}`}
                                  className="cursor-pointer p-1.5 rounded-md text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-colors"
                                  title="Lampirkan Gambar atau Screenshot (bisa juga Ctrl+V langsung)"
                                >
                                  <ImageIcon className="w-4 h-4" />
                                </label>

                                {/* Submit button */}
                                <button
                                  type="button"
                                  onClick={() => handleAddSubtaskComment(st.id)}
                                  disabled={!subtaskCommentInputs[st.id]?.trim() && !subtaskImageAttachments[st.id]}
                                  className="inline-flex items-center px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-md text-xs font-medium transition-colors shadow-2xs"
                                >
                                  <Send className="w-3 h-3 mr-1" />
                                  Kirim
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add Subtask Input */}
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Tambah subtask baru..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                    className="flex-1 border border-gray-300 rounded-md shadow-2xs focus:ring-teal-500 focus:border-teal-500 text-xs py-2 px-3 bg-white text-gray-800"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    disabled={!newSubtaskTitle.trim()}
                    className="p-2 bg-teal-50 text-teal-700 border border-teal-200 rounded-md hover:bg-teal-100 disabled:opacity-40 transition-colors"
                    title="Tambah Subtask"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              <div className="mt-8">
                <div className="flex items-center text-gray-900 font-medium mb-4">
                  <MessageSquare className="w-5 h-5 mr-2 text-teal-600" />
                  Comments
                </div>
                <div className="space-y-4 mb-4">
                  {comments.map(comment => {
                    const commentUser = users.find(u => u.uid === comment.userId);
                    return (
                      <div key={comment.id} className="flex space-x-3">
                        {commentUser?.photoURL ? (
                          <img src={commentUser.photoURL} alt="" className="h-8 w-8 rounded-full" />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-xs">
                            {commentUser?.displayName?.charAt(0) || 'U'}
                          </div>
                        )}
                        <div className="flex-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium text-gray-900">{commentUser?.displayName || 'User'}</span>
                            <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="text-sm text-gray-700 whitespace-pre-wrap">
                            {renderCommentContent(comment.text)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Main Comment Input Area with MentionDropdown */}
                <div className="relative">
                  {/* Mention Dropdown for Main Comments */}
                  <MentionDropdown
                    isOpen={isMainMentionOpen}
                    query={mainMentionQuery}
                    users={users}
                    assignees={assignees}
                    onSelect={handleSelectMainMention}
                    onClose={() => setIsMainMentionOpen(false)}
                    title="Mention & Tugaskan Anggota"
                  />

                  <div className="flex items-start space-x-3">
                    <div className="flex-1">
                      <div className="border border-gray-300 rounded-md shadow-2xs focus-within:ring-1 focus-within:ring-teal-500 focus-within:border-teal-500 bg-white overflow-hidden">
                        <textarea
                          ref={mainCommentTextareaRef}
                          rows={2}
                          placeholder="Tulis komentar utama tugas... (Ketik @ untuk mention & tugaskan anggota)"
                          value={newCommentText}
                          onChange={handleMainCommentChange}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape' && isMainMentionOpen) {
                              e.preventDefault();
                              setIsMainMentionOpen(false);
                            }
                          }}
                          className="block w-full border-0 focus:ring-0 text-sm p-2.5 bg-transparent text-gray-800"
                        />
                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
                          <button
                            type="button"
                            onClick={() => {
                              setIsMainMentionOpen(!isMainMentionOpen);
                              setMainMentionQuery('');
                              mainCommentTextareaRef.current?.focus();
                            }}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-colors ${
                              isMainMentionOpen
                                ? 'bg-teal-100 text-teal-800 font-semibold'
                                : 'text-gray-600 hover:text-teal-700 hover:bg-teal-50'
                            }`}
                            title="Buka daftar anggota untuk mention & tugaskan"
                          >
                            <AtSign className="w-3.5 h-3.5 text-teal-600" />
                            <span>Mention @user & Assign</span>
                          </button>
                          <span className="text-[11px] text-gray-400 hidden sm:inline">
                            @user langsung otomatis ditugaskan ke task
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddComment}
                      disabled={!newCommentText.trim()}
                      className="px-4 py-2.5 bg-teal-600 text-white rounded-md text-sm font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors shadow-2xs self-start"
                    >
                      Kirim
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column - Meta Data */}
            <div className="w-full md:w-72 bg-gray-50 p-6 overflow-y-auto border-t md:border-t-0 md:border-l border-gray-200">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as TaskStatus)}
                    className="block w-full border border-gray-300 rounded-md shadow-2xs focus:ring-teal-500 focus:border-teal-500 text-sm py-2 px-3 bg-white text-gray-800"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Prioritas</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value as TaskPriority)}
                    className="block w-full border border-gray-300 rounded-md shadow-2xs focus:ring-teal-500 focus:border-teal-500 text-sm py-2 px-3 bg-white text-gray-800"
                  >
                    <option value="Low">Low (Rendah)</option>
                    <option value="Medium">Medium (Sedang)</option>
                    <option value="High">High (Tinggi)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">Penanggung Jawab</label>
                    <span className="text-[11px] text-gray-400 font-medium">({assignees.length} terpilih)</span>
                  </div>
                  {loadingUsers && users.length === 0 ? (
                    <div className="text-xs text-gray-500 py-2 flex items-center gap-1.5">
                      <div className="w-3 h-3 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Memuat anggota...</span>
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-44 overflow-y-auto p-2 bg-white border border-gray-200 rounded-md shadow-2xs">
                      {projectMembers.length === 0 ? (
                        <div className="text-xs text-gray-400 italic p-1">Tidak ada anggota tersedia</div>
                      ) : (
                        projectMembers.map(member => (
                          <label key={member.uid} className="flex items-center space-x-2 py-1 px-1.5 rounded hover:bg-gray-50 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              checked={isAssigneeSelected(member)}
                              onChange={() => toggleAssignee(member)}
                              className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded flex-shrink-0"
                            />
                            <div className="text-xs truncate flex-1" title={member.displayName || member.email}>
                              <span className="font-medium text-gray-800">{member.displayName || member.email}</span>
                              {member.role && (
                                <span className="text-[10px] text-gray-400 ml-1.5">
                                  ({member.role === 'admin' ? 'Koordinator Nasional' : member.role === 'project_coordinator' ? 'Koordinator' : 'Petugas Lapangan'})
                                </span>
                              )}
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  )}
                  <div className="mt-2 flex items-center gap-1 text-[11px] text-teal-700 bg-teal-50 px-2 py-1 rounded border border-teal-200/80">
                    <AtSign className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                    <span>Ketik <strong className="font-semibold">@user</strong> di komentar untuk langsung menugaskan</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Jadwal Tanggal</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="block text-[11px] text-gray-500 mb-1 font-medium">Mulai</span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="block w-full border border-gray-300 rounded-md shadow-2xs focus:ring-teal-500 focus:border-teal-500 text-xs py-1.5 px-2 bg-white text-gray-800"
                      />
                    </div>
                    <div>
                      <span className="block text-[11px] text-gray-500 mb-1 font-medium">Tenggat</span>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                        className="block w-full border border-gray-300 rounded-md shadow-2xs focus:ring-teal-500 focus:border-teal-500 text-xs py-1.5 px-2 bg-white text-gray-800"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
            
          <div className="bg-gray-100 px-6 py-3 flex justify-between items-center border-t border-gray-200">
            <div>
              {task && (
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="px-4 py-2 border border-red-200 rounded-md text-sm font-medium text-red-600 bg-white hover:bg-red-50 hover:border-red-300"
                >
                  Delete Task
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="task-form"
                disabled={isSubmitting || !title.trim()}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Task'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox / Full-size Screenshot Viewer */}
      {lightboxImage && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col w-full">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-900 text-white border-b border-gray-800">
              <div className="flex items-center space-x-2 text-sm font-medium truncate">
                <ImageIcon className="w-4 h-4 text-teal-400 flex-shrink-0" />
                <span className="truncate">{lightboxImage.title || 'Pratinjau Gambar Subtask'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={lightboxImage.url}
                  download={lightboxImage.title || 'subtask-image.png'}
                  className="p-1.5 hover:bg-gray-800 rounded text-gray-300 hover:text-white transition-colors"
                  title="Unduh Gambar"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxImage(null)}
                  className="p-1.5 hover:bg-gray-800 rounded text-gray-300 hover:text-white transition-colors"
                  title="Tutup"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 bg-gray-950 flex items-center justify-center overflow-auto max-h-[calc(90vh-60px)]">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.title || 'Gambar Lampiran'}
                className="max-h-[78vh] max-w-full object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete Task"
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isDestructive={true}
      />

      <ConfirmModal
        isOpen={!!errorMsg}
        title="Error"
        message={errorMsg || ""}
        confirmText="OK"
        cancelText="Close"
        onConfirm={() => setErrorMsg(null)}
        onCancel={() => setErrorMsg(null)}
        isDestructive={false}
      />
    </>
  );
}
