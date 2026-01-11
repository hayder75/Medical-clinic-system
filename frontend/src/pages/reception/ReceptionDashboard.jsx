import React from 'react';
import { Users, Calendar, Phone, CreditCard, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ReceptionDashboard = () => {
  const navigate = useNavigate();

  const dashboardCards = [
    {
      title: 'Patient Registration & Visit Creation',
      description: 'Register new patients or create visits for existing patients',
      icon: Users,
      color: 'bg-blue-500',
      link: '/reception/register'
    },
    {
      title: 'Patient Management',
      description: 'Manage patient card status, activation, and billing',
      icon: Calendar,
      color: 'bg-green-500',
      link: '/reception/patients'
    },
    {
      title: 'Appointments Management',
      description: 'View all appointments and send patients to doctor queue',
      icon: Clock,
      color: 'bg-purple-500',
      link: '/reception/appointments'
    },
    {
      title: 'Pre-Registration',
      description: 'Handle phone call registrations and appointments',
      icon: Phone,
      color: 'bg-orange-500',
      link: '/reception/pre-registration'
    },
    {
      title: 'Billing Status',
      description: 'View pending billings and payment status',
      icon: CreditCard,
      color: 'bg-red-500',
      link: '/billing'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reception Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to the reception management system</p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dashboardCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <div
              key={index}
              onClick={() => navigate(card.link)}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
            >
              <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                <IconComponent className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{card.title}</h3>
              <p className="text-sm text-gray-600">{card.description}</p>
            </div>
          );
        })}
      </div>

      {/* Important Notes Section */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Important Reminders</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Card Registration:</strong> 300 Birr (first time only)</li>
                <li><strong>Card Activation:</strong> 200 Birr (valid for 30 days)</li>
                <li>Always check card status before creating a visit</li>
                <li>After payment at billing, patient will automatically be sent to triage</li>
                <li>No money handling - all payments processed by billing department</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Workflow</h2>
        <div className="space-y-3">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
              1
            </div>
            <p className="ml-3 text-gray-700">Register new patient → System creates 300 Birr bill for card registration</p>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-semibold">
              2
            </div>
            <p className="ml-3 text-gray-700">Patient pays at billing → Card automatically activated for 30 days</p>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-semibold">
              3
            </div>
            <p className="ml-3 text-gray-700">Create visit (only if card active) → System creates consultation bill</p>
          </div>
          <div className="flex items-center">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-semibold">
              4
            </div>
            <p className="ml-3 text-gray-700">Patient pays → Automatically sent to nurse triage</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionDashboard;

