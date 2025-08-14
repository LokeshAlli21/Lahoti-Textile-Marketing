import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';
import authService from '../backend-services/auth/auth';
import { useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';

function LogoutButton() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (!confirmLogout) return; // If user cancels, stop here

    try {
      const response = await authService.logout();

      if (response) {
        dispatch(logout());
        navigate('/login');
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
<div className="overflow-hidden">
  <button
    onClick={handleLogout}
    className="group relative flex items-center justify-center gap-2 px-4 py-2 
               bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg 
               hover:from-red-600 hover:to-red-700 transition-all duration-300 
               hover:shadow-lg shadow-red-500/25 font-medium"
  >
    <FiLogOut className="text-lg group-hover:rotate-12 transition-transform duration-300" />
    <span className="tracking-wide">Logout</span>

    {/* Hover effect overlay */}
    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>

    {/* Shine effect */}
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                    -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 rounded-lg"></div>
  </button>
</div>

  );
}

export default LogoutButton;
