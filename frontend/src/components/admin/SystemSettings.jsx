import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { Settings, Save, X } from 'lucide-react';

const SystemSettings = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    cardExpiryPeriodDays: '30'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/system-settings');
      const fetchedSettings = response.data.settings || {};
      
      setSettings({
        cardExpiryPeriodDays: fetchedSettings.cardExpiryPeriodDays?.value || '30'
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to fetch system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Update card expiry period
      await api.put('/admin/system-settings/cardExpiryPeriodDays', {
        value: settings.cardExpiryPeriodDays,
        description: 'Number of days before a card expires after activation'
      });
      
      toast.success('System settings updated successfully');
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error.response?.data?.error || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            System Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Card Expiry Period (Days)
              </label>
              <input
                type="number"
                value={settings.cardExpiryPeriodDays}
                onChange={(e) => setSettings({ ...settings, cardExpiryPeriodDays: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                min="1"
                step="1"
                placeholder="30"
              />
              <p className="text-xs text-gray-500 mt-1">
                Cards will automatically deactivate after this many days from activation date.
                Common values: 30 (1 month), 60 (2 months), 90 (3 months)
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !settings.cardExpiryPeriodDays || parseInt(settings.cardExpiryPeriodDays) <= 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemSettings;

