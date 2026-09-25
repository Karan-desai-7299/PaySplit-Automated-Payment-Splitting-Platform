import { addSSEListener, removeSSEListener } from '../sse.js';

/**
 * GET /api/vendor/stream/:sessionId
 * Opens a persistent SSE connection for the vendor's browser.
 * When a payment is verified (by webhook or manual), the server instantly
 * pushes a SLICE_PAID event — no polling needed.
 *
 * EventSource usage in the client:
 *   const es = new EventSource('/api/vendor/stream/PAY-20260924-1234', { withCredentials: false });
 *   es.onmessage = (e) => { const data = JSON.parse(e.data); ... }
 */
export function streamPaymentSession(req, res) {
  const { sessionId } = req.params;

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
  res.flushHeaders();

  // Send initial heartbeat so client knows connection is alive
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', sessionId })}\n\n`);

  // Keep-alive ping every 20 seconds (prevents proxy timeouts)
  const pingInterval = setInterval(() => {
    try {
      res.write(`: ping\n\n`); // SSE comment, ignored by client but keeps TCP alive
    } catch {
      clearInterval(pingInterval);
    }
  }, 20_000);

  // Register this response as a listener for this session
  addSSEListener(sessionId, res);

  // Cleanup when client disconnects (tab close, navigation, logout)
  req.on('close', () => {
    clearInterval(pingInterval);
    removeSSEListener(sessionId, res);
    console.log(`[SSE] Client disconnected from session ${sessionId}`);
  });
}
