import React, { useEffect, useRef } from 'react';

/**
 * NetworkBackground Component
 * Renders an optimized, evenly distributed network of nodes and lines.
 * Features:
 * - Jittered-Grid distribution for balanced density (no large empty patches).
 * - Radial Masking: Clearer in the center (content area), denser at edges.
 * - Parallax and Drift: Subtle organic motion.
 * - depth: Subtle vignette and center glow.
 */
const NetworkBackground = ({ opacity = 0.9, centerClearance = 0.5 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener('resize', resize);
    resize();

    // --- EVEN NODE DISTRIBUTION (Jittered Grid) ---
    // Instead of random, we use a grid to ensure balance
    const nodes = [];
    const cellSize = 180; // Distance between grid points
    const cols = Math.ceil(width / cellSize) + 2;
    const rows = Math.ceil(height / cellSize) + 2;
    const jitter = cellSize * 0.7;

    for (let i = -1; i < cols; i++) {
      for (let j = -1; j < rows; j++) {
        nodes.push({
          // Base position on grid + random jitter
          baseX: i * cellSize,
          baseY: j * cellSize,
          x: i * cellSize + (Math.random() - 0.5) * jitter,
          y: j * cellSize + (Math.random() - 0.5) * jitter,
          vx: (Math.random() - 0.5) * 0.1,
          vy: (Math.random() - 0.5) * 0.1,
          size: Math.random() * 1.6 + 0.6,
          phase: Math.random() * Math.PI * 2,
          pulseSpeed: 0.005 + Math.random() * 0.01
        });
      }
    }

    const connectionDistance = 260;
    let mouseX = width / 2;
    let mouseY = height / 2;

    const handleMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;
      const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

      nodes.forEach((node, i) => {
        // Organic drift
        node.x += node.vx;
        node.y += node.vy;

        // Subtle parallax
        const dxMouse = (mouseX - centerX) * 0.01;
        const dyMouse = (mouseY - centerY) * 0.01;
        const renderX = node.x + dxMouse;
        const renderY = node.y + dyMouse;

        // Screen wrap
        if (node.x < -cellSize) node.x = width + cellSize;
        if (node.x > width + cellSize) node.x = -cellSize;
        if (node.y < -cellSize) node.y = height + cellSize;
        if (node.y > height + cellSize) node.y = -cellSize;

        // --- RADIAL MASKING CALCULATION ---
        // Nodes/lines are more transparent in the center (steeper falloff)
        const distFromCenter = Math.sqrt((renderX - centerX) ** 2 + (renderY - centerY) ** 2);
        const centerMask = Math.min(1, (distFromCenter / (maxDist * centerClearance)) ** 2.5);

        node.phase += node.pulseSpeed;
        const pulse = Math.sin(node.phase) * 0.2 + 0.8;

        const finalNodeAlpha = 0.35 * centerMask * pulse;

        // Draw Node
        if (finalNodeAlpha > 0.01) {
          ctx.fillStyle = `rgba(255, 255, 255, ${finalNodeAlpha})`;
          ctx.beginPath();
          ctx.arc(renderX, renderY, node.size, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw Connections
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          const odxMouse = (mouseX - centerX) * 0.01;
          const odyMouse = (mouseY - centerY) * 0.01;
          const oX = other.x + odxMouse;
          const oY = other.y + odyMouse;

          const dx = renderX - oX;
          const dy = renderY - oY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            // Line alpha based on distance AND center mask
            const distAlpha = (1 - (dist / connectionDistance));
            const finalLineAlpha = 0.2 * centerMask * distAlpha;

            if (finalLineAlpha > 0.01) {
              ctx.strokeStyle = `rgba(255, 255, 255, ${finalLineAlpha})`;
              ctx.lineWidth = 0.8;
              ctx.beginPath();
              ctx.moveTo(renderX, renderY);
              ctx.lineTo(oX, oY);
              ctx.stroke();
            }
          }
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [centerClearance]);

  return (
    <canvas
      ref={canvasRef}
      id="network-overlay"
      className="fixed inset-0 pointer-events-none z-[50]"
      style={{
        filter: 'blur(0.4px)', // Even sharper
        opacity: opacity
      }}
    />
  );
};

export default NetworkBackground;
