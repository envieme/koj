// components/header.tsx
'use client';
import { cn } from '@/lib/utils';
import React from 'react';
import HistoryContainer from './history-container';
import { ModeToggle } from './mode-toggle';
import { IconLogo } from './ui/icons';

import dynamic from 'next/dynamic';
import { CSSProperties } from 'react';

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
    <header className="fixed w-full p-2 flex justify-between items-center z-10 backdrop-blur md:backdrop-blur-none bg-background/80 md:bg-transparent">
      <meta name="google-adsense-account" content="ca-pub-1753126371326468" />
      <div>
        <a href="/">
          <IconLogo className={cn('w-5 h-5')} />
          <span className="sr-only">K</span>
        </a>
      </div>
      <a href="/"><span style={{ ...spanStyle }}>Kojle</span></a>
      <div className="flex gap-0.5">
        <ModeToggle />
        <HistoryContainer location="header" />
      </div>
    </header>
  );
};

export default Header;
