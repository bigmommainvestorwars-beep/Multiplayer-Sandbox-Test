import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  auth, 
  isFirebaseInitialized, 
  isFirestoreInitialized, 
  initError,
  signInAnonymously, 
  onAuthStateChanged,
  type User,
  type AuthError
} from '../firebase';
import type { AuthState } from '../types';

export function useFirebaseAuth() {
  const [authState, setAuthState] = useState<AuthState>(() => ({
    user: null,
    uid: null,
    loading: true,
    status: initError ? 'error' : 'initializing',
    error: initError ? { code: initError.code, message: initError.message } : null,
    firebaseInitialized: isFirebaseInitialized,
    firestoreInitialized: isFirestoreInitialized,
    isAnonymous: false,
    authListenerAttached: false,
  }));

  const isSigningInRef = useRef(false);

  const performAnonymousSignIn = useCallback(async () => {
    if (!auth) {
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        status: 'error',
        error: {
          code: 'AUTH_UNAVAILABLE',
          message: 'Firebase Auth instance is not available.',
        },
      }));
      return;
    }

    if (isSigningInRef.current) return;
    isSigningInRef.current = true;

    setAuthState((prev) => ({
      ...prev,
      loading: true,
      status: 'authenticating',
      error: null,
    }));

    try {
      await signInAnonymously(auth);
      // The onAuthStateChanged listener will handle state update with auth.currentUser.uid
    } catch (err: unknown) {
      const authErr = err as AuthError;
      console.error('[Firebase Anonymous Auth Error]:', authErr);
      setAuthState((prev) => ({
        ...prev,
        loading: false,
        status: 'error',
        error: {
          code: authErr.code || 'AUTH_ERROR',
          message: authErr.message || 'An unknown error occurred during anonymous sign in.',
          raw: authErr,
        },
      }));
    } finally {
      isSigningInRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isFirebaseInitialized || !auth) {
      return;
    }

    setAuthState((prev) => ({
      ...prev,
      authListenerAttached: true,
    }));

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser: User | null) => {
        if (currentUser) {
          // Strictly use auth.currentUser.uid as the only online identity
          setAuthState({
            user: currentUser,
            uid: currentUser.uid,
            loading: false,
            status: 'authenticated',
            error: null,
            firebaseInitialized: isFirebaseInitialized,
            firestoreInitialized: isFirestoreInitialized,
            isAnonymous: currentUser.isAnonymous,
            authListenerAttached: true,
          });
        } else {
          // If no user session is active, initiate anonymous authentication
          setAuthState((prev) => ({
            ...prev,
            user: null,
            uid: null,
            loading: true,
            status: 'authenticating',
          }));
          performAnonymousSignIn();
        }
      },
      (err: Error) => {
        const authErr = err as Partial<AuthError>;
        console.error('[onAuthStateChanged Observer Error]:', err);
        setAuthState((prev) => ({
          ...prev,
          loading: false,
          status: 'error',
          error: {
            code: authErr.code || 'OBSERVER_ERROR',
            message: err.message || 'Failed to observe authentication state.',
            raw: err,
          },
        }));
      }
    );

    return () => {
      unsubscribe();
    };
  }, [performAnonymousSignIn]);

  return {
    ...authState,
    retrySignIn: performAnonymousSignIn,
  };
}
