'use client';

import clarity from '@microsoft/clarity';
import { useEffect } from 'react';

export default function ClarityLayout({ children }: { children: React.ReactNode }) {
  
  useEffect(() => {
    clarity.init('u2hv11k2qz');
  }, []);
  
  return (
    <>
      {children}
    </>
  );
}