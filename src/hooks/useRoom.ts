import { useState, useEffect, useCallback } from 'react';
import { 
  doc, 
  onSnapshot, 
  runTransaction, 
  serverTimestamp, 
  FirestoreError 
} from 'firebase/firestore';
import { db } from '../firebase';
import type { SandboxRoom, RoomState } from '../types';

export function useRoom(uid: string | null) {
  const [roomState, setRoomState] = useState<RoomState>({
    room: null,
    loading: true,
    actionLoading: false,
    error: null,
    listenerActive: false,
  });

  // Subscribe to /sandbox/mainRoom with onSnapshot in real-time
  useEffect(() => {
    if (!db) {
      setRoomState((prev) => ({
        ...prev,
        loading: false,
        listenerActive: false,
      }));
      return;
    }

    const roomDocRef = doc(db, 'sandbox', 'mainRoom');

    const unsubscribe = onSnapshot(
      roomDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const roomData: SandboxRoom = {
            roomId: data.roomId || 'mainRoom',
            createdAt: data.createdAt || null,
            hostId: data.hostId || '',
            participantIds: Array.isArray(data.participantIds) ? data.participantIds : [],
          };

          setRoomState((prev) => ({
            ...prev,
            room: roomData,
            loading: false,
            error: null,
            listenerActive: true,
          }));
        } else {
          setRoomState((prev) => ({
            ...prev,
            room: null,
            loading: false,
            error: null,
            listenerActive: true,
          }));
        }
      },
      (err: FirestoreError) => {
        console.error('[Firestore onSnapshot /sandbox/mainRoom Error]:', err);
        setRoomState((prev) => ({
          ...prev,
          loading: false,
          listenerActive: false,
          error: {
            code: err.code || 'ROOM_LISTENER_ERROR',
            message: err.message || 'Failed to subscribe to /sandbox/mainRoom listener.',
            raw: err,
          },
        }));
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // CREATE ROOM: Creates /sandbox/mainRoom with current UID as host and first participant
  const createRoom = useCallback(async () => {
    if (!uid || !db) {
      setRoomState((prev) => ({
        ...prev,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Cannot create room without an authenticated Firebase UID.',
        },
      }));
      return;
    }

    setRoomState((prev) => ({ ...prev, actionLoading: true, error: null }));

    try {
      const roomDocRef = doc(db, 'sandbox', 'mainRoom');
      
      await runTransaction(db, async (transaction) => {
        const roomDoc = await transaction.get(roomDocRef);
        
        if (roomDoc.exists()) {
          // If room exists, recreate/assign host and ensure current UID is first participant
          const existingData = roomDoc.data();
          const existingParticipants: string[] = Array.isArray(existingData.participantIds) 
            ? existingData.participantIds 
            : [];
          
          const updatedParticipants = Array.from(new Set([uid, ...existingParticipants]));

          transaction.set(roomDocRef, {
            roomId: 'mainRoom',
            createdAt: existingData.createdAt || serverTimestamp(),
            hostId: uid,
            participantIds: updatedParticipants,
          }, { merge: true });
        } else {
          // Create fresh room document
          transaction.set(roomDocRef, {
            roomId: 'mainRoom',
            createdAt: serverTimestamp(),
            hostId: uid,
            participantIds: [uid],
          });
        }
      });
    } catch (err: unknown) {
      const firestoreErr = err as FirestoreError;
      console.error('[Create Room Transaction Error]:', firestoreErr);
      setRoomState((prev) => ({
        ...prev,
        error: {
          code: firestoreErr.code || 'CREATE_ROOM_ERROR',
          message: firestoreErr.message || 'Transaction failed while creating /sandbox/mainRoom.',
          raw: firestoreErr,
        },
      }));
    } finally {
      setRoomState((prev) => ({ ...prev, actionLoading: false }));
    }
  }, [uid]);

  // JOIN ROOM: Uses a Firestore transaction to safely append current UID to participantIds
  const joinRoom = useCallback(async () => {
    if (!uid || !db) {
      setRoomState((prev) => ({
        ...prev,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Cannot join room without an authenticated Firebase UID.',
        },
      }));
      return;
    }

    setRoomState((prev) => ({ ...prev, actionLoading: true, error: null }));

    try {
      const roomDocRef = doc(db, 'sandbox', 'mainRoom');

      await runTransaction(db, async (transaction) => {
        const roomDoc = await transaction.get(roomDocRef);

        if (!roomDoc.exists()) {
          // If room doesn't exist yet, auto-create it with current UID as host and participant
          transaction.set(roomDocRef, {
            roomId: 'mainRoom',
            createdAt: serverTimestamp(),
            hostId: uid,
            participantIds: [uid],
          });
        } else {
          const roomData = roomDoc.data();
          const currentParticipants: string[] = Array.isArray(roomData.participantIds)
            ? roomData.participantIds
            : [];

          if (!currentParticipants.includes(uid)) {
            const updatedParticipants = [...currentParticipants, uid];
            transaction.update(roomDocRef, {
              participantIds: updatedParticipants,
            });
          }
        }
      });
    } catch (err: unknown) {
      const firestoreErr = err as FirestoreError;
      console.error('[Join Room Transaction Error]:', firestoreErr);
      setRoomState((prev) => ({
        ...prev,
        error: {
          code: firestoreErr.code || 'JOIN_ROOM_ERROR',
          message: firestoreErr.message || 'Transaction failed while joining /sandbox/mainRoom.',
          raw: firestoreErr,
        },
      }));
    } finally {
      setRoomState((prev) => ({ ...prev, actionLoading: false }));
    }
  }, [uid]);

  return {
    ...roomState,
    createRoom,
    joinRoom,
  };
}
