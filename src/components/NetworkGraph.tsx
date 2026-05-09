import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { InvestigationState } from '../types';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  group: string;
  label: string;
  details?: string;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string;
  target: string;
  value: number;
}

export function NetworkGraph({ state }: { state: InvestigationState }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !tooltipRef.current) return;

    const width = 800;
    const height = 600;

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();

    const nodes: Node[] = [];
    const links: Link[] = [];

    // Add nodes for targets
    Object.entries(state.targets).forEach(([type, values]) => {
      values.forEach(val => {
        nodes.push({ 
          id: val, 
          group: type, 
          label: val,
          details: `Type: ${type.toUpperCase()}\nValue: ${val}`
        });
      });
    });

    // Add nodes for intel targets
    state.intelTargets.forEach(target => {
      nodes.push({ 
        id: target.username, 
        group: 'intel', 
        label: target.username,
        details: `Type: INTEL\nUsername: ${target.username}\nSource: ${target.source}\nStatus: ${target.status}`
      });
      
      // Create links between intel targets and domains if source mentions them
      state.targets.domains.forEach(domain => {
        if (target.source.toLowerCase().includes(domain.toLowerCase())) {
          links.push({ source: target.username, target: domain, value: 1 });
        }
      });
    });

    // Deduplicate nodes
    const uniqueNodes = Array.from(new Map(nodes.map(node => [node.id, node])).values());

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("width", "100%")
      .attr("height", "100%")
      .style("background", "transparent");

    const tooltip = d3.select(tooltipRef.current);

    const simulation = d3.forceSimulation<Node>(uniqueNodes)
      .force("link", d3.forceLink<Node, Link>(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .attr("stroke", "#141414")
      .attr("stroke-opacity", 0.3)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke-width", d => Math.sqrt(d.value));

    const node = svg.append("g")
      .attr("stroke", "#141414")
      .attr("stroke-width", 1.5)
      .selectAll("g")
      .data(uniqueNodes)
      .join("g")
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(`<div class="font-bold border-b border-bg/20 mb-1 pb-1">${d.label}</div><div class="whitespace-pre-wrap">${d.details}</div>`);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", (event.pageX + 15) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      })
      .call(d3.drag<SVGGElement, Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended) as any);

    node.append("circle")
      .attr("r", 8)
      .attr("fill", d => {
        switch(d.group) {
          case 'domains': return "#3b82f6";
          case 'usernames': return "#ef4444";
          case 'emails': return "#10b981";
          case 'intel': return "#f59e0b";
          default: return "#141414";
        }
      });

    node.append("text")
      .attr("x", 12)
      .attr("y", "0.31em")
      .text(d => d.label)
      .style("font-size", "10px")
      .style("font-family", "monospace")
      .style("fill", "#141414");

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as any).x)
        .attr("y1", d => (d.source as any).y)
        .attr("x2", d => (d.target as any).x)
        .attr("y2", d => (d.target as any).y);

      node
        .attr("transform", d => `translate(${d.x},${d.y})`);
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
  }, [state]);

  return (
    <div className="w-full h-[500px] border border-ink bg-white/50 relative overflow-hidden">
      <div className="absolute top-4 left-4 flex flex-wrap gap-4 text-[8px] font-mono uppercase font-bold">
        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full" /> Domains</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full" /> Usernames</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full" /> Emails</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-amber-500 rounded-full" /> Intel</div>
      </div>
      <svg ref={svgRef} className="w-full h-full cursor-move" />
      <div 
        ref={tooltipRef}
        className="fixed pointer-events-none bg-ink text-bg p-2 text-[10px] font-mono border border-bg/20 shadow-xl opacity-0 transition-opacity z-[100] max-w-[200px]"
      />
    </div>
  );
}
