import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Search, Plus, Edit2, Trash2, Eye, EyeOff, Save, X, Users, UserPlus, Filter, RefreshCw, Phone, Mail, Calendar, RotateCcw, UserCheck } from 'lucide-react';
import LoadingScreen from '../components/LoadingScreen';
import databaseService from '../backend-services/database/database';

function ManageUsers() {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDeleted, setShowDeleted] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    phone: ''
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const userData = useSelector(state => state.auth.userData);
  const isAdmin = userData?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await databaseService.getAllUsers();
      const data = response?.data;
      console.log(data);
      const usersArray = Array.isArray(data) ? data : [];
      setUsers(usersArray);
      setFilteredUsers(usersArray);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      setFilteredUsers([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!Array.isArray(users)) {
      setFilteredUsers([]);
      return;
    }
    
    let filtered = users.filter(user => {
      const matchesSearch = 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone?.includes(searchTerm);
      
      const matchesDeletedFilter = showDeleted ? user.is_deleted : !user.is_deleted;
      
      return matchesSearch && matchesDeletedFilter;
    });
    
    setFilteredUsers(filtered);
  }, [users, searchTerm, showDeleted]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!editingUser && !formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (!editingUser && formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone number must be 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateUser = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      await databaseService.createUser({
        ...formData,
        password_hash: formData.password,
        role: 'user' // Default role
      });
      await fetchUsers();
      resetForm();
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating user:', error);
      if (error.message.includes('email')) {
        setErrors({ email: 'Email already exists' });
      }
    }
    setLoading(false);
  };

  const handleUpdateUser = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password;
      }
      
      await databaseService.updateUser(editingUser.id, updateData);
      await fetchUsers();
      resetForm();
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      if (error.message.includes('email')) {
        setErrors({ email: 'Email already exists' });
      }
    }
    setLoading(false);
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    setLoading(true);
    try {
      await databaseService.deleteUser(id);
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
    setLoading(false);
  };

  const handleRecoverUser = async (id) => {
    if (!confirm('Are you sure you want to recover this user?')) return;
    
    setLoading(true);
    try {
      await databaseService.recoverUser(id);
      await fetchUsers();
    } catch (error) {
      console.error('Error recovering user:', error);
    }
    setLoading(false);
  };

  const startEdit = (user) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name,
      email: user.email,
      password: '',
      phone: user.phone || ''
    });
    setErrors({});
    setShowCreateForm(false);
    setShowPassword(false);
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      password: '',
      phone: ''
    });
    setErrors({});
    setShowPassword(false);
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setShowCreateForm(false);
    resetForm();
  };

  if (loading && users.length === 0) {
    return <LoadingScreen />;
  }

  const activeUsers = Array.isArray(users) ? users.filter(u => !u.is_deleted).length : 0;
  const deletedUsers = Array.isArray(users) ? users.filter(u => u.is_deleted).length : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  User Management
                </h1>
              </div>
              <p className="text-gray-600 text-lg">Manage and organize all users in your system</p>
            </div>
            
            {/* Stats Cards */}
            <div className="flex flex-wrap gap-4">
              <div className="bg-white rounded-2xl px-6 py-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="text-sm text-gray-500 font-medium">Active Users</div>
                <div className="text-3xl font-bold text-emerald-600 flex items-center gap-2">
                  {activeUsers}
                  <UserCheck className="w-6 h-6" />
                </div>
              </div>
              <div className="bg-white rounded-2xl px-6 py-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <div className="text-sm text-gray-500 font-medium">Deleted Users</div>
                <div className="text-3xl font-bold text-red-600 flex items-center gap-2">
                  {deletedUsers}
                  <Trash2 className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-14 pr-6 py-4 border-2 outline-none border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 placeholder-gray-400 bg-white/50 backdrop-blur-sm text-lg"
              />
            </div>
            
            {/* Filters & Actions */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 bg-gray-50/80 backdrop-blur-sm rounded-2xl px-5 py-4 border border-gray-200">
                <Filter className="w-5 h-5 text-gray-500" />
                <input
                  type="checkbox"
                  id="showDeleted"
                  checked={showDeleted}
                  onChange={(e) => setShowDeleted(e.target.checked)}
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 outline-none rounded-lg focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="showDeleted" className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Show deleted
                </label>
              </div>
              
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="p-4 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 rounded-2xl transition-all duration-300 disabled:opacity-50 backdrop-blur-sm"
                title="Refresh"
              >
                <RefreshCw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={() => {
                  setShowCreateForm(true);
                  setEditingUser(null);
                  resetForm();
                }}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white px-8 py-4 rounded-2xl flex items-center gap-3 font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <UserPlus className="w-5 h-5" />
                Add User
              </button>
            </div>
          </div>
        </div>

        {/* Users Grid */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50/80 to-white/80 backdrop-blur-sm">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                All Users ({Array.isArray(filteredUsers) ? filteredUsers.length : 0})
              </h2>
              {loading && (
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  Loading...
                </div>
              )}
            </div>
          </div>

          {!Array.isArray(filteredUsers) || filteredUsers.length === 0 ? (
            <div className="px-8 py-20 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No users found</h3>
              <p className="text-gray-500 text-lg">
                {!Array.isArray(users) || users.length === 0 
                  ? 'Get started by creating your first user.' 
                  : 'Try adjusting your search or filters.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200/50">
              {filteredUsers.map((user) => (
                <div key={user.id} className={`p-6 hover:bg-gray-50/50 transition-all duration-300 ${user.is_deleted ? 'bg-red-50/30' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="flex-shrink-0">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg">
                          <span className="text-xl font-bold text-white">
                            {user.full_name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <p className={`text-xl font-bold truncate ${user.is_deleted ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {user.full_name}
                          </p>
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800' 
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {user.role}
                          </span>
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                            user.is_deleted
                              ? 'bg-red-100 text-red-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {user.is_deleted ? 'Deleted' : 'Active'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-blue-500" />
                            <span className="font-medium">{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-emerald-500" />
                              <span className="font-medium">{user.phone}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-indigo-500" />
                            <span className="font-medium">
                              {new Date(user.created_at).toLocaleDateString('en-IN', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!user.is_deleted ? (
                        <>
                          <button
                            onClick={() => startEdit(user)}
                            className="p-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-105"
                            title="Edit user"
                          >
                            <Edit2 className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-105"
                            title="Delete user"
                            disabled={loading}
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRecoverUser(user.id)}
                            className="p-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-all duration-200 hover:scale-105"
                            title="Recover user"
                            disabled={loading}
                          >
                            <RotateCcw className="w-5 h-5" />
                          </button>
                          {user.deleted_at && (
                            <div className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-lg font-medium">
                              Deleted: {new Date(user.deleted_at).toLocaleDateString('en-IN')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full Screen Modal for Create/Edit Form */}
      {(showCreateForm || editingUser) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white rounded-t-3xl border-b border-gray-200 px-8 py-6 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  {editingUser ? <Edit2 className="w-6 h-6 text-white" /> : <UserPlus className="w-6 h-6 text-white" />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingUser ? 'Edit User' : 'Create New User'}
                  </h2>
                  <p className="text-gray-500">
                    {editingUser ? 'Update user information' : 'Add a new user to your system'}
                  </p>
                </div>
              </div>
              <button
                onClick={cancelEdit}
                className="text-gray-400 hover:text-gray-600 p-3 hover:bg-gray-100 rounded-2xl transition-all duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="px-8 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className={`w-full px-6 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-blue-500/20 outline-none focus:border-blue-500 transition-all duration-300 text-lg ${
                      errors.full_name ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="Enter full name"
                  />
                  {errors.full_name && <p className="text-red-500 text-sm font-medium">{errors.full_name}</p>}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full pl-14 pr-6 py-4 border-2 rounded-2xl focus:ring-4 outline-none focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-lg ${
                        errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                      placeholder="Enter email address"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-sm font-medium">{errors.email}</p>}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Password {editingUser ? '(leave blank to keep current)' : '*'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className={`w-full px-6 pr-14 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-blue-500/20 outline-none focus:border-blue-500 transition-all duration-300 text-lg ${
                        errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                      placeholder={editingUser ? "Enter new password" : "Enter password"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-sm font-medium">{errors.password}</p>}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-semibold text-gray-700">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={`w-full pl-14 pr-6 py-4 border-2 rounded-2xl focus:ring-4 outline-none focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-lg ${
                        errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-200'
                      }`}
                      placeholder="Enter phone number"
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-sm font-medium">{errors.phone}</p>}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 rounded-b-3xl px-8 py-6 border-t border-gray-200 flex justify-end gap-4">
              <button
                onClick={cancelEdit}
                className="px-8 py-4 text-gray-700 bg-white hover:bg-gray-100 rounded-2xl font-semibold transition-all duration-200 border-2 border-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={editingUser ? handleUpdateUser : handleCreateUser}
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white px-8 py-4 rounded-2xl flex items-center gap-3 font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                <Save className="w-5 h-5" />
                {editingUser ? 'Update User' : 'Create User'}
                {loading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageUsers;