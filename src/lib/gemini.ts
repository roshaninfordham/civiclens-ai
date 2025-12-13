/**
 * CivicLens AI - Gemini API Integration
 * 
 * Uses Google Gemini to generate:
 * - Visual descriptions and insights from civic data
 * - Chart suggestions for data visualization
 * - Summary narratives
 */

export interface GeminiVisualization {
  chartType: 'bar' | 'line' | 'pie' | 'heatmap' | 'gauge';
  title: string;
  description: string;
  dataPoints: Array<{ label: string; value: number; }>;
  insights: string[];
}

/**
 * Generate AI-powered visual insights from civic data
 */
export async function generateVisualInsights(
  contextSummary: any
): Promise<GeminiVisualization | null> {
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      console.warn('[Gemini] API key not configured');
      return null;
    }

    // Prepare the prompt for Gemini
    const prompt = buildVisualizationPrompt(contextSummary);

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt,
            }],
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1000,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No response from Gemini');
    }

    // Parse the JSON response
    const visualization = parseVisualizationResponse(generatedText);
    return visualization;

  } catch (error) {
    console.error('[Gemini] Error generating visualization:', error);
    return null;
  }
}

/**
 * Build prompt for Gemini to generate visualization suggestions
 */
function buildVisualizationPrompt(contextSummary: any): string {
  const parts: string[] = [];

  parts.push('You are a data visualization expert analyzing civic data. Based on the following real-time civic data, suggest the most effective visualization and provide insights.');
  parts.push('');
  parts.push('Civic Data:');

  if (contextSummary.civic311) {
    parts.push(`- 311 Service Requests: ${contextSummary.civic311.totalRequests} total, ${contextSummary.civic311.openRequests} open`);
    if (contextSummary.civic311.topComplaintTypes?.length > 0) {
      parts.push('  Top complaint types:');
      contextSummary.civic311.topComplaintTypes.forEach((c: any) => {
        parts.push(`    - ${c.type}: ${c.count}`);
      });
    }
  }

  if (contextSummary.collisions) {
    parts.push(`- Traffic Collisions: ${contextSummary.collisions.totalCollisions} recent incidents`);
    parts.push(`  Injuries: ${contextSummary.collisions.injuryCount}, Fatalities: ${contextSummary.collisions.fatalityCount}`);
  }

  if (contextSummary.housingViolations) {
    parts.push(`- Housing Violations: ${contextSummary.housingViolations.totalViolations} total, ${contextSummary.housingViolations.openViolations} open`);
  }

  if (contextSummary.weather) {
    parts.push(`- Weather: ${contextSummary.weather.shortForecast}, ${contextSummary.weather.temperature}°${contextSummary.weather.temperatureUnit}`);
  }

  parts.push('');
  parts.push('Respond with ONLY a JSON object (no markdown, no extra text) in this exact format:');
  parts.push('{');
  parts.push('  "chartType": "bar" | "line" | "pie" | "gauge",');
  parts.push('  "title": "Chart title",');
  parts.push('  "description": "What this visualization shows",');
  parts.push('  "dataPoints": [');
  parts.push('    { "label": "Category 1", "value": 10 },');
  parts.push('    { "label": "Category 2", "value": 20 }');
  parts.push('  ],');
  parts.push('  "insights": [');
  parts.push('    "Key insight 1",');
  parts.push('    "Key insight 2"');
  parts.push('  ]');
  parts.push('}');

  return parts.join('\n');
}

/**
 * Parse Gemini's response into a visualization object
 */
function parseVisualizationResponse(text: string): GeminiVisualization | null {
  try {
    // Remove markdown code blocks if present
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7);
    }
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }

    const parsed = JSON.parse(cleaned.trim());

    // Validate structure
    if (!parsed.chartType || !parsed.title || !parsed.dataPoints) {
      throw new Error('Invalid visualization structure');
    }

    return parsed as GeminiVisualization;
  } catch (error) {
    console.error('[Gemini] Failed to parse response:', error);
    return null;
  }
}

/**
 * Generate a simple bar chart SVG from data points
 */
export function generateChartSVG(visualization: GeminiVisualization): string {
  if (visualization.chartType !== 'bar') {
    // For now, only implement bar charts
    return '';
  }

  const width = 400;
  const height = 300;
  const padding = 40;
  const barWidth = (width - 2 * padding) / visualization.dataPoints.length;
  const maxValue = Math.max(...visualization.dataPoints.map(d => d.value));

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
  
  // Background
  svg += `<rect width="${width}" height="${height}" fill="#f8f9fa"/>`;

  // Bars
  visualization.dataPoints.forEach((point, i) => {
    const barHeight = ((point.value / maxValue) * (height - 2 * padding));
    const x = padding + i * barWidth + barWidth * 0.1;
    const y = height - padding - barHeight;
    const w = barWidth * 0.8;

    svg += `<rect x="${x}" y="${y}" width="${w}" height="${barHeight}" fill="#3b82f6" rx="4"/>`;
    svg += `<text x="${x + w / 2}" y="${height - padding + 20}" text-anchor="middle" font-size="12" fill="#6b7280">${point.label}</text>`;
    svg += `<text x="${x + w / 2}" y="${y - 5}" text-anchor="middle" font-size="12" font-weight="bold" fill="#1f2937">${point.value}</text>`;
  });

  // Title
  svg += `<text x="${width / 2}" y="25" text-anchor="middle" font-size="16" font-weight="bold" fill="#1f2937">${visualization.title}</text>`;

  svg += '</svg>';
  return svg;
}
