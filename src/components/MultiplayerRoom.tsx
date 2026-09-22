import React, { useState } from 'react';
import { 
  DoorOpen, 
  Crown, 
  Users, 
  PlusCircle, 
  LogIn, 
  Copy, 
  Check, 
  AlertTriangle, 
  Loader2, 
  Radio, 
  Clock, 
  ShieldAlert,
  FolderSync,
  Plus,
  RotateCcw,
  Sparkles,
  ArrowRightCircle,
  Shield,
  Hourglass,
  CheckCircle2,
  Dices
} from 'lucide-react';
import type { SandboxRoom, RoomState, PresencePlayer } from '../types';

interface MultiplayerRoomProps {
  currentUid: string | null;
  roomState: RoomState & {
    createRoom: () => Promise<void>;
    joinRoom: () => Promise<void>;
    incrementCounter: () => Promise<void>;
    resetCounter: () => Promise<void>;
    endTurn: () => Promise<void>;
    rollDice: () => Promise<void>;
  };
  presencePlayers: PresencePlayer[];
}

export const MultiplayerRoom: React.FC<MultiplayerRoomProps> = ({
  currentUid,
  roomState,
  presencePlayers,
}) => {
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUid(text);
    setTimeout(() => setCopiedUid(null), 2000);
  };

  const { room, loading, actionLoading, error } = roomState;

  const isCurrentPlayerHost = Boolean(currentUid && room?.hostId === currentUid);
  const isCurrentPlayerInRoom = Boolean(currentUid && room?.participantIds?.includes(currentUid));

  // Turn state calculations
  const participants = room?.participantIds || [];
  const activeCurrentPlayerUid = room?.currentPlayerId || (participants.length > 0 ? participants[0] : null);
  const isMyTurn = Boolean(currentUid && activeCurrentPlayerUid && currentUid === activeCurrentPlayerUid);
  const hasTwoPlayers = participants.length >= 2;

  // Dice state calculations
  const lastRollValue = typeof room?.lastRoll === 'number' ? room.lastRoll : null;
  const lastRollPlayerUid = room?.lastRollPlayerId || null;
  const canIRoll = Boolean(currentUid && activeCurrentPlayerUid && currentUid === activeCurrentPlayerUid && room);

  const getRoomStatusLabel = () => {
    if (loading) return { text: 'Loading Room...', color: 'text-zinc-400', bg: 'bg-zinc-800' };
    if (!room) return { text: 'Room Not Created', color: 'text-amber-400', bg: 'bg-amber-950/80 border-amber-800' };
    if (room.participantIds.length === 0) return { text: 'Empty Room', color: 'text-zinc-400', bg: 'bg-zinc-800' };
    return { 
      text: `Active (${room.participantIds.length} Participant${room.participantIds.length > 1 ? 's' : ''})`, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-950/80 border-emerald-800' 
    };
  };

  const formatCreatedAt = (createdAt: SandboxRoom['createdAt']) => {
    if (!createdAt) return 'Pending timestamp';
    if ('seconds' in createdAt && typeof createdAt.seconds === 'number') {
      const date = new Date(createdAt.seconds * 1000);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    return 'Active';
  };

  const statusInfo = getRoomStatusLabel();
  const counterValue = typeof room?.counter === 'number' ? room.counter : 0;

  return (
    <section id="multiplayer-room-section" className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
      
      {/* Room Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <DoorOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-white uppercase">
                MULTIPLAYER ROOM: /sandbox/mainRoom
              </h2>
              <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full border font-mono ${statusInfo.bg} ${statusInfo.color}`}>
                <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                Live onSnapshot
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Firestore Doc Path: <span className="text-purple-300">/sandbox/mainRoom</span>
            </p>
          </div>
        </div>

        {/* Action Buttons: CREATE ROOM / JOIN ROOM */}
        <div className="flex items-center gap-2.5">
          <button
            id="create-room-btn"
            onClick={() => roomState.createRoom()}
            disabled={actionLoading || !currentUid}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white shadow-md transition-colors cursor-pointer border border-purple-400/30"
          >
            {actionLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <PlusCircle className="w-3.5 h-3.5" />
            )}
            CREATE ROOM
          </button>

          <button
            id="join-room-btn"
            onClick={() => roomState.joinRoom()}
            disabled={actionLoading || !currentUid || isCurrentPlayerInRoom}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors border shadow-md cursor-pointer ${
              isCurrentPlayerInRoom
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800 opacity-90'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-zinc-700 disabled:opacity-50'
            }`}
          >
            {actionLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isCurrentPlayerInRoom ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <LogIn className="w-3.5 h-3.5 text-purple-400" />
            )}
            {isCurrentPlayerInRoom ? 'ALREADY IN ROOM' : 'JOIN ROOM'}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div id="room-error-banner" className="bg-rose-950/40 border border-rose-800 rounded-xl p-4 text-rose-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300">Room Transaction Error</h4>
                {error.code && (
                  <code className="text-xs px-2 py-0.5 rounded bg-rose-900/60 font-mono text-rose-200">
                    {error.code}
                  </code>
                )}
              </div>
              <p className="text-xs font-mono text-rose-300/90 break-all">
                {error.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FIRESTORE SYNCHRONIZATION TEST: SHARED COUNTER */}
      <div id="firestore-sync-test-panel" className="bg-gradient-to-br from-purple-950/40 to-zinc-950 border-2 border-purple-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-purple-500/20 text-purple-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold tracking-wider uppercase text-purple-200 font-mono">
                FIRESTORE REAL-TIME SYNCHRONIZATION TEST
              </h3>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Direct live binding from Firestore <code className="text-purple-300">/sandbox/mainRoom.counter</code> via <code className="text-emerald-300">onSnapshot</code>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Single Source of Truth: Firestore
            </span>
          </div>
        </div>

        {/* Counter Big Display and Action Buttons */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-2">
          
          <div className="flex items-center gap-5">
            <div className="text-center sm:text-left">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                Live Document Value
              </span>
              <div id="shared-counter-display" className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white flex items-center gap-3">
                <span className="text-purple-400">SHARED COUNTER:</span>
                <span className="text-emerald-400 bg-zinc-950 px-4 py-1.5 rounded-xl border border-zinc-800 shadow-inner">
                  {counterValue}
                </span>
              </div>
            </div>
          </div>

          {/* Buttons: +1 & RESET */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              id="increment-counter-btn"
              onClick={() => roomState.incrementCounter()}
              disabled={actionLoading || !currentUid}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 text-white shadow-lg transition-all cursor-pointer border border-emerald-400/40"
              title="Atomically increments counter in Firestore /sandbox/mainRoom"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-5 h-5 stroke-[3]" />
              )}
              <span>+1</span>
            </button>

            <button
              id="reset-counter-btn"
              onClick={() => roomState.resetCounter()}
              disabled={actionLoading || !currentUid}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 active:scale-95 disabled:opacity-50 text-zinc-200 shadow transition-all cursor-pointer border border-zinc-700"
              title="Resets Firestore counter in /sandbox/mainRoom to 0"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4 text-zinc-400" />
              )}
              <span>RESET</span>
            </button>
          </div>

        </div>

        <div className="text-[11px] font-mono text-zinc-400 flex flex-wrap items-center justify-between gap-2 border-t border-purple-500/10 pt-3">
          <span>• Atomic update: <strong className="text-purple-300">runTransaction()</strong></span>
          <span>• Client state is purely read from <strong className="text-emerald-300">onSnapshot()</strong></span>
          <span>• No local optimistic state or localStorage used</span>
        </div>
      </div>

      {/* TWO-PLAYER TURN SYNCHRONIZATION TEST PANEL */}
      <div id="turn-synchronization-test-panel" className="bg-gradient-to-br from-indigo-950/40 via-zinc-900 to-zinc-950 border-2 border-indigo-500/40 rounded-2xl p-6 shadow-2xl space-y-5">
        
        {/* Turn Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-500/20 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-indigo-500/20 text-indigo-400">
                <ArrowRightCircle className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold tracking-wider uppercase text-indigo-200 font-mono">
                TWO-PLAYER TURN SYNCHRONIZATION TEST
              </h3>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Live turn state authoritative in Firestore <code className="text-indigo-300">/sandbox/mainRoom.currentPlayerId</code>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800">
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
              Authoritative Firestore Turns
            </span>
          </div>
        </div>

        {/* Turn Status Banner & End Turn Action */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-center">
          
          {/* Visual Turn Banner: YOUR TURN vs WAITING FOR OTHER PLAYER */}
          <div className="lg:col-span-2">
            {isMyTurn ? (
              <div 
                id="turn-banner-your-turn" 
                className="bg-emerald-950/70 border-2 border-emerald-500/80 rounded-2xl p-5 shadow-lg flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
                    <CheckCircle2 className="w-7 h-7 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-emerald-400 block">
                      Active Player Status
                    </span>
                    <h4 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                      YOUR TURN
                    </h4>
                    <p className="text-xs text-emerald-200/90 font-mono mt-0.5">
                      Your Firebase UID matches <code className="text-emerald-300 font-bold">currentPlayerId</code> in Firestore.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div 
                id="turn-banner-waiting" 
                className="bg-amber-950/50 border-2 border-amber-600/60 rounded-2xl p-5 shadow-lg flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
                    <Hourglass className="w-7 h-7 animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono font-bold tracking-widest uppercase text-amber-400 block">
                      Active Player Status
                    </span>
                    <h4 className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                      WAITING FOR OTHER PLAYER
                    </h4>
                    <p className="text-xs text-amber-200/90 font-mono mt-0.5">
                      Waiting for <code className="text-amber-300 font-bold">{activeCurrentPlayerUid ? `Player (${activeCurrentPlayerUid.slice(0, 8)}...)` : 'another player'}</code> to take action and press End Turn.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* END TURN Button */}
          <div className="flex flex-col gap-2">
            <button
              id="end-turn-btn"
              onClick={() => roomState.endTurn()}
              disabled={!isMyTurn || actionLoading || !hasTwoPlayers}
              className={`w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl text-sm font-bold tracking-wider font-mono transition-all cursor-pointer shadow-xl ${
                isMyTurn && hasTwoPlayers
                  ? 'bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white border-2 border-indigo-400/50 hover:shadow-indigo-500/20'
                  : 'bg-zinc-800/80 text-zinc-500 border border-zinc-700/60 cursor-not-allowed opacity-60'
              }`}
              title={
                !hasTwoPlayers
                  ? 'Requires at least 2 connected players in /sandbox/mainRoom'
                  : !isMyTurn
                  ? 'Only the active player holding the turn can press END TURN'
                  : 'Atomically passes currentPlayerId to the other participant in Firestore'
              }
            >
              {actionLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowRightCircle className="w-5 h-5" />
              )}
              <span>END TURN</span>
            </button>

            {!hasTwoPlayers && (
              <p className="text-[11px] font-mono text-zinc-400 text-center">
                Requires 2 players in room to toggle turns.
              </p>
            )}
          </div>

        </div>

        {/* Required Diagnostics Panel */}
        <div id="turn-diagnostics-grid" className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              Turn Synchronization Diagnostics
            </span>
            <span className="text-[10px] text-zinc-500">Atomic Firestore State</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            
            {/* My UID */}
            <div id="diag-my-uid" className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-zinc-400 block">
                My UID:
              </span>
              <span className="font-semibold text-emerald-400 break-all select-all block">
                {currentUid || 'null (Unauthenticated)'}
              </span>
            </div>

            {/* Current Player UID */}
            <div id="diag-current-player-uid" className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-zinc-400 block">
                Current Player UID:
              </span>
              <span className="font-semibold text-amber-300 break-all select-all block">
                {activeCurrentPlayerUid || 'None (No active player)'}
              </span>
            </div>

            {/* Is My Turn */}
            <div id="diag-is-my-turn" className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-zinc-400 block">
                Is My Turn:
              </span>
              <div className="flex items-center gap-2 pt-0.5">
                <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                  isMyTurn 
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' 
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}>
                  {isMyTurn ? 'True' : 'False'}
                </span>
                <span className="text-[11px] text-zinc-500">
                  {isMyTurn ? '(Active Turn)' : '(Waiting)'}
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* SYNCHRONIZED DICE TEST PANEL */}
      <div id="synchronized-dice-test-panel" className="bg-gradient-to-br from-amber-950/40 via-zinc-900 to-zinc-950 border-2 border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-5">
        
        {/* Dice Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-amber-500/20 text-amber-400">
                <Dices className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-bold tracking-wider uppercase text-amber-200 font-mono">
                SYNCHRONIZED DICE TEST
              </h3>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Synchronized roll stored in Firestore <code className="text-amber-300">/sandbox/mainRoom (lastRoll, lastRollPlayerId)</code>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-amber-950/80 text-amber-300 border border-amber-800">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              Firestore Authoritative Roll
            </span>
          </div>
        </div>

        {/* Dice Roll Display & Roll Button */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 py-2">
          
          {/* Visual Roll Result: LAST ROLL: X & ROLLED BY: UID */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full lg:w-auto">
            <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex items-center gap-4 shadow-inner min-w-[200px]">
              <div className="w-14 h-14 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0 font-mono text-2xl font-black">
                {lastRollValue !== null ? lastRollValue : '-'}
              </div>
              <div>
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                  Snapshot Result
                </span>
                <div id="last-roll-display" className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white flex items-center gap-2">
                  <span className="text-amber-400">LAST ROLL:</span>
                  <span className="text-emerald-400">
                    {lastRollValue !== null ? lastRollValue : 'None'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                Last Roll Origin
              </span>
              <div id="rolled-by-display" className="text-sm font-mono font-bold text-zinc-200 flex flex-wrap items-center gap-1.5">
                <span className="text-amber-300">ROLLED BY:</span>
                <span className="text-zinc-300 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 break-all select-all font-mono">
                  {lastRollPlayerUid || 'None (No rolls yet)'}
                </span>
              </div>
            </div>
          </div>

          {/* ROLL DICE Button */}
          <div className="w-full sm:w-auto flex flex-col items-center sm:items-end gap-2">
            <button
              id="roll-dice-btn"
              onClick={() => roomState.rollDice()}
              disabled={!canIRoll || actionLoading}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-base font-black tracking-wider font-mono transition-all cursor-pointer shadow-xl ${
                canIRoll
                  ? 'bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 border-2 border-amber-300 hover:shadow-amber-500/30'
                  : 'bg-zinc-800/80 text-zinc-500 border border-zinc-700/60 cursor-not-allowed opacity-60'
              }`}
              title={
                !canIRoll
                  ? 'Only the active player whose UID matches currentPlayerId can roll the dice'
                  : 'Generates 1-6 and updates lastRoll & lastRollPlayerId in Firestore'
              }
            >
              {actionLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Dices className="w-6 h-6 stroke-[2.5]" />
              )}
              <span>ROLL DICE</span>
            </button>

            {!canIRoll && (
              <p className="text-[11px] font-mono text-zinc-400 text-center sm:text-right">
                {isMyTurn ? 'Room not loaded' : 'Waiting for current player to roll'}
              </p>
            )}
          </div>

        </div>

        {/* Required Diagnostics Display for Synchronized Dice Test */}
        <div id="dice-diagnostics-grid" className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-3 font-mono">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              Dice Synchronization Diagnostics
            </span>
            <span className="text-[10px] text-zinc-500">Authoritative Firestore Snapshot</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
            
            {/* 1. My UID */}
            <div id="dice-diag-my-uid" className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-zinc-400 block">
                My UID
              </span>
              <span className="font-semibold text-emerald-400 break-all select-all block">
                {currentUid || 'null'}
              </span>
            </div>

            {/* 2. Current Player */}
            <div id="dice-diag-current-player" className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-zinc-400 block">
                Current Player
              </span>
              <span className="font-semibold text-amber-300 break-all select-all block">
                {activeCurrentPlayerUid || 'None'}
              </span>
            </div>

            {/* 3. Last Roll */}
            <div id="dice-diag-last-roll" className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-zinc-400 block">
                Last Roll
              </span>
              <span className="font-bold text-white text-base block">
                {lastRollValue !== null ? lastRollValue : 'None'}
              </span>
            </div>

            {/* 4. Last Roll Player */}
            <div id="dice-diag-last-roll-player" className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-zinc-400 block">
                Last Roll Player
              </span>
              <span className="font-semibold text-purple-300 break-all select-all block">
                {lastRollPlayerUid || 'None'}
              </span>
            </div>

            {/* 5. Can I Roll? */}
            <div id="dice-diag-can-i-roll" className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 space-y-1">
              <span className="text-[10px] uppercase font-semibold text-zinc-400 block">
                Can I Roll?
              </span>
              <div className="flex items-center gap-2 pt-0.5">
                <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                  canIRoll 
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' 
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                }`}>
                  {canIRoll ? 'True' : 'False'}
                </span>
                <span className="text-[10px] text-zinc-500">
                  {canIRoll ? '(Authorized)' : '(Locked)'}
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* 3 Core Fields: ROOM STATUS, HOST, CONNECTED PLAYERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Field 1: ROOM STATUS */}
        <div id="card-room-status" className="bg-zinc-950 border border-zinc-800/90 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-mono">
              <FolderSync className="w-4 h-4 text-purple-400" />
              ROOM STATUS
            </span>
            <span className="text-[11px] font-mono text-zinc-500">
              ID: {room ? room.roomId : 'None'}
            </span>
          </div>
          
          <div className="pt-1">
            <p className="text-xl font-bold text-white tracking-tight">
              {room ? 'Created & Active' : 'Not Created'}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-zinc-400 font-mono">
              <span>Path: <code className="text-purple-300">/sandbox/mainRoom</code></span>
              {room && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-500" />
                    Created: {formatCreatedAt(room.createdAt)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Field 2: HOST */}
        <div id="card-room-host" className="bg-zinc-950 border border-zinc-800/90 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-mono">
              <Crown className="w-4 h-4 text-amber-400" />
              HOST (Firebase UID)
            </span>
            {isCurrentPlayerHost && (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                You Are Host
              </span>
            )}
          </div>

          <div className="pt-1">
            {room?.hostId ? (
              <div className="flex items-center justify-between gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-2.5">
                <code className="text-xs font-mono font-semibold text-amber-300 break-all select-all">
                  {room.hostId}
                </code>
                <button
                  id="copy-host-uid-btn"
                  onClick={() => handleCopy(room.hostId)}
                  className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors shrink-0"
                  title="Copy Host UID"
                >
                  {copiedUid === room.hostId ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ) : (
              <p className="text-sm font-mono text-zinc-500 pt-1">
                No host assigned (Room has not been created yet)
              </p>
            )}
          </div>
        </div>

        {/* Field 3: CONNECTED PLAYERS (participantIds) */}
        <div id="card-room-participants" className="bg-zinc-950 border border-zinc-800/90 rounded-xl p-4 space-y-3 md:col-span-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 font-mono">
              <Users className="w-4 h-4 text-emerald-400" />
              CONNECTED PLAYERS IN ROOM (participantIds)
            </span>
            <span className="text-xs font-mono text-zinc-400">
              Total: <strong className="text-white">{room?.participantIds?.length || 0}</strong>
            </span>
          </div>

          {!room ? (
            <div className="p-6 text-center bg-zinc-900/60 rounded-lg border border-zinc-800/50">
              <p className="text-xs font-mono text-zinc-400">
                Click <strong>CREATE ROOM</strong> or <strong>JOIN ROOM</strong> to initialize /sandbox/mainRoom.
              </p>
            </div>
          ) : room.participantIds.length === 0 ? (
            <div className="p-6 text-center bg-zinc-900/60 rounded-lg border border-zinc-800/50">
              <p className="text-xs font-mono text-zinc-400">No participants currently registered in this room.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {room.participantIds.map((participantUid, idx) => {
                const isYou = participantUid === currentUid;
                const isHost = participantUid === room.hostId;
                const presenceData = presencePlayers.find((p) => p.uid === participantUid);

                return (
                  <div
                    key={participantUid}
                    id={`room-participant-${participantUid}`}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                      isYou 
                        ? 'bg-purple-950/30 border-purple-500/40 ring-1 ring-purple-500/20' 
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                        isHost 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                          : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                      }`}>
                        {isHost ? '★' : `P${idx + 1}`}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white font-mono">
                            Player {idx + 1}: {presenceData?.displayName || `Player ${participantUid.slice(0, 6)}`}
                          </span>

                          {isHost && (
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                              Host
                            </span>
                          )}

                          {isYou && (
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                              You
                            </span>
                          )}
                        </div>

                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className="text-[11px] text-zinc-500 font-mono">UID:</span>
                          <code className="text-xs font-mono font-semibold text-emerald-400 break-all select-all">
                            {participantUid}
                          </code>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        id={`copy-participant-${participantUid}`}
                        onClick={() => handleCopy(participantUid)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-300 transition-colors border border-zinc-700 shrink-0 font-mono"
                        title="Copy UID"
                      >
                        {copiedUid === participantUid ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-zinc-400" />
                            <span>Copy UID</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

      </div>

      {/* Transaction & Synchronization Guarantee Notice */}
      <div id="room-sync-footer-notice" className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3 text-xs text-zinc-400 flex items-center justify-between font-mono">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
          <span>Atomic update guarantee: <span className="text-purple-300">Firestore Transactions (runTransaction)</span></span>
        </div>
        <div className="text-zinc-500 text-[11px]">
          Both devices update automatically in real time via onSnapshot
        </div>
      </div>

    </section>
  );
};

