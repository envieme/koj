import React from 'react';
import { useClient } from 'next/edge'; // Import useClient from next/edge
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ChatPanel } from './chat-panel';
import { ChatMessages } from './chat-messages';
import { useUIState } from 'ai/rsc';

type ChatProps = {
  id?: string;
  query?: string;
};

export function Chat({ id, query }: ChatProps) {
  const path = usePathname();
  const [messages] = useUIState();

  useEffect(() => {
    if (!path.includes('search') && messages.length === 1) {
      window.history.replaceState({}, '', `/search/${id}`);
    }
  }, [id, path, messages, query]);

  return (
    <div className="px-8 sm:px-12 pt-12 md:pt-14 pb-14 md:pb-24 max-w-3xl mx-auto flex flex-col space-y-3 md:space-y-4 mt-32">
      <ChatMessages messages={messages} />
      <ChatPanel messages={messages} query={query} />
    </div>
  );
}

export default function ClientChat(props: ChatProps) {
  useClient(); // Ensure this component is treated as client-side
  return <Chat {...props} />;
}
