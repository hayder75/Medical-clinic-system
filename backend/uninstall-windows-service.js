/**
 * Windows Service Uninstaller
 * Removes the Windows Service
 * 
 * Usage: node uninstall-windows-service.js
 */

const Service = require('node-windows').Service;
const path = require('path');

// Create service object (same as installer)
const svc = new Service({
  name: 'Medical Clinic System',
  script: path.join(__dirname, 'server.js')
});

// Listen for uninstall event
svc.on('uninstall', function() {
  console.log('✅ Service uninstalled successfully!');
  process.exit(0);
});

svc.on('error', function(err) {
  console.error('❌ Error:', err);
  process.exit(1);
});

// Uninstall the service
console.log('Uninstalling Windows Service...');
console.log('This requires administrator privileges.');
console.log('');
svc.uninstall();

