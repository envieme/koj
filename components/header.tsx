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
    <header>
    </header>
  );
};

export default Header;
