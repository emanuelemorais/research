'use client';

import { useEffect } from 'react';
import Clarity from '@microsoft/clarity';


export default function ClarityLayout({ children }: { children: React.ReactNode }) {

  useEffect(() => {
    Clarity.init('u2hv11k2qz');
  }, []);
    
  return (
    <>
      {children}
    </>
  );
}