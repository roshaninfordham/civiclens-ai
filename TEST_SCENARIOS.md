# CivicLens AI - Test Scenarios & Demo Script

## 🎬 Demo Script (5 minutes)

### Act 1: Introduction (30 seconds)
```
"CivicLens AI helps people make safe decisions about going out in cities.
Instead of checking multiple apps for weather, traffic, and civic issues,
you just ask CivicLens and it analyzes everything for you."
```

### Act 2: Enable Location (30 seconds)
1. Open http://localhost:3000
2. Click "Enable Location" button
3. Grant browser permission
4. Show location coordinates appear
```
"First, we enable location so CivicLens knows where we are.
This is optional - you can also just type an address."
```

### Act 3: First Query - The Hackathon Scenario (2 minutes)
**Type:**
```
I want to attend the MLH DigitalOcean Hackathon at 3 PM at ZeroSpace in Brooklyn. I forgot my jacket. Is it safe?
```

**While loading, explain:**
```
"Right now, CivicLens is:
- Getting weather from NOAA
- Checking NYC 311 complaints near Brooklyn
- Looking at recent traffic collisions
- Checking FEMA for any emergency alerts
- Sending all this to our DigitalOcean Gradient AI agent
- The agent reasons over this data and provides structured guidance"
```

**When response appears, walk through each card:**
1. **Safety Verdict (Green):**
   ```
   "The agent determined it's safe to go, but identifies cold weather as a risk factor"
   ```

2. **Conditions Snapshot (Blue):**
   ```
   "Real-time weather: 42°F, clear skies, 10% rain chance"
   ```

3. **Action Checklist (White):**
   ```
   "Notice how it doesn't just warn you - it tells you exactly what to do:
   - High priority: Bring a jacket
   - Medium priority: Check stores on your route
   - The agent even suggests which stores and how much detour"
   ```

4. **Context Summary (Gray, expand it):**
   ```
   "For transparency, you can see all the data sources:
   - 15 NYC 311 requests analyzed
   - 3 recent collisions checked
   - Weather from NOAA
   This is civic intelligence - real civic data powering decisions"
   ```

### Act 4: Second Query - Quick Weather Check (1 minute)
**Type:**
```
What's the weather like in Times Square right now?
```

**Show:**
```
"The agent adapts to different intents.
This is a simpler query, so it focuses on weather and current conditions.
Notice it still checks civic data in the background."
```

### Act 5: Third Query - Navigation Safety (1 minute)
**Type:**
```
I'm walking to the Brooklyn Public Library. Should I be concerned about anything?
```

**Show:**
```
"Here the agent:
- Checks the route for safety
- Looks at recent collisions near the library
- Suggests the safest path
- Provides timing advice
This is agentic - it's making decisions based on context, not templates"
```

### Closing (30 seconds)
```
"CivicLens AI combines:
- Real-time civic data from NYC Open Data
- Weather from NOAA
- Emergency alerts from FEMA
- DigitalOcean's Gradient AI for reasoning
To help people make safe, informed decisions about their city.

It's not just data aggregation - it's intelligent civic assistance."
```

---

## 🧪 Test Scenarios

### Scenario 1: Event Planning
**Query:**
```
I'm planning to go to a concert in Central Park tomorrow at 7 PM. What should I know?
```

**Expected Response:**
- Weather forecast for tomorrow evening
- Recent 311 complaints in Central Park area
- Recommended departure time
- What to bring (based on weather)
- Nearby resources if needed

---

### Scenario 2: Missing Item
**Query:**
```
I'm heading to a job interview in Manhattan. I forgot my umbrella and it might rain. Help!
```

**Expected Response:**
- Current rain probability
- Nearby stores to buy an umbrella
- Estimated detour time
- Alternative: indoor routes, subway
- Priority action checklist

---

### Scenario 3: Safety Concern
**Query:**
```
Is it safe to walk home from work right now? I'm near Wall Street.
```

**Expected Response:**
- Current conditions (weather, time of day)
- Recent collisions in the area
- 311 complaints (street lights, safety issues)
- Recommended route
- Alternative: transit options

---

### Scenario 4: General Area Check
**Query:**
```
I'm visiting Brooklyn for the first time. What should I know about the area?
```

**Expected Response:**
- Current weather
- General civic health (311 complaints, violations)
- Any active alerts
- Safety tips
- Recommended precautions

---

### Scenario 5: Emergency Alert Test
**Query:**
```
Are there any emergency alerts in New York right now?
```

**Expected Response:**
- FEMA disaster declarations (if any)
- IPAWS alerts (if any)
- Severity and urgency levels
- Recommended actions
- Fallback: "No active alerts, you're clear"

---

## 🎯 Testing Checklist

### Functional Tests
- [ ] Location permission works
- [ ] Chat input accepts text
- [ ] Send button works
- [ ] Loading state appears
- [ ] Response cards render correctly
- [ ] Multiple messages display in order
- [ ] Auto-scroll to new messages
- [ ] Context summary is collapsible

### API Integration Tests
- [ ] 311 API returns data
- [ ] Weather API returns forecast
- [ ] Collision API returns data
- [ ] Housing API returns data
- [ ] FEMA APIs return data (or empty arrays)
- [ ] Geocoding works for addresses
- [ ] Gradient AI agent responds (or fallback works)

### Edge Cases
- [ ] User denies location permission → can still type address
- [ ] No internet connection → error message
- [ ] API timeout → graceful degradation
- [ ] Gradient agent unavailable → fallback response
- [ ] Invalid address → clarifying question
- [ ] Empty message → button disabled
- [ ] Very long message → textarea scrolls

### Mobile Tests (if possible)
- [ ] UI is responsive
- [ ] Touch input works
- [ ] Location works on mobile browser
- [ ] Cards are readable on small screen
- [ ] No horizontal scroll

---

## 🐛 Known Limitations & Future Improvements

### Current Limitations:
1. **NYC-Only**: Civic data is currently NYC-focused (311, collisions, housing)
   - Future: Add more cities

2. **US Weather Only**: NOAA is US-only
   - Future: Add international weather APIs

3. **No Route Visualization**: Text-based route advice only
   - Future: Add Google Maps integration

4. **No Real-Time Transit**: Doesn't check MTA delays
   - Future: Add MTA API integration

5. **Simple Geocoding**: Uses Census API (US-only)
   - Future: Add Google Maps Geocoding

### Potential Enhancements:
- [ ] Add map visualization
- [ ] Add transit API (MTA, etc.)
- [ ] Add nearby store database (Google Places)
- [ ] Add push notifications for severe alerts
- [ ] Add user preferences (save favorite locations)
- [ ] Add history (save past queries)
- [ ] Add multi-language support
- [ ] Add voice input
- [ ] Add export/share functionality
- [ ] Add calendar integration

---

## 📊 Performance Metrics

### Expected Response Times:
- **Location permission**: < 1 second
- **Geocoding**: < 1 second
- **Civic data gathering**: 1-2 seconds (parallel)
- **Gradient AI agent**: 2-4 seconds
- **Total (user sends message → sees response)**: 3-7 seconds

### API Call Efficiency:
- All civic APIs called in parallel (not sequential)
- Next.js caching reduces redundant calls
- Fallback logic prevents blocking

### Data Volume:
- Typical response: ~10-50 KB
- 311 data: ~5-10 records per query
- Weather data: ~1-2 KB
- Collision data: ~3-5 records
- Total bandwidth: Minimal (<100 KB per interaction)

---

## 🎨 UI/UX Notes

### Design Principles:
1. **Mobile-First**: Every component designed for small screens first
2. **Clear Hierarchy**: Important info (safety verdict) comes first
3. **Actionable**: Every response includes specific actions to take
4. **Transparent**: Users can see what data was used
5. **Non-Alarmist**: Calm, practical tone (never fearmongering)
6. **Accessible**: Plain language, high contrast, clear labels

### Color Coding:
- 🟢 **Green**: Safe, go ahead
- 🟠 **Orange**: Caution, prepare
- 🔴 **Red**: Danger, reconsider
- 🔵 **Blue**: Informational
- 🟣 **Purple**: Navigation
- ⚫ **Gray**: Metadata, transparency

### Interaction Patterns:
- **Single-tap**: Send message, expand cards
- **Auto-scroll**: New messages automatically visible
- **Non-blocking**: Location failure doesn't break app
- **Progressive**: Basic features work without JS

---

## 💡 Tips for Judges/Reviewers

### Highlight These Points:
1. **Real-Time Data**: All civic APIs hit live endpoints (not mock data)
2. **Agentic Behavior**: Agent decides what data to fetch and how to respond
3. **Structured Output**: Not just text - actionable cards with priorities
4. **Transparency**: Users can see exactly what data was used
5. **Graceful Degradation**: Works even if agent is unavailable
6. **Privacy-First**: No tracking, no storage, explicit permissions

### Technical Highlights:
- **Next.js 14**: Modern React framework with App Router
- **TypeScript**: Full type safety
- **Parallel API Calls**: Efficient data gathering
- **Edge Functions**: Fast, scalable API routes
- **Caching Strategy**: Smart revalidation reduces load
- **Error Handling**: Graceful fallbacks at every level

### Social Impact:
- Helps people make safer decisions
- Reduces information overload
- Democratizes access to civic data
- No surveillance or profiling
- Focuses on actionable guidance

---

**Ready to demo!** 🚀

Open http://localhost:3000 and start testing!
