import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { InvestigationState, Entity, Relationship } from '../types';
import { Maximize2, Minimize2, ZoomIn, ZoomOut, RefreshCw, Download } from 'lucide-react';

interface GraphVisualizationProps {
  state: InvestigationState;
}

const GraphVisualization: React.FC<GraphVisualizationProps> = ({ state }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Entity | null>(null);

  useEffect(() => {
    if (!svgRef.current || !state.entities.length) return;

    const width = containerRef.current?.clientWidth || 800;
    const height = isFullscreen ? window.innerHeight - 100 : 500;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg.append("g");

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    const simulation = d3.forceSimulation<any>(state.entities)
      .force("link", d3.forceLink<any, any>(state.relationships).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(50));

    // Arrowhead marker
    svg.append("defs").append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "-0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("xoverflow", "visible")
      .append("svg:path")
      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", "currentColor")
      .style("stroke", "none");

    const link = g.append("g")
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.4)
      .selectAll("line")
      .data(state.relationships)
      .join("line")
      .attr("stroke-width", d => Math.sqrt(d.strength || 1) * 2)
      .attr("marker-end", "url(#arrowhead)");

    const node = g.append("g")
      .selectAll("g")
      .data(state.entities)
      .join("g")
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended))
      .on("click", (event, d) => setSelectedNode(d));

    node.append("circle")
      .attr("r", 12)
      .attr("fill", d => {
        switch (d.type) {
          case 'domain': return '#3b82f6';
          case 'user': return '#ef4444';
          case 'ip': return '#10b981';
          case 'email': return '#f59e0b';
          case 'phone': return '#8b5cf6';
          case 'crypto': return '#ec4899';
          default: return '#6b7280';
        }
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    node.append("text")
      .attr("dx", 16)
      .attr("dy", ".35em")
      .text(d => d.label)
      .attr("font-size", "10px")
      .attr("fill", "currentColor")
      .attr("class", "select-none pointer-events-none");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
    };
  }, [state.entities, state.relationships, isFullscreen]);

  const handleZoomIn = () => {
    if (svgRef.current) {
      d3.select(svgRef.current).transition().call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 1.2);
    }
  };

  const handleZoomOut = () => {
    if (svgRef.current) {
      d3.select(svgRef.current).transition().call(d3.zoom<SVGSVGElement, unknown>().scaleBy as any, 0.8);
    }
  };

  const handleReset = () => {
    if (svgRef.current) {
      d3.select(svgRef.current).transition().call(d3.zoom<SVGSVGElement, unknown>().transform as any, d3.zoomIdentity);
    }
  };

  const exportAsJSON = () => {
    const data = JSON.stringify({
      entities: state.entities,
      relationships: state.relationships
    }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `graph-export-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportAsSVG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `graph-export-${Date.now()}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportAsPNG = () => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    const width = svg.clientWidth;
    const height = svg.clientHeight;
    canvas.width = width * 2; // Higher resolution
    canvas.height = height * 2;
    
    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = '#E4E3E0'; // Background color
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `graph-export-${Date.now()}.png`;
        link.click();
      }
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div 
      ref={containerRef}
      className={`relative bg-ink/5 border border-ink/10 overflow-hidden transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[100] bg-bg' : 'h-[500px]'}`}
    >
      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <button onClick={handleZoomIn} className="p-2 bg-bg border border-ink/10 hover:bg-ink/5 transition-colors" title="Zoom In">
          <ZoomIn className="w-4 h-4" />
        </button>
        <button onClick={handleZoomOut} className="p-2 bg-bg border border-ink/10 hover:bg-ink/5 transition-colors" title="Zoom Out">
          <ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={handleReset} className="p-2 bg-bg border border-ink/10 hover:bg-ink/5 transition-colors" title="Reset View">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <div className="flex bg-bg border border-ink/10">
          <button onClick={exportAsJSON} className="p-2 hover:bg-ink/5 transition-colors border-r border-ink/10" title="Export JSON">
            <span className="text-[8px] font-bold uppercase mr-1">JSON</span>
            <Download className="w-3 h-3 inline" />
          </button>
          <button onClick={exportAsSVG} className="p-2 hover:bg-ink/5 transition-colors border-r border-ink/10" title="Export SVG">
            <span className="text-[8px] font-bold uppercase mr-1">SVG</span>
            <Download className="w-3 h-3 inline" />
          </button>
          <button onClick={exportAsPNG} className="p-2 hover:bg-ink/5 transition-colors" title="Export PNG">
            <span className="text-[8px] font-bold uppercase mr-1">PNG</span>
            <Download className="w-3 h-3 inline" />
          </button>
        </div>
        <button 
          onClick={() => setIsFullscreen(!isFullscreen)} 
          className="p-2 bg-bg border border-ink/10 hover:bg-ink/5 transition-colors"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      <svg 
        ref={svgRef} 
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:w-64 bg-bg border border-ink/20 p-4 shadow-xl font-mono text-[10px]">
          <div className="flex justify-between items-start mb-2">
            <span className="font-bold uppercase text-ink/50">Entity Details</span>
            <button onClick={() => setSelectedNode(null)} className="text-ink/50 hover:text-ink">×</button>
          </div>
          <div className="space-y-1">
            <div><span className="opacity-50">ID:</span> {selectedNode.id}</div>
            <div><span className="opacity-50">Label:</span> {selectedNode.label}</div>
            <div><span className="opacity-50">Type:</span> <span className="capitalize">{selectedNode.type}</span></div>
          </div>
        </div>
      )}

      {!state.entities.length && (
        <div className="absolute inset-0 flex items-center justify-center text-ink/30 font-mono text-sm">
          No graph data available.
        </div>
      )}

      <div className="absolute bottom-4 right-4 pointer-events-none opacity-30 text-[8px] font-mono uppercase">
        Force-Directed Relationship Graph v2.0
      </div>
    </div>
  );
};

export default GraphVisualization;
