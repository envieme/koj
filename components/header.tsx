// Import required modules and hooks
import React, { useEffect, useState } from 'react';
import { useClient } from 'next/edge'; // Import useClient from next/edge
import { CSSProperties } from 'react';
import { ModeToggle } from './mode-toggle';
import { IconLogo } from './ui/icons';
import { cn } from '@/lib/utils';
import HistoryContainer from './history-container';

// Define CSS styles for the span element
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

// Define the Header component
export const Header: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  // Use useEffect to handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 0); // Set isScrolled to true if scrolled
    };

    // Add event listener for scroll
    window.addEventListener('scroll', handleScroll);

    // Clean up by removing event listener
    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // Empty dependency array means it runs once on mount

  // Return the JSX for the Header component
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

// Export the Header component as default
export default function ClientHeader() {
  useClient(); // Use useClient to mark this component as client-side
  return <Header />;
}
