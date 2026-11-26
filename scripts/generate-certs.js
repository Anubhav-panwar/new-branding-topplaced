const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const certDir = path.join(__dirname, '..', 'certificates');
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

// Collect local IP addresses
const ips = new Set(['127.0.0.1', 'localhost', '192.168.31.71']);
const interfaces = os.networkInterfaces();
for (const devName in interfaces) {
  const iface = interfaces[devName];
  for (let i = 0; i < iface.length; i++) {
    const alias = iface[i];
    if (alias.family === 'IPv4' && !alias.internal) {
      ips.add(alias.address);
    }
  }
}

const domains = Array.from(ips);
console.log('Generating development CA and certificates for:', domains.join(', '));

const caKey = path.join(certDir, 'ca.key');
const caCert = path.join(certDir, 'ca.crt');
const certKey = path.join(certDir, 'cert.key');
const certCrt = path.join(certDir, 'cert.crt');

if (!fs.existsSync(caKey) || !fs.existsSync(caCert)) {
  console.log('Creating Root CA...');
  execSync(`npx -y mkcert create-ca --key "${caKey}" --cert "${caCert}"`, { stdio: 'inherit', cwd: certDir });
}

console.log('Creating TLS Certificate...');
const domainsArgs = domains.join(' ');
execSync(`npx -y mkcert create-cert --ca-key "${caKey}" --ca-cert "${caCert}" --key "${certKey}" --cert "${certCrt}" --domains ${domainsArgs}`, { stdio: 'inherit', cwd: certDir });

console.log('✅ Certificates successfully created in:', certDir);
