/**
 * ==========================================================================
 * BOOKBRIDGE AUTH CONTROLLER
 * Enterprise Authentication, Bcrypt Hashing, JWTs & Forgot-Password Flow
 * ==========================================================================
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { User, PasswordResetToken, AuditLog, Book, Conversation } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'bookbridge_jwt_secret_production_enterprise_2026';
const TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Helper to generate JWT token
 */
function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      branch: user.branch,
      semester: user.semester,
      enrollment: user.enrollment
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

/**
 * Safely format user response without password hash
 */
function formatSafeUser(user) {
  const plain = user.get ? user.get({ plain: true }) : { ...user };
  delete plain.passwordHash;
  delete plain.password;
  return plain;
}

/**
 * POST /api/register or /api/auth/register
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, enrollment, branch, semester, division, academicYear, whatsapp, role } = req.body;

    const normalizedEmail = (email || '').trim().toLowerCase();

    // Check if email already registered
    const existingEmail = await User.findOne({ where: { email: normalizedEmail } });
    if (existingEmail) {
      return res.status(409).json({
        error: 'An account with this email address already exists. Please login.',
        field: 'email',
        status: 409
      });
    }

    // Check enrollment uniqueness if provided
    if (enrollment && enrollment.trim() !== '') {
      const existingEnrollment = await User.findOne({ where: { enrollment: enrollment.trim() } });
      if (existingEnrollment) {
        return res.status(409).json({
          error: 'An account with this GTU Enrollment Number already exists.',
          field: 'enrollment',
          status: 409
        });
      }
    }

    // Hash password with bcrypt (work factor 12)
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user in MySQL
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      enrollment: enrollment ? enrollment.trim() : null,
      branch: branch || 'CE',
      semester: semester ? parseInt(semester, 10) : 1,
      division: division || 'Div A',
      academicYear: academicYear || '2025-2026',
      whatsapp: whatsapp ? whatsapp.trim() : '',
      role: (role && ['faculty', 'student'].includes(role.toLowerCase())) ? role.toLowerCase() : 'student',
      isActive: true
    });

    const token = signToken(newUser);
    const safeUser = formatSafeUser(newUser);

    // Record audit log
    try {
      await AuditLog.create({
        userId: newUser.id,
        action: 'USER_REGISTERED',
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
        details: `User registered: ${newUser.email}`
      });
    } catch (e) {}

    return res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: safeUser,
      status: 201
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/login or /api/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, identifier, password } = req.body;
    const loginIdentifier = (email || identifier || '').trim();

    if (!loginIdentifier || !password) {
      return res.status(400).json({
        error: 'Email or Enrollment Number and password are required.',
        status: 400
      });
    }

    // Lookup by either email or enrollment number
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: loginIdentifier.toLowerCase() },
          { enrollment: loginIdentifier }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials. Please check your email/enrollment and password.',
        status: 401
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: 'This account has been deactivated. Please contact the administrator.',
        status: 403
      });
    }

    // Verify password hash
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid credentials. Please check your email/enrollment and password.',
        status: 401
      });
    }

    const token = signToken(user);
    const safeUser = formatSafeUser(user);

    // Record audit log
    try {
      await AuditLog.create({
        userId: user.id,
        action: 'USER_LOGIN',
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
        details: `User logged in: ${user.email}`
      });
    } catch (e) {}

    return res.status(200).json({
      message: 'Login successful!',
      token,
      user: safeUser,
      status: 200
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/me or /api/users/profile
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const safeUser = formatSafeUser(user);

    // Fetch user statistics
    const myBooksCount = await Book.count({ where: { sellerId: user.id } });
    const myConversationsCount = await Conversation.count({
      where: {
        [Op.or]: [{ user1Id: user.id }, { user2Id: user.id }]
      }
    });

    return res.json({
      ...safeUser,
      stats: {
        booksListed: myBooksCount,
        activeConversations: myConversationsCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/users/profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const { name, whatsapp, branch, semester, division, academicYear } = req.body;

    if (name && name.trim()) user.name = name.trim();
    if (whatsapp !== undefined) user.whatsapp = whatsapp.trim();
    if (branch) user.branch = branch;
    if (semester) user.semester = parseInt(semester, 10);
    if (division) user.division = division;
    if (academicYear) user.academicYear = academicYear;

    await user.save();

    return res.json({
      message: 'Profile updated successfully!',
      user: formatSafeUser(user)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/forgot-password
 * Initiates single-use expiring password reset token
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const normalizedEmail = (email || '').trim().toLowerCase();

    // Look up user without revealing if user exists (security best practice)
    const user = await User.findOne({ where: { email: normalizedEmail } });

    if (user && user.isActive) {
      // Invalidate any previously active tokens for this user
      await PasswordResetToken.update(
        { usedAt: new Date() },
        { where: { userId: user.id, usedAt: null } }
      );

      // Generate cryptographically secure 32-byte hex token
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      // Expires in 1 hour
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await PasswordResetToken.create({
        userId: user.id,
        tokenHash,
        expiresAt
      });

      const resetUrl = `${req.protocol}://${req.get('host')}/forgot-password.html?token=${rawToken}`;
      console.log(`===================================================`);
      console.log(`🔐 [PASSWORD RESET LINK GENERATED]`);
      console.log(` 📧 User: ${user.email}`);
      console.log(` 🔗 URL:  ${resetUrl}`);
      console.log(` ⏳ Valid for: 1 hour`);
      console.log(`===================================================`);

      // Record audit log
      try {
        await AuditLog.create({
          userId: user.id,
          action: 'PASSWORD_RESET_REQUESTED',
          ipAddress: req.ip || '',
          userAgent: req.headers['user-agent'] || '',
          details: `Password reset requested for ${user.email}`
        });
      } catch (e) {}
    }

    // Always return same response to prevent email enumeration
    return res.json({
      message: 'If an account with that email address exists, a password reset link has been dispatched.',
      status: 200
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/verify-reset-token/:token
 */
exports.verifyResetToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ error: 'Token is required.' });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const resetRecord = await PasswordResetToken.findOne({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { [Op.gt]: new Date() }
      }
    });

    if (!resetRecord) {
      return res.status(400).json({
        valid: false,
        error: 'This password reset link is invalid or has expired.'
      });
    }

    return res.json({ valid: true, message: 'Token is valid.' });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/reset-password
 * Executes password update with single-use verification
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const resetRecord = await PasswordResetToken.findOne({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: { [Op.gt]: new Date() }
      }
    });

    if (!resetRecord) {
      return res.status(400).json({
        error: 'The password reset token is invalid or has expired. Please request a new one.',
        status: 400
      });
    }

    const user = await User.findByPk(resetRecord.userId);
    if (!user) {
      return res.status(404).json({ error: 'User account no longer exists.' });
    }

    // Hash new password
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    // Mark token as used
    resetRecord.usedAt = new Date();
    await resetRecord.save();

    // Record audit log
    try {
      await AuditLog.create({
        userId: user.id,
        action: 'PASSWORD_RESET_COMPLETED',
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
        details: `Password reset completed for ${user.email}`
      });
    } catch (e) {}

    return res.json({
      message: 'Your password has been reset successfully! You can now log in with your new password.',
      status: 200
    });
  } catch (error) {
    next(error);
  }
};
