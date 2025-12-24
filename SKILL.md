# Venice API Development Skill

A comprehensive guide for building applications with the Venice API, complete with technical specifications, design patterns, and brand guidelines.

---

## Overview

This skill enables you to build AI-powered applications using Venice's uncensored API with private inference. Venice implements the OpenAI API specification while offering unique features like web search, custom characters, and reasoning models.

**Base URL**: `https://api.venice.ai/api/v1`

**API Key Location**: API keys are managed at https://venice.ai/settings/api

---

## Core API Endpoints

### 1. Chat Completions
**Endpoint**: `POST /chat/completions`

The primary endpoint for conversational AI interactions.

**Basic Request Structure**:
```javascript
const response = await fetch('https://api.venice.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'venice-uncensored',
    messages: [
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Hello!' }
    ],
    temperature: 0.7,
    max_tokens: 2000,
    stream: false
  })
});

const data = await response.json();
```

**Streaming Response**:
```javascript
const response = await fetch('https://api.venice.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'llama-3.3-70b',
    messages: [{ role: 'user', content: 'Tell me a story' }],
    stream: true
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));
  
  for (const line of lines) {
    const data = line.replace('data: ', '');
    if (data === '[DONE]') continue;
    
    try {
      const parsed = JSON.parse(data);
      const content = parsed.choices[0]?.delta?.content || '';
      console.log(content); // Stream content to UI
    } catch (e) {
      console.error('Parse error:', e);
    }
  }
}
```

### 2. Image Generation
**Endpoint**: `POST /images/generations`

Generate images from text descriptions.

```javascript
const response = await fetch('https://api.venice.ai/api/v1/images/generations', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'A futuristic city with holographic displays',
    model: 'fluently-xl',
    n: 1,
    size: '1024x1024',
    response_format: 'url'
  })
});

const data = await response.json();
const imageUrl = data.data[0].url;
```

### 3. Audio Generation
**Endpoint**: `POST /audio/speech`

Generate speech from text using text-to-speech.

```javascript
const response = await fetch('https://api.venice.ai/api/v1/audio/speech', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'tts-1',
    input: 'Welcome to Venice AI',
    voice: 'alloy',
    response_format: 'mp3',
    speed: 1.0
  })
});

const audioBlob = await response.blob();
```

### 4. Video Generation
**Endpoint**: `POST /video/generations`

Generate videos from text prompts.

```javascript
const response = await fetch('https://api.venice.ai/api/v1/video/generations', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    prompt: 'A serene ocean sunset with waves',
    model: 'kling-1.6',
    duration: 5
  })
});

const data = await response.json();
```

### 5. Embeddings
**Endpoint**: `POST /embeddings`

Generate vector embeddings for text.

```javascript
const response = await fetch('https://api.venice.ai/api/v1/embeddings', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'text-embedding-3-small',
    input: 'The quick brown fox jumps over the lazy dog',
    encoding_format: 'float'
  })
});

const data = await response.json();
const embedding = data.data[0].embedding;
```

### 6. Models List
**Endpoint**: `GET /models`

Retrieve available models.

```javascript
const response = await fetch('https://api.venice.ai/api/v1/models', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});

const models = await response.json();
```

---

## Venice-Specific Features

### Venice Parameters Object

The `venice_parameters` object provides access to Venice-exclusive features:

```javascript
{
  model: 'llama-3.3-70b',
  messages: [...],
  venice_parameters: {
    // Character integration
    character_slug: 'public-character-id',
    
    // Reasoning model controls
    strip_thinking_response: false,
    disable_thinking: false,
    
    // Web capabilities
    enable_web_search: 'auto', // 'off' | 'on' | 'auto'
    enable_web_scraping: true,
    enable_web_citations: true,
    include_search_results_in_stream: false,
    return_search_results_as_documents: false,
    
    // System prompt control
    include_venice_system_prompt: true
  }
}
```

### System Prompts

**Default Behavior**: Venice appends your system prompts to optimized defaults for uncensored responses.

**Custom Only**: Disable Venice defaults to use only your system prompts:

```javascript
{
  messages: [
    { role: 'system', content: 'Your custom system prompt only' },
    { role: 'user', content: 'Hello' }
  ],
  venice_parameters: {
    include_venice_system_prompt: false
  }
}
```

### Model Feature Suffixes

Alternative to `venice_parameters` - append features to model name:

```javascript
{
  model: 'llama-3.3-70b:enable_web_search=auto',
  messages: [...]
}
```

### Web Search Integration

Enable web search for current information:

```javascript
{
  model: 'llama-3.3-70b',
  messages: [{ role: 'user', content: 'What are the latest AI developments?' }],
  venice_parameters: {
    enable_web_search: 'on',
    enable_web_citations: true
  }
}
```

---

## Response Headers Reference

Venice returns comprehensive metadata in response headers. **Always log `CF-RAY` header for support requests.**

### Critical Headers to Monitor

```javascript
const response = await fetch(...);

// Request tracking
const requestId = response.headers.get('CF-RAY');

// Rate limiting
const remainingRequests = response.headers.get('x-ratelimit-remaining-requests');
const remainingTokens = response.headers.get('x-ratelimit-remaining-tokens');
const resetTime = response.headers.get('x-ratelimit-reset-requests');

// Account balance
const usdBalance = response.headers.get('x-venice-balance-usd');
const diemBalance = response.headers.get('x-venice-balance-diem');
const vcuBalance = response.headers.get('x-venice-balance-vcu');

// Model information
const modelId = response.headers.get('x-venice-model-id');
const modelName = response.headers.get('x-venice-model-name');

// Deprecation warnings
const deprecationWarning = response.headers.get('x-venice-model-deprecation-warning');
const deprecationDate = response.headers.get('x-venice-model-deprecation-date');

if (deprecationWarning) {
  console.warn(`⚠️ Model Deprecation: ${deprecationWarning} (${deprecationDate})`);
}
```

### Complete Header Reference

| Header | Purpose | When Returned |
|--------|---------|---------------|
| **Request Tracking** |
| `CF-RAY` | Unique request ID for support | Always |
| `x-venice-version` | API version (e.g., `20250828.222653`) | Always |
| `x-venice-timestamp` | Server timestamp (ISO 8601) | When enabled |
| **Rate Limiting** |
| `x-ratelimit-limit-requests` | Max requests in window | All requests |
| `x-ratelimit-remaining-requests` | Requests remaining | All requests |
| `x-ratelimit-reset-requests` | Reset timestamp (Unix) | All requests |
| `x-ratelimit-limit-tokens` | Max tokens in window | All requests |
| `x-ratelimit-remaining-tokens` | Tokens remaining | All requests |
| `x-ratelimit-reset-tokens` | Reset duration (seconds) | All requests |
| **Model Info** |
| `x-venice-model-id` | Model identifier | Inference requests |
| `x-venice-model-name` | Model display name | Inference requests |
| `x-venice-model-deprecation-warning` | Deprecation notice | Deprecated models |
| `x-venice-model-deprecation-date` | Deprecation date | Deprecated models |
| **Balance** |
| `x-venice-balance-usd` | USD credit balance | All requests |
| `x-venice-balance-diem` | DIEM token balance | All requests |
| `x-venice-balance-vcu` | Venice Compute Units | All requests |

---

## Common Models

### Text Generation Models

| Model ID | Description | Context | Use Case |
|----------|-------------|---------|----------|
| `venice-uncensored` | Venice's uncensored flagship | 8K | General purpose |
| `llama-3.3-70b` | Meta's Llama 3.3 70B | 128K | Long context tasks |
| `llama-3.1-405b` | Meta's largest Llama model | 128K | Complex reasoning |
| `deepseek-v3` | DeepSeek's latest | 128K | Technical tasks |
| `qwen-2.5-coder-32b` | Specialized coding model | 32K | Code generation |

### Reasoning Models

| Model ID | Description | Features |
|----------|-------------|----------|
| `deepseek-r1` | DeepSeek R1 reasoning | Chain-of-thought |
| `o1-preview` | OpenAI O1 preview | Advanced reasoning |

**Using Reasoning Models**:
```javascript
{
  model: 'deepseek-r1',
  messages: [{ role: 'user', content: 'Solve this complex problem...' }],
  venice_parameters: {
    strip_thinking_response: false // Keep thinking visible
  }
}
```

### Image Models

| Model ID | Description | Strengths |
|----------|-------------|-----------|
| `fluently-xl` | High-quality images | Photorealism |
| `flux-1.1-pro` | Fast generation | Speed + quality |
| `stable-diffusion-3.5` | SD 3.5 | Artistic control |

### Multimodal Models

| Model ID | Description | Capabilities |
|----------|-------------|--------------|
| `gpt-4o` | GPT-4 with vision | Text + images |
| `claude-3.5-sonnet` | Claude Sonnet 3.5 | Text + images |
| `gemini-2.0-flash-exp` | Gemini Flash | Text + images |

---

## Error Handling

### HTTP Status Codes

- `200` - Success
- `400` - Bad request (invalid parameters)
- `401` - Unauthorized (invalid API key)
- `403` - Forbidden (insufficient permissions)
- `429` - Rate limit exceeded
- `500` - Server error
- `503` - Service unavailable

### Error Response Structure

```javascript
{
  error: {
    message: 'Rate limit exceeded',
    type: 'rate_limit_error',
    code: 'rate_limit_exceeded'
  }
}
```

### Robust Error Handling Pattern

```javascript
async function callVeniceAPI(endpoint, body) {
  const maxRetries = 3;
  let retryCount = 0;
  
  while (retryCount < maxRetries) {
    try {
      const response = await fetch(`https://api.venice.ai/api/v1${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.VENICE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      // Check rate limits
      const remaining = response.headers.get('x-ratelimit-remaining-requests');
      if (remaining && parseInt(remaining) < 10) {
        console.warn(`⚠️ Low rate limit: ${remaining} requests remaining`);
      }
      
      if (!response.ok) {
        const error = await response.json();
        
        // Handle rate limiting with exponential backoff
        if (response.status === 429) {
          const resetTime = response.headers.get('x-ratelimit-reset-requests');
          const waitTime = Math.min(Math.pow(2, retryCount) * 1000, 60000);
          console.log(`Rate limited. Waiting ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          retryCount++;
          continue;
        }
        
        // Handle authentication errors
        if (response.status === 401) {
          throw new Error('Invalid API key. Check your credentials.');
        }
        
        // Handle other errors
        throw new Error(`API Error (${response.status}): ${error.error.message}`);
      }
      
      return await response.json();
      
    } catch (error) {
      if (retryCount === maxRetries - 1) throw error;
      retryCount++;
      await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
    }
  }
}
```

---

## Best Practices

### 1. API Key Security
```javascript
// ✅ Good - Use environment variables
const apiKey = process.env.VENICE_API_KEY;

// ❌ Bad - Never hardcode API keys
const apiKey = 'sk-abc123...';
```

### 2. Rate Limit Management
```javascript
class VeniceAPIClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.requestQueue = [];
    this.processing = false;
  }
  
  async queueRequest(endpoint, body) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ endpoint, body, resolve, reject });
      this.processQueue();
    });
  }
  
  async processQueue() {
    if (this.processing || this.requestQueue.length === 0) return;
    
    this.processing = true;
    const { endpoint, body, resolve, reject } = this.requestQueue.shift();
    
    try {
      const result = await this.makeRequest(endpoint, body);
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.processing = false;
      setTimeout(() => this.processQueue(), 100); // Rate limit buffer
    }
  }
  
  async makeRequest(endpoint, body) {
    // Implementation here
  }
}
```

### 3. Streaming Best Practices
```javascript
async function streamChatCompletion(messages, onChunk, onComplete) {
  const response = await fetch('https://api.venice.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.VENICE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b',
      messages,
      stream: true
    })
  });
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (!line.trim() || !line.startsWith('data: ')) continue;
        
        const data = line.slice(6); // Remove 'data: ' prefix
        if (data === '[DONE]') {
          onComplete();
          return;
        }
        
        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices[0]?.delta?.content;
          if (content) onChunk(content);
        } catch (e) {
          console.error('Parse error:', e);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// Usage
await streamChatCompletion(
  [{ role: 'user', content: 'Tell me a story' }],
  (chunk) => process.stdout.write(chunk),
  () => console.log('\n\nStream complete!')
);
```

### 4. Balance Monitoring
```javascript
async function checkBalance() {
  const response = await fetch('https://api.venice.ai/api/v1/models', {
    headers: { 'Authorization': `Bearer ${process.env.VENICE_API_KEY}` }
  });
  
  const usd = parseFloat(response.headers.get('x-venice-balance-usd') || '0');
  const diem = parseFloat(response.headers.get('x-venice-balance-diem') || '0');
  
  if (usd < 1.0 && diem < 100) {
    console.warn('⚠️ Low balance! Please add credits.');
  }
  
  return { usd, diem };
}
```

### 5. Model Selection Strategy
```javascript
function selectModel(task) {
  const models = {
    quick: 'llama-3.3-70b',
    reasoning: 'deepseek-r1',
    creative: 'venice-uncensored',
    coding: 'qwen-2.5-coder-32b',
    long_context: 'llama-3.1-405b'
  };
  
  return models[task] || 'venice-uncensored';
}
```

---

## Brand Guidelines: 2050 Futuristic Design System

### Typography

**Primary Font**: Montserrat
- **Headings**: Montserrat Bold (700) - 2.5rem to 4rem
- **Subheadings**: Montserrat SemiBold (600) - 1.5rem to 2rem
- **Body**: Montserrat Regular (400) - 1rem
- **Captions**: Montserrat Light (300) - 0.875rem

**Font Loading**:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700;900&display=swap" rel="stylesheet">
```

```css
:root {
  --font-primary: 'Montserrat', system-ui, -apple-system, sans-serif;
  --font-weight-light: 300;
  --font-weight-regular: 400;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
  --font-weight-black: 900;
}

body {
  font-family: var(--font-primary);
  font-weight: var(--font-weight-regular);
  letter-spacing: -0.01em;
}
```

### Color System - 2050 Palette

**Primary Colors**:
```css
:root {
  /* Neural Blue - Primary */
  --neural-900: #0A0E1A;
  --neural-800: #131B2E;
  --neural-700: #1C2942;
  --neural-600: #253756;
  --neural-500: #2E456A;
  --neural-400: #4A6394;
  --neural-300: #6681BE;
  --neural-200: #A8BADC;
  --neural-100: #D4DEF0;
  --neural-50: #EBF0F9;
  
  /* Quantum Cyan - Accent */
  --quantum-900: #003D4D;
  --quantum-800: #005266;
  --quantum-700: #006780;
  --quantum-600: #007C99;
  --quantum-500: #0091B3;
  --quantum-400: #00C6F5;
  --quantum-300: #33D4F7;
  --quantum-200: #66E1F9;
  --quantum-100: #99EEFB;
  --quantum-50: #CCF6FD;
  
  /* Photon Purple - Highlight */
  --photon-900: #2D1B4E;
  --photon-800: #3D2566;
  --photon-700: #4D2F7E;
  --photon-600: #5D3996;
  --photon-500: #6D43AE;
  --photon-400: #8B5FD4;
  --photon-300: #A985E1;
  --photon-200: #C7AAED;
  --photon-100: #E5D0F9;
  --photon-50: #F2E7FC;
  
  /* Holographic Gradient */
  --holo-gradient: linear-gradient(135deg, 
    var(--quantum-400) 0%, 
    var(--photon-400) 50%, 
    var(--quantum-300) 100%);
  
  /* Glass Morphism */
  --glass-bg: rgba(10, 14, 26, 0.4);
  --glass-border: rgba(255, 255, 255, 0.1);
  --glass-backdrop: blur(20px);
}
```

**Semantic Colors**:
```css
:root {
  --success: #00E5A0;
  --warning: #FFB800;
  --error: #FF3366;
  --info: var(--quantum-400);
  
  --bg-primary: var(--neural-900);
  --bg-secondary: var(--neural-800);
  --bg-tertiary: var(--neural-700);
  
  --text-primary: #FFFFFF;
  --text-secondary: var(--neural-100);
  --text-tertiary: var(--neural-200);
  --text-muted: var(--neural-300);
}
```

### Spacing System

```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.5rem;    /* 24px */
  --space-6: 2rem;      /* 32px */
  --space-7: 3rem;      /* 48px */
  --space-8: 4rem;      /* 64px */
  --space-9: 6rem;      /* 96px */
  --space-10: 8rem;     /* 128px */
}
```

### Border Radius

```css
:root {
  --radius-sm: 0.375rem;   /* 6px */
  --radius-md: 0.75rem;    /* 12px */
  --radius-lg: 1rem;       /* 16px */
  --radius-xl: 1.5rem;     /* 24px */
  --radius-2xl: 2rem;      /* 32px */
  --radius-full: 9999px;
}
```

### Shadows & Effects

```css
:root {
  /* Elevation */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.5);
  --shadow-xl: 0 16px 64px rgba(0, 0, 0, 0.6);
  
  /* Glow effects */
  --glow-cyan: 0 0 20px rgba(0, 198, 245, 0.5);
  --glow-purple: 0 0 20px rgba(109, 67, 174, 0.5);
  --glow-neural: 0 0 20px rgba(102, 129, 190, 0.3);
  
  /* Holographic shimmer */
  --shimmer: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.1) 50%,
    transparent 100%
  );
}
```

### Component Styles

#### Glass Morphism Card
```css
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-backdrop);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-lg);
  position: relative;
  overflow: hidden;
}

.glass-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: var(--shimmer);
  animation: shimmer 3s infinite;
}

@keyframes shimmer {
  to { left: 100%; }
}
```

#### Holographic Button
```css
.holo-button {
  font-family: var(--font-primary);
  font-weight: var(--font-weight-semibold);
  padding: var(--space-4) var(--space-6);
  border-radius: var(--radius-full);
  border: none;
  background: var(--holo-gradient);
  color: white;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--glow-cyan);
}

.holo-button::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.holo-button:hover::before {
  width: 300px;
  height: 300px;
}

.holo-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--glow-cyan), var(--shadow-xl);
}
```

#### Neural Input Field
```css
.neural-input {
  font-family: var(--font-primary);
  font-weight: var(--font-weight-regular);
  padding: var(--space-4);
  background: var(--neural-800);
  border: 1px solid var(--neural-600);
  border-radius: var(--radius-lg);
  color: var(--text-primary);
  transition: all 0.3s ease;
  outline: none;
}

.neural-input:focus {
  border-color: var(--quantum-400);
  box-shadow: 0 0 0 3px rgba(0, 198, 245, 0.1), var(--glow-cyan);
  background: var(--neural-700);
}

.neural-input::placeholder {
  color: var(--text-muted);
}
```

#### Quantum Badge
```css
.quantum-badge {
  font-family: var(--font-primary);
  font-weight: var(--font-weight-semibold);
  font-size: 0.75rem;
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--quantum-900);
  border: 1px solid var(--quantum-500);
  border-radius: var(--radius-full);
  color: var(--quantum-100);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.quantum-badge::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--quantum-400);
  box-shadow: var(--glow-cyan);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### Layout Patterns

#### Responsive Grid System
```css
.grid-2050 {
  display: grid;
  gap: var(--space-6);
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

.grid-2050-hero {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-8);
  align-items: center;
}

@media (max-width: 768px) {
  .grid-2050-hero {
    grid-template-columns: 1fr;
  }
}
```

#### Flex Patterns
```css
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.flex-column {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
```

### Complete App Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Venice AI - 2050 Interface</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;700;900&display=swap" rel="stylesheet">
  
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    :root {
      /* Colors */
      --neural-900: #0A0E1A;
      --neural-800: #131B2E;
      --neural-700: #1C2942;
      --neural-600: #253756;
      --neural-400: #4A6394;
      --neural-200: #A8BADC;
      --neural-100: #D4DEF0;
      
      --quantum-400: #00C6F5;
      --quantum-500: #0091B3;
      --quantum-900: #003D4D;
      
      --photon-400: #8B5FD4;
      
      --text-primary: #FFFFFF;
      --text-secondary: #D4DEF0;
      --text-muted: #6681BE;
      
      /* Typography */
      --font-primary: 'Montserrat', sans-serif;
      
      /* Spacing */
      --space-4: 1rem;
      --space-5: 1.5rem;
      --space-6: 2rem;
      --space-8: 4rem;
      
      /* Effects */
      --glass-bg: rgba(10, 14, 26, 0.4);
      --glass-border: rgba(255, 255, 255, 0.1);
      --shadow-xl: 0 16px 64px rgba(0, 0, 0, 0.6);
      --glow-cyan: 0 0 20px rgba(0, 198, 245, 0.5);
      --radius-xl: 1.5rem;
      --radius-full: 9999px;
    }
    
    body {
      font-family: var(--font-primary);
      background: linear-gradient(135deg, var(--neural-900) 0%, var(--neural-800) 100%);
      color: var(--text-primary);
      min-height: 100vh;
      overflow-x: hidden;
    }
    
    /* Background Animation */
    body::before {
      content: '';
      position: fixed;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: 
        radial-gradient(circle at 20% 50%, rgba(0, 198, 245, 0.1) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(139, 95, 212, 0.1) 0%, transparent 50%);
      animation: drift 20s infinite alternate;
      pointer-events: none;
    }
    
    @keyframes drift {
      to {
        transform: translate(10%, 10%) rotate(10deg);
      }
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: var(--space-6);
    }
    
    header {
      padding: var(--space-5) 0;
      border-bottom: 1px solid var(--glass-border);
      backdrop-filter: blur(20px);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    .logo {
      font-size: 1.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, var(--quantum-400), var(--photon-400));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .glass-card {
      background: var(--glass-bg);
      backdrop-filter: blur(20px);
      border: 1px solid var(--glass-border);
      border-radius: var(--radius-xl);
      padding: var(--space-6);
      box-shadow: var(--shadow-xl);
      margin: var(--space-6) 0;
      position: relative;
      overflow: hidden;
    }
    
    .glass-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%);
      animation: shimmer 3s infinite;
    }
    
    @keyframes shimmer {
      to { left: 100%; }
    }
    
    h1 {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: var(--space-4);
      line-height: 1.2;
    }
    
    .gradient-text {
      background: linear-gradient(135deg, var(--quantum-400), var(--photon-400));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .input-group {
      display: flex;
      gap: var(--space-4);
      margin: var(--space-5) 0;
    }
    
    .neural-input {
      flex: 1;
      font-family: var(--font-primary);
      font-size: 1rem;
      padding: var(--space-4);
      background: var(--neural-800);
      border: 1px solid var(--neural-600);
      border-radius: var(--radius-xl);
      color: var(--text-primary);
      transition: all 0.3s ease;
      outline: none;
    }
    
    .neural-input:focus {
      border-color: var(--quantum-400);
      box-shadow: 0 0 0 3px rgba(0, 198, 245, 0.1), var(--glow-cyan);
      background: var(--neural-700);
    }
    
    .holo-button {
      font-family: var(--font-primary);
      font-weight: 600;
      font-size: 1rem;
      padding: var(--space-4) var(--space-6);
      border-radius: var(--radius-full);
      border: none;
      background: linear-gradient(135deg, var(--quantum-400), var(--photon-400));
      color: white;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: var(--glow-cyan);
    }
    
    .holo-button:hover {
      transform: translateY(-2px);
      box-shadow: var(--glow-cyan), var(--shadow-xl);
    }
    
    .response-area {
      margin-top: var(--space-5);
      padding: var(--space-5);
      background: var(--neural-800);
      border-radius: var(--radius-xl);
      border: 1px solid var(--neural-600);
      min-height: 200px;
      font-size: 1rem;
      line-height: 1.6;
      color: var(--text-secondary);
    }
    
    .status-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-4);
      background: var(--neural-800);
      border-radius: var(--radius-xl);
      margin-top: var(--space-5);
    }
    
    .quantum-badge {
      font-size: 0.75rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--quantum-900);
      border: 1px solid var(--quantum-500);
      border-radius: var(--radius-full);
      color: var(--quantum-400);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .quantum-badge::before {
      content: '';
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--quantum-400);
      box-shadow: var(--glow-cyan);
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <div class="logo">VENICE AI</div>
    </div>
  </header>
  
  <main class="container">
    <div class="glass-card">
      <h1>
        The Future of <span class="gradient-text">AI Interaction</span>
      </h1>
      <p style="color: var(--text-secondary); font-size: 1.125rem; margin-bottom: var(--space-5);">
        Experience uncensored AI with private inference, powered by Venice API
      </p>
      
      <div class="input-group">
        <input 
          type="text" 
          class="neural-input" 
          id="promptInput"
          placeholder="Enter your prompt..."
        >
        <button class="holo-button" onclick="generateResponse()">
          Generate
        </button>
      </div>
      
      <div id="response" class="response-area">
        Your AI response will appear here...
      </div>
      
      <div class="status-bar">
        <span class="quantum-badge" id="status">Ready</span>
        <span style="color: var(--text-muted); font-size: 0.875rem;">
          Model: <span id="model">venice-uncensored</span>
        </span>
      </div>
    </div>
  </main>
  
  <script>
    const VENICE_API_KEY = 'YOUR_API_KEY'; // Replace with your key
    
    async function generateResponse() {
      const prompt = document.getElementById('promptInput').value;
      const responseDiv = document.getElementById('response');
      const statusBadge = document.getElementById('status');
      
      if (!prompt.trim()) return;
      
      statusBadge.textContent = 'Generating...';
      responseDiv.textContent = '';
      
      try {
        const response = await fetch('https://api.venice.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${VENICE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'venice-uncensored',
            messages: [{ role: 'user', content: prompt }],
            stream: true
          })
        });
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));
          
          for (const line of lines) {
            const data = line.replace('data: ', '');
            if (data === '[DONE]') {
              statusBadge.textContent = 'Complete';
              continue;
            }
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              responseDiv.textContent += content;
            } catch (e) {
              console.error('Parse error:', e);
            }
          }
        }
      } catch (error) {
        responseDiv.textContent = `Error: ${error.message}`;
        statusBadge.textContent = 'Error';
      }
    }
    
    // Allow Enter key to submit
    document.getElementById('promptInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') generateResponse();
    });
  </script>
</body>
</html>
```

---

## React Component Library

### VeniceChat Component

```jsx
import { useState, useEffect, useRef } from 'react';

export function VeniceChat({ apiKey, model = 'venice-uncensored' }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;
    
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsStreaming(true);
    
    const assistantMessage = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMessage]);
    
    try {
      const response = await fetch('https://api.venice.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [...messages, userMessage],
          stream: true
        })
      });
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));
        
        for (const line of lines) {
          const data = line.replace('data: ', '');
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content || '';
            
            setMessages(prev => {
              const updated = [...prev];
              updated[updated.length - 1].content += content;
              return updated;
            });
          } catch (e) {
            console.error('Parse error:', e);
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1].content = `Error: ${error.message}`;
        return updated;
      });
    } finally {
      setIsStreaming(false);
    }
  };
  
  return (
    <div className="venice-chat">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message message-${msg.role}`}>
            {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message..."
          disabled={isStreaming}
          className="neural-input"
        />
        <button
          onClick={sendMessage}
          disabled={isStreaming}
          className="holo-button"
        >
          {isStreaming ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
```

### VeniceImage Component

```jsx
import { useState } from 'react';

export function VeniceImage({ apiKey }) {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  
  const generateImage = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('https://api.venice.ai/api/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          model: 'fluently-xl',
          size: '1024x1024',
          n: 1
        })
      });
      
      const data = await response.json();
      setImageUrl(data.data[0].url);
    } catch (error) {
      console.error('Image generation error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="venice-image">
      <div className="input-group">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && generateImage()}
          placeholder="Describe the image you want to create..."
          className="neural-input"
        />
        <button onClick={generateImage} disabled={loading} className="holo-button">
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>
      
      {imageUrl && (
        <div className="image-result">
          <img src={imageUrl} alt={prompt} style={{ maxWidth: '100%', borderRadius: 'var(--radius-xl)' }} />
        </div>
      )}
    </div>
  );
}
```

---

## Advanced Patterns

### Conversation Management

```javascript
class VeniceConversation {
  constructor(apiKey, model = 'venice-uncensored') {
    this.apiKey = apiKey;
    this.model = model;
    this.messages = [];
    this.maxHistory = 20; // Prevent context overflow
  }
  
  addMessage(role, content) {
    this.messages.push({ role, content });
    
    // Trim old messages if needed
    if (this.messages.length > this.maxHistory) {
      this.messages = this.messages.slice(-this.maxHistory);
    }
  }
  
  async send(userMessage, options = {}) {
    this.addMessage('user', userMessage);
    
    const response = await fetch('https://api.venice.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages: this.messages,
        ...options
      })
    });
    
    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;
    this.addMessage('assistant', assistantMessage);
    
    return assistantMessage;
  }
  
  clear() {
    this.messages = [];
  }
  
  getHistory() {
    return [...this.messages];
  }
}

// Usage
const chat = new VeniceConversation('your-api-key');
const response1 = await chat.send('What is quantum computing?');
const response2 = await chat.send('Can you explain that more simply?');
```

### Multi-Model Orchestration

```javascript
class VeniceOrchestrator {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }
  
  async analyzeWithMultipleModels(prompt) {
    const models = [
      'venice-uncensored',
      'llama-3.3-70b',
      'deepseek-v3'
    ];
    
    const results = await Promise.all(
      models.map(model => this.getResponse(prompt, model))
    );
    
    return results.map((response, i) => ({
      model: models[i],
      response
    }));
  }
  
  async getResponse(prompt, model) {
    const response = await fetch('https://api.venice.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500
      })
    });
    
    const data = await response.json();
    return data.choices[0].message.content;
  }
}
```

---

## Troubleshooting

### Common Issues

**Issue**: `401 Unauthorized`
- **Solution**: Verify API key is correct and has not expired
- Check that the key is properly set in environment variables

**Issue**: `429 Rate Limit Exceeded`
- **Solution**: Implement exponential backoff
- Monitor `x-ratelimit-remaining-requests` header
- Consider upgrading plan for higher limits

**Issue**: Streaming not working
- **Solution**: Ensure `stream: true` is set in request
- Verify SSE parsing logic handles `data: [DONE]` correctly
- Check that response body reader is properly configured

**Issue**: Low balance warnings
- **Solution**: Monitor `x-venice-balance-usd` header
- Set up alerts when balance drops below threshold
- Add credits at https://venice.ai/settings/billing

**Issue**: Model not found
- **Solution**: Verify model name matches available models
- Check deprecation headers for sunset models
- Use `GET /models` to list current models

---

## Resources

- **API Documentation**: https://docs.venice.ai
- **Status Page**: https://veniceai-status.com
- **Changelog**: https://featurebase.venice.ai/changelog
- **Swagger Spec**: https://api.venice.ai/doc/api/swagger.yaml
- **GitHub Docs**: https://github.com/veniceai/api-docs

---

## Quick Reference Card

### Authentication
```javascript
headers: { 'Authorization': 'Bearer YOUR_API_KEY' }
```

### Models
- **General**: `venice-uncensored`, `llama-3.3-70b`
- **Reasoning**: `deepseek-r1`, `o1-preview`
- **Images**: `fluently-xl`, `flux-1.1-pro`
- **Coding**: `qwen-2.5-coder-32b`

### Key Parameters
```javascript
{
  model: 'model-name',
  messages: [...],
  temperature: 0.7,
  max_tokens: 2000,
  stream: false,
  venice_parameters: {
    enable_web_search: 'auto',
    character_slug: 'character-id',
    include_venice_system_prompt: true
  }
}
```

### Response Headers to Monitor
- `CF-RAY` - Request ID
- `x-ratelimit-remaining-requests` - Requests left
- `x-venice-balance-usd` - Account balance
- `x-venice-model-deprecation-warning` - Deprecation notice

---

**Last Updated**: December 2024
**Skill Version**: 1.0.0
