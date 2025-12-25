
export enum ViewState {
  TASKS = 'TASKS',
  CALENDAR = 'CALENDAR',
  ASSISTANT = 'ASSISTANT',
  SCANNER = 'SCANNER'
}

export enum Priority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export interface UserSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  accentColor: string; // "indigo", "purple", "emerald", "orange"
}

export interface User {
  name: string;
  specialization: string;
  isPro: boolean;
  settings?: UserSettings;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  category?: string;
  priority?: Priority;
  aiGenerated?: boolean;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  caseNumber?: string; // Legal context
  subtasks?: { id: string; title: string; completed: boolean }[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  lastModified: number;
  tags?: string[];
  relatedCase?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  time: string; // HH:MM
  date?: string; // YYYY-MM-DD
  description?: string;
  location?: string;
  // Updated types for LawyerTool
  type: 'court' | 'meeting' | 'deadline' | 'personal' | 'other';
  caseRef?: string;
  isTask?: boolean; // Flag if this event comes from a task
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface AITaskResponse {
  tasks: {
    title: string;
    category: string;
    priority: 'high' | 'medium' | 'low';
  }[];
}

export interface AIScheduleResponse {
  schedule: {
    time: string;
    activity: string;
    type: string;
  }[];
}
