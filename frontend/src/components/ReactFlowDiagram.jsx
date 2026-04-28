import React, { useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  getRectOfNodes,
} from 'reactflow';
import dagre from 'dagre';
import { toPng } from 'html-to-image';
import 'reactflow/dist/style.css';

import ServiceNode from './ServiceNode';

const nodeTypes = {
  service: ServiceNode,
};

// ... (existing code)

// Category-based coloring
const CATEGORY_COLORS = {
  client: { bg: '#4B5563', border: '#9CA3AF', text: '#F9FAFB' },
  network: { bg: '#1E40AF', border: '#3B82F6', text: '#DBEAFE' },
  compute: { bg: '#7C3AED', border: '#A78BFA', text: '#EDE9FE' },
  database: { bg: '#059669', border: '#10B981', text: '#D1FAE5' },
  storage: { bg: '#DC2626', border: '#EF4444', text: '#FEE2E2' },
  security: { bg: '#EA580C', border: '#F97316', text: '#FFEDD5' },
  messaging: { bg: '#DB2777', border: '#EC4899', text: '#FCE7F3' },
  observability: { bg: '#0891B2', border: '#06B6D4', text: '#CFFAFE' },
  integration: { bg: '#65A30D', border: '#84CC16', text: '#ECFCCB' },
  other: { bg: '#6B7280', border: '#9CA3AF', text: '#F3F4F6' }
};

// Service icons mapping
const SERVICE_ICONS = {
  client: '👥',
  cdn: '🌐',
  loadbalancer: '⚖️',
  apigateway: '🚪',
  websocketgateway: '🔌',
  appcompute: '⚙️',
  computeserverless: '⚡',
  computecontainer: '📦',
  computevm: '🖥️',
  batchcompute: '📊',
  mlinferenceservice: '🤖',
  relationaldatabase: '🗄️',
  nosqldatabase: '📉',
  analyticaldatabase: '📈',
  cache: '⚡',
  objectstorage: '📁',
  blockstorage: '💾',
  auth: '🔐',
  identityauth: '🔐',
  messagequeue: '📬',
  eventstreaming: '📡',
  eventbus: '🚌',
  etlorchestration: '⚙️',
  datawarehouse: '🏛️',
  logging: '📜',
  monitoring: '📊',
  paymentgateway: '💳',
  pushnotificationservice: '🔔',
  secretsmanagement: '🔑',
  waf: '🛡️',
  networking: '🔗'
};

/**
 * Apply Dagre auto-layout algorithm
 */
function getLayoutedElements(nodes, edges, direction = 'LR') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 150,
    ranksep: 300,
    marginx: 50,
    marginy: 50
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 200, height: 80 });
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
        x: nodeWithPosition.x - 100, // Center the node
        y: nodeWithPosition.y - 40,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

/**
 * Convert backend architecture data to React Flow format
 */
function convertToReactFlowFormat(architectureData) {
  if (!architectureData?.architecture) {
    return { nodes: [], edges: [] };
  }

  const { nodes: rawNodes = [], edges: rawEdges = [] } = architectureData.architecture;

  // Convert nodes
  const nodes = rawNodes.map((node) => {
    const category = node.category || 'other';
    const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.other;
    const icon = SERVICE_ICONS[node.type] || '☁️';

    return {
      id: node.id,
      type: 'default',
      data: {
        label: (
          <div className="flex flex-col items-center justify-center space-y-1 p-3">
            <div className="text-2xl">{icon}</div>
            <div className="text-xs font-bold text-center leading-tight" style={{ color: colors.text }}>
              {node.label}
            </div>
            {node.role && (
              <div className="text-[9px] opacity-70 italic" style={{ color: colors.text }}>
                {node.role.replace(/_/g, ' ')}
              </div>
            )}
          </div>
        ),
      },
      position: { x: 0, y: 0 }, // Will be set by Dagre
      style: {
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '8px',
        width: 200,
        height: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 4px 12px ${colors.border}40`,
      },
      draggable: false,
    };
  });

  // Convert edges
  const edges = rawEdges.map((edge, index) => ({
    id: `edge-${index}`,
    source: edge.from,
    target: edge.to,
    label: edge.label || '',
    type: 'smoothstep',
    animated: true,
    labelShowBg: true,
    labelBgPadding: [8, 4],
    labelBgBorderRadius: 6,
    pathOptions: { borderRadius: 20 },
    style: { stroke: '#4B5563', strokeWidth: 2 },
    labelStyle: { fill: '#E5E7EB', fontSize: 10, fontWeight: 500, letterSpacing: '0.05em' },
    labelBgStyle: { fill: '#111827', stroke: '#374151', strokeWidth: 1, fillOpacity: 0.95 },
  }));

  return { nodes, edges };
}

const ReactFlowDiagram = React.forwardRef(({ services, edges: rawEdges, provider, pattern }, ref) => {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => convertToReactFlowFormat({ architecture: { nodes: services, edges: rawEdges } }),
    [services, rawEdges, provider]
  );

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(initialNodes, initialEdges),
    [initialNodes, initialEdges]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  React.useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  // Download/Capture diagram as PNG (Full Graph Capture mechanism)
  const downloadDiagram = useCallback(() => {
    // 1. Calculate bounds of all nodes to capture entire graph, not just viewport
    const nodesBounds = getRectOfNodes(nodes);

    // Safety check if empty
    if (nodesBounds.width === 0 || nodesBounds.height === 0) return;

    // 2. Define dimensions with some padding
    const padding = 50;
    const imageWidth = nodesBounds.width + (padding * 2);
    const imageHeight = nodesBounds.height + (padding * 2);

    // 3. Transform to move graph to top-left (0,0) + padding
    const transformX = -nodesBounds.x + padding;
    const transformY = -nodesBounds.y + padding;
    const transform = `translate(${transformX}px, ${transformY}px) scale(1)`;

    const viewportElem = document.querySelector('.react-flow__viewport');

    if (!viewportElem) {
      console.error('Viewport element not found');
      return;
    }

    // Return logic for external caller (ref) OR internal download button
    const generateImage = () => {
      return toPng(viewportElem, {
        backgroundColor: '#0F172A', // Force standard background
        width: imageWidth,
        height: imageHeight,
        style: {
          width: `${imageWidth}px`,
          height: `${imageHeight}px`,
          transform: transform,
        },
        pixelRatio: 3, // High resolution (3x) for "infinite resolution" feel
      });
    };

    generateImage()
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `architecture-${provider}-${pattern}-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Failed to export diagram:', err);
        alert('Failed to export diagram: ' + err.message);
      });
  }, [nodes, provider, pattern]);

  // Expose capture method to parent via Ref
  useImperativeHandle(ref, () => ({
    captureScreenshot: async () => {
      // Same logic as download but returns promise resolving to DataURL
      const nodesBounds = getRectOfNodes(nodes);
      if (nodesBounds.width === 0) return null;

      const padding = 50;
      const imageWidth = nodesBounds.width + (padding * 2);
      const imageHeight = nodesBounds.height + (padding * 2);
      const transformX = -nodesBounds.x + padding;
      const transformY = -nodesBounds.y + padding;
      const transform = `translate(${transformX}px, ${transformY}px) scale(1)`;

      const viewportElem = document.querySelector('.react-flow__viewport');
      if (!viewportElem) throw new Error("Viewport not found");

      return toPng(viewportElem, {
        backgroundColor: '#0F172A',
        width: imageWidth,
        height: imageHeight,
        style: {
          width: `${imageWidth}px`,
          height: `${imageHeight}px`,
          transform: transform,
        },
        pixelRatio: 3,
      });
    }
  }));

  if (nodes.length === 0) {
    return (
      <div className="bg-black/20 rounded-xl p-12 min-h-[500px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <span className="material-icons text-gray-500 text-6xl">cloud_off</span>
          <p className="text-gray-400 text-lg">No architecture data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* React Flow Diagram */}
      <div className="relative bg-[#0F172A] rounded-xl border border-white/10 overflow-hidden" style={{ height: '600px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.5}
          maxZoom={2}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag
          zoomOnScroll
          preventScrolling
          nodeTypes={nodeTypes}
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
          <MiniMap
            nodeColor={(node) => {
              const style = node.style || {};
              return style.background || '#6B7280';
            }}
            maskColor="#0F172A99"
            style={{
              background: '#1F2937',
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
});

export default ReactFlowDiagram;
