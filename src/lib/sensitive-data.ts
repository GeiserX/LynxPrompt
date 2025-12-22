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
  // API Keys
  { type: "API Key", regex: /(?:api[_-]?key|apikey)\s*[:=]\s*["']?([a-zA-Z0-9_-]{20,})["']?/gi },
  { type: "API Key", regex: /(?:sk|pk)[-_](?:live|test)[-_][a-zA-Z0-9]{20,}/gi },
  
  // Passwords
  { type: "Password", regex: /(?:password|passwd|pwd)\s*[:=]\s*["']([^"']{4,})["']/gi },
  { type: "Password", regex: /(?:password|passwd|pwd)\s*[:=]\s*([^\s,;]{8,})/gi },
  
  // Tokens
  { type: "Token", regex: /(?:access[_-]?token|auth[_-]?token|bearer)\s*[:=]\s*["']?([a-zA-Z0-9_-]{20,})["']?/gi },
  { type: "Token", regex: /(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36,}/gi }, // GitHub tokens
  { type: "Token", regex: /xox[baprs]-[a-zA-Z0-9-]{10,}/gi }, // Slack tokens
  
  // Secrets
  { type: "Secret", regex: /(?:secret|private[_-]?key)\s*[:=]\s*["']?([a-zA-Z0-9_/+=]{20,})["']?/gi },
  { type: "Secret", regex: /(?:client[_-]?secret)\s*[:=]\s*["']?([a-zA-Z0-9_-]{20,})["']?/gi },
  
  // AWS
  { type: "AWS Key", regex: /AKIA[0-9A-Z]{16}/gi },
  { type: "AWS Secret", regex: /(?:aws[_-]?secret)\s*[:=]\s*["']?([a-zA-Z0-9/+=]{40})["']?/gi },
  
  // Database URLs
  { type: "Database URL", regex: /(?:postgres|mysql|mongodb|redis):\/\/[^\s]+:[^\s]+@/gi },
  
  // Private Keys
  { type: "Private Key", regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/gi },
  
  // Environment Variables with values
  { type: "Env Variable", regex: /(?:DB_PASSWORD|DATABASE_PASSWORD|REDIS_PASSWORD|SMTP_PASSWORD)\s*=\s*[^\s]+/gi },
  
  // Webhook URLs with secrets
  { type: "Webhook Secret", regex: /(?:webhook[_-]?secret|whsec_)[a-zA-Z0-9_-]{20,}/gi },
  
  // JWT tokens (base64 pattern)
  { type: "JWT Token", regex: /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/gi },
];

// Common false positives to ignore
const FALSE_POSITIVE_PATTERNS = [
  /\{\{.*\}\}/,  // Template variables like {{API_KEY}}
  /\$\{.*\}/,    // Environment variables like ${API_KEY}
  /process\.env\./,  // Node.js env references
  /import\.meta\.env\./,  // Vite env references
  /<your[_-]?.*>/i,  // Placeholder like <your_api_key>
  /your[_-]?api[_-]?key/i,  // Placeholder text
  /xxx+/i,  // Masked values like xxx or XXXX
  /example/i,  // Example values
  /placeholder/i,
  /\*\*\*+/,  // Masked with asterisks
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
  
  // Remove duplicates based on line and type
  const unique = matches.filter((match, index, self) =>
    index === self.findIndex(m => m.line === match.line && m.type === match.type)
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
