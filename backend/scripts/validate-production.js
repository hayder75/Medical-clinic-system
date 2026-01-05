'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function log(section, message) {
  console.log(`[${section}] ${message}`);
}

function fail(section, message) {
  console.error(`[${section}] ERROR: ${message}`);
  process.exitCode = 1;
}

function checkCommand(cmd, args, section, options = {}) {
  try {
    const res = spawnSync(cmd, args, { stdio: 'pipe', encoding: 'utf8', ...options });
    if (res.status !== 0) {
      fail(section, `${cmd} ${args.join(' ')} failed.\n${res.stderr || res.stdout}`);
      return false;
    }
    log(section, `${cmd} ${args.join(' ')} OK`);
    return true;
  } catch (e) {
    fail(section, `Failed to run ${cmd}: ${e.message}`);
    return false;
  }
}

function main() {
  log('ENV', 'Validating required environment variables');
  const requiredEnv = ['DATABASE_URL', 'JWT_SECRET'];
  for (const key of requiredEnv) {
    if (!process.env[key] || String(process.env[key]).trim() === '') {
      fail('ENV', `Missing required env: ${key}`);
    } else {
      log('ENV', `${key} present`);
    }
  }

  const uploadsDir = process.env.UPLOADS_DIR || 'uploads';
  const uploadsPath = path.resolve(process.cwd(), uploadsDir);
  try {
    if (!fs.existsSync(uploadsPath)) {
      fs.mkdirSync(uploadsPath, { recursive: true });
      log('FILES', `Created uploads dir at ${uploadsPath}`);
    } else {
      log('FILES', `Uploads dir exists at ${uploadsPath}`);
    }
  } catch (e) {
    fail('FILES', `Cannot ensure uploads dir at ${uploadsPath}: ${e.message}`);
  }

  log('NODE', 'Checking Node.js and npm');
  checkCommand('node', ['--version'], 'NODE');
  checkCommand('npm', ['--version'], 'NODE');

  log('PRISMA', 'Validating Prisma setup');
  checkCommand('npx', ['prisma', 'validate'], 'PRISMA');
  checkCommand('npx', ['prisma', 'generate'], 'PRISMA');

  log('DB', 'Checking migration status (no destructive actions)');
  checkCommand('npx', ['prisma', 'migrate', 'status', '--schema=prisma/schema.prisma'], 'DB');

  log('SERVER', 'Smoke testing server module load');
  try {
    const res = spawnSync('node', ['-e', "require('./server.js')"], { timeout: 5000 });
    if (res.status !== 0) {
      fail('SERVER', `Server failed to load: ${res.stderr || res.stdout}`);
    } else {
      log('SERVER', 'Server module loaded successfully');
    }
  } catch (e) {
    fail('SERVER', `Server smoke test failed: ${e.message}`);
  }

  if (process.exitCode === 0 || process.exitCode === undefined) {
    log('RESULT', 'Validation PASSED');
    process.exit(0);
  } else {
    fail('RESULT', 'Validation FAILED');
    process.exit(1);
  }
}

process.exitCode = 0;
main();
