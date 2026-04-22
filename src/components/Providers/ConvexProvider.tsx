'use client';

import React from 'react';
import { ConvexProvider, ConvexReactClient, useMutation, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import useStore, { type Bot } from '@/lib/store';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null;

function BotStoreSync() {
  const remoteBots = useQuery(api.bots.list, {});
  const saveBot = useMutation(api.bots.upsert);
  const deleteBot = useMutation(api.bots.remove);
  const localBots = useStore((state) => state.bots);
  const configureRemotePersistence = useStore((state) => state.configureRemotePersistence);
  const mergeRemoteBots = useStore((state) => state.mergeRemoteBots);
  const setBotsLoaded = useStore((state) => state.setBotsLoaded);
  const hasAttemptedMigration = React.useRef(false);

  React.useEffect(() => {
    configureRemotePersistence({
      enabled: true,
      handlers: {
        saveBot: async (bot: Bot) => {
          await saveBot({ bot });
        },
        deleteBot: async (botId: string) => {
          await deleteBot({ botId });
        },
      },
    });

    return () => {
      configureRemotePersistence({ enabled: false, handlers: null });
    };
  }, [configureRemotePersistence, deleteBot, saveBot]);

  React.useEffect(() => {
    if (remoteBots === undefined) {
      setBotsLoaded(false);
      return;
    }

    mergeRemoteBots(remoteBots as Bot[]);
  }, [mergeRemoteBots, remoteBots, setBotsLoaded]);

  React.useEffect(() => {
    if (remoteBots === undefined || hasAttemptedMigration.current) {
      return;
    }

    // Only migrate local bots when the remote store is empty.
    // This avoids re-introducing previously deleted bots from stale local storage.
    if ((remoteBots as Bot[]).length > 0) {
      hasAttemptedMigration.current = true;
      return;
    }

    const remoteBotIds = new Set((remoteBots as Bot[]).map((bot) => bot.id));
    const botsToMigrate = localBots.filter((bot) => !remoteBotIds.has(bot.id));

    if (botsToMigrate.length === 0) {
      hasAttemptedMigration.current = true;
      return;
    }

    hasAttemptedMigration.current = true;
    void Promise.all(
      botsToMigrate.map(async (bot) => {
        await saveBot({ bot });
      })
    );
  }, [localBots, remoteBots, saveBot]);

  return null;
}

export default function AppConvexProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const configureRemotePersistence = useStore((state) => state.configureRemotePersistence);
  const setBotsLoaded = useStore((state) => state.setBotsLoaded);

  React.useEffect(() => {
    if (convexClient) {
      return;
    }

    configureRemotePersistence({ enabled: false, handlers: null });
    setBotsLoaded(true);
  }, [configureRemotePersistence, setBotsLoaded]);

  if (!convexClient) {
    return <>{children}</>;
  }

  return (
    <ConvexProvider client={convexClient}>
      <BotStoreSync />
      {children}
    </ConvexProvider>
  );
}
