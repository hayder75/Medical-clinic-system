/**
 * Windows Service Installer
 * Installs backend.exe as a Windows Service for auto-start
 * 
 * Usage: node install-windows-service.js
 * Requires: node-windows package
 */

const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'Medical Clinic System',
  description: 'Medical Clinic System Backend Server',
  script: path.join(__dirname, 'server.js'),
  nodeOptions: [
    '--max_old_space_size=4096'
  ]
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', function() {
  console.log('✅ Service installed successfully!');
  console.log('Starting service...');
  svc.start();
});

svc.on('start', function() {
  console.log('✅ Service started successfully!');
  console.log('');
  console.log('Service is now running.');
  console.log('It will start automatically on Windows boot.');
  process.exit(0);
});

svc.on('error', function(err) {
  console.error('❌ Service error:', err);
  process.exit(1);
});

// Install the service
console.log('Installing Windows Service...');
console.log('This requires administrator privileges.');
console.log('');
svc.install();

