import { User } from 'firebase/auth';

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
