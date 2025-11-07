'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface AppContextType {
  userId: string | null;
  setUserId: (id: string) => void;
  sessionId: string | null;
  setSessionId: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppContextProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  return (
    <AppContext.Provider value={{ userId, setUserId, sessionId, setSessionId }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
}