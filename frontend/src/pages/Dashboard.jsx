import databaseService from '../backend-services/database/database.js'
import React, { useEffect, useState } from 'react';
import { Plus, Building2, Users, Eye, TrendingUp, Calendar, Activity, Clock, BarChart3, MapPin, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux';

export default function Dashboard() {

  const userData = useSelector(state => state.auth.userData);

  const isAdmin = userData?.role === 'admin';
    
  const [dashboardData, setDashboardData] = useState({});
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate()
  
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        let data;
        if (userData.role === 'admin') {
          data = await databaseService.getDashboardViewForAdmin();
          console.log("dataForAdmin: ", data);
        } else {
          data = await databaseService.getDashboardViewForUser(userData?.id);
          console.log("dataForUser: ", data);
        }
        setDashboardData(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    if (userData?.role) {
      fetchDashboardData();
    }
    console.log('testing: ', userData)
  }, [userData]);

  const handleAddHotel = () => {
    console.log('Add Hotel clicked');
    navigate('/hotel/add')
  };

  const handleSeeAllHotels = () => {
    console.log('See All Hotels clicked');
    navigate('/hotels')
  };

  const handleManageUsers = () => {
    console.log('Manage Users clicked');
    navigate('/users')
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (activityType) => {
    switch (activityType) {
      case 'hotel_created':
        return <Building2 className="w-4 h-4 text-blue-500" />;
      case 'user_registered':
        return <User className="w-4 h-4 text-purple-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const summary = dashboardData?.dashboard?.summary || {};
  const recentActivities = dashboardData?.dashboard?.recentActivities || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Textile Hotel Marketing Hub
              </h1>
              <p className="text-slate-600 mt-2">
                {isAdmin ? 'Admin Dashboard - Manage your hotel network' : 'User Dashboard - Track your hotel activities'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-slate-500">Welcome back, {userData?.full_name || 'User'}</p>
                <p className="text-sm font-medium text-slate-700 capitalize">
                  {userData?.role || 'User'} Dashboard
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Actions - Different for Admin vs User */}
        <div className="mb-12">
          {isAdmin ? (
            // Admin Quick Actions
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <button
                onClick={handleAddHotel}
                className="group relative bg-white/70 backdrop-blur-sm hover:bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-slate-200 hover:border-indigo-300 rounded-3xl p-8 transition-all duration-300 hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-200"
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-blue-200 group-hover:from-indigo-200 group-hover:to-blue-300 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg">
                    <Plus className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Add New Hotel</h3>
                    <p className="text-slate-600">Register and onboard hotels</p>
                  </div>
                </div>
              </button>

              <button
                onClick={handleSeeAllHotels}
                className="group relative bg-white/70 backdrop-blur-sm hover:bg-gradient-to-br from-emerald-50 to-teal-100 border-2 border-slate-200 hover:border-emerald-300 rounded-3xl p-8 transition-all duration-300 hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-emerald-200"
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-200 group-hover:from-emerald-200 group-hover:to-teal-300 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg">
                    <Building2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Manage Hotels</h3>
                    <p className="text-slate-600">View and edit hotel listings</p>
                  </div>
                </div>
              </button>

              <button
                onClick={handleManageUsers}
                className="group relative bg-white/70 backdrop-blur-sm hover:bg-gradient-to-br from-purple-50 to-violet-100 border-2 border-slate-200 hover:border-purple-300 rounded-3xl p-8 transition-all duration-300 hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-200"
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-violet-200 group-hover:from-purple-200 group-hover:to-violet-300 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg">
                    <Users className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Manage Users</h3>
                    <p className="text-slate-600">View and manage user accounts</p>
                  </div>
                </div>
              </button>
            </div>
          ) : (
            // User Quick Actions
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">

                            <button
                onClick={handleAddHotel}
                className="group relative bg-white/70 backdrop-blur-sm hover:bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-slate-200 hover:border-indigo-300 rounded-3xl p-8 transition-all duration-300 hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-200"
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-blue-200 group-hover:from-indigo-200 group-hover:to-blue-300 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg">
                    <Plus className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Add New Hotel</h3>
                    <p className="text-slate-600">Register and onboard hotels</p>
                  </div>
                </div>
              </button>

              <button
                onClick={handleSeeAllHotels}
                className="group relative bg-white/70 backdrop-blur-sm hover:bg-gradient-to-br from-emerald-50 to-teal-100 border-2 border-slate-200 hover:border-emerald-300 rounded-3xl p-8 transition-all duration-300 hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-emerald-200"
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-teal-200 group-hover:from-emerald-200 group-hover:to-teal-300 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg">
                    <Building2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Manage Hotels</h3>
                    <p className="text-slate-600">View and edit hotel listings <b>you added</b></p>
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Key Metrics Grid - Different for Admin vs User */}
        {isAdmin ? (
          // Admin Metrics
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {/* Total Hotels */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/50">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-indigo-600" />
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  Total
                </span>
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-1">
                {summary.total_hotels || '0'}
              </div>
              <p className="text-slate-600 text-sm">Total Hotels</p>
              <div className="mt-3 text-xs text-emerald-600">
                +{summary.hotels_added_month || '0'} this month
              </div>
            </div>

            {/* Active Hotels */}
            {/* <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/50">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-200 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                  Active
                </span>
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-1">
                {summary.active_hotels || '0'}
              </div>
              <p className="text-slate-600 text-sm">Active Hotels</p>
              <div className="mt-3 text-xs text-slate-500">
                {summary.deleted_hotels || '0'} deleted
              </div>
            </div> */}

            {/* Total Users */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/50">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-violet-200 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                  Users
                </span>
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-1">
                {summary.total_users || '0'}
              </div>
              <p className="text-slate-600 text-sm">Registered Users</p>
              <div className="mt-3 text-xs text-emerald-600">
                +{summary.users_added_month || '0'} this month
              </div>
            </div>
          </div>
        ) : (
          // User Metrics
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* Hotels Available */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/50">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-indigo-600" />
                </div>
                {/* <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                  Available
                </span> */}
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-1">
                {summary.total_hotels || '0'}
              </div>
              <p className="text-slate-600 text-sm">Hotels Available</p>
              <div className="mt-3 text-xs text-emerald-600">
                +{summary.hotels_added_month || '0'} added this month
              </div>
            </div>

            {/* Active Hotels */}
            {/* <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-slate-200/50">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-200 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                  Active
                </span>
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-1">
                {summary.active_hotels || '0'}
              </div>
              <p className="text-slate-600 text-sm">Active Hotels</p>
              <div className="mt-3 text-xs text-slate-500">
                {summary.deleted_hotels || '0'} deleted
              </div>
            </div> */}
          </div>
        )}

        {/* Quick Stats Row - Role-specific */}
        {isAdmin ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center border border-slate-200/50">
              <div className="text-lg font-bold text-slate-800">{summary.hotels_added_week || '0'}</div>
              <div className="text-xs text-slate-600">Hotels This Week</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center border border-slate-200/50">
              <div className="text-lg font-bold text-slate-800">{summary.users_added_week || '0'}</div>
              <div className="text-xs text-slate-600">Users This Week</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center border border-slate-200/50">
              <div className="text-lg font-bold text-slate-800">{summary.hotels_added_today || '0'}</div>
              <div className="text-xs text-slate-600">Hotels Today</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center border border-slate-200/50">
              <div className="text-lg font-bold text-slate-800">{summary.hotels_added_week || '0'}</div>
              <div className="text-xs text-slate-600">New Hotels This Week</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 text-center border border-slate-200/50">
              <div className="text-lg font-bold text-slate-800">{summary.hotels_added_today || '0'}</div>
              <div className="text-xs text-slate-600">New Hotels Today</div>
            </div>
          </div>
        )}

        {/* Recent Activities */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-slate-200/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <Activity className="w-6 h-6 text-indigo-600" />
              Recent Activities
            </h3>
            <span className="text-sm text-slate-500">Last 24 hours</span>
          </div>
          
          <div className="space-y-4">
            {recentActivities.filter(activity => activity.activity_type !== 'hotel_visit').length > 0 ? (
              recentActivities.filter(activity => activity.activity_type !== 'hotel_visit').map((activity, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-slate-50/70 rounded-xl hover:bg-slate-100/70 transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    {getActivityIcon(activity.activity_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-800 font-medium">{activity.description}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {activity.item_name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(activity.activity_date)}
                      </span>
                      {isAdmin && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {activity.user_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No recent activities</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Stats */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            {isAdmin ? (
              <>
                Last hotel added: {formatDate(summary.last_hotel_added)} • 
                Last user registered: {formatDate(summary.last_user_registered)}
              </>
            ) : (
              <>
                Last hotel added: {formatDate(summary.last_hotel_added)}
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}