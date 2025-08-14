import React from "react";
import LogoutButton from "./LogoutButton";

function Footer() {
  return (
    <footer className="w-full bg-gradient-to-r from-gray-800 to-gray-900 text-white px-4 py-5 md:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* App Info */}
        <div className="text-center md:text-left flex-1">
          <h2 className="text-lg font-semibold">🛍️ Textile Marketing App</h2>
          <p className="text-sm text-gray-300">
            Marketing platform for selling premium textile products to hotels.
          </p>
        </div>

        {/* Logout Button - always at right */}
        <div className="flex justify-end w-full md:w-auto">
          <LogoutButton />
        </div>
      </div>

      {/* Bottom Text */}
      <div className="mt-4 text-center text-xs text-gray-500 border-t border-gray-700 pt-3">
        © {new Date().getFullYear()} Textile Marketing App. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
