// components/header.tsx
'use client';

import React, { CSSProperties } from 'react';
import { ModeToggle } from './mode-toggle';
import { IconLogo } from './ui/icons';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

// Dynamically import HistoryContainer to ensure it's client-side rendered
const HistoryContainer = dynamic(() => import('./history-container'), { ssr: false });

const spanStyle: CSSProperties = {
  textAlign: 'center',
  fontSize: '64px',
  top: '0',
  left: '50%',
  transform: 'translateX(-50%)',
  transition: 'opacity 0.3s ease-out',
  opacity: 1, // Start with full opacity
  marginLeft: '50px',
};

export const Header: React.FC = () => {
  return (
    <header className={`w-full p-1 md:p-2 flex justify-between items-center z-10 backdrop-blur md:backdrop-blur-none bg-background/80 md:bg-transparent`}>
      <meta name="google-adsense-account" content="ca-pub-1753126371326468"></meta>
      <div>
        <a href="/">
          <IconLogo className={cn('w-5 h-5')} />
          <span className="sr-only">K</span>
        </a>
      </div>
      <a href="/"><span style={{ ...spanStyle }}>Kojle Health</span></a>
      <div className="flex gap-0.5">
        <ModeToggle />
        <HistoryContainer location="header" />
      </div>
    </header>
  );
};

export default Header;
