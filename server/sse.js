/**
 * SSE (Server-Sent Events) manager
 * - Session payments: instant green-tick update when payment is confirmed
 * - Vendor <-> Admin chat: instant message delivery in real-time
 */

const sessionListeners = new Map(); // sessionId -> Set<res>
const chatListeners = new Map();    // channelKey ('vendor:VENDOR_ID' or 'admin') -> Set<res>

/* ── Payment Session Listeners ── */
export function addSSEListener(sessionId, res) {
  if (!sessionListeners.has(sessionId)) {
    sessionListeners.set(sessionId, new Set());
  }
  sessionListeners.get(sessionId).add(res);
}

export function removeSSEListener(sessionId, res) {
  const set = sessionListeners.get(sessionId);
  if (set) {
    set.delete(res);
    if (set.size === 0) sessionListeners.delete(sessionId);
  }
}

export function pushPaymentEvent(sessionId, eventData) {
  const set = sessionListeners.get(sessionId);
  if (!set || set.size === 0) return;

  const msg = `data: ${JSON.stringify(eventData)}\n\n`;
  for (const res of set) {
    try {
      res.write(msg);
    } catch {
      set.delete(res);
    }
  }
  console.log(`[SSE] Pushed payment event to ${set.size} listener(s) for session ${sessionId}`);
}

/* ── Real-Time Chat & Notification Listeners ── */
export function addChatListener(channelKey, res) {
  if (!chatListeners.has(channelKey)) {
    chatListeners.set(channelKey, new Set());
  }
  chatListeners.get(channelKey).add(res);
}

export function removeChatListener(channelKey, res) {
  const set = chatListeners.get(channelKey);
  if (set) {
    set.delete(res);
    if (set.size === 0) chatListeners.delete(channelKey);
  }
}

export function pushChatEvent(channelKey, eventData) {
  const set = chatListeners.get(channelKey);
  if (!set || set.size === 0) return;

  const msg = `data: ${JSON.stringify(eventData)}\n\n`;
  for (const res of set) {
    try {
      res.write(msg);
    } catch {
      set.delete(res);
    }
  }
  console.log(`[SSE Chat] Pushed event to channel ${channelKey} (${set.size} listeners)`);
}
