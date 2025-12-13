'use client';

import { useEffect } from 'react';

export default function GradientAIChatbot() {
  useEffect(() => {
    // Load the DigitalOcean Gradient AI chatbot widget script
    const script = document.createElement('script');
    script.src = 'https://il7z7dspshqt6cgmr7sgzvfv.agents.do-ai.run/static/chatbot/widget.js';
    script.async = true;
    
    // Set all the required data attributes
    script.setAttribute('data-agent-id', '9bbf38a1-d83e-11f0-b074-4e013e2ddde4');
    script.setAttribute('data-chatbot-id', 'GxfHoXqtUINPQTUxll0zWMVik-Oqs2s6');
    script.setAttribute('data-name', 'civiclens-agent Chatbot');
    script.setAttribute('data-primary-color', '#031B4E');
    script.setAttribute('data-secondary-color', '#E5E8ED');
    script.setAttribute('data-button-background-color', '#0061EB');
    script.setAttribute('data-starting-message', 'Hello! How can I help you with civic intelligence today?');
    script.setAttribute('data-logo', '/static/chatbot/icons/default-agent.svg');
    
    // Append script to body to initialize the chatbot widget
    document.body.appendChild(script);

    // Cleanup function to remove script on unmount
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 relative overflow-hidden">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#031B4E] to-[#0061EB] text-white px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">DigitalOcean Gradient AI Agent</h1>
          <p className="text-slate-200">Direct connection to the native AI chatbot powered by DigitalOcean's advanced reasoning capabilities</p>
        </div>
      </div>

      {/* Content Area - Chatbot will render here via the script */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-slate-600 min-h-96">
            <div className="animate-pulse">
              <p className="text-lg font-semibold mb-2">Loading DigitalOcean Gradient AI Chatbot...</p>
              <p className="text-sm">The native chatbot widget is initializing. It will appear here shortly.</p>
              <div className="mt-8 flex justify-center">
                <div className="w-12 h-12 border-4 border-[#0061EB] border-t-transparent rounded-full animate-spin"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="border-t border-slate-200 bg-white px-6 py-4">
        <div className="max-w-4xl mx-auto text-sm text-slate-600">
          <p>
            <strong>AI Agent ID:</strong> 9bbf38a1-d83e-11f0-b074-4e013e2ddde4 | 
            <strong className="ml-4">Chatbot ID:</strong> GxfHoXqtUINPQTUxll0zWMVik-Oqs2s6
          </p>
        </div>
      </div>
    </div>
  );
}
