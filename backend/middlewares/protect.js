// protect.js
import jwt from 'jsonwebtoken';
import { query } from '../services/dbClient.js';

export const protect = async (req, res, next) => {
    try {
        let token;

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer')
        ) {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (!decoded || !decoded.id) {
                return res.status(401).json({ message: 'Not authorized, token failed' });
            }

            // Get the user from DB
            const result = await query('SELECT id, full_name, email, phone, created_at FROM users WHERE id = $1 AND is_deleted = false', [decoded.id]);

            if (result.rows.length === 0) {
                return res.status(401).json({ message: 'User not found' });
            }

            req.user = result.rows[0]; // Attach user data to request
            return next();
        }

        return res.status(401).json({ message: 'Not authorized, no token' });

    } catch (error) {
        console.error('Auth Middleware Error:', error);
        return res.status(401).json({ message: 'Not authorized, token failed' });
    }
};
