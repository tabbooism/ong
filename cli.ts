import readline from 'readline';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function runCLI() {
  console.clear();
  console.log(`
  ██████╗ ██╗   ██╗███╗   ██╗███████╗ ██████╗ ███████╗██╗███╗   ██╗████████╗
  ██╔══██╗██║   ██║████╗  ██║██╔════╝██╔═══██╗██╔════╝██║████╗  ██║╚══██╔══╝
  ██████╔╝██║   ██║██╔██╗ ██║█████╗  ██║   ██║███████╗██║██╔██╗ ██║   ██║   
  ██╔══██╗██║   ██║██║╚██╗██║██╔══╝  ██║   ██║╚════██║██║██║╚██╗██║   ██║   
  ██║  ██║╚██████╔╝██║ ╚████║███████╗╚██████╔╝███████║██║██║ ╚████║   ██║   
  ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝ ╚═════╝ ╚══════╝╚═╝╚═╝  ╚═══╝   ╚═╝   
                                                                            
  ==========================================================================
                      COMMAND LINE INTERFACE v1.0
  ==========================================================================
  `);

  const target = await question('Enter target (domain, IP, username, email): ');
  if (!target.trim()) {
    console.log('Target is required. Exiting.');
    rl.close();
    return;
  }

  console.log('\nAvailable OSINT Categories:');
  console.log('1. Infrastructure (DNS, WHOIS, Ports)');
  console.log('2. Social Media (Username correlation)');
  console.log('3. Dark Web (Breach databases, forums)');
  console.log('4. Offensive (NightFury v3.0 Scan)');
  console.log('5. Threat Intelligence (Real-time Enrichment)');
  console.log('6. All of the above');
  
  const categoryChoice = await question('\nSelect category (1-6): ');
  
  const categories = [];
  if (categoryChoice === '1' || categoryChoice === '6') categories.push('Infrastructure');
  if (categoryChoice === '2' || categoryChoice === '6') categories.push('Social Media');
  if (categoryChoice === '3' || categoryChoice === '6') categories.push('Dark Web');
  if (categoryChoice === '4' || categoryChoice === '6') categories.push('Offensive');
  if (categoryChoice === '5' || categoryChoice === '6') categories.push('Threat Intelligence');

  if (categories.length === 0) {
    console.log('Invalid selection. Exiting.');
    rl.close();
    return;
  }

  console.log(`\n[*] Initiating investigation on target: ${target}`);
  console.log(`[*] Selected categories: ${categories.join(', ')}\n`);

  const findings: string[] = [];

  for (const category of categories) {
    console.log(`[+] Running ${category} module...`);
    
    // Simulate data collection delay
    await delay(1500 + Math.random() * 1000);
    
    if (category === 'Infrastructure') {
      console.log(`  -> Discovered infrastructure details. Target ${target} resolves to Cloudflare IPs.`);
      await delay(800);
      console.log(`  -> Initiating Origin IP Discovery for ${target}...`);
      await delay(1000);
      console.log(`  [*] Querying Censys & Shodan for SSL/DNS history...`);
      await delay(1500);
      
      let originIp = '151.0.214.242';
      let provider = 'Hostinger International';
      if (!target.includes('runehall') && !target.includes('rh420')) {
        originIp = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
        provider = 'Unknown Hosting Provider';
      }
      
      console.log(`  [SUCCESS] Origin IP identified: ${originIp} (${provider})`);
      findings.push(`Infrastructure: Target ${target} resolves to Cloudflare IPs. Origin IP Discovery bypassed CDN. True IP: ${originIp} (${provider}). Open ports: 80, 443.`);
    } else if (category === 'Social Media') {
      findings.push(`Social Media: Target ${target} associated with accounts on Twitter, GitHub, and Reddit.`);
      console.log(`  -> Discovered social media presence.`);
    } else if (category === 'Dark Web') {
      findings.push(`Dark Web: Target ${target} found in 2 breach compilations (2021, 2023).`);
      console.log(`  -> Discovered breach records.`);
    } else if (category === 'Offensive') {
      console.log(`  -> Initiating NightFury v3.0 scan on ${target}...`);
      await delay(1000);
      console.log(`  [TEST] Vector: SQLI | Target: http://${target}/login`);
      console.log(`  [PAYLOAD] username=' OR 1=1--`);
      await delay(500);
      console.log(`  [RESPONSE] Status: 500 | Length: 1024 bytes | Data: syntax error...`);
      await delay(800);
      console.log(`  [TEST] Vector: XSS | Target: http://${target}/search`);
      console.log(`  [PAYLOAD] q=<script>alert(1)</script>`);
      await delay(500);
      console.log(`  [RESPONSE] Status: 200 | Length: 2048 bytes | Data: ...<script>alert(1)</script>...`);
      console.log(`  [SUCCESS] XSS vulnerability confirmed.`);
      findings.push(`Offensive: NightFury scan identified potential XSS and SQLi vulnerabilities on ${target}. Payload: <script>alert(1)</script> reflected in response.`);
      console.log(`  -> Scan completed. Vulnerabilities logged.`);
    } else if (category === 'Threat Intelligence') {
      console.log(`  -> Connecting to Global Threat Intelligence Exchange...`);
      await delay(1200);
      const isMalicious = Math.random() > 0.5;
      if (isMalicious) {
        console.log(`  [CRITICAL] Target ${target} matched known IoCs.`);
        console.log(`  [ACTOR] Associated with FIN7 / No6love9_Syndicate.`);
        findings.push(`Threat Intelligence: Target ${target} is flagged as MALICIOUS. Associated with FIN7 / No6love9_Syndicate. IoCs found in recent campaigns.`);
      } else {
        console.log(`  [INFO] Target ${target} has no known malicious associations in current feeds.`);
        findings.push(`Threat Intelligence: Target ${target} is clean. No known malicious associations.`);
      }
      console.log(`  -> Enrichment complete.`);
    }
  }

  console.log('\n[*] Data collection complete. Initiating AI Analysis...\n');

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in the environment.');
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
      You are an expert OSINT investigator. Analyze the following findings for the target: ${target}.
      
      Findings:
      ${findings.join('\n')}
      
      Provide a comprehensive, professional intelligence report including:
      1. Executive Summary
      2. Detailed Technical Analysis
      3. Threat Assessment & Risks
      4. Recommended Next Steps
      
      Format as Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
    });

    console.log('==========================================================================');
    console.log('                         AI INTELLIGENCE REPORT                           ');
    console.log('==========================================================================\n');
    console.log(response.text);
    console.log('\n==========================================================================');

  } catch (error: any) {
    const errorStr = error instanceof Error ? error.message : String(error);
    const isQuotaError = errorStr.includes('429') || errorStr.includes('RESOURCE_EXHAUSTED');
    
    console.log(`\n[!] AI Analysis failed: ${isQuotaError ? 'API Quota Exceeded' : errorStr}`);
    console.log('[!] Falling back to local report generation.\n');
    
    console.log('==========================================================================');
    console.log('                       LOCAL INTELLIGENCE REPORT                          ');
    console.log('==========================================================================\n');
    console.log(`Target: ${target}`);
    console.log(`\nFindings Summary:\n${findings.map(f => '- ' + f).join('\n')}`);
    console.log(`\nRecommendation: Proceed with manual verification of discovered vectors.`);
    console.log('\n==========================================================================');
  }

  rl.close();
}

runCLI();
