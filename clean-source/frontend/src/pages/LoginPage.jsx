import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Stethoscope, Heart, Shield, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData);
      
      if (result.success) {
        toast.success('Login successful!');
        navigate('/');
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch (error) {
      toast.error('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Medical Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-32 h-32 border-2 border-blue-300 rounded-full"></div>
          <div className="absolute top-32 right-20 w-24 h-24 border-2 border-blue-300 rounded-full"></div>
          <div className="absolute bottom-20 left-32 w-20 h-20 border-2 border-blue-300 rounded-full"></div>
          <div className="absolute bottom-32 right-10 w-28 h-28 border-2 border-blue-300 rounded-full"></div>
        </div>
        
        {/* Medical Icons */}
        <div className="absolute top-20 left-20">
          <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center">
            <Heart className="w-8 h-8 text-red-500" />
          </div>
        </div>
        
        <div className="absolute top-40 right-32">
          <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-green-500" />
          </div>
        </div>
        
        <div className="absolute bottom-40 left-16">
          <div className="w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center">
            <Users className="w-7 h-7 text-blue-500" />
          </div>
        </div>

        {/* Main Medical Illustration */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            {/* Large Stethoscope Icon */}
            <div className="relative mb-8">
              <div className="w-48 h-48 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-2xl flex items-center justify-center">
                <Stethoscope className="w-24 h-24 text-white" />
              </div>
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
                <div className="w-4 h-4 bg-green-400 rounded-full"></div>
              </div>
              <div className="absolute -bottom-2 -left-6 w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
              </div>
            </div>
            
            {/* Text Content */}
            <div className="text-white space-y-4">
              <h3 className="text-2xl font-bold">Welcome to</h3>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Tenalesew Medical Center
              </h2>
              <p className="text-lg text-gray-600 max-w-md mx-auto">
                We are committed to providing exceptional healthcare services with compassion and excellence.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Sign In
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Access your medical center account
            </p>
          </div>

          {/* Login Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                Demo credentials: <span className="font-medium text-blue-600">admin</span> / <span className="font-medium text-blue-600">admin123</span>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
