import React from 'react';
import RenderTimeline from '../components/RenderTimeline';
import StyleHeatmap from '../components/StyleHeatmap';
import VideoBriefPdf from '../components/VideoBriefPdf';
import GenerationRulesEditor from '../components/GenerationRulesEditor';

export default function CustomViewsPage() {
  return (
    <div data-testid="custom-views-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Video Views</h1>
          <p className="page-subtitle">Render timeline, style heatmap, brief PDF, and generation rules.</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <RenderTimeline />
        <StyleHeatmap />
        <VideoBriefPdf />
        <GenerationRulesEditor />
      </div>
    </div>
  );
}
