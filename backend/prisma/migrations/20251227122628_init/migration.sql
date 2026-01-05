-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'OWNER', 'BILLING_OFFICER', 'PHARMACY_BILLING_OFFICER', 'CARE_COORDINATOR', 'CMO', 'CLINICAL_RESEARCH_COORDINATOR', 'DIETITIAN', 'DOCTOR', 'HOSPITAL_MANAGER', 'HR_OFFICER', 'IT_SUPPORT', 'LAB_TECHNICIAN', 'MEDICAL_RECORDS_OFFICER', 'NURSE', 'PATIENT', 'PHARMACY_OFFICER', 'PHARMACIST', 'RADIOLOGIST', 'RECEPTIONIST', 'SECURITY_STAFF', 'SOCIAL_WORKER');

-- CreateEnum
CREATE TYPE "PatientType" AS ENUM ('REGULAR', 'VIP', 'EMERGENCY', 'INSURANCE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "BloodType" AS ENUM ('A_PLUS', 'A_MINUS', 'B_PLUS', 'B_MINUS', 'AB_PLUS', 'AB_MINUS', 'O_PLUS', 'O_MINUS', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED');

-- CreateEnum
CREATE TYPE "TempUnit" AS ENUM ('C', 'F');

-- CreateEnum
CREATE TYPE "PatientStatus" AS ENUM ('Active', 'Inactive', 'Completed');

-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('CONSULTATION', 'FOLLOW_UP');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "BillingStatus" AS ENUM ('PENDING', 'PAID', 'PENDING_INSURANCE', 'INSURANCE_CLAIMED', 'EMERGENCY_PENDING', 'REJECTED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "BillingType" AS ENUM ('REGULAR', 'EMERGENCY', 'CARD_ACTIVATION');

-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('CASH', 'BANK', 'INSURANCE', 'CHARITY');

-- CreateEnum
CREATE TYPE "MedicineCategory" AS ENUM ('TABLETS', 'CAPSULES', 'INJECTIONS', 'SYRUPS', 'OINTMENTS', 'DROPS', 'INHALERS', 'PATCHES', 'INFUSIONS');

-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('CONSULTATION', 'LAB', 'RADIOLOGY', 'MEDICATION', 'PROCEDURE', 'NURSE', 'DENTAL', 'CONTINUOUS_INFUSION', 'EMERGENCY', 'DIAGNOSTIC', 'TREATMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "InvestigationCategory" AS ENUM ('LAB', 'RADIOLOGY');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('UNPAID', 'PAID', 'BLOCKED_BY_BILL', 'QUEUED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "DispensedStatus" AS ENUM ('DISPENSED', 'NOT_AVAILABLE', 'PARTIAL_DISPENSED');

-- CreateEnum
CREATE TYPE "PharmacyInvoiceType" AS ENUM ('DOCTOR_PRESCRIPTION', 'WALK_IN_SALE');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('WAITING_FOR_TRIAGE', 'TRIAGED', 'WAITING_FOR_DOCTOR', 'IN_DOCTOR_QUEUE', 'UNDER_DOCTOR_REVIEW', 'SENT_TO_LAB', 'SENT_TO_RADIOLOGY', 'SENT_TO_BOTH', 'RETURNED_WITH_RESULTS', 'AWAITING_LAB_RESULTS', 'AWAITING_RADIOLOGY_RESULTS', 'AWAITING_RESULTS_REVIEW', 'DIRECT_COMPLETE', 'SENT_TO_PHARMACY', 'WAITING_FOR_NURSE_SERVICE', 'NURSE_SERVICES_ORDERED', 'NURSE_SERVICES_COMPLETED', 'DENTAL_SERVICES_ORDERED', 'EMERGENCY_QUEUE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "NurseServiceStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BatchOrderType" AS ENUM ('LAB', 'RADIOLOGY', 'MIXED', 'DENTAL');

-- CreateEnum
CREATE TYPE "QueueType" AS ENUM ('CONSULTATION', 'RESULTS_REVIEW');

-- CreateEnum
CREATE TYPE "CardStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PhotoType" AS ENUM ('BEFORE', 'AFTER');

-- CreateEnum
CREATE TYPE "VirtualQueueStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CertificateStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CashSessionStatus" AS ENUM ('ACTIVE', 'CLOSED', 'RESET');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PAYMENT_RECEIVED', 'REFUND_GIVEN', 'CASH_ADJUSTMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('PENDING', 'CONFIRMED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('OFFICE_SUPPLIES', 'MEDICAL_SUPPLIES', 'MAINTENANCE', 'UTILITIES', 'FOOD_BEVERAGE', 'TRANSPORTATION', 'STAFF_LOAN', 'OTHER');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('PENDING', 'APPROVED', 'DENIED', 'GIVEN', 'SETTLED', 'SETTLEMENT_ACCEPTED', 'REPAID');

-- CreateEnum
CREATE TYPE "LoanSettlementMethod" AS ENUM ('INSTANT_PAID', 'FROM_PAYROLL');

-- CreateEnum
CREATE TYPE "ImageType" AS ENUM ('BEFORE', 'AFTER');

-- CreateEnum
CREATE TYPE "InsuranceServiceType" AS ENUM ('CONSULTATION', 'LAB_TEST', 'RADIOLOGY', 'MEDICATION', 'PROCEDURE', 'NURSE_SERVICE', 'OTHER');

-- CreateEnum
CREATE TYPE "InsuranceTransactionStatus" AS ENUM ('PENDING', 'SUBMITTED', 'APPROVED', 'COLLECTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('ADVANCE', 'CREDIT', 'NONE');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AccountTransactionType" AS ENUM ('DEPOSIT', 'PAYMENT', 'USAGE', 'DEDUCTION', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "AccountRequestType" AS ENUM ('CREATE_ACCOUNT', 'ADD_CREDIT', 'ADD_DEPOSIT', 'RETURN_MONEY');

-- CreateEnum
CREATE TYPE "AccountRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" "Role" NOT NULL,
    "specialties" TEXT[],
    "licenseNumber" TEXT,
    "availability" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "consultationFee" DOUBLE PRECISION,
    "waiveConsultationFee" BOOLEAN NOT NULL DEFAULT false,
    "passwordChangedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "ServiceCategory" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "unit" TEXT DEFAULT 'UNIT',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insurance" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "contactInfo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Insurance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillingService" (
    "id" TEXT NOT NULL,
    "billingId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BillingService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dob" TIMESTAMP(3),
    "gender" "Gender",
    "type" "PatientType" NOT NULL,
    "mobile" TEXT,
    "email" TEXT,
    "address" TEXT,
    "emergencyContact" TEXT,
    "bloodType" "BloodType",
    "maritalStatus" "MaritalStatus",
    "status" "PatientStatus" NOT NULL DEFAULT 'Active',
    "insuranceId" TEXT,
    "cardStatus" "CardStatus" NOT NULL DEFAULT 'INACTIVE',
    "cardActivatedAt" TIMESTAMP(3),
    "cardExpiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" SERIAL NOT NULL,
    "visitUid" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "createdById" TEXT,
    "suggestedDoctorId" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "VisitStatus" NOT NULL DEFAULT 'WAITING_FOR_TRIAGE',
    "queueType" "QueueType" NOT NULL DEFAULT 'CONSULTATION',
    "isEmergency" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "diagnosis" TEXT,
    "diagnosisDetails" TEXT,
    "instructions" TEXT,
    "assignmentId" INTEGER,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NurseServiceAssignment" (
    "id" SERIAL NOT NULL,
    "visitId" INTEGER NOT NULL,
    "serviceId" TEXT NOT NULL,
    "assignedNurseId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "status" "NurseServiceStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "orderType" TEXT DEFAULT 'TRIAGE_ORDERED',
    "isWaived" BOOLEAN NOT NULL DEFAULT false,
    "waivedBy" TEXT,
    "waivedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NurseServiceAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VitalSign" (
    "id" SERIAL NOT NULL,
    "patientId" TEXT NOT NULL,
    "visitId" INTEGER,
    "bloodPressure" TEXT,
    "temperature" DOUBLE PRECISION,
    "tempUnit" "TempUnit" NOT NULL DEFAULT 'C',
    "heartRate" INTEGER,
    "respirationRate" INTEGER,
    "height" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,
    "bmi" DOUBLE PRECISION,
    "oxygenSaturation" INTEGER,
    "condition" TEXT,
    "notes" TEXT,
    "painScoreRest" INTEGER,
    "painScoreMovement" INTEGER,
    "sedationScore" INTEGER,
    "gcsEyes" INTEGER,
    "gcsVerbal" INTEGER,
    "gcsMotor" INTEGER,
    "bloodPressureSystolic" INTEGER,
    "bloodPressureDiastolic" INTEGER,
    "chiefComplaint" TEXT,
    "historyOfPresentIllness" TEXT,
    "onsetOfSymptoms" TEXT,
    "durationOfSymptoms" TEXT,
    "severityOfSymptoms" TEXT,
    "associatedSymptoms" TEXT,
    "relievingFactors" TEXT,
    "aggravatingFactors" TEXT,
    "generalAppearance" TEXT,
    "headAndNeck" TEXT,
    "cardiovascularExam" TEXT,
    "respiratoryExam" TEXT,
    "abdominalExam" TEXT,
    "extremities" TEXT,
    "neurologicalExam" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VitalSign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" SERIAL NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "appointmentDate" TIMESTAMP(3) NOT NULL,
    "appointmentTime" TEXT NOT NULL,
    "type" "AppointmentType" NOT NULL DEFAULT 'CONSULTATION',
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "duration" TEXT,
    "notes" TEXT,
    "reason" TEXT,
    "createdById" TEXT NOT NULL,
    "lastDiagnosedBy" TEXT,
    "visitId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Billing" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "visitId" INTEGER,
    "insuranceId" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" "BillingStatus" NOT NULL DEFAULT 'PENDING',
    "billingType" "BillingType" NOT NULL DEFAULT 'REGULAR',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Billing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BillPayment" (
    "id" TEXT NOT NULL,
    "billingId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "PaymentType" NOT NULL,
    "bankName" TEXT,
    "transNumber" TEXT,
    "insuranceId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacyInvoice" (
    "id" TEXT NOT NULL,
    "patientId" TEXT,
    "visitId" INTEGER,
    "invoiceNumber" TEXT,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "status" "BillingStatus" NOT NULL DEFAULT 'PENDING',
    "type" "PharmacyInvoiceType" NOT NULL DEFAULT 'DOCTOR_PRESCRIPTION',
    "paymentMethod" "PaymentType",
    "insuranceId" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PharmacyInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PharmacyInvoiceItem" (
    "id" TEXT NOT NULL,
    "pharmacyInvoiceId" TEXT NOT NULL,
    "medicationOrderId" INTEGER,
    "medicationCatalogId" TEXT,
    "name" TEXT NOT NULL,
    "dosageForm" TEXT NOT NULL,
    "strength" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PharmacyInvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispensedMedicine" (
    "id" SERIAL NOT NULL,
    "pharmacyInvoiceId" TEXT NOT NULL,
    "medicationOrderId" INTEGER,
    "medicationCatalogId" TEXT,
    "status" "DispensedStatus" NOT NULL,
    "name" TEXT,
    "dosageForm" TEXT,
    "strength" TEXT,
    "quantity" INTEGER,
    "unitPrice" DOUBLE PRECISION,
    "notes" TEXT,
    "dispensedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dispensedBy" TEXT,

    CONSTRAINT "DispensedMedicine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationOrder" (
    "id" SERIAL NOT NULL,
    "visitId" INTEGER NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "medicationCatalogId" TEXT,
    "name" TEXT NOT NULL,
    "genericName" TEXT,
    "dosageForm" TEXT NOT NULL,
    "strength" TEXT NOT NULL,
    "quantity" TEXT NOT NULL,
    "quantityNumeric" DOUBLE PRECISION,
    "unit" TEXT,
    "frequency" TEXT,
    "duration" TEXT,
    "instructions" TEXT,
    "additionalNotes" TEXT,
    "category" "MedicineCategory",
    "type" TEXT,
    "unitPrice" DOUBLE PRECISION,
    "status" "OrderStatus" NOT NULL DEFAULT 'UNPAID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicationOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DispenseLog" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "patientId" TEXT NOT NULL,
    "pharmacyId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DispenseLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabOrder" (
    "id" SERIAL NOT NULL,
    "visitId" INTEGER,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT,
    "typeId" INTEGER NOT NULL,
    "instructions" TEXT,
    "result" TEXT,
    "additionalNotes" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'UNPAID',
    "isWalkIn" BOOLEAN NOT NULL DEFAULT false,
    "billingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RadiologyOrder" (
    "id" SERIAL NOT NULL,
    "visitId" INTEGER,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT,
    "typeId" INTEGER NOT NULL,
    "instructions" TEXT,
    "result" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'UNPAID',
    "isWalkIn" BOOLEAN NOT NULL DEFAULT false,
    "billingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RadiologyOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalHistory" (
    "id" SERIAL NOT NULL,
    "patientId" TEXT NOT NULL,
    "visitId" INTEGER,
    "doctorId" TEXT,
    "visitUid" TEXT,
    "visitDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "details" TEXT NOT NULL,
    "diagnosis" TEXT,
    "diagnosisDetails" TEXT,
    "instructions" TEXT,
    "finalNotes" TEXT,
    "needsAppointment" BOOLEAN NOT NULL DEFAULT false,
    "appointmentId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" SERIAL NOT NULL,
    "patientId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "accessLog" TEXT[],
    "labOrderId" INTEGER,
    "radiologyOrderId" INTEGER,
    "batchOrderId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DentalRecord" (
    "id" SERIAL NOT NULL,
    "patientId" TEXT NOT NULL,
    "visitId" INTEGER,
    "doctorId" TEXT,
    "toothId" INTEGER,
    "conditions" TEXT[],
    "surfaces" TEXT[],
    "eruptionStart" INTEGER,
    "eruptionEnd" INTEGER,
    "rootCompletion" INTEGER,
    "toothChart" JSONB,
    "painFlags" JSONB,
    "gumCondition" TEXT,
    "oralHygiene" TEXT,
    "treatmentPlan" JSONB,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DentalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tooth" (
    "id" SERIAL NOT NULL,
    "number" INTEGER NOT NULL,
    "eruptionStart" INTEGER,
    "eruptionEnd" INTEGER,
    "rootCompletion" INTEGER,

    CONSTRAINT "Tooth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestigationType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "category" "InvestigationCategory" NOT NULL,
    "serviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestigationType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "details" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "category" "MedicineCategory",
    "dosageForm" TEXT,
    "strength" TEXT,
    "expiryDate" TIMESTAMP(3),
    "supplier" TEXT,
    "price" DOUBLE PRECISION,
    "serviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicationCatalog" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "genericName" TEXT,
    "dosageForm" TEXT NOT NULL,
    "strength" TEXT NOT NULL,
    "category" "MedicineCategory" NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "availableQuantity" INTEGER NOT NULL,
    "minimumStock" INTEGER NOT NULL,
    "unit" TEXT,
    "packSize" INTEGER,
    "manufacturer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicationCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" SERIAL NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContinuousInfusion" (
    "id" SERIAL NOT NULL,
    "medicationOrderId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "dailyDose" TEXT NOT NULL,
    "frequency" TEXT,
    "days" INTEGER NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'UNPAID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContinuousInfusion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NurseAdministration" (
    "id" SERIAL NOT NULL,
    "continuousInfusionId" INTEGER NOT NULL,
    "administeredById" TEXT,
    "administeredAt" TIMESTAMP(3),
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "NurseAdministration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CardActivation" (
    "id" SERIAL NOT NULL,
    "patientId" TEXT NOT NULL,
    "activatedById" TEXT NOT NULL,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "billingId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CardActivation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchOrder" (
    "id" SERIAL NOT NULL,
    "visitId" INTEGER NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "type" "BatchOrderType" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'UNPAID',
    "instructions" TEXT,
    "result" TEXT,
    "additionalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BatchOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchOrderService" (
    "id" SERIAL NOT NULL,
    "batchOrderId" INTEGER NOT NULL,
    "serviceId" TEXT NOT NULL,
    "investigationTypeId" INTEGER,
    "instructions" TEXT,
    "result" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'UNPAID',
    "isWaived" BOOLEAN NOT NULL DEFAULT false,
    "waivedBy" TEXT,
    "waivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BatchOrderService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabResult" (
    "id" TEXT NOT NULL,
    "orderId" INTEGER NOT NULL,
    "testTypeId" INTEGER NOT NULL,
    "resultText" TEXT,
    "additionalNotes" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'UNPAID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabResultFile" (
    "id" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "fileType" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT,

    CONSTRAINT "LabResultFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RadiologyResult" (
    "id" TEXT NOT NULL,
    "orderId" INTEGER,
    "batchOrderId" INTEGER,
    "testTypeId" INTEGER NOT NULL,
    "resultText" TEXT,
    "additionalNotes" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'UNPAID',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RadiologyResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RadiologyResultFile" (
    "id" TEXT NOT NULL,
    "resultId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "fileType" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT,

    CONSTRAINT "RadiologyResultFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LabTestTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "fields" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabTestTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DetailedLabResult" (
    "id" TEXT NOT NULL,
    "labOrderId" INTEGER NOT NULL,
    "serviceId" INTEGER,
    "templateId" TEXT NOT NULL,
    "results" JSONB NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'UNPAID',
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "additionalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DetailedLabResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DentalPhoto" (
    "id" TEXT NOT NULL,
    "visitId" INTEGER NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "photoType" "PhotoType" NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT NOT NULL,
    "description" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT NOT NULL,

    CONSTRAINT "DentalPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DentalProcedureCompletion" (
    "id" SERIAL NOT NULL,
    "batchOrderId" INTEGER NOT NULL,
    "batchOrderServiceId" INTEGER NOT NULL,
    "visitId" INTEGER NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DentalProcedureCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientAttachedImage" (
    "id" TEXT NOT NULL,
    "visitId" INTEGER NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "description" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedBy" TEXT NOT NULL,

    CONSTRAINT "PatientAttachedImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VirtualQueue" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "patientId" TEXT,
    "status" "VirtualQueueStatus" NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 3,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "processedBy" TEXT,

    CONSTRAINT "VirtualQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalCertificate" (
    "id" TEXT NOT NULL,
    "certificateNo" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "visitId" INTEGER,
    "certificateDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "restStartDate" TIMESTAMP(3) NOT NULL,
    "restEndDate" TIMESTAMP(3) NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "treatment" TEXT,
    "recommendations" TEXT,
    "status" "CertificateStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyCashSession" (
    "id" TEXT NOT NULL,
    "sessionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "startingCash" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalReceived" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalExpenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalBankDeposit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "endingCash" DOUBLE PRECISION,
    "status" "CashSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "isReset" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "resetById" TEXT,
    "resetAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyCashSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashTransaction" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL,
    "paymentMethod" "PaymentType" NOT NULL,
    "billingId" TEXT,
    "patientId" TEXT,
    "processedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankDeposit" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "bankName" TEXT NOT NULL,
    "accountNumber" TEXT,
    "depositDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "receiptImage" TEXT,
    "transactionNumber" TEXT,
    "notes" TEXT,
    "status" "DepositStatus" NOT NULL DEFAULT 'PENDING',
    "depositedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankDeposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashExpense" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "category" "ExpenseCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "vendor" TEXT,
    "receiptImage" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "requestedAmount" DOUBLE PRECISION NOT NULL,
    "approvedAmount" DOUBLE PRECISION,
    "status" "LoanStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "notes" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "deniedAt" TIMESTAMP(3),
    "givenAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "givenById" TEXT,
    "expenseId" TEXT,
    "settlementMethod" "LoanSettlementMethod" NOT NULL DEFAULT 'INSTANT_PAID',
    "settledAt" TIMESTAMP(3),
    "settledById" TEXT,
    "settledAmount" DOUBLE PRECISION,
    "settlementAcceptedAt" TIMESTAMP(3),
    "settlementAcceptedById" TEXT,
    "settlementAcceptedAmount" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosisNotes" (
    "id" TEXT NOT NULL,
    "visitId" INTEGER NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "chiefComplaint" TEXT,
    "historyOfPresentIllness" TEXT,
    "pastMedicalHistory" TEXT,
    "allergicHistory" TEXT,
    "physicalExamination" TEXT,
    "investigationFindings" TEXT,
    "assessmentAndDiagnosis" TEXT,
    "treatmentPlan" TEXT,
    "treatmentGiven" TEXT,
    "medicationIssued" TEXT,
    "additional" TEXT,
    "prognosis" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "DiagnosisNotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientGallery" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "visitId" INTEGER NOT NULL,
    "imageType" "ImageType" NOT NULL,
    "filePath" TEXT NOT NULL,
    "description" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientGallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InsuranceTransaction" (
    "id" TEXT NOT NULL,
    "insuranceId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "visitId" INTEGER,
    "serviceType" "InsuranceServiceType" NOT NULL,
    "serviceId" TEXT,
    "serviceName" TEXT NOT NULL,
    "serviceCode" TEXT,
    "medicationId" TEXT,
    "medicationName" TEXT,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" "InsuranceTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "claimNumber" TEXT,
    "transactionNumber" TEXT,
    "serviceDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimDate" TIMESTAMP(3),
    "collectedDate" TIMESTAMP(3),
    "notes" TEXT,
    "receiptPath" TEXT,
    "createdById" TEXT,
    "collectedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InsuranceTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientAccount" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "accountType" "AccountType" NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'PENDING',
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDeposited" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "debtOwed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDebtPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountDeposit" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" "PaymentType" NOT NULL,
    "bankName" TEXT,
    "transNumber" TEXT,
    "notes" TEXT,
    "depositedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountDeposit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountTransaction" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "type" "AccountTransactionType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "balanceBefore" DOUBLE PRECISION NOT NULL,
    "balanceAfter" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "description" TEXT,
    "billingId" TEXT,
    "visitId" INTEGER,
    "processedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountRequest" (
    "id" TEXT NOT NULL,
    "accountId" TEXT,
    "patientId" TEXT NOT NULL,
    "requestType" "AccountRequestType" NOT NULL,
    "accountType" "AccountType",
    "amount" DOUBLE PRECISION,
    "paymentMethod" "PaymentType",
    "bankName" TEXT,
    "transNumber" TEXT,
    "notes" TEXT,
    "status" "AccountRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" TEXT NOT NULL,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_availability_idx" ON "User"("availability");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_username_idx" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Service_code_key" ON "Service"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Insurance_code_key" ON "Insurance"("code");

-- CreateIndex
CREATE UNIQUE INDEX "BillingService_billingId_serviceId_key" ON "BillingService"("billingId", "serviceId");

-- CreateIndex
CREATE INDEX "Patient_status_idx" ON "Patient"("status");

-- CreateIndex
CREATE INDEX "Patient_type_idx" ON "Patient"("type");

-- CreateIndex
CREATE INDEX "Patient_insuranceId_idx" ON "Patient"("insuranceId");

-- CreateIndex
CREATE INDEX "Patient_createdAt_idx" ON "Patient"("createdAt");

-- CreateIndex
CREATE INDEX "Patient_cardStatus_idx" ON "Patient"("cardStatus");

-- CreateIndex
CREATE UNIQUE INDEX "Visit_visitUid_key" ON "Visit"("visitUid");

-- CreateIndex
CREATE INDEX "Visit_status_idx" ON "Visit"("status");

-- CreateIndex
CREATE INDEX "Visit_patientId_idx" ON "Visit"("patientId");

-- CreateIndex
CREATE INDEX "Visit_assignmentId_idx" ON "Visit"("assignmentId");

-- CreateIndex
CREATE INDEX "Visit_createdAt_idx" ON "Visit"("createdAt");

-- CreateIndex
CREATE INDEX "Visit_suggestedDoctorId_idx" ON "Visit"("suggestedDoctorId");

-- CreateIndex
CREATE INDEX "NurseServiceAssignment_visitId_idx" ON "NurseServiceAssignment"("visitId");

-- CreateIndex
CREATE INDEX "NurseServiceAssignment_assignedNurseId_idx" ON "NurseServiceAssignment"("assignedNurseId");

-- CreateIndex
CREATE INDEX "NurseServiceAssignment_status_idx" ON "NurseServiceAssignment"("status");

-- CreateIndex
CREATE INDEX "NurseServiceAssignment_createdAt_idx" ON "NurseServiceAssignment"("createdAt");

-- CreateIndex
CREATE INDEX "Appointment_patientId_idx" ON "Appointment"("patientId");

-- CreateIndex
CREATE INDEX "Appointment_doctorId_idx" ON "Appointment"("doctorId");

-- CreateIndex
CREATE INDEX "Appointment_createdById_idx" ON "Appointment"("createdById");

-- CreateIndex
CREATE INDEX "Appointment_appointmentDate_idx" ON "Appointment"("appointmentDate");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- CreateIndex
CREATE INDEX "MedicalHistory_patientId_idx" ON "MedicalHistory"("patientId");

-- CreateIndex
CREATE INDEX "MedicalHistory_visitId_idx" ON "MedicalHistory"("visitId");

-- CreateIndex
CREATE INDEX "MedicalHistory_doctorId_idx" ON "MedicalHistory"("doctorId");

-- CreateIndex
CREATE INDEX "MedicalHistory_visitDate_idx" ON "MedicalHistory"("visitDate");

-- CreateIndex
CREATE INDEX "MedicalHistory_completedDate_idx" ON "MedicalHistory"("completedDate");

-- CreateIndex
CREATE INDEX "MedicationCatalog_category_idx" ON "MedicationCatalog"("category");

-- CreateIndex
CREATE INDEX "MedicationCatalog_name_idx" ON "MedicationCatalog"("name");

-- CreateIndex
CREATE UNIQUE INDEX "MedicationCatalog_name_dosageForm_strength_key" ON "MedicationCatalog"("name", "dosageForm", "strength");

-- CreateIndex
CREATE UNIQUE INDEX "ContinuousInfusion_medicationOrderId_key" ON "ContinuousInfusion"("medicationOrderId");

-- CreateIndex
CREATE INDEX "CardActivation_patientId_idx" ON "CardActivation"("patientId");

-- CreateIndex
CREATE INDEX "CardActivation_activatedById_idx" ON "CardActivation"("activatedById");

-- CreateIndex
CREATE INDEX "CardActivation_activatedAt_idx" ON "CardActivation"("activatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BatchOrderService_batchOrderId_serviceId_key" ON "BatchOrderService"("batchOrderId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "DetailedLabResult_labOrderId_serviceId_templateId_key" ON "DetailedLabResult"("labOrderId", "serviceId", "templateId");

-- CreateIndex
CREATE INDEX "DentalPhoto_visitId_idx" ON "DentalPhoto"("visitId");

-- CreateIndex
CREATE INDEX "DentalPhoto_patientId_idx" ON "DentalPhoto"("patientId");

-- CreateIndex
CREATE INDEX "DentalPhoto_doctorId_idx" ON "DentalPhoto"("doctorId");

-- CreateIndex
CREATE INDEX "DentalPhoto_photoType_idx" ON "DentalPhoto"("photoType");

-- CreateIndex
CREATE INDEX "DentalProcedureCompletion_batchOrderId_idx" ON "DentalProcedureCompletion"("batchOrderId");

-- CreateIndex
CREATE INDEX "DentalProcedureCompletion_visitId_idx" ON "DentalProcedureCompletion"("visitId");

-- CreateIndex
CREATE INDEX "DentalProcedureCompletion_patientId_idx" ON "DentalProcedureCompletion"("patientId");

-- CreateIndex
CREATE INDEX "DentalProcedureCompletion_doctorId_idx" ON "DentalProcedureCompletion"("doctorId");

-- CreateIndex
CREATE UNIQUE INDEX "DentalProcedureCompletion_batchOrderServiceId_key" ON "DentalProcedureCompletion"("batchOrderServiceId");

-- CreateIndex
CREATE INDEX "PatientAttachedImage_visitId_idx" ON "PatientAttachedImage"("visitId");

-- CreateIndex
CREATE INDEX "PatientAttachedImage_patientId_idx" ON "PatientAttachedImage"("patientId");

-- CreateIndex
CREATE INDEX "PatientAttachedImage_doctorId_idx" ON "PatientAttachedImage"("doctorId");

-- CreateIndex
CREATE INDEX "VirtualQueue_status_idx" ON "VirtualQueue"("status");

-- CreateIndex
CREATE INDEX "VirtualQueue_priority_idx" ON "VirtualQueue"("priority");

-- CreateIndex
CREATE INDEX "VirtualQueue_createdAt_idx" ON "VirtualQueue"("createdAt");

-- CreateIndex
CREATE INDEX "VirtualQueue_patientId_idx" ON "VirtualQueue"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalCertificate_certificateNo_key" ON "MedicalCertificate"("certificateNo");

-- CreateIndex
CREATE INDEX "MedicalCertificate_patientId_idx" ON "MedicalCertificate"("patientId");

-- CreateIndex
CREATE INDEX "MedicalCertificate_doctorId_idx" ON "MedicalCertificate"("doctorId");

-- CreateIndex
CREATE INDEX "MedicalCertificate_certificateDate_idx" ON "MedicalCertificate"("certificateDate");

-- CreateIndex
CREATE INDEX "MedicalCertificate_status_idx" ON "MedicalCertificate"("status");

-- CreateIndex
CREATE INDEX "DailyCashSession_sessionDate_idx" ON "DailyCashSession"("sessionDate");

-- CreateIndex
CREATE INDEX "DailyCashSession_status_idx" ON "DailyCashSession"("status");

-- CreateIndex
CREATE INDEX "DailyCashSession_createdById_idx" ON "DailyCashSession"("createdById");

-- CreateIndex
CREATE INDEX "CashTransaction_sessionId_idx" ON "CashTransaction"("sessionId");

-- CreateIndex
CREATE INDEX "CashTransaction_type_idx" ON "CashTransaction"("type");

-- CreateIndex
CREATE INDEX "CashTransaction_processedById_idx" ON "CashTransaction"("processedById");

-- CreateIndex
CREATE INDEX "BankDeposit_sessionId_idx" ON "BankDeposit"("sessionId");

-- CreateIndex
CREATE INDEX "BankDeposit_status_idx" ON "BankDeposit"("status");

-- CreateIndex
CREATE INDEX "BankDeposit_depositedById_idx" ON "BankDeposit"("depositedById");

-- CreateIndex
CREATE INDEX "CashExpense_sessionId_idx" ON "CashExpense"("sessionId");

-- CreateIndex
CREATE INDEX "CashExpense_category_idx" ON "CashExpense"("category");

-- CreateIndex
CREATE INDEX "CashExpense_recordedById_idx" ON "CashExpense"("recordedById");

-- CreateIndex
CREATE UNIQUE INDEX "Loan_expenseId_key" ON "Loan"("expenseId");

-- CreateIndex
CREATE INDEX "Loan_staffId_idx" ON "Loan"("staffId");

-- CreateIndex
CREATE INDEX "Loan_status_idx" ON "Loan"("status");

-- CreateIndex
CREATE INDEX "Loan_requestedAt_idx" ON "Loan"("requestedAt");

-- CreateIndex
CREATE INDEX "DiagnosisNotes_visitId_idx" ON "DiagnosisNotes"("visitId");

-- CreateIndex
CREATE INDEX "DiagnosisNotes_patientId_idx" ON "DiagnosisNotes"("patientId");

-- CreateIndex
CREATE INDEX "DiagnosisNotes_doctorId_idx" ON "DiagnosisNotes"("doctorId");

-- CreateIndex
CREATE INDEX "DiagnosisNotes_createdAt_idx" ON "DiagnosisNotes"("createdAt");

-- CreateIndex
CREATE INDEX "PatientGallery_patientId_idx" ON "PatientGallery"("patientId");

-- CreateIndex
CREATE INDEX "PatientGallery_visitId_idx" ON "PatientGallery"("visitId");

-- CreateIndex
CREATE INDEX "PatientGallery_imageType_idx" ON "PatientGallery"("imageType");

-- CreateIndex
CREATE INDEX "PatientGallery_uploadedById_idx" ON "PatientGallery"("uploadedById");

-- CreateIndex
CREATE INDEX "PatientGallery_createdAt_idx" ON "PatientGallery"("createdAt");

-- CreateIndex
CREATE INDEX "InsuranceTransaction_insuranceId_idx" ON "InsuranceTransaction"("insuranceId");

-- CreateIndex
CREATE INDEX "InsuranceTransaction_patientId_idx" ON "InsuranceTransaction"("patientId");

-- CreateIndex
CREATE INDEX "InsuranceTransaction_visitId_idx" ON "InsuranceTransaction"("visitId");

-- CreateIndex
CREATE INDEX "InsuranceTransaction_status_idx" ON "InsuranceTransaction"("status");

-- CreateIndex
CREATE INDEX "InsuranceTransaction_serviceDate_idx" ON "InsuranceTransaction"("serviceDate");

-- CreateIndex
CREATE INDEX "InsuranceTransaction_createdAt_idx" ON "InsuranceTransaction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PatientAccount_patientId_key" ON "PatientAccount"("patientId");

-- CreateIndex
CREATE INDEX "PatientAccount_patientId_idx" ON "PatientAccount"("patientId");

-- CreateIndex
CREATE INDEX "PatientAccount_status_idx" ON "PatientAccount"("status");

-- CreateIndex
CREATE INDEX "PatientAccount_accountType_idx" ON "PatientAccount"("accountType");

-- CreateIndex
CREATE INDEX "AccountDeposit_accountId_idx" ON "AccountDeposit"("accountId");

-- CreateIndex
CREATE INDEX "AccountDeposit_patientId_idx" ON "AccountDeposit"("patientId");

-- CreateIndex
CREATE INDEX "AccountDeposit_depositedById_idx" ON "AccountDeposit"("depositedById");

-- CreateIndex
CREATE INDEX "AccountTransaction_accountId_idx" ON "AccountTransaction"("accountId");

-- CreateIndex
CREATE INDEX "AccountTransaction_patientId_idx" ON "AccountTransaction"("patientId");

-- CreateIndex
CREATE INDEX "AccountTransaction_processedById_idx" ON "AccountTransaction"("processedById");

-- CreateIndex
CREATE INDEX "AccountTransaction_type_idx" ON "AccountTransaction"("type");

-- CreateIndex
CREATE INDEX "AccountTransaction_createdAt_idx" ON "AccountTransaction"("createdAt");

-- CreateIndex
CREATE INDEX "AccountRequest_patientId_idx" ON "AccountRequest"("patientId");

-- CreateIndex
CREATE INDEX "AccountRequest_accountId_idx" ON "AccountRequest"("accountId");

-- CreateIndex
CREATE INDEX "AccountRequest_status_idx" ON "AccountRequest"("status");

-- CreateIndex
CREATE INDEX "AccountRequest_requestType_idx" ON "AccountRequest"("requestType");

-- CreateIndex
CREATE INDEX "AccountRequest_createdAt_idx" ON "AccountRequest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSettings_key_key" ON "SystemSettings"("key");

-- CreateIndex
CREATE INDEX "SystemSettings_key_idx" ON "SystemSettings"("key");

-- AddForeignKey
ALTER TABLE "BillingService" ADD CONSTRAINT "BillingService_billingId_fkey" FOREIGN KEY ("billingId") REFERENCES "Billing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingService" ADD CONSTRAINT "BillingService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_insuranceId_fkey" FOREIGN KEY ("insuranceId") REFERENCES "Insurance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurseServiceAssignment" ADD CONSTRAINT "NurseServiceAssignment_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurseServiceAssignment" ADD CONSTRAINT "NurseServiceAssignment_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurseServiceAssignment" ADD CONSTRAINT "NurseServiceAssignment_assignedNurseId_fkey" FOREIGN KEY ("assignedNurseId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurseServiceAssignment" ADD CONSTRAINT "NurseServiceAssignment_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalSign" ADD CONSTRAINT "VitalSign_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VitalSign" ADD CONSTRAINT "VitalSign_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Billing" ADD CONSTRAINT "Billing_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Billing" ADD CONSTRAINT "Billing_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Billing" ADD CONSTRAINT "Billing_insuranceId_fkey" FOREIGN KEY ("insuranceId") REFERENCES "Insurance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillPayment" ADD CONSTRAINT "BillPayment_billingId_fkey" FOREIGN KEY ("billingId") REFERENCES "Billing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillPayment" ADD CONSTRAINT "BillPayment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillPayment" ADD CONSTRAINT "BillPayment_insuranceId_fkey" FOREIGN KEY ("insuranceId") REFERENCES "Insurance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyInvoice" ADD CONSTRAINT "PharmacyInvoice_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyInvoice" ADD CONSTRAINT "PharmacyInvoice_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyInvoiceItem" ADD CONSTRAINT "PharmacyInvoiceItem_pharmacyInvoiceId_fkey" FOREIGN KEY ("pharmacyInvoiceId") REFERENCES "PharmacyInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyInvoiceItem" ADD CONSTRAINT "PharmacyInvoiceItem_medicationOrderId_fkey" FOREIGN KEY ("medicationOrderId") REFERENCES "MedicationOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PharmacyInvoiceItem" ADD CONSTRAINT "PharmacyInvoiceItem_medicationCatalogId_fkey" FOREIGN KEY ("medicationCatalogId") REFERENCES "MedicationCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensedMedicine" ADD CONSTRAINT "DispensedMedicine_pharmacyInvoiceId_fkey" FOREIGN KEY ("pharmacyInvoiceId") REFERENCES "PharmacyInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensedMedicine" ADD CONSTRAINT "DispensedMedicine_medicationOrderId_fkey" FOREIGN KEY ("medicationOrderId") REFERENCES "MedicationOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispensedMedicine" ADD CONSTRAINT "DispensedMedicine_medicationCatalogId_fkey" FOREIGN KEY ("medicationCatalogId") REFERENCES "MedicationCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationOrder" ADD CONSTRAINT "MedicationOrder_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationOrder" ADD CONSTRAINT "MedicationOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationOrder" ADD CONSTRAINT "MedicationOrder_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicationOrder" ADD CONSTRAINT "MedicationOrder_medicationCatalogId_fkey" FOREIGN KEY ("medicationCatalogId") REFERENCES "MedicationCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispenseLog" ADD CONSTRAINT "DispenseLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "MedicationOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispenseLog" ADD CONSTRAINT "DispenseLog_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DispenseLog" ADD CONSTRAINT "DispenseLog_pharmacyId_fkey" FOREIGN KEY ("pharmacyId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabOrder" ADD CONSTRAINT "LabOrder_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "InvestigationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadiologyOrder" ADD CONSTRAINT "RadiologyOrder_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadiologyOrder" ADD CONSTRAINT "RadiologyOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadiologyOrder" ADD CONSTRAINT "RadiologyOrder_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadiologyOrder" ADD CONSTRAINT "RadiologyOrder_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "InvestigationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalHistory" ADD CONSTRAINT "MedicalHistory_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalHistory" ADD CONSTRAINT "MedicalHistory_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalHistory" ADD CONSTRAINT "MedicalHistory_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalHistory" ADD CONSTRAINT "MedicalHistory_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_labOrderId_fkey" FOREIGN KEY ("labOrderId") REFERENCES "LabOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_radiologyOrderId_fkey" FOREIGN KEY ("radiologyOrderId") REFERENCES "RadiologyOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_batchOrderId_fkey" FOREIGN KEY ("batchOrderId") REFERENCES "BatchOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DentalRecord" ADD CONSTRAINT "DentalRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DentalRecord" ADD CONSTRAINT "DentalRecord_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DentalRecord" ADD CONSTRAINT "DentalRecord_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DentalRecord" ADD CONSTRAINT "DentalRecord_toothId_fkey" FOREIGN KEY ("toothId") REFERENCES "Tooth"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationType" ADD CONSTRAINT "InvestigationType_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContinuousInfusion" ADD CONSTRAINT "ContinuousInfusion_medicationOrderId_fkey" FOREIGN KEY ("medicationOrderId") REFERENCES "MedicationOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurseAdministration" ADD CONSTRAINT "NurseAdministration_continuousInfusionId_fkey" FOREIGN KEY ("continuousInfusionId") REFERENCES "ContinuousInfusion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NurseAdministration" ADD CONSTRAINT "NurseAdministration_administeredById_fkey" FOREIGN KEY ("administeredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardActivation" ADD CONSTRAINT "CardActivation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardActivation" ADD CONSTRAINT "CardActivation_activatedById_fkey" FOREIGN KEY ("activatedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CardActivation" ADD CONSTRAINT "CardActivation_billingId_fkey" FOREIGN KEY ("billingId") REFERENCES "Billing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchOrder" ADD CONSTRAINT "BatchOrder_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchOrder" ADD CONSTRAINT "BatchOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchOrder" ADD CONSTRAINT "BatchOrder_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchOrderService" ADD CONSTRAINT "BatchOrderService_batchOrderId_fkey" FOREIGN KEY ("batchOrderId") REFERENCES "BatchOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchOrderService" ADD CONSTRAINT "BatchOrderService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchOrderService" ADD CONSTRAINT "BatchOrderService_investigationTypeId_fkey" FOREIGN KEY ("investigationTypeId") REFERENCES "InvestigationType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "LabOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_testTypeId_fkey" FOREIGN KEY ("testTypeId") REFERENCES "InvestigationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LabResultFile" ADD CONSTRAINT "LabResultFile_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "LabResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadiologyResult" ADD CONSTRAINT "RadiologyResult_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "RadiologyOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadiologyResult" ADD CONSTRAINT "RadiologyResult_batchOrderId_fkey" FOREIGN KEY ("batchOrderId") REFERENCES "BatchOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadiologyResult" ADD CONSTRAINT "RadiologyResult_testTypeId_fkey" FOREIGN KEY ("testTypeId") REFERENCES "InvestigationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadiologyResultFile" ADD CONSTRAINT "RadiologyResultFile_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "RadiologyResult"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailedLabResult" ADD CONSTRAINT "DetailedLabResult_labOrderId_fkey" FOREIGN KEY ("labOrderId") REFERENCES "BatchOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailedLabResult" ADD CONSTRAINT "DetailedLabResult_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "BatchOrderService"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DetailedLabResult" ADD CONSTRAINT "DetailedLabResult_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "LabTestTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DentalPhoto" ADD CONSTRAINT "DentalPhoto_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DentalPhoto" ADD CONSTRAINT "DentalPhoto_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DentalPhoto" ADD CONSTRAINT "DentalPhoto_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DentalProcedureCompletion" ADD CONSTRAINT "DentalProcedureCompletion_batchOrderId_fkey" FOREIGN KEY ("batchOrderId") REFERENCES "BatchOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DentalProcedureCompletion" ADD CONSTRAINT "DentalProcedureCompletion_batchOrderServiceId_fkey" FOREIGN KEY ("batchOrderServiceId") REFERENCES "BatchOrderService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DentalProcedureCompletion" ADD CONSTRAINT "DentalProcedureCompletion_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DentalProcedureCompletion" ADD CONSTRAINT "DentalProcedureCompletion_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DentalProcedureCompletion" ADD CONSTRAINT "DentalProcedureCompletion_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAttachedImage" ADD CONSTRAINT "PatientAttachedImage_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAttachedImage" ADD CONSTRAINT "PatientAttachedImage_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAttachedImage" ADD CONSTRAINT "PatientAttachedImage_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VirtualQueue" ADD CONSTRAINT "VirtualQueue_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalCertificate" ADD CONSTRAINT "MedicalCertificate_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalCertificate" ADD CONSTRAINT "MedicalCertificate_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalCertificate" ADD CONSTRAINT "MedicalCertificate_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCashSession" ADD CONSTRAINT "DailyCashSession_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCashSession" ADD CONSTRAINT "DailyCashSession_resetById_fkey" FOREIGN KEY ("resetById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashTransaction" ADD CONSTRAINT "CashTransaction_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DailyCashSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashTransaction" ADD CONSTRAINT "CashTransaction_billingId_fkey" FOREIGN KEY ("billingId") REFERENCES "Billing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashTransaction" ADD CONSTRAINT "CashTransaction_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashTransaction" ADD CONSTRAINT "CashTransaction_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankDeposit" ADD CONSTRAINT "BankDeposit_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DailyCashSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankDeposit" ADD CONSTRAINT "BankDeposit_depositedById_fkey" FOREIGN KEY ("depositedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashExpense" ADD CONSTRAINT "CashExpense_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DailyCashSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashExpense" ADD CONSTRAINT "CashExpense_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_givenById_fkey" FOREIGN KEY ("givenById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "CashExpense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_settledById_fkey" FOREIGN KEY ("settledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_settlementAcceptedById_fkey" FOREIGN KEY ("settlementAcceptedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisNotes" ADD CONSTRAINT "DiagnosisNotes_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisNotes" ADD CONSTRAINT "DiagnosisNotes_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosisNotes" ADD CONSTRAINT "DiagnosisNotes_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientGallery" ADD CONSTRAINT "PatientGallery_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientGallery" ADD CONSTRAINT "PatientGallery_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientGallery" ADD CONSTRAINT "PatientGallery_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceTransaction" ADD CONSTRAINT "InsuranceTransaction_insuranceId_fkey" FOREIGN KEY ("insuranceId") REFERENCES "Insurance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceTransaction" ADD CONSTRAINT "InsuranceTransaction_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InsuranceTransaction" ADD CONSTRAINT "InsuranceTransaction_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAccount" ADD CONSTRAINT "PatientAccount_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAccount" ADD CONSTRAINT "PatientAccount_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountDeposit" ADD CONSTRAINT "AccountDeposit_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PatientAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountDeposit" ADD CONSTRAINT "AccountDeposit_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountDeposit" ADD CONSTRAINT "AccountDeposit_depositedById_fkey" FOREIGN KEY ("depositedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountTransaction" ADD CONSTRAINT "AccountTransaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PatientAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountTransaction" ADD CONSTRAINT "AccountTransaction_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountTransaction" ADD CONSTRAINT "AccountTransaction_billingId_fkey" FOREIGN KEY ("billingId") REFERENCES "Billing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountTransaction" ADD CONSTRAINT "AccountTransaction_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "Visit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountTransaction" ADD CONSTRAINT "AccountTransaction_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountRequest" ADD CONSTRAINT "AccountRequest_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "PatientAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountRequest" ADD CONSTRAINT "AccountRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountRequest" ADD CONSTRAINT "AccountRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountRequest" ADD CONSTRAINT "AccountRequest_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemSettings" ADD CONSTRAINT "SystemSettings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
