import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, signInAnonymously, onAuthStateChanged, User, AuthError } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyDLaIa2m2rmBNorIZYda0Vq8Fa3WSBwDQE",
  authDomain: "multiplayer-sandbox-test.firebaseapp.com",
  projectId: "multiplayer-sandbox-test",
  storageBucket: "multiplayer-sandbox-test.firebasestorage.app",
  messagingSenderId: "12565327257",
  appId: "1:12565327257:web:b0608ca726701a55117708"
};

// Initialize Firebase exactly once
export let app: FirebaseApp;
export let auth: Auth;
export let db: Firestore;

let isFirebaseInitialized = false;
let isFirestoreInitialized = false;
let initError: { code?: string; message: string } | null = null;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
  isFirebaseInitialized = true;

  auth = getAuth(app);
  db = getFirestore(app);
  isFirestoreInitialized = true;
} catch (err: unknown) {
  const error = err as AuthError | Error;
  initError = {
    code: 'code' in error ? error.code : 'INITIALIZATION_FAILED',
    message: error.message || 'Failed to initialize Firebase'
  };
  console.error('[Firebase Init Error]', err);
}

export {
  isFirebaseInitialized,
  isFirestoreInitialized,
  initError,
  signInAnonymously,
  onAuthStateChanged
};

export type { User, AuthError };
