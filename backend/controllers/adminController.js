// adminController.js
import { query } from '../services/dbClient.js';
import bcrypt from 'bcrypt';

// Get all users (includes deleted users)
export const getAllUsers = async (req, res) => {
    try {
        const sql = `
            SELECT 
                id, 
                full_name, 
                email, 
                phone, 
                role, 
                is_deleted, 
                deleted_at, 
                created_at
            FROM users
            WHERE role <> 'admin'
            ORDER BY created_at DESC
        `;
        
        const result = await query(sql);
        
        return res.json({
            success: true,
            message: 'Users fetched successfully',
            data: result.rows,
            count: result.rows.length
        });

    } catch (err) {
        console.error('Get All Users Error:', err);
        return res.status(500).json({ 
            success: false,
            message: 'Internal Server Error' 
        });
    }
};

export const getHotelsForExport = async (req, res) => {
  try {
    const sql = `
      SELECT 
        id,
        name,
        address,
        latitude,
        longitude,
        location_fetched_at,
        hotel_email,
        gst_number,
        owner_name,
        owner_phone,
        owner_alt_phone,
        contact_person_name,
        contact_person_phone,
        contact_person_alt_phone,
        created_at,
        updated_at
      FROM hotels
      WHERE is_deleted = false
      ORDER BY created_at DESC
    `;

    const result = await query(sql);

    return res.json({
      success: true,
      message: 'Hotels fetched successfully',
      data: result.rows,
      count: result.rows.length
    });

  } catch (err) {
    console.error('Get Hotels For Export Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error'
    });
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid user ID' 
            });
        }

        const sql = `
            SELECT 
                id, 
                full_name, 
                email, 
                phone, 
                role, 
                is_deleted, 
                deleted_at, 
                created_at
            FROM users
            WHERE id = $1
            LIMIT 1
        `;
        
        const result = await query(sql, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        return res.json({
            success: true,
            message: 'User fetched successfully',
            data: result.rows[0]
        });

    } catch (err) {
        console.error('Get User By ID Error:', err);
        return res.status(500).json({ 
            success: false,
            message: 'Internal Server Error' 
        });
    }
};

// Create new user
export const createUser = async (req, res) => {
    try {
        const { full_name, email, password, phone, role = 'user' } = req.body;

        // Validation
        if (!full_name || !email || !password) {
            return res.status(400).json({ 
                success: false,
                message: 'Full name, email, and password are required' 
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid email format' 
            });
        }

        // Password validation
        if (password.length < 6) {
            return res.status(400).json({ 
                success: false,
                message: 'Password must be at least 6 characters long' 
            });
        }

        // Phone validation (if provided)
        if (phone && !/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
            return res.status(400).json({ 
                success: false,
                message: 'Phone number must be 10 digits' 
            });
        }

        // Role validation
        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ 
                success: false,
                message: 'Role must be either "user" or "admin"' 
            });
        }

        // Check if email already exists
        const emailCheckSql = `
            SELECT id FROM users 
            WHERE email = $1 AND is_deleted = false
            LIMIT 1
        `;
        const emailCheck = await query(emailCheckSql, [email.toLowerCase().trim()]);

        if (emailCheck.rows.length > 0) {
            return res.status(409).json({ 
                success: false,
                message: 'Email already exists' 
            });
        }

        // Hash password
        const saltRounds = 12;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Insert new user
        const insertSql = `
            INSERT INTO users (full_name, email, password_hash, phone, role)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, full_name, email, phone, role, created_at
        `;
        
        const result = await query(insertSql, [
            full_name.trim(),
            email.toLowerCase().trim(),
            password_hash,
            phone ? phone.trim() : null,
            role
        ]);

        return res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: result.rows[0]
        });

    } catch (err) {
        console.error('Create User Error:', err);
        
        // Handle unique constraint violation
        if (err.code === '23505' && err.constraint === 'users_email_key') {
            return res.status(409).json({ 
                success: false,
                message: 'Email already exists' 
            });
        }
        
        return res.status(500).json({ 
            success: false,
            message: 'Internal Server Error' 
        });
    }
};

// Update user
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, email, password, phone, role } = req.body;

        if (!id || isNaN(id)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid user ID' 
            });
        }

        // Check if user exists and is not deleted
        const userCheckSql = `
            SELECT id, email FROM users 
            WHERE id = $1 AND is_deleted = false
            LIMIT 1
        `;
        const userCheck = await query(userCheckSql, [id]);

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found or has been deleted' 
            });
        }

        // Validation
        if (!full_name || !email) {
            return res.status(400).json({ 
                success: false,
                message: 'Full name and email are required' 
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid email format' 
            });
        }

        // Password validation (if provided)
        if (password && password.length < 6) {
            return res.status(400).json({ 
                success: false,
                message: 'Password must be at least 6 characters long' 
            });
        }

        // Phone validation (if provided)
        if (phone && !/^\d{10}$/.test(phone.replace(/\D/g, ''))) {
            return res.status(400).json({ 
                success: false,
                message: 'Phone number must be 10 digits' 
            });
        }

        // Role validation
        if (role && !['user', 'admin'].includes(role)) {
            return res.status(400).json({ 
                success: false,
                message: 'Role must be either "user" or "admin"' 
            });
        }

        // Check if email already exists for other users
        if (email.toLowerCase().trim() !== userCheck.rows[0].email) {
            const emailCheckSql = `
                SELECT id FROM users 
                WHERE email = $1 AND id != $2 AND is_deleted = false
                LIMIT 1
            `;
            const emailCheck = await query(emailCheckSql, [email.toLowerCase().trim(), id]);

            if (emailCheck.rows.length > 0) {
                return res.status(409).json({ 
                    success: false,
                    message: 'Email already exists' 
                });
            }
        }

        // Prepare update query
        let updateFields = [];
        let updateValues = [];
        let paramCount = 0;

        updateFields.push(`full_name = $${++paramCount}`);
        updateValues.push(full_name.trim());

        updateFields.push(`email = $${++paramCount}`);
        updateValues.push(email.toLowerCase().trim());

        if (phone !== undefined) {
            updateFields.push(`phone = $${++paramCount}`);
            updateValues.push(phone ? phone.trim() : null);
        }

        if (role) {
            updateFields.push(`role = $${++paramCount}`);
            updateValues.push(role);
        }

        // Handle password update
        if (password) {
            const saltRounds = 12;
            const password_hash = await bcrypt.hash(password, saltRounds);
            updateFields.push(`password_hash = $${++paramCount}`);
            updateValues.push(password_hash);
        }

        // Add user ID as last parameter
        updateValues.push(id);

        const updateSql = `
            UPDATE users 
            SET ${updateFields.join(', ')}
            WHERE id = $${++paramCount}
            RETURNING id, full_name, email, phone, role, created_at
        `;

        const result = await query(updateSql, updateValues);

        return res.json({
            success: true,
            message: 'User updated successfully',
            data: result.rows[0]
        });

    } catch (err) {
        console.error('Update User Error:', err);
        
        // Handle unique constraint violation
        if (err.code === '23505' && err.constraint === 'users_email_key') {
            return res.status(409).json({ 
                success: false,
                message: 'Email already exists' 
            });
        }
        
        return res.status(500).json({ 
            success: false,
            message: 'Internal Server Error' 
        });
    }
};

// Soft delete user
export const softDeleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid user ID' 
            });
        }

        // Check if user exists and is not already deleted
        const userCheckSql = `
            SELECT id, full_name, email, is_deleted FROM users 
            WHERE id = $1
            LIMIT 1
        `;
        const userCheck = await query(userCheckSql, [id]);

        if (userCheck.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        const user = userCheck.rows[0];

        if (user.is_deleted) {
            return res.status(400).json({ 
                success: false,
                message: 'User is already deleted' 
            });
        }

        // Prevent self-deletion
        if (req.user.id === parseInt(id)) {
            return res.status(400).json({ 
                success: false,
                message: 'You cannot delete your own account' 
            });
        }

        // Soft delete the user
        const deleteSql = `
            UPDATE users 
            SET 
                is_deleted = true,
                deleted_at = CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'
            WHERE id = $1
            RETURNING id, full_name, email, is_deleted, deleted_at
        `;

        const result = await query(deleteSql, [id]);

        return res.json({
            success: true,
            message: `User "${user.full_name}" deleted successfully`,
            data: result.rows[0]
        });

    } catch (err) {
        console.error('Soft Delete User Error:', err);
        return res.status(500).json({ 
            success: false,
            message: 'Internal Server Error' 
        });
    }
};

// Recover soft-deleted user
export const recoverUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        // Check if user exists and is currently deleted
        const userCheckSql = `
            SELECT id, full_name, email, is_deleted FROM users 
            WHERE id = $1
            LIMIT 1
        `;
        const userCheck = await query(userCheckSql, [id]);

        if (userCheck.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = userCheck.rows[0];

        if (!user.is_deleted) {
            return res.status(400).json({
                success: false,
                message: 'User is not deleted, so recovery is not needed'
            });
        }

        // Recover the user
        const recoverSql = `
            UPDATE users 
            SET 
                is_deleted = false,
                deleted_at = NULL
            WHERE id = $1
            RETURNING id, full_name, email, is_deleted, deleted_at
        `;

        const result = await query(recoverSql, [id]);

        return res.json({
            success: true,
            message: `User "${user.full_name}" recovered successfully`,
            data: result.rows[0]
        });

    } catch (err) {
        console.error('Recover User Error:', err);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
};
