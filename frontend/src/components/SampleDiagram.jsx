import React, { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';

/**
 * SAMPLE DIAGRAM FOR LANDING PAGE
 * Shows a pre-configured serverless web app architecture
 */

const CATEGORY_COLORS = {
  client: { bg: '#4B5563', border: '#9CA3AF' },
  network: { bg: '#1E40AF', border: '#3B82F6' },
  compute: { bg: '#7C3AED', border: '#A78BFA' },
  database: { bg: '#059669', border: '#10B981' },
  storage: { bg: '#DC2626', border: '#EF4444' },
  security: { bg: '#EA580C', border: '#F97316' },
};

const SERVICE_ICONS = {
  client: '👥',
  cdn: '🌐',
  apigateway: '🚪',
  computeserverless: '⚡',
  relationaldatabase: '🗄️',
  objectstorage: '📁',
  identityauth: '🔐',
  cache: '⚡',
};

// Sample architecture data (Serverless Web App)
const sampleArchitecture = {
  nodes: [
    { id: 'client', label: 'Users', type: 'client', category: 'client' },
    { id: 'cdn', label: 'CDN', type: 'cdn', category: 'network' },
    { id: 'apigateway', label: 'API Gateway', type: 'apigateway', category: 'network' },
    { id: 'computeserverless', label: 'AWS Lambda', type: 'computeserverless', category: 'compute' },
    { id: 'relationaldatabase', label: 'RDS Database', type: 'relationaldatabase', category: 'database' },
    { id: 'objectstorage', label: 'S3 Storage', type: 'objectstorage', category: 'storage' },
    { id: 'identityauth', label: 'Cognito Auth', type: 'identityauth', category: 'security' },
    { id: 'cache', label: 'ElastiCache', type: 'cache', category: 'database' },
  ],
  edges: [
    { from: 'client', to: 'cdn', label: 'requests' },
    { from: 'cdn', to: 'apigateway', label: 'routes' },
    { from: 'apigateway', to: 'computeserverless', label: 'invokes' },
    { from: 'computeserverless', to: 'relationaldatabase', label: 'reads/writes' },
    { from: 'monitoring', to: 'computeserverless', label: 'monitors' },
    { from: 'computeserverless', to: 'objectstorage', label: 'stores' },
    { from: 'computeserverless', to: 'identityauth', label: 'authenticates' },
  ],
};

function getLayoutedElements(nodes, edges) {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: 'LR',
    nodesep: 80,
    ranksep: 120,
    marginx: 30,
    marginy: 30
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 180, height: 70 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 90,
        y: nodeWithPosition.y - 35,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

const SampleDiagram = () => {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes = sampleArchitecture.nodes.map((node) => {
      const colors = CATEGORY_COLORS[node.category] || CATEGORY_COLORS.client;
      const icon = SERVICE_ICONS[node.type] || '☁️';

      return {
        id: node.id,
        type: 'default',
        data: {
          label: (
            <div className="flex flex-col items-center justify-center space-y-1 p-2">
              <div className="text-xl">{icon}</div>
              <div className="text-[10px] font-bold text-center leading-tight text-white">
                {node.label}
              </div>
            </div>
          ),
        },
        position: { x: 0, y: 0 },
        style: {
          background: colors.bg,
          border: `2px solid ${colors.border}`,
          borderRadius: '10px',
          padding: '6px',
          width: 180,
          height: 70,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 12px ${colors.border}40`,
        },
        draggable: false,
      };
    });

    const edges = sampleArchitecture.edges.map((edge, index) => ({
      id: `edge-${index}`,
      source: edge.from,
      target: edge.to,
      label: edge.label,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#6B7280', strokeWidth: 2 },
      labelStyle: { fill: '#9CA3AF', fontSize: 10, fontWeight: 600 },
      labelBgStyle: { fill: '#1F2937', fillOpacity: 0.8 },
    }));

    return { nodes, edges };
  }, []);

  const { nodes, edges } = useMemo(
    () => getLayoutedElements(initialNodes, initialEdges),
    [initialNodes, initialEdges]
  );

  return (
    <div className="w-full h-[500px] bg-[#0F172A] rounded-xl border border-white/10 overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.1 }}
        minZoom={0.5}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll
        preventScrolling
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1E293B" gap={20} size={1} />
        <Controls
          showInteractive={false}
          style={{
            background: '#1F2937',
            border: '1px solid #374151',
            borderRadius: '8px',
          }}
        />
      </ReactFlow>
    </div>
  );
};

export default SampleDiagram;
