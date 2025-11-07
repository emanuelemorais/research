'use client';

import Clarity from '@microsoft/clarity';


export default function ClarityLayout({ children }: { children: React.ReactNode }) {

  Clarity.init('u2hv11k2qz');
    
  return (
    <>
      {children}
    </>
  );
}