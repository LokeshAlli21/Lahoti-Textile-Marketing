// hotelController.js
import { query } from '../services/dbClient.js';

/**
 * Add a new hotel
 * All timestamps are handled automatically by database triggers
 */
export const addHotel = async (req, res) => {
    try {
        const {
            name,
            address,
            latitude,
            longitude,
            hotel_email,
            owner_name,
            owner_phone,
            owner_alt_phone,
            contact_person_name,
            contact_person_phone,
            contact_person_alt_phone,
            state,
            city,
            pincode,
            category,
            gst_number
        } = req.body;

        console.log(req.body)

        // Validate required fields
        if (!name || !latitude || !longitude) {
            return res.status(400).json({ 
                message: 'Hotel name, latitude, and longitude are required' 
            });
        }

        if(!category){
            return res.status(400).json({ 
                message: 'category is required' 
            });
        }

        // Validate latitude and longitude ranges
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            return res.status(400).json({ 
                message: 'Invalid latitude or longitude values' 
            });
        }

        const sql = `
            INSERT INTO hotels (
                name, address, latitude, longitude,
                hotel_email,
                owner_name, owner_phone, owner_alt_phone,
                contact_person_name, contact_person_phone, contact_person_alt_phone,
                gst_number, state, city, pincode, category,
                created_by
            )
            VALUES (
                $1, $2, $3, $4,
                $5,
                $6, $7, $8,
                $9, $10, $11,
                $12, $13, $14, $15, $16,
                $17
            )
            RETURNING *
        `;

        const result = await query(sql, [
            name, address, latitude, longitude,
            hotel_email,
            owner_name, owner_phone, owner_alt_phone,
            contact_person_name, contact_person_phone, contact_person_alt_phone, gst_number, state,
            city,
            pincode,
            category,
            req.user?.id || null
        ]);

        res.status(201).json({
            success: true,
            message: 'Hotel added successfully',
            hotel: result.rows[0]
        });
    } catch (error) {
        console.error('Add Hotel Error:', error);
        
        // Handle unique constraint violations
        if (error.code === '23505') {
            return res.status(409).json({ message: 'Hotel with this information already exists' });
        }
        
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * Update hotel details
 * updated_at and location_fetched_at are handled automatically by triggers
 */
export const updateHotel = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate hotel ID
        if (!id || isNaN(id)) {
            return res.status(400).json({ message: 'Valid hotel ID is required' });
        }

        const fields = [
            'name', 'address', 'latitude', 'longitude', 'hotel_email',
            'owner_name', 'owner_phone', 'owner_alt_phone',
            'contact_person_name', 'contact_person_phone', 'contact_person_alt_phone', "gst_number",'state',
            'city',
            'pincode',
            'category',
        ];

        // Build dynamic update query
        const updates = [];
        const values = [];
        let index = 1;

        for (const field of fields) {
            if (req.body[field] !== undefined) {
                // Validate latitude and longitude if being updated
                if (field === 'latitude' || field === 'longitude') {
                    const value = parseFloat(req.body[field]);
                    if (isNaN(value) || 
                        (field === 'latitude' && (value < -90 || value > 90)) ||
                        (field === 'longitude' && (value < -180 || value > 180))) {
                        return res.status(400).json({ 
                            message: `Invalid ${field} value` 
                        });
                    }
                }
                
                updates.push(`${field} = $${index}`);
                values.push(req.body[field]);
                index++;
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        values.push(id); // Add ID to values
        const sql = `
            UPDATE hotels 
            SET ${updates.join(', ')} 
            WHERE id = $${index} AND is_deleted = false 
            RETURNING *
        `;

        const result = await query(sql, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Hotel not found or already deleted' });
        }

        res.json({
            success: true,
            message: 'Hotel updated successfully',
            hotel: result.rows[0]
        });
    } catch (error) {
        console.error('Update Hotel Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * Get a single hotel by ID with additional information
 */
export const getHotelById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate hotel ID
        if (!id || isNaN(id)) {
            return res.status(400).json({ message: 'Valid hotel ID is required' });
        }

        const sql = `
            SELECT h.*, 
                   u.full_name as created_by_name,
                   u.email as created_by_email,
                   COUNT(v.id) as total_visits,
                   MAX(v.visit_date) as last_visit_date
            FROM hotels h
            LEFT JOIN users u ON h.created_by = u.id
            LEFT JOIN visits v ON h.id = v.hotel_id
            WHERE h.id = $1 AND h.is_deleted = false
            GROUP BY h.id, u.full_name, u.email
            LIMIT 1
        `;
        
        const result = await query(sql, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Hotel not found or has been deleted' });
        }

        res.json({
            success: true,
            hotel: result.rows[0]
        });
    } catch (error) {
        console.error('Get Hotel By ID Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * Fetch all hotels with pagination, search, and filters
 * Role-based access: Admin sees all, Users see only their created hotels
 */
export const getHotels = async (req, res) => {
    try {
        const {
            search = '',           // search term
            page = 1,             // page number
            limit = 10,           // per page
            created_by = '',      // filter by creator
            sort_by = 'created_at', // sort field
            sort_order = 'DESC',  // sort order
            include_deleted = 'false', // include soft deleted hotels
            user_id             // user ID from req.query
        } = req.query;

        // Validate user_id
        if (!user_id || isNaN(parseInt(user_id))) {
            return res.status(400).json({ 
                success: false,
                message: 'User ID is required and must be valid' 
            });
        }

        const userId = parseInt(user_id);

        // Get user role from database
        const userRoleQuery = `SELECT role FROM users WHERE id = $1`;
        const userRoleResult = await query(userRoleQuery, [userId]);
        
        if (userRoleResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        const userRole = userRoleResult.rows[0].role;

        // Validate pagination parameters
        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10)); // Max 100 per page
        const offset = (pageNum - 1) * limitNum;

        // Validate sort parameters
        const allowedSortFields = ['created_at', 'updated_at', 'name', 'address', 'total_visits'];
        const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
        const sortOrder = sort_order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        const params = [];
        const whereParts = [];

        // Handle soft deleted hotels filter
        if (include_deleted === 'true') {
            // Include all hotels (deleted and non-deleted)
        } else {
            whereParts.push(`h.is_deleted = false`);
        }

        // Role-based access control
        if (userRole !== 'admin') {
            // Non-admin users can only see hotels they created
            params.push(userId);
            whereParts.push(`h.created_by = $${params.length}`);
        }
        // If user is admin, they can see all hotels (no additional filter)

        // Search by name, address, or owner name
        if (search.trim()) {
            params.push(`%${search.trim()}%`);
            whereParts.push(`(
                h.name ILIKE $${params.length} OR 
                h.address ILIKE $${params.length} OR 
                h.owner_name ILIKE $${params.length}
            )`);
        }

        // Filter by creator (only if admin is making this filter request)
        if (created_by.trim() && userRole === 'admin') {
            params.push(created_by);
            whereParts.push(`h.created_by = $${params.length}`);
        }

        // Final WHERE clause
        const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

        // Count total for pagination
        const countSql = `
            SELECT COUNT(DISTINCT h.id) 
            FROM hotels h
            LEFT JOIN users u ON h.created_by = u.id
            ${whereClause}
        `;
        const totalResult = await query(countSql, params);
        const total = parseInt(totalResult.rows[0].count, 10);

        // Pagination params
        params.push(limitNum);
        params.push(offset);

        // Fetch paginated results with additional info
        const sql = `
            SELECT h.*, 
                   u.full_name as created_by_name,
                   u.email as created_by_email,
                   COUNT(v.id) as total_visits,
                   MAX(v.visit_date) as last_visit_date
            FROM hotels h
            LEFT JOIN users u ON h.created_by = u.id
            LEFT JOIN visits v ON h.id = v.hotel_id
            ${whereClause}
            GROUP BY h.id, u.full_name, u.email
            ORDER BY ${sortField === 'total_visits' ? 'total_visits' : 'h.' + sortField} ${sortOrder}
            LIMIT $${params.length - 1} OFFSET $${params.length}
        `;

        const result = await query(sql, params);

        res.json({
            success: true,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
            hotels: result.rows,
            userRole: userRole // Include user role in response for frontend reference
        });
    } catch (error) {
        console.error('Get Hotels Error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal Server Error' 
        });
    }
};

/**
 * Soft delete a hotel
 * deleted_at timestamp is handled automatically by trigger
 */
export const softDeleteHotel = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate hotel ID
        if (!id || isNaN(id)) {
            return res.status(400).json({ message: 'Valid hotel ID is required' });
        }

        // Check if hotel exists and not already deleted
        const checkHotel = await query(
            `SELECT id FROM hotels WHERE id = $1 AND is_deleted = false`,
            [id]
        );

        if (checkHotel.rows.length === 0) {
            return res.status(404).json({ 
                message: "Hotel not found or already deleted" 
            });
        }

        // Mark hotel as deleted (trigger will set deleted_at automatically)
        const result = await query(
            `UPDATE hotels 
             SET is_deleted = true
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        res.json({ 
            success: true,
            message: "Hotel deleted successfully",
            hotel: result.rows[0]
        });
    } catch (error) {
        console.error("Error deleting hotel:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getDashboardViewForAdmin = async (req, res) => {

    try {
        // Query for dashboard summary
        const dashboardSummaryQuery = `
            SELECT * FROM dashboard_summary
        `;
        
        // Query for recent activities  
        const recentActivitiesQuery = `
            SELECT * FROM recent_activities
            LIMIT 10
        `;

        // Execute both queries concurrently
        const [summaryResult, activitiesResult] = await Promise.all([
            query(dashboardSummaryQuery),
            query(recentActivitiesQuery)
        ]);

        // Structure the response data
        const dashboardData = {
            summary: summaryResult.rows[0] || null,
            recentActivities: activitiesResult.rows || []
        };

        res.json({
            success: true,
            dashboard: dashboardData
        });

    } catch (error) {
        console.error('Get Dashboard View Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

export const getDashboardViewForUser = async (req, res) => {
    const { id } = req.params;

    try {
        // Validate user ID
        if (!id || isNaN(parseInt(id))) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid user ID provided' 
            });
        }

        const userId = parseInt(id);

        // Query for user-specific dashboard summary
        const dashboardSummaryQuery = `
            SELECT * FROM get_user_dashboard_summary($1)
        `;
        
        // Direct query for user-specific recent activities (last 7 days)
        const recentActivitiesQuery = `
            (
                SELECT 
                    'hotel_created' as activity_type,
                    h.name as item_name,
                    u.full_name as user_name,
                    h.created_at as activity_date,
                    'You created hotel "' || h.name || '"' as description
                FROM hotels h
                JOIN users u ON h.created_by = u.id
                WHERE h.created_by = $1
                  AND h.created_at >= CURRENT_DATE - INTERVAL '7 days'
                  AND h.is_deleted = false
            )
            UNION ALL
            (
                SELECT 
                    'hotel_visit' as activity_type,
                    h.name as item_name,
                    u.full_name as user_name,
                    v.visit_date as activity_date,
                    'You visited "' || h.name || '"' as description
                FROM visits v
                JOIN hotels h ON v.hotel_id = h.id
                JOIN users u ON v.visited_by = u.id
                WHERE v.visited_by = $1
                  AND v.visit_date >= CURRENT_DATE - INTERVAL '7 days'
            )
            ORDER BY activity_date DESC
            LIMIT 10
        `;

        // Execute both queries concurrently
        const [summaryResult, activitiesResult] = await Promise.all([
            query(dashboardSummaryQuery, [userId]),
            query(recentActivitiesQuery, [userId])
        ]);

        // Structure the response data
        const dashboardData = {
            summary: summaryResult.rows[0] || null,
            recentActivities: activitiesResult.rows || []
        };

        res.json({
            success: true,
            dashboard: dashboardData
        });

    } catch (error) {
        console.error('Get Dashboard View Error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal Server Error' 
        });
    }
};

/**
 * Restore a soft deleted hotel
 * deleted_at is cleared automatically by trigger when is_deleted = false
 */
export const restoreHotel = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate hotel ID
        if (!id || isNaN(id)) {
            return res.status(400).json({ message: 'Valid hotel ID is required' });
        }

        // Check if hotel exists and is deleted
        const checkHotel = await query(
            `SELECT id FROM hotels WHERE id = $1 AND is_deleted = true`,
            [id]
        );

        if (checkHotel.rows.length === 0) {
            return res.status(404).json({ 
                message: "Deleted hotel not found" 
            });
        }

        // Restore hotel (trigger will clear deleted_at automatically)
        const result = await query(
            `UPDATE hotels 
             SET is_deleted = false
             WHERE id = $1
             RETURNING *`,
            [id]
        );

        res.json({ 
            success: true,
            message: "Hotel restored successfully",
            hotel: result.rows[0]
        });
    } catch (error) {
        console.error("Error restoring hotel:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * Get hotels with their visit statistics
 */
export const getHotelStats = async (req, res) => {
    try {
        const sql = `
            SELECT 
                h.id,
                h.name,
                h.address,
                h.latitude,
                h.longitude,
                h.created_at,
                h.updated_at,
                h.location_fetched_at,
                u.full_name as created_by_name,
                COUNT(v.id) as total_visits,
                MAX(v.visit_date) as last_visit_date,
                MIN(v.visit_date) as first_visit_date,
                COUNT(DISTINCT v.visited_by) as unique_visitors
            FROM hotels h
            LEFT JOIN users u ON h.created_by = u.id
            LEFT JOIN visits v ON h.id = v.hotel_id
            WHERE h.is_deleted = false
            GROUP BY h.id, h.name, h.address, h.latitude, h.longitude, 
                     h.created_at, h.updated_at, h.location_fetched_at, u.full_name
            ORDER BY total_visits DESC, h.created_at DESC
        `;

        const result = await query(sql);

        res.json({
            success: true,
            hotels: result.rows
        });
    } catch (error) {
        console.error('Get Hotel Stats Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

/**
 * Get recently updated hotels
 */
export const getRecentlyUpdatedHotels = async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

        const sql = `
            SELECT 
                h.*,
                u.full_name as created_by_name,
                COUNT(v.id) as total_visits
            FROM hotels h
            LEFT JOIN users u ON h.created_by = u.id
            LEFT JOIN visits v ON h.id = v.hotel_id
            WHERE h.is_deleted = false
            GROUP BY h.id, u.full_name
            ORDER BY h.updated_at DESC
            LIMIT $1
        `;

        const result = await query(sql, [limitNum]);

        res.json({
            success: true,
            hotels: result.rows
        });
    } catch (error) {
        console.error('Get Recently Updated Hotels Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};