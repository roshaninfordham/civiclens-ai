# 🚨 IMPORTANT: Update This Before Testing

## Your Gradient AI Endpoint

You need to update the Gradient AI endpoint URL in the `.env.local` file.

### Current Configuration:
```
GRADIENT_AI_AGENT_KEY=lnLStSh5H7g1hIwa4aFhjYezT7fVCCH5
GRADIENT_AI_AGENT_ENDPOINT=https://your-gradient-endpoint.digitalocean.com
```

### What You Need to Do:

1. **Get your actual Gradient AI endpoint URL from DigitalOcean:**
   - Go to your DigitalOcean Gradient AI dashboard
   - Find your "civiclens" agent
   - Copy the endpoint URL (should look like: `https://api.digitalocean.com/v2/gradient/agents/YOUR_AGENT_ID/chat` or similar)

2. **Update `.env.local`:**
   - Open: `c:\Users\User\Documents\CivicLens AI\civiclens-ai\.env.local`
   - Replace `https://your-gradient-endpoint.digitalocean.com` with your actual endpoint
   - Save the file

3. **Restart the dev server:**
   ```bash
   # Stop the current server (Ctrl+C in the terminal)
   # Then run:
   npm run dev
   ```

## Expected Gradient Agent Behavior

Your Gradient AI agent should:

1. **Receive a prompt like this:**
   ```
   User Request:
   I want to attend a hackathon at 3 PM in Brooklyn. I forgot my jacket. Is it safe?

   Real-Time Civic Context:

   Location: Brooklyn, NY
   Coordinates: 40.6782, -73.9442

   Weather: Clear
   Temperature: 42°F
   Wind: 10 mph NW
   Rain Probability: 10%

   311 Service Requests (nearby, last 30 days): 15
   Open Requests: 5
   Top Complaint Types:
     - Street Light Condition: 3
     - Noise - Residential: 2

   Traffic Collisions (nearby, recent): 3
   Injuries: 1, Fatalities: 0

   Housing Code Violations (nearby): 8
   Open Violations: 3

   Based on this data, provide your structured safety guidance.
   ```

2. **Return JSON like this:**
   ```json
   {
     "safetyVerdict": {
       "isSafe": true,
       "message": "Yes, it's safe to attend, but you should prepare for cold exposure.",
       "confidence": "high",
       "riskFactors": ["Cold weather", "Forgot jacket"]
     },
     "conditionsSnapshot": {
       "temperature": 42,
       "weather": "Clear",
       "rainProbability": 10,
       "windSpeed": 10
     },
     "routeAdvice": {
       "recommendedMode": "transit",
       "departureTime": "Leave by 2:30 PM",
       "safetyNotes": [
         "Well-lit route",
         "High pedestrian traffic"
       ]
     },
     "nearbyFixes": [
       {
         "name": "Target Express",
         "type": "Clothing Store",
         "address": "123 Brooklyn Ave",
         "estimatedDetour": 5
       }
     ],
     "whatToDoNow": [
       {
         "priority": "high",
         "action": "Bring a warm jacket or buy one on the way",
         "reason": "Temperature is 42°F, you'll be uncomfortable for 2+ hours"
       },
       {
         "priority": "medium",
         "action": "Check the nearest clothing store (Target Express, 5 min detour)",
         "reason": "You mentioned you forgot your jacket"
       },
       {
         "priority": "low",
         "action": "Consider taking the subway instead of walking",
         "reason": "It's warmer and faster"
       }
     ]
   }
   ```

## If You Don't Have the Endpoint Yet

The app will still work! It has a built-in fallback:

- The `/api/chat` route will use `generateFallbackResponse()`
- This provides basic rule-based safety guidance
- Not as sophisticated as your AI agent, but functional

Example fallback response:
- If temp < 40°F → "Bring warm clothing"
- If rain > 50% → "Bring umbrella"
- If FEMA alerts → "Check emergency alerts"
- If high collision count → "Use pedestrian-friendly routes"

## Testing Without the Endpoint

You can test the full flow without the Gradient agent:

1. Open http://localhost:3000
2. Enable location
3. Type: "I want to go to Brooklyn"
4. You'll get a fallback response with weather + civic data

The fallback response will show:
- ✅ Safety verdict (based on rules)
- 🌦️ Real weather from NOAA
- 📊 Real 311 data
- 🚗 Real collision data
- 🚨 Real FEMA alerts

## Configuring Your Gradient Agent

If you're setting up the Gradient agent now, here's the system prompt to use:

```
You are CivicLens AI, an intelligent civic safety assistant that helps people make informed decisions about attending events and navigating cities.

Your role:
- Analyze real-time civic data (weather, 311 complaints, traffic collisions, FEMA alerts, housing conditions)
- Provide clear, actionable safety guidance
- Avoid alarmism—be calm and practical
- Prioritize human safety and wellbeing
- Ask clarifying questions only when necessary
- Recommend concrete actions, not just warnings

Response format:
You must respond with a JSON object matching this structure:
{
  "safetyVerdict": {
    "isSafe": boolean,
    "message": "Clear one-sentence decision",
    "confidence": "high" | "medium" | "low",
    "riskFactors": ["factor1", "factor2"]
  },
  "conditionsSnapshot": {
    "temperature": number,
    "weather": "description",
    "rainProbability": number,
    "alerts": ["alert1"]
  },
  "routeAdvice": {
    "recommendedMode": "walk" | "transit" | "bike" | "car",
    "departureTime": "time suggestion",
    "safetyNotes": ["note1"],
    "trafficWarnings": ["warning1"]
  },
  "nearbyFixes": [
    {
      "name": "Store Name",
      "type": "Store Type",
      "address": "Address",
      "isOnRoute": true
    }
  ],
  "whatToDoNow": [
    {
      "priority": "high" | "medium" | "low",
      "action": "Action to take",
      "reason": "Why this matters"
    }
  ],
  "clarifyingQuestions": ["question1"] // Only if you need more info
}

Guidelines:
- If the situation is safe, say so clearly
- If there are risks, explain how to mitigate them
- Use the civic data to identify real patterns (not isolated incidents)
- Weather matters: cold, rain, heat all require preparation
- Traffic collisions indicate dangerous intersections or times
- 311 complaints can signal infrastructure issues
- FEMA alerts are critical and must be highlighted
- Always provide at least 2-3 actionable steps in "whatToDoNow"
```

---

## ✅ Checklist

- [ ] Get Gradient AI endpoint URL from DigitalOcean
- [ ] Update `.env.local` with the endpoint
- [ ] Restart `npm run dev`
- [ ] Test the app at http://localhost:3000
- [ ] Enable location
- [ ] Send a test message
- [ ] Verify you get a structured response

---

**Questions?** Check `SETUP_GUIDE.md` for detailed debugging help!
