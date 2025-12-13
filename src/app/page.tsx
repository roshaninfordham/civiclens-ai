/**
 * CivicLens AI - Main Page
 * 
 * The home page provides:
 * - AI-powered chat interface for safety guidance
 * - Real-time civic intelligence dashboard
 * - Seamless switching between chat and dashboard views
 */

'use client';

import { useState } from 'react';
import ChatInterface from '@/components/ChatInterface';
import CivicDashboard from '@/components/CivicDashboard';
import GradientAIChatbot from '@/components/GradientAIChatbot';

export default function Home() {
  const [activeView, setActiveView] = useState<'chat' | 'dashboard' | 'gradient'>('chat');

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Tabs */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-2xl">
                🏙️
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">CivicLens AI</h1>
                <p className="text-xs text-blue-100">Powered by DigitalOcean Gradient AI</p>
              </div>
            </div>
            
            {/* Tab Switcher */}
            <div className="flex bg-white/20 rounded-lg p-1">
              <button
                onClick={() => setActiveView('chat')}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  activeView === 'chat'
                    ? 'bg-white text-blue-600 shadow-lg'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                💬 AI Chat
              </button>
              <button
                onClick={() => setActiveView('dashboard')}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  activeView === 'dashboard'
                    ? 'bg-white text-purple-600 shadow-lg'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => setActiveView('gradient')}
                className={`px-6 py-2 rounded-md font-medium transition-all ${
                  activeView === 'gradient'
                    ? 'bg-white text-indigo-600 shadow-lg'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                🤖 Gradient Agent
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1">
        {activeView === 'chat' && <ChatInterface />}
        {activeView === 'dashboard' && <CivicDashboard />}
        {activeView === 'gradient' && <GradientAIChatbot />}
      </div>
    </div>
  );
}
