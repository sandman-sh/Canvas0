'use client';

import React, { useEffect, useRef } from 'react';
import {
  Canvas,
  Rect,
  Ellipse,
  IText,
  Path,
  FabricImage,
  Shadow,
  PencilBrush,
  Point,
  filters
} from 'fabric';
import { CanvasAsset, ObjectProperties, UserCursor } from '@/lib/supabase';
import { ToolType } from './Toolbar';

// Helper: generate SVG path data for an N-pointed star
function generateStarPath(cx: number, cy: number, outerR: number, innerR: number, points: number): string {
  const steps: string[] = [];
  const total = points * 2;
  for (let i = 0; i < total; i++) {
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    steps.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  steps.push('Z');
  return steps.join(' ');
}

// Helper: generate SVG path data for an arrow line
function generateArrowPath(w: number, h: number, headType: 'one' | 'both' | 'none'): string {
  const y = h / 2;
  const headSize = Math.min(20, w * 0.15);
  let d = `M 0 ${y} L ${w} ${y}`;
  if (headType === 'one' || headType === 'both') {
    d += ` M ${w - headSize} ${y - headSize} L ${w} ${y} L ${w - headSize} ${y + headSize}`;
  }
  if (headType === 'both') {
    d += ` M ${headSize} ${y - headSize} L 0 ${y} L ${headSize} ${y + headSize}`;
  }
  return d;
}

interface DesignCanvasProps {
  assets: CanvasAsset[];
  activeTool: ToolType;
  walletAddress: string;
  collaboratorName: string;
  cursorColor: string;
  selectedAsset: CanvasAsset | null;
  onSelectAsset: (asset: CanvasAsset | null) => void;
  onUpdateAsset: (id: string, updates: Partial<CanvasAsset>) => void;
  onAddAsset: (asset: Omit<CanvasAsset, 'id'>) => Promise<CanvasAsset>;
  onDeleteAsset: (id: string) => void;
  onSelectTool: (tool: ToolType) => void;
  onTrackCursor: (x: number, y: number) => void;
  cursors: UserCursor[];
  zoom: number;
  onZoomChange: (z: number) => void;
  gridType: 'dots' | 'lines' | 'none';
  gridSize: number;
  canvasBg: string;
}

export default function DesignCanvas({
  assets,
  activeTool,
  walletAddress,
  collaboratorName,
  cursorColor,
  selectedAsset,
  onSelectAsset,
  onUpdateAsset,
  onAddAsset,
  onDeleteAsset,
  onSelectTool,
  onTrackCursor,
  cursors,
  zoom,
  onZoomChange,
  gridType,
  gridSize,
  canvasBg
}: DesignCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<Canvas | null>(null);
  const isSyncingRef = useRef<boolean>(false);
  const shaderCanvasesRef = useRef<Map<string, HTMLCanvasElement>>(new Map());

  // Refs to avoid stale closures in Fabric.js event listeners
  const assetsRef = useRef(assets);
  const walletAddressRef = useRef(walletAddress);
  const collaboratorNameRef = useRef(collaboratorName);
  const activeToolRef = useRef(activeTool);
  const selectedAssetRef = useRef(selectedAsset);
  const cursorColorRef = useRef(cursorColor);

  const onSelectAssetRef = useRef(onSelectAsset);
  const onUpdateAssetRef = useRef(onUpdateAsset);
  const onAddAssetRef = useRef(onAddAsset);
  const onDeleteAssetRef = useRef(onDeleteAsset);
  const onSelectToolRef = useRef(onSelectTool);
  const onTrackCursorRef = useRef(onTrackCursor);
  const onZoomChangeRef = useRef(onZoomChange);

  useEffect(() => { assetsRef.current = assets; }, [assets]);
  useEffect(() => { walletAddressRef.current = walletAddress; }, [walletAddress]);
  useEffect(() => { collaboratorNameRef.current = collaboratorName; }, [collaboratorName]);
  useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);
  useEffect(() => { selectedAssetRef.current = selectedAsset; }, [selectedAsset]);
  useEffect(() => { cursorColorRef.current = cursorColor; }, [cursorColor]);

  useEffect(() => { onSelectAssetRef.current = onSelectAsset; }, [onSelectAsset]);
  useEffect(() => { onUpdateAssetRef.current = onUpdateAsset; }, [onUpdateAsset]);
  useEffect(() => { onAddAssetRef.current = onAddAsset; }, [onAddAsset]);
  useEffect(() => { onDeleteAssetRef.current = onDeleteAsset; }, [onDeleteAsset]);
  useEffect(() => { onSelectToolRef.current = onSelectTool; }, [onSelectTool]);
  useEffect(() => { onTrackCursorRef.current = onTrackCursor; }, [onTrackCursor]);
  useEffect(() => { onZoomChangeRef.current = onZoomChange; }, [onZoomChange]);

  // Keyboard shortcuts and vector tool nudge behaviors
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const fCanvas = fabricCanvasRef.current;
      if (!fCanvas) return;

      // Skip event handling if typing in text inputs or textareas
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (
        targetTag === 'input' ||
        targetTag === 'textarea' ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      // Check if actively typing/editing text inside a fabric IText object
      const activeObj = fCanvas.getActiveObject() as any;
      if (activeObj && activeObj.isEditing) {
        return;
      }

      // 1. Delete / Backspace key -> Delete selected object(s)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObjects = fCanvas.getActiveObjects();
        if (activeObjects && activeObjects.length > 0) {
          e.preventDefault();
          activeObjects.forEach((obj: any) => {
            if (obj.data?.id) {
              onDeleteAssetRef.current(obj.data.id);
            }
          });
          fCanvas.discardActiveObject();
          fCanvas.renderAll();
        }
        return;
      }

      // 2. Arrow keys -> Nudge selected object(s) (Shift for 10px, Normal for 1px)
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const activeObjects = fCanvas.getActiveObjects();
        if (activeObjects && activeObjects.length > 0) {
          e.preventDefault();
          const nudgeAmount = e.shiftKey ? 10 : 1;
          
          activeObjects.forEach((obj: any) => {
            let newX = obj.left || 0;
            let newY = obj.top || 0;

            if (e.key === 'ArrowUp') newY -= nudgeAmount;
            if (e.key === 'ArrowDown') newY += nudgeAmount;
            if (e.key === 'ArrowLeft') newX -= nudgeAmount;
            if (e.key === 'ArrowRight') newX += nudgeAmount;

            obj.set({ left: newX, top: newY });
            obj.setCoords();
            
            // Sync to Supabase
            if (obj.data?.id) {
              onUpdateAssetRef.current(obj.data.id, {
                x_pos: Math.round(newX),
                y_pos: Math.round(newY)
              });
            }
          });
          
          fCanvas.renderAll();
        }
        return;
      }

      // 3. Quick tool change hotkeys
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        const key = e.key.toLowerCase();
        const toolMap: Record<string, ToolType> = {
          'v': 'select', 'h': 'hand', 'f': 'frame', 'r': 'rect',
          'o': 'ellipse', 'g': 'star', 'y': 'polygon', 'l': 'line',
          'w': 'arrow', 't': 'text', 'p': 'pen', 'n': 'sticky',
          'k': 'comment', 'e': 'eraser', 'i': 'eyedropper',
          's': 'shader', 'a': 'ai'
        };
        if (toolMap[key]) onSelectToolRef.current(toolMap[key]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Initialize Fabric Canvas
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const fCanvas = new Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: canvasBg,
      selectionColor: 'rgba(157, 78, 221, 0.15)',
      selectionBorderColor: '#9D4EDD',
      selectionLineWidth: 2,
    });

    fabricCanvasRef.current = fCanvas;

    // Resize Observer to handle window resize, sidebar toggle, or inspector open/close
    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current || !fCanvas) return;
      fCanvas.setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      });
      fCanvas.renderAll();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Event Handlers for Selection
    fCanvas.on('selection:created', () => {
      if (isSyncingRef.current) return;
      const activeObj = fCanvas.getActiveObject() as any;
      if (activeObj && activeObj.data?.id) {
        const found = assetsRef.current.find((a) => a.id === activeObj.data.id);
        if (found) onSelectAssetRef.current(found);
      }
    });

    fCanvas.on('selection:updated', () => {
      if (isSyncingRef.current) return;
      const activeObj = fCanvas.getActiveObject() as any;
      if (activeObj && activeObj.data?.id) {
        const found = assetsRef.current.find((a) => a.id === activeObj.data.id);
        if (found) onSelectAssetRef.current(found);
      }
    });

    fCanvas.on('selection:cleared', () => {
      if (isSyncingRef.current) return;
      onSelectAssetRef.current(null);
    });

    // Object Modified Handler (Sync positions & size back to Supabase)
    fCanvas.on('object:modified', (e) => {
      if (isSyncingRef.current) return;
      const obj = e.target as any;
      if (!obj || !obj.data?.id) return;

      const id = obj.data.id;
      const updates: Partial<CanvasAsset> = {
        x_pos: Math.round(obj.left || 0),
        y_pos: Math.round(obj.top || 0),
        width: Math.round((obj.width || 0) * (obj.scaleX || 1)),
        height: Math.round((obj.height || 0) * (obj.scaleY || 1)),
        rotation: Math.round(obj.angle || 0),
        properties: {
          ...obj.data.properties,
          opacity: obj.opacity !== undefined ? obj.opacity : 1,
        }
      };

      onUpdateAssetRef.current(id, updates);
    });

    // Cursor tracking / Mouse down drawing / Panning
    let isPanning = false;
    let lastPosX = 0;
    let lastPosY = 0;

    fCanvas.on('mouse:down', (opt) => {
      const evt = opt.e as any;
      // Handle Pan mode
      if (activeToolRef.current === 'hand' || evt.altKey) {
        isPanning = true;
        fCanvas.selection = false;
        lastPosX = evt.clientX;
        lastPosY = evt.clientY;
        return;
      }

      // Add assets on click depending on active tool
      const pointer = fCanvas.getScenePoint(opt.e as any);
      const creatorShort = walletAddressRef.current
        ? `${walletAddressRef.current.slice(0, 6)}...${walletAddressRef.current.slice(-4)}`
        : collaboratorNameRef.current || 'Guest';

      // Eraser tool: delete topmost object at click point
      if (activeToolRef.current === 'eraser') {
        const target = fCanvas.findTarget(opt.e as any);
        if (target && (target as any).data?.id) {
          onDeleteAssetRef.current((target as any).data.id);
        }
        return;
      }

      // Eyedropper tool: pick color from canvas pixel
      if (activeToolRef.current === 'eyedropper') {
        try {
          const ctx = fCanvas.getContext();
          const rect = (fCanvas as any).lowerCanvasEl?.getBoundingClientRect();
          if (ctx && rect) {
            const px = (opt.e as MouseEvent).clientX - rect.left;
            const py = (opt.e as MouseEvent).clientY - rect.top;
            const pixel = ctx.getImageData(Math.round(px), Math.round(py), 1, 1).data;
            const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(c => c.toString(16).padStart(2, '0')).join('');
            navigator.clipboard.writeText(hex).catch(() => {});
          }
        } catch (e) { /* ignore */ }
        return;
      }

      // Shape spawning tools
      const spawnTools = ['rect', 'ellipse', 'line', 'polygon', 'text', 'shader', 'frame', 'star', 'arrow', 'sticky', 'comment'];
      if (spawnTools.includes(activeToolRef.current)) {
        let type: CanvasAsset['type'] = 'rect';
        let content = '';
        let w = 200, h = 200;
        let properties: ObjectProperties = {
          fill: '#9D4EDD',
          strokeColor: '#cccccc',
          strokeWidth: 0,
          shadowX: 0,
          shadowY: 0,
          shadowColor: 'transparent',
          shadowBlur: 0,
          opacity: 1
        };

        if (activeToolRef.current === 'frame') {
          type = 'frame';
          w = 400; h = 300;
          properties.fill = '#ffffff';
          properties.strokeColor = '#9D4EDD';
          properties.strokeWidth = 2;
          properties.strokeDashArray = [6, 4];
          properties.strokeDashPreset = 'dashed';
          properties.clipContent = true;
          properties.cornerRadius = 8;
          content = 'Frame';
        } else if (activeToolRef.current === 'rect') {
          type = 'rect';
          properties.fill = '#9D4EDD';
        } else if (activeToolRef.current === 'ellipse') {
          type = 'ellipse';
          properties.fill = '#FFD60A';
        } else if (activeToolRef.current === 'star') {
          type = 'star';
          properties.fill = '#FF6B00';
          properties.starPoints = 5;
          properties.starInnerRadius = 0.4;
          properties.pathData = generateStarPath(100, 100, 100, 40, 5);
        } else if (activeToolRef.current === 'line') {
          type = 'line';
          properties.strokeColor = '#FF007F';
          properties.strokeWidth = 3;
          properties.fill = 'transparent';
        } else if (activeToolRef.current === 'arrow') {
          type = 'arrow';
          properties.strokeColor = '#FF007F';
          properties.strokeWidth = 3;
          properties.fill = 'transparent';
          properties.arrowHead = 'one';
          properties.pathData = generateArrowPath(200, 200, 'one');
        } else if (activeToolRef.current === 'polygon') {
          type = 'path';
          properties.fill = '#39FF14';
          properties.pathData = 'M 100 0 L 200 57 L 200 143 L 100 200 L 0 143 L 0 57 Z';
        } else if (activeToolRef.current === 'text') {
          type = 'text';
          content = 'Double click to edit';
          properties.fill = '#18181b';
          properties.fontSize = 24;
          properties.fontFamily = 'Inter';
          properties.fontWeight = 'normal';
        } else if (activeToolRef.current === 'sticky') {
          type = 'sticky';
          w = 200; h = 200;
          content = 'Note...';
          properties.fill = '#FFD60A';
          properties.stickyColor = '#FFD60A';
          properties.cornerRadius = 4;
          properties.shadowX = 3;
          properties.shadowY = 3;
          properties.shadowBlur = 8;
          properties.shadowColor = 'rgba(0,0,0,0.2)';
          properties.fontSize = 16;
          properties.fontFamily = 'Inter';
        } else if (activeToolRef.current === 'comment') {
          type = 'comment';
          w = 36; h = 36;
          content = '';
          properties.fill = '#FF007F';
          properties.commentText = '';
          properties.commentAuthor = creatorShort;
        } else if (activeToolRef.current === 'shader') {
          type = 'shader';
          content = 'GLSL Shader Node';
          properties.shaderType = 'fragment';
          properties.shaderSource = `precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  vec3 col = 0.5 + 0.5 * cos(u_time + uv.xyx + vec3(0.0, 2.0, 4.0));
  gl_FragColor = vec4(col, 1.0);
}`;
        }

        onAddAssetRef.current({
          type,
          content,
          x_pos: Math.round(pointer.x - w / 2),
          y_pos: Math.round(pointer.y - h / 2),
          width: w,
          height: h,
          rotation: 0,
          z_index: assetsRef.current.length + 1,
          properties,
          creator_id: creatorShort
        }).catch((err) => {
          console.error('Failed to add canvas shape:', err);
        });
      }
    });

    fCanvas.on('mouse:move', (opt) => {
      // Broadcast cursor pos
      const pointer = fCanvas.getScenePoint(opt.e as any);
      onTrackCursorRef.current(pointer.x, pointer.y);

      if (isPanning && opt.e) {
        const e = opt.e as any;
        const vpt = fCanvas.viewportTransform;
        if (vpt) {
          vpt[4] += e.clientX - lastPosX;
          vpt[5] += e.clientY - lastPosY;
          fCanvas.requestRenderAll();
          lastPosX = e.clientX;
          lastPosY = e.clientY;
        }
      }
    });

    fCanvas.on('mouse:up', () => {
      isPanning = false;
      fCanvas.selection = true;
    });

    // Zooming & Panning using mouse wheel / trackpad
    fCanvas.on('mouse:wheel', (opt) => {
      const evt = opt.e as any;
      
      // If holding Ctrl key, perform Zoom action
      if (evt.ctrlKey || evt.metaKey) {
        const delta = evt.deltaY;
        let newZoom = fCanvas.getZoom();
        newZoom = newZoom * (1 - delta / 1000);
        if (newZoom > 10) newZoom = 10;
        if (newZoom < 0.1) newZoom = 0.1;
        
        const point = new Point(evt.offsetX, evt.offsetY);
        fCanvas.zoomToPoint(point, newZoom);
        onZoomChangeRef.current(newZoom);
      } else {
        // Perform Pan action on canvas viewport transform (two-finger scroll or mouse scroll)
        const vpt = fCanvas.viewportTransform;
        if (vpt) {
          vpt[4] -= evt.deltaX;
          vpt[5] -= evt.deltaY;
          fCanvas.requestRenderAll();
        }
      }
      
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Sync completed freehand drawings back to Supabase
    fCanvas.on('path:created', (opt: any) => {
      const pathObj = opt.path;
      if (!pathObj) return;

      const creatorShort = walletAddressRef.current
        ? `${walletAddressRef.current.slice(0, 6)}...${walletAddressRef.current.slice(-4)}`
        : collaboratorNameRef.current || 'Guest';

      const svgPathData = pathObj.path
        .map((step: any) => step.join(' '))
        .join(' ');

      onAddAssetRef.current({
        type: 'path',
        content: 'Freehand Pen Asset',
        x_pos: Math.round(pathObj.left || 0),
        y_pos: Math.round(pathObj.top || 0),
        width: Math.round(pathObj.width || 100),
        height: Math.round(pathObj.height || 100),
        rotation: 0,
        z_index: assetsRef.current.length + 1,
        properties: {
          strokeColor: cursorColorRef.current,
          strokeWidth: 4,
          opacity: 1,
          pathData: svgPathData,
          fill: 'transparent'
        },
        creator_id: creatorShort
      }).then(() => {
        fCanvas.remove(pathObj);
      }).catch((err) => {
        console.error('Failed to save pen path:', err);
      });
    });

    return () => {
      resizeObserver.disconnect();
      fCanvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, []);

  // Handle active tool updates
  useEffect(() => {
    const fCanvas = fabricCanvasRef.current;
    if (!fCanvas) return;

    if (activeTool === 'select') {
      fCanvas.isDrawingMode = false;
      fCanvas.selection = true;
      fCanvas.getObjects().forEach((o: any) => (o.selectable = true));
    } else if (activeTool === 'pen') {
      fCanvas.isDrawingMode = true;
      const pencil = new PencilBrush(fCanvas);
      pencil.width = 4;
      pencil.color = cursorColor;
      fCanvas.freeDrawingBrush = pencil;
    } else {
      fCanvas.isDrawingMode = false;
      fCanvas.selection = false;
      fCanvas.getObjects().forEach((o: any) => (o.selectable = false));
    }
  }, [activeTool, cursorColor]);

  // Handle programmatic canvas background color changes
  useEffect(() => {
    const fCanvas = fabricCanvasRef.current;
    if (!fCanvas) return;
    fCanvas.backgroundColor = canvasBg;
    fCanvas.renderAll();
  }, [canvasBg]);

  // Setup/Render WebGL Shaders
  useEffect(() => {
    let animFrame: number;

    const renderShaderWebGL = () => {
      assets.forEach((asset) => {
        if (asset.type !== 'shader') return;
        const canvas = shaderCanvasesRef.current.get(asset.id);
        if (!canvas) return;

        const gl = canvas.getContext('webgl');
        if (!gl) return;

        const source = asset.properties.shaderSource || '';
        if (!source) return;

        const vs = `
          attribute vec2 position;
          void main() {
            gl_Position = vec4(position, 0.0, 1.0);
          }
        `;

        const fs = source;

        const compile = (type: number, src: string) => {
          const s = gl.createShader(type);
          if (!s) return null;
          gl.shaderSource(s, src);
          gl.compileShader(s);
          if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            return null;
          }
          return s;
        };

        const vShader = compile(gl.VERTEX_SHADER, vs);
        const fShader = compile(gl.FRAGMENT_SHADER, fs);
        if (!vShader || !fShader) return;

        const prog = gl.createProgram();
        if (!prog) return;
        gl.attachShader(prog, vShader);
        gl.attachShader(prog, fShader);
        gl.linkProgram(prog);

        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
          return;
        }

        gl.useProgram(prog);

        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
          -1.0, -1.0,
           1.0, -1.0,
          -1.0,  1.0,
          -1.0,  1.0,
           1.0, -1.0,
           1.0,  1.0,
        ]), gl.STATIC_DRAW);

        const posLoc = gl.getAttribLocation(prog, 'position');
        gl.enableVertexAttribArray(posLoc);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

        const uTime = gl.getUniformLocation(prog, 'u_time');
        const uRes = gl.getUniformLocation(prog, 'u_resolution');

        if (uTime) gl.uniform1f(uTime, performance.now() / 1000.0);
        if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);

        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      });

      animFrame = requestAnimationFrame(renderShaderWebGL);
    };

    renderShaderWebGL();
    return () => cancelAnimationFrame(animFrame);
  }, [assets]);

  // Sync state from Database assets to Fabric Canvas
  useEffect(() => {
    const fCanvas = fabricCanvasRef.current;
    if (!fCanvas) return;

    isSyncingRef.current = true;

    const currentObjects = fCanvas.getObjects() as any[];
    const activeId = selectedAsset?.id;

    currentObjects.forEach((obj) => {
      const id = obj.data?.id;
      if (id && !assets.some((a) => a.id === id)) {
        fCanvas.remove(obj);
        shaderCanvasesRef.current.delete(id);
      }
    });

    assets.forEach((asset) => {
      const props = asset.properties || {};
      let obj = currentObjects.find((o) => o.data?.id === asset.id);

      const defaultStrokeWidth = (asset.type === 'line' || asset.type === 'path') ? 4 : 0;
      const defaultStrokeColor = (asset.type === 'line' || asset.type === 'path') ? '#FF007F' : 'transparent';
      const strokeVal = props.strokeColor || defaultStrokeColor;
      const strokeWidthVal = props.strokeWidth !== undefined ? props.strokeWidth : defaultStrokeWidth;

      const baseOpts = {
        left: asset.x_pos,
        top: asset.y_pos,
        width: asset.width,
        height: asset.height,
        angle: asset.rotation,
        opacity: props.opacity !== undefined ? props.opacity : 1,
        selectable: activeTool === 'select',
        data: { id: asset.id, properties: props },
        lockMovementX: props.lockMovement,
        lockMovementY: props.lockMovement,
        stroke: strokeVal,
        strokeWidth: strokeWidthVal,
        shadow: props.shadowColor && props.shadowColor !== 'transparent' && (props.shadowX || props.shadowY || props.shadowBlur)
          ? new Shadow({
              color: props.shadowColor,
              blur: props.shadowBlur || 0,
              offsetX: props.shadowX !== undefined ? props.shadowX : 0,
              offsetY: props.shadowY !== undefined ? props.shadowY : 0,
            })
          : null,
      };

      if (!obj) {
        if (asset.type === 'rect') {
          obj = new Rect({
            ...baseOpts,
            fill: props.fill || '#39FF14',
            rx: props.cornerRadius || 0,
            ry: props.cornerRadius || 0,
          });
        } else if (asset.type === 'ellipse') {
          const { width: _w, height: _h, ...ellipseOpts } = baseOpts;
          obj = new Ellipse({
            ...ellipseOpts,
            rx: asset.width / 2,
            ry: asset.height / 2,
            fill: props.fill || '#9D4EDD',
          });
        } else if (asset.type === 'line') {
          obj = new Path(`M 0 ${asset.height / 2} L ${asset.width} ${asset.height / 2}`, {
            ...baseOpts,
            fill: 'transparent',
            stroke: props.strokeColor || '#FF007F',
            strokeWidth: props.strokeWidth !== undefined ? props.strokeWidth : 3,
          });
        } else if (asset.type === 'text') {
          obj = new IText(asset.content || 'Text', {
            ...baseOpts,
            fontFamily: props.fontFamily || 'Inter',
            fontSize: props.fontSize || 18,
            fontWeight: props.fontWeight || 'bold',
            fill: props.fill || '#000000',
            textAlign: (props.textAlign || 'left') as any,
          });
        } else if (asset.type === 'path' && props.pathData) {
          obj = new Path(props.pathData, {
            ...baseOpts,
            fill: props.fill || 'transparent',
            stroke: props.strokeColor || cursorColor,
            strokeWidth: props.strokeWidth || 4,
          });
        } else if (asset.type === 'image') {
          if (props.imageUrl) {
            FabricImage.fromURL(props.imageUrl).then((img) => {
              img.set(baseOpts);
              fCanvas.add(img);
              if (activeId === asset.id) {
                fCanvas.setActiveObject(img);
              }
              fCanvas.renderAll();
            });
            return;
          }
        } else if (asset.type === 'shader') {
          const canvasEl = document.createElement('canvas');
          canvasEl.width = asset.width;
          canvasEl.height = asset.height;
          shaderCanvasesRef.current.set(asset.id, canvasEl);

          obj = new FabricImage(canvasEl, {
            ...baseOpts,
          });
        } else if (asset.type === 'frame') {
          obj = new Rect({
            ...baseOpts,
            fill: props.fill || '#ffffff',
            rx: props.cornerRadius || 8,
            ry: props.cornerRadius || 8,
            strokeDashArray: props.strokeDashArray || [6, 4],
          });
        } else if (asset.type === 'star') {
          const starPath = props.pathData || generateStarPath(100, 100, 100, 40, props.starPoints || 5);
          obj = new Path(starPath, {
            ...baseOpts,
            fill: props.fill || '#FF6B00',
          });
        } else if (asset.type === 'arrow') {
          const arrowPath = props.pathData || generateArrowPath(asset.width, asset.height, props.arrowHead || 'one');
          obj = new Path(arrowPath, {
            ...baseOpts,
            fill: 'transparent',
            stroke: props.strokeColor || '#FF007F',
            strokeWidth: props.strokeWidth !== undefined ? props.strokeWidth : 3,
          });
        } else if (asset.type === 'sticky') {
          obj = new Rect({
            ...baseOpts,
            fill: props.fill || props.stickyColor || '#FFD60A',
            rx: props.cornerRadius || 4,
            ry: props.cornerRadius || 4,
          });
        } else if (asset.type === 'comment') {
          const { width: _cw, height: _ch, ...commentOpts } = baseOpts;
          obj = new Ellipse({
            ...commentOpts,
            rx: asset.width / 2,
            ry: asset.height / 2,
            fill: props.fill || '#FF007F',
          });
        }

        if (obj) {
          fCanvas.add(obj);
          if (activeId === asset.id) {
            fCanvas.setActiveObject(obj);
          }
        }
      } else {
        obj.set({
          left: asset.x_pos,
          top: asset.y_pos,
          angle: asset.rotation,
          opacity: props.opacity !== undefined ? props.opacity : 1,
          lockMovementX: props.lockMovement,
          lockMovementY: props.lockMovement,
          stroke: strokeVal,
          strokeWidth: strokeWidthVal,
          fill: props.fill || 'transparent',
          strokeDashArray: props.strokeDashArray || null,
          data: { id: asset.id, properties: props },
          shadow: props.shadowColor && props.shadowColor !== 'transparent' && (props.shadowX || props.shadowY || props.shadowBlur)
            ? new Shadow({
                color: props.shadowColor,
                blur: props.shadowBlur || 0,
                offsetX: props.shadowX !== undefined ? props.shadowX : 0,
                offsetY: props.shadowY !== undefined ? props.shadowY : 0,
              })
            : null,
        });

        // Update corner radius for rect/frame/sticky
        if (obj instanceof Rect && props.cornerRadius !== undefined) {
          obj.set({ rx: props.cornerRadius, ry: props.cornerRadius });
        }

        if (obj.width && obj.height) {
          obj.set({
            scaleX: asset.width / obj.width,
            scaleY: asset.height / obj.height,
          });
        }

        if (obj instanceof IText && asset.content !== obj.text) {
          obj.set({
            text: asset.content,
            fontFamily: props.fontFamily || 'Inter',
            fontSize: props.fontSize || 18,
            fontWeight: props.fontWeight || 'bold',
            fill: props.fill || '#000000',
            textAlign: (props.textAlign || 'left') as any,
          });
        }

        if (activeId === asset.id) {
          fCanvas.setActiveObject(obj);
        }
      }
    });

    fCanvas.renderAll();
    isSyncingRef.current = false;
  }, [assets, activeTool]);

  // Handle CSS Filters for selected Image asset
  useEffect(() => {
    const fCanvas = fabricCanvasRef.current;
    if (!fCanvas || !selectedAsset || selectedAsset.type !== 'image') return;

    const obj = fCanvas.getActiveObject();
    if (!obj || !(obj instanceof FabricImage)) return;

    const p = selectedAsset.properties || {};
    const activeFilters: any[] = [];

    if (p.grayscale) activeFilters.push(new filters.Grayscale());
    if (p.invert) activeFilters.push(new filters.Invert());
    if (p.brightness !== undefined && p.brightness !== 100) {
      activeFilters.push(new filters.Brightness({ brightness: (p.brightness - 100) / 100 }));
    }
    if (p.contrast !== undefined && p.contrast !== 100) {
      activeFilters.push(new filters.Contrast({ contrast: (p.contrast - 100) / 100 }));
    }
    if (p.saturation !== undefined && p.saturation !== 100) {
      activeFilters.push(new filters.Saturation({ saturation: (p.saturation - 100) / 100 }));
    }

    obj.filters = activeFilters;
    obj.applyFilters();
    fCanvas.renderAll();
  }, [selectedAsset]);

  // Sync selectedAsset from parent state to Fabric Canvas active selection
  useEffect(() => {
    const fCanvas = fabricCanvasRef.current;
    if (!fCanvas) return;

    const activeObj = fCanvas.getActiveObject();
    
    if (!selectedAsset) {
      if (activeObj) {
        fCanvas.discardActiveObject();
        fCanvas.renderAll();
      }
      return;
    }

    if (activeObj && (activeObj as any).data?.id === selectedAsset.id) {
      return;
    }

    const targetObj = fCanvas.getObjects().find((o: any) => o.data?.id === selectedAsset.id);
    if (targetObj) {
      const originalSelectable = targetObj.selectable;
      targetObj.selectable = true;
      fCanvas.setActiveObject(targetObj);
      targetObj.selectable = originalSelectable;
      fCanvas.renderAll();
    }
  }, [selectedAsset]);

  // Handle Zoom change programmatically
  useEffect(() => {
    const fCanvas = fabricCanvasRef.current;
    if (!fCanvas) return;
    if (Math.abs(fCanvas.getZoom() - zoom) > 0.05) {
      fCanvas.setZoom(zoom);
      fCanvas.renderAll();
    }
  }, [zoom]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none">
      {gridType !== 'none' && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              gridType === 'dots'
                ? `radial-gradient(#000000 1.5px, transparent 1.5px)`
                : `linear-gradient(to right, #00000015 1px, transparent 1px), linear-gradient(to bottom, #00000015 1px, transparent 1px)`,
            backgroundSize: `${gridSize}px ${gridSize}px`,
            opacity: 0.35,
          }}
        />
      )}

      <canvas ref={canvasRef} />

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {cursors.map((c) => (
          <div
            key={c.userId}
            className="absolute transition-all duration-75 ease-out flex flex-col items-start"
            style={{
              left: `${c.x}px`,
              top: `${c.y}px`,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
            }}
          >
            <svg
              className="w-6 h-6 drop-shadow-[2px_2px_0px_#000]"
              viewBox="0 0 24 24"
              fill={c.color}
              stroke="black"
              strokeWidth="2.5"
            >
              <path d="M4.5 3v15.2l3.8-3.8 3.1 7.2 2.7-1.2-3.1-7.2h6.2z" />
            </svg>
            <span
              className="mt-1 px-1.5 py-0.5 bg-black text-white text-[8px] font-black uppercase tracking-widest neo-border-sm"
              style={{ borderColor: c.color }}
            >
              {c.userName}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
