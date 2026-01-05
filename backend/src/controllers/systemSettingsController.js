const prisma = require('../config/database');

// Get all system settings
exports.getSystemSettings = async (req, res) => {
  try {
    const settings = await prisma.systemSettings.findMany({
      orderBy: { key: 'asc' },
      include: {
        updatedBy: {
          select: {
            id: true,
            fullname: true,
            username: true
          }
        }
      }
    });

    // Convert to key-value object for easier access
    const settingsObject = {};
    settings.forEach(setting => {
      settingsObject[setting.key] = {
        value: setting.value,
        description: setting.description,
        updatedAt: setting.updatedAt,
        updatedBy: setting.updatedBy
      };
    });

    res.json({ settings: settingsObject, raw: settings });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get a specific setting by key
exports.getSetting = async (req, res) => {
  try {
    const { key } = req.params;
    
    let setting = await prisma.systemSettings.findUnique({
      where: { key },
      include: {
        updatedBy: {
          select: {
            id: true,
            fullname: true,
            username: true
          }
        }
      }
    });

    // If setting doesn't exist, return default
    if (!setting) {
      // Return default values for known settings
      const defaults = {
        'cardExpiryPeriodDays': { value: '30', description: 'Number of days before a card expires after activation' }
      };
      
      if (defaults[key]) {
        return res.json({ setting: { key, ...defaults[key], value: defaults[key].value } });
      }
      
      return res.status(404).json({ error: 'Setting not found' });
    }

    res.json({ setting });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update a system setting
exports.updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;
    const userId = req.user.id;

    if (!value) {
      return res.status(400).json({ error: 'Value is required' });
    }

    // Validate cardExpiryPeriodDays is a positive number
    if (key === 'cardExpiryPeriodDays') {
      const days = parseInt(value);
      if (isNaN(days) || days <= 0) {
        return res.status(400).json({ error: 'Card expiry period must be a positive number of days' });
      }
    }

    // Upsert setting (create if doesn't exist, update if exists)
    const setting = await prisma.systemSettings.upsert({
      where: { key },
      update: {
        value: value.toString(),
        description: description || undefined,
        updatedById: userId,
        updatedAt: new Date()
      },
      create: {
        key,
        value: value.toString(),
        description: description || undefined,
        updatedById: userId
      },
      include: {
        updatedBy: {
          select: {
            id: true,
            fullname: true,
            username: true
          }
        }
      }
    });

    res.json({
      message: 'Setting updated successfully',
      setting
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ error: error.message });
  }
};

// Helper function to get card expiry period (used by other controllers)
exports.getCardExpiryPeriodDays = async () => {
  try {
    const setting = await prisma.systemSettings.findUnique({
      where: { key: 'cardExpiryPeriodDays' }
    });
    
    if (setting) {
      return parseInt(setting.value) || 30; // Default to 30 days
    }
    
    // If setting doesn't exist, create it with default value
    await prisma.systemSettings.create({
      data: {
        key: 'cardExpiryPeriodDays',
        value: '30',
        description: 'Number of days before a card expires after activation'
      }
    });
    
    return 30;
  } catch (error) {
    console.error('Error getting card expiry period:', error);
    return 30; // Default fallback
  }
};

