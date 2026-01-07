const prisma = require('../config/database');
const { z } = require('zod');
const bcrypt = require('bcryptjs');

// Validation schemas
const createUserSchema = z.object({
  fullname: z.string().optional(),
  username: z.string().min(3),
  password: z.string().min(4),
  email: z.union([z.string().email(), z.literal('')]).optional(),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'OWNER', 'BILLING_OFFICER', 'PHARMACY_BILLING_OFFICER', 'CARE_COORDINATOR', 'CMO', 'CLINICAL_RESEARCH_COORDINATOR', 'DIETITIAN', 'DOCTOR', 'HOSPITAL_MANAGER', 'HR_OFFICER', 'IT_SUPPORT', 'LAB_TECHNICIAN', 'MEDICAL_RECORDS_OFFICER', 'NURSE', 'PATIENT', 'PHARMACY_OFFICER', 'PHARMACIST', 'RADIOLOGIST', 'RECEPTIONIST', 'SECURITY_STAFF', 'SOCIAL_WORKER']),
  specialties: z.array(z.string()).optional(),
  licenseNumber: z.string().optional(),
  consultationFee: z.number().optional(),
  waiveConsultationFee: z.boolean().optional(),
});

const createServiceSchema = z.object({
  code: z.string().min(1).optional(), // Code is now optional - will be auto-generated if not provided
  name: z.string().min(1),
  category: z.enum(['CONSULTATION', 'LAB', 'RADIOLOGY', 'MEDICATION', 'PROCEDURE', 'NURSE', 'DENTAL', 'OTHER', 'NURSE_WALKIN', 'EMERGENCY_DRUG', 'MATERIAL_NEEDS']),
  price: z.number().positive(),
  unit: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

const createInsuranceSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  contactInfo: z.string().optional(),
});

const createInvestigationTypeSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  category: z.enum(['LAB', 'RADIOLOGY']),
  serviceId: z.string().optional(),
  description: z.string().optional(),
});

const createLabTestGroupSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().optional(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

const createLabTestSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  category: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  unit: z.string().optional(),
  groupId: z.string().uuid().optional().nullable(),
  displayOrder: z.number().int().optional(),
  isActive: z.boolean().optional(),
  resultFields: z.array(z.object({
    fieldName: z.string().min(1),
    label: z.string().min(1),
    fieldType: z.enum(['number', 'text', 'select', 'textarea', 'binary']),
    unit: z.string().optional().nullable(),
    normalRange: z.string().optional().nullable(),
    options: z.array(z.string()).optional().nullable(),
    isRequired: z.boolean().optional(),
    displayOrder: z.number().int().optional(),
  })).optional(),
});

const createInventorySchema = z.object({
  name: z.string().min(1),
  quantity: z.number().int().min(0),
  category: z.enum(['TABLETS', 'CAPSULES', 'INJECTIONS', 'SYRUPS', 'OINTMENTS', 'DROPS', 'INHALERS', 'PATCHES', 'INFUSIONS']).optional(),
  dosageForm: z.string().optional(),
  strength: z.string().optional(),
  expiryDate: z.string().datetime().optional(),
  supplier: z.string().optional(),
  price: z.number().positive().optional(),
  serviceId: z.string().optional(),
});

// User Management
exports.createUser = async (req, res) => {
  try {
    const data = createUserSchema.parse(req.body);
    
    // Clean up data - remove empty strings and convert to null/undefined
    const cleanedData = { ...data };
    if (cleanedData.fullname === '') {
      cleanedData.fullname = null;
    }
    if (cleanedData.email === '' || !cleanedData.email) {
      delete cleanedData.email; // Remove email if empty or not provided
    }
    if (cleanedData.phone === '') {
      cleanedData.phone = null;
    }
    
    // Check if username or email already exists
    const whereClause = {
      OR: [
        { username: cleanedData.username }
      ]
    };
    
    // Only check email if it's provided and not empty
    if (cleanedData.email) {
      whereClause.OR.push({ email: cleanedData.email });
    }
    
    const existingUser = await prisma.user.findFirst({
      where: whereClause
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'Username or email already exists' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(cleanedData.password, 10);

    // Prepare user data, excluding email if not provided
    const userData = {
      ...cleanedData,
      password: hashedPassword,
      specialties: cleanedData.specialties || [],
      isActive: true // Ensure new users are active by default
    };
    
    // Only include email if it's provided
    if (cleanedData.email) {
      userData.email = cleanedData.email;
    }

    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        fullname: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        specialties: true,
        licenseNumber: true,
        consultationFee: true,
        waiveConsultationFee: true,
        availability: true,
        createdAt: true
      }
    });

    res.status(201).json({
      message: 'User created successfully',
      user
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const { role } = req.query;
    
    let whereClause = {};
    if (role) {
      whereClause.role = role;
    }

    try {
      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          fullname: true,
          username: true,
          email: true,
          phone: true,
          role: true,
          specialties: true,
          licenseNumber: true,
          consultationFee: true,
          waiveConsultationFee: true,
          availability: true,
          isActive: true,
          passwordChangedAt: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({ users });
    } catch (dbError) {
      console.log('Database not available, returning mock users data');
      
      // Fallback mock data when database is not available
      const mockUsers = [
        {
          id: 'f4bfc674-0598-47b1-9d7f-ae1784afdfb6',
          fullname: 'System Administrator',
          username: 'admin',
          email: 'admin@clinic.com',
          phone: null,
          role: 'ADMIN',
          specialties: [],
          licenseNumber: null,
          consultationFee: null,
          availability: true,
          createdAt: new Date('2025-09-30T21:22:59.046Z')
        },
        {
          id: '8ef8017b-9117-4571-bd45-86a64565bc4b',
          fullname: 'Dr. Sarah Johnson',
          username: 'doctor1',
          email: 'doctor1@clinic.com',
          phone: '0912345678',
          role: 'DOCTOR',
          specialties: ['General Medicine'],
          licenseNumber: 'DOC123456',
          consultationFee: 500,
          availability: true,
          createdAt: new Date('2025-09-30T21:22:59.046Z')
        },
        {
          id: '533c4c75-983d-452a-adcb-8091bb3bd03b',
          fullname: 'Pharmacy Staff',
          username: 'pharmacy',
          email: 'pharmacy@clinic.com',
          phone: '0912345679',
          role: 'PHARMACIST',
          specialties: [],
          licenseNumber: null,
          consultationFee: null,
          availability: true,
          createdAt: new Date('2025-09-30T21:22:59.046Z')
        },
        {
          id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          fullname: 'Nurse Jane',
          username: 'nurse',
          email: 'nurse@clinic.com',
          phone: '0912345680',
          role: 'NURSE',
          specialties: ['General Nursing'],
          licenseNumber: 'NUR123456',
          consultationFee: null,
          availability: true,
          createdAt: new Date('2025-09-30T21:22:59.046Z')
        },
        {
          id: 'b2c3d4e5-f6g7-8901-bcde-f23456789012',
          fullname: 'Billing Staff',
          username: 'billing',
          email: 'billing@clinic.com',
          phone: '0912345681',
          role: 'BILLING_OFFICER',
          specialties: [],
          licenseNumber: null,
          consultationFee: null,
          availability: true,
          createdAt: new Date('2025-09-30T21:22:59.046Z')
        }
      ];

      // Filter by role if specified
      const filteredUsers = role ? mockUsers.filter(user => user.role === role) : mockUsers;
      
      res.json({ users: filteredUsers });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const data = createUserSchema.partial().omit({ password: true }).parse(req.body);

    // Clean up data - handle empty strings
    const cleanedData = { ...data };
    if (cleanedData.email === '') {
      cleanedData.email = null; // Set to null if explicitly cleared
    } else if (!cleanedData.email) {
      delete cleanedData.email; // Remove if not provided (don't update)
    }
    if (cleanedData.phone === '') {
      cleanedData.phone = null;
    }
    if (cleanedData.fullname === '') {
      cleanedData.fullname = null;
    }

    // Check if username or email already exists (excluding current user)
    if (cleanedData.username || cleanedData.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                cleanedData.username ? { username: cleanedData.username } : {},
                cleanedData.email ? { email: cleanedData.email } : {}
              ]
            }
          ]
        }
      });

      if (existingUser) {
        return res.status(400).json({ 
          error: 'Username or email already exists' 
        });
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: cleanedData,
      select: {
        id: true,
        fullname: true,
        username: true,
        email: true,
        phone: true,
        role: true,
        specialties: true,
        licenseNumber: true,
        consultationFee: true,
        waiveConsultationFee: true,
        availability: true,
        createdAt: true
      }
    });

    res.json({
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deletion of admin users
    if (user.role === 'ADMIN' || user.role === 'OWNER') {
      return res.status(400).json({ error: 'Cannot delete admin or owner users' });
    }

    await prisma.user.delete({
      where: { id }
    });

    res.json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword }
    });

    res.json({
      message: 'Password updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Helper function to generate service code
async function generateServiceCode(category) {
  // Category prefix mapping
  const categoryPrefixes = {
    'CONSULTATION': 'CONS',
    'LAB': 'LAB',
    'RADIOLOGY': 'RAD',
    'MEDICATION': 'MED',
    'PROCEDURE': 'PROC',
    'NURSE': 'NURSE',
    'DENTAL': 'DENT',
    'OTHER': 'OTH',
    'NURSE_WALKIN': 'NWALK',
    'EMERGENCY_DRUG': 'EMDRUG',
    'MATERIAL_NEEDS': 'MAT'
  };

  const prefix = categoryPrefixes[category] || 'SRV';
  
  // Find the highest number for this category
  const existingServices = await prisma.service.findMany({
    where: {
      code: {
        startsWith: prefix
      }
    },
    orderBy: {
      code: 'desc'
    },
    take: 1
  });

  let nextNumber = 1;
  if (existingServices.length > 0) {
    const lastCode = existingServices[0].code;
    const lastNumber = parseInt(lastCode.replace(prefix, '')) || 0;
    nextNumber = lastNumber + 1;
  }

  // Format: PREFIX + 3-digit number (e.g., CONS001, LAB045)
  return `${prefix}${String(nextNumber).padStart(3, '0')}`;
}

// Service Management
exports.createService = async (req, res) => {
  try {
    const data = createServiceSchema.parse(req.body);

    // Auto-generate code if not provided
    let serviceCode = data.code;
    if (!serviceCode || serviceCode.trim() === '') {
      serviceCode = await generateServiceCode(data.category);
    }

    // Check if service code already exists
    const existingService = await prisma.service.findUnique({
      where: { code: serviceCode }
    });

    if (existingService) {
      return res.status(400).json({ 
        error: 'Service code already exists. Please choose a different code.' 
      });
    }

    const service = await prisma.service.create({
      data: {
        ...data,
        code: serviceCode
      }
    });

    // Automatically create related records based on category
    const autoCreated = {
      investigationType: false,
      labTest: false
    };

    try {
      if (data.category === 'RADIOLOGY') {
        // Check if InvestigationType already exists for this service
        const existingInvestigationType = await prisma.investigationType.findFirst({
          where: {
            serviceId: service.id
          }
        });

        if (!existingInvestigationType) {
          // Create InvestigationType for RADIOLOGY service
          await prisma.investigationType.create({
            data: {
              name: service.name,
              category: 'RADIOLOGY',
              price: service.price,
              service: {
                connect: { id: service.id }
              }
            }
          });
          autoCreated.investigationType = true;
          console.log(`✅ Auto-created InvestigationType for RADIOLOGY service: ${service.name}`);
        }
      } else if (data.category === 'LAB') {
        // Check if LabTest already exists for this service
        const existingLabTest = await prisma.labTest.findFirst({
          where: {
            serviceId: service.id
          }
        });

        if (!existingLabTest) {
          // Generate a unique code for the LabTest (use service code or generate one)
          const labTestCode = serviceCode || `LAB${String(Date.now()).slice(-6)}`;
          
          // Create LabTest for LAB service with basic template
          const labTest = await prisma.labTest.create({
            data: {
              code: labTestCode,
              name: service.name,
              category: 'Laboratory', // Default category, admin can change later
              description: service.description || `Lab test: ${service.name}`,
              price: service.price,
              unit: service.unit || 'UNIT',
              isActive: service.isActive !== false, // Default to true
              serviceId: service.id,
              groupId: null, // Standalone by default
              displayOrder: 0
            }
          });

          // Create basic result fields: Result and Remarks
          await prisma.labTestResultField.createMany({
            data: [
              {
                testId: labTest.id,
                fieldName: 'result',
                label: 'Result',
                fieldType: 'textarea',
                unit: null,
                normalRange: null,
                options: null,
                isRequired: false,
                displayOrder: 1
              },
              {
                testId: labTest.id,
                fieldName: 'remarks',
                label: 'Remarks',
                fieldType: 'textarea',
                unit: null,
                normalRange: null,
                options: null,
                isRequired: false,
                displayOrder: 2
              }
            ]
          });

          autoCreated.labTest = true;
          console.log(`✅ Auto-created LabTest with basic template for LAB service: ${service.name}`);
        }
      }
    } catch (autoCreateError) {
      // Log error but don't fail the service creation
      console.error(`⚠️  Warning: Failed to auto-create related records for service ${service.name}:`, autoCreateError.message);
      // Continue - service was created successfully, related records can be created manually later
    }

    res.status(201).json({
      message: 'Service created successfully',
      service,
      autoCreated
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.getServices = async (req, res) => {
  try {
    const { category, isActive } = req.query;
    
    let whereClause = {};
    if (category && category !== 'ALL') {
      // Handle ENTRY category (stored as OTHER with code ENTRY001)
      if (category === 'ENTRY') {
        whereClause.category = 'OTHER';
        whereClause.code = 'ENTRY001';
      } else {
        whereClause.category = category;
      }
    }
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    const services = await prisma.service.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
      // Select only needed fields for faster queries
      select: {
        id: true,
        code: true,
        name: true,
        category: true,
        price: true,
        unit: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({ services });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: error.message });
  }
};


exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const data = createServiceSchema.partial().parse(req.body);

    // If code is being updated, check if the new code already exists (excluding current service)
    if (data.code) {
      const existingService = await prisma.service.findFirst({
        where: {
          code: data.code,
          id: { not: id } // Exclude current service
        }
      });

      if (existingService) {
        return res.status(400).json({ 
          error: 'Service code already exists. Please choose a different code.' 
        });
      }
    }

    const service = await prisma.service.update({
      where: { id },
      data
    });

    // Sync price and name changes to associated LabTest if this service is linked to a lab test
    if (data.price !== undefined || data.name !== undefined) {
      const linkedLabTest = await prisma.labTest.findFirst({
        where: { serviceId: id }
      });

      if (linkedLabTest) {
        const labTestUpdate = {};
        if (data.price !== undefined) labTestUpdate.price = data.price;
        if (data.name !== undefined) labTestUpdate.name = data.name;

        await prisma.labTest.updateMany({
          where: { serviceId: id },
          data: labTestUpdate
        });
      }

      // Also sync to InvestigationType if linked (used for radiology)
      const linkedInvestigationType = await prisma.investigationType.findFirst({
        where: { serviceId: id }
      });

      if (linkedInvestigationType) {
        const investigationUpdate = {};
        if (data.price !== undefined) investigationUpdate.price = data.price;
        if (data.name !== undefined) investigationUpdate.name = data.name;

        await prisma.investigationType.updateMany({
          where: { serviceId: id },
          data: investigationUpdate
        });
      }
    }

    res.json({
      message: 'Service updated successfully',
      service
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if service exists
    const service = await prisma.service.findUnique({
      where: { id }
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Check if service is being used anywhere in the system
    const [
      billingServices,
      labTests,
      investigationTypes,
      nurseAssignments,
      nurseWalkInOrders,
      emergencyDrugOrders,
      materialNeedsOrders,
      batchOrderServices
    ] = await Promise.all([
      prisma.billingService.findFirst({ where: { serviceId: id } }),
      prisma.labTest.findFirst({ where: { serviceId: id } }),
      prisma.investigationType.findFirst({ where: { serviceId: id } }),
      prisma.nurseServiceAssignment.findFirst({ where: { serviceId: id } }),
      prisma.nurseWalkInOrder.findFirst({ where: { serviceId: id } }),
      prisma.emergencyDrugOrder.findFirst({ where: { serviceId: id } }),
      prisma.materialNeedsOrder.findFirst({ where: { serviceId: id } }),
      prisma.batchOrderService.findFirst({ where: { serviceId: id } })
    ]);

    // Build list of usage locations
    const usageLocations = [];
    if (billingServices) usageLocations.push('billing records');
    if (labTests) usageLocations.push('lab tests');
    if (investigationTypes) usageLocations.push('radiology types');
    if (nurseAssignments) usageLocations.push('nurse service assignments');
    if (nurseWalkInOrders) usageLocations.push('nurse walk-in orders');
    if (emergencyDrugOrders) usageLocations.push('emergency drug orders');
    if (materialNeedsOrders) usageLocations.push('material needs orders');
    if (batchOrderServices) usageLocations.push('batch orders');

    if (usageLocations.length > 0) {
      return res.status(400).json({ 
        error: `Cannot delete service that is being used in: ${usageLocations.join(', ')}. Please deactivate it instead.` 
      });
    }

    await prisma.service.delete({
      where: { id }
    });

    res.json({
      message: 'Service deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Insurance Management
exports.createInsurance = async (req, res) => {
  try {
    const data = createInsuranceSchema.parse(req.body);

    // Check if insurance code already exists
    const existingInsurance = await prisma.insurance.findUnique({
      where: { code: data.code }
    });

    if (existingInsurance) {
      return res.status(400).json({ 
        error: 'Insurance code already exists' 
      });
    }

    const insurance = await prisma.insurance.create({
      data
    });

    res.status(201).json({
      message: 'Insurance created successfully',
      insurance
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.getInsurances = async (req, res) => {
  try {
    try {
      const insurances = await prisma.insurance.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      });

      res.json({ insurances });
    } catch (dbError) {
      console.log('Database not available, returning mock insurances data');
      
      // Fallback mock data when database is not available
      const mockInsurances = [
        {
          id: '1',
          name: 'Ethiopian Telecom',
          code: 'ETC001',
          type: 'CORPORATE',
          coveragePercentage: 80,
          maxCoverageAmount: 10000,
          isActive: true,
          createdAt: new Date('2025-09-30T21:22:59.046Z')
        },
        {
          id: '2',
          name: 'Test Insurance',
          code: 'TEST001',
          type: 'INDIVIDUAL',
          coveragePercentage: 70,
          maxCoverageAmount: 5000,
          isActive: true,
          createdAt: new Date('2025-09-30T21:22:59.046Z')
        },
        {
          id: '3',
          name: 'Government Insurance',
          code: 'GOV001',
          type: 'GOVERNMENT',
          coveragePercentage: 90,
          maxCoverageAmount: 15000,
          isActive: true,
          createdAt: new Date('2025-09-30T21:22:59.046Z')
        }
      ];
      
      res.json({ insurances: mockInsurances });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateInsurance = async (req, res) => {
  try {
    const { id } = req.params;
    const data = createInsuranceSchema.partial().parse(req.body);

    const insurance = await prisma.insurance.update({
      where: { id },
      data
    });

    res.json({
      message: 'Insurance updated successfully',
      insurance
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.deleteInsurance = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if insurance exists
    const insurance = await prisma.insurance.findUnique({
      where: { id }
    });

    if (!insurance) {
      return res.status(404).json({ error: 'Insurance not found' });
    }

    // Check if insurance is being used by patients
    const patientsWithInsurance = await prisma.patient.findFirst({
      where: { insuranceId: id }
    });

    if (patientsWithInsurance) {
      return res.status(400).json({ 
        error: 'Cannot delete insurance that is being used by patients' 
      });
    }

    await prisma.insurance.delete({
      where: { id }
    });

    res.json({
      message: 'Insurance deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Investigation Types Management
exports.createInvestigationType = async (req, res) => {
  try {
    const data = createInvestigationTypeSchema.parse(req.body);

    const investigationType = await prisma.investigationType.create({
      data
    });

    res.status(201).json({
      message: 'Investigation type created successfully',
      investigationType
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.getInvestigationTypes = async (req, res) => {
  try {
    const { category } = req.query;
    
    let whereClause = {};
    if (category) {
      whereClause.category = category;
    }
    // Only show investigation types where service is active
    // Exclude investigation types with inactive services
    whereClause.service = {
      isActive: true
    };

    const investigationTypes = await prisma.investigationType.findMany({
      where: whereClause,
      include: {
        service: {
          select: {
            id: true,
            code: true,
            name: true,
            price: true,
            isActive: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Additional client-side filter to ensure we only return active services
    // This double-checks and filters out any investigation types with inactive services
    const filteredTypes = investigationTypes.filter(inv => 
      inv.service && inv.service.isActive === true
    );

    res.json({ investigationTypes: filteredTypes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Inventory Management
exports.createInventoryItem = async (req, res) => {
  try {
    const data = createInventorySchema.parse(req.body);

    const inventoryItem = await prisma.inventory.create({
      data
    });

    res.status(201).json({
      message: 'Inventory item created successfully',
      inventoryItem
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

exports.getInventory = async (req, res) => {
  try {
    const { category, lowStock } = req.query;
    
    let whereClause = {};
    if (category) {
      whereClause.category = category;
    }
    if (lowStock === 'true') {
      whereClause.quantity = { lt: 10 }; // Less than 10 items
    }

    const inventory = await prisma.inventory.findMany({
      where: whereClause,
      include: {
        service: {
          select: {
            id: true,
            code: true,
            name: true,
            price: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ inventory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateInventoryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const data = createInventorySchema.partial().parse(req.body);

    const inventoryItem = await prisma.inventory.update({
      where: { id: parseInt(id) },
      data
    });

    res.json({
      message: 'Inventory item updated successfully',
      inventoryItem
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
};

// Billing Overview
exports.getBillingOverview = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    let whereClause = {};
    if (status) {
      whereClause.status = status;
    }
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const billings = await prisma.billing.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        services: {
          include: {
            service: {
              select: {
                code: true,
                name: true,
                category: true
              }
            }
          }
        },
        payments: true,
        insurance: {
          select: {
            name: true,
            code: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate summary statistics
    const totalAmount = billings.reduce((sum, billing) => sum + billing.totalAmount, 0);
    const paidAmount = billings
      .filter(billing => billing.status === 'PAID')
      .reduce((sum, billing) => sum + billing.totalAmount, 0);
    const pendingAmount = billings
      .filter(billing => billing.status === 'PENDING')
      .reduce((sum, billing) => sum + billing.totalAmount, 0);

    res.json({
      billings,
      summary: {
        totalBillings: billings.length,
        totalAmount,
        paidAmount,
        pendingAmount,
        paidPercentage: totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Audit Logs
exports.getAuditLogs = async (req, res) => {
  try {
    const { userId, action, entity, startDate, endDate } = req.query;
    
    let whereClause = {};
    if (userId) {
      whereClause.userId = userId;
    }
    if (action) {
      whereClause.action = { contains: action };
    }
    if (entity) {
      whereClause.entity = entity;
    }
    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            fullname: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 1000 // Limit to last 1000 entries
    });

    res.json({ auditLogs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reports
exports.getDailyReport = async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(reportDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(reportDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Revenue by service category
    const revenueByCategory = await prisma.billing.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      }
    });

    // Service-wise revenue
    const serviceRevenue = await prisma.billingService.groupBy({
      by: ['serviceId'],
      where: {
        billing: {
          createdAt: {
            gte: startOfDay,
            lte: endOfDay
          }
        }
      },
      _sum: {
        totalPrice: true
      },
      _count: {
        id: true
      }
    });

    // Get service details
    const serviceDetails = await prisma.service.findMany({
      where: {
        id: {
          in: serviceRevenue.map(s => s.serviceId)
        }
      },
      select: {
        id: true,
        name: true,
        category: true,
        code: true
      }
    });

    // Patient statistics
    const patientStats = await prisma.patient.groupBy({
      by: ['type'],
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      _count: {
        id: true
      }
    });

    // Visit statistics
    const visitStats = await prisma.visit.groupBy({
      by: ['status'],
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      _count: {
        id: true
      }
    });

    // Lab orders pending
    const pendingLabOrders = await prisma.labOrder.count({
      where: {
        status: 'QUEUED',
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    // Radiology orders pending
    const pendingRadiologyOrders = await prisma.radiologyOrder.count({
      where: {
        status: 'QUEUED',
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    // Medication orders pending
    const pendingMedicationOrders = await prisma.medicationOrder.count({
      where: {
        status: 'QUEUED',
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    // Pharmacy invoices pending
    const pendingPharmacyInvoices = await prisma.pharmacyInvoice.count({
      where: {
        status: 'PENDING',
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    // Calculate totals
    const totalRevenue = revenueByCategory
      .filter(r => r.status === 'PAID')
      .reduce((sum, r) => sum + (r._sum.totalAmount || 0), 0);

    const totalBillings = revenueByCategory.reduce((sum, r) => sum + (r._count.id || 0), 0);

    res.json({
      date: reportDate.toISOString().split('T')[0],
      revenue: {
        total: totalRevenue,
        byStatus: revenueByCategory,
        byService: serviceRevenue.map(s => ({
          ...s,
          service: serviceDetails.find(sd => sd.id === s.serviceId)
        }))
      },
      patients: {
        byType: patientStats,
        total: patientStats.reduce((sum, p) => sum + (p._count.id || 0), 0)
      },
      visits: {
        byStatus: visitStats,
        total: visitStats.reduce((sum, v) => sum + (v._count.id || 0), 0)
      },
      pendingOrders: {
        lab: pendingLabOrders,
        radiology: pendingRadiologyOrders,
        medication: pendingMedicationOrders,
        pharmacy: pendingPharmacyInvoices
      },
      summary: {
        totalBillings,
        totalRevenue,
        averageBillingAmount: totalBillings > 0 ? totalRevenue / totalBillings : 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getWeeklyReport = async (req, res) => {
  try {
    const { startDate } = req.query;
    const weekStart = startDate ? new Date(startDate) : new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Daily revenue breakdown
    const dailyRevenue = [];
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(weekStart);
      dayStart.setDate(dayStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayRevenue = await prisma.billing.aggregate({
        where: {
          status: 'PAID',
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        },
        _sum: {
          totalAmount: true
        },
        _count: {
          id: true
        }
      });

      dailyRevenue.push({
        date: dayStart.toISOString().split('T')[0],
        revenue: dayRevenue._sum.totalAmount || 0,
        billings: dayRevenue._count.id || 0
      });
    }

    // Service category performance
    const categoryPerformance = await prisma.billingService.groupBy({
      by: ['serviceId'],
      where: {
        billing: {
          status: 'PAID',
          createdAt: {
            gte: weekStart,
            lte: weekEnd
          }
        }
      },
      _sum: {
        totalPrice: true
      },
      _count: {
        id: true
      }
    });

    // Get service details
    const serviceDetails = await prisma.service.findMany({
      where: {
        id: {
          in: categoryPerformance.map(s => s.serviceId)
        }
      },
      select: {
        id: true,
        name: true,
        category: true,
        code: true
      }
    });

    // Doctor performance
    const doctorPerformance = await prisma.visit.groupBy({
      by: ['createdById'],
      where: {
        status: 'COMPLETED',
        createdAt: {
          gte: weekStart,
          lte: weekEnd
        }
      },
      _count: {
        id: true
      }
    });

    // Get doctor details
    const doctorDetails = await prisma.user.findMany({
      where: {
        id: {
          in: doctorPerformance.map(d => d.createdById).filter(Boolean)
        },
        role: 'DOCTOR'
      },
      select: {
        id: true,
        fullname: true,
        specialties: true
      }
    });

    // Calculate totals
    const totalRevenue = dailyRevenue.reduce((sum, day) => sum + day.revenue, 0);
    const totalBillings = dailyRevenue.reduce((sum, day) => sum + day.billings, 0);

    res.json({
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      dailyRevenue,
      categoryPerformance: categoryPerformance.map(cp => ({
        ...cp,
        service: serviceDetails.find(sd => sd.id === cp.serviceId)
      })),
      doctorPerformance: doctorPerformance.map(dp => ({
        ...dp,
        doctor: doctorDetails.find(dd => dd.id === dp.createdById)
      })),
      summary: {
        totalRevenue,
        totalBillings,
        averageDailyRevenue: totalRevenue / 7,
        averageBillingAmount: totalBillings > 0 ? totalRevenue / totalBillings : 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRevenueReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy } = req.query;
    const start = startDate ? new Date(startDate) : new Date();
    start.setDate(start.getDate() - 30); // Default to last 30 days
    const end = endDate ? new Date(endDate) : new Date();

    // Revenue trends - always group by date for billing table
    const revenueTrends = await prisma.billing.groupBy({
      by: ['createdAt'],
      where: {
        status: 'PAID',
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      }
    });

    // Top performing services
    const topServices = await prisma.billingService.groupBy({
      by: ['serviceId'],
      where: {
        billing: {
          status: 'PAID',
          createdAt: {
            gte: start,
            lte: end
          }
        }
      },
      _sum: {
        totalPrice: true
      },
      _count: {
        id: true
      },
      orderBy: {
        _sum: {
          totalPrice: 'desc'
        }
      },
      take: 10
    });

    // Get service details for top services
    const topServiceDetails = await prisma.service.findMany({
      where: {
        id: {
          in: topServices.map(s => s.serviceId)
        }
      },
      select: {
        id: true,
        name: true,
        category: true,
        code: true,
        price: true
      }
    });

    // Payment method breakdown
    const paymentMethods = await prisma.billPayment.groupBy({
      by: ['type'],
      where: {
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _sum: {
        amount: true
      },
      _count: {
        id: true
      }
    });

    // Insurance vs cash revenue
    const insuranceRevenue = await prisma.billing.aggregate({
      where: {
        status: 'INSURANCE_CLAIMED',
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      }
    });

    const cashRevenue = await prisma.billing.aggregate({
      where: {
        status: 'PAID',
        insuranceId: null,
        createdAt: {
          gte: start,
          lte: end
        }
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      }
    });

    res.json({
      period: {
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0]
      },
      revenueTrends,
      topServices: topServices.map(ts => ({
        ...ts,
        service: topServiceDetails.find(tsd => tsd.id === ts.serviceId)
      })),
      paymentMethods,
      revenueBreakdown: {
        insurance: insuranceRevenue._sum.totalAmount || 0,
        cash: cashRevenue._sum.totalAmount || 0,
        total: (insuranceRevenue._sum.totalAmount || 0) + (cashRevenue._sum.totalAmount || 0)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all nurses (users with role=NURSE)
exports.getNurses = async (req, res) => {
  try {
    const nurses = await prisma.user.findMany({
      where: { 
        role: 'NURSE',
        availability: true 
      },
      select: {
        id: true,
        fullname: true,
        username: true,
        email: true,
        phone: true,
        specialties: true,
        availability: true,
        createdAt: true
      },
      orderBy: { fullname: 'asc' }
    });

    res.json({ nurses });
  } catch (error) {
    console.error('Error fetching nurses:', error);
    res.status(500).json({ error: error.message });
  }
};

// Comprehensive Revenue Stats for Admin Dashboard (ALL users, not just current user)
exports.getRevenueStats = async (req, res) => {
  try {
    const { period = 'daily', startDate, endDate } = req.query;
    
    // Calculate date range based on period
    let start, end;
    const now = new Date();
    
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      switch (period) {
        case 'daily':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          end = new Date(start);
          end.setDate(end.getDate() + 1);
          break;
        case 'weekly':
          const dayOfWeek = now.getDay();
          start = new Date(now);
          start.setDate(start.getDate() - dayOfWeek);
          start.setHours(0, 0, 0, 0);
          end = new Date(start);
          end.setDate(end.getDate() + 7);
          break;
        case 'monthly':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          break;
        case 'yearly':
          start = new Date(now.getFullYear(), 0, 1);
          end = new Date(now.getFullYear() + 1, 0, 1);
          break;
        default:
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          end = new Date(start);
          end.setDate(end.getDate() + 1);
      }
    }

    // ========== MEDICAL REVENUE (Completed/PAID) ==========
    // Get all PAID payments from BillPayment (not user-specific)
    const medicalPayments = await prisma.billPayment.findMany({
      where: {
        createdAt: {
          gte: start,
          lt: end
        }
      },
      include: {
        billing: {
          include: {
            services: {
              include: {
                service: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Count completed visits
    const completedVisits = await prisma.visit.count({
      where: {
        status: 'COMPLETED',
        updatedAt: {
          gte: start,
          lt: end
        }
      }
    });

    // Count lab tests completed
    const labTests = await prisma.labOrder.count({
      where: {
        status: 'COMPLETED',
        updatedAt: {
          gte: start,
          lt: end
        }
      }
    });

    // Count radiology scans completed
    const radiologyScans = await prisma.radiologyOrder.count({
      where: {
        status: 'COMPLETED',
        updatedAt: {
          gte: start,
          lt: end
        }
      }
    });

    // Calculate medical revenue breakdown
    const medicalRevenue = medicalPayments.reduce((sum, p) => sum + p.amount, 0);
    const medicalByType = medicalPayments.reduce((acc, p) => {
      acc[p.type] = acc[p.type] || { count: 0, amount: 0 };
      acc[p.type].count += 1;
      acc[p.type].amount += p.amount;
      return acc;
    }, {});

    // ========== PHARMACY REVENUE (Completed/PAID) ==========
    // Get all PAID pharmacy invoices
    const pharmacyInvoices = await prisma.pharmacyInvoice.findMany({
      where: {
        status: 'PAID',
        createdAt: {
          gte: start,
          lt: end
        }
      },
      include: {
        dispensedMedicines: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const pharmacyRevenue = pharmacyInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
    const prescriptions = pharmacyInvoices.length;
    const medicationsDispensed = pharmacyInvoices.reduce((sum, inv) => 
      sum + inv.dispensedMedicines.length, 0
    );

    // ========== PENDING MEDICAL BILLS ==========
    const pendingMedicalBills = await prisma.billing.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          gte: start,
          lt: end
        },
        NOT: {
          billingType: 'EMERGENCY'
        }
      },
      select: {
        totalAmount: true
      }
    });

    const pendingMedicalRevenue = pendingMedicalBills.reduce((sum, b) => sum + b.totalAmount, 0);

    // ========== PENDING PHARMACY INVOICES ==========
    const pendingPharmacyInvoices = await prisma.pharmacyInvoice.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          gte: start,
          lt: end
        }
      },
      select: {
        totalAmount: true
      }
    });

    const pendingPharmacyRevenue = pendingPharmacyInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    // ========== RESPONSE STRUCTURE ==========
    const response = {
      period,
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString()
      },
      completed: {
        medical: {
          revenue: medicalRevenue,
          transactions: medicalPayments.length,
          consultations: completedVisits,
          labTests,
          radiologyScans,
          byType: medicalByType
        },
        pharmacy: {
          revenue: pharmacyRevenue,
          prescriptions,
          medications: medicationsDispensed,
          transactions: pharmacyInvoices.length
        },
        combined: {
          totalRevenue: medicalRevenue + pharmacyRevenue,
          totalTransactions: medicalPayments.length + pharmacyInvoices.length
        }
      },
      pending: {
        medical: {
          revenue: pendingMedicalRevenue,
          bills: pendingMedicalBills.length
        },
        pharmacy: {
          revenue: pendingPharmacyRevenue,
          invoices: pendingPharmacyInvoices.length
        },
        combined: {
          totalRevenue: pendingMedicalRevenue + pendingPharmacyRevenue,
          totalBills: pendingMedicalBills.length + pendingPharmacyInvoices.length
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error getting revenue stats:', error);
    res.status(500).json({ error: error.message });
  }
};

// Export financial report to Excel (CSV)
exports.exportFinancialReportExcel = async (req, res) => {
  try {
    const { period, revenueType, year, month, dailyBreakdown } = req.body;
    const fs = require('fs');
    const path = require('path');

    // Build CSV content
    const headers = ['Date', 'Medical Revenue (ETB)', 'Pharmacy Revenue (ETB)', 'Total Revenue (ETB)'];
    const rows = [];

    if (dailyBreakdown && dailyBreakdown.length > 0) {
      dailyBreakdown.forEach(day => {
        rows.push([
          new Date(day.date).toLocaleDateString(),
          (day.medical?.revenue || 0).toFixed(2),
          (day.pharmacy?.revenue || 0).toFixed(2),
          (day.combined?.revenue || 0).toFixed(2)
        ]);
      });
    } else {
      // If no data, add a message row
      rows.push(['No data available for the selected period', '', '', '']);
    }

    const csvContent = [
      'Selihom Medical Clinic - Financial Report',
      `Period: ${period === 'daily' ? 'Daily' : `${getMonthName(month)} ${year}`}`,
      `Revenue Type: ${revenueType}`,
      `Generated: ${new Date().toLocaleString()}`,
      '',
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const fileName = `financial-report-${revenueType}-${year}-${month + 1}-${Date.now()}.csv`;
    const filePath = path.join(__dirname, '../../uploads', fileName);
    const uploadsDir = path.dirname(filePath);
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    fs.writeFileSync(filePath, '\ufeff' + csvContent, 'utf8');

    res.json({
      message: 'Excel file generated successfully',
      fileName,
      filePath: `/uploads/${fileName}`
    });
  } catch (error) {
    console.error('Error exporting financial report to Excel:', error);
    res.status(500).json({ error: error.message });
  }
};

// Helper function to get month name
function getMonthName(monthIndex) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[monthIndex] || 'Unknown';
}

// Export financial report to PDF
exports.exportFinancialReportPDF = async (req, res) => {
  try {
    const { period, revenueType, year, month, dailyBreakdown, revenueStats } = req.body;
    const PdfPrinter = require('pdfmake');
    const fs = require('fs');
    const path = require('path');

    // Define fonts
    const fonts = {
      Roboto: {
        normal: path.join(__dirname, '../../node_modules/roboto-font/fonts/Roboto/roboto-regular-webfont.ttf'),
        bold: path.join(__dirname, '../../node_modules/roboto-font/fonts/Roboto/roboto-bold-webfont.ttf'),
        italics: path.join(__dirname, '../../node_modules/roboto-font/fonts/Roboto/roboto-italic-webfont.ttf'),
        bolditalics: path.join(__dirname, '../../node_modules/roboto-font/fonts/Roboto/roboto-bolditalic-webfont.ttf')
      }
    };

    const printer = new PdfPrinter(fonts);

    // Build table rows
    const tableBody = [
      [
        { text: 'Date', style: 'tableHeader', bold: true },
        { text: 'Medical Revenue (ETB)', style: 'tableHeader', bold: true, alignment: 'right' },
        { text: 'Pharmacy Revenue (ETB)', style: 'tableHeader', bold: true, alignment: 'right' },
        { text: 'Total Revenue (ETB)', style: 'tableHeader', bold: true, alignment: 'right' }
      ]
    ];

    let totalMedical = 0;
    let totalPharmacy = 0;
    let totalCombined = 0;

    if (dailyBreakdown && dailyBreakdown.length > 0) {
      dailyBreakdown.forEach(day => {
        const medical = day.medical?.revenue || 0;
        const pharmacy = day.pharmacy?.revenue || 0;
        const combined = day.combined?.revenue || 0;
        
        totalMedical += medical;
        totalPharmacy += pharmacy;
        totalCombined += combined;

        tableBody.push([
          new Date(day.date).toLocaleDateString(),
          { text: medical.toFixed(2), alignment: 'right' },
          { text: pharmacy.toFixed(2), alignment: 'right' },
          { text: combined.toFixed(2), alignment: 'right' }
        ]);
      });

      // Add totals row
      tableBody.push([
        { text: 'TOTAL', bold: true },
        { text: totalMedical.toFixed(2), bold: true, alignment: 'right' },
        { text: totalPharmacy.toFixed(2), bold: true, alignment: 'right' },
        { text: totalCombined.toFixed(2), bold: true, alignment: 'right' }
      ]);
    } else {
      tableBody.push([
        { text: 'No data available for the selected period', colSpan: 4, alignment: 'center', italics: true },
        {},
        {},
        {}
      ]);
    }

    const docDefinition = {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      content: [
        {
          text: 'Selihom Medical Clinic',
          style: 'clinicName',
          alignment: 'center',
          margin: [0, 0, 0, 10]
        },
        {
          text: 'Financial Report',
          style: 'subheader',
          alignment: 'center',
          margin: [0, 0, 0, 5]
        },
        {
          text: `Period: ${period === 'daily' ? 'Daily' : `${getMonthName(month)} ${year}`}`,
          style: 'field',
          alignment: 'center',
          margin: [0, 0, 0, 5]
        },
        {
          text: `Revenue Type: ${revenueType.toUpperCase()}`,
          style: 'field',
          alignment: 'center',
          margin: [0, 0, 0, 5]
        },
        {
          text: `Generated: ${new Date().toLocaleString()}`,
          style: 'field',
          alignment: 'center',
          margin: [0, 0, 0, 20]
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', '*', '*', '*'],
            body: tableBody
          },
          layout: {
            hLineWidth: (i, node) => i === 0 || i === node.table.body.length ? 1 : 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#aaa',
            vLineColor: () => '#aaa',
            paddingLeft: () => 5,
            paddingRight: () => 5,
            paddingTop: () => 5,
            paddingBottom: () => 5
          }
        },
        { text: '', margin: [0, 30, 0, 0] },
        {
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1, color: '#000' }],
          margin: [0, 0, 0, 5]
        },
        {
          text: 'Signature: _________________________',
          style: 'field',
          margin: [0, 0, 0, 5]
        },
        {
          text: 'Date: _________________________',
          style: 'field',
          margin: [0, 0, 0, 0]
        }
      ],
      styles: {
        clinicName: {
          fontSize: 18,
          bold: true,
          color: '#000'
        },
        subheader: {
          fontSize: 14,
          color: '#666'
        },
        field: {
          fontSize: 11,
          color: '#000'
        },
        tableHeader: {
          fontSize: 10,
          color: '#000',
          fillColor: '#f0f0f0'
        }
      }
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    const fileName = `financial-report-${revenueType}-${year}-${month + 1}-${Date.now()}.pdf`;
    const filePath = path.join(__dirname, '../../uploads', fileName);
    const uploadsDir = path.dirname(filePath);
    
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    pdfDoc.pipe(fs.createWriteStream(filePath));
    pdfDoc.end();

    await new Promise((resolve) => {
      pdfDoc.on('end', resolve);
    });

    res.json({
      message: 'PDF generated successfully',
      fileName,
      filePath: `/uploads/${fileName}`
    });
  } catch (error) {
    console.error('Error exporting financial report to PDF:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get admin dashboard stats
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Total Patients
    const totalPatients = await prisma.patient.count({
      where: {
        status: 'Active'
      }
    });

    // Active Doctors (users with role DOCTOR and availability true)
    const totalDoctors = await prisma.user.count({
      where: {
        role: 'DOCTOR',
        availability: true
      }
    });

    // Active Nurses (users with role NURSE and availability true)
    const totalNurses = await prisma.user.count({
      where: {
        role: 'NURSE',
        availability: true
      }
    });

    // Pending Billings (billings with status PENDING)
    const pendingBillings = await prisma.billing.count({
      where: {
        status: 'PENDING'
      }
    });

    // Pending Lab Orders (lab orders that are not completed)
    const pendingLabOrders = await prisma.labOrder.count({
      where: {
        status: {
          in: ['UNPAID', 'PAID', 'QUEUED', 'IN_PROGRESS']
        }
      }
    });

    // Also count batch orders for lab
    const pendingBatchLabOrders = await prisma.batchOrder.count({
      where: {
        type: 'LAB',
        status: {
          in: ['UNPAID', 'PAID', 'QUEUED', 'IN_PROGRESS']
        }
      }
    });

    const totalPendingLabOrders = pendingLabOrders + pendingBatchLabOrders;

    // Pending Radiology Orders
    const pendingRadiologyOrders = await prisma.radiologyOrder.count({
      where: {
        status: {
          in: ['UNPAID', 'PAID', 'QUEUED', 'IN_PROGRESS']
        }
      }
    });

    // Also count batch orders for radiology
    const pendingBatchRadiologyOrders = await prisma.batchOrder.count({
      where: {
        type: 'RADIOLOGY',
        status: {
          in: ['UNPAID', 'PAID', 'QUEUED', 'IN_PROGRESS']
        }
      }
    });

    const totalPendingRadiologyOrders = pendingRadiologyOrders + pendingBatchRadiologyOrders;

    // Pharmacy Queue (pharmacy invoices with status PENDING)
    const pharmacyQueue = await prisma.pharmacyInvoice.count({
      where: {
        status: 'PENDING'
      }
    });

    // Today's Appointments
    const todayAppointments = await prisma.appointment.count({
      where: {
        appointmentDate: {
          gte: today,
          lt: tomorrow
        },
        status: {
          in: ['SCHEDULED', 'ARRIVED', 'IN_PROGRESS']
        }
      }
    });

    res.json({
      totalPatients,
      totalDoctors,
      totalNurses,
      pendingBillings,
      pendingLabOrders: totalPendingLabOrders,
      pendingRadiologyOrders: totalPendingRadiologyOrders,
      pharmacyQueue,
      todayAppointments
    });
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get daily breakdown for a specific month
exports.getDailyBreakdown = async (req, res) => {
  try {
    const { year, month } = req.query; // e.g., year=2025, month=10 (0-based)
    
    const daysInMonth = new Date(year, parseInt(month) + 1, 0).getDate();
    const dailyData = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStart = new Date(year, month, day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(year, month, day);
      dayEnd.setHours(23, 59, 59, 999);
      
      // Get medical payments for this day
      const medicalPayments = await prisma.billPayment.findMany({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      });
      
      // Get pharmacy invoices for this day
      const pharmacyInvoices = await prisma.pharmacyInvoice.findMany({
        where: {
          status: 'PAID',
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        }
      });
      
      const medicalRevenue = medicalPayments.reduce((sum, p) => sum + p.amount, 0);
      const pharmacyRevenue = pharmacyInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const totalRevenue = medicalRevenue + pharmacyRevenue;
      
      dailyData.push({
        date: `${year}-${String(parseInt(month) + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        day,
        medical: {
          revenue: medicalRevenue,
          transactions: medicalPayments.length
        },
        pharmacy: {
          revenue: pharmacyRevenue,
          transactions: pharmacyInvoices.length
        },
        combined: {
          revenue: totalRevenue,
          transactions: medicalPayments.length + pharmacyInvoices.length
        }
      });
    }
    
    res.json({ dailyData });
  } catch (error) {
    console.error('Error getting daily breakdown:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get doctor performance statistics
exports.getDoctorPerformanceStats = async (req, res) => {
  try {
    const { period = 'daily', doctorId } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate, endDate;
    
    if (period === 'daily') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (period === 'weekly') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === 'yearly') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }
    
    // Get all doctors with consultation fees
    const doctors = await prisma.user.findMany({
      where: {
        role: 'DOCTOR',
        ...(doctorId && { id: doctorId })
      },
      select: {
        id: true,
        fullname: true,
        consultationFee: true
      }
    });
    
    // Find consultation service (not used in this function but keeping for consistency)
    // const consultationService = await prisma.service.findFirst({
    //   where: {
    //     category: 'CONSULTATION',
    //     name: { contains: 'Consultation', mode: 'insensitive' }
    //   }
    // });
    
    const results = await Promise.all(doctors.map(async (doctor) => {
      // Find all visits with this doctor assigned via suggestedDoctorId OR assignmentId
      // First, get assignment IDs for this doctor
      const assignments = await prisma.assignment.findMany({
        where: {
          doctorId: doctor.id
        },
        select: {
          id: true
        }
      });
      const assignmentIds = assignments.map(a => a.id);
      
      // Build the where clause for visits
      const visitWhere = {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      };
      
      // Add OR condition only if we have assignmentIds, otherwise just use suggestedDoctorId
      if (assignmentIds.length > 0) {
        visitWhere.OR = [
          { suggestedDoctorId: doctor.id },
          { assignmentId: { in: assignmentIds } }
        ];
      } else {
        visitWhere.suggestedDoctorId = doctor.id;
      }
      
      // Find visits assigned to this doctor
      const visits = await prisma.visit.findMany({
        where: visitWhere,
        select: {
          id: true,
          createdAt: true,
          patientId: true,
          patient: {
            select: {
              name: true
            }
          }
        }
      });
      
      console.log(`🔍 Doctor ${doctor.fullname} (${doctor.id}):`);
      console.log(`   - Assignment IDs: ${assignmentIds.length}`);
      console.log(`   - Visits found: ${visits.length}`);
      console.log(`   - Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      
      // Get ALL billings for these visits (not just consultation fees)
      const visitIds = visits.map(v => v.id);
      const billings = visitIds.length > 0 ? await prisma.billing.findMany({
        where: {
          visitId: { in: visitIds }
        },
        include: {
          services: {
            include: {
              service: {
                select: {
                  name: true,
                  category: true
                }
              }
            }
          },
          payments: true // Include all payment types
        }
      }) : [];
      
      console.log(`   - Billings found: ${billings.length}`);
      
      // Calculate statistics
      const totalPatients = visits.length;
      // Calculate total revenue from ALL paid billings (not just consultation)
      const totalRevenue = billings.reduce((sum, b) => {
        const paidAmount = b.payments.reduce((pSum, p) => pSum + p.amount, 0);
        return sum + paidAmount;
      }, 0);
      const avgPerPatient = totalPatients > 0 ? totalRevenue / totalPatients : 0;
      
      console.log(`   - Total Revenue: ${totalRevenue}`);
      console.log(`   - Total Patients: ${totalPatients}`);
      
      return {
        doctorId: doctor.id,
        doctorName: doctor.fullname,
        consultationFee: doctor.consultationFee,
        totalPatients,
        totalRevenue,
        avgPerPatient,
        visits: visits.map(v => ({
          id: v.id,
          date: v.createdAt,
          patientId: v.patientId,
          patientName: v.patient.name
        }))
      };
    }));
    
    // Calculate summary statistics
    const summary = {
      totalConsultationFees: results.reduce((sum, r) => sum + r.totalRevenue, 0),
      avgPerDoctor: results.length > 0 ? results.reduce((sum, r) => sum + r.totalRevenue, 0) / results.length : 0,
      totalConsultations: results.reduce((sum, r) => sum + r.totalPatients, 0),
      topPerformer: results.reduce((top, current) => current.totalRevenue > top.totalRevenue ? current : top, results[0] || null)
    };
    
    res.json({
      period,
      dateRange: { startDate, endDate },
      summary,
      doctors: results
    });
  } catch (error) {
    console.error('Error getting doctor performance stats:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get doctor daily breakdown for calendar view
exports.getDoctorDailyBreakdown = async (req, res) => {
  try {
    const { doctorId, year, month } = req.query;
    
    if (!doctorId) {
      return res.status(400).json({ error: 'Doctor ID is required' });
    }
    
    const y = parseInt(year || new Date().getFullYear());
    const m = parseInt(month || new Date().getMonth());
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const dailyData = [];
    
    // Find consultation service
    const consultationService = await prisma.service.findFirst({
      where: {
        category: 'CONSULTATION',
        name: { contains: 'Consultation', mode: 'insensitive' }
      }
    });
    
    // Get assignment IDs for this doctor
    const assignments = await prisma.assignment.findMany({
      where: {
        doctorId: doctorId
      },
      select: {
        id: true
      }
    });
    const assignmentIds = assignments.map(a => a.id);
    
    console.log(`🔍 Daily Breakdown - Doctor ID: ${doctorId}`);
    console.log(`   - Assignment IDs: ${assignmentIds.length}`);
    console.log(`   - Month: ${m + 1}, Year: ${y}`);
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStart = new Date(y, m, day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(y, m, day);
      dayEnd.setHours(23, 59, 59, 999);
      
      // Build the where clause for visits
      const visitWhere = {
        createdAt: {
          gte: dayStart,
          lte: dayEnd
        }
      };
      
      // Add OR condition only if we have assignmentIds, otherwise just use suggestedDoctorId
      if (assignmentIds.length > 0) {
        visitWhere.OR = [
          { suggestedDoctorId: doctorId },
          { assignmentId: { in: assignmentIds } }
        ];
      } else {
        visitWhere.suggestedDoctorId = doctorId;
      }
      
      // Find visits for this doctor on this day (via suggestedDoctorId OR assignmentId)
      const visits = await prisma.visit.findMany({
        where: visitWhere,
        select: {
          id: true
        }
      });
      
      // Get ALL billings for these visits (not just consultation)
      const visitIds = visits.map(v => v.id);
      const billings = visitIds.length > 0 ? await prisma.billing.findMany({
        where: {
          visitId: { in: visitIds }
        },
        include: {
          services: {
            include: {
              service: {
                select: {
                  name: true,
                  category: true
                }
              }
            }
          },
          payments: true,
          visit: {
            include: {
              patient: {
                select: {
                  name: true
                }
              }
            }
          }
        }
      }) : [];
      
      // Calculate revenue for this day from ALL billings
      const revenue = billings.reduce((sum, b) => {
        const paidAmount = b.payments.reduce((pSum, p) => pSum + p.amount, 0);
        return sum + paidAmount;
      }, 0);
      
      // Get patient details for this day
      const patients = await Promise.all(billings.map(async (b) => {
        // Get visit details including patient name if not already loaded
        let visitDetails = b.visit;
        if (!visitDetails || !visitDetails.patient) {
          visitDetails = await prisma.visit.findUnique({
            where: { id: b.visitId },
            include: {
              patient: {
                select: {
                  name: true
                }
              }
            }
          });
        }
        
        // Calculate total amount from all services in this billing
        const totalAmount = b.services.reduce((s, sv) => s + sv.totalPrice, 0);
        
        return {
          visitId: b.visitId,
          patientName: visitDetails?.patient?.name || 'Unknown',
          amount: totalAmount,
          paymentStatus: b.payments.length > 0 ? 'PAID' : 'PENDING',
          date: visitDetails?.createdAt || b.createdAt
        };
      }));
      
      dailyData.push({
        date: `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        day,
        revenue,
        patients: patients.length,
        details: patients
      });
    }
    
    res.json({ dailyData });
  } catch (error) {
    console.error('Error getting doctor daily breakdown:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get nurse performance statistics
exports.getNursePerformanceStats = async (req, res) => {
  try {
    const { period = 'daily', nurseId } = req.query;
    
    // Calculate date range based on period
    const now = new Date();
    let startDate, endDate;
    
    if (period === 'daily') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (period === 'weekly') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - now.getDay());
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else if (period === 'monthly') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === 'yearly') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    }
    
    // Get all nurses
    const nurses = await prisma.user.findMany({
      where: {
        role: 'NURSE',
        ...(nurseId && { id: nurseId })
      },
      select: {
        id: true,
        fullname: true,
        username: true
      }
    });
    
    const results = await Promise.all(nurses.map(async (nurse) => {
      // Count triages - visits where this nurse recorded vitals (tracked via audit logs)
      // We'll count audit logs where this nurse recorded vitals
      const triageAuditLogs = await prisma.auditLog.findMany({
        where: {
          userId: nurse.id,
          action: 'RECORD_VITALS',
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          entityId: true,
          details: true
        }
      });

      // Count unique visits triaged by this nurse
      const triagedVisitIds = new Set();
      triageAuditLogs.forEach(log => {
        try {
          const details = JSON.parse(log.details || '{}');
          if (details.visitId) {
            triagedVisitIds.add(details.visitId);
          }
        } catch (e) {
          // Skip invalid JSON
        }
      });
      const triageCount = triagedVisitIds.size;

      // Get nurse service assignments (services ordered by this nurse)
      const serviceAssignments = await prisma.nurseServiceAssignment.findMany({
        where: {
          assignedById: nurse.id, // Nurse who ordered the service
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              price: true,
              category: true
            }
          },
          visit: {
            include: {
              patient: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });

      // Calculate statistics
      const totalServicesOrdered = serviceAssignments.length;
      const totalRevenue = serviceAssignments.reduce((sum, assignment) => {
        // Only count non-waived services
        const servicePrice = assignment.isWaived ? 0 : (assignment.service.price || 0);
        return sum + servicePrice;
      }, 0);

      // Get unique patients served
      const uniquePatients = new Set(serviceAssignments.map(a => a.visit.patientId));
      const totalPatients = uniquePatients.size;

      // Get service breakdown by category
      const serviceBreakdown = {};
      serviceAssignments.forEach(assignment => {
        const category = assignment.service.category || 'OTHER';
        if (!serviceBreakdown[category]) {
          serviceBreakdown[category] = { count: 0, revenue: 0 };
        }
        serviceBreakdown[category].count++;
        const servicePrice = assignment.isWaived ? 0 : (assignment.service.price || 0);
        serviceBreakdown[category].revenue += servicePrice;
      });

      // Get patient details
      const patientDetails = Array.from(uniquePatients).map(patientId => {
        const patientAssignments = serviceAssignments.filter(a => a.visit.patientId === patientId);
        const patient = patientAssignments[0]?.visit.patient;
        const patientRevenue = patientAssignments.reduce((sum, a) => {
          const servicePrice = a.isWaived ? 0 : (a.service.price || 0);
          return sum + servicePrice;
        }, 0);
        return {
          patientId: patientId,
          patientName: patient?.name || 'Unknown',
          servicesCount: patientAssignments.length,
          revenue: patientRevenue
        };
      });

      return {
        nurseId: nurse.id,
        nurseName: nurse.fullname,
        username: nurse.username,
        triageCount,
        totalServicesOrdered,
        totalRevenue,
        totalPatients,
        avgPerPatient: totalPatients > 0 ? totalRevenue / totalPatients : 0,
        serviceBreakdown,
        patientDetails
      };
    }));
    
    // Calculate summary statistics
    const summary = {
      totalTriages: results.reduce((sum, r) => sum + r.triageCount, 0),
      totalServicesOrdered: results.reduce((sum, r) => sum + r.totalServicesOrdered, 0),
      totalRevenue: results.reduce((sum, r) => sum + r.totalRevenue, 0),
      avgPerNurse: results.length > 0 ? results.reduce((sum, r) => sum + r.totalRevenue, 0) / results.length : 0,
      topPerformer: results.length > 0 ? results.reduce((top, current) => current.totalRevenue > top.totalRevenue ? current : top, results[0]) : null
    };
    
    res.json({
      period,
      dateRange: { startDate, endDate },
      summary,
      nurses: results
    });
  } catch (error) {
    console.error('Error getting nurse performance stats:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get nurse daily breakdown for calendar view
exports.getNurseDailyBreakdown = async (req, res) => {
  try {
    const { nurseId, year, month } = req.query;
    
    if (!nurseId) {
      return res.status(400).json({ error: 'Nurse ID is required' });
    }
    
    const y = parseInt(year || new Date().getFullYear());
    const m = parseInt(month || new Date().getMonth());
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const dailyData = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStart = new Date(y, m, day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(y, m, day);
      dayEnd.setHours(23, 59, 59, 999);
      
      // Count triages for this day - visits where this nurse recorded vitals
      const triageAuditLogs = await prisma.auditLog.findMany({
        where: {
          userId: nurseId,
          action: 'RECORD_VITALS',
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        },
        select: {
          entityId: true,
          details: true
        }
      });

      // Count unique visits triaged by this nurse on this day
      const triagedVisitIds = new Set();
      triageAuditLogs.forEach(log => {
        try {
          const details = JSON.parse(log.details || '{}');
          if (details.visitId) {
            triagedVisitIds.add(details.visitId);
          }
        } catch (e) {
          // Skip invalid JSON
        }
      });
      const triageCount = triagedVisitIds.size;

      // Get service assignments for this nurse on this day
      const serviceAssignments = await prisma.nurseServiceAssignment.findMany({
        where: {
          assignedById: nurseId, // Nurse who ordered the service
          createdAt: {
            gte: dayStart,
            lte: dayEnd
          }
        },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              price: true,
              category: true
            }
          },
          visit: {
            include: {
              patient: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });
      
      // Calculate revenue for this day
      const revenue = serviceAssignments.reduce((sum, assignment) => {
        const servicePrice = assignment.isWaived ? 0 : (assignment.service.price || 0);
        return sum + servicePrice;
      }, 0);
      
      // Get patient details for this day
      const patients = serviceAssignments.map(assignment => ({
        visitId: assignment.visitId,
        patientId: assignment.visit.patientId,
        patientName: assignment.visit.patient.name,
        serviceName: assignment.service.name,
        serviceCategory: assignment.service.category,
        amount: assignment.isWaived ? 0 : (assignment.service.price || 0),
        isWaived: assignment.isWaived,
        date: assignment.createdAt
      }));
      
      dailyData.push({
        date: `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        day,
        triageCount,
        servicesOrdered: serviceAssignments.length,
        revenue,
        patients: [...new Set(patients.map(p => p.patientId))].length,
        details: patients
      });
    }
    
    res.json({ dailyData });
  } catch (error) {
    console.error('Error getting nurse daily breakdown:', error);
    res.status(500).json({ error: error.message });
  }
};

// ============================================
// LAB TEST MANAGEMENT (NEW SYSTEM)
// ============================================

// Lab Test Groups CRUD
exports.createLabTestGroup = async (req, res) => {
  try {
    const data = createLabTestGroupSchema.parse(req.body);
    const userId = req.user.id;

    const group = await prisma.labTestGroup.create({
      data: {
        ...data,
        createdBy: userId,
        updatedBy: userId,
        displayOrder: data.displayOrder || 0,
        isActive: data.isActive !== false
      }
    });

    res.status(201).json({
      message: 'Lab test group created successfully',
      group
    });
  } catch (error) {
    console.error('Error creating lab test group:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getLabTestGroups = async (req, res) => {
  try {
    const { category, isActive } = req.query;
    
    const whereClause = {};
    if (category) whereClause.category = category;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';

    const groups = await prisma.labTestGroup.findMany({
      where: whereClause,
      include: {
        tests: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
          select: {
            id: true,
            name: true,
            code: true,
            price: true,
            displayOrder: true
          }
        }
      },
      orderBy: { displayOrder: 'asc' }
    });

    res.json({ groups });
  } catch (error) {
    console.error('Error fetching lab test groups:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateLabTestGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const data = createLabTestGroupSchema.partial().parse(req.body);
    const userId = req.user.id;

    const group = await prisma.labTestGroup.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId
      }
    });

    res.json({
      message: 'Lab test group updated successfully',
      group
    });
  } catch (error) {
    console.error('Error updating lab test group:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteLabTestGroup = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if group has tests
    const testCount = await prisma.labTest.count({
      where: { groupId: id }
    });

    if (testCount > 0) {
      return res.status(400).json({
        error: `Cannot delete group with ${testCount} associated test(s). Please remove or reassign tests first.`
      });
    }

    await prisma.labTestGroup.delete({
      where: { id }
    });

    res.json({
      message: 'Lab test group deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lab test group:', error);
    res.status(500).json({ error: error.message });
  }
};

// Lab Tests CRUD
exports.createLabTest = async (req, res) => {
  try {
    const data = createLabTestSchema.parse(req.body);
    const userId = req.user.id;

    // Auto-generate code if not provided
    let testCode = data.code;
    if (!testCode || testCode.trim() === '') {
      const categoryCode = data.category.substring(0, 3).toUpperCase();
      const count = await prisma.labTest.count({
        where: { category: data.category }
      });
      testCode = `${categoryCode}${String(count + 1).padStart(4, '0')}`;
    }

    // Check if code already exists
    const existingTest = await prisma.labTest.findUnique({
      where: { code: testCode }
    });

    if (existingTest) {
      return res.status(400).json({
        error: 'Test code already exists. Please choose a different code.'
      });
    }

    // Create or find service for billing
    let service = await prisma.service.findUnique({
      where: { code: testCode }
    });

    if (!service) {
      service = await prisma.service.create({
        data: {
          code: testCode,
          name: data.name,
          category: 'LAB',
          price: data.price,
          description: data.description || `${data.name} test`,
          isActive: data.isActive !== false
        }
      });
    }

    // Create test
    const test = await prisma.labTest.create({
      data: {
        name: data.name,
        code: testCode,
        category: data.category,
        description: data.description,
        price: data.price,
        unit: data.unit || 'UNIT',
        groupId: data.groupId || null,
        displayOrder: data.displayOrder || 0,
        serviceId: service.id,
        isActive: data.isActive !== false,
        createdBy: userId,
        updatedBy: userId
      }
    });

    // Create result fields if provided
    if (data.resultFields && data.resultFields.length > 0) {
      await prisma.labTestResultField.createMany({
        data: data.resultFields.map(field => ({
          testId: test.id,
          fieldName: field.fieldName,
          label: field.label,
          fieldType: field.fieldType,
          unit: field.unit || null,
          normalRange: field.normalRange || null,
          options: field.options || null,
          isRequired: field.isRequired || false,
          displayOrder: field.displayOrder || 0
        }))
      });
    }

    const testWithFields = await prisma.labTest.findUnique({
      where: { id: test.id },
      include: {
        resultFields: {
          orderBy: { displayOrder: 'asc' }
        },
        group: true,
        service: true
      }
    });

    res.status(201).json({
      message: 'Lab test created successfully',
      test: testWithFields
    });
  } catch (error) {
    console.error('Error creating lab test:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getLabTests = async (req, res) => {
  try {
    const { category, groupId, isActive } = req.query;
    
    const whereClause = {};
    if (category) whereClause.category = category;
    if (groupId) whereClause.groupId = groupId;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';

    const tests = await prisma.labTest.findMany({
      where: whereClause,
      include: {
        group: {
          select: {
            id: true,
            name: true,
            category: true
          }
        },
        resultFields: {
          orderBy: { displayOrder: 'asc' }
        },
        service: {
          select: {
            id: true,
            code: true,
            name: true,
            price: true
          }
        }
      },
      orderBy: [
        { category: 'asc' },
        { displayOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({ tests });
  } catch (error) {
    console.error('Error fetching lab tests:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getLabTest = async (req, res) => {
  try {
    const { id } = req.params;

    const test = await prisma.labTest.findUnique({
      where: { id },
      include: {
        group: true,
        resultFields: {
          orderBy: { displayOrder: 'asc' }
        },
        service: true
      }
    });

    if (!test) {
      return res.status(404).json({ error: 'Lab test not found' });
    }

    res.json({ test });
  } catch (error) {
    console.error('Error fetching lab test:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateLabTest = async (req, res) => {
  try {
    const { id } = req.params;
    const data = createLabTestSchema.partial().parse(req.body);
    const userId = req.user.id;

    // If code is being updated, check if it already exists
    if (data.code) {
      const existingTest = await prisma.labTest.findFirst({
        where: {
          code: data.code,
          id: { not: id }
        }
      });

      if (existingTest) {
        return res.status(400).json({
          error: 'Test code already exists. Please choose a different code.'
        });
      }
    }

    // Update test
    const test = await prisma.labTest.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId
      }
    });

    // Update service if price or name changed
    if (test.serviceId && (data.price || data.name)) {
      const serviceUpdate = {};
      if (data.price) serviceUpdate.price = data.price;
      if (data.name) serviceUpdate.name = data.name;
      
      await prisma.service.update({
        where: { id: test.serviceId },
        data: serviceUpdate
      });
    }

    // Update result fields if provided
    if (data.resultFields) {
      // Delete existing fields
      await prisma.labTestResultField.deleteMany({
        where: { testId: id }
      });

      // Create new fields
      if (data.resultFields.length > 0) {
        await prisma.labTestResultField.createMany({
          data: data.resultFields.map(field => ({
            testId: id,
            fieldName: field.fieldName,
            label: field.label,
            fieldType: field.fieldType,
            unit: field.unit || null,
            normalRange: field.normalRange || null,
            options: field.options || null,
            isRequired: field.isRequired || false,
            displayOrder: field.displayOrder || 0
          }))
        });
      }
    }

    const testWithFields = await prisma.labTest.findUnique({
      where: { id },
      include: {
        resultFields: {
          orderBy: { displayOrder: 'asc' }
        },
        group: true,
        service: true
      }
    });

    res.json({
      message: 'Lab test updated successfully',
      test: testWithFields
    });
  } catch (error) {
    console.error('Error updating lab test:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteLabTest = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if test has orders
    const orderCount = await prisma.labTestOrder.count({
      where: { labTestId: id }
    });

    if (orderCount > 0) {
      return res.status(400).json({
        error: `Cannot delete test with ${orderCount} existing order(s). Deactivate instead.`
      });
    }

    // Delete result fields first
    await prisma.labTestResultField.deleteMany({
      where: { testId: id }
    });

    // Get service ID before deleting test
    const test = await prisma.labTest.findUnique({
      where: { id },
      select: { serviceId: true }
    });

    // Delete test
    await prisma.labTest.delete({
      where: { id }
    });

    // Optionally delete associated service (if not used elsewhere)
    if (test.serviceId) {
      const serviceUsage = await prisma.billingService.count({
        where: { serviceId: test.serviceId }
      });

      if (serviceUsage === 0) {
        await prisma.service.delete({
          where: { id: test.serviceId }
        });
      }
    }

    res.json({
      message: 'Lab test deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lab test:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all lab tests organized by category and groups (for ordering UI)
exports.getLabTestsForOrdering = async (req, res) => {
  try {
    console.log('📋 [getLabTestsForOrdering] Request received:', {
      method: req.method,
      path: req.path,
      user: req.user?.id,
      role: req.user?.role
    });
    
    const groups = await prisma.labTestGroup.findMany({
      where: { isActive: true },
      include: {
        tests: {
          where: { 
            AND: [
              { isActive: true },
              {
                OR: [
                  { serviceId: null },
                  { service: { isActive: true } }
                ]
              }
            ]
          },
          orderBy: { displayOrder: 'asc' },
          select: {
            id: true,
            name: true,
            code: true,
            category: true,
            price: true,
            description: true
          }
        }
      },
      orderBy: [
        { category: 'asc' },
        { displayOrder: 'asc' }
      ]
    });

    // Get standalone tests (not in groups)
    const standaloneTests = await prisma.labTest.findMany({
      where: {
        AND: [
          { isActive: true },
          { groupId: null },
          {
            OR: [
              { serviceId: null },
              { service: { isActive: true } }
            ]
          }
        ]
      },
      orderBy: [
        { category: 'asc' },
        { displayOrder: 'asc' },
        { name: 'asc' }
      ],
      select: {
        id: true,
        name: true,
        code: true,
        category: true,
        price: true,
        description: true
      }
    });

    // Organize by category
    const organized = {};
    
    // Define tests that should be extracted from groups and organized by category
    // Hematology tests (CBC, Blood Film, Blood Group)
    const hematologyTestCodes = [
      'CBC001', // Complete Blood Count (CBC) - now consolidated as single test
      'ESR001',
      'BGRH001', // Blood Group & Rh
      'PICT001' // BF (Blood Film) - previously PICT – Malaria
    ];
    
    // Other standalone tests
    const independentTestCodes = [
      'RET001',
      'BT001',
      'CT001',
      'PBF001',
      // Serology tests requested to be independent choices
      'HCG001', // HCG (Qualitative)
      'HCG002', // HCG (Quantitative)
      'RTD001', // RTD (Rapid Test Device)
      'HPYLORIAB001', // H. pylori Antibody (Serology) - standalone
      ...hematologyTestCodes // Include hematology tests in independent list for backward compatibility
    ];
    
    // Add groups, but exclude independent tests from group.tests
    groups.forEach(group => {
      if (!organized[group.category]) {
        organized[group.category] = {
          groups: [],
          standalone: []
        };
      }
      // Filter out independent tests from group tests
      // But keep hematology tests in their groups if they're part of a group structure
      let filteredTests = group.tests.filter(test => {
        // Don't filter out tests that are in hematologyTestCodes if they're in a Hematology group
        if (group.category === 'Hematology' && hematologyTestCodes.includes(test.code)) {
          return false; // Exclude from group, they'll be in standalone Hematology
        }
        return !independentTestCodes.includes(test.code);
      });

      // Custom ordering inside Serology Panel as requested for doctor-side UI
      if (group.category === 'Serology' && group.name === 'Serology Panel') {
        // Desired order by test code:
        // Row 1: Weil-Felix and Widal (side-by-side)
        // Row 2: HBsAg and HCV (side-by-side)
        // Row 3: VDRL (below)
        const serologyOrder = [
          'WEIL001',  // Weil-Felix Test (first, will be first in row 1)
          'WIDAL001', // Widal Test (second, will be second in row 1)
          'HBSAG001', // HBsAg (third, will be first in row 2)
          'HCV001',   // HCV Antibody (fourth, will be second in row 2)
          'VDRL001',  // VDRL (fifth, will be in row 3)
          'RPR001',
          'HIV001',   // HIV
          'RF001',
          'ASO001'
        ];

        const orderIndex = {};
        serologyOrder.forEach((code, idx) => {
          orderIndex[code] = idx;
        });

        filteredTests = filteredTests.sort((a, b) => {
          const aIdx = orderIndex[a.code];
          const bIdx = orderIndex[b.code];
          if (aIdx !== undefined && bIdx !== undefined) {
            return aIdx - bIdx;
          }
          if (aIdx !== undefined) return -1;
          if (bIdx !== undefined) return 1;
          // Fallback to existing displayOrder or name
          if (a.displayOrder !== undefined && b.displayOrder !== undefined) {
            return a.displayOrder - b.displayOrder;
          }
          return a.name.localeCompare(b.name);
        });
      }
      organized[group.category].groups.push({
        id: group.id,
        name: group.name,
        description: group.description,
        tests: filteredTests
      });
    });

    // Get all independent tests - both from standalone and from groups
    // This ensures tests are extracted even if they're still in groups in the database
    const allIndependentTestsFromGroups = [];
    groups.forEach(group => {
      group.tests.forEach(test => {
        if (independentTestCodes.includes(test.code)) {
          allIndependentTestsFromGroups.push(test);
        }
      });
    });
    const independentTestMap = {
      'CBC001': 'Complete Blood Count (CBC)',
      'ESR001': 'ESR',
      'BGRH001': 'Blood Group & Rh',
      'RET001': 'Reticulocyte Count',
      'BT001': 'Bleeding Time',
      'CT001': 'Clotting Time',
      'PBF001': 'Peripheral Blood Film',
      // Independent HCG, RTD & BF (Blood Film) categories
      'HCG001': 'HCG (Qualitative)',
      'HCG002': 'HCG (Quantitative)',
      'RTD001': 'RTD (Rapid Test Device)',
      'PICT001': 'BF (Blood Film)',
      'HPYLORIAB001': 'H. pylori Antibody (Serology)'
    };

    // Separate hematology tests from other independent tests
    const hematologyTests = [];
    const otherIndependentTests = [];
    
    allIndependentTestsFromGroups.forEach(test => {
      if (hematologyTestCodes.includes(test.code)) {
        hematologyTests.push(test);
      } else {
        otherIndependentTests.push(test);
      }
    });
    
    // Process standalone tests
    const regularStandaloneTests = [];
    standaloneTests.forEach(test => {
      if (hematologyTestCodes.includes(test.code)) {
        if (!hematologyTests.find(t => t.code === test.code)) {
          hematologyTests.push(test);
        }
      } else if (independentTestCodes.includes(test.code)) {
        if (!otherIndependentTests.find(t => t.code === test.code)) {
          otherIndependentTests.push(test);
        }
      } else {
        regularStandaloneTests.push(test);
      }
    });

    // Add regular standalone tests to their categories
    regularStandaloneTests.forEach(test => {
      if (!organized[test.category]) {
        organized[test.category] = {
          groups: [],
          standalone: []
        };
      }
      organized[test.category].standalone.push(test);
    });

    // Create Hematology category with hematology tests
    if (hematologyTests.length > 0) {
      organized['Hematology'] = {
        groups: [],
        standalone: hematologyTests
      };
    }

    // Create independent categories for other independent tests
    otherIndependentTests.forEach(test => {
      const categoryName = independentTestMap[test.code] || test.name;
      organized[categoryName] = {
        groups: [],
        standalone: [test]
      };
    });

    // Rename specific tests for doctor-side ordering UI
    // e.g. update HIV label to "HIV Test (PICT)" without changing the underlying code
    Object.values(organized).forEach(category => {
      category.groups?.forEach(group => {
        group.tests?.forEach(test => {
          if (test.code === 'HIV001') {
            test.name = 'HIV Test (PICT)';
          }
          if (test.code === 'PICT001') {
            // Rename PICT – Malaria to BF (Blood Film)
            test.name = 'BF (Blood Film)';
          }
        });
      });
      category.standalone?.forEach(test => {
        if (test.code === 'HIV001') {
          test.name = 'HIV Test (PICT)';
        }
        if (test.code === 'PICT001') {
          test.name = 'BF (Blood Film)';
        }
      });
    });

    // Separate categories with groups from single-item categories
    const categoriesWithGroups = {};
    const singleItemCategories = {};
    
    Object.keys(organized).forEach(categoryName => {
      const categoryData = organized[categoryName];
      // If category has groups OR has both groups and standalone, it goes to categoriesWithGroups
      // If category only has standalone items (single test), it goes to singleItemCategories
      if (categoryData.groups && categoryData.groups.length > 0) {
        categoriesWithGroups[categoryName] = categoryData;
      } else if (categoryData.standalone && categoryData.standalone.length > 0) {
        // Single item category - collect all standalone tests
        singleItemCategories[categoryName] = categoryData;
      }
    });
    
    // Define category display order for categories with groups
    // Hematology comes first (as a standalone category), then Serology, etc.
    const categoryOrder = [
      'Hematology',
      'Serology',
      'Urinalysis',
      'Stool Examination',
      'Blood Chemistry',
      'Whole Blood Chemistry'
    ];

    // Reorder categories with groups
    const reorderedWithGroups = {};
    categoryOrder.forEach(category => {
      if (categoriesWithGroups[category]) {
        reorderedWithGroups[category] = categoriesWithGroups[category];
      }
    });
    // Add any remaining categories with groups
    Object.keys(categoriesWithGroups).forEach(category => {
      if (!reorderedWithGroups[category]) {
        reorderedWithGroups[category] = categoriesWithGroups[category];
      }
    });
    
    // Create final reordered object - start with Hematology if it exists
    const reordered = {};
    if (organized['Hematology']) {
      reordered['Hematology'] = organized['Hematology'];
    }
    
    // Add categories with groups
    Object.assign(reordered, reorderedWithGroups);
    
    // Collect all single standalone tests into one "Standalone Tests" category
    const allStandaloneTests = [];
    Object.keys(singleItemCategories).forEach(categoryName => {
      // Skip Hematology if it's already added
      if (categoryName === 'Hematology') return;
      const categoryData = singleItemCategories[categoryName];
      if (categoryData.standalone) {
        allStandaloneTests.push(...categoryData.standalone);
      }
    });
    
    // Add all standalone tests at the end as a single section
    if (allStandaloneTests.length > 0) {
      reordered['Standalone Tests'] = {
        groups: [],
        standalone: allStandaloneTests
      };
    }

    console.log('✅ [getLabTestsForOrdering] Response prepared:', {
      categoriesCount: Object.keys(reordered).length,
      categories: Object.keys(reordered),
      totalGroups: Object.values(reordered).reduce((sum, cat) => sum + (cat.groups?.length || 0), 0),
      totalStandalone: Object.values(reordered).reduce((sum, cat) => sum + (cat.standalone?.length || 0), 0)
    });
    
    res.json({ organized: reordered });
  } catch (error) {
    console.error('❌ [getLabTestsForOrdering] Error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ error: error.message });
  }
};

// Get all patients (for admin patient management)
exports.getAllPatients = async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    const where = {};
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { mobile: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          mobile: true,
          email: true,
          gender: true,
          dob: true,
          type: true,
          status: true,
          cardStatus: true,
          createdAt: true,
          _count: {
            select: {
              visits: true,
              labTestOrders: true,
              radiologyOrders: true,
              bills: true
            }
          }
        }
      }),
      prisma.patient.count({ where })
    ]);

    res.json({
      patients,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching all patients:', error);
    res.status(500).json({ error: error.message });
  }
};

// Delete patient with cascade deletion of all related records
exports.deletePatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const userId = req.user.id;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        _count: {
          select: {
            visits: true,
            labOrders: true,
            labTestOrders: true,
            radiologyOrders: true,
            orders: true,
            bills: true,
            payments: true,
            dispenseLogs: true,
            history: true,
            appointments: true,
            files: true,
            dentalRecords: true,
            dentalPhotos: true,
            attachedImages: true,
            pharmacyInvoices: true,
            virtualQueues: true,
            medicalCertificates: true,
            diagnosisNotes: true,
            cardActivations: true,
            cashTransactions: true,
            galleryImages: true,
            insuranceTransactions: true,
            accountDeposits: true,
            accountTransactions: true,
            accountRequests: true,
            dentalProcedureCompletions: true,
            nurseWalkInOrders: true,
            emergencyDrugOrders: true,
            materialNeedsOrders: true,
          }
        }
      }
    });

    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    await prisma.$transaction(async (tx) => {
      const visits = await tx.visit.findMany({
        where: { patientId },
        select: { id: true }
      });
      const visitIds = visits.map(v => v.id);

      if (visitIds.length > 0) {
        await tx.vitalSign.deleteMany({ where: { visitId: { in: visitIds } } });
        await tx.labOrder.deleteMany({ where: { visitId: { in: visitIds } } });
        await tx.radiologyOrder.deleteMany({ where: { visitId: { in: visitIds } } });
        await tx.medicationOrder.deleteMany({ where: { visitId: { in: visitIds } } });
        await tx.dentalRecord.deleteMany({ where: { visitId: { in: visitIds } } });
        await tx.dentalPhoto.deleteMany({ where: { visitId: { in: visitIds } } });
        await tx.patientAttachedImage.deleteMany({ where: { visitId: { in: visitIds } } });
        await tx.medicalCertificate.deleteMany({ where: { visitId: { in: visitIds } } });
        await tx.diagnosisNotes.deleteMany({ where: { visitId: { in: visitIds } } });
        await tx.nurseServiceAssignment.deleteMany({ where: { visitId: { in: visitIds } } });
        await tx.emergencyDrugOrder.deleteMany({ where: { visitId: { in: visitIds } } });
        await tx.materialNeedsOrder.deleteMany({ where: { visitId: { in: visitIds } } });
        await tx.patientGallery.deleteMany({ where: { visitId: { in: visitIds } } });
        await tx.insuranceTransaction.deleteMany({ where: { visitId: { in: visitIds } } });
        await tx.accountTransaction.deleteMany({ where: { visitId: { in: visitIds } } });
        await tx.dentalProcedureCompletion.deleteMany({ where: { visitId: { in: visitIds } } });

        const bills = await tx.billing.findMany({
          where: { visitId: { in: visitIds } },
          select: { id: true }
        });
        const billingIds = bills.map(b => b.id);

        if (billingIds.length > 0) {
          await tx.billPayment.deleteMany({ where: { billingId: { in: billingIds } } });
          await tx.billingService.deleteMany({ where: { billingId: { in: billingIds } } });
          await tx.billing.deleteMany({ where: { id: { in: billingIds } } });
        }

        const batchOrders = await tx.batchOrder.findMany({
          where: { visitId: { in: visitIds } },
          select: { id: true }
        });
        const batchOrderIds = batchOrders.map(bo => bo.id);

        if (batchOrderIds.length > 0) {
          await tx.batchOrderService.deleteMany({ where: { batchOrderId: { in: batchOrderIds } } });
          await tx.batchOrder.deleteMany({ where: { id: { in: batchOrderIds } } });
        }

        const pharmacyInvoices = await tx.pharmacyInvoice.findMany({
          where: { visitId: { in: visitIds } },
          select: { id: true }
        });
        const pharmacyInvoiceIds = pharmacyInvoices.map(pi => pi.id);

        if (pharmacyInvoiceIds.length > 0) {
          await tx.pharmacyInvoiceItem.deleteMany({ where: { invoiceId: { in: pharmacyInvoiceIds } } });
          await tx.pharmacyInvoice.deleteMany({ where: { id: { in: pharmacyInvoiceIds } } });
        }

        await tx.visit.deleteMany({ where: { id: { in: visitIds } } });
      }

      // Delete bills that are directly linked to patient (not just through visits)
      const allPatientBills = await tx.billing.findMany({
        where: { patientId },
        select: { id: true }
      });
      const allBillingIds = allPatientBills.map(b => b.id);
      if (allBillingIds.length > 0) {
        await tx.billPayment.deleteMany({ where: { billingId: { in: allBillingIds } } });
        await tx.billingService.deleteMany({ where: { billingId: { in: allBillingIds } } });
        await tx.billing.deleteMany({ where: { id: { in: allBillingIds } } });
      }

      // Delete ALL patient orders (both visit-linked and non-visit-linked)
      // First get all labTestOrder IDs to delete their results
      const allPatientLabTestOrders = await tx.labTestOrder.findMany({
        where: { patientId },
        select: { id: true }
      });
      const allPatientLabTestOrderIds = allPatientLabTestOrders.map(o => o.id);
      if (allPatientLabTestOrderIds.length > 0) {
        await tx.labTestResult.deleteMany({ where: { orderId: { in: allPatientLabTestOrderIds } } });
      }
      
      await tx.labOrder.deleteMany({ where: { patientId } });
      await tx.labTestOrder.deleteMany({ where: { patientId } });
      await tx.radiologyOrder.deleteMany({ where: { patientId } });
      await tx.medicationOrder.deleteMany({ where: { patientId } });
      await tx.batchOrder.deleteMany({ where: { patientId } });

      await tx.assignment.deleteMany({ where: { patientId } });
      await tx.dispenseLog.deleteMany({ where: { patientId } });
      await tx.medicalHistory.deleteMany({ where: { patientId } });
      await tx.appointment.deleteMany({ where: { patientId } });
      await tx.file.deleteMany({ where: { patientId } });
      await tx.virtualQueue.deleteMany({ where: { patientId } });
      await tx.medicalCertificate.deleteMany({ where: { patientId } });
      await tx.diagnosisNotes.deleteMany({ where: { patientId } });
      await tx.cardActivation.deleteMany({ where: { patientId } });
      await tx.cashTransaction.deleteMany({ where: { patientId } });
      await tx.patientGallery.deleteMany({ where: { patientId } });
      await tx.insuranceTransaction.deleteMany({ where: { patientId } });
      await tx.accountDeposit.deleteMany({ where: { patientId } });
      await tx.accountTransaction.deleteMany({ where: { patientId } });
      await tx.accountRequest.deleteMany({ where: { patientId } });
      await tx.dentalProcedureCompletion.deleteMany({ where: { patientId } });
      await tx.nurseWalkInOrder.deleteMany({ where: { patientId } });
      await tx.emergencyDrugOrder.deleteMany({ where: { patientId } });
      await tx.materialNeedsOrder.deleteMany({ where: { patientId } });
      await tx.patientAccount.deleteMany({ where: { patientId } });
      await tx.patient.delete({ where: { id: patientId } });
    });

    await prisma.auditLog.create({
      data: {
        userId: userId,
        action: 'DELETE_PATIENT',
        entity: 'Patient',
        entityId: 0, // Patient IDs are strings, use 0 as placeholder
        details: JSON.stringify({
          patientId: patientId,
          patientName: patient.name,
          deletedRecords: patient._count
        }),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      message: 'Patient and all related records deleted successfully',
      deletedRecords: patient._count
    });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ error: error.message });
  }
};
