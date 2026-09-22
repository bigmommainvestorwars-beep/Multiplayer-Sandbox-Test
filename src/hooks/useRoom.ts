import { useState, useEffect, useCallback } from 'react';
import { 
  doc, 
  onSnapshot, 
  runTransaction, 
  serverTimestamp, 
  increment,
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
            counter: typeof data.counter === 'number' ? data.counter : 0,
            currentPlayerId: data.currentPlayerId || (Array.isArray(data.participantIds) && data.participantIds.length > 0 ? data.participantIds[0] : null),
            lastRoll: typeof data.lastRoll === 'number' ? data.lastRoll : null,
            lastRollPlayerId: data.lastRollPlayerId || null,
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

  // CREATE ROOM: Creates /sandbox/mainRoom with current UID as host, first participant, counter=0, currentPlayerId=uid
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
            counter: typeof existingData.counter === 'number' ? existingData.counter : 0,
            currentPlayerId: existingData.currentPlayerId || updatedParticipants[0] || uid,
          }, { merge: true });
        } else {
          transaction.set(roomDocRef, {
            roomId: 'mainRoom',
            createdAt: serverTimestamp(),
            hostId: uid,
            participantIds: [uid],
            counter: 0,
            currentPlayerId: uid,
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
          transaction.set(roomDocRef, {
            roomId: 'mainRoom',
            createdAt: serverTimestamp(),
            hostId: uid,
            participantIds: [uid],
            counter: 0,
            currentPlayerId: uid,
          });
        } else {
          const roomData = roomDoc.data();
          const currentParticipants: string[] = Array.isArray(roomData.participantIds)
            ? roomData.participantIds
            : [];

          const updatedParticipants = currentParticipants.includes(uid)
            ? currentParticipants
            : [...currentParticipants, uid];

          // If two players are connected and currentPlayerId is not set, the first participant becomes the initial currentPlayerId
          const activeCurrentPlayerId = roomData.currentPlayerId || updatedParticipants[0] || uid;

          transaction.update(roomDocRef, {
            participantIds: updatedParticipants,
            currentPlayerId: activeCurrentPlayerId,
          });
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

  // INCREMENT COUNTER: Atomic update directly in Firestore
  const incrementCounter = useCallback(async () => {
    if (!uid || !db) {
      setRoomState((prev) => ({
        ...prev,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Cannot increment counter without an authenticated Firebase UID.',
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
          // If room doesn't exist yet, create it with counter = 1
          transaction.set(roomDocRef, {
            roomId: 'mainRoom',
            createdAt: serverTimestamp(),
            hostId: uid,
            participantIds: [uid],
            counter: 1,
          });
        } else {
          const currentCounter = typeof roomDoc.data().counter === 'number' ? roomDoc.data().counter : 0;
          transaction.update(roomDocRef, {
            counter: currentCounter + 1,
          });
        }
      });
    } catch (err: unknown) {
      const firestoreErr = err as FirestoreError;
      console.error('[Increment Counter Transaction Error]:', firestoreErr);
      setRoomState((prev) => ({
        ...prev,
        error: {
          code: firestoreErr.code || 'INCREMENT_COUNTER_ERROR',
          message: firestoreErr.message || 'Transaction failed while incrementing counter.',
          raw: firestoreErr,
        },
      }));
    } finally {
      setRoomState((prev) => ({ ...prev, actionLoading: false }));
    }
  }, [uid]);

  // RESET COUNTER: Atomically sets counter back to 0 in Firestore
  const resetCounter = useCallback(async () => {
    if (!uid || !db) {
      setRoomState((prev) => ({
        ...prev,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Cannot reset counter without an authenticated Firebase UID.',
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
          transaction.set(roomDocRef, {
            roomId: 'mainRoom',
            createdAt: serverTimestamp(),
            hostId: uid,
            participantIds: [uid],
            counter: 0,
          });
        } else {
          transaction.update(roomDocRef, {
            counter: 0,
          });
        }
      });
    } catch (err: unknown) {
      const firestoreErr = err as FirestoreError;
      console.error('[Reset Counter Transaction Error]:', firestoreErr);
      setRoomState((prev) => ({
        ...prev,
        error: {
          code: firestoreErr.code || 'RESET_COUNTER_ERROR',
          message: firestoreErr.message || 'Transaction failed while resetting counter.',
          raw: firestoreErr,
        },
      }));
    } finally {
      setRoomState((prev) => ({ ...prev, actionLoading: false }));
    }
  }, [uid]);

  // END TURN: Atomically passes the active turn to the other connected participant in Firestore
  const endTurn = useCallback(async () => {
    if (!uid || !db) {
      setRoomState((prev) => ({
        ...prev,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Cannot end turn without an authenticated Firebase UID.',
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
          throw new Error('Room /sandbox/mainRoom does not exist.');
        }

        const roomData = roomDoc.data();
        const participants: string[] = Array.isArray(roomData.participantIds) 
          ? roomData.participantIds 
          : [];

        const currentTurnHolder = roomData.currentPlayerId || (participants.length > 0 ? participants[0] : null);

        if (currentTurnHolder !== uid) {
          throw new Error(`Only the active player with UID (${currentTurnHolder}) can end their turn.`);
        }

        const otherParticipants = participants.filter((pId) => pId !== uid);
        if (otherParticipants.length === 0) {
          throw new Error('No other connected player found in participantIds to pass the turn to.');
        }

        // Switch to next player (in 2-player mode, the other participant)
        const nextPlayerId = otherParticipants[0];

        transaction.update(roomDocRef, {
          currentPlayerId: nextPlayerId,
        });
      });
    } catch (err: unknown) {
      const firestoreErr = err as FirestoreError;
      console.error('[End Turn Transaction Error]:', firestoreErr);
      setRoomState((prev) => ({
        ...prev,
        error: {
          code: firestoreErr.code || 'END_TURN_ERROR',
          message: firestoreErr.message || 'Transaction failed while ending turn.',
          raw: firestoreErr,
        },
      }));
    } finally {
      setRoomState((prev) => ({ ...prev, actionLoading: false }));
    }
  }, [uid]);

  // ROLL DICE: Generates 1..6 and writes lastRoll and lastRollPlayerId to Firestore
  const rollDice = useCallback(async () => {
    if (!uid || !db) {
      setRoomState((prev) => ({
        ...prev,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Cannot roll dice without an authenticated Firebase UID.',
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
          throw new Error('Room /sandbox/mainRoom does not exist.');
        }

        const roomData = roomDoc.data();
        const participants: string[] = Array.isArray(roomData.participantIds) 
          ? roomData.participantIds 
          : [];

        const currentTurnHolder = roomData.currentPlayerId || (participants.length > 0 ? participants[0] : null);

        if (currentTurnHolder !== uid) {
          throw new Error(`Only the active player with UID (${currentTurnHolder}) can roll the dice.`);
        }

        // Generate a random integer from 1 through 6
        const diceResult = Math.floor(Math.random() * 6) + 1;

        transaction.update(roomDocRef, {
          lastRoll: diceResult,
          lastRollPlayerId: uid,
        });
      });
    } catch (err: unknown) {
      const firestoreErr = err as FirestoreError;
      console.error('[Roll Dice Transaction Error]:', firestoreErr);
      setRoomState((prev) => ({
        ...prev,
        error: {
          code: firestoreErr.code || 'ROLL_DICE_ERROR',
          message: firestoreErr.message || 'Transaction failed while rolling dice.',
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
    incrementCounter,
    resetCounter,
    endTurn,
    rollDice,
  };
}

