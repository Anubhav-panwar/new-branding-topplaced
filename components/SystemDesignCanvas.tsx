'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  Download,
  Share2,
  RefreshCw,
  Server,
  Database,
  Globe,
  Shield,
  Zap,
  HardDrive,
  Send,
  Move,
  Link2,
  CheckCircle2,
  Info,
  Maximize2
} from 'lucide-react';

export interface ArchitectureNode {
  id: string;
  type: 'client' | 'gateway' | 'load_balancer' | 'service' | 'cache' | 'database' | 'queue' | 'storage';
  label: string;
  tech: string;
  x: number;
  y: number;
}

export interface ArchitectureEdge {
  id: string;
  sourceId: string;
  targetId: string;
  protocol: string;
}

interface SystemDesignCanvasProps {
  onExportDiagram?: (topologyJson: string) => void;
  onSubmitToAI?: (summaryText: string) => void;
  isAISpeaking?: boolean;
}

const COMPONENT_TYPES = [
  { type: 'client', label: 'Client / Web / Mobile', icon: Globe, defaultTech: 'Next.js / iOS', color: 'from-sky-500 to-blue-600' },
  { type: 'gateway', label: 'API Gateway / CDN', icon: Shield, defaultTech: 'Kong / Cloudflare', color: 'from-amber-500 to-orange-600' },
  { type: 'load_balancer', label: 'Load Balancer', icon: Layers, defaultTech: 'AWS ALB / NGINX', color: 'from-teal-600 to-emerald-700' },
  { type: 'service', label: 'Microservice / Compute', icon: Server, defaultTech: 'Go / Node / Python', color: 'from-emerald-500 to-teal-600' },
  { type: 'cache', label: 'In-Memory Cache', icon: Zap, defaultTech: 'Redis / Memcached', color: 'from-red-500 to-rose-600' },
  { type: 'database', label: 'Primary DB / Shards', icon: Database, defaultTech: 'PostgreSQL / Mongo', color: 'from-cyan-500 to-blue-700' },
  { type: 'queue', label: 'Message Queue / Bus', icon: Move, defaultTech: 'Kafka / RabbitMQ', color: 'from-cyan-600 to-teal-700' },
  { type: 'storage', label: 'Object / Blob Storage', icon: HardDrive, defaultTech: 'AWS S3 / GCS', color: 'from-teal-500 to-emerald-700' },
] as const;

export default function SystemDesignCanvas({
  onExportDiagram,
  onSubmitToAI,
  isAISpeaking = false,
}: SystemDesignCanvasProps) {
  const [nodes, setNodes] = useState<ArchitectureNode[]>([
    { id: 'node-1', type: 'client', label: 'Web / Mobile Clients', tech: 'React / Native', x: 50, y: 140 },
    { id: 'node-2', type: 'load_balancer', label: 'Load Balancer', tech: 'AWS ALB', x: 260, y: 140 },
    { id: 'node-3', type: 'service', label: 'Core API Service', tech: 'FastAPI / Go', x: 470, y: 140 },
    { id: 'node-4', type: 'cache', label: 'Distributed Cache', tech: 'Redis Cluster', x: 680, y: 60 },
    { id: 'node-5', type: 'database', label: 'Primary Database', tech: 'PostgreSQL (Multi-AZ)', x: 680, y: 220 },
  ]);

  const [edges, setEdges] = useState<ArchitectureEdge[]>([
    { id: 'edge-1', sourceId: 'node-1', targetId: 'node-2', protocol: 'HTTPS / TLS 1.3' },
    { id: 'edge-2', sourceId: 'node-2', targetId: 'node-3', protocol: 'HTTP/2' },
    { id: 'edge-3', sourceId: 'node-3', targetId: 'node-4', protocol: 'TCP (sub-ms read)' },
    { id: 'edge-4', sourceId: 'node-3', targetId: 'node-5', protocol: 'Connection Pool' },
  ]);

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [activeProtocol, setActiveProtocol] = useState<string>('gRPC / REST');
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === id);
    if (!node || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    setSelectedNodeId(id);
    setDraggedNodeId(id);
    setDragOffset({
      x: e.clientX - canvasRect.left - node.x,
      y: e.clientY - canvasRect.top - node.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedNodeId || !canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();

    const newX = Math.max(10, Math.min(canvasRect.width - 150, e.clientX - canvasRect.left - dragOffset.x));
    const newY = Math.max(10, Math.min(canvasRect.height - 90, e.clientY - canvasRect.top - dragOffset.y));

    setNodes((prev) =>
      prev.map((n) => (n.id === draggedNodeId ? { ...n, x: newX, y: newY } : n))
    );
  };

  const handleMouseUp = () => {
    setDraggedNodeId(null);
  };

  // Add Component
  const addComponent = (type: typeof COMPONENT_TYPES[number]['type']) => {
    const config = COMPONENT_TYPES.find((c) => c.type === type)!;
    const newId = `node-${Date.now()}`;
    const newNode: ArchitectureNode = {
      id: newId,
      type: type,
      label: config.label,
      tech: config.defaultTech,
      x: 100 + Math.random() * 200,
      y: 80 + Math.random() * 180,
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newId);
  };

  // Connect Nodes
  const handleNodeClick = (id: string) => {
    if (connectingSourceId) {
      if (connectingSourceId !== id) {
        // Create new edge
        const newEdge: ArchitectureEdge = {
          id: `edge-${Date.now()}`,
          sourceId: connectingSourceId,
          targetId: id,
          protocol: activeProtocol,
        };
        setEdges((prev) => [...prev, newEdge]);
      }
      setConnectingSourceId(null);
    } else {
      setSelectedNodeId(id);
    }
  };

  // Delete Node
  const deleteSelected = () => {
    if (!selectedNodeId) return;
    setNodes((prev) => prev.filter((n) => n.id !== selectedNodeId));
    setEdges((prev) =>
      prev.filter((e) => e.sourceId !== selectedNodeId && e.targetId !== selectedNodeId)
    );
    setSelectedNodeId(null);
  };

  // Clear All
  const clearCanvas = () => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    setConnectingSourceId(null);
  };

  // Preset: Load Balancer + Sharded Database Template
  const loadPreset = (presetName: string) => {
    if (presetName === 'microservices') {
      setNodes([
        { id: 'n1', type: 'client', label: 'Web / Mobile SPA', tech: 'Next.js', x: 40, y: 150 },
        { id: 'n2', type: 'gateway', label: 'Cloudflare API Gateway', tech: 'Rate Limiter / WAF', x: 230, y: 150 },
        { id: 'n3', type: 'service', label: 'Auth & User Service', tech: 'Go (Stateless)', x: 440, y: 60 },
        { id: 'n4', type: 'service', label: 'Order Processing Service', tech: 'Node.js Event-Driven', x: 440, y: 240 },
        { id: 'n5', type: 'queue', label: 'Kafka Event Bus', tech: 'High-throughput Kafka', x: 650, y: 240 },
        { id: 'n6', type: 'database', label: 'PostgreSQL Cluster', tech: 'Multi-AZ Read Replicas', x: 650, y: 60 },
      ]);
      setEdges([
        { id: 'e1', sourceId: 'n1', targetId: 'n2', protocol: 'HTTPS' },
        { id: 'e2', sourceId: 'n2', targetId: 'n3', protocol: 'gRPC' },
        { id: 'e3', sourceId: 'n2', targetId: 'n4', protocol: 'gRPC' },
        { id: 'e4', sourceId: 'n3', targetId: 'n6', protocol: 'SQL Pool' },
        { id: 'e5', sourceId: 'n4', targetId: 'n5', protocol: 'Event Publish' },
      ]);
    }
  };

  // Submit Architecture to AI
  const handleSubmitToAI = () => {
    const summary = `Candidate Architecture Topology (${nodes.length} Components, ${edges.length} Connections):\n` +
      nodes.map(n => `- ${n.label} (${n.tech}) [${n.type.toUpperCase()}]`).join('\n') +
      `\nConnections:\n` +
      edges.map(e => {
        const src = nodes.find(n => n.id === e.sourceId)?.label || e.sourceId;
        const tgt = nodes.find(n => n.id === e.targetId)?.label || e.targetId;
        return `- ${src} ---> ${tgt} via ${e.protocol}`;
      }).join('\n');

    setIsSubmitted(true);
    if (onSubmitToAI) {
      onSubmitToAI(summary);
    }
    setTimeout(() => setIsSubmitted(false), 4000);
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#0F1422] text-slate-100 rounded-xl overflow-hidden border border-white/10 shadow-2xl">
      {/* Top Controls Toolbar */}
      <div className="px-4 py-2.5 bg-[#141A2D] border-b border-white/10 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[#F26A0A]">
            <Layers size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold tracking-wider uppercase text-slate-100">
              Interactive System Design Whiteboard
            </h3>
            <p className="text-[10px] text-slate-400">
              Drag components, connect protocols, and submit your architecture for Staff-level evaluation.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => loadPreset('microservices')}
            className="text-[11px] px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md text-slate-300 transition-colors flex items-center gap-1"
          >
            <RefreshCw size={11} />
            <span>Load Template</span>
          </button>
          {selectedNodeId && (
            <button
              onClick={deleteSelected}
              className="text-[11px] px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 rounded-md transition-colors flex items-center gap-1"
            >
              <Trash2 size={11} />
              <span>Delete Selected</span>
            </button>
          )}
          <button
            onClick={clearCanvas}
            className="text-[11px] px-2 py-1 text-slate-400 hover:text-slate-200 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={handleSubmitToAI}
            disabled={nodes.length === 0}
            className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md transition-all ${
              isSubmitted
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-[#059669] via-[#E85D04] to-[#F26A0A] text-[#041B13] font-bold shadow-emerald-500/20'
            }`}
          >
            {isSubmitted ? (
              <>
                <CheckCircle2 size={13} />
                <span>Architecture Submitted!</span>
              </>
            ) : (
              <>
                <Send size={13} />
                <span>Submit to AI Interviewer</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Component Palette Strip */}
      <div className="px-3 py-2 bg-[#121727] border-b border-white/5 flex items-center gap-1.5 overflow-x-auto text-[11px] select-none scrollbar-none">
        <span className="text-[10px] uppercase font-bold text-slate-500 mr-1 shrink-0">
          Add Block:
        </span>
        {COMPONENT_TYPES.map((comp) => {
          const Icon = comp.icon;
          return (
            <button
              key={comp.type}
              onClick={() => addComponent(comp.type)}
              className="px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#F26A0A]/50 flex items-center gap-1.5 shrink-0 transition-all text-slate-200"
            >
              <Icon size={12} className="text-[#F26A0A]" />
              <span>{comp.label}</span>
            </button>
          );
        })}
      </div>

      {/* Interactive Main Canvas Area */}
      <div
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="flex-1 relative overflow-hidden bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] bg-[#0A0D18] select-none cursor-crosshair min-h-[420px]"
      >
        {/* SVG Connector Lines / Edges */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#818CF8" />
            </marker>
          </defs>
          {edges.map((edge) => {
            const src = nodes.find((n) => n.id === edge.sourceId);
            const tgt = nodes.find((n) => n.id === edge.targetId);
            if (!src || !tgt) return null;

            const startX = src.x + 80;
            const startY = src.y + 35;
            const endX = tgt.x + 80;
            const endY = tgt.y + 35;
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;

            return (
              <g key={edge.id}>
                <line
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke="#E85D04"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  markerEnd="url(#arrowhead)"
                  opacity="0.85"
                />
                {/* Protocol badge on edge */}
                <rect
                  x={midX - 35}
                  y={midY - 9}
                  width="70"
                  height="16"
                  rx="4"
                  fill="#1E1B4B"
                  stroke="#F26A0A"
                  strokeWidth="1"
                  opacity="0.9"
                />
                <text
                  x={midX}
                  y={midY + 3}
                  textAnchor="middle"
                  fill="#F1D2B8"
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {edge.protocol}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Draggable Architecture Nodes */}
        {nodes.map((node) => {
          const compDef = COMPONENT_TYPES.find((c) => c.type === node.type) || COMPONENT_TYPES[0];
          const Icon = compDef.icon;
          const isSelected = selectedNodeId === node.id;
          const isConnectingSource = connectingSourceId === node.id;

          return (
            <div
              key={node.id}
              onMouseDown={(e) => handleMouseDown(e, node.id)}
              onClick={() => handleNodeClick(node.id)}
              style={{ left: `${node.x}px`, top: `${node.y}px` }}
              className={`absolute w-44 rounded-xl p-2.5 transition-shadow cursor-move z-10 border backdrop-blur-md ${
                isSelected
                  ? 'border-[#F26A0A] bg-[#0F141A] shadow-[0_0_20px_rgba(242,106,10,0.3)]'
                  : isConnectingSource
                  ? 'border-emerald-400 bg-[#161D32] shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-pulse'
                  : 'border-white/10 bg-[#121727]/90 hover:border-white/20 shadow-lg'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5">
                  <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${compDef.color} flex items-center justify-center text-white shadow-xs`}>
                    <Icon size={11} />
                  </div>
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    {node.type}
                  </span>
                </div>
                {/* Connect button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConnectingSourceId(node.id);
                  }}
                  title="Connect this node to another"
                  className={`text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                    isConnectingSource
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-slate-300'
                  }`}
                >
                  <Link2 size={9} />
                  <span>{isConnectingSource ? 'Select Target' : 'Link'}</span>
                </button>
              </div>

              {/* Editable Label */}
              <input
                type="text"
                value={node.label}
                onChange={(e) => {
                  const val = e.target.value;
                  setNodes((prev) =>
                    prev.map((n) => (n.id === node.id ? { ...n, label: val } : n))
                  );
                }}
                className="w-full text-xs font-semibold text-slate-100 bg-transparent border-none outline-none focus:bg-white/5 rounded px-0.5 py-0.5"
              />

              {/* Editable Tech Stack */}
              <input
                type="text"
                value={node.tech}
                onChange={(e) => {
                  const val = e.target.value;
                  setNodes((prev) =>
                    prev.map((n) => (n.id === node.id ? { ...n, tech: val } : n))
                  );
                }}
                className="w-full text-[10px] font-mono text-[#F26A0A] bg-transparent border-none outline-none focus:bg-white/5 rounded px-0.5 py-0.2"
              />
            </div>
          );
        })}

        {/* Empty Canvas Notice */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-slate-500 pointer-events-none">
            <Layers size={36} className="text-slate-600 mb-2 stroke-[1.5]" />
            <h4 className="text-sm font-semibold text-slate-400">System Design Canvas Empty</h4>
            <p className="text-xs max-w-sm mt-1 text-slate-500">
              Click any component block above (e.g. Load Balancer, Cache, Database) or click <b>Load Template</b> to begin architecting.
            </p>
          </div>
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="px-4 py-2 bg-[#101423] border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <Info size={12} className="text-[#F26A0A] shrink-0" />
          <span>Click <b>Link</b> on one component then click another component to establish a network connection.</span>
        </div>
        <div className="font-mono text-[10px] text-slate-400">
          Nodes: {nodes.length} | Connections: {edges.length}
        </div>
      </div>
    </div>
  );
}
