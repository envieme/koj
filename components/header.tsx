// components/header.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { CSSProperties } from 'react';
import { ModeToggle } from './mode-toggle';
import { IconLogo } from './ui/icons';
import { cn } from '@/lib/utils';
import HistoryContainer from './history-container';

const spanStyle: CSSProperties = {
  textAlign: 'center',
  fontSize: '64px',
  position: 'fixed',
  top: '0',
  left: '50%',
  transform: 'translateX(-50%)',
  transition: 'opacity 0.3s ease-out',
  opacity: 1, // Start with full opacity
};

export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 0); // Change to your desired scroll position to start fading
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`w-full p-1 md:p-2 flex justify-between items-center z-10 backdrop-blur md:backdrop-blur-none bg-background/80 md:bg-transparent ${isScrolled ? 'hidden' : ''}`}>
      <div>
        <a href="/">
          <IconLogo className={cn('w-5 h-5')} />
          <span className="sr-only">Kojle</span>
        </a>
      </div>
      <span style={{ ...spanStyle, opacity: isScrolled ? 0 : 1 }}>Kojle</span>
      <div className="flex gap-0.5">
        <ModeToggle />
        <HistoryContainer location="header" />
      </div>
    </header>
  );
};

export default Header;
