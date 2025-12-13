/**
 * CivicLens AI - Chat UI Component
 * 
 * Mobile-first chat interface with:
 * - Message input and send
 * - Location permission request
 * - Message history display
 * - Structured response cards (Safety Verdict, Conditions, etc.)
 * 
 * This is a client component that manages local state and calls the API
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import type { AgentResponse, UserLocation, ChatRequest } from '@/types';

// ============================================================================
// MAIN CHAT COMPONENT
// ============================================================================

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Request user's location
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      return;
    }

    setLocationError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        setUserLocation(location);
        console.log('Location obtained:', location);
      },
      (error) => {
        let errorMsg = 'Failed to get location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMsg = 'Location request timed out';
            break;
        }
        setLocationError(errorMsg);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  };

  // Send a message to the API
  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

    // Add user message to chat
    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      // Prepare the request
      const request: ChatRequest = {
        message: userMessage,
        userLocation: userLocation || undefined,
        timestamp: new Date().toISOString(),
      };

      // Call the API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const agentResponse: AgentResponse = await response.json();

      // Add agent response to chat
      const agentMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '', // We'll use the structured response instead
        structuredResponse: agentResponse,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, agentMessage]);

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Location Bar */}
      <div className="bg-white border-b border-gray-200 p-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {userLocation ? (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <span className="text-lg">📍</span>
              <span>
                Location enabled ({userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)})
              </span>
            </div>
          ) : (
            <button
              onClick={requestLocation}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
            >
              <span className="text-lg">📍</span>
              Enable Location (Recommended)
            </button>
          )}
          {locationError && (
            <span className="text-xs text-red-600">{locationError}</span>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <WelcomeMessage onExampleClick={setInputValue} />
          )}
          
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          
          {isLoading && (
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
              <span>CivicLens is analyzing civic data...</span>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me about safety, weather, or civic conditions..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// WELCOME MESSAGE
// ============================================================================

function WelcomeMessage({ onExampleClick }: { onExampleClick: (text: string) => void }) {
  const examples = [
    "I want to attend a hackathon at 3 PM in Brooklyn. I forgot my jacket. Is it safe?",
    "What are the conditions like near Times Square right now?",
    "I'm walking to the library. Should I be concerned about anything?",
  ];

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold mb-2">Welcome to CivicLens AI! 👋</h2>
      <p className="text-gray-600 mb-4">
        I help you make safe, informed decisions by analyzing real-time weather, civic data, 
        and public safety signals in your area.
      </p>
      
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Try asking me:</p>
        <div className="space-y-2">
          {examples.map((example, i) => (
            <button
              key={i}
              onClick={() => onExampleClick(example)}
              className="block w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
            >
              💬 {example}
            </button>
          ))}
        </div>
      </div>
      
      <p className="text-xs text-gray-500">
        💡 Tip: Enable location for personalized safety guidance
      </p>
    </div>
  );
}

// ============================================================================
// MESSAGE BUBBLE
// ============================================================================

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  structuredResponse?: AgentResponse;
  timestamp: string;
  isError?: boolean;
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-3xl ${isUser ? 'w-auto' : 'w-full'}`}>
        {isUser ? (
          <div className="bg-blue-600 text-white rounded-lg px-4 py-3 shadow-sm">
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        ) : message.structuredResponse ? (
          <StructuredResponse response={message.structuredResponse} />
        ) : (
          <div className={`bg-white rounded-lg px-4 py-3 shadow-sm border ${
            message.isError ? 'border-red-300 bg-red-50' : 'border-gray-200'
          }`}>
            <p className={`whitespace-pre-wrap ${message.isError ? 'text-red-700' : 'text-gray-800'}`}>
              {message.content}
            </p>
          </div>
        )}
        
        <p className="text-xs text-gray-400 mt-1 px-2">
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// STRUCTURED RESPONSE CARDS
// ============================================================================

function StructuredResponse({ response }: { response: AgentResponse }) {
  return (
    <div className="space-y-3">
      {/* Safety Verdict */}
      <SafetyVerdictCard verdict={response.safetyVerdict} />

      {/* Clarifying Questions (if any) */}
      {response.clarifyingQuestions && response.clarifyingQuestions.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">I need more information:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
            {response.clarifyingQuestions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Conditions Snapshot */}
      {response.conditionsSnapshot && (
        <ConditionsCard conditions={response.conditionsSnapshot} />
      )}

      {/* Route Advice */}
      {response.routeAdvice && (
        <RouteAdviceCard advice={response.routeAdvice} />
      )}

      {/* Nearby Fixes */}
      {response.nearbyFixes && response.nearbyFixes.length > 0 && (
        <NearbyFixesCard fixes={response.nearbyFixes} />
      )}

      {/* What To Do Now */}
      {response.whatToDoNow && response.whatToDoNow.length > 0 && (
        <ActionChecklistCard actions={response.whatToDoNow} />
      )}

      {/* AI-Generated Visualization (Gemini) */}
      {response.visualization && (
        <VisualizationCard visualization={response.visualization} />
      )}

      {/* Context Summary (collapsible, for transparency) */}
      {response.contextSummary && (
        <ContextSummaryCard context={response.contextSummary} />
      )}
    </div>
  );
}

// Safety Verdict Card
function SafetyVerdictCard({ verdict }: { verdict: AgentResponse['safetyVerdict'] }) {
  const bgColor = verdict.isSafe ? 'bg-green-50' : 'bg-orange-50';
  const borderColor = verdict.isSafe ? 'border-green-200' : 'border-orange-200';
  const iconColor = verdict.isSafe ? 'text-green-600' : 'text-orange-600';
  const icon = verdict.isSafe ? '✅' : '⚠️';

  return (
    <div className={`${bgColor} border ${borderColor} rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">{verdict.message}</h3>
          <p className="text-sm text-gray-600">
            Confidence: <span className="font-medium">{verdict.confidence}</span>
          </p>
          {verdict.riskFactors && verdict.riskFactors.length > 0 && (
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-700">Risk factors:</p>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {verdict.riskFactors.map((factor, i) => (
                  <li key={i}>{factor}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Conditions Snapshot Card
function ConditionsCard({ conditions }: { conditions: NonNullable<AgentResponse['conditionsSnapshot']> }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
        <span>🌦️</span> Current Conditions
      </h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {conditions.temperature && (
          <div>
            <span className="text-gray-600">Temperature:</span>{' '}
            <span className="font-medium">{conditions.temperature}°F</span>
          </div>
        )}
        {conditions.weather && (
          <div>
            <span className="text-gray-600">Weather:</span>{' '}
            <span className="font-medium">{conditions.weather}</span>
          </div>
        )}
        {conditions.rainProbability !== undefined && (
          <div>
            <span className="text-gray-600">Rain:</span>{' '}
            <span className="font-medium">{conditions.rainProbability}%</span>
          </div>
        )}
        {conditions.windSpeed && (
          <div>
            <span className="text-gray-600">Wind:</span>{' '}
            <span className="font-medium">{conditions.windSpeed} mph</span>
          </div>
        )}
      </div>
      {conditions.alerts && conditions.alerts.length > 0 && (
        <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded">
          <p className="text-sm font-semibold text-red-800">⚠️ Alerts:</p>
          <ul className="text-sm text-red-700 list-disc list-inside">
            {conditions.alerts.map((alert, i) => (
              <li key={i}>{alert}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Route Advice Card
function RouteAdviceCard({ advice }: { advice: NonNullable<AgentResponse['routeAdvice']> }) {
  return (
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
      <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
        <span>🧭</span> Route & Timing
      </h3>
      <div className="space-y-2 text-sm">
        {advice.recommendedMode && (
          <p>
            <span className="text-gray-600">Recommended:</span>{' '}
            <span className="font-medium capitalize">{advice.recommendedMode}</span>
          </p>
        )}
        {advice.departureTime && (
          <p>
            <span className="text-gray-600">Leave by:</span>{' '}
            <span className="font-medium">{advice.departureTime}</span>
          </p>
        )}
        {advice.estimatedTravelTime && (
          <p>
            <span className="text-gray-600">Travel time:</span>{' '}
            <span className="font-medium">{advice.estimatedTravelTime} min</span>
          </p>
        )}
        {advice.safetyNotes && advice.safetyNotes.length > 0 && (
          <div>
            <p className="font-medium text-gray-700">Safety notes:</p>
            <ul className="list-disc list-inside text-gray-600">
              {advice.safetyNotes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          </div>
        )}
        {advice.trafficWarnings && advice.trafficWarnings.length > 0 && (
          <div>
            <p className="font-medium text-orange-700">⚠️ Traffic warnings:</p>
            <ul className="list-disc list-inside text-orange-600">
              {advice.trafficWarnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// Nearby Fixes Card
function NearbyFixesCard({ fixes }: { fixes: NonNullable<AgentResponse['nearbyFixes']> }) {
  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
        <span>🛍️</span> Nearby Resources
      </h3>
      <div className="space-y-2">
        {fixes.map((fix, i) => (
          <div key={i} className="bg-white rounded p-3 border border-green-100">
            <p className="font-medium text-gray-800">{fix.name}</p>
            <p className="text-sm text-gray-600">{fix.type}</p>
            <p className="text-sm text-gray-500">{fix.address}</p>
            {fix.estimatedDetour && (
              <p className="text-xs text-green-700 mt-1">
                +{fix.estimatedDetour} min detour
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Action Checklist Card
function ActionChecklistCard({ actions }: { actions: NonNullable<AgentResponse['whatToDoNow']> }) {
  const priorityColors = {
    high: 'border-red-200 bg-red-50',
    medium: 'border-yellow-200 bg-yellow-50',
    low: 'border-gray-200 bg-gray-50',
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <span>✅</span> What To Do Now
      </h3>
      <div className="space-y-2">
        {actions.map((action, i) => (
          <div
            key={i}
            className={`border rounded p-3 ${priorityColors[action.priority]}`}
          >
            <div className="flex items-start gap-2">
              <span className="text-sm font-semibold uppercase text-gray-500">
                {action.priority}
              </span>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{action.action}</p>
                {action.reason && (
                  <p className="text-sm text-gray-600 mt-1">{action.reason}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Visualization Card (AI-Generated by Gemini)
function VisualizationCard({ visualization }: { visualization: NonNullable<AgentResponse['visualization']> }) {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🤖</span>
        <div>
          <h3 className="font-semibold text-purple-900">AI-Generated Insights</h3>
          <p className="text-xs text-purple-600">Powered by Google Gemini</p>
        </div>
      </div>

      <h4 className="font-bold text-lg text-gray-900 mb-2">{visualization.title}</h4>
      <p className="text-sm text-gray-700 mb-4">{visualization.description}</p>

      {/* SVG Chart */}
      {visualization.svgChart && (
        <div className="bg-white rounded-lg p-4 mb-4 flex justify-center">
          <div dangerouslySetInnerHTML={{ __html: visualization.svgChart }} />
        </div>
      )}

      {/* AI Insights */}
      {visualization.insights && visualization.insights.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-purple-900">🔍 Key Insights:</p>
          <ul className="space-y-2">
            {visualization.insights.map((insight, i) => (
              <li key={i} className="text-sm text-gray-700 pl-4 border-l-2 border-purple-300">
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Context Summary Card (Collapsible)
function ContextSummaryCard({ context }: { context: NonNullable<AgentResponse['contextSummary']> }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-gray-100 border border-gray-300 rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-200 transition-colors rounded-lg"
      >
        <span className="text-sm font-medium text-gray-700">
          📊 View data sources (transparency)
        </span>
        <span className="text-gray-500">{isOpen ? '▼' : '▶'}</span>
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4 text-xs text-gray-600 space-y-2">
          {context.location && (
            <div>
              <span className="font-semibold">Location:</span> {context.location.address}
            </div>
          )}
          {context.civic311 && (
            <div>
              <span className="font-semibold">311 Requests:</span> {context.civic311.totalRequests} total, 
              {context.civic311.openRequests} open
            </div>
          )}
          {context.collisions && (
            <div>
              <span className="font-semibold">Traffic Collisions:</span> {context.collisions.totalCollisions} recent
            </div>
          )}
          {context.weather && (
            <div>
              <span className="font-semibold">Weather Source:</span> NOAA
            </div>
          )}
          {context.femaAlerts && context.femaAlerts.length > 0 && (
            <div>
              <span className="font-semibold">FEMA Alerts:</span> {context.femaAlerts.length} active
            </div>
          )}
        </div>
      )}
    </div>
  );
}
