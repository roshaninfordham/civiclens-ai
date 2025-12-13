/**
 * CivicLens AI - Dashboard API Route
 * 
 * Provides real-time civic intelligence data for the dashboard:
 * - 311 service request statistics
 * - Collision data
 * - Housing violations
 * - Weather conditions
 * - FEMA alerts
 * - Safety score calculation
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  fetch311Data,
  fetchCollisionData,
  fetchHousingViolations,
  fetchWeatherData,
  fetchFEMAAlerts,
  reverseGeocode,
} from '@/lib/civicData';

export async function POST(req: NextRequest) {
  try {
    const { latitude, longitude } = await req.json();

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude required' },
        { status: 400 }
      );
    }

    console.log(`[Dashboard API] Fetching data for: ${latitude}, ${longitude}`);

    // Fetch all data in parallel
    const [
      data311,
      collisionData,
      housingData,
      weatherData,
      femaAlerts,
      address,
    ] = await Promise.allSettled([
      fetch311Data(latitude, longitude, 1000), // 1km radius
      fetchCollisionData(latitude, longitude, 1000),
      fetchHousingViolations(latitude, longitude, 1000),
      fetchWeatherData(latitude, longitude),
      fetchFEMAAlerts('NY'),
      reverseGeocode(latitude, longitude),
    ]);

    // Extract successful results
    const civic311 = data311.status === 'fulfilled' ? data311.value : undefined;
    const collisions = collisionData.status === 'fulfilled' ? collisionData.value : undefined;
    const housing = housingData.status === 'fulfilled' ? housingData.value : undefined;
    const weather = weatherData.status === 'fulfilled' ? weatherData.value : undefined;
    const alerts = femaAlerts.status === 'fulfilled' ? femaAlerts.value : [];
    const locationAddress = address.status === 'fulfilled' ? address.value : 'Unknown location';

    // Calculate safety score (0-100)
    const safetyScore = calculateSafetyScore({
      civic311,
      collisions,
      housing,
      alerts,
    });

    // Build response
    const dashboardData = {
      location: {
        lat: latitude,
        lon: longitude,
        address: locationAddress || 'Unknown location',
      },
      stats: {
        total311Requests: civic311?.totalRequests || 0,
        open311Requests: civic311?.openRequests || 0,
        recentCollisions: collisions?.totalCollisions || 0,
        openViolations: housing?.openViolations || 0,
        temperature: weather?.temperature || 0,
        weatherCondition: weather?.shortForecast || 'Unknown',
        activeAlerts: alerts.filter(a => a.severity === 'Severe' || a.severity === 'Extreme').length,
      },
      trends: {
        top311Categories: civic311?.topComplaintTypes.map(c => ({
          category: c.type,
          count: c.count,
        })) || [],
        collisionTrend: calculateCollisionTrend(collisions),
        safetyScore,
      },
      lastUpdated: new Date().toLocaleTimeString(),
    };

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('[Dashboard API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate a safety score (0-100) based on civic data
 * Higher score = safer area
 */
function calculateSafetyScore(data: {
  civic311?: any;
  collisions?: any;
  housing?: any;
  alerts?: any[];
}): number {
  let score = 100;

  // Deduct points for 311 requests (max -20)
  if (data.civic311) {
    const open311 = data.civic311.openRequests || 0;
    score -= Math.min(open311 * 2, 20);
  }

  // Deduct points for collisions (max -30)
  if (data.collisions) {
    const collisionCount = data.collisions.totalCollisions || 0;
    const injuries = data.collisions.injuryCount || 0;
    const fatalities = data.collisions.fatalityCount || 0;
    score -= Math.min(collisionCount * 3, 20);
    score -= injuries * 5;
    score -= fatalities * 10;
  }

  // Deduct points for housing violations (max -20)
  if (data.housing) {
    const openViolations = data.housing.openViolations || 0;
    score -= Math.min(openViolations * 2, 20);
  }

  // Deduct points for severe alerts (max -30)
  if (data.alerts) {
    const severeAlerts = data.alerts.filter(
      a => a.severity === 'Severe' || a.severity === 'Extreme'
    ).length;
    score -= severeAlerts * 15;
  }

  // Ensure score is between 0 and 100
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Determine collision trend
 */
function calculateCollisionTrend(
  collisions?: any
): 'increasing' | 'stable' | 'decreasing' {
  if (!collisions || collisions.totalCollisions === 0) return 'stable';
  
  // Simple heuristic: high collision count = increasing trend
  if (collisions.totalCollisions > 10) return 'increasing';
  if (collisions.totalCollisions < 3) return 'decreasing';
  return 'stable';
}
