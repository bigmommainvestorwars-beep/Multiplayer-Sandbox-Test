import React, { useState } from 'react';
import { 
  Users, 
  Circle, 
  Copy, 
  Check, 
  AlertTriangle, 
  RefreshCw, 
  Edit3, 
  CheckCheck, 
  Radio, 
  Database,
  Clock,
  Laptop
} from 'lucide-react';
import type { PresencePlayer, PresenceState } from '../types';

interface ConnectedPlayersProps {
  currentUid: string | null;
  presenceState: PresenceState & {
    customDisplayName: string;
    updateDisplayName: (name: string) => Promise<void>;
    refreshPresence: () => Promise<void>;
  };
}

export const ConnectedPlayers: React.FC<ConnectedPlayersProps> = ({
  currentUid,
  presenceState,
}) => {
  const [copiedUid, setCopiedUid] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(presenceState.customDisplayName || '');
  const [isSavingName, setIsSavingName] = useState(false);

  const handleCopy = (uid: string) => {
    navigator.clipboard.writeText(uid);
    setCopiedUid(uid);
    setTimeout(() => setCopiedUid(null), 2000);
  };

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setIsSavingName(true);
    try {
      await presenceState.updateDisplayName(nameInput.trim());
      setEditingName(false);
    } finally {
      setIsSavingName(false);
    }
  };

  const formatLastSeen = (lastSeen: PresencePlayer['lastSeen']) => {
    if (!lastSeen) return 'Just now';
    if ('seconds' in lastSeen && typeof lastSeen.seconds === 'number') {
      const date = new Date(lastSeen.seconds * 1000);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    return 'Active';
  };

  return (
    <section id="connected-players-section" className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight text-white uppercase">
                CONNECTED PLAYERS
              </h2>
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                Live onSnapshot ({presenceState.players.length})
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Firestore Collection: <span className="text-zinc-300">/presence/{'{uid}'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="refresh-presence-btn"
            onClick={() => presenceState.refreshPresence()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors border border-zinc-700"
            title="Update presence timestamp"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Ping Presence
          </button>
        </div>
      </div>

      {/* Firestore Error Alert */}
      {presenceState.error && (
        <div id="firestore-presence-error" className="bg-rose-950/40 border border-rose-800 rounded-xl p-4 text-rose-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300">Firestore Presence Error</h4>
                {presenceState.error.code && (
                  <code className="text-xs px-2 py-0.5 rounded bg-rose-900/60 font-mono text-rose-200">
                    {presenceState.error.code}
                  </code>
                )}
              </div>
              <p className="text-xs font-mono text-rose-300/90 break-all">
                {presenceState.error.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current User Device Name Setting */}
      {currentUid && (
        <div id="current-device-bar" className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Laptop className="w-4 h-4 text-blue-400 shrink-0" />
            <span className="text-zinc-400">Your Device Identity:</span>
            <code className="font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
              {currentUid}
            </code>
          </div>

          <div className="flex items-center gap-2">
            {editingName ? (
              <form onSubmit={handleSaveName} className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Display Name"
                  className="bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                  maxLength={24}
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isSavingName}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-xs transition-colors"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingName(false)}
                  className="px-2 py-1 text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button
                onClick={() => {
                  setNameInput(presenceState.customDisplayName || `Player ${currentUid.slice(0, 6)}`);
                  setEditingName(true);
                }}
                className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Display Name</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Players List Grid */}
      <div id="players-list" className="space-y-3">
        {presenceState.loading && presenceState.players.length === 0 ? (
          <div className="p-8 text-center bg-zinc-950/60 rounded-xl border border-zinc-800/50">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent mb-2"></div>
            <p className="text-xs text-zinc-400 font-mono">Listening for connected players via Firestore onSnapshot...</p>
          </div>
        ) : presenceState.players.length === 0 ? (
          <div className="p-8 text-center bg-zinc-950/60 rounded-xl border border-zinc-800/50">
            <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-zinc-300">No players detected yet</p>
            <p className="text-xs text-zinc-500 mt-1">
              Ensure authentication completes so this device can write its presence to Firestore.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {presenceState.players.map((player, index) => {
              const isCurrentPlayer = player.uid === currentUid;
              const playerNumber = index + 1;

              return (
                <div
                  key={player.uid}
                  id={`player-card-${player.uid}`}
                  className={`border rounded-xl p-4 transition-all ${
                    isCurrentPlayer 
                      ? 'bg-zinc-900/90 border-emerald-500/40 ring-1 ring-emerald-500/20' 
                      : 'bg-zinc-950/70 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    
                    {/* Player Title & Online Indicator */}
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isCurrentPlayer ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                        }`}>
                          P{playerNumber}
                        </div>
                        <span 
                          className="absolute -bottom-0.5 -right-0.5 block w-3 h-3 rounded-full border-2 border-zinc-900 bg-emerald-500" 
                          title="Online"
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white tracking-wide">
                            Player {playerNumber}: {player.displayName}
                          </span>
                          {isCurrentPlayer && (
                            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                              You (This Device)
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                            <Circle className="w-2 h-2 fill-emerald-400 text-emerald-400" />
                            Online
                          </span>
                        </div>

                        {/* Real Firebase UID Row */}
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs text-zinc-400 font-mono">UID:</span>
                          <code className="text-xs font-mono font-semibold text-emerald-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 break-all select-all">
                            {player.uid}
                          </code>
                        </div>
                      </div>
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex items-center gap-3 self-end md:self-center">
                      <div className="text-right hidden sm:block">
                        <div className="text-[11px] text-zinc-400 flex items-center gap-1 justify-end font-mono">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          Last seen: {formatLastSeen(player.lastSeen)}
                        </div>
                      </div>

                      <button
                        id={`copy-btn-${player.uid}`}
                        onClick={() => handleCopy(player.uid)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition-colors border border-zinc-700 shrink-0"
                        title="Copy Firebase UID"
                      >
                        {copiedUid === player.uid ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[11px] text-emerald-300">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-zinc-400" />
                            <span className="text-[11px]">Copy UID</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Real-time Architecture Notice */}
      <div id="presence-realtime-notice" className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3 text-xs text-zinc-400 flex items-center justify-between font-mono">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-amber-400" />
          <span>Real-time listener: <span className="text-emerald-400">Active (Firestore onSnapshot)</span></span>
        </div>
        <div className="text-zinc-500 text-[11px]">
          Multi-device test: Open in another window/device to see both UIDs live
        </div>
      </div>
    </section>
  );
};
