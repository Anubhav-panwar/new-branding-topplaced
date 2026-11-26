const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const caPath = path.join(__dirname, '..', 'certificates', 'ca.crt');
const ca = fs.readFileSync(caPath);

function postJson(urlStr, data) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const postData = JSON.stringify(data);
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      ca: ca
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('--- 1. Testing Root CA download over HTTP (Port 3001) ---');
  await new Promise((resolve, reject) => {
    http.get('http://192.168.31.71:3001/ca.crt', (res) => {
      console.log('CA Status:', res.statusCode, 'Content-Type:', res.headers['content-type']);
      if (res.statusCode === 200) resolve();
      else reject(new Error('Failed to get CA: ' + res.statusCode));
    }).on('error', reject);
  });

  console.log('\n--- 2. Testing HTTPS Next.js Frontend Page (Port 3443) ---');
  await new Promise((resolve, reject) => {
    https.get('https://192.168.31.71:3443/', { ca }, (res) => {
      console.log('Next.js Page Status:', res.statusCode);
      if (res.statusCode === 200) resolve();
      else reject(new Error('Failed to get Next.js page: ' + res.statusCode));
    }).on('error', reject);
  });

  console.log('\n--- 3. Testing 3rd Eye Pairing Creation over HTTPS ---');
  const createRes = await postJson('https://192.168.31.71:3443/proctoring/pairing/create', {
    interviewId: 'interview_tls_test_' + Date.now(),
    frontendBaseUrl: 'https://192.168.31.71:3443'
  });
  console.log('Pairing created successfully! Status:', createRes.status, 'Code:', createRes.body.pairingCode);
  const { pairingId, laptopToken, pairingToken } = createRes.body;

  console.log('\n--- 4. Testing Phone Claiming Pairing over HTTPS ---');
  const claimRes = await postJson('https://192.168.31.71:3443/proctoring/pairing/claim', {
    pairingId,
    pairingToken,
    deviceInfo: { browser: 'Safari Mobile', os: 'iOS 17' }
  });
  console.log('Pairing claimed! Status:', claimRes.status, 'Phone Token received:', !!claimRes.body.phoneToken);
  const { phoneToken } = claimRes.body;

  console.log('\n--- 5. Connecting Laptop via Secure WebSocket (WSS) ---');
  const laptopWsUrl = `wss://192.168.31.71:3443/proctoring/signaling/ws/${pairingId}?role=laptop&token=${pairingToken}`;
  const laptopWs = new WebSocket(laptopWsUrl, { ca });
  await new Promise((resolve, reject) => {
    laptopWs.on('open', () => {
      console.log('✅ Laptop WSS connected successfully!');
      resolve();
    });
    laptopWs.on('error', reject);
  });

  console.log('\n--- 6. Connecting Phone via Secure WebSocket (WSS) ---');
  const phoneWsUrl = `wss://192.168.31.71:3443/proctoring/signaling/ws/${pairingId}?role=phone&token=${phoneToken}`;
  const phoneWs = new WebSocket(phoneWsUrl, { ca });
  await new Promise((resolve, reject) => {
    phoneWs.on('open', () => {
      console.log('✅ Phone WSS connected successfully!');
      resolve();
    });
    phoneWs.on('error', reject);
  });

  console.log('\n--- 7. Exchanging WebRTC Offer / Answer & ICE Candidate ---');
  let offerReceived = false;
  let answerReceived = false;

  laptopWs.on('message', (raw) => {
    const msg = JSON.parse(raw.toString());
    console.log('[Laptop WS Inbound]:', msg.type);
    if (msg.type === 'offer') {
      offerReceived = true;
      // Laptop replies with answer
      laptopWs.send(JSON.stringify({ type: 'answer', sdp: 'v=0 dummy-answer-sdp' }));
    }
  });

  phoneWs.on('message', (raw) => {
    const msg = JSON.parse(raw.toString());
    console.log('[Phone WS Inbound]:', msg.type);
    if (msg.type === 'answer') {
      answerReceived = true;
      // Phone sends ICE candidate
      phoneWs.send(JSON.stringify({ type: 'ice-candidate', candidate: { candidate: 'candidate:1 1 UDP ...' } }));
    }
  });

  // Phone initiates offer
  phoneWs.send(JSON.stringify({ type: 'offer', sdp: 'v=0 dummy-offer-sdp' }));

  // Wait for exchange
  for (let i = 0; i < 20; i++) {
    if (offerReceived && answerReceived) break;
    await new Promise(r => setTimeout(r, 200));
  }

  laptopWs.close();
  phoneWs.close();

  if (offerReceived && answerReceived) {
    console.log('\n======================================================');
    console.log('🎉 ALL INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
    console.log('   - Root CA download: OK');
    console.log('   - HTTPS Proxy to Next.js: OK');
    console.log('   - HTTPS Proxy to FastAPI: OK');
    console.log('   - WSS Proxy to WebRTC Signaling: OK');
    console.log('   - Peer Authentication & Message Relay: OK');
    console.log('======================================================');
  } else {
    throw new Error('Signaling exchange incomplete: offerReceived=' + offerReceived + ', answerReceived=' + answerReceived);
  }
}

run().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
