/**
 * ==========================================================================
 * BOOKBRIDGE ADMIN CONTROLLER
 * Real Platform Metrics, User Role Auditing & Moderation Controls
 * ==========================================================================
 */

const { User, Book, Message, Conversation, AuditLog } = require('../models');

/**
 * GET /api/admin/stats
 */
exports.getStats = async (req, res, next) => {
  try {
    const totalUsers = await User.count();
    const studentUsers = await User.count({ where: { role: 'student' } });
    const facultyUsers = await User.count({ where: { role: 'faculty' } });

    const totalListings = await Book.count();
    const availableBooks = await Book.count({ where: { status: 'Available' } });
    const soldBooks = await Book.count({ where: { status: 'Sold' } });
    const activeSwaps = await Book.count({ where: { mode: 'exchange', status: 'Available' } });
    const freeDonations = await Book.count({ where: { mode: 'donate', status: 'Available' } });

    const totalConversations = await Conversation.count();
    const totalMessages = await Message.count();

    return res.json({
      totalUsers,
      studentUsers,
      facultyUsers,
      totalListings,
      availableBooks,
      soldBooks,
      totalTransactions: soldBooks,
      totalOffers: activeSwaps,
      activeSwaps,
      freeDonations,
      totalConversations,
      totalMessages,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/users
 */
exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: [
        'id', 'name', 'email', 'enrollment', 'branch', 'semester',
        'division', 'academicYear', 'whatsapp', 'role', 'isActive',
        'createdAt', 'updatedAt'
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json(users);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/users/:id/role
 */
exports.updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const allowed = ['student', 'faculty', 'alumni', 'admin'];
    if (!role || !allowed.includes(role.toLowerCase())) {
      return res.status(400).json({ error: `Role must be one of: ${allowed.join(', ')}` });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const oldRole = user.role;
    user.role = role.toLowerCase();
    await user.save();

    try {
      await AuditLog.create({
        userId: req.user.id,
        action: 'ADMIN_ROLE_CHANGE',
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
        details: `Changed role of user ${user.email} from ${oldRole} to ${user.role}`
      });
    } catch (e) {}

    return res.json({
      message: `Role for ${user.email} updated to ${user.role}.`,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/users/:id/status
 */
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    user.isActive = Boolean(isActive);
    await user.save();

    try {
      await AuditLog.create({
        userId: req.user.id,
        action: user.isActive ? 'ADMIN_USER_UNBANNED' : 'ADMIN_USER_BANNED',
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
        details: `Set isActive=${user.isActive} for ${user.email}`
      });
    } catch (e) {}

    return res.json({
      message: `User ${user.email} status updated to ${user.isActive ? 'Active' : 'Deactivated'}.`,
      isActive: user.isActive
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/logs
 */
exports.getAuditLogs = async (req, res, next) => {
  try {
    const logs = await AuditLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 100
    });

    return res.json(logs);
  } catch (error) {
    next(error);
  }
};
