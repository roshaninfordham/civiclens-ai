/**
 * CivicLens AI - Real-Time Civic Intelligence Dashboard
 * 
 * This dashboard provides live civic awareness by visualizing:
 * - 311 Service Requests trends
 * - Traffic collision hotspots
 * - Weather conditions
 * - FEMA alerts
 * - Housing violations
 * - Air quality
 * 
 * All data is fetched in real-time from civic APIs
 */

'use client';

import { useState, useEffect } from 'react';
import type { UserLocation } from '@/types';

interface DashboardData {
  location?: {
    lat: number;
    lon: number;
    address: string;
  };
  stats?: {
    total311Requests: number;
    open311Requests: number;
    recentCollisions: number;
    openViolations: number;
    temperature: number;
    weatherCondition: string;
    activeAlerts: number;
  };
  trends?: {
    top311Categories: Array<{ category: string; count: number; }>;
    collisionTrend: 'increasing' | 'stable' | 'decreasing';
    safetyScore: number; // 0-100
  };
  lastUpdated?: string;
}

export default function CivicDashboard() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Request location on mount
  useEffect(() => {
    requestLocation();
  }, []);

  // Auto-refresh dashboard every 5 minutes
  useEffect(() => {
    if (!autoRefresh || !userLocation) return;

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoRefresh, userLocation]);

  // Fetch dashboard data when location changes
  useEffect(() => {
    if (userLocation) {
      fetchDashboardData();
    }
  }, [userLocation]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
        setError(null);
      },
      (error) => {
        setError('Location permission denied. Dashboard will show NYC-wide data.');
        // Default to NYC center
        setUserLocation({
          latitude: 40.7128,
          longitude: -74.0060,
          accuracy: 0,
          timestamp: Date.now(),
        });
      }
    );
  };

  const fetchDashboardData = async () => {
    if (!userLocation) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch dashboard data');

      const data = await response.json();
      setDashboardData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  if (!userLocation) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Requesting location access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              🏙️ Live Civic Intelligence
            </h2>
            <p className="text-gray-600">
              Real-time civic awareness for your area
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className={`w-3 h-3 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
              {autoRefresh ? 'Live' : 'Paused'}
            </div>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="text-xs text-blue-600 hover:text-blue-700 mt-1"
            >
              {autoRefresh ? 'Pause' : 'Resume'} auto-refresh
            </button>
          </div>
        </div>

        {dashboardData?.location && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900">
              📍 <span className="font-medium">{dashboardData.location.address}</span>
            </p>
            <p className="text-xs text-blue-700 mt-1">
              {dashboardData.location.lat.toFixed(4)}, {dashboardData.location.lon.toFixed(4)}
            </p>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-600">Analyzing civic data...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-800">⚠️ {error}</p>
        </div>
      )}

      {/* Dashboard Stats */}
      {dashboardData?.stats && !isLoading && (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              icon="📞"
              title="311 Requests"
              value={dashboardData.stats.total311Requests}
              subtitle={`${dashboardData.stats.open311Requests} open`}
              color="blue"
            />
            <MetricCard
              icon="🚗"
              title="Collisions"
              value={dashboardData.stats.recentCollisions}
              subtitle="Recent incidents"
              color="orange"
            />
            <MetricCard
              icon="🏘️"
              title="Violations"
              value={dashboardData.stats.openViolations}
              subtitle="Housing issues"
              color="purple"
            />
            <MetricCard
              icon="🌡️"
              title="Temperature"
              value={`${dashboardData.stats.temperature}°F`}
              subtitle={dashboardData.stats.weatherCondition}
              color="green"
            />
          </div>

          {/* Safety Score */}
          {dashboardData.trends && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                🛡️ Area Safety Score
              </h3>
              <div className="relative">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${
                          dashboardData.trends.safetyScore >= 70
                            ? 'bg-green-500'
                            : dashboardData.trends.safetyScore >= 40
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                        style={{ width: `${dashboardData.trends.safetyScore}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-gray-900 min-w-[80px] text-right">
                    {dashboardData.trends.safetyScore}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Based on recent civic data: 311 requests, collisions, violations, and alerts
                </p>
              </div>
            </div>
          )}

          {/* Top 311 Categories */}
          {dashboardData.trends?.top311Categories && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                📊 Top Civic Issues
              </h3>
              <div className="space-y-3">
                {dashboardData.trends.top311Categories.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {item.category}
                        </span>
                        <span className="text-sm text-gray-500">{item.count}</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-500"
                          style={{
                            width: `${(item.count / dashboardData.trends!.top311Categories[0].count) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Alerts */}
          {dashboardData.stats.activeAlerts > 0 && (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
              <div className="flex items-center gap-3">
                <span className="text-4xl">🚨</span>
                <div>
                  <h3 className="text-xl font-bold text-red-900">
                    {dashboardData.stats.activeAlerts} Active Alert{dashboardData.stats.activeAlerts > 1 ? 's' : ''}
                  </h3>
                  <p className="text-red-700">
                    Check FEMA alerts and local advisories
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Last Updated */}
          <div className="text-center text-sm text-gray-500">
            Last updated: {dashboardData.lastUpdated || 'Just now'}
          </div>
        </>
      )}

      {/* Refresh Button */}
      <div className="text-center">
        <button
          onClick={fetchDashboardData}
          disabled={isLoading}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium shadow-lg"
        >
          {isLoading ? 'Refreshing...' : '🔄 Refresh Dashboard'}
        </button>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({
  icon,
  title,
  value,
  subtitle,
  color,
}: {
  icon: string;
  title: string;
  value: string | number;
  subtitle: string;
  color: 'blue' | 'orange' | 'purple' | 'green';
}) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    orange: 'from-orange-500 to-orange-600',
    purple: 'from-purple-500 to-purple-600',
    green: 'from-green-500 to-green-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-2xl mb-3`}>
        {icon}
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}
