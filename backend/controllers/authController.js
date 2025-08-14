// authController.js
import { query } from '../services/dbClient.js';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/generateToken.js';

/**
 * LOGIN - Authenticate user and return JWT token
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Login attempt:', { email, password: '***' });

        // Get user from database
        const sql = `
            SELECT id, full_name, email, phone, password_hash, created_at
            FROM users
            WHERE email = $1
            LIMIT 1
        `;
        const result = await query(sql, [email.toLowerCase().trim()]);
        // console.log('Query result:', { 
        //     rowCount: result.rows.length, 
        //     userFound: result.rows.length > 0 
        // });

        if (result.rows.length === 0) {
            // console.log('No user found with email:', email);
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const user = result.rows[0];
        // console.log('User found:', { id: user.id, email: user.email });
        
        // Verify password
        // console.log('Comparing passwords...');
        const isValid = await bcrypt.compare(password, user.password_hash);
        // console.log('Password valid:', isValid);

        if (!isValid) {
            console.log('Password comparison failed');
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = generateToken(user.id);
        // console.log(token)

        return res.json({
            success: true,
            message: 'User logged in successfully',
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                created_at: user.created_at
            },
            token
        });

    } catch (err) {
        console.error('Login Error:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * GET USER - Get current user details from JWT token
 */
export const getUser = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Unauthorized - Invalid token' });
        }

        const sql = `
            SELECT id, full_name, email, phone, created_at
            FROM users
            WHERE id = $1
            LIMIT 1
        `;
        const result = await query(sql, [req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.json({
            success: true,
            user: result.rows[0]
        });

    } catch (err) {
        console.error('GetUser Error:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * UPDATE USER PROFILE - Allow users to update their own profile
 */
export const updateProfile = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { full_name, phone } = req.body;

        // Validate inputs
        if (!full_name || full_name.trim().length < 2) {
            return res.status(400).json({ message: 'Full name must be at least 2 characters long' });
        }

        if (phone && phone.trim() && !/^[\+]?[1-9][\d]{0,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''))) {
            return res.status(400).json({ message: 'Please provide a valid phone number' });
        }

        const sql = `
            UPDATE users 
            SET full_name = $1, phone = $2
            WHERE id = $3
            RETURNING id, full_name, email, phone, created_at
        `;

        const result = await query(sql, [
            full_name.trim(),
            phone ? phone.trim() : null,
            req.user.id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.json({
            success: true,
            message: 'Profile updated successfully',
            user: result.rows[0]
        });

    } catch (err) {
        console.error('Update Profile Error:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * CHANGE PASSWORD - Allow users to change their password
 */
export const changePassword = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const { current_password, new_password } = req.body;

        // Input validation
        if (!current_password || !new_password) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }

        if (new_password.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters long' });
        }

        // Get current user
        const getUserSql = `
            SELECT password_hash FROM users WHERE id = $1 LIMIT 1
        `;
        const userResult = await query(getUserSql, [req.user.id]);

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isValid = await bcrypt.compare(current_password, userResult.rows[0].password_hash);

        if (!isValid) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const saltRounds = 10;
        const newPasswordHash = await bcrypt.hash(new_password, saltRounds);

        // Update password
        const updateSql = `
            UPDATE users 
            SET password_hash = $1
            WHERE id = $2
            RETURNING id, full_name, email
        `;

        const result = await query(updateSql, [newPasswordHash, req.user.id]);

        return res.json({
            success: true,
            message: 'Password changed successfully',
            user: result.rows[0]
        });

    } catch (err) {
        console.error('Change Password Error:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * GET ALL USERS - Admin function to list all users
 */
export const getAllUsers = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            search = '' 
        } = req.query;

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
        const offset = (pageNum - 1) * limitNum;

        const params = [];
        const whereParts = [];

        // Search by name or email
        if (search.trim()) {
            params.push(`%${search.trim()}%`);
            whereParts.push(`(full_name ILIKE $${params.length} OR email ILIKE $${params.length})`);
        }

        const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

        // Count total
        const countSql = `SELECT COUNT(*) FROM users ${whereClause}`;
        const totalResult = await query(countSql, params);
        const total = parseInt(totalResult.rows[0].count, 10);

        // Get paginated results
        params.push(limitNum);
        params.push(offset);

        const sql = `
            SELECT 
                u.id, u.full_name, u.email, u.phone, u.created_at
                COUNT(h.id) as hotels_created,
                COUNT(v.id) as total_visits
            FROM users u
            LEFT JOIN hotels h ON u.id = h.created_by AND h.is_deleted = false
            LEFT JOIN visits v ON u.id = v.visited_by
            ${whereClause}
            GROUP BY u.id, u.full_name, u.email, u.phone, u.created_at
            ORDER BY u.created_at DESC
            LIMIT $${params.length - 1} OFFSET $${params.length}
        `;

        const result = await query(sql, params);

        return res.json({
            success: true,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
            users: result.rows
        });

    } catch (err) {
        console.error('Get All Users Error:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * Utility: Hash a password (for manual user creation)
 */
export const hashPassword = async (plainPassword) => {
    try {
        if (!plainPassword) {
            throw new Error('Password is required');
        }

        if (plainPassword.length < 6) {
            throw new Error('Password must be at least 6 characters long');
        }

        const saltRounds = 10;
        const hash = await bcrypt.hash(plainPassword, saltRounds);
        console.log(`Plain password: ${plainPassword}`);
        console.log(`Hashed password: ${hash}`);
        return hash;
    } catch (err) {
        console.error('Error hashing password:', err);
        throw err;
    }
};

/**
 * Utility: Create a new user manually (for admin use)
 * This is a utility function, not an endpoint
 */
export const createUserManually = async (userData) => {
    try {
        const { full_name, email, password, phone } = userData;

        // Validate inputs
        if (!full_name || !email || !password) {
            throw new Error('Full name, email, and password are required');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new Error('Invalid email format');
        }

        // Check if user already exists
        const checkSql = `SELECT id FROM users WHERE email = $1`;
        const existing = await query(checkSql, [email.toLowerCase().trim()]);
        
        if (existing.rows.length > 0) {
            throw new Error('User with this email already exists');
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Insert user
        const sql = `
            INSERT INTO users (full_name, email, password_hash, phone)
            VALUES ($1, $2, $3, $4)
            RETURNING id, full_name, email, phone, created_at
        `;

        const result = await query(sql, [
            full_name.trim(),
            email.toLowerCase().trim(),
            passwordHash,
            phone ? phone.trim() : null
        ]);

        console.log('User created successfully:', result.rows[0]);
        return result.rows[0];

    } catch (err) {
        console.error('Error creating user:', err);
        throw err;
    }
};