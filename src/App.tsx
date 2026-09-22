/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useFirebaseAuth } from './hooks/useFirebaseAuth';
import { usePresence } from './hooks/usePresence';
import { DiagnosticScreen } from './components/DiagnosticScreen';

export default function App() {
  const authState = useFirebaseAuth();
  const presenceState = usePresence(authState.uid);

  return (
    <main id="app-root" className="min-h-screen w-full bg-zinc-950">
      <DiagnosticScreen 
        authState={authState} 
        presenceState={presenceState}
      />
    </main>
  );
}

