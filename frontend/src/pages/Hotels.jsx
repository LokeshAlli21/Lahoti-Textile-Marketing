import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import databaseService from '../backend-services/database/database.js'

function Hotels() {
  const navigate = useNavigate()
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState('DESC')
  const [viewMode, setViewMode] = useState('cards') // cards or list
  const limit = 12

  const fetchHotels = async (page = currentPage, searchTerm = search, sort = sortBy, order = sortOrder) => {
    setLoading(true)
    try {
      const data = await databaseService.getHotels({
        page,
        limit,
        search: searchTerm,
        sort_by: sort,
        sort_order: order
      })
      setHotels(data.hotels || [])
      setTotalPages(data.totalPages || 1)
      setTotal(data.total || 0)
      setCurrentPage(data.page || 1)
    } catch (error) {
      console.error('Error fetching hotels:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchHotels()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setCurrentPage(1)
    fetchHotels(1, searchInput, sortBy, sortOrder)
  }

  const handleSort = (field) => {
    const newOrder = sortBy === field && sortOrder === 'ASC' ? 'DESC' : 'ASC'
    setSortBy(field)
    setSortOrder(newOrder)
    fetchHotels(currentPage, search, field, newOrder)
  }

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await databaseService.deleteHotel(id)
        fetchHotels()
      } catch (error) {
        console.error('Error deleting hotel:', error)
        alert('Failed to delete hotel')
      }
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const HotelCard = ({ hotel }) => (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl border border-white/30 transition-all duration-300 hover:scale-[1.02] group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
            {hotel.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-gray-900 text-lg truncate">{hotel.name}</h3>
            {hotel.hotel_email && (
              <p className="text-sm text-gray-500 truncate">{hotel.hotel_email}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
            {hotel.total_visits || 0} visits
          </span>
        </div>
      </div>

      <div className="space-y-3 mb-5">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 truncate">{hotel.address || 'No address provided'}</p>
            {hotel.latitude && hotel.longitude && (
              <p className="text-xs text-gray-500 font-mono">
                {parseFloat(hotel.latitude).toFixed(4)}, {parseFloat(hotel.longitude).toFixed(4)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-gray-700">{hotel.owner_name || 'No owner info'}</p>
            {hotel.owner_phone && (
              <p className="text-xs text-gray-500">{hotel.owner_phone}</p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>By {hotel.created_by_name}</span>
          <span>{formatDate(hotel.created_at)}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/hotel/${hotel.id}/view`)}
          className="flex-1 bg-blue-50 text-blue-700 py-2.5 px-4 rounded-xl hover:bg-blue-100 transition-colors font-medium text-sm flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View
        </button>
        <button
          onClick={() => navigate(`/hotel/${hotel.id}/edit`)}
          className="flex-1 bg-indigo-50 text-indigo-700 py-2.5 px-4 rounded-xl hover:bg-indigo-100 transition-colors font-medium text-sm flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
        <button
          onClick={() => handleDelete(hotel.id, hotel.name)}
          className="bg-red-50 text-red-700 py-2.5 px-4 rounded-xl hover:bg-red-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )

  const HotelListItem = ({ hotel }) => (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-md hover:shadow-lg border border-white/30 transition-all duration-200 group">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold flex-shrink-0">
          {hotel.name.charAt(0).toUpperCase()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-semibold text-gray-900 truncate pr-2">{hotel.name}</h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 whitespace-nowrap">
              {hotel.total_visits || 0}
            </span>
          </div>
          
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center gap-2">
              <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              <span className="truncate">{hotel.address || 'No address'}</span>
            </div>
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="truncate">{hotel.owner_name || 'No owner'}</span>
              <span className="whitespace-nowrap ml-2">{formatDate(hotel.created_at)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-1 flex-shrink-0 ml-2">
          <button
            onClick={() => navigate(`/hotel/${hotel.id}/view`)}
            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            onClick={() => navigate(`/hotel/${hotel.id}/edit`)}
            className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => handleDelete(hotel.id, hotel.name)}
            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="px-4 sm:px-6 py-4 sm:py-6 max-w-7xl mx-auto">
        {/* Mobile-Optimized Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 sm:mb-6">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Hotels Management
              </h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Manage your hotel portfolio with ease</p>
            </div>
            <button
              onClick={() => navigate('/hotel/add')}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm sm:text-base w-full sm:w-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add New Hotel
            </button>
          </div>

          {/* Mobile-Optimized Search & Controls */}
          <div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
            <form onSubmit={handleSearch} className="space-y-3 sm:space-y-0 sm:flex sm:gap-3 mb-4">
              <div className="relative flex-1">
                <svg className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search hotels..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm text-sm sm:text-base"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-gray-900 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-sm font-medium text-sm sm:text-base"
              >
                Search
              </button>
            </form>
            
            {/* Stats & View Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center justify-center sm:justify-start gap-4 sm:gap-6 text-xs sm:text-sm">
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-bold text-blue-600">{total}</div>
                  <div className="text-gray-600">Hotels</div>
                </div>
                <div className="text-center">
                  <div className="text-lg sm:text-2xl font-bold text-indigo-600">{currentPage}</div>
                  <div className="text-gray-600">Page</div>
                </div>
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs sm:text-sm text-gray-600 mr-2">View:</span>
                <div className="bg-gray-100 rounded-lg p-1 flex">
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                      viewMode === 'cards' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span className="hidden sm:inline">Cards</span>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    <span className="hidden sm:inline">List</span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Sort Options - Mobile Friendly */}
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs text-gray-600 mr-2 self-center">Sort by:</span>
              {['created_at', 'name', 'total_visits'].map((field) => (
                <button
                  key={field}
                  onClick={() => handleSort(field)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    sortBy === field
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {field === 'created_at' ? 'Date' : field === 'total_visits' ? 'Visits' : 'Name'}
                  {sortBy === field && (
                    <span className="ml-1">
                      {sortOrder === 'ASC' ? '↑' : '↓'}
                    </span>
                  )}
                </button>
              ))}
            </div>
            
            {search && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs sm:text-sm text-gray-600">Searching:</span>
                <span className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">"{search}"</span>
                <button 
                  onClick={() => { setSearch(''); setSearchInput(''); fetchHotels(1, '', sortBy, sortOrder) }}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Hotels Content */}
        {loading ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-8 sm:p-12 shadow-lg border border-white/20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 sm:w-12 sm:h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-gray-600 font-medium text-sm sm:text-base">Loading hotels...</p>
            </div>
          </div>
        ) : hotels.length === 0 ? (
          <div className="bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-8 sm:p-12 shadow-lg border border-white/20 text-center">
            <svg className="mx-auto w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-2-5h4m-6 0V9a2 2 0 012-2h2a2 2 0 012 2v7" />
            </svg>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
              {search ? 'No hotels found' : 'No hotels yet'}
            </h3>
            <p className="text-gray-500 mb-6 text-sm sm:text-base">
              {search ? `No hotels match "${search}". Try adjusting your search.` : 'Get started by adding your first hotel.'}
            </p>
            {!search && (
              <button
                onClick={() => navigate('/hotel/add')}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 sm:px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm sm:text-base"
              >
                Add Your First Hotel
              </button>
            )}
          </div>
        ) : (
          <>
            {viewMode === 'cards' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {hotels.map((hotel) => (
                  <HotelCard key={hotel.id} hotel={hotel} />
                ))}
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {hotels.map((hotel) => (
                  <HotelListItem key={hotel.id} hotel={hotel} />
                ))}
              </div>
            )}

            {/* Mobile-Optimized Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 sm:mt-8 bg-white/70 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-white/20">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                    Showing {((currentPage - 1) * limit) + 1}-{Math.min(currentPage * limit, total)} of {total}
                  </div>
                  
                  {/* Mobile Pagination */}
                  <div className="flex items-center gap-1 sm:gap-2">
                    <button
                      onClick={() => fetchHotels(1, search, sortBy, sortOrder)}
                      disabled={currentPage === 1}
                      className="px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-transparent rounded-lg transition-colors"
                    >
                      ««
                    </button>
                    <button
                      onClick={() => fetchHotels(currentPage - 1, search, sortBy, sortOrder)}
                      disabled={currentPage === 1}
                      className="px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-transparent rounded-lg transition-colors"
                    >
                      ‹
                    </button>

                    {/* Show fewer pages on mobile */}
                    {Array.from({ length: Math.min(window.innerWidth < 640 ? 3 : 5, totalPages) }, (_, i) => {
                      const maxPages = window.innerWidth < 640 ? 3 : 5
                      const page = Math.max(1, Math.min(totalPages - maxPages + 1, currentPage - Math.floor(maxPages / 2))) + i
                      if (page > totalPages) return null
                      return (
                        <button
                          key={page}
                          onClick={() => fetchHotels(page, search, sortBy, sortOrder)}
                          className={`px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-lg transition-colors ${
                            currentPage === page
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    })}

                    <button
                      onClick={() => fetchHotels(currentPage + 1, search, sortBy, sortOrder)}
                      disabled={currentPage === totalPages}
                      className="px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-transparent rounded-lg transition-colors"
                    >
                      ›
                    </button>
                    <button
                      onClick={() => fetchHotels(totalPages, search, sortBy, sortOrder)}
                      disabled={currentPage === totalPages}
                      className="px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:hover:bg-transparent rounded-lg transition-colors"
                    >
                      »»
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default Hotels