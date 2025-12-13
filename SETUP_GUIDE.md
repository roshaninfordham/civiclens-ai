# CivicLens AI - Setup & Deployment Guide

## ⚡ Critical Setup Step

**Before running the app, you MUST update the Gradient AI endpoint URL:**

1. Open `.env.local` in the `civiclens-ai` folder
2. Find this line:
   ```
   GRADIENT_AI_AGENT_ENDPOINT=https://your-gradient-endpoint.digitalocean.com
   ```
3. Replace with your actual DigitalOcean Gradient AI endpoint URL

All other API keys are already configured!

## 🚀 Running the App

```bash
cd "c:\Users\User\Documents\CivicLens AI\civiclens-ai"
npm run dev
```

Open http://localhost:3000

## 📋 What's Already Built

### ✅ Frontend (Mobile-First UI)
- **Chat interface** with message input/display
- **Location permission** flow (browser geolocation)
- **Structured response cards:**
  - Safety Verdict (green/orange with risk factors)
  - Conditions Snapshot (weather, temperature, rain, wind)
  - Route & Timing Advice (recommended mode, safety notes)
  - Nearby Resources (stores to fix missing items)
  - Action Checklist (prioritized tasks)
  - Context Summary (transparency about data sources)

### ✅ Backend (API Orchestration)
- **`/api/chat` endpoint** that:
  1. Receives user message + location
  2. Gathers real-time civic data in parallel:
     - NYC 311 service requests (800m radius)
     - Motor vehicle collisions (recent)
     - Housing code violations (area condition)
     - NOAA weather (current + forecast)
     - FEMA disaster declarations
     - FEMA IPAWS emergency alerts
  3. Calls your DigitalOcean Gradient AI agent with enriched context
  4. Returns structured JSON response
  5. Falls back to rule-based logic if agent unavailable

### ✅ Civic Data Integration
All functions in `src/lib/civicData.ts`:
- `fetch311Data()` - NYC 311 service requests near location
- `fetchCollisionData()` - Recent traffic accidents
- `fetchHousingViolations()` - Building code violations
- `fetchWeatherData()` - NOAA weather + forecast
- `fetchFEMADisasters()` - Active disaster declarations
- `fetchFEMAAlerts()` - IPAWS emergency alerts
- `geocodeAddress()` - Address → coordinates
- `reverseGeocode()` - Coordinates → address

### ✅ Type Safety
Complete TypeScript types in `src/types/index.ts`:
- User input types (`ChatRequest`, `UserLocation`)
- Agent response types (`AgentResponse`, `SafetyVerdict`, `ConditionsSnapshot`, etc.)
- NYC Open Data types (`NYC311Request`, `NYCCollision`, `HousingViolation`)
- Weather/CDC/FEMA types

### ✅ Environment Setup
- `.env.local` - Your actual API keys (gitignored)
- `.env.example` - Template for others
- All keys pre-configured except Gradient endpoint URL

## 🎯 How It Works (End-to-End)

1. **User types a question:**
   ```
   "I want to attend a hackathon at 3 PM in Brooklyn. I forgot my jacket. Is it safe?"
   ```

2. **Frontend (`ChatInterface.tsx`):**
   - Captures message + user location (if permitted)
   - Sends POST to `/api/chat`

3. **Backend (`/api/chat/route.ts`):**
   - Geocodes destination address (or uses current location)
   - Fetches civic data in parallel:
     - 311 complaints near Brooklyn location
     - Weather forecast for 3 PM
     - Recent collisions in area
     - Any FEMA alerts
   - Builds context summary

4. **Gradient AI Agent:**
   - Receives user message + civic context
   - Reasons across data (weather, 311, collisions)
   - Returns structured JSON:
     ```json
     {
       "safetyVerdict": {
         "isSafe": true,
         "message": "Safe to attend, but prepare for cold",
         "confidence": "high",
         "riskFactors": ["Cold weather"]
       },
       "conditionsSnapshot": {
         "temperature": 42,
         "weather": "Clear",
         "rainProbability": 10
       },
       "whatToDoNow": [
         {
           "priority": "high",
           "action": "Bring a warm jacket",
           "reason": "Temperature will be 42°F"
         },
         {
           "priority": "medium",
           "action": "Check nearest clothing store on route",
           "reason": "You mentioned forgetting your jacket"
         }
       ]
     }
     ```

5. **Frontend renders cards:**
   - Green safety verdict card
   - Blue weather conditions card
   - White action checklist card
   - Collapsible context summary

## 🔧 Customizing the Agent

Your Gradient AI agent should return JSON matching this structure:

```typescript
{
  safetyVerdict: {
    isSafe: boolean;
    message: string;
    confidence: "high" | "medium" | "low";
    riskFactors?: string[];
  };
  conditionsSnapshot?: {
    temperature?: number;
    weather?: string;
    rainProbability?: number;
    windSpeed?: number;
    alerts?: string[];
  };
  routeAdvice?: {
    recommendedMode?: "walk" | "transit" | "bike" | "car";
    departureTime?: string;
    safetyNotes?: string[];
    trafficWarnings?: string[];
  };
  nearbyFixes?: Array<{
    name: string;
    type: string;
    address: string;
    distance?: number;
    estimatedDetour?: number;
  }>;
  whatToDoNow?: Array<{
    priority: "high" | "medium" | "low";
    action: string;
    reason?: string;
  }>;
  clarifyingQuestions?: string[];
}
```

## 📊 Demo Flow

### Demo Script:
1. **Show the welcome screen**
   - Point out the example queries

2. **Click "Enable Location"**
   - Grant browser permission
   - Show location coordinates appear

3. **Type: "I want to attend a hackathon at 3 PM in Brooklyn. I forgot my jacket. Is it safe?"**
   - Hit Send
   - Show loading state ("CivicLens is analyzing civic data...")

4. **Explain what's happening behind the scenes:**
   - "Right now it's calling 5+ APIs in parallel"
   - "NYC 311 to check for complaints"
   - "NOAA for weather forecast"
   - "Motor vehicle collision data"
   - "FEMA for any alerts"

5. **Response appears - walk through each card:**
   - Safety Verdict: "It's safe to go, but..."
   - Conditions: "42°F, clear skies"
   - Action Checklist: "Bring a jacket, check stores"
   - Context Summary: "Show transparency - 15 311 requests, 3 collisions"

6. **Try another query:**
   - "What's the weather like in Times Square?"
   - Show how it adapts to different intents

## 🚨 Important Notes

### API Rate Limits
- **NYC 311/Housing/Collisions**: 1000 requests/day with app token (you're covered)
- **NOAA Weather**: No strict limit, but we cache for 30 min
- **FEMA**: Public, no key needed
- **Census Geocoding**: Generous free tier

### Caching Strategy
All civic data is cached using Next.js `revalidate`:
- 311 data: 5 minutes
- Weather: 30 minutes
- Collisions: 5 minutes
- Housing: 10 minutes
- FEMA: 5 minutes

This reduces API calls and improves performance.

### Fallback Behavior
If the Gradient AI agent is unavailable, the app falls back to basic rule-based logic:
- Check temperature → recommend jacket if < 40°F
- Check rain probability → recommend umbrella if > 50%
- Check FEMA alerts → warn if severe
- Check collision count → note if high traffic area

This ensures the app always provides value even without AI.

## 🎨 Styling & UX

- **Mobile-first**: Entire UI optimized for phones
- **Accessible**: Plain language, no jargon, clear headers
- **Color-coded cards**:
  - Green = safe
  - Orange/Red = caution
  - Blue = informational
  - Purple = navigation
  - Gray = metadata
- **Auto-scroll**: New messages scroll into view
- **Loading states**: Clear feedback during API calls

## 🔐 Security Checklist

- ✅ All secrets in `.env.local` (gitignored)
- ✅ No API keys in client-side code
- ✅ Location permission explicitly requested
- ✅ No user data stored or tracked
- ✅ CORS headers properly configured
- ✅ Input validation on API routes

## 📦 Deployment (Optional)

### Deploy to Vercel:
1. Push code to GitHub
2. Connect Vercel to your repo
3. Add environment variables in Vercel dashboard
4. Deploy

### Deploy to DigitalOcean App Platform:
1. Push code to GitHub
2. Create new App in DigitalOcean
3. Connect to your repo
4. Add environment variables
5. Deploy

## 🐛 Debugging

### Check browser console:
```javascript
// See API request/response
// Network tab → /api/chat
```

### Check server logs:
```bash
# In the terminal running npm run dev
[API] Received chat request: ...
[API] Target location: ...
[API] Gathering civic data...
[API] Context gathered: ...
[API] Calling Gradient AI agent...
```

### Test APIs individually:
```bash
# Test 311 API directly
curl "https://data.cityofnewyork.us/resource/erm2-nwe9.json?\$limit=5" \
  -H "X-App-Token: YOUR_TOKEN"
```

## 📞 Need Help?

Common issues and solutions:

1. **"Location permission denied"**
   - Users can manually type addresses instead
   - Geocoding will still work

2. **"Failed to process request"**
   - Check `.env.local` has all keys
   - Verify Gradient endpoint URL
   - Check browser console for errors

3. **No weather data**
   - NOAA API requires User-Agent header (already configured)
   - Check if location is outside US (NOAA is US-only)

4. **Agent not responding**
   - Fallback logic kicks in automatically
   - Check Gradient dashboard for errors

## 🎉 You're Ready!

The app is fully functional and ready to demo. Just:
1. Update Gradient AI endpoint URL in `.env.local`
2. Run `npm run dev`
3. Open http://localhost:3000
4. Enable location
5. Start asking questions!

---

Built with ❤️ for MLH DigitalOcean Hackathon
