import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { addChatListener, removeChatListener, pushChatEvent } from '../sse.js';

/**
 * Send a message (Vendor -> Admin or Admin -> Vendor)
 */
export async function sendMessage(req, res) {
  try {
    const { text, vendorId: targetVendorId } = req.body;
    const currentUser = req.user;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message text cannot be empty' });
    }

    let vendorId;
    let vendorUsername;

    if (currentUser.role === 'vendor') {
      vendorId = currentUser.vendorId;
      vendorUsername = currentUser.username;
    } else if (currentUser.role === 'admin') {
      if (!targetVendorId) {
        return res.status(400).json({ error: 'Target vendorId is required for admin messages' });
      }
      vendorId = targetVendorId;
      const targetUser = await User.findOne({ vendorId });
      vendorUsername = targetUser?.username || vendorId;
    }

    const message = await Message.create({
      vendorId,
      vendorUsername,
      senderRole: currentUser.role,
      senderName: currentUser.role === 'admin' ? 'Administrator' : (currentUser.businessName || currentUser.username),
      text: text.trim(),
      read: false,
    });

    // Instant SSE push to both vendor channel and admin channel
    const eventPayload = {
      type: 'NEW_CHAT_MESSAGE',
      message,
    };

    pushChatEvent(`vendor:${vendorId}`, eventPayload);
    pushChatEvent('admin', eventPayload);

    return res.status(201).json(message);
  } catch (err) {
    console.error('sendMessage error:', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
}

/**
 * Get messages for a vendor thread
 */
export async function getMessages(req, res) {
  try {
    const currentUser = req.user;
    let vendorId;

    if (currentUser.role === 'vendor') {
      vendorId = currentUser.vendorId;
    } else {
      vendorId = req.query.vendorId;
      if (!vendorId) {
        return res.status(400).json({ error: 'vendorId is required' });
      }
    }

    const messages = await Message.find({ vendorId }).sort({ createdAt: 1 });

    // Mark messages from opposite role as read
    const oppositeRole = currentUser.role === 'admin' ? 'vendor' : 'admin';
    await Message.updateMany(
      { vendorId, senderRole: oppositeRole, read: false },
      { $set: { read: true } }
    );

    return res.json(messages);
  } catch (err) {
    console.error('getMessages error:', err);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
}

/**
 * Admin: Get list of all vendor chat threads with last message & unread badge
 */
export async function getChatThreads(req, res) {
  try {
    // Get all vendors
    const vendors = await User.find({ role: 'vendor' }).select('vendorId username businessName phone upiId');

    // Aggregate latest message and unread count per vendorId
    const threads = await Promise.all(
      vendors.map(async (v) => {
        const lastMsg = await Message.findOne({ vendorId: v.vendorId }).sort({ createdAt: -1 });
        const unreadCount = await Message.countDocuments({
          vendorId: v.vendorId,
          senderRole: 'vendor',
          read: false,
        });

        return {
          vendorId: v.vendorId,
          username: v.username,
          businessName: v.businessName,
          phone: v.phone,
          upiId: v.upiId,
          lastMessage: lastMsg?.text || '',
          lastMessageAt: lastMsg?.createdAt || null,
          unreadCount,
        };
      })
    );

    // Sort by most recent message or vendor creation
    threads.sort((a, b) => {
      const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return timeB - timeA;
    });

    return res.json(threads);
  } catch (err) {
    console.error('getChatThreads error:', err);
    return res.status(500).json({ error: 'Failed to fetch chat threads' });
  }
}

/**
 * SSE stream for real-time chat updates
 * GET /api/chat/stream
 */
export function streamChat(req, res) {
  const currentUser = req.user;
  const channelKey = currentUser.role === 'admin' ? 'admin' : `vendor:${currentUser.vendorId}`;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', channel: channelKey })}\n\n`);

  const ping = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      clearInterval(ping);
    }
  }, 20_000);

  addChatListener(channelKey, res);

  req.on('close', () => {
    clearInterval(ping);
    removeChatListener(channelKey, res);
  });
}
