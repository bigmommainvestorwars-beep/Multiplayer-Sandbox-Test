import { User } from 'firebase/auth';
import type { Timestamp } from 'firebase/firestore';

export interface AuthState {
  user: User | null;
  uid: string | null;
  loading: boolean;
  status: 'initializing' | 'authenticating' | 'authenticated' | 'unauthenticated' | 'error';
  error: {
    code?: string;
    message: string;
    raw?: unknown;
  } | null;
  firebaseInitialized: boolean;
  firestoreInitialized: boolean;
  isAnonymous: boolean;
  authListenerAttached: boolean;
}

export interface PresencePlayer {
  uid: string;
  displayName: string;
  online: boolean;
  lastSeen: Timestamp | null | { seconds: number; nanoseconds: number };
}

export interface PresenceState {
  players: PresencePlayer[];
  loading: boolean;
  error: {
    code?: string;
    message: string;
    raw?: unknown;
  } | null;
  presenceDocWritten: boolean;
  listenerActive: boolean;
}
