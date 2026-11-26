/**
 * TopPlaced AI — Dual HTTPS & Tunnel Development Gateway
 * 
 * Capabilities:
 * 1. HTTPS Server (Port 3443) using local dev certificates (cert.key / cert.crt):
 *    - https://localhost:3443
 *    - https://192.168.31.71:3443
 *    - Enables full Secure Context (getUserMedia, getDisplayMedia, camera/mic/screen)
 *      on both laptop and phone directly over LAN Wi-Fi!
 * 
 * 2. HTTP Server (Port 3001) for instant Zero-Config Tunnels:
 *    - ngrok http 3001
 *    - Exposes globally trusted HTTPS tunnel with zero CA profile installation!
 * 
 * 3. Unified Proxying:
 *    - /proctoring/* & /api/* -> FastAPI backend (localhost:5000)
 *    - /proctoring/signaling/ws/* -> FastAPI WebRTC WebSocket signaling (localhost:5000)
 *    - /ca.crt -> Direct download of local CA certificate for phone installation
 *    - All other routes -> Next.js frontend (localhost:3000)
 */

const http = require("http");
const https = require("https");
const net = require("net");
const fs = require("fs");
const path = require("path");
const os = require("os");

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "127.0.0.1";
}

const LAN_IP = getLocalIp();


const HTTP_PORT = parseInt(process.env.GATEWAY_PORT || "3001", 10);
const HTTPS_PORT = parseInt(process.env.HTTPS_PORT || "3443", 10);
const FRONTEND_HOST = process.env.FRONTEND_HOST || "127.0.0.1";
const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || "3000", 10);
const BACKEND_HOST = process.env.BACKEND_HOST || "127.0.0.1";
const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || "5000", 10);

const CERT_DIR = path.join(__dirname, "../certificates");
const KEY_PATH = path.join(CERT_DIR, "cert.key");
const CERT_PATH = path.join(CERT_DIR, "cert.crt");
const CA_PATH = path.join(CERT_DIR, "ca.crt");

function isBackendPath(url) {
  if (!url) return false;
  return (
    url.startsWith("/interview") ||
    url.startsWith("/interviews") ||
    url.startsWith("/proctoring") ||
    url.startsWith("/api/proctoring") ||
    url.startsWith("/api") ||
    url.startsWith("/socket.io")
  );
}

function handleHttpRequest(req, res, isHttps) {
  // Direct CA certificate download endpoint for mobile setup
  if (req.url === "/ca.crt" || req.url === "/download-ca") {
    if (fs.existsSync(CA_PATH)) {
      res.writeHead(200, {
        "Content-Type": "application/x-x509-ca-cert",
        "Content-Disposition": "attachment; filename=\"topplaced-ca.crt\"",
      });
      return fs.createReadStream(CA_PATH).pipe(res);
    }
  }

  const toBackend = isBackendPath(req.url);
  const targetHost = toBackend ? BACKEND_HOST : FRONTEND_HOST;
  const targetPort = toBackend ? BACKEND_PORT : FRONTEND_PORT;

  const options = {
    hostname: targetHost,
    port: targetPort,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `${targetHost}:${targetPort}`,
      "x-forwarded-host": req.headers.host || "",
      "x-forwarded-proto": isHttps ? "https" : (req.headers["x-forwarded-proto"] || "http"),
      "x-forwarded-for": req.socket.remoteAddress || "",
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on("error", (err) => {
    console.error(`[Gateway] Error proxying ${req.method} ${req.url} to ${targetHost}:${targetPort}:`, err.message);
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: "Bad Gateway",
          message: `Unable to connect to service at ${targetHost}:${targetPort}. Ensure Next.js (:3000) and FastAPI (:5000) are active.`,
          detail: err.message,
        })
      );
    }
  });

  req.pipe(proxyReq, { end: true });
}

function handleUpgrade(req, socket, head) {
  const toBackend = isBackendPath(req.url);
  const targetHost = toBackend ? BACKEND_HOST : FRONTEND_HOST;
  const targetPort = toBackend ? BACKEND_PORT : FRONTEND_PORT;

  const targetSocket = net.connect(targetPort, targetHost, () => {
    let rawHeaders = `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`;
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      const key = req.rawHeaders[i];
      const val = req.rawHeaders[i + 1];
      if (key.toLowerCase() === "host") {
        rawHeaders += `Host: ${targetHost}:${targetPort}\r\n`;
      } else {
        rawHeaders += `${key}: ${val}\r\n`;
      }
    }
    rawHeaders += "\r\n";

    targetSocket.write(rawHeaders);
    if (head && head.length > 0) {
      targetSocket.write(head);
    }

    targetSocket.pipe(socket);
    socket.pipe(targetSocket);
  });

  targetSocket.on("error", (err) => {
    console.warn(`[Gateway WS Error] Proxy upgrade failed for ${req.url}:`, err.message);
    socket.destroy();
  });

  socket.on("error", () => {
    targetSocket.destroy();
  });
}

// 1. Create HTTP Gateway (Port 3001) — ideal for ngrok or local fallback
const httpServer = http.createServer((req, res) => handleHttpRequest(req, res, false));
httpServer.on("upgrade", handleUpgrade);

httpServer.listen(HTTP_PORT, "0.0.0.0", () => {
  console.log("==================================================================");
  console.log(`🌐 [HTTP Gateway] Running on http://localhost:${HTTP_PORT} and http://${LAN_IP}:${HTTP_PORT}`);
  console.log(`   Tunnel with ngrok: ngrok http ${HTTP_PORT}`);
});

// 2. Create HTTPS Gateway (Port 3443) if certificates exist
if (fs.existsSync(KEY_PATH) && fs.existsSync(CERT_PATH)) {
  const sslOptions = {
    key: fs.readFileSync(KEY_PATH),
    cert: fs.readFileSync(CERT_PATH),
  };

  const httpsServer = https.createServer(sslOptions, (req, res) => handleHttpRequest(req, res, true));
  httpsServer.on("upgrade", handleUpgrade);

  httpsServer.listen(HTTPS_PORT, "0.0.0.0", () => {
    console.log("------------------------------------------------------------------");
    console.log(`🔒 [HTTPS Gateway] Running on:`);
    console.log(`   - Laptop (Localhost):  https://localhost:${HTTPS_PORT}`);
    console.log(`   - Laptop / Phone (LAN): https://${LAN_IP}:${HTTPS_PORT}`);
    console.log(`   - Root CA Certificate: http://${LAN_IP}:${HTTP_PORT}/ca.crt`);
    console.log("==================================================================");
  });


  httpsServer.on("error", (err) => {
    console.error("[Gateway HTTPS Error]:", err.message);
  });
} else {
  console.log("⚠️ No SSL certificates found in ./certificates. Run `npm run cert:generate` to enable HTTPS.");
}

httpServer.on("error", (err) => {
  console.error("[Gateway HTTP Error]:", err.message);
});

process.on("uncaughtException", (err) => {
  console.error("[Gateway UncaughtException]:", err.message);
});

process.on("unhandledRejection", (reason) => {
  console.error("[Gateway UnhandledRejection]:", reason);
});
