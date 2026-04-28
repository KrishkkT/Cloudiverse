'use strict';

const dagre = require('dagre');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
let sharp;
try {
    sharp = require('sharp');
} catch (e) {
    console.warn('[DiagramExportService] sharp not found, PNG export will be disabled');
}

/**
 * DIAGRAM EXPORT SERVICE
 * 
 * Generates high-quality SVG/PNG diagrams from InfraSpec.
 * Deterministic, server-side rendered, and CDN-ready.
 */
class DiagramExportService {
    constructor() {
        this.svgTemplate = this._loadTemplate();
    }

    /**
     * Generate diagram artifacts (SVG & PNG)
     */
    async generateArtifacts(workspaceId, architectureData, provider) {
        console.log(`[DIAGRAM] Generating artifacts for workspace ${workspaceId} (${provider})`);

        const nodes = architectureData.nodes || [];
        const edges = architectureData.edges || [];
        
        // 1. Compute Layout using Dagre
        const layout = this._computeLayout(nodes, edges);
        
        // 2. Generate SVG
        const svgContent = this._renderSvg(layout, provider);
        
        // 3. Generate PNG (if sharp available)
        let pngBuffer = null;
        if (sharp) {
            try {
                pngBuffer = await sharp(Buffer.from(svgContent))
                    .png({ density: 300 }) // 300 DPI
                    .toBuffer();
                console.log(`[DIAGRAM] PNG generated successfully (${pngBuffer.length} bytes)`);
            } catch (err) {
                console.error('[DIAGRAM] PNG generation failed:', err);
            }
        }

        return {
            svg: svgContent,
            png: pngBuffer,
            hash: this._computeHash(architectureData)
        };
    }

    /**
     * Compute layout using Dagre
     */
    _computeLayout(nodes, edges) {
        const g = new dagre.graphlib.Graph();
        g.setGraph({
            rankdir: 'LR', // Left to Right
            nodesep: 80,
            ranksep: 100,
            marginx: 50,
            marginy: 50
        });
        g.setDefaultEdgeLabel(() => ({}));

        nodes.forEach(node => {
            // Nodes are 180x80
            g.setNode(node.id, { label: node.label, width: 200, height: 100, category: node.category, type: node.type });
        });

        edges.forEach(edge => {
            g.setEdge(edge.from, edge.to, { label: edge.label });
        });

        dagre.layout(g);

        return {
            graph: g.graph(),
            nodes: g.nodes().map(v => ({ id: v, ...g.node(v) })),
            edges: g.edges().map(e => ({ from: e.v, to: e.w, ...g.edge(e) }))
        };
    }

    /**
     * Render SVG string
     */
    _renderSvg(layout, provider) {
        const { graph, nodes, edges } = layout;
        const p = provider.toUpperCase();
        const brandColor = p === 'AWS' ? '#FF9900' : p === 'GCP' ? '#4285F4' : '#0078D4';
        
        const width = graph.width || 800;
        const height = graph.height || 600;

        let svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <linearGradient id="nodeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#1e293b;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#0f172a;stop-opacity:1" />
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <blur stdDeviation="5" in="SourceAlpha" />
            <offset dx="0" dy="4" result="offsetblur" />
            <flood flood-color="rgba(0,0,0,0.5)" />
            <composite in2="offsetblur" operator="in" />
            <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
            </feMerge>
        </filter>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
        </marker>
    </defs>
    
    <!-- Background -->
    <rect width="100%" height="100%" fill="#020617" />
    
    <!-- Edges -->
    <g class="edges">
        ${edges.map(edge => {
            const fromNode = nodes.find(n => n.id === edge.from);
            const toNode = nodes.find(n => n.id === edge.to);
            
            // Basic straight line for now, but Dagre provides points for polylines if needed
            // Actually, dagre points are in edge.points
            let pathData = "";
            if (edge.points && edge.points.length > 0) {
                pathData = `M ${edge.points[0].x} ${edge.points[0].y} ` + 
                           edge.points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
            } else {
                pathData = `M ${fromNode.x} ${fromNode.y} L ${toNode.x} ${toNode.y}`;
            }

            return `
            <path d="${pathData}" fill="none" stroke="#64748b" stroke-width="2" marker-end="url(#arrowhead)" />
            ${edge.label ? `
                <text x="${edge.points ? edge.points[Math.floor(edge.points.length/2)].x : (fromNode.x + toNode.x)/2}" 
                      y="${edge.points ? edge.points[Math.floor(edge.points.length/2)].y - 10 : (fromNode.y + toNode.y)/2 - 10}" 
                      fill="#94a3b8" font-family="Arial" font-size="10" text-anchor="middle" font-weight="bold">
                    ${edge.label.toUpperCase()}
                </text>` : ''}
            `;
        }).join('')}
    </g>
    
    <!-- Nodes -->
    <g class="nodes">
        ${nodes.map(node => {
            const x = node.x - node.width / 2;
            const y = node.y - node.height / 2;
            const isProvider = node.type !== 'client';

            return `
            <g transform="translate(${x}, ${y})" filter="url(#shadow)">
                <rect width="${node.width}" height="${node.height}" rx="12" fill="url(#nodeGrad)" stroke="${isProvider ? brandColor : '#334155'}" stroke-width="2" />
                
                <!-- Category Icon Placeholder -->
                <circle cx="30" cy="30" r="15" fill="${brandColor}22" />
                <text x="30" y="34" fill="${brandColor}" font-family="Arial" font-size="12" text-anchor="middle" font-weight="black">
                    ${node.category ? node.category[0].toUpperCase() : '?'}
                </text>

                <!-- Label -->
                <text x="30" y="65" fill="#f8fafc" font-family="Arial" font-size="14" font-weight="bold">
                    ${node.label}
                </text>
                <text x="30" y="82" fill="#64748b" font-family="Arial" font-size="10" font-weight="bold" text-transform="uppercase" letter-spacing="1">
                    ${node.type === 'client' ? 'EXTERNAL' : p + ' SERVICE'}
                </text>
            </g>
            `;
        }).join('')}
    </g>
    
    <!-- Logo/Watermark -->
    <text x="${width - 120}" y="${height - 20}" fill="#334155" font-family="Arial" font-size="12" font-weight="black" italic="true">
        CLOUDIVERSE™
    </text>
</svg>
        `.trim();

        return svg;
    }

    /**
     * Compute hash to detect changes
     */
    _computeHash(data) {
        const nodes = data.nodes || [];
        const edges = data.edges || [];
        const provider = data.provider || 'cloud';

        const str = JSON.stringify({
            nodes: nodes.map(n => n.id),
            edges: edges.map(e => `${e.from}-${e.to}`),
            provider: provider
        });
        return crypto.createHash('md5').update(str).digest('hex');
    }

    _loadTemplate() {
        return ""; // Simplified for now
    }
}

module.exports = new DiagramExportService();
