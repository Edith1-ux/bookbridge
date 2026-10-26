/**
 * ==========================================================================
 * BOOKBRIDGE VALIDATION MIDDLEWARE
 * Request payload validation and sanitization for Books, Auth, and Messages
 * ==========================================================================
 */

/**
 * Validates book creation and update payloads
 */
exports.validateBookInput = (req, res, next) => {
  const { title, author, semester, branch, mode, price, condition } = req.body;
  const errors = [];

  if (!title || typeof title !== 'string' || title.trim().length < 2) {
    errors.push('Title is required and must be at least 2 characters long.');
  }

  if (!author || typeof author !== 'string' || author.trim().length < 2) {
    errors.push('Author is required and must be at least 2 characters long.');
  }

  if (mode) {
    const validModes = ['sell', 'exchange', 'donate', 'buy'];
    if (!validModes.includes(mode.toLowerCase())) {
      errors.push(`Mode must be one of: ${validModes.join(', ')}.`);
    }

    if (mode.toLowerCase() === 'sell') {
      const numPrice = parseFloat(price);
      if (isNaN(numPrice) || numPrice < 0) {
        errors.push('Selling price must be a non-negative number.');
      }
    }
  }

  if (semester !== undefined && semester !== null && semester !== '') {
    const semNum = parseInt(semester, 10);
    if (isNaN(semNum) || semNum < 1 || semNum > 8) {
      errors.push('Semester must be an integer between 1 and 8.');
    }
  }

  if (condition) {
    const validConditions = ['Brand New', 'Like New', 'Excellent', 'Good', 'Fair'];
    const matches = validConditions.some(c => c.toLowerCase() === condition.toLowerCase());
    if (!matches) {
      errors.push(`Condition must be one of: ${validConditions.join(', ')}.`);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: errors[0],
      errors,
      status: 400
    });
  }

  // Sanitize values
  req.body.title = title.trim();
  req.body.author = author.trim();
  if (req.body.mode) req.body.mode = req.body.mode.toLowerCase();
  if (req.body.price !== undefined) req.body.price = parseFloat(req.body.price) || 0;
  if (req.body.semester) req.body.semester = parseInt(req.body.semester, 10);

  next();
};

/**
 * Validates user registration payload
 */
exports.validateRegisterInput = (req, res, next) => {
  const { name, email, password, semester, branch, enrollment } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Full name is required (minimum 2 characters).');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    errors.push('A valid email address is required.');
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }

  if (semester !== undefined && semester !== null && semester !== '') {
    const semNum = parseInt(semester, 10);
    if (isNaN(semNum) || semNum < 1 || semNum > 8) {
      errors.push('Semester must be between 1 and 8.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: errors[0],
      errors,
      status: 400
    });
  }

  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  if (enrollment) req.body.enrollment = enrollment.trim();
  if (branch) req.body.branch = branch.trim();

  next();
};

/**
 * Validates user login payload
 */
exports.validateLoginInput = (req, res, next) => {
  const { email, identifier, password } = req.body;
  const idValue = email || identifier;

  if (!idValue || typeof idValue !== 'string' || idValue.trim().length === 0) {
    return res.status(400).json({
      error: 'Email or Enrollment Number is required.',
      status: 400
    });
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({
      error: 'Password is required.',
      status: 400
    });
  }

  req.body.email = idValue.trim().toLowerCase();
  next();
};

/**
 * Validates password reset request
 */
exports.validateForgotPasswordInput = (req, res, next) => {
  const { email } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    return res.status(400).json({
      error: 'Please provide a valid email address.',
      status: 400
    });
  }
  req.body.email = email.trim().toLowerCase();
  next();
};

/**
 * Validates password reset execution
 */
exports.validateResetPasswordInput = (req, res, next) => {
  const { token, newPassword, confirmPassword } = req.body;
  const errors = [];

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    errors.push('Password reset token is required.');
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
    errors.push('New password must be at least 8 characters long.');
  }

  if (confirmPassword && newPassword !== confirmPassword) {
    errors.push('Passwords do not match.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: errors[0],
      errors,
      status: 400
    });
  }

  next();
};

/**
 * Validates chat message text
 */
exports.validateMessageInput = (req, res, next) => {
  const { text, message } = req.body;
  const msgText = text || message;

  if (!msgText || typeof msgText !== 'string' || msgText.trim().length === 0) {
    return res.status(400).json({
      error: 'Message text cannot be empty.',
      status: 400
    });
  }

  if (msgText.trim().length > 5000) {
    return res.status(400).json({
      error: 'Message length cannot exceed 5000 characters.',
      status: 400
    });
  }

  req.body.text = msgText.trim();
  next();
};
