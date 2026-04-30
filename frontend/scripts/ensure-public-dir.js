const fs = require('fs');
const path = require('path');

const publicDir = path.join(process.cwd(), 'public');

// Create public directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
  console.log('Creating public directory...');
  fs.mkdirSync(publicDir, { recursive: true });
  console.log('Public directory created successfully!');
} else {
  console.log('Public directory already exists');
}
