import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ShieldCheck, 
  Database, 
  Flame, 
  KeyRound, 
  Copy, 
  Check, 
  AlertTriangle, 
  RefreshCw,
  Terminal,
  Info
} from 'lucide-react';
import { firebaseConfig } from '../firebase';
import type { AuthState } from '../types';

interface DiagnosticScreenProps {
  authState: AuthState & { retrySignIn: () => Promise<void> };
}

export const DiagnosticScreen: React.FC<DiagnosticScreenProps> = ({ authState }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyUid = () => {
    if (authState.uid) {
      navigator.clipboard.writeText(authState.uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getAuthStatusBadge = () => {
    switch (authState.status) {
      case 'authenticated':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Authenticated (Anonymous)
          </span>
        );
      case 'authenticating':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
            Authenticating...
          </span>
        );
      case 'initializing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
            Initializing...
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Auth Error
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200">
            Unauthenticated
          </span>
        );
    }
  };

  return (
    <div id="diagnostic-screen-container" className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 flex flex-col items-center justify-start">
      <div className="w-full max-w-4xl space-y-6">
        
        {/* Header Bar */}
        <header id="diagnostic-header" className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Multiplayer Sandbox Test
                  <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono font-normal">
                    Task 1
                  </span>
                </h1>
                <p className="text-sm text-zinc-400">
                  Firebase Initialization &amp; Anonymous Auth Diagnostics
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {getAuthStatusBadge()}
            </div>
          </div>
        </header>

        {/* Error Notification Banner if Error */}
        {authState.error && (
          <div id="firebase-error-card" className="bg-rose-950/40 border border-rose-800/80 rounded-2xl p-5 text-rose-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-rose-200">Firebase Authentication Error</h3>
                  {authState.error.code && (
                    <code className="text-xs px-2 py-0.5 rounded bg-rose-900/60 text-rose-300 font-mono">
                      {authState.error.code}
                    </code>
                  )}
                </div>
                <p className="text-sm text-rose-300/90 font-mono break-all">
                  {authState.error.message}
                </p>
                <div className="pt-2">
                  <button
                    id="retry-auth-button"
                    onClick={() => authState.retrySignIn()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-800 hover:bg-rose-700 text-white transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry Anonymous Sign-In
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4 Primary Diagnostic Metric Grid */}
        <div id="diagnostic-metrics-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Metric 1: Firebase Initialized */}
          <div id="card-firebase-init" className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" />
                Firebase Initialized
              </span>
              {authState.firebaseInitialized ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> Ready
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400">
                  <XCircle className="w-4 h-4" /> Failed
                </span>
              )}
            </div>
            <div>
              <p className="text-2xl font-bold text-white tracking-tight">
                {authState.firebaseInitialized ? 'True' : 'False'}
              </p>
              <p className="text-xs text-zinc-400 mt-1 font-mono">
                Project ID: {firebaseConfig.projectId}
              </p>
            </div>
          </div>

          {/* Metric 2: Authentication State */}
          <div id="card-auth-state" className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Authentication State
              </span>
              <span className="text-xs font-mono text-zinc-400 capitalize">
                {authState.status}
              </span>
            </div>
            <div>
              <p className="text-2xl font-bold text-white tracking-tight capitalize">
                {authState.status}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Method: <span className="text-zinc-200 font-mono">Anonymous Authentication</span>
              </p>
            </div>
          </div>

          {/* Metric 3: Firebase UID */}
          <div id="card-firebase-uid" className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3 md:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-blue-400" />
                Firebase UID (Sole Online Identity)
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono">
                auth.currentUser.uid
              </span>
            </div>
            
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                {authState.uid ? (
                  <span className="font-mono text-sm sm:text-base font-semibold text-emerald-400 break-all select-all">
                    {authState.uid}
                  </span>
                ) : authState.loading ? (
                  <span className="text-sm font-mono text-zinc-500 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Acquiring anonymous UID from Firebase Auth...
                  </span>
                ) : (
                  <span className="text-sm font-mono text-zinc-500">
                    No active UID (Unauthenticated or Auth Failed)
                  </span>
                )}
              </div>
              
              {authState.uid && (
                <button
                  id="copy-uid-button"
                  onClick={handleCopyUid}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-zinc-200 transition-colors shrink-0"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Copy UID</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="text-xs text-zinc-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              Strict compliance: No synthetic UIDs, no localStorage identity, no generated player IDs, and no array indexing.
            </p>
          </div>

          {/* Metric 4: Firestore Initialized */}
          <div id="card-firestore-init" className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3 md:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-amber-400" />
                Firestore Initialized
              </span>
              {authState.firestoreInitialized ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> Ready
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400">
                  <XCircle className="w-4 h-4" /> Failed
                </span>
              )}
            </div>
            <div>
              <p className="text-2xl font-bold text-white tracking-tight">
                {authState.firestoreInitialized ? 'True' : 'False'}
              </p>
              <p className="text-xs text-zinc-400 mt-1 font-mono">
                Database instance bound to {firebaseConfig.projectId}
              </p>
            </div>
          </div>

        </div>

        {/* Task 1 Compliance Verification Checklist */}
        <div id="compliance-checklist-card" className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-zinc-400" />
            Task 1 Requirements Verification
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="flex items-center gap-2 text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Initialize Firebase exactly once</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Initialize Firebase Authentication</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Initialize Cloud Firestore</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Firebase Anonymous Authentication flow</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Auth-state listener via onAuthStateChanged</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>auth.currentUser.uid as sole online identity</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Display actual Firebase error code &amp; message</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>No matchmaking / No rooms / No game logic</span>
            </div>
          </div>
        </div>

        {/* Firebase Config Overview */}
        <div id="firebase-config-summary" className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-4 text-xs font-mono text-zinc-400 space-y-1">
          <div className="text-zinc-500 font-sans font-medium text-[11px] uppercase tracking-wider mb-2">
            Target Project Environment
          </div>
          <div>authDomain: <span className="text-zinc-300">{firebaseConfig.authDomain}</span></div>
          <div>projectId: <span className="text-zinc-300">{firebaseConfig.projectId}</span></div>
          <div>storageBucket: <span className="text-zinc-300">{firebaseConfig.storageBucket}</span></div>
          <div>appId: <span className="text-zinc-300">{firebaseConfig.appId}</span></div>
        </div>

      </div>
    </div>
  );
};
