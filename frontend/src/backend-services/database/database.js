import env from '../../env/env';
import { toast } from "react-toastify";
import {authenticatedFetch} from '../fetchWrapper';

class DatabaseService {
  constructor() {
    this.baseUrl = env.backendUrl;
  }

  // ✅ Utility to get token
  getAuthHeaders(skipContentType = false) {
    const token = localStorage.getItem('authToken');
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    if (!skipContentType) {
      headers["Content-Type"] = "application/json";
    }
    return headers;
  }
  
  

  // ✅ Utility to handle responses globally
  async handleResponse(response) {
    const data = await response.json();
    console.log(data)

    if (response.status === 401) {
      localStorage.removeItem('authToken');
      toast("Session expired. Please log in again.");
      window.location.href = "/login"; // or use `navigate()` from router
    }

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    return data;
  }

  async getHotelById(id) {
    try {
      const response = await authenticatedFetch(`${this.baseUrl}/api/hotel/${id}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });
      console.log(response)
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error fetching hotel details:", error);
      throw error;
    }
  }

  async getDashboardView() {
    try {
      const response = await authenticatedFetch(`${this.baseUrl}/api/hotel-dashboard/get-view`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });
      console.log(response)
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error fetching dashboard view:", error);
      throw error;
    }
  }

  async addHotel(formData) {
    try {
      const response = await authenticatedFetch(`${this.baseUrl}/api/hotel`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(formData),
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error adding hotel:", error);
      throw error;
    }
  }

  async updateHotel(formData,id) {
    try {
      const response = await authenticatedFetch(`${this.baseUrl}/api/hotel/${id}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(formData),
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error updating hotel:", error);
      throw error;
    }
  }

  async deleteHotel(id) {
    try {
      const response = await authenticatedFetch(`${this.baseUrl}/api/hotel/${id}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });
      return this.handleResponse(response);
    } catch (error) {
      console.error("Error deleting hotel:", error);
      throw error;
    }
  }

  /**
 * Fetch all hotels with pagination, search, and filters
 * @param {Object} options - Options for fetching hotels
 * @param {number} options.page - Page number for pagination (default: 1)
 * @param {number} options.limit - Number of hotels per page (default: 10)
 * @param {string} options.search - Search term for name, address, or owner name
 * @param {string} options.created_by - Filter hotels by creator user ID
 * @param {string} options.sort_by - Field to sort by (created_at, updated_at, name, address, total_visits)
 * @param {string} options.sort_order - Sort order ('ASC' or 'DESC')
 * @param {boolean} options.include_deleted - Whether to include soft-deleted hotels
 * @returns {Promise<Object>} Paginated list of hotels
 */
async getHotels({
  page = 1,
  limit = 10,
  search = "",
  created_by = "",
  sort_by = "created_at",
  sort_order = "DESC",
  include_deleted = false
} = {}) {
  try {
    console.log("Fetching hotels with parameters:", {
      page,
      limit,
      search,
      created_by,
      sort_by,
      sort_order,
      include_deleted
    });

    // Build query parameters
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      search: search.trim(),
      created_by: created_by.trim(),
      sort_by,
      sort_order,
      include_deleted: include_deleted.toString()
    });

    // Send request to backend
    const response = await authenticatedFetch(
      `${this.baseUrl}/api/hotel?${queryParams.toString()}`,
      {
        method: "GET",
        headers: this.getAuthHeaders()
      }
    );

    // Parse and handle response
    const data = await this.handleResponse(response);

    console.log("Hotels fetched successfully:", {
      total: data.total,
      page: data.page,
      totalPages: data.totalPages,
      hotelsCount: data.hotels?.length || 0
    });

    return data; // Contains hotels array, pagination info, etc.
  } catch (error) {
    console.error("Error fetching hotels list:", error);
    throw error;
  }
}

}

const databaseService = new DatabaseService();
export default databaseService;