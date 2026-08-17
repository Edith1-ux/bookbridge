/**
 * ==========================================================================
 * AUTH CONTROLLER (MySQL Sequelize / Bcrypt Password Hashing & JWT)
 * ==========================================================================
 */

const fs = require('fs');
const path = require('path');

let bcrypt = null;
let jwt = null;
try { bcrypt = require('bcryptjs'); } catch (e) { bcrypt = null; }
try { jwt = require('jsonwebtoken'); } catch (e) { jwt = null; }

const User = require('../models/User');
const { getSQLStatus, getMongoStatus } = require('../config/db');

const DB_FILE = path.join(__dirname, '..', 'data', 'db.json');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_enterprise_bookbridge_key_2026_DEV_ONLY';

function readJSONDB() {
  try {
    if (!fs.existsSync(DB_FILE)) return { users: [], books: [], messages: [], reviews: [] };
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    if (!db.users) db.users = [];
    return db;
  } catch (err) {
    return { users: [], books: [], messages: [], reviews: [] };
  }
}

function writeJSONDB(data) {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[DB Write Error] Failed to persist JSON data:', err.message);
  }
}

function signToken(payload) {
  if (!jwt) return 'no-jwt-module-' + Date.now();
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

function assignRole(requestedRole) {
  const allowedRoles = ['student', 'faculty'];
  if (requestedRole && allowedRoles.includes(requestedRole.toLowerCase())) {
    return requestedRole.toLowerCase();
  }
  return 'student';
}

const isDBConnected = () => (getSQLStatus && getSQLStatus()) || (getMongoStatus && getMongoStatus());

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, enrollment, branch, semester, whatsapp, division, academicYear } = req.body;

    if (!email || !name) return res.status(400).json({ error: 'Name and email are required' });
    if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    let passwordHash;
    if (bcrypt) {
      const salt = await bcrypt.genSalt(12);
      passwordHash = await bcrypt.hash(password, salt);
    } else {
      const crypto = require('crypto');
      passwordHash = 'sha256:' + crypto.createHash('sha256').update(password + 'bookbridge_salt_v1').digest('hex');
    }

    const userRole = assignRole(null);

    // MySQL Database Branch
    if (isDBConnected() && User && User.findOne) {
      const existing = await User.findOne({ where: { email } });
      if (existing) return res.status(400).json({ error: 'User account already exists' });

      const newUser = await User.create({
        name,
        email,
        passwordHash,
        enrollment: enrollment || null,
        branch: branch || 'CE',
        semester: parseInt(semester || 1),
        division: division || 'Div A',
        academicYear: academicYear || '2025-2026',
        whatsapp: whatsapp || '',
        role: userRole
      });

      const token = signToken({ id: newUser.id, role: newUser.role, email: newUser.email });
      const safeUser = newUser.get ? newUser.get({ plain: true }) : newUser;
      delete safeUser.passwordHash;

      return res.status(201).json({ token, user: safeUser });
    }

    // JSON Fallback Engine
    const db = readJSONDB();
    const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) return res.status(400).json({ error: 'User account already exists' });

    const newUser = {
      id: 'usr-' + Date.now(),
      name,
      enrollment: enrollment || '',
      email,
      passwordHash,
      branch: branch || 'CE',
      semester: parseInt(semester || 1),
      division: division || 'Div A',
      academicYear: academicYear || '2025-2026',
      whatsapp: whatsapp || '',
      role: userRole,
      createdAt: new Date().toISOString()
    };

    db.users.push(newUser);
    writeJSONDB(db);

    const token = signToken({ id: newUser.id, role: newUser.role, email: newUser.email });
    const { passwordHash: _h, ...safeUser } = newUser;
    res.status(201).json({ token, user: safeUser });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email) return res.status(400).json({ error: 'Email is required' });
    if (!password) return res.status(400).json({ error: 'Password is required' });

    // MySQL Database Branch
    if (isDBConnected() && User && User.findOne) {
      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      let passwordMatch = false;
      if (bcrypt && user.passwordHash) {
        passwordMatch = await bcrypt.compare(password, user.passwordHash);
      } else {
        const crypto = require('crypto');
        const hash = 'sha256:' + crypto.createHash('sha256').update(password + 'bookbridge_salt_v1').digest('hex');
        passwordMatch = (hash === user.passwordHash);
      }

      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const token = signToken({ id: user.id, role: user.role, email: user.email });
      const safeUser = user.get ? user.get({ plain: true }) : user;
      delete safeUser.passwordHash;
      return res.json({ token, user: safeUser });
    }

    // JSON Fallback Engine
    const db = readJSONDB();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    let passwordMatch = false;
    if (user.passwordHash) {
      if (bcrypt && user.passwordHash.startsWith('$2')) {
        passwordMatch = await bcrypt.compare(password, user.passwordHash);
      } else if (user.passwordHash.startsWith('sha256:')) {
        const crypto = require('crypto');
        const hash = 'sha256:' + crypto.createHash('sha256').update(password + 'bookbridge_salt_v1').digest('hex');
        passwordMatch = (hash === user.passwordHash);
      }
    }

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken({ id: user.id, role: user.role, email: user.email });
    const { passwordHash: _h, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (error) {
    next(error);
  }
};
