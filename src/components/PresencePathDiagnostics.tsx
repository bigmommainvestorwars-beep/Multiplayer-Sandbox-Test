import React from 'react';
import { Terminal, Shield, FolderSync, AlertCircle, CheckCircle } from 'lucide-react';
import type { AuthState, PresenceState } from '../types';

interface PresencePathDiagnosticsProps {
  authState: AuthState;
  presenceState: PresenceState;
}

export const PresencePathDiagnostics: React.FC<PresencePathDiagnosticsProps> = ({
  authState,
  presenceState,
}) => {
  const currentUid = authState.uid;
  const writePath = currentUid ? `/presence/${currentUid}` : '(waiting for auth.currentUser.uid)';
  const listenPath = '/presence';

  const activeError = presenceState.error || authState.error;
  const errorCode = activeError?.code ?? 'null';
  const errorMessage = activeError?.message ?? 'null';

  return (
    <div id="presence-path-diagnostics-panel" className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
              Firestore Presence Path &amp; Error Diagnostic Panel
            </h3>
            <p className="text-xs text-zinc-400">
              Exact paths and error states for Firestore presence write and listener
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeError ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-800">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              Error Detected
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              Paths Operational
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 font-mono text-xs">
        
        {/* auth.currentUser.uid */}
        <div id="diag-auth-uid" className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3.5 space-y-1 md:col-span-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              auth.currentUser.uid
            </span>
            <span className="text-[10px] text-zinc-500">Firebase Auth Identity</span>
          </div>
          <div className="pt-0.5">
            <span className={`text-xs sm:text-sm font-semibold break-all select-all ${
              currentUid ? 'text-emerald-400' : 'text-zinc-500 italic'
            }`}>
              {currentUid || 'null (Not Authenticated)'}
            </span>
          </div>
        </div>

        {/* writePath */}
        <div id="diag-write-path" className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
              <FolderSync className="w-3.5 h-3.5 text-orange-400" />
              writePath
            </span>
            <span className="text-[10px] text-zinc-500">Firestore Document</span>
          </div>
          <div className="pt-0.5">
            <span className="text-xs sm:text-sm font-semibold text-amber-300 break-all select-all">
              {writePath}
            </span>
          </div>
        </div>

        {/* listenPath */}
        <div id="diag-listen-path" className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
              <FolderSync className="w-3.5 h-3.5 text-emerald-400" />
              listenPath
            </span>
            <span className="text-[10px] text-zinc-500">Firestore Collection</span>
          </div>
          <div className="pt-0.5">
            <span className="text-xs sm:text-sm font-semibold text-emerald-300 break-all select-all">
              {listenPath}
            </span>
          </div>
        </div>

        {/* error.code */}
        <div id="diag-error-code" className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              error.code
            </span>
            <span className="text-[10px] text-zinc-500">Error Identification</span>
          </div>
          <div className="pt-0.5">
            <span className={`text-xs sm:text-sm font-semibold break-all ${
              activeError?.code ? 'text-rose-400' : 'text-zinc-500'
            }`}>
              {errorCode}
            </span>
          </div>
        </div>

        {/* error.message */}
        <div id="diag-error-message" className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              error.message
            </span>
            <span className="text-[10px] text-zinc-500">Error Details</span>
          </div>
          <div className="pt-0.5">
            <span className={`text-xs sm:text-sm break-all ${
              activeError?.message ? 'text-rose-300' : 'text-zinc-500'
            }`}>
              {errorMessage}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
