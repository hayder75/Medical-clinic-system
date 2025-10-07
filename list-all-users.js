console.log('👥 ALL AVAILABLE USERS IN THE SYSTEM');
console.log('=====================================\n');

console.log('🔧 CURRENTLY ACTIVE TEST USERS (Fallback System):');
console.log('---------------------------------------------------');
console.log('1. Chief Pharmacist');
console.log('   Username: pharmacist');
console.log('   Password: pharmacist123');
console.log('   Role: PHARMACIST');
console.log('   ID: 1\n');

console.log('2. Pharmacy Staff');
console.log('   Username: pharmacy');
console.log('   Password: pharmacy123');
console.log('   Role: PHARMACIST');
console.log('   ID: 2\n');

console.log('3. Admin User');
console.log('   Username: admin');
console.log('   Password: admin123');
console.log('   Role: ADMIN');
console.log('   ID: 3\n');

console.log('4. Dr. Smith');
console.log('   Username: doctor');
console.log('   Password: doctor123');
console.log('   Role: DOCTOR');
console.log('   ID: 4\n');

console.log('📋 DATABASE USERS (If Database Was Connected):');
console.log('-----------------------------------------------');
console.log('1. Dr. Hayder');
console.log('   Username: hayder');
console.log('   Password: password123');
console.log('   Email: hayder@clinic.com');
console.log('   Role: DOCTOR');
console.log('   Specialties: General Doctor');
console.log('   Consultation Fee: 500 ETB');
console.log('   Phone: 0912345678');
console.log('   ID: 1515158c-b80d-48cb-a530-a8a32da7cd59\n');

console.log('2. Pharmacy Staff');
console.log('   Username: pharmacy');
console.log('   Password: password123');
console.log('   Email: pharmacy@clinic.com');
console.log('   Role: PHARMACIST');
console.log('   Phone: 0912345679');
console.log('   ID: 533c4c75-983d-452a-adcb-8091bb3bd03b\n');

console.log('3. Nurse Jane');
console.log('   Username: nurse');
console.log('   Password: password123');
console.log('   Email: nurse@clinic.com');
console.log('   Role: NURSE');
console.log('   Phone: 0912345680');
console.log('   ID: nurse-123\n');

console.log('🎯 AVAILABLE ROLES IN THE SYSTEM:');
console.log('---------------------------------');
console.log('• ADMIN - Full system access');
console.log('• DOCTOR - Patient care, prescriptions, orders');
console.log('• PHARMACIST - Medication dispensing, inventory');
console.log('• PHARMACY_OFFICER - Pharmacy operations');
console.log('• PHARMACY_BILLING_OFFICER - Pharmacy billing');
console.log('• NURSE - Patient care, triage, administration');
console.log('• LAB_TECHNICIAN - Lab orders and results');
console.log('• RADIOLOGIST - Radiology orders and results');
console.log('• RADIOLOGY_TECHNICIAN - Radiology operations');
console.log('• BILLING_OFFICER - General billing');
console.log('• RECEPTIONIST - Patient registration');
console.log('• CARE_COORDINATOR - Patient coordination');
console.log('• MEDICAL_RECORDS_OFFICER - Records management');
console.log('• IT_SUPPORT - Technical support');
console.log('• HR_OFFICER - Human resources');
console.log('• SECURITY_STAFF - Security');
console.log('• SOCIAL_WORKER - Social services');
console.log('• DIETITIAN - Nutrition services');
console.log('• CMO - Chief Medical Officer');
console.log('• HOSPITAL_MANAGER - Hospital management');
console.log('• CLINICAL_RESEARCH_COORDINATOR - Research');
console.log('• OWNER - System owner');

console.log('\n💡 NOTE:');
console.log('--------');
console.log('Currently using fallback test users because database connection is not available.');
console.log('To use database users, you need to set up PostgreSQL with proper credentials.');
console.log('The system automatically falls back to test users when database is unavailable.');
