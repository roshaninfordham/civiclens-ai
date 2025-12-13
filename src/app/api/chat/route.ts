/**
 * CivicLens AI - Main Chat API Route
 * 
 * This is the core backend endpoint that:
 * 1. Receives user messages and location from the frontend
 * 2. Gathers real-time context from civic APIs (311, weather, collisions, etc.)
 * 3. Calls the DigitalOcean Gradient AI agent with the enriched context
 * 4. Returns a structured response to the frontend
 * 
 * Route: POST /api/chat
 */

import { NextRequest, NextResponse } from 'next/server';
import type { 
  ChatRequest, 
  AgentResponse, 
  ContextSummary,
  SafetyVerdict,
} from '@/types';
import {
  fetch311Data,
  fetchCollisionData,
  fetchHousingViolations,
  fetchWeatherData,
  fetchAirQuality,
  fetchSocialVulnerability,
  fetchFEMADisasters,
  fetchFEMAAlerts,
  geocodeAddress,
  reverseGeocode,
} from '@/lib/civicData';

/**
 * POST /api/chat
 * Main entry point for chat messages
 */
export async function POST(req: NextRequest) {
  try {
    const body: ChatRequest = await req.json();
    const { message, userLocation, destinationAddress, timestamp } = body;

    console.log('[API] Received chat request:', {
      message: message.substring(0, 100),
      hasLocation: !!userLocation,
      destinationAddress,
    });

    // ========================================================================
    // STEP 1: Determine the target location
    // ========================================================================
    
    let targetLat: number | undefined;
    let targetLon: number | undefined;
    let locationDescription = 'Unknown location';

    // If user provided a destination address, geocode it
    if (destinationAddress) {
      const coords = await geocodeAddress(destinationAddress);
      if (coords) {
        targetLat = coords.lat;
        targetLon = coords.lon;
        locationDescription = destinationAddress;
      }
    }

    // Otherwise, use user's current location
    if (!targetLat && userLocation) {
      targetLat = userLocation.latitude;
      targetLon = userLocation.longitude;
      
      // Try to get a human-readable address
      const address = await reverseGeocode(targetLat, targetLon);
      if (address) {
        locationDescription = address;
      }
    }

    // If we still don't have a location, return early with a clarifying question
    if (!targetLat || !targetLon) {
      const response: AgentResponse = {
        safetyVerdict: {
          isSafe: false,
          message: 'I need to know your location to provide safety guidance.',
          confidence: 'low',
        },
        clarifyingQuestions: [
          'Could you share your current location or the address you\'re planning to visit?',
        ],
      };
      return NextResponse.json(response);
    }

    console.log(`[API] Target location: ${locationDescription} (${targetLat}, ${targetLon})`);

    // ========================================================================
    // STEP 2: Gather real-time civic context in parallel
    // ========================================================================

    console.log('[API] Gathering civic data...');

    const [
      data311,
      collisionData,
      housingData,
      weatherData,
      // airQualityData, // Requires state/county, we'll skip for MVP
      // sviData,
      femaDisasters,
      femaAlerts,
    ] = await Promise.allSettled([
      fetch311Data(targetLat, targetLon, 800), // 800m radius
      fetchCollisionData(targetLat, targetLon, 800),
      fetchHousingViolations(targetLat, targetLon, 800),
      fetchWeatherData(targetLat, targetLon),
      // fetchAirQuality('NY', 'New York County'), // Hardcoded for NYC MVP
      // fetchSocialVulnerability('NY', 'New York County'),
      fetchFEMADisasters('NY'), // Hardcoded for NYC
      fetchFEMAAlerts('NY'),
    ]);

    // Extract successful results
    const civic311 = data311.status === 'fulfilled' ? data311.value : undefined;
    const collisions = collisionData.status === 'fulfilled' ? collisionData.value : undefined;
    const housing = housingData.status === 'fulfilled' ? housingData.value : undefined;
    const weather = weatherData.status === 'fulfilled' ? weatherData.value : undefined;
    const disasters = femaDisasters.status === 'fulfilled' ? femaDisasters.value : [];
    const alerts = femaAlerts.status === 'fulfilled' ? femaAlerts.value : [];

    // Build the context summary
    const contextSummary: ContextSummary = {
      location: {
        lat: targetLat,
        lon: targetLon,
        address: locationDescription,
      },
      weather: weather || undefined,
      civic311,
      collisions,
      housingViolations: housing,
      femaAlerts: alerts,
    };

    console.log('[API] Context gathered:', {
      has311: !!civic311,
      hasWeather: !!weather,
      hasCollisions: !!collisions,
      femaAlerts: alerts.length,
    });

    // ========================================================================
    // STEP 3: Call DigitalOcean Gradient AI Agent
    // ========================================================================

    const agentResponse = await callGradientAgent(message, contextSummary);

    // ========================================================================
    // STEP 4: Generate AI Visualization (Gemini API)
    // ========================================================================

    try {
      const { generateVisualInsights, generateChartSVG } = await import('@/lib/gemini');
      const visualization = await generateVisualInsights(contextSummary);
      
      if (visualization) {
        const svgChart = generateChartSVG(visualization);
        agentResponse.visualization = {
          ...visualization,
          svgChart,
        };
        console.log('[API] Gemini visualization generated');
      }
    } catch (vizError) {
      console.warn('[API] Could not generate visualization:', vizError);
      // Non-blocking - continue without visualization
    }

    // Return the structured response
    return NextResponse.json(agentResponse);

  } catch (error) {
    console.error('[API] Error in chat endpoint:', error);
    
    return NextResponse.json(
      {
        error: 'Failed to process your request',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// GRADIENT AI AGENT INTEGRATION
// ============================================================================

/**
 * Call the DigitalOcean Gradient AI agent with enriched context
 * The agent will reason over the civic data and return a structured response
 * 
 * @param userMessage Original user message
 * @param context Gathered civic context
 * @returns Structured agent response
 */
async function callGradientAgent(
  userMessage: string,
  context: ContextSummary
): Promise<AgentResponse> {
  try {
    const agentKey = process.env.GRADIENT_AI_AGENT_KEY;
    const agentEndpoint = process.env.GRADIENT_AI_AGENT_ENDPOINT;

    // If no agent configured, fall back to basic local reasoning
    if (!agentKey || !agentEndpoint) {
      console.warn('[API] No Gradient AI agent configured, using fallback logic');
      return generateFallbackResponse(userMessage, context);
    }

    // Prepare the message for the agent
    const agentPrompt = buildAgentPrompt(userMessage, context);

    console.log('[API] Calling DigitalOcean Gradient AI agent...');
    console.log('[API] Endpoint:', agentEndpoint);

    // DigitalOcean Gradient AI expects a simple message format
    const response = await fetch(agentEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${agentKey}`,
      },
      body: JSON.stringify({
        message: agentPrompt,
      }),
    });

    if (!response.ok) {
      console.error('[API] Gradient AI error:', response.status, response.statusText);
      throw new Error(`Gradient AI agent error: ${response.statusText}`);
    }

    const agentData = await response.json();
    console.log('[API] Gradient AI agent responded successfully');

    // Parse the agent's response
    // The agent should return structured JSON or text
    const agentResponse = parseAgentResponse(agentData, userMessage, context);

    // Include the context summary for transparency
    agentResponse.contextSummary = context;

    return agentResponse;

  } catch (error) {
    console.error('[API] Error calling Gradient AI agent:', error);
    
    // Fall back to basic local reasoning
    return generateFallbackResponse(userMessage, context);
  }
}

/**
 * System prompt for the Gradient AI agent
 * This defines the agent's behavior and response format
 */
const AGENT_SYSTEM_PROMPT = `You are CivicLens AI, an intelligent civic safety assistant that helps people make informed decisions about attending events and navigating cities.

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
- Always provide at least 2-3 actionable steps in "whatToDoNow"`;

/**
 * Build the prompt for the agent with civic context
 */
function buildAgentPrompt(userMessage: string, context: ContextSummary): string {
  const parts: string[] = [];

  parts.push('User Request:');
  parts.push(userMessage);
  parts.push('');
  parts.push('Real-Time Civic Context:');
  parts.push('');

  // Location
  if (context.location) {
    parts.push(`Location: ${context.location.address || 'Unknown'}`);
    parts.push(`Coordinates: ${context.location.lat.toFixed(4)}, ${context.location.lon.toFixed(4)}`);
    parts.push('');
  }

  // Weather
  if (context.weather) {
    parts.push(`Weather: ${context.weather.shortForecast || 'N/A'}`);
    parts.push(`Temperature: ${context.weather.temperature}°${context.weather.temperatureUnit}`);
    parts.push(`Wind: ${context.weather.windSpeed || 'N/A'} ${context.weather.windDirection || ''}`);
    if (context.weather.probabilityOfPrecipitation) {
      parts.push(`Rain Probability: ${context.weather.probabilityOfPrecipitation}%`);
    }
    parts.push('');
  }

  // 311 Complaints
  if (context.civic311) {
    parts.push(`311 Service Requests (nearby, last 30 days): ${context.civic311.totalRequests}`);
    parts.push(`Open Requests: ${context.civic311.openRequests}`);
    if (context.civic311.topComplaintTypes.length > 0) {
      parts.push('Top Complaint Types:');
      context.civic311.topComplaintTypes.forEach(c => {
        parts.push(`  - ${c.type}: ${c.count}`);
      });
    }
    parts.push('');
  }

  // Collisions
  if (context.collisions) {
    parts.push(`Traffic Collisions (nearby, recent): ${context.collisions.totalCollisions}`);
    parts.push(`Injuries: ${context.collisions.injuryCount}, Fatalities: ${context.collisions.fatalityCount}`);
    parts.push('');
  }

  // Housing Violations
  if (context.housingViolations) {
    parts.push(`Housing Code Violations (nearby): ${context.housingViolations.totalViolations}`);
    parts.push(`Open Violations: ${context.housingViolations.openViolations}`);
    parts.push('');
  }

  // FEMA Alerts
  if (context.femaAlerts && context.femaAlerts.length > 0) {
    parts.push('⚠️ FEMA Public Safety Alerts:');
    context.femaAlerts.slice(0, 3).forEach(alert => {
      parts.push(`  - ${alert.event || 'Alert'}: ${alert.headline || alert.description || 'No details'}`);
      if (alert.severity) {
        parts.push(`    Severity: ${alert.severity}, Urgency: ${alert.urgency || 'N/A'}`);
      }
    });
    parts.push('');
  }

  parts.push('Based on this data, provide your structured safety guidance.');

  return parts.join('\n');
}

/**
 * Parse the agent's response into our structured format
 * The agent should return JSON, but we'll handle various formats
 */
function parseAgentResponse(
  agentData: any,
  userMessage: string,
  context: ContextSummary
): AgentResponse {
  try {
    // Check if agent returned a message field (DigitalOcean format)
    let responseText = agentData.message || agentData.response || agentData.text || '';

    // If no text, check nested structures
    if (!responseText && agentData.choices?.[0]?.message?.content) {
      responseText = agentData.choices[0].message.content;
    }

    // If still no text, try direct JSON
    if (!responseText && agentData.safetyVerdict) {
      return agentData as AgentResponse;
    }

    // Try to parse as JSON
    if (responseText.startsWith('{') || responseText.includes('"safetyVerdict"')) {
      // Clean markdown if present
      let cleaned = responseText.trim();
      if (cleaned.startsWith('```json')) cleaned = cleaned.substring(7);
      if (cleaned.startsWith('```')) cleaned = cleaned.substring(3);
      if (cleaned.endsWith('```')) cleaned = cleaned.substring(0, cleaned.length - 3);
      
      const parsed = JSON.parse(cleaned.trim());
      if (parsed.safetyVerdict) {
        return parsed as AgentResponse;
      }
    }

    // If we got plain text from the agent, convert it to structured format
    console.warn('[API] Agent returned plain text, converting to structured format');
    return convertTextToStructuredResponse(responseText, context);

  } catch (error) {
    console.error('[API] Error parsing agent response:', error);
    // Return a basic structured response
    return convertTextToStructuredResponse(
      agentData.message || agentData.text || 'I analyzed your request but had trouble formatting the response.',
      context
    );
  }
}

/**
 * Convert plain text agent response to structured format
 */
function convertTextToStructuredResponse(
  text: string,
  context: ContextSummary
): AgentResponse {
  // Extract key information from the text
  const isSafe = !text.toLowerCase().includes('not safe') && !text.toLowerCase().includes('unsafe');
  
  return {
    safetyVerdict: {
      isSafe,
      message: text.split('\n')[0] || text.substring(0, 200),
      confidence: 'medium',
    },
    conditionsSnapshot: context.weather ? {
      temperature: context.weather.temperature,
      weather: context.weather.shortForecast,
      rainProbability: context.weather.probabilityOfPrecipitation,
    } : undefined,
    whatToDoNow: [
      {
        priority: 'high',
        action: 'Review the full guidance from the AI agent',
        reason: text,
      },
    ],
  };
}

/**
 * Fallback response generator when agent is unavailable
 * Uses simple rule-based logic
 */
function generateFallbackResponse(
  userMessage: string,
  context: ContextSummary
): AgentResponse {
  console.log('[API] Generating fallback response');

  const riskFactors: string[] = [];
  const whatToDoNow: AgentResponse['whatToDoNow'] = [];

  // Check weather
  let isSafe = true;
  let confidence: 'high' | 'medium' | 'low' = 'medium';

  if (context.weather) {
    const temp = context.weather.temperature;
    
    if (temp < 40) {
      riskFactors.push('Cold weather');
      whatToDoNow.push({
        priority: 'high',
        action: 'Bring warm clothing (jacket, hat, gloves)',
        reason: `Temperature is ${temp}°F`,
      });
    }

    if (context.weather.probabilityOfPrecipitation && context.weather.probabilityOfPrecipitation > 50) {
      riskFactors.push('High chance of rain');
      whatToDoNow.push({
        priority: 'high',
        action: 'Bring an umbrella or raincoat',
        reason: `${context.weather.probabilityOfPrecipitation}% chance of precipitation`,
      });
    }
  }

  // Check FEMA alerts
  if (context.femaAlerts && context.femaAlerts.length > 0) {
    const severeAlerts = context.femaAlerts.filter(
      a => a.severity === 'Severe' || a.severity === 'Extreme'
    );

    if (severeAlerts.length > 0) {
      isSafe = false;
      confidence = 'high';
      riskFactors.push('Active emergency alerts');
      whatToDoNow.push({
        priority: 'high',
        action: 'Check FEMA alerts and consider postponing travel',
        reason: 'There are active severe weather or emergency alerts in your area',
      });
    }
  }

  // Check collisions
  if (context.collisions && context.collisions.totalCollisions > 5) {
    riskFactors.push('High traffic collision rate');
    whatToDoNow.push({
      priority: 'medium',
      action: 'Use well-lit, pedestrian-friendly routes',
      reason: `${context.collisions.totalCollisions} recent collisions reported nearby`,
    });
  }

  // Default action
  if (whatToDoNow.length === 0) {
    whatToDoNow.push({
      priority: 'low',
      action: 'Check your route before leaving',
      reason: 'Always good to review transit options and timing',
    });
  }

  const safetyVerdict: SafetyVerdict = {
    isSafe,
    message: isSafe
      ? 'Your trip appears safe, but take the recommended precautions.'
      : 'There are some risks to be aware of. Please review the guidance below.',
    confidence,
    riskFactors: riskFactors.length > 0 ? riskFactors : undefined,
  };

  return {
    safetyVerdict,
    conditionsSnapshot: context.weather ? {
      temperature: context.weather.temperature,
      weather: context.weather.shortForecast,
      rainProbability: context.weather.probabilityOfPrecipitation,
      windSpeed: parseFloat(context.weather.windSpeed || '0'),
    } : undefined,
    whatToDoNow,
    contextSummary: context,
  };
}
