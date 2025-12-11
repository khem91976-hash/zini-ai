
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  credits: number;
  plan: 'free' | 'pro' | 'elite';
  avatar?: string;
  joinedAt: string;
}

export interface Message {
  role: 'user' | 'model';
  content: string;
  type: 'text' | 'image';
  timestamp?: number;
}

export interface ChatSession {
    _id: string;
    title: string;
    lastUpdated: string;
}
