import React, { useEffect, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Building2, User, Phone, Mail, Navigation, ArrowLeft, Edit, Save, X, Check, Loader2, AlertCircle, FileText  } from 'lucide-react';
import databaseService from '../backend-services/database/database.js';
import { toast } from 'react-toastify';

// Move FormInput component outside to prevent recreation on every render
const FormInput = ({ 
  name, 
  label, 
  type = 'text', 
  required = false, 
  icon: Icon,
  rows,
  placeholder,
  value,
  onChange,
  disabled,
  error
}) => (
  <div className="space-y-2">
    <label htmlFor={name} className="flex items-center text-sm font-medium text-slate-700">
      {Icon && <Icon className="w-4 h-4 mr-2 text-slate-500" />}
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    
    {type === 'textarea' ? (
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows={rows || 3}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 
          focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500
          ${error ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300'}
          ${disabled ? 'bg-slate-50 cursor-not-allowed' : ''}
          resize-none`}
      />
    ) : (
      <input
        type={type}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-xl border-2 transition-all duration-200
          focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500
          ${error ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white hover:border-slate-300'}
          ${disabled ? 'bg-slate-50 cursor-not-allowed' : ''}`}
      />
    )}
    
    {error && (
      <div className="flex items-center space-x-2 text-red-600">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">{error}</span>
      </div>
    )}
  </div>
);

const AddHotel = ({ viewOnly = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const userData = useSelector(state => state.auth.userData);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    hotel_email: '',
    owner_name: '',
    owner_phone: '',
    owner_alt_phone: '',
    contact_person_name: '',
    contact_person_phone: '',
    contact_person_alt_phone: '',
    gst_number: ''
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);

  // Fetch hotel details for edit/view mode
  const fetchHotelDetails = useCallback(async () => {
    console.log("executed")
    if (!id) return;
    setLoading(true);
    try {
      const response = await databaseService.getHotelById(id);
      const hotel = response?.hotel || null
      console.log(hotel)
      if (hotel) {
        setFormData({
          name: hotel.name || '',
          address: hotel.address || '',
          latitude: hotel.latitude?.toString() || '',
          longitude: hotel.longitude?.toString() || '',
          hotel_email: hotel.hotel_email || '',
          owner_name: hotel.owner_name || '',
          owner_phone: hotel.owner_phone || '',
          owner_alt_phone: hotel.owner_alt_phone || '',
          contact_person_name: hotel.contact_person_name || '',
          contact_person_phone: hotel.contact_person_phone || '',
          contact_person_alt_phone: hotel.contact_person_alt_phone || '',
          gst_number: hotel?.gst_number || ''
        });
      }
    } catch (error) {
      console.error('Error fetching hotel details:', error);
      setErrors({ fetch: 'Failed to load hotel details. Please try again.' });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchHotelDetails();
  }, [fetchHotelDetails]);

  // Determine the mode
  const mode = viewOnly ? 'view' : id ? 'edit' : 'add';

  // Form validation
  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Hotel name is required';
    }

    if (!formData.latitude || !formData.longitude) {
      newErrors.location = 'Location is required. Please use "Get Current Location"';
    }

    if (formData.hotel_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.hotel_email)) {
      newErrors.hotel_email = 'Please enter a valid email address';
    }

    const validatePhone = (phone, fieldName) => {
      if (phone && !/^\d{10}$/.test(phone.replace(/\s+/g, ''))) {
        newErrors[fieldName] = 'Please enter a valid 10-digit phone number';
      }
    };

    // ✅ GST validation (if provided)
    if (formData.gst_number && !/^[0-9]{2}[A-Z0-9]{13}$/.test(formData.gst_number.trim())) {
      newErrors.gst_number = 'Please enter a valid GST number (15 characters, alphanumeric)';
    }

    validatePhone(formData.owner_phone, 'owner_phone');
    validatePhone(formData.owner_alt_phone, 'owner_alt_phone');
    validatePhone(formData.contact_person_phone, 'contact_person_phone');
    validatePhone(formData.contact_person_alt_phone, 'contact_person_alt_phone');

    // ✅ Require at least one phone number
    if (
      !formData.owner_phone &&
      !formData.owner_alt_phone &&
      !formData.contact_person_phone &&
      !formData.contact_person_alt_phone
    ) {
      newErrors.phone_required = 'At least one phone number is required';
    }

    // Show all error messages as toasts
    Object.values(newErrors).forEach((msg) => {
      toast.error(msg);
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Handle input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrors({ location: 'Geolocation is not supported by this browser.' });
      return;
    }

    setLocationLoading(true);
    setErrors(prev => ({ ...prev, location: '' }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        }));
        setLocationLoading(false);
      },
      (error) => {
        setLocationLoading(false);
        setErrors({ location: 'Unable to retrieve location. Please try again.' });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (viewOnly) return;

    setSuccessMessage('');
    setErrors({});

    if (!validateForm()) return;

    setSubmitLoading(true);

    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        user_id: userData?.id
      };

      if (mode === 'add') {
        await databaseService.addHotel(submitData);
        setSuccessMessage('Hotel added successfully!');
        // Reset form for new entry
        setFormData({
            name: '', address: '', latitude: '', longitude: '',
            hotel_email: '', owner_name: '', owner_phone: '', owner_alt_phone: '',
            contact_person_name: '', contact_person_phone: '', contact_person_alt_phone: '', gst_number: ''
          });
        setSuccessMessage('');
        navigate(-1); // Redirect to hotels list
      } else if (mode === 'edit') {
        await databaseService.updateHotel(submitData, id);
        setSuccessMessage('Hotel updated successfully!');
        navigate(-1); // Redirect to hotels list
      }
    } catch (error) {
      console.error('Error submitting hotel:', error);
      setErrors({ submit: 'Failed to save hotel. Please try again.' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'add': return 'Add New Hotel';
      case 'edit': return 'Edit Hotel';
      case 'view': return 'Hotel Details';
      default: return 'Hotel Management';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'add': return 'Create a new hotel entry in your system';
      case 'edit': return 'Update hotel information and details';
      case 'view': return 'View complete hotel information';
      default: return '';
    }
  };

  if (loading && mode !== 'add') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading hotel details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/80 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{getTitle()}</h1>
              <p className="text-slate-600 mt-1">{getSubtitle()}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {(errors.fetch || errors.submit || errors.location || errors.phone_required) && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <p className="text-red-800">
                {errors.fetch || errors.submit || errors.location || errors.phone_required}
              </p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-xl">
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-3" />
              <p className="text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Basic Information Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
              <div className="flex items-center text-white">
                <Building2 className="w-6 h-6 mr-3" />
                <h2 className="text-xl font-semibold">Basic Information</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormInput
                  name="name"
                  label="Hotel Name"
                  required
                  icon={Building2}
                  placeholder="Enter hotel name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={viewOnly || loading}
                  error={errors.name}
                />
                <FormInput
                  name="hotel_email"
                  label="Hotel Email"
                  type="email"
                  icon={Mail}
                  placeholder="hotel@example.com"
                  value={formData.hotel_email}
                  onChange={handleInputChange}
                  disabled={viewOnly || loading}
                  error={errors.hotel_email}
                />
                <FormInput
                  name="gst_number"
                  label="GST Number"
                  type="text"
                  icon={FileText}
                  placeholder="Enter GST number"
                  value={formData.gst_number}
                  onChange={handleInputChange}
                  disabled={viewOnly || loading}
                  error={errors.gst_number}
                />
              </div>
              <FormInput
                name="address"
                label="Address"
                type="textarea"
                icon={MapPin}
                rows={3}
                placeholder="Enter complete hotel address"
                value={formData.address}
                onChange={handleInputChange}
                disabled={viewOnly || loading}
                error={errors.address}
              />
            </div>
          </div>

          {/* Location Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center">
                  <Navigation className="w-6 h-6 mr-3" />
                  <h2 className="text-xl font-semibold">Location</h2>
                </div>
                {!viewOnly && (
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                    className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {locationLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Navigation className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">
                      {locationLoading ? 'Getting Location...' : 'Get Current Location'}
                    </span>
                  </button>
                )}
              </div>
            </div>
            <div className="p-6">
              {formData.latitude && formData.longitude ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-slate-700">
                      <MapPin className="w-4 h-4 mr-2 text-slate-500" />
                      Latitude
                    </label>
                    <div className="px-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50">
                      <span className="text-slate-700 font-mono">{formData.latitude}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-slate-700">
                      <MapPin className="w-4 h-4 mr-2 text-slate-500" />
                      Longitude
                    </label>
                    <div className="px-4 py-3 rounded-xl border-2 border-slate-200 bg-slate-50">
                      <span className="text-slate-700 font-mono">{formData.longitude}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Navigation className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-500 mb-4">No location set</p>
                  <p className="text-sm text-slate-400">
                    Use "Get Current Location" to automatically fetch coordinates
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Owner Information Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4">
              <div className="flex items-center text-white">
                <User className="w-6 h-6 mr-3" />
                <h2 className="text-xl font-semibold">Owner Information</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <FormInput
                name="owner_name"
                label="Owner Name"
                icon={User}
                placeholder="Enter owner's full name"
                value={formData.owner_name}
                onChange={handleInputChange}
                disabled={viewOnly || loading}
                error={errors.owner_name}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormInput
                  name="owner_phone"
                  label="Primary Phone"
                  type="tel"
                  icon={Phone}
                  placeholder="1234567890"
                  value={formData.owner_phone}
                  onChange={handleInputChange}
                  disabled={viewOnly || loading}
                  error={errors.owner_phone}
                />
                <FormInput
                  name="owner_alt_phone"
                  label="Alternative Phone"
                  type="tel"
                  icon={Phone}
                  placeholder="1234567890"
                  value={formData.owner_alt_phone}
                  onChange={handleInputChange}
                  disabled={viewOnly || loading}
                  error={errors.owner_alt_phone}
                />
              </div>
            </div>
          </div>

          {/* Contact Person Card */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
              <div className="flex items-center text-white">
                <User className="w-6 h-6 mr-3" />
                <h2 className="text-xl font-semibold">Contact Person</h2>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <FormInput
                name="contact_person_name"
                label="Contact Person Name"
                icon={User}
                placeholder="Enter contact person's name"
                value={formData.contact_person_name}
                onChange={handleInputChange}
                disabled={viewOnly || loading}
                error={errors.contact_person_name}
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormInput
                  name="contact_person_phone"
                  label="Primary Phone"
                  type="tel"
                  icon={Phone}
                  placeholder="1234567890"
                  value={formData.contact_person_phone}
                  onChange={handleInputChange}
                  disabled={viewOnly || loading}
                  error={errors.contact_person_phone}
                />
                <FormInput
                  name="contact_person_alt_phone"
                  label="Alternative Phone"
                  type="tel"
                  icon={Phone}
                  placeholder="1234567890"
                  value={formData.contact_person_alt_phone}
                  onChange={handleInputChange}
                  disabled={viewOnly || loading}
                  error={errors.contact_person_alt_phone}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border-2 border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-500/20 transition-all"
                >
                  <X className="w-4 h-4 mr-2" />
                  {viewOnly ? 'Back to Hotels' : 'Cancel'}
                </button>

{!viewOnly &&(
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="w-full sm:w-auto flex items-center justify-center px-8 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {submitLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {submitLoading 
                      ? 'Saving...' 
                      : mode === 'add' 
                        ? 'Add Hotel' 
                        : 'Update Hotel'}
                  </button>
)}

              </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddHotel;