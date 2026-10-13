import React, { useState, useRef, useMemo, useEffect } from 'react';
import { MindMapData, MindMapNode } from '../types';
import { 
  Network, 
  Download, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  ChevronRight, 
  ChevronDown, 
  Share2, 
  Check, 
  ListTree,
  Sparkles,
  GitFork
} from 'lucide-react';

interface MindMapViewerProps {
  data: MindMapData;
  onAnnounce?: (msg: string) => void;
  onAskFollowUp?: (question: string) => void;
  isDark?: boolean;
}

const BRANCH_PALETTES = [
  { 
    name: 'Azul',
    bg: 'bg-blue-500', 
    text: 'text-blue-600 dark:text-blue-400', 
    border: 'border-blue-400 dark:border-blue-500', 
    stroke: '#3b82f6', 
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200' 
  },
  { 
    name: 'Esmeralda',
    bg: 'bg-emerald-500', 
    text: 'text-emerald-600 dark:text-emerald-400', 
    border: 'border-emerald-400 dark:border-emerald-500', 
    stroke: '#10b981', 
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200' 
  },
  { 
    name: 'Ámbar',
    bg: 'bg-amber-500', 
    text: 'text-amber-600 dark:text-amber-400', 
    border: 'border-amber-400 dark:border-amber-500', 
    stroke: '#f59e0b', 
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200' 
  },
  { 
    name: 'Púrpura',
    bg: 'bg-purple-500', 
    text: 'text-purple-600 dark:text-purple-400', 
    border: 'border-purple-400 dark:border-purple-500', 
    stroke: '#a855f7', 
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200' 
  },
  { 
    name: 'Rosa',
    bg: 'bg-rose-500', 
    text: 'text-rose-600 dark:text-rose-400', 
    border: 'border-rose-400 dark:border-rose-500', 
    stroke: '#f43f5e', 
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200' 
  },
  { 
    name: 'Cian',
    bg: 'bg-cyan-500', 
    text: 'text-cyan-600 dark:text-cyan-400', 
    border: 'border-cyan-400 dark:border-cyan-500', 
    stroke: '#06b6d4', 
    badge: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-200' 
  },
];

// Helper to wrap text into multiple lines for SVG
function wrapLines(text: string, maxCharsPerLine: number = 18): string[] {
  if (!text) return [];
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + (currentLine ? ' ' : '') + word).length <= maxCharsPerLine) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      if (word.length > maxCharsPerLine) {
        lines.push(word.slice(0, maxCharsPerLine - 1) + '…');
        currentLine = '';
      } else {
        currentLine = word;
      }
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines.slice(0, 3); // Max 3 lines
}

export const MindMapViewer: React.FC<MindMapViewerProps> = ({ 
  data, 
  onAnnounce,
  onAskFollowUp,
  isDark: isDarkProp,
}) => {
  const [viewMode, setViewMode] = useState<'tree' | 'radial' | 'outline'>('tree');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  const [domIsDark, setDomIsDark] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });

  // Observe theme mode changes on <html> class
  useEffect(() => {
    if (typeof MutationObserver === 'undefined') return;
    const observer = new MutationObserver(() => {
      setDomIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const isDark = isDarkProp !== undefined ? isDarkProp : domIsDark;

  const [selectedNode, setSelectedNode] = useState<{
    id: string;
    label: string;
    description?: string;
    branchName?: string;
    color?: string;
    isChild?: boolean;
    children?: any[];
  } | null>(null);

  const [expandedNodeIds, setExpandedNodeIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    data.nodes.forEach((n, idx) => {
      initial[n.id || `node-${idx}`] = true;
    });
    return initial;
  });

  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleNode = (id: string) => {
    setExpandedNodeIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.2, 2.5));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.2, 0.4));
  const handleResetView = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  // Reset pan and scale when mode changes
  useEffect(() => {
    handleResetView();
  }, [viewMode]);

  // Mouse & Touch Drag Handlers for pan
  const handlePointerDown = (e: React.PointerEvent) => {
    const target = e.target as Element;
    if (
      target.tagName === 'button' || 
      target.closest('button') || 
      target.tagName === 'rect' || 
      target.tagName === 'text' || 
      target.tagName === 'tspan' || 
      target.tagName === 'circle' ||
      target.closest('g[class*="cursor-pointer"]')
    ) {
      return;
    }
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  // Copy textual outline
  const handleCopyOutline = () => {
    let text = `🧠 MAPA MENTAL: ${data.topic}\nConcepto central: ${data.centralConcept}\n\n`;
    data.nodes.forEach((node, idx) => {
      text += `${idx + 1}. ${node.label}\n`;
      if (node.description) text += `   - ${node.description}\n`;
      if (node.children) {
        node.children.forEach((child) => {
          text += `   • ${child.label}${child.description ? `: ${child.description}` : ''}\n`;
        });
      }
      text += '\n';
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (onAnnounce) onAnnounce('Esquema del mapa mental copiado al portapapeles.');
  };

  // Download SVG
  const handleDownloadSVG = () => {
    if (!svgRef.current) return;
    try {
      const svgElement = svgRef.current;
      const serializer = new XMLSerializer();
      let source = serializer.serializeToString(svgElement);

      if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
        source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mapa-mental-${data.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      if (onAnnounce) onAnnounce('Mapa mental descargado como imagen vectorial SVG.');
    } catch (err) {
      console.error('Error downloading SVG:', err);
    }
  };

  // Theme-aware SVG Colors
  const svgTheme = useMemo(() => {
    if (isDark) {
      return {
        bg: '#020617', // slate-950
        branchFill: '#1e293b', // slate-800
        branchText: '#f8fafc', // slate-50
        branchSubtext: '#94a3b8', // slate-400
        childFill: '#0f172a', // slate-900
        childText: '#f1f5f9', // slate-100
        rootGradStart: '#1e1b4b', // deep indigo
        rootGradEnd: '#1e3a8a', // deep blue
        rootStroke: '#6366f1',
        rootText: '#f8fafc',
        rootSubtext: '#cbd5e1',
        shadowOpacity: '0.35',
      };
    }
    return {
      bg: '#f8fafc', // slate-50
      branchFill: '#ffffff', // crisp white
      branchText: '#0f172a', // slate-900
      branchSubtext: '#64748b', // slate-500
      childFill: '#ffffff', // crisp white
      childText: '#1e293b', // slate-800
      rootGradStart: '#4338ca', // vibrant indigo
      rootGradEnd: '#2563eb', // vibrant blue
      rootStroke: '#93c5fd',
      rootText: '#ffffff',
      rootSubtext: '#e0e7ff',
      shadowOpacity: '0.12',
    };
  }, [isDark]);

  // -------------------------------------------------------------
  // LAYOUT 1: BI-DIRECTIONAL TREE WITH FULL BOUNDING BOX (NO CLIPPING)
  // -------------------------------------------------------------
  const treeLayout = useMemo(() => {
    const totalNodes = data.nodes.length;
    const rightSideNodes: MindMapNode[] = [];
    const leftSideNodes: MindMapNode[] = [];

    // Distribute branches evenly left & right
    data.nodes.forEach((node, i) => {
      if (totalNodes <= 2) {
        rightSideNodes.push(node);
      } else if (i % 2 === 0) {
        rightSideNodes.push(node);
      } else {
        leftSideNodes.push(node);
      }
    });

    const isSplit = leftSideNodes.length > 0;
    
    // Geometry measurements
    const rootWidth = 220;
    const rootHeight = 84;
    const branchWidth = 190;
    const branchHeight = 54;
    const childWidth = 175;
    const childHeight = 44;
    const itemGap = 28;
    const childGap = 16;
    const horizontalSpacing = 240;
    const childHorizontalSpacing = 230;

    const centerX = isSplit ? 520 : 160;

    // Helper to layout one side
    const computeSideLayout = (nodesList: MindMapNode[], side: 'left' | 'right', startIndex: number) => {
      const xBranch = side === 'right' ? centerX + horizontalSpacing : centerX - horizontalSpacing;
      const xChild = side === 'right' ? xBranch + childHorizontalSpacing : xBranch - childHorizontalSpacing;

      const branchHeights = nodesList.map((n) => {
        const childCount = n.children ? n.children.length : 0;
        if (childCount <= 1) return Math.max(branchHeight, childHeight) + itemGap;
        return childCount * (childHeight + childGap) + itemGap;
      });

      const totalSideHeight = Math.max(
        branchHeights.reduce((acc, h) => acc + h, 0),
        320
      );

      let currentY = 50;

      const layoutItems = nodesList.map((node, i) => {
        const heightForThis = branchHeights[i];
        const centerYBranch = currentY + heightForThis / 2;
        const color = BRANCH_PALETTES[(startIndex + i) % BRANCH_PALETTES.length];

        const branchLines = wrapLines(node.label, 18);

        const childrenCoords = (node.children || []).map((child, cIdx) => {
          const count = node.children!.length;
          const childSpan = count * (childHeight + childGap) - childGap;
          const startChildY = centerYBranch - childSpan / 2 + childHeight / 2;
          const yPos = startChildY + cIdx * (childHeight + childGap);
          const childLines = wrapLines(child.label, 18);

          return {
            ...child,
            x: xChild,
            y: yPos,
            width: childWidth,
            height: childHeight,
            lines: childLines,
            color,
            parentLabel: node.label,
          };
        });

        currentY += heightForThis;

        return {
          ...node,
          x: xBranch,
          y: centerYBranch,
          width: branchWidth,
          height: branchHeight,
          lines: branchLines,
          color,
          side,
          childrenCoords,
        };
      });

      return { layoutItems, totalSideHeight };
    };

    const rightRes = computeSideLayout(rightSideNodes, 'right', 0);
    const leftRes = computeSideLayout(leftSideNodes, 'left', rightSideNodes.length);

    const maxSideHeight = Math.max(rightRes.totalSideHeight, leftRes.totalSideHeight, 400);
    const svgHeight = maxSideHeight + 100;
    const centerY = svgHeight / 2;

    let minX = centerX - rootWidth / 2 - 40;
    let maxX = centerX + rootWidth / 2 + 40;
    let minY = 20;
    let maxY = svgHeight;

    const allBranches = [...rightRes.layoutItems, ...leftRes.layoutItems];
    allBranches.forEach((b) => {
      minX = Math.min(minX, b.x - b.width / 2 - 30);
      maxX = Math.max(maxX, b.x + b.width / 2 + 30);
      minY = Math.min(minY, b.y - b.height / 2 - 20);
      maxY = Math.max(maxY, b.y + b.height / 2 + 20);

      b.childrenCoords.forEach((c) => {
        minX = Math.min(minX, c.x - c.width / 2 - 30);
        maxX = Math.max(maxX, c.x + c.width / 2 + 30);
        minY = Math.min(minY, c.y - c.height / 2 - 20);
        maxY = Math.max(maxY, c.y + c.height / 2 + 20);
      });
    });

    const viewBoxWidth = maxX - minX;
    const viewBoxHeight = maxY - minY;
    const rootLines = wrapLines(data.topic, 20);

    return {
      minX,
      minY,
      viewBoxWidth,
      viewBoxHeight,
      centerX,
      centerY,
      rootWidth,
      rootHeight,
      rootLines,
      isSplit,
      branches: allBranches,
    };
  }, [data]);

  // -------------------------------------------------------------
  // LAYOUT 2: RADIAL ORGANIC WITH BOUNDING BOX FIT
  // -------------------------------------------------------------
  const radialLayout = useMemo(() => {
    const width = 1100;
    const height = 750;
    const centerX = width / 2;
    const centerY = height / 2;

    const weights = data.nodes.map((n) => 1 + (n.children ? n.children.length * 0.75 : 0));
    const totalWeight = weights.reduce((a, b) => a + b, 0);

    let accumulatedAngle = -Math.PI / 2;

    const branches = data.nodes.map((node, i) => {
      const color = BRANCH_PALETTES[i % BRANCH_PALETTES.length];
      const sectorFraction = weights[i] / totalWeight;
      const sectorAngle = sectorFraction * 2 * Math.PI;
      const branchAngle = accumulatedAngle + sectorAngle / 2;

      const r1 = 230;
      const x = centerX + r1 * Math.cos(branchAngle);
      const y = centerY + (r1 * 0.82) * Math.sin(branchAngle);
      const branchLines = wrapLines(node.label, 17);

      const childCount = node.children ? node.children.length : 0;
      const childrenCoords = (node.children || []).map((child, cIdx) => {
        const subSectorPad = sectorAngle * 0.15;
        const subUsableAngle = sectorAngle - 2 * subSectorPad;
        const childAngle = childCount === 1 
          ? branchAngle 
          : accumulatedAngle + subSectorPad + (cIdx / (childCount - 1)) * subUsableAngle;

        const r2 = 390;
        const childX = centerX + r2 * Math.cos(childAngle);
        const childY = centerY + (r2 * 0.86) * Math.sin(childAngle);
        const childLines = wrapLines(child.label, 16);

        return {
          ...child,
          x: childX,
          y: childY,
          angle: childAngle,
          lines: childLines,
          color,
          parentLabel: node.label,
        };
      });

      accumulatedAngle += sectorAngle;

      return {
        ...node,
        x,
        y,
        angle: branchAngle,
        lines: branchLines,
        color,
        childrenCoords,
      };
    });

    const rootLines = wrapLines(data.topic, 20);

    let minX = 0;
    let maxX = width;
    let minY = 0;
    let maxY = height;

    branches.forEach((b) => {
      minX = Math.min(minX, b.x - 90);
      maxX = Math.max(maxX, b.x + 90);
      minY = Math.min(minY, b.y - 40);
      maxY = Math.max(maxY, b.y + 40);

      b.childrenCoords.forEach((c) => {
        minX = Math.min(minX, c.x - 85);
        maxX = Math.max(maxX, c.x + 85);
        minY = Math.min(minY, c.y - 30);
        maxY = Math.max(maxY, c.y + 30);
      });
    });

    minX -= 30;
    maxX += 30;
    minY -= 30;
    maxY += 30;

    return { 
      minX, 
      minY, 
      viewBoxWidth: maxX - minX, 
      viewBoxHeight: maxY - minY, 
      centerX, 
      centerY, 
      rootLines, 
      branches 
    };
  }, [data]);

  return (
    <div 
      ref={containerRef}
      className={`my-3 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm transition-all ${
        isFullscreen ? 'fixed inset-2 sm:inset-4 z-50 shadow-2xl flex flex-col' : ''
      }`}
    >
      {/* Header Bar */}
      <div className="px-3 sm:px-4 py-2.5 bg-indigo-50/80 dark:bg-slate-900 border-b border-indigo-100/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
        
        {/* Title & Topic info */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Network className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 whitespace-nowrap shrink-0">
                Mapa Mental
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate" title={data.topic}>
                {data.topic}
              </h4>
            </div>
          </div>
        </div>

        {/* Toolbar Controls - Responsive wrap layout so buttons never clip or get cut off */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0 justify-between sm:justify-end w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-indigo-100/50 dark:border-slate-800">
          
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('tree')}
              title="Vista Árbol"
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                viewMode === 'tree'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <GitFork className="w-3.5 h-3.5 shrink-0" />
              <span>Árbol</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('radial')}
              title="Vista Radial Orgánica"
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                viewMode === 'radial'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Network className="w-3.5 h-3.5 shrink-0" />
              <span>Radial</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('outline')}
              title="Vista Esquema Detallado"
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                viewMode === 'outline'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ListTree className="w-3.5 h-3.5 shrink-0" />
              <span>Esquema</span>
            </button>
          </div>

          {/* Controls: Zoom & Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Zoom controls (diagram modes) */}
            {viewMode !== 'outline' && (
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700 shrink-0">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  title="Alejar"
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleResetView}
                  title="Centrar y ajustar al 100%"
                  className="px-1.5 text-[11px] font-bold font-mono text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  {Math.round(scale * 100)}%
                </button>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  title="Acercar"
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleResetView}
                  title="Centrar y restablecer posición"
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownloadSVG}
              title="Descargar imagen vectorial SVG"
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shadow-2xs shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            </button>

            {/* Copy outline */}
            <button
              type="button"
              onClick={handleCopyOutline}
              title="Copiar esquema de texto"
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shadow-2xs shrink-0 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>

            {/* Fullscreen toggle */}
            <button
              type="button"
              onClick={() => setIsFullscreen((f) => !f)}
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition shadow-2xs shrink-0 cursor-pointer"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>

        </div>

      </div>

      {/* Main Interactive Stage */}
      <div 
        className={`relative flex-1 overflow-hidden select-none ${
          isDark ? 'bg-slate-950' : 'bg-slate-50/80'
        } ${
          isFullscreen ? 'h-[calc(100vh-140px)]' : 'h-[360px] sm:h-[460px]'
        }`}
        onPointerDown={viewMode !== 'outline' ? handlePointerDown : undefined}
        onPointerMove={viewMode !== 'outline' ? handlePointerMove : undefined}
        onPointerUp={viewMode !== 'outline' ? handlePointerUp : undefined}
        style={{ cursor: viewMode !== 'outline' ? (isDragging ? 'grabbing' : 'grab') : 'default', touchAction: 'none' }}
      >
        
        {/* VIEW 1: HORIZONTAL TREE */}
        {viewMode === 'tree' && (
          <div className="w-full h-full flex items-center justify-center p-2 sm:p-4">
            <div 
              style={{ 
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, 
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg
                ref={svgRef}
                viewBox={`${treeLayout.minX} ${treeLayout.minY} ${treeLayout.viewBoxWidth} ${treeLayout.viewBoxHeight}`}
                className="w-full h-full max-h-full max-w-full drop-shadow-sm select-none"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <filter id="treeShadow" x="-15%" y="-15%" width="130%" height="130%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity={svgTheme.shadowOpacity} floodColor={isDark ? '#000000' : '#0f172a'} />
                  </filter>
                  <linearGradient id="treeRootGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={svgTheme.rootGradStart} />
                    <stop offset="100%" stopColor={svgTheme.rootGradEnd} />
                  </linearGradient>
                </defs>

                {/* Connectors: Root to Branches */}
                {treeLayout.branches.map((b, bIdx) => {
                  const isRight = b.side === 'right';
                  const startX = isRight ? treeLayout.centerX + treeLayout.rootWidth / 2 : treeLayout.centerX - treeLayout.rootWidth / 2;
                  const endX = isRight ? b.x - b.width / 2 : b.x + b.width / 2;
                  const deltaX = (endX - startX) * 0.55;
                  const d = `M ${startX} ${treeLayout.centerY} C ${startX + deltaX} ${treeLayout.centerY}, ${endX - deltaX} ${b.y}, ${endX} ${b.y}`;

                  return (
                    <g key={`t-root-path-${bIdx}`}>
                      <path
                        d={d}
                        fill="none"
                        stroke={b.color.stroke}
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        opacity={isDark ? 0.75 : 0.85}
                      />

                      {/* Connectors: Branch to Subnodes */}
                      {b.childrenCoords.map((c, cIdx) => {
                        const bStartX = isRight ? b.x + b.width / 2 : b.x - b.width / 2;
                        const cEndX = isRight ? c.x - c.width / 2 : c.x + c.width / 2;
                        const cDeltaX = (cEndX - bStartX) * 0.5;
                        const childD = `M ${bStartX} ${b.y} C ${bStartX + cDeltaX} ${b.y}, ${cEndX - cDeltaX} ${c.y}, ${cEndX} ${c.y}`;

                        return (
                          <path
                            key={`t-child-path-${cIdx}`}
                            d={childD}
                            fill="none"
                            stroke={b.color.stroke}
                            strokeWidth="2"
                            strokeDasharray="4 3"
                            opacity={isDark ? 0.7 : 0.8}
                          />
                        );
                      })}
                    </g>
                  );
                })}

                {/* Subnodes Cards */}
                {treeLayout.branches.flatMap((b) => b.childrenCoords).map((c, cIdx) => {
                  const isSelected = selectedNode?.label === c.label;

                  return (
                    <g
                      key={`t-child-node-${cIdx}`}
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNode({
                          id: c.id || `child-${cIdx}`,
                          label: c.label,
                          description: c.description || `Concepto clave sobre "${c.label}" en el contexto de ${data.topic}.`,
                          branchName: c.parentLabel,
                          color: c.color.stroke,
                          isChild: true,
                        });
                      }}
                    >
                      <rect
                        x={c.x - c.width / 2}
                        y={c.y - c.height / 2}
                        width={c.width}
                        height={c.height}
                        rx="10"
                        fill={svgTheme.childFill}
                        stroke={isSelected ? '#38bdf8' : c.color.stroke}
                        strokeWidth={isSelected ? '2.8' : '1.8'}
                        filter="url(#treeShadow)"
                      />
                      <circle 
                        cx={c.x - c.width / 2 + 12} 
                        cy={c.y} 
                        r="4" 
                        fill={c.color.stroke} 
                      />
                      <text
                        x={c.x - c.width / 2 + 22}
                        y={c.y - (c.lines.length === 1 ? 0 : (c.lines.length - 1) * 6)}
                        fontSize="11"
                        fontWeight="600"
                        fill={svgTheme.childText}
                        className="pointer-events-none"
                      >
                        {c.lines.map((line, lIdx) => (
                          <tspan 
                            key={lIdx} 
                            x={c.x - c.width / 2 + 22} 
                            dy={lIdx === 0 ? (c.lines.length === 1 ? 4 : 0) : 13}
                          >
                            {line}
                          </tspan>
                        ))}
                      </text>
                    </g>
                  );
                })}

                {/* Main Branch Category Nodes */}
                {treeLayout.branches.map((b, bIdx) => {
                  const isSelected = selectedNode?.label === b.label;

                  return (
                    <g
                      key={`t-branch-${bIdx}`}
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNode({
                          id: b.id || `branch-${bIdx}`,
                          label: b.label,
                          description: b.description || `Categoría principal enfocada en "${b.label}" para comprender ${data.topic}.`,
                          branchName: b.label,
                          color: b.color.stroke,
                          isChild: false,
                          children: b.children,
                        });
                      }}
                    >
                      <rect
                        x={b.x - b.width / 2}
                        y={b.y - b.height / 2}
                        width={b.width}
                        height={b.height}
                        rx="12"
                        fill={svgTheme.branchFill}
                        stroke={isSelected ? '#818cf8' : b.color.stroke}
                        strokeWidth={isSelected ? '3.2' : '2.2'}
                        filter="url(#treeShadow)"
                      />
                      {/* Left accent bar */}
                      <rect
                        x={b.x - b.width / 2}
                        y={b.y - b.height / 2}
                        width="8"
                        height={b.height}
                        rx="4"
                        fill={b.color.stroke}
                      />
                      <text
                        x={b.x - b.width / 2 + 16}
                        y={b.y - (b.lines.length === 1 ? 4 : (b.lines.length - 1) * 6 + 4)}
                        fontSize="11.5"
                        fontWeight="bold"
                        fill={svgTheme.branchText}
                      >
                        {b.lines.map((line, lIdx) => (
                          <tspan 
                            key={lIdx} 
                            x={b.x - b.width / 2 + 16} 
                            dy={lIdx === 0 ? 0 : 13}
                          >
                            {line}
                          </tspan>
                        ))}
                      </text>
                      <text
                        x={b.x - b.width / 2 + 16}
                        y={b.y + b.height / 2 - 8}
                        fontSize="9.5"
                        fill={svgTheme.branchSubtext}
                        fontWeight="500"
                      >
                        {b.children ? `${b.children.length} subconceptos` : 'Concepto clave'}
                      </text>
                    </g>
                  );
                })}

                {/* Central Topic Node */}
                <g filter="url(#treeShadow)">
                  <rect
                    x={treeLayout.centerX - treeLayout.rootWidth / 2}
                    y={treeLayout.centerY - treeLayout.rootHeight / 2}
                    width={treeLayout.rootWidth}
                    height={treeLayout.rootHeight}
                    rx="18"
                    fill="url(#treeRootGrad)"
                    stroke={svgTheme.rootStroke}
                    strokeWidth="1.5"
                  />
                  <text
                    x={treeLayout.centerX}
                    y={treeLayout.centerY - 22}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="800"
                    fill="#fef08a"
                    letterSpacing="1"
                  >
                    TEMA CENTRAL
                  </text>
                  <text
                    x={treeLayout.centerX}
                    y={treeLayout.centerY - 6}
                    textAnchor="middle"
                    fontSize="12.5"
                    fontWeight="900"
                    fill={svgTheme.rootText}
                  >
                    {treeLayout.rootLines.map((line, lIdx) => (
                      <tspan 
                        key={lIdx} 
                        x={treeLayout.centerX} 
                        dy={lIdx === 0 ? 0 : 14}
                      >
                        {line}
                      </tspan>
                    ))}
                  </text>
                  <text
                    x={treeLayout.centerX}
                    y={treeLayout.centerY + treeLayout.rootHeight / 2 - 10}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="500"
                    fill={svgTheme.rootSubtext}
                  >
                    S.A.R.A Tutoría
                  </text>
                </g>
              </svg>
            </div>
          </div>
        )}

        {/* VIEW 2: RADIAL ORGANIC */}
        {viewMode === 'radial' && (
          <div className="w-full h-full flex items-center justify-center p-2 sm:p-4">
            <div 
              style={{ 
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, 
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <svg
                ref={svgRef}
                viewBox={`${radialLayout.minX} ${radialLayout.minY} ${radialLayout.viewBoxWidth} ${radialLayout.viewBoxHeight}`}
                className="w-full h-full max-h-full max-w-full drop-shadow-sm select-none"
                preserveAspectRatio="xMidYMid meet"
              >
                <defs>
                  <filter id="radialShadow" x="-15%" y="-15%" width="130%" height="130%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity={svgTheme.shadowOpacity} floodColor={isDark ? '#000000' : '#0f172a'} />
                  </filter>
                  <linearGradient id="radialRootGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={svgTheme.rootGradStart} />
                    <stop offset="100%" stopColor={svgTheme.rootGradEnd} />
                  </linearGradient>
                </defs>

                {/* Curved paths to main branches */}
                {radialLayout.branches.map((b, bIdx) => {
                  const cpX = (radialLayout.centerX + b.x) / 2;
                  const cpY = (radialLayout.centerY + b.y) / 2 + (b.y > radialLayout.centerY ? -15 : 15);

                  return (
                    <g key={`r-branch-path-${bIdx}`}>
                      <path
                        d={`M ${radialLayout.centerX} ${radialLayout.centerY} Q ${cpX} ${cpY} ${b.x} ${b.y}`}
                        fill="none"
                        stroke={b.color.stroke}
                        strokeWidth="3.2"
                        strokeLinecap="round"
                        opacity={isDark ? 0.75 : 0.85}
                      />

                      {/* Subnode connections */}
                      {b.childrenCoords.map((c, cIdx) => (
                        <line
                          key={`r-child-line-${cIdx}`}
                          x1={b.x}
                          y1={b.y}
                          x2={c.x}
                          y2={c.y}
                          stroke={b.color.stroke}
                          strokeWidth="1.8"
                          strokeDasharray="4 3"
                          opacity={isDark ? 0.7 : 0.8}
                        />
                      ))}
                    </g>
                  );
                })}

                {/* Radial Subnodes */}
                {radialLayout.branches.flatMap((b) => b.childrenCoords).map((c, cIdx) => {
                  const isSelected = selectedNode?.label === c.label;
                  const pillW = 150;
                  const pillH = 38;

                  return (
                    <g
                      key={`r-child-node-${cIdx}`}
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNode({
                          id: c.id || `child-${cIdx}`,
                          label: c.label,
                          description: c.description || `Concepto clave sobre "${c.label}" en el contexto de ${data.topic}.`,
                          branchName: c.parentLabel,
                          color: c.color.stroke,
                          isChild: true,
                        });
                      }}
                    >
                      <rect
                        x={c.x - pillW / 2}
                        y={c.y - pillH / 2}
                        width={pillW}
                        height={pillH}
                        rx="9"
                        fill={svgTheme.childFill}
                        stroke={isSelected ? '#38bdf8' : c.color.stroke}
                        strokeWidth={isSelected ? '2.8' : '1.8'}
                        filter="url(#radialShadow)"
                      />
                      <text
                        x={c.x}
                        y={c.y - (c.lines.length === 1 ? 0 : (c.lines.length - 1) * 5)}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="600"
                        fill={svgTheme.childText}
                        className="pointer-events-none"
                      >
                        {c.lines.map((line, lIdx) => (
                          <tspan 
                            key={lIdx} 
                            x={c.x} 
                            dy={lIdx === 0 ? (c.lines.length === 1 ? 3.5 : 0) : 11}
                          >
                            {line}
                          </tspan>
                        ))}
                      </text>
                    </g>
                  );
                })}

                {/* Radial Main Branch Nodes */}
                {radialLayout.branches.map((b, bIdx) => {
                  const isSelected = selectedNode?.label === b.label;
                  const boxW = 160;
                  const boxH = 50;

                  return (
                    <g
                      key={`r-branch-${bIdx}`}
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNode({
                          id: b.id || `branch-${bIdx}`,
                          label: b.label,
                          description: b.description || `Categoría principal enfocada en "${b.label}" para comprender ${data.topic}.`,
                          branchName: b.label,
                          color: b.color.stroke,
                          isChild: false,
                          children: b.children,
                        });
                      }}
                    >
                      <rect
                        x={b.x - boxW / 2}
                        y={b.y - boxH / 2}
                        width={boxW}
                        height={boxH}
                        rx="12"
                        fill={svgTheme.branchFill}
                        stroke={isSelected ? '#818cf8' : b.color.stroke}
                        strokeWidth={isSelected ? '3.2' : '2.2'}
                        filter="url(#radialShadow)"
                      />
                      <rect
                        x={b.x - boxW / 2}
                        y={b.y - boxH / 2}
                        width="7"
                        height={boxH}
                        rx="3"
                        fill={b.color.stroke}
                      />
                      <text
                        x={b.x + 3}
                        y={b.y - (b.lines.length === 1 ? 3 : (b.lines.length - 1) * 6 + 3)}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="bold"
                        fill={svgTheme.branchText}
                      >
                        {b.lines.map((line, lIdx) => (
                          <tspan 
                            key={lIdx} 
                            x={b.x + 3} 
                            dy={lIdx === 0 ? 0 : 12}
                          >
                            {line}
                          </tspan>
                        ))}
                      </text>
                      <text
                        x={b.x + 3}
                        y={b.y + boxH / 2 - 6}
                        textAnchor="middle"
                        fontSize="8.5"
                        fill={svgTheme.branchSubtext}
                        fontWeight="500"
                      >
                        {b.children ? `${b.children.length} subconceptos` : 'Concepto clave'}
                      </text>
                    </g>
                  );
                })}

                {/* Central Root Node */}
                <g filter="url(#radialShadow)">
                  <rect
                    x={radialLayout.centerX - 105}
                    y={radialLayout.centerY - 42}
                    width="210"
                    height="84"
                    rx="20"
                    fill="url(#radialRootGrad)"
                    stroke={svgTheme.rootStroke}
                    strokeWidth="1.5"
                  />
                  <text
                    x={radialLayout.centerX}
                    y={radialLayout.centerY - 20}
                    textAnchor="middle"
                    fontSize="9.5"
                    fontWeight="800"
                    fill="#fef08a"
                    letterSpacing="1"
                  >
                    TEMA CENTRAL
                  </text>
                  <text
                    x={radialLayout.centerX}
                    y={radialLayout.centerY - 4}
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="900"
                    fill={svgTheme.rootText}
                  >
                    {radialLayout.rootLines.map((line, lIdx) => (
                      <tspan 
                        key={lIdx} 
                        x={radialLayout.centerX} 
                        dy={lIdx === 0 ? 0 : 14}
                      >
                        {line}
                      </tspan>
                    ))}
                  </text>
                  <text
                    x={radialLayout.centerX}
                    y={radialLayout.centerY + 32}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="500"
                    fill={svgTheme.rootSubtext}
                  >
                    S.A.R.A Tutoría
                  </text>
                </g>
              </svg>
            </div>
          </div>
        )}

        {/* VIEW 3: DETAILED OUTLINE VIEW */}
        {viewMode === 'outline' && (
          <div className="h-full overflow-y-auto p-3 sm:p-4 space-y-3">
            <div className="p-3.5 rounded-xl bg-indigo-50/80 dark:bg-slate-900 border border-indigo-200/80 dark:border-slate-800">
              <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-400">
                Resumen Pedagógico
              </span>
              <p className="text-xs text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">
                {data.summary || data.centralConcept}
              </p>
            </div>

            <div className="space-y-2.5">
              {data.nodes.map((node, idx) => {
                const color = BRANCH_PALETTES[idx % BRANCH_PALETTES.length];
                const isExpanded = expandedNodeIds[node.id || `node-${idx}`];

                return (
                  <div 
                    key={node.id || idx}
                    className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs"
                  >
                    <button
                      type="button"
                      onClick={() => toggleNode(node.id || `node-${idx}`)}
                      className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-3 h-3 rounded-full shrink-0 ${color.bg}`} />
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {node.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400 shrink-0 ml-2">
                        {node.children && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${color.badge}`}>
                            {node.children.length} {node.children.length === 1 ? 'subconcepto' : 'subconceptos'}
                          </span>
                        )}
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 space-y-2">
                        {node.description && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-300">
                            {node.description}
                          </p>
                        )}
                        {node.children && node.children.length > 0 && (
                          <ul className="space-y-1.5 pl-2 border-l-2 border-slate-200 dark:border-slate-800">
                            {node.children.map((child, cIdx) => (
                              <li key={child.id || cIdx} className="text-xs">
                                <span className="font-semibold text-slate-900 dark:text-slate-200">
                                  • {child.label}
                                </span>
                                {child.description && (
                                  <span className="text-slate-600 dark:text-slate-400 ml-1">
                                    : {child.description}
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* Floating Node Inspector / Explanatory Card & Center Modal */}
      {selectedNode && (
        <>
          {/* Center Modal Dialog for Computer / Desktop Click */}
          <div 
            className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setSelectedNode(null)}
          >
            <div 
              className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full shadow-xs" style={{ backgroundColor: selectedNode.color || '#3b82f6' }} />
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
                    {selectedNode.isChild ? `Subconcepto de "${selectedNode.branchName}"` : 'Rama Principal'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNode(null)}
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {selectedNode.label}
                </h3>
                <div className="p-4 rounded-xl bg-indigo-50/80 dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
                    Definición General
                  </h4>
                  <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                    {selectedNode.description || `Concepto clave sobre "${selectedNode.label}" en el estudio de ${data.topic}.`}
                  </p>
                </div>

                {selectedNode.children && selectedNode.children.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Subconceptos de esta rama ({selectedNode.children.length}):
                    </h4>
                    <div className="space-y-2">
                      {selectedNode.children.map((child: any, cIdx: number) => (
                        <div key={child.id || cIdx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                          <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedNode.color || '#3b82f6' }} />
                            {child.label}
                          </span>
                          <p className="text-xs text-slate-600 dark:text-slate-300 pl-3.5 leading-relaxed">
                            {child.description || `Subconcepto perteneciente a ${selectedNode.label}.`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                {onAskFollowUp && (
                  <button
                    type="button"
                    onClick={() => {
                      const nodeLabel = selectedNode.label;
                      setSelectedNode(null);
                      onAskFollowUp(`Explícame en detalle qué es "${nodeLabel}" en el tema "${data.topic}".`);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Preguntar a S.A.R.A sobre esto</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedNode(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Card */}
          <div className="p-3 mx-3 my-2 rounded-xl bg-white dark:bg-slate-900 border-2 border-indigo-400 dark:border-indigo-600 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 shrink-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: selectedNode.color || '#3b82f6' }} />
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  {selectedNode.isChild ? `Subconcepto de "${selectedNode.branchName}"` : 'Rama Principal'}
                </span>
              </div>
              <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                {selectedNode.label}
              </h5>
              {selectedNode.description && (
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                  {selectedNode.description}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onAskFollowUp && (
                <button
                  type="button"
                  onClick={() => onAskFollowUp(`Explícame en detalle qué es "${selectedNode.label}" en el tema "${data.topic}".`)}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold flex items-center gap-1 shadow-2xs"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Preguntar a S.A.R.A</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </>
      )}

      {/* Footer Info */}
      <div className="px-3 py-1.5 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1 truncate">
          <Sparkles className="w-3 h-3 text-indigo-500" />
          Haz clic en cualquier rama o subnodo para ver su explicación completa.
        </span>
        <button
          type="button"
          onClick={handleDownloadSVG}
          className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline shrink-0 ml-2"
        >
          Guardar Imagen
        </button>
      </div>

    </div>
  );
};
