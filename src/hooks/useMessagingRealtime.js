import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

// Live delivery: the entity subscriptions fire only for records the signed-in
// user is authorized to read (their own conversations), and a light poll keeps
// the view fresh if a socket event is missed.
export default function useMessagingRealtime(refresh) {
  useEffect(() => {
    let timer = null;
    const fire = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { try { refresh(); } catch (e) { /* ignored */ } }, 400);
    };
    let unsubMessages = null;
    let unsubThreads = null;
    try {
      unsubMessages = base44.entities.MessageEntry.subscribe(fire);
      unsubThreads = base44.entities.MessageThread.subscribe(fire);
    } catch (e) {
      // subscription unavailable — the poll below still delivers updates
    }
    const poll = setInterval(() => { try { refresh(); } catch (e) { /* ignored */ } }, 20000);
    return () => {
      clearTimeout(timer);
      clearInterval(poll);
      try { unsubMessages && unsubMessages(); } catch (e) { /* ignored */ }
      try { unsubThreads && unsubThreads(); } catch (e) { /* ignored */ }
    };
  }, [refresh]);
}