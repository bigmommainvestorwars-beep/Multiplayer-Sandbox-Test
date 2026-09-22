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
  FolderSync
} from 'lucide-react';
import type { SandboxRoom, RoomState, PresencePlayer } from '../types';

interface MultiplayerRoomProps {
  currentUid: string | null;
  roomState: RoomState & {
    createRoom: () => Promise<void>;
    joinRoom: () => Promise<void>;
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

      {/* 3 Core Fields Required: ROOM STATUS, HOST, CONNECTED PLAYERS */}
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
