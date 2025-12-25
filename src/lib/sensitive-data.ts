/**
 * Sensitive Data Detection Utility
 * Scans content for potential passwords, API keys, tokens, and other sensitive data
 */

export interface SensitiveMatch {
  type: string;
  pattern: string;
  line: number;
  snippet: string;
}

// Patterns to detect sensitive data
const SENSITIVE_PATTERNS = [
  // ===================
  // PROVIDER-SPECIFIC API KEYS
  // ===================
  
  // OpenAI
  { type: "OpenAI Key", regex: /sk-(?:proj-)?[a-zA-Z0-9]{20,}/gi },
  
  // Anthropic
  { type: "Anthropic Key", regex: /sk-ant-[a-zA-Z0-9-]{20,}/gi },
  
  // Stripe
  { type: "Stripe Key", regex: /(?:sk|pk|rk)_(?:live|test)_[a-zA-Z0-9]{20,}/gi },
  
  // Firebase
  { type: "Firebase Key", regex: /AIza[a-zA-Z0-9_-]{35}/gi },
  
  // Supabase
  { type: "Supabase Key", regex: /(?:sbp|anon|service_role)_[a-zA-Z0-9]{20,}/gi },
  { type: "Supabase Key", regex: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]{50,}\.[a-zA-Z0-9_-]{20,}/gi },
  
  // Azure
  { type: "Azure Key", regex: /(?:AccountKey|SharedAccessKey)\s*=\s*[a-zA-Z0-9+/=]{40,}/gi },
  { type: "Azure Connection", regex: /DefaultEndpointsProtocol=https?;AccountName=[^;]+;AccountKey=[^;]+/gi },
  
  // Google Cloud
  { type: "Google API Key", regex: /AIza[a-zA-Z0-9_-]{35}/gi },
  
  // Twilio
  { type: "Twilio Key", regex: /SK[a-f0-9]{32}/gi },
  
  // SendGrid
  { type: "SendGrid Key", regex: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/gi },
  
  // Mailgun
  { type: "Mailgun Key", regex: /key-[a-f0-9]{32}/gi },
  
  // ===================
  // GENERIC API KEYS
  // ===================
  { type: "API Key", regex: /(?:api[_-]?key|apikey)\s*[:=]\s*["']?([a-zA-Z0-9_-]{20,})["']?/gi },
  
  // ===================
  // PASSWORDS
  // ===================
  { type: "Password", regex: /(?:password\d*|passwd\d*|pwd\d*|pass\d*|pw\d*)\s*[:=]\s*["']([^"']{4,})["']/gi },
  { type: "Password", regex: /(?:password\d*|passwd\d*|pwd\d*|pass\d*|pw\d*)\s*[:=]\s*([^\s,;]{6,})/gi },
  
  // ===================
  // TOKENS
  // ===================
  { type: "Token", regex: /(?:access[_-]?token|auth[_-]?token|bearer|token\d*)\s*[:=]\s*["']?([a-zA-Z0-9_-]{8,})["']?/gi },
  { type: "GitHub Token", regex: /(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36,}/gi },
  { type: "Slack Token", regex: /xox[baprs]-[a-zA-Z0-9-]{10,}/gi },
  { type: "Discord Token", regex: /[MN][A-Za-z\d]{23,}\.[\w-]{6}\.[\w-]{27}/gi },
  { type: "NPM Token", regex: /npm_[a-zA-Z0-9]{36}/gi },
  { type: "PyPI Token", regex: /pypi-[a-zA-Z0-9]{40,}/gi },
  
  // ===================
  // SECRETS
  // ===================
  { type: "Secret", regex: /(?:secret\d*|private[_-]?key|key\d*)\s*[:=]\s*["']?([a-zA-Z0-9_/+=]{8,})["']?/gi },
  { type: "Secret", regex: /(?:client[_-]?secret)\s*[:=]\s*["']?([a-zA-Z0-9_-]{20,})["']?/gi },
  
  // ===================
  // CREDENTIALS
  // ===================
  { type: "Credential", regex: /(?:credential\d*|cred\d*|auth\d*)\s*[:=]\s*["']?([a-zA-Z0-9_-]{8,})["']?/gi },
  
  // ===================
  // AWS
  // ===================
  { type: "AWS Key", regex: /AKIA[0-9A-Z]{16}/gi },
  { type: "AWS Secret", regex: /(?:aws[_-]?secret)\s*[:=]\s*["']?([a-zA-Z0-9/+=]{40})["']?/gi },
  
  // ===================
  // DATABASE & CONNECTION STRINGS
  // ===================
  { type: "Database URL", regex: /(?:postgres|mysql|mongodb|redis|mariadb|cockroachdb):\/\/[^\s]+:[^\s]+@/gi },
  { type: "Connection String", regex: /(?:mongodb\+srv|amqp|amqps):\/\/[^\s]+:[^\s]+@/gi },
  { type: "JDBC URL", regex: /jdbc:[a-z]+:\/\/[^\s]+:[^\s]+@/gi },
  
  // ===================
  // SSH & CRYPTOGRAPHIC KEYS
  // ===================
  { type: "Private Key", regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY(?: BLOCK)?-----/gi },
  { type: "SSH Key", regex: /ssh-(?:rsa|ed25519|dss|ecdsa)\s+[A-Za-z0-9+/=]{40,}/gi },
  { type: "PEM Certificate", regex: /-----BEGIN CERTIFICATE-----/gi },
  { type: "PGP Key", regex: /-----BEGIN PGP (?:PUBLIC|PRIVATE) KEY BLOCK-----/gi },
  
  // ===================
  // ENVIRONMENT VARIABLES
  // ===================
  { type: "Env Variable", regex: /(?:DB_PASSWORD|DATABASE_PASSWORD|REDIS_PASSWORD|SMTP_PASSWORD|MAIL_PASSWORD|EMAIL_PASSWORD|MYSQL_PASSWORD|POSTGRES_PASSWORD|MONGO_PASSWORD)\s*=\s*[^\s]+/gi },
  
  // ===================
  // WEBHOOKS
  // ===================
  { type: "Webhook Secret", regex: /(?:webhook[_-]?secret|whsec_)[a-zA-Z0-9_-]{20,}/gi },
  
  // ===================
  // JWT & OAUTH
  // ===================
  { type: "JWT Token", regex: /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/gi },
  { type: "OAuth Token", regex: /(?:oauth[_-]?token|refresh[_-]?token)\s*[:=]\s*["']?([a-zA-Z0-9_-]{20,})["']?/gi },
  
  // ===================
  // BASE64 ENCODED SECRETS (long base64 strings with labels)
  // ===================
  { type: "Base64 Secret", regex: /(?:secret|key|token|password|credential)\s*[:=]\s*["']?([A-Za-z0-9+/]{40,}={0,2})["']?/gi },
  
  // ===================
  // HIGH-ENTROPY STRINGS (random-looking strings assigned to sensitive-named vars)
  // Detects patterns like: MY_SECRET=x7kQ9mR2pL5nW8yZ
  // ===================
  { type: "Potential Secret", regex: /(?:_SECRET|_KEY|_TOKEN|_PASSWORD|_CREDENTIAL|_API_KEY)\s*[:=]\s*["']?([a-zA-Z0-9_-]{12,})["']?/gi },
  
  // ===================
  // HEXADECIMAL SECRETS (32+ char hex strings with labels)
  // ===================
  { type: "Hex Secret", regex: /(?:secret|key|token|hash)\s*[:=]\s*["']?([a-f0-9]{32,})["']?/gi },
];

// Common false positives to ignore
const FALSE_POSITIVE_PATTERNS = [
  /\{\{.*\}\}/,  // Template variables like {{API_KEY}}
  /\$\{.*\}/,    // Environment variables like ${API_KEY}
  /\[\[.*\]\]/,  // LynxPrompt template variables like [[API_KEY]]
  /process\.env\./,  // Node.js env references
  /import\.meta\.env\./,  // Vite env references
  /os\.environ/,  // Python env references
  /getenv\(/,  // Various getenv() calls
  /<your[_-]?.*>/i,  // Placeholder like <your_api_key>
  /<insert[_-]?.*>/i,  // Placeholder like <insert_key_here>
  /<add[_-]?.*>/i,  // Placeholder like <add_your_key>
  /your[_-]?(?:api[_-]?)?key/i,  // Placeholder text like "your_api_key"
  /your[_-]?(?:api[_-]?)?token/i,  // Placeholder text
  /your[_-]?(?:api[_-]?)?secret/i,  // Placeholder text
  /xxx+/i,  // Masked values like xxx or XXXX
  /yyy+/i,  // Masked values like yyy
  /zzz+/i,  // Masked values like zzz
  /abc123/i,  // Common example values
  /123456/,  // Simple sequential numbers
  /example/i,  // Example values
  /placeholder/i,
  /sample/i,  // Sample values
  /dummy/i,  // Dummy values
  /test[_-]?(?:key|token|secret|password)/i,  // Test values
  /demo[_-]?(?:key|token|secret|password)/i,  // Demo values
  /fake[_-]?(?:key|token|secret|password)/i,  // Fake values
  /mock[_-]?(?:key|token|secret|password)/i,  // Mock values
  /\*\*\*+/,  // Masked with asterisks
  /\.\.\.+/,  // Masked with dots
  /___+/,  // Masked with underscores
  /REPLACE_ME/i,  // Common placeholder
  /CHANGEME/i,  // Common placeholder
  /TODO/i,  // TODO markers
  /FIXME/i,  // FIXME markers
];

/**
 * Check if a match is likely a false positive (placeholder, example, etc.)
 */
function isFalsePositive(snippet: string): boolean {
  return FALSE_POSITIVE_PATTERNS.some(pattern => pattern.test(snippet));
}

/**
 * Scan content for sensitive data
 * @returns Array of matches with type, line number, and snippet
 */
export function detectSensitiveData(content: string): SensitiveMatch[] {
  const matches: SensitiveMatch[] = [];
  const lines = content.split('\n');
  
  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    
    for (const { type, regex } of SENSITIVE_PATTERNS) {
      // Reset regex lastIndex for global patterns
      regex.lastIndex = 0;
      
      let match;
      while ((match = regex.exec(line)) !== null) {
        const snippet = line.substring(
          Math.max(0, match.index - 10),
          Math.min(line.length, match.index + match[0].length + 10)
        ).trim();
        
        // Skip false positives
        if (isFalsePositive(snippet) || isFalsePositive(match[0])) {
          continue;
        }
        
        matches.push({
          type,
          pattern: match[0].substring(0, 50) + (match[0].length > 50 ? '...' : ''),
          line: lineNum + 1,
          snippet: snippet.length > 60 ? snippet.substring(0, 60) + '...' : snippet,
        });
      }
    }
  }
  
  // Remove duplicates based on line, type, AND snippet (to show different items on same line)
  const unique = matches.filter((match, index, self) =>
    index === self.findIndex(m => 
      m.line === match.line && 
      m.type === match.type && 
      m.snippet === match.snippet
    )
  );
  
  return unique;
}

/**
 * Get a summary of detected issues
 */
export function getSensitiveDataSummary(matches: SensitiveMatch[]): string {
  if (matches.length === 0) return '';
  
  const types = [...new Set(matches.map(m => m.type))];
  return `Found ${matches.length} potential sensitive item${matches.length > 1 ? 's' : ''}: ${types.join(', ')}`;
}


