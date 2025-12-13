/**
 * CivicLens AI - Civic Data API Utilities
 * 
 * This file contains helper functions to fetch real-time data from:
 * - NYC Open Data (311 requests, collisions, housing violations)
 * - NOAA Weather
 * - CDC (air quality, social vulnerability)
 * - FEMA (disaster alerts)
 * 
 * All functions return typed data and handle errors gracefully.
 */

import type {
  NYC311Request,
  NYC311Summary,
  NYCCollision,
  CollisionSummary,
  HousingViolation,
  HousingViolationSummary,
  WeatherData,
  AirQualityData,
  SocialVulnerabilityData,
  FEMADisasterDeclaration,
  FEMAAlert,
} from '@/types';

// ============================================================================
// CONFIGURATION
// ============================================================================

const NYC_OPEN_DATA_BASE = 'https://data.cityofnewyork.us/resource';
const CDC_BASE = 'https://data.cdc.gov/resource';
const FEMA_BASE = 'https://www.fema.gov/api/open';
const NOAA_API_BASE = 'https://api.weather.gov';

// Helper: Get NYC Open Data auth headers
function getNYCHeaders(): HeadersInit {
  const appToken = process.env.NYC_OPEN_DATA_APP_TOKEN;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (appToken) {
    headers['X-App-Token'] = appToken;
  }
  return headers;
}

// Helper: Get NOAA headers (requires User-Agent)
function getNOAAHeaders(): HeadersInit {
  return {
    'User-Agent': `${process.env.NOAA_USER_AGENT} (${process.env.NOAA_EMAIL})`,
    'Accept': 'application/json',
  };
}

// ============================================================================
// NYC 311 SERVICE REQUESTS
// ============================================================================

/**
 * Fetch recent 311 service requests near a location
 * Uses Socrata SoQL (SQL-like query language)
 * 
 * @param lat Latitude
 * @param lon Longitude
 * @param radiusMeters Search radius in meters (default 500m)
 * @param limit Max number of results (default 50)
 * @returns Summary of 311 requests
 */
export async function fetch311Data(
  lat: number,
  lon: number,
  radiusMeters: number = 500,
  limit: number = 50
): Promise<NYC311Summary> {
  try {
    // Socrata SoQL query: within_circle for geographic filtering
    // Order by created_date DESC to get most recent
    const query = new URLSearchParams({
      $where: `within_circle(location, ${lat}, ${lon}, ${radiusMeters})`,
      $order: 'created_date DESC',
      $limit: limit.toString(),
    });

    const url = `${NYC_OPEN_DATA_BASE}/erm2-nwe9.json?${query}`;
    
    const response = await fetch(url, { 
      headers: getNYCHeaders(),
      // Cache for 5 minutes (311 data doesn't change that fast)
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      throw new Error(`NYC 311 API error: ${response.statusText}`);
    }

    const requests: NYC311Request[] = await response.json();

    // Analyze the data
    const openRequests = requests.filter(r => r.status === 'Open' || r.status === 'Pending');
    
    // Count complaint types
    const complaintCounts = new Map<string, number>();
    requests.forEach(r => {
      const type = r.complaint_type || 'Unknown';
      complaintCounts.set(type, (complaintCounts.get(type) || 0) + 1);
    });

    const topComplaintTypes = Array.from(complaintCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalRequests: requests.length,
      openRequests: openRequests.length,
      topComplaintTypes,
      recentRequests: requests.slice(0, 10), // Return top 10 most recent
    };
  } catch (error) {
    console.error('Error fetching 311 data:', error);
    return {
      totalRequests: 0,
      openRequests: 0,
      topComplaintTypes: [],
      recentRequests: [],
    };
  }
}

// ============================================================================
// NYC MOTOR VEHICLE COLLISIONS
// ============================================================================

/**
 * Fetch recent motor vehicle collisions near a location
 * 
 * @param lat Latitude
 * @param lon Longitude
 * @param radiusMeters Search radius in meters (default 500m)
 * @param limit Max number of results (default 30)
 * @returns Summary of collisions
 */
export async function fetchCollisionData(
  lat: number,
  lon: number,
  radiusMeters: number = 500,
  limit: number = 30
): Promise<CollisionSummary> {
  try {
    const query = new URLSearchParams({
      $where: `within_circle(location, ${lat}, ${lon}, ${radiusMeters})`,
      $order: 'crash_date DESC, crash_time DESC',
      $limit: limit.toString(),
    });

    const url = `${NYC_OPEN_DATA_BASE}/h9gi-nx95.json?${query}`;
    
    const response = await fetch(url, {
      headers: getNYCHeaders(),
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      throw new Error(`NYC Collision API error: ${response.statusText}`);
    }

    const collisions: NYCCollision[] = await response.json();

    // Calculate injury/fatality counts
    let injuryCount = 0;
    let fatalityCount = 0;

    collisions.forEach(c => {
      injuryCount += parseInt(c.number_of_persons_injured || '0', 10);
      fatalityCount += parseInt(c.number_of_persons_killed || '0', 10);
    });

    return {
      totalCollisions: collisions.length,
      recentCollisions: collisions,
      injuryCount,
      fatalityCount,
    };
  } catch (error) {
    console.error('Error fetching collision data:', error);
    return {
      totalCollisions: 0,
      recentCollisions: [],
      injuryCount: 0,
      fatalityCount: 0,
    };
  }
}

// ============================================================================
// NYC HOUSING CODE VIOLATIONS
// ============================================================================

/**
 * Fetch housing code violations near a location
 * This gives a signal of neighborhood conditions
 * 
 * @param lat Latitude
 * @param lon Longitude
 * @param radiusMeters Search radius in meters (default 500m)
 * @param limit Max number of results (default 50)
 * @returns Summary of housing violations
 */
export async function fetchHousingViolations(
  lat: number,
  lon: number,
  radiusMeters: number = 500,
  limit: number = 50
): Promise<HousingViolationSummary> {
  try {
    const query = new URLSearchParams({
      $where: `within_circle(location, ${lat}, ${lon}, ${radiusMeters})`,
      $order: 'novissueddate DESC',
      $limit: limit.toString(),
    });

    const url = `${NYC_OPEN_DATA_BASE}/wvxf-dwi5.json?${query}`;
    
    const response = await fetch(url, {
      headers: getNYCHeaders(),
      next: { revalidate: 600 } // 10 minute cache
    });

    if (!response.ok) {
      throw new Error(`NYC Housing API error: ${response.statusText}`);
    }

    const violations: HousingViolation[] = await response.json();

    const openViolations = violations.filter(
      v => v.violationstatus && v.violationstatus.toLowerCase().includes('open')
    );

    // Count violation types
    const violationCounts = new Map<string, number>();
    violations.forEach(v => {
      const type = v.novdescription || 'Unknown';
      violationCounts.set(type, (violationCounts.get(type) || 0) + 1);
    });

    const topViolationTypes = Array.from(violationCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalViolations: violations.length,
      openViolations: openViolations.length,
      topViolationTypes,
    };
  } catch (error) {
    console.error('Error fetching housing violations:', error);
    return {
      totalViolations: 0,
      openViolations: 0,
      topViolationTypes: [],
    };
  }
}

// ============================================================================
// NOAA WEATHER
// ============================================================================

/**
 * Fetch current weather and forecast from NOAA
 * NOAA API requires 2 steps:
 * 1. Get the grid endpoint for a lat/lon
 * 2. Fetch forecast from that grid endpoint
 * 
 * @param lat Latitude
 * @param lon Longitude
 * @returns Weather data
 */
export async function fetchWeatherData(
  lat: number,
  lon: number
): Promise<WeatherData | null> {
  try {
    // Step 1: Get the grid endpoint for this location
    const pointUrl = `${NOAA_API_BASE}/points/${lat.toFixed(4)},${lon.toFixed(4)}`;
    
    const pointResponse = await fetch(pointUrl, {
      headers: getNOAAHeaders(),
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!pointResponse.ok) {
      throw new Error(`NOAA Points API error: ${pointResponse.statusText}`);
    }

    const pointData = await pointResponse.json();
    const forecastUrl = pointData.properties?.forecast;

    if (!forecastUrl) {
      throw new Error('NOAA did not return a forecast URL');
    }

    // Step 2: Fetch the forecast
    const forecastResponse = await fetch(forecastUrl, {
      headers: getNOAAHeaders(),
      next: { revalidate: 1800 } // Cache for 30 minutes
    });

    if (!forecastResponse.ok) {
      throw new Error(`NOAA Forecast API error: ${forecastResponse.statusText}`);
    }

    const forecastData = await forecastResponse.json();
    const currentPeriod = forecastData.properties?.periods?.[0];

    if (!currentPeriod) {
      throw new Error('NOAA forecast has no periods');
    }

    return {
      temperature: currentPeriod.temperature,
      temperatureUnit: currentPeriod.temperatureUnit || 'F',
      windSpeed: currentPeriod.windSpeed,
      windDirection: currentPeriod.windDirection,
      shortForecast: currentPeriod.shortForecast,
      detailedForecast: currentPeriod.detailedForecast,
      probabilityOfPrecipitation: currentPeriod.probabilityOfPrecipitation?.value,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching NOAA weather:', error);
    return null;
  }
}

// ============================================================================
// CDC AIR QUALITY
// ============================================================================

/**
 * Fetch air quality data for a location (county level)
 * CDC air quality dataset is aggregated by county/state
 * 
 * @param state State abbreviation (e.g., "NY")
 * @param county County name (e.g., "Kings County")
 * @returns Air quality data
 */
export async function fetchAirQuality(
  state: string,
  county: string
): Promise<AirQualityData | null> {
  try {
    // Query for most recent air quality measures
    const query = new URLSearchParams({
      $where: `statename='${state}' AND countyname='${county}'`,
      $order: 'year DESC',
      $limit: '10',
    });

    const url = `${CDC_BASE}/cjae-szjv.json?${query}`;
    
    const response = await fetch(url, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`CDC Air Quality API error: ${response.statusText}`);
    }

    const data: AirQualityData[] = await response.json();
    
    // Return the most recent entry
    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error fetching CDC air quality:', error);
    return null;
  }
}

// ============================================================================
// CDC SOCIAL VULNERABILITY INDEX
// ============================================================================

/**
 * Fetch social vulnerability index for a location
 * This provides context about community resilience (NOT for profiling)
 * 
 * @param state State abbreviation
 * @param county County name
 * @returns Social vulnerability data
 */
export async function fetchSocialVulnerability(
  state: string,
  county: string
): Promise<SocialVulnerabilityData | null> {
  try {
    const query = new URLSearchParams({
      $where: `state='${state}' AND county='${county}'`,
      $limit: '1',
    });

    const url = `${CDC_BASE}/q9mh-h2tw.json?${query}`;
    
    const response = await fetch(url, {
      next: { revalidate: 86400 } // Cache for 24 hours (this data rarely changes)
    });

    if (!response.ok) {
      throw new Error(`CDC SVI API error: ${response.statusText}`);
    }

    const data: SocialVulnerabilityData[] = await response.json();
    
    return data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error fetching social vulnerability:', error);
    return null;
  }
}

// ============================================================================
// FEMA DISASTER DECLARATIONS
// ============================================================================

/**
 * Fetch recent disaster declarations for a state
 * 
 * @param state State abbreviation (e.g., "NY")
 * @returns Array of disaster declarations
 */
export async function fetchFEMADisasters(
  state: string
): Promise<FEMADisasterDeclaration[]> {
  try {
    // Get disasters from the last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const dateFilter = ninetyDaysAgo.toISOString().split('T')[0];

    const query = new URLSearchParams({
      $filter: `state eq '${state}' and declarationDate ge '${dateFilter}'`,
      $orderby: 'declarationDate desc',
      $top: '10',
    });

    const url = `${FEMA_BASE}/v2/DisasterDeclarationsSummaries?${query}`;
    
    const response = await fetch(url, {
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      throw new Error(`FEMA API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.DisasterDeclarationsSummaries || [];
  } catch (error) {
    console.error('Error fetching FEMA disasters:', error);
    return [];
  }
}

// ============================================================================
// FEMA IPAWS ALERTS
// ============================================================================

/**
 * Fetch recent public safety alerts (IPAWS)
 * These are emergency alerts like tornado warnings, evacuation orders, etc.
 * 
 * @param state State abbreviation
 * @returns Array of active alerts
 */
export async function fetchFEMAAlerts(
  state?: string
): Promise<FEMAAlert[]> {
  try {
    // Get alerts from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dateFilter = sevenDaysAgo.toISOString().split('T')[0];

    let filterQuery = `sent ge '${dateFilter}' and status eq 'Actual'`;
    if (state) {
      filterQuery += ` and contains(areaDesc, '${state}')`;
    }

    const query = new URLSearchParams({
      $filter: filterQuery,
      $orderby: 'sent desc',
      $top: '20',
    });

    const url = `${FEMA_BASE}/v1/IpawsArchivedAlerts?${query}`;
    
    const response = await fetch(url, {
      next: { revalidate: 300 } // 5 minute cache (alerts are time-sensitive)
    });

    if (!response.ok) {
      throw new Error(`FEMA IPAWS API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.IpawsArchivedAlerts || [];
  } catch (error) {
    console.error('Error fetching FEMA alerts:', error);
    return [];
  }
}

// ============================================================================
// GEOCODING HELPERS
// ============================================================================

/**
 * Simple geocoding: convert address to lat/lon
 * Uses US Census Geocoding API (free, no key required)
 * 
 * @param address Street address
 * @returns Coordinates or null
 */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lon: number } | null> {
  try {
    const query = new URLSearchParams({
      address: address,
      benchmark: 'Public_AR_Current',
      format: 'json',
    });

    const url = `https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?${query}`;
    
    const response = await fetch(url, {
      next: { revalidate: 86400 } // Cache for 24 hours
    });

    if (!response.ok) {
      throw new Error('Census geocoding error');
    }

    const data = await response.json();
    const match = data.result?.addressMatches?.[0];

    if (match?.coordinates) {
      return {
        lat: match.coordinates.y,
        lon: match.coordinates.x,
      };
    }

    return null;
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}

/**
 * Reverse geocoding: convert lat/lon to address
 * Uses US Census Geocoding API
 * 
 * @param lat Latitude
 * @param lon Longitude
 * @returns Address string or null
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<string | null> {
  try {
    const query = new URLSearchParams({
      x: lon.toString(),
      y: lat.toString(),
      benchmark: 'Public_AR_Current',
      format: 'json',
    });

    const url = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?${query}`;
    
    const response = await fetch(url, {
      next: { revalidate: 86400 }
    });

    if (!response.ok) {
      throw new Error('Census reverse geocoding error');
    }

    const data = await response.json();
    const match = data.result?.geographies?.['Census Blocks']?.[0];

    if (match) {
      return `${match.BASENAME || ''}, ${match.STATE || ''} ${match.COUNTY || ''}`;
    }

    return null;
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
}
