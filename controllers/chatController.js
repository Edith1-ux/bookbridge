/**
 * ==========================================================================
 * BOOKBRIDGE CHAT CONTROLLER
 * Real-Time User-to-User Persistent Messaging & Conversation Engine
 * ==========================================================================
 */

const { Op } = require('sequelize');
const { Conversation, Message, User, Book, Notification } = require('../models');

/**
 * GET /api/conversations
 * Returns all conversations the authenticated user is participating in
 */
exports.getConversations = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;

    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: [{ user1Id: currentUserId }, { user2Id: currentUserId }]
      },
      include: [
        { model: User, as: 'user1', attributes: ['id', 'name', 'email', 'avatarUrl', 'role', 'whatsapp'] },
        { model: User, as: 'user2', attributes: ['id', 'name', 'email', 'avatarUrl', 'role', 'whatsapp'] },
        { model: Book, as: 'book', attributes: ['id', 'title', 'price', 'mode', 'coverUrl', 'status'] }
      ],
      order: [['lastMessageAt', 'DESC']]
    });

    // Format conversations with other participant details & unread count
    const formatted = await Promise.all(
      conversations.map(async (conv) => {
        const isUser1 = conv.user1Id === currentUserId;
        const otherUser = isUser1 ? conv.user2 : conv.user1;

        const unreadCount = await Message.count({
          where: {
            conversationId: conv.id,
            senderId: { [Op.ne]: currentUserId },
            isRead: false
          }
        });

        return {
          id: conv.id,
          bookId: conv.bookId,
          book: conv.book,
          otherUser,
          lastMessageText: conv.lastMessageText,
          lastMessageAt: conv.lastMessageAt,
          unreadCount
        };
      })
    );

    return res.json(formatted);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/conversations
 * Get or create a conversation between current user and a book seller / recipient
 */
exports.getOrCreateConversation = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { recipientId, recipientEmail, bookId } = req.body;

    let targetUserId = recipientId;

    if (!targetUserId && recipientEmail) {
      const targetUser = await User.findOne({ where: { email: recipientEmail.trim().toLowerCase() } });
      if (targetUser) targetUserId = targetUser.id;
    }

    if (!targetUserId) {
      return res.status(400).json({ error: 'Recipient user ID or email is required.' });
    }

    if (parseInt(targetUserId, 10) === currentUserId) {
      return res.status(400).json({ error: 'You cannot start a conversation with yourself.' });
    }

    // Check if conversation already exists between these 2 users (optionally for this book)
    let whereClause = {
      [Op.or]: [
        { user1Id: currentUserId, user2Id: targetUserId },
        { user1Id: targetUserId, user2Id: currentUserId }
      ]
    };

    if (bookId) {
      whereClause.bookId = bookId;
    }

    let conversation = await Conversation.findOne({
      where: whereClause,
      include: [
        { model: User, as: 'user1', attributes: ['id', 'name', 'email', 'avatarUrl', 'role', 'whatsapp'] },
        { model: User, as: 'user2', attributes: ['id', 'name', 'email', 'avatarUrl', 'role', 'whatsapp'] },
        { model: Book, as: 'book', attributes: ['id', 'title', 'price', 'mode', 'coverUrl'] }
      ]
    });

    if (!conversation) {
      let bookTitle = '';
      if (bookId) {
        const book = await Book.findByPk(bookId);
        if (book) bookTitle = book.title;
      }

      conversation = await Conversation.create({
        user1Id: currentUserId,
        user2Id: targetUserId,
        bookId: bookId || null,
        bookTitle,
        lastMessageText: '',
        lastMessageAt: new Date()
      });

      conversation = await Conversation.findByPk(conversation.id, {
        include: [
          { model: User, as: 'user1', attributes: ['id', 'name', 'email', 'avatarUrl', 'role', 'whatsapp'] },
          { model: User, as: 'user2', attributes: ['id', 'name', 'email', 'avatarUrl', 'role', 'whatsapp'] },
          { model: Book, as: 'book', attributes: ['id', 'title', 'price', 'mode', 'coverUrl'] }
        ]
      });
    }

    return res.status(200).json(conversation);
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/conversations/:id/messages
 * Returns message history for a conversation
 */
exports.getMessages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    const conversation = await Conversation.findByPk(id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    // Security: Only participants can read messages
    if (conversation.user1Id !== currentUserId && conversation.user2Id !== currentUserId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied. You are not a participant in this conversation.' });
    }

    const messages = await Message.findAll({
      where: { conversationId: id },
      order: [['createdAt', 'ASC']],
      limit: 100
    });

    // Mark messages sent to current user as read
    await Message.update(
      { isRead: true },
      {
        where: {
          conversationId: id,
          senderId: { [Op.ne]: currentUserId },
          isRead: false
        }
      }
    );

    return res.json(messages);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/conversations/:id/messages
 * Sends a message, saves to MySQL, and emits Socket.IO event
 */
exports.sendMessage = async (req, res, next, io) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;
    const { text } = req.body;

    const conversation = await Conversation.findByPk(id);
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found.' });
    }

    // Security: verify sender is a participant
    if (conversation.user1Id !== currentUserId && conversation.user2Id !== currentUserId) {
      return res.status(403).json({ error: 'Access denied. You cannot post in this conversation.' });
    }

    const recipientId = conversation.user1Id === currentUserId ? conversation.user2Id : conversation.user1Id;

    // 1. Persist message in MySQL
    const message = await Message.create({
      conversationId: conversation.id,
      senderId: currentUserId,
      senderName: req.user.name,
      senderEmail: req.user.email,
      text: text.trim(),
      isRead: false
    });

    // 2. Update conversation summary
    conversation.lastMessageText = text.trim();
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // 3. Create persistent notification for recipient
    try {
      await Notification.create({
        userId: recipientId,
        title: `New message from ${req.user.name}`,
        message: text.trim().length > 60 ? `${text.trim().substring(0, 57)}...` : text.trim(),
        type: 'message',
        link: `/dashboard.html#messages`
      });
    } catch (e) {}

    // 4. Real-time Socket.IO emission
    if (io) {
      const room = `conversation_${conversation.id}`;
      io.to(room).emit('newMessage', message);
      io.to(`user_${recipientId}`).emit('chatNotification', {
        conversationId: conversation.id,
        senderName: req.user.name,
        text: text.trim(),
        message
      });
    }

    return res.status(201).json(message);
  } catch (error) {
    next(error);
  }
};

/**
 * Legacy API support: GET /api/messages
 */
exports.getLegacyMessages = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const withEmail = req.query.with;

    let whereClause = {};

    if (withEmail) {
      const partner = await User.findOne({ where: { email: withEmail.trim().toLowerCase() } });
      if (!partner) return res.json([]);

      const conversation = await Conversation.findOne({
        where: {
          [Op.or]: [
            { user1Id: currentUserId, user2Id: partner.id },
            { user1Id: partner.id, user2Id: currentUserId }
          ]
        }
      });

      if (!conversation) return res.json([]);
      whereClause.conversationId = conversation.id;
    } else {
      // Find all conversations of current user
      const convs = await Conversation.findAll({
        where: {
          [Op.or]: [{ user1Id: currentUserId }, { user2Id: currentUserId }]
        },
        attributes: ['id']
      });
      const convIds = convs.map(c => c.id);
      whereClause.conversationId = { [Op.in]: convIds };
    }

    const messages = await Message.findAll({
      where: whereClause,
      order: [['createdAt', 'ASC']],
      limit: 100
    });

    return res.json(messages);
  } catch (error) {
    next(error);
  }
};

/**
 * Legacy API support: POST /api/messages
 */
exports.sendLegacyMessage = async (req, res, next, io) => {
  try {
    const currentUserId = req.user.id;
    const { receiverEmail, receiver_email, text, bookTitle, book_title, bookId } = req.body;
    const targetEmail = (receiverEmail || receiver_email || '').trim().toLowerCase();

    if (!targetEmail) {
      return res.status(400).json({ error: 'Receiver email is required.' });
    }

    if (targetEmail === req.user.email.toLowerCase()) {
      return res.status(400).json({ error: 'Cannot send message to yourself.' });
    }

    const recipient = await User.findOne({ where: { email: targetEmail } });
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient user account not found.' });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      where: {
        [Op.or]: [
          { user1Id: currentUserId, user2Id: recipient.id },
          { user1Id: recipient.id, user2Id: currentUserId }
        ]
      }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        user1Id: currentUserId,
        user2Id: recipient.id,
        bookId: bookId || null,
        bookTitle: bookTitle || book_title || '',
        lastMessageText: text.trim(),
        lastMessageAt: new Date()
      });
    } else {
      conversation.lastMessageText = text.trim();
      conversation.lastMessageAt = new Date();
      await conversation.save();
    }

    const message = await Message.create({
      conversationId: conversation.id,
      senderId: currentUserId,
      senderName: req.user.name,
      senderEmail: req.user.email,
      text: text.trim(),
      isRead: false
    });

    if (io) {
      io.to(`conversation_${conversation.id}`).emit('newMessage', message);
      io.to(`user_${recipient.id}`).emit('chatNotification', {
        conversationId: conversation.id,
        senderName: req.user.name,
        text: text.trim(),
        message
      });
    }

    return res.status(201).json({
      ...message.get({ plain: true }),
      sender_email: req.user.email,
      sender_name: req.user.name,
      receiver_email: recipient.email,
      receiver_name: recipient.name
    });
  } catch (error) {
    next(error);
  }
};
