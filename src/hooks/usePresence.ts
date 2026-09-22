import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  doc, 
  setDoc, 
  collection, 
  onSnapshot, 
  serverTimestamp, 
  updateDoc, 
  FirestoreError 
} from 'firebase/firestore';
import { db } from '../firebase';
import type { PresencePlayer, PresenceState } from '../types';

export function usePresence(uid: string | null) {
  const [presenceState, setPresenceState] = useState<PresenceState>({
    players: [],
    loading: true,
    error: null,
    presenceDocWritten: false,
    listenerActive: false,
  });

  const [customDisplayName, setCustomDisplayName] = useState<string>('');
  const lastWrittenUidRef = useRef<string | null>(null);

  // Write presence document /presence/{uid} when authenticated
  const updateMyPresence = useCallback(async (isOnline: boolean, nameOverride?: string) => {
    if (!uid || !db) return;

    const defaultName = `Player ${uid.slice(0, 6)}`;
    const chosenName = (nameOverride ?? customDisplayName).trim() || defaultName;

    try {
      const userPresenceRef = doc(db, 'presence', uid);
      await setDoc(
        userPresenceRef,
        {
          uid: uid,
          displayName: chosenName,
          online: isOnline,
          lastSeen: serverTimestamp(),
        },
        { merge: true }
      );

      setPresenceState((prev) => ({
        ...prev,
        presenceDocWritten: true,
      }));
    } catch (err: unknown) {
      const firestoreErr = err as FirestoreError;
      console.error('[Firestore Presence Write Error]:', firestoreErr);
      setPresenceState((prev) => ({
        ...prev,
        error: {
          code: firestoreErr.code || 'WRITE_ERROR',
          message: firestoreErr.message || 'Failed to write presence document to Firestore.',
          raw: firestoreErr,
        },
      }));
    }
  }, [uid, customDisplayName]);

  // Handle presence document creation and real-time onSnapshot listener
  useEffect(() => {
    if (!uid || !db) {
      setPresenceState((prev) => ({
        ...prev,
        loading: false,
        listenerActive: false,
      }));
      return;
    }

    lastWrittenUidRef.current = uid;

    // 1. Write the active presence document for this device
    updateMyPresence(true);

    // 2. Attach real-time onSnapshot listener for /presence collection
    const presenceColRef = collection(db, 'presence');

    const unsubscribe = onSnapshot(
      presenceColRef,
      (snapshot) => {
        const activePlayers: PresencePlayer[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          // Rely strictly on Firebase Auth UID stored in doc ID / uid field
          const playerUid = docSnap.id || data.uid;
          if (playerUid) {
            activePlayers.push({
              uid: playerUid,
              displayName: data.displayName || `Player ${playerUid.slice(0, 6)}`,
              online: data.online ?? true,
              lastSeen: data.lastSeen || null,
            });
          }
        });

        // Sort so current player's UID is easily identifiable or sorted deterministically by UID
        activePlayers.sort((a, b) => {
          if (a.uid === uid) return -1;
          if (b.uid === uid) return 1;
          return a.uid.localeCompare(b.uid);
        });

        setPresenceState((prev) => ({
          ...prev,
          players: activePlayers,
          loading: false,
          error: null,
          listenerActive: true,
        }));
      },
      (err: FirestoreError) => {
        console.error('[Firestore onSnapshot Presence Listener Error]:', err);
        setPresenceState((prev) => ({
          ...prev,
          loading: false,
          listenerActive: false,
          error: {
            code: err.code || 'SNAPSHOT_ERROR',
            message: err.message || 'Firestore onSnapshot listener failed.',
            raw: err,
          },
        }));
      }
    );

    // Handle window close / unload to set online: false
    const handleBeforeUnload = () => {
      if (uid && db) {
        const userDocRef = doc(db, 'presence', uid);
        // Best effort non-blocking update
        updateDoc(userDocRef, {
          online: false,
          lastSeen: serverTimestamp(),
        }).catch(() => {
          // Ignored on window exit
        });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup: unsubscribe listener and set online: false on unmount
    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (uid && db) {
        const userDocRef = doc(db, 'presence', uid);
        updateDoc(userDocRef, {
          online: false,
          lastSeen: serverTimestamp(),
        }).catch(() => {
          // Ignore unmount error
        });
      }
    };
  }, [uid, updateMyPresence]);

  const updateDisplayName = async (newName: string) => {
    setCustomDisplayName(newName);
    if (uid) {
      await updateMyPresence(true, newName);
    }
  };

  return {
    ...presenceState,
    customDisplayName,
    updateDisplayName,
    refreshPresence: () => updateMyPresence(true),
  };
}
