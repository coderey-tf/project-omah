"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UseRealtimeOptions {
  table: string;
  filter?: string;
  onEvent?: (payload: any) => void;
  enabled?: boolean;
}

export function useRealtime({
  table,
  filter,
  onEvent,
  enabled = true,
}: UseRealtimeOptions) {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    // Gracefully bypass if Supabase is not configured with a real key
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey || anonKey === "placeholder-anon-key") {
      return;
    }

    let channel: RealtimeChannel | null = null;

    try {
      const supabase = createClient();
      const channelId = `realtime-${table}-${filter ? filter.replace(/[^a-zA-Z0-9]/g, "_") : "all"}-${Date.now()}`;

      channel = supabase
        .channel(channelId)
        .on(
          "postgres_changes" as any,
          {
            event: "*",
            schema: "public",
            table,
            ...(filter ? { filter } : {}),
          },
          (payload: any) => {
            if (onEvent) {
              onEvent(payload);
            }
            router.refresh();
          }
        )
        .subscribe((status: string) => {
          if (status === "SUBSCRIBED") {
            setIsConnected(true);
          } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
            setIsConnected(false);
          }
        });
    } catch (err) {
      console.warn("Supabase Realtime subscription error:", err);
    }

    return () => {
      if (channel) {
        try {
          const supabase = createClient();
          supabase.removeChannel(channel);
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [table, filter, enabled, onEvent, router]);

  return { isConnected };
}
