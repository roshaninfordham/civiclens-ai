/**
 * CivicLens AI - TypeScript Type Definitions
 * 
 * This file defines all the data structures used throughout the app:
 * - User messages and location data
 * - Agent responses (structured safety verdicts)
 * - API response types for NYC Open Data, CDC, FEMA, NOAA
 */

// ============================================================================
// USER INPUT & LOCATION
// ============================================================================

/**
 * User's geographic location from browser geolocation API
 */
export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number; // meters
  timestamp?: number;
}

/**
 * Message sent from the frontend chat UI to the backend
 */
export interface ChatRequest {
  message: string; // Natural language user intent
  userLocation?: UserLocation; // Optional: user's current location
  destinationAddress?: string; // Optional: parsed destination
  timestamp?: string; // ISO 8601 timestamp
}

// ============================================================================
// AGENT RESPONSE (Structured Output)
// ============================================================================

/**
 * The main structured response from CivicLens AI agent
 * This is what the frontend renders as cards/sections
 */
export interface AgentResponse {
  // Core safety decision
  safetyVerdict: SafetyVerdict;
  
  // Environmental conditions
  conditionsSnapshot?: ConditionsSnapshot;
  
  // Route and timing guidance
  routeAdvice?: RouteAdvice;
  
  // Nearby resources (stores, services)
  nearbyFixes?: NearbyFix[];
  
  // Action checklist for the user
  whatToDoNow?: ActionItem[];
  
  // If agent needs more info
  clarifyingQuestions?: string[];
  
  // AI-generated visualization insights (powered by Gemini)
  visualization?: {
    chartType: 'bar' | 'line' | 'pie' | 'heatmap' | 'gauge';
    title: string;
    description: string;
    svgChart?: string;
    insights: string[];
  };
  
  // Raw context used for reasoning (for transparency)
  contextSummary?: ContextSummary;
}

/**
 * Clear, human-readable safety decision
 */
export interface SafetyVerdict {
  isSafe: boolean; // true = safe to go, false = reconsider
  message: string; // "Yes, it's safe to attend, but prepare for cold exposure."
  confidence: 'high' | 'medium' | 'low'; // Agent's confidence level
  riskFactors?: string[]; // ["Cold weather", "High traffic area"]
}

/**
 * Weather, air quality, and environmental conditions
 */
export interface ConditionsSnapshot {
  temperature?: number; // Fahrenheit
  feelsLike?: number;
  weather?: string; // "Clear", "Rain", "Snow"
  rainProbability?: number; // 0-100
  windSpeed?: number; // mph
  uvIndex?: number; // 0-11+
  airQualityIndex?: number; // 0-500 (EPA AQI)
  airQualityCategory?: string; // "Good", "Moderate", "Unhealthy"
  alerts?: string[]; // Weather or air quality alerts
}

/**
 * Route, timing, and travel advice
 */
export interface RouteAdvice {
  recommendedMode?: 'walk' | 'transit' | 'bike' | 'car';
  departureTime?: string; // "Leave by 2:30 PM"
  estimatedTravelTime?: number; // minutes
  safetyNotes?: string[]; // ["Well-lit route", "High pedestrian traffic"]
  trafficWarnings?: string[]; // ["Recent collisions near intersection X"]
}

/**
 * Nearby store or service to fix missing items
 */
export interface NearbyFix {
  name: string; // "Target Express"
  type: string; // "Clothing Store", "Pharmacy"
  address: string;
  distance?: number; // meters
  estimatedDetour?: number; // minutes
  isOnRoute?: boolean;
}

/**
 * Action checklist item
 */
export interface ActionItem {
  priority: 'high' | 'medium' | 'low';
  action: string; // "Bring a jacket"
  reason?: string; // "Temperature will drop to 45°F"
}

// ============================================================================
// CIVIC DATA CONTEXT (Gathered from APIs)
// ============================================================================

/**
 * Summary of all context gathered from APIs
 * Used by the agent for reasoning
 */
export interface ContextSummary {
  location?: {
    lat: number;
    lon: number;
    address?: string;
  };
  weather?: WeatherData;
  civic311?: NYC311Summary;
  collisions?: CollisionSummary;
  housingViolations?: HousingViolationSummary;
  femaAlerts?: FEMAAlert[];
  airQuality?: AirQualityData;
  socialVulnerability?: SocialVulnerabilityData;
}

// ============================================================================
// NYC OPEN DATA API TYPES
// ============================================================================

/**
 * NYC 311 Service Request (from erm2-nwe9 dataset)
 */
export interface NYC311Request {
  unique_key: string;
  created_date: string; // ISO timestamp
  closed_date?: string;
  agency: string;
  complaint_type: string;
  descriptor?: string;
  location_type?: string;
  incident_address?: string;
  street_name?: string;
  city?: string;
  status: string; // "Open", "Closed", "Pending"
  borough?: string;
  latitude?: string;
  longitude?: string;
}

export interface NYC311Summary {
  totalRequests: number;
  openRequests: number;
  topComplaintTypes: Array<{ type: string; count: number }>;
  recentRequests: NYC311Request[];
}

/**
 * NYC Motor Vehicle Collision (from h9gi-nx95 dataset)
 */
export interface NYCCollision {
  collision_id: string;
  crash_date: string;
  crash_time: string;
  borough?: string;
  location?: string;
  on_street_name?: string;
  latitude?: string;
  longitude?: string;
  number_of_persons_injured?: string;
  number_of_persons_killed?: string;
  contributing_factor_vehicle_1?: string;
}

export interface CollisionSummary {
  totalCollisions: number;
  recentCollisions: NYCCollision[];
  injuryCount: number;
  fatalityCount: number;
}

/**
 * NYC Housing Maintenance Code Violations (from wvxf-dwi5 dataset)
 */
export interface HousingViolation {
  violationid: string;
  buildingid: string;
  registrationid?: string;
  borough?: string;
  housenumber?: string;
  streetname?: string;
  apartment?: string;
  violationstatus: string;
  novdescription?: string; // Description of violation
  novissueddate?: string;
  currentstatusdate?: string;
  latitude?: string;
  longitude?: string;
}

export interface HousingViolationSummary {
  totalViolations: number;
  openViolations: number;
  topViolationTypes: Array<{ type: string; count: number }>;
}

// ============================================================================
// WEATHER & ENVIRONMENTAL DATA
// ============================================================================

/**
 * NOAA Weather Data
 * NOAA API returns detailed forecast grids
 */
export interface WeatherData {
  temperature: number; // °F
  temperatureUnit: string;
  dewpoint?: number;
  relativeHumidity?: number;
  windSpeed?: string; // "10 mph"
  windDirection?: string; // "NW"
  shortForecast?: string; // "Partly Cloudy"
  detailedForecast?: string;
  probabilityOfPrecipitation?: number; // 0-100
  timestamp: string;
}

/**
 * CDC Air Quality Data (from cjae-szjv dataset)
 */
export interface AirQualityData {
  measureid?: string;
  measurename?: string; // "Ozone", "PM2.5"
  geo?: string;
  value?: string; // AQI or concentration
  year?: string;
  dataOrigin?: string;
}

/**
 * CDC Social Vulnerability Index (from q9mh-h2tw dataset)
 * Higher values = more vulnerable populations
 */
export interface SocialVulnerabilityData {
  location?: string;
  county?: string;
  state?: string;
  rpl_themes?: string; // Overall percentile rank (0-1)
  rpl_theme1?: string; // Socioeconomic vulnerability
  rpl_theme2?: string; // Household composition
  rpl_theme3?: string; // Minority status / language
  rpl_theme4?: string; // Housing type / transportation
}

// ============================================================================
// FEMA DATA
// ============================================================================

/**
 * FEMA Disaster Declaration (from DisasterDeclarationsSummaries)
 */
export interface FEMADisasterDeclaration {
  disasterNumber: string;
  declarationDate: string;
  disasterName: string;
  incidentType: string; // "Hurricane", "Flood", "Fire", etc.
  state: string;
  declarationType: string; // "Major Disaster", "Emergency"
  incidentBeginDate?: string;
  incidentEndDate?: string;
}

/**
 * FEMA IPAWS Alert (from IpawsArchivedAlerts)
 * Integrated Public Alert and Warning System
 */
export interface FEMAAlert {
  identifier?: string;
  sender?: string;
  sent?: string; // ISO timestamp
  status?: string; // "Actual", "Test"
  msgType?: string; // "Alert", "Update", "Cancel"
  scope?: string; // "Public"
  category?: string; // "Safety", "Security", "Weather"
  event?: string; // "Tornado Warning", "Evacuation Order"
  urgency?: string; // "Immediate", "Expected", "Future"
  severity?: string; // "Extreme", "Severe", "Moderate", "Minor"
  certainty?: string; // "Observed", "Likely", "Possible"
  headline?: string;
  description?: string;
  instruction?: string;
  areaDesc?: string; // Geographic area
  geocode?: string;
}

// ============================================================================
// API ERROR HANDLING
// ============================================================================

/**
 * Standardized error response from API routes
 */
export interface APIError {
  error: string;
  details?: string;
  statusCode?: number;
}

/**
 * Wrapper for API responses (success or error)
 */
export type APIResult<T> = 
  | { success: true; data: T }
  | { success: false; error: APIError };
