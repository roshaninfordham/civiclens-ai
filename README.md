# CivicLens AI

**Agentic Civic Intelligence & Safety Assistant**

CivicLens AI is an intelligent assistant that helps people make safe, informed, and timely decisions about attending events or navigating cities by combining real-time weather, civic risk data, public safety signals, and nearby resources into actionable guidance.

## 🎯 What It Does

CivicLens AI answers questions like:
- "Is it safe to go out right now?"
- "What risks exist near my destination?"
- "What should I bring or prepare?"
- "If I'm missing something, where can I fix it quickly?"

By analyzing real-time data from:
- ✅ NYC 311 Service Requests
- 🚗 Motor Vehicle Collisions
- 🏘️ Housing Code Violations
- 🌦️ NOAA Weather
- 🚨 FEMA Disaster Alerts & IPAWS
- 🏥 CDC Air Quality & Social Vulnerability

## 🏗️ Architecture

```
┌─────────────────┐
│  Next.js UI     │  Mobile-first chat interface
│  (React/TS)     │  Location permission
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  /api/chat      │  Orchestrates real-time data gathering
│  (Next.js API)  │  Calls civic APIs in parallel
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Gradient AI    │  Your DigitalOcean agent
│  Agent          │  Reasons over civic data
│  (DO Gradient)  │  Returns structured safety guidance
└─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- DigitalOcean Gradient AI agent endpoint (already configured)
- API keys for NYC Open Data, NOAA (included in `.env.local`)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   
   The `.env.local` file should store your API keys. **Important:** Update the Gradient AI endpoint and provide your own secrets:
   
   ```bash
   # Open .env.local and update these lines:
   GRADIENT_AI_AGENT_KEY=your-gradient-ai-key
   GRADIENT_AI_AGENT_ENDPOINT=https://your-actual-gradient-endpoint.digitalocean.com
   ```
   
   Replace any placeholder values in `.env.local` with your own secrets (Gradient AI key, NYC Open Data token, NOAA user agent, Census API key, etc.).

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   ```
   http://localhost:3000
   ```

## 📱 Usage

1. **Enable Location** (recommended): Click the "Enable Location" button to allow CivicLens to analyze your current area
2. **Ask a Question**: Type a natural language request like:
   - "I want to attend a hackathon at 3 PM in Brooklyn. I forgot my jacket. Is it safe?"
   - "What are the conditions like near Times Square right now?"
3. **Get Structured Guidance**: CivicLens will analyze real-time data and provide:
   - ✅ Safety verdict
   - 🌦️ Weather conditions
   - 🧭 Route and timing advice
   - 🛍️ Nearby resources (stores to fix missing items)
   - ✅ Action checklist

## 🔌 API Integration

### Your DigitalOcean Gradient AI Agent

The agent endpoint is configured in `.env.local`:
```
GRADIENT_AI_AGENT_KEY=your-gradient-ai-key
GRADIENT_AI_AGENT_ENDPOINT=https://your-gradient-endpoint.digitalocean.com
```

**How it works:**
1. User sends a message
2. Backend gathers real-time civic data (311, weather, collisions, FEMA)
3. Backend calls your Gradient agent with enriched context
4. Agent reasons and returns structured JSON response
5. Frontend renders safety verdict, conditions, advice, etc.

### Civic Data APIs Used

All API utilities are in `src/lib/civicData.ts`:

- **NYC 311**: `fetch311Data()` - Service requests near a location
- **NYC Collisions**: `fetchCollisionData()` - Recent traffic accidents
- **NYC Housing**: `fetchHousingViolations()` - Code violations (area condition signal)
- **NOAA Weather**: `fetchWeatherData()` - Current weather and forecast
- **FEMA Disasters**: `fetchFEMADisasters()` - Disaster declarations
- **FEMA IPAWS**: `fetchFEMAAlerts()` - Emergency alerts
- **Geocoding**: `geocodeAddress()`, `reverseGeocode()` - Address ↔ coordinates

## 📂 Project Structure

```
civiclens-ai/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── chat/
│   │   │       └── route.ts          # Main API endpoint (orchestrates everything)
│   │   ├── layout.tsx                # Root layout with metadata
│   │   ├── page.tsx                  # Home page (renders ChatInterface)
│   │   └── globals.css               # Global styles
│   ├── components/
│   │   └── ChatInterface.tsx         # Chat UI + structured response cards
│   ├── lib/
│   │   └── civicData.ts              # Civic API utilities (311, weather, FEMA, etc.)
│   └── types/
│       └── index.ts                  # TypeScript type definitions
├── .env.local                        # Environment variables (API keys)
├── .env.example                      # Template for environment variables
├── package.json
├── tsconfig.json
└── README.md
```

## 🔑 Key Files Explained

### `/api/chat/route.ts` (Backend Orchestration)

The core API route that:
1. Receives user messages and location
2. Gathers real-time civic context in parallel (311, weather, collisions, FEMA)
3. Calls your Gradient AI agent with enriched context
4. Returns structured response to frontend

**Key functions:**
- `POST()` - Main API handler
- `callGradientAgent()` - Calls DigitalOcean Gradient AI
- `generateFallbackResponse()` - Basic rule-based logic if agent unavailable

### `lib/civicData.ts` (Civic API Utilities)

Helper functions for fetching real-time data:
- `fetch311Data()` - NYC 311 service requests
- `fetchCollisionData()` - Motor vehicle collisions
- `fetchWeatherData()` - NOAA weather forecast
- `fetchFEMAAlerts()` - Emergency alerts
- `geocodeAddress()` - Convert address to coordinates

All functions:
- Handle errors gracefully
- Return typed data
- Use Next.js caching (`revalidate`)
- Include detailed comments

### `components/ChatInterface.tsx` (Frontend UI)

Mobile-first React component with:
- Chat message input/display
- Location permission flow
- Structured response cards:
  - Safety Verdict
  - Conditions Snapshot
  - Route Advice
  - Nearby Fixes
  - Action Checklist
  - Context Summary (transparency)

### `types/index.ts` (Type Definitions)

Comprehensive TypeScript types for:
- User input (`ChatRequest`, `UserLocation`)
- Agent responses (`AgentResponse`, `SafetyVerdict`, etc.)
- NYC Open Data (`NYC311Request`, `NYCCollision`, `HousingViolation`)
- Weather/CDC/FEMA data

## 🎨 UI Components

The chat interface renders structured responses as cards:

1. **Safety Verdict** (Green/Orange)
   - Clear decision: "Yes, it's safe to attend..."
   - Confidence level
   - Risk factors

2. **Conditions Snapshot** (Blue)
   - Temperature, weather, rain probability
   - Wind speed
   - Alerts

3. **Route & Timing** (Purple)
   - Recommended mode (walk/transit/bike/car)
   - Departure time
   - Safety notes
   - Traffic warnings

4. **Nearby Resources** (Green)
   - Stores/services to fix missing items
   - Addresses
   - Estimated detour time

5. **Action Checklist** (White with priority colors)
   - High/Medium/Low priority actions
   - Reasons for each action

6. **Context Summary** (Gray, collapsible)
   - Transparency: shows data sources used
   - 311 count, collision count, etc.

## 🔐 Security & Privacy

- ✅ All API keys stored in `.env.local` (gitignored)
- ✅ Location permission requested explicitly
- ✅ No data stored or tracked
- ✅ Transparent about data sources used
- ✅ No predictive crime models or surveillance

## 🧪 Testing

Example queries to test:
```
"I want to attend the MLH DigitalOcean Hackathon at 3 PM at ZeroSpace, Brooklyn. I forgot my jacket. Is it safe?"

"What are the conditions like near Central Park right now?"

"I'm walking to the Brooklyn Public Library. Should I be concerned about anything?"
```

## 📊 Demo Success Criteria

A successful demo shows:
- ✅ Natural language input
- ✅ Agent asks smart clarifying questions (if needed)
- ✅ Multiple APIs are used (311, weather, collisions, FEMA)
- ✅ Output feels helpful, calm, and intelligent
- ✅ Agent recommends real actions

## 🚨 Troubleshooting

### "Failed to process your request"
- Check that `.env.local` has all API keys
- Verify Gradient AI endpoint URL is correct
- Check console for specific error messages

### No location data
- Ensure HTTPS or localhost (geolocation requires secure context)
- Grant location permissions in browser
- Fallback: manually type an address in your message

### API rate limits
- NYC Open Data: 1000 requests/day (with app token)
- NOAA: No strict limit, but rate-limit friendly (30s cache)
- FEMA: No strict limit
- Census Geocoding: Generous free tier

### Gradient AI agent not responding
- Verify endpoint URL and key in `.env.local`
- The app will fall back to basic local reasoning
- Check Gradient AI dashboard for errors

## 🛠️ Development

### Build for production:
```bash
npm run build
```

### Run production build:
```bash
npm start
```

### Lint code:
```bash
npm run lint
```

## 📝 Environment Variables Reference

```bash
# DigitalOcean Gradient AI
GRADIENT_AI_AGENT_KEY=your_gradient_key
GRADIENT_AI_AGENT_ENDPOINT=https://your-endpoint.digitalocean.com

# NYC Open Data
NYC_OPEN_DATA_APP_TOKEN=your_token
NYC_OPEN_DATA_SECRET=your_secret

# Census Geocoding
CENSUS_API_KEY=your_census_key

# NOAA Weather
NOAA_USER_AGENT=civiclensai
NOAA_EMAIL=your_email
```

## 🌟 Why This Is Agentic

CivicLens AI is truly agentic because it:
- ❌ Does NOT follow a fixed flow
- ✅ Dynamically decides what data to fetch
- ✅ Reasons across heterogeneous civic datasets
- ✅ Produces situational decisions, not static answers
- ✅ Asks clarifying questions only when needed
- ✅ Provides actions, not just insights

## 🤝 Contributing

This is a hackathon project for MLH DigitalOcean Hackathon. Future improvements:
- Add more cities (currently NYC-focused)
- Integrate Google Maps for route visualization
- Add transit API integration (MTA, etc.)
- Support for multiple languages
- Push notifications for severe alerts

## 📄 License

MIT License - Built for MLH DigitalOcean Hackathon

## 👥 Credits

Built with:
- Next.js 14 (React framework)
- TypeScript (type safety)
- Tailwind CSS (styling)
- DigitalOcean Gradient AI (agent reasoning)
- NYC Open Data (civic APIs)
- NOAA (weather)
- FEMA (emergency alerts)
- US Census (geocoding)

---

**CivicLens AI** - Making cities safer, one decision at a time. 🏙️✨

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
