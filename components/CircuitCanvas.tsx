import React, { useRef, useState, useEffect, useMemo } from 'react';
import { GRID_SIZE, NODE_DEFINITIONS } from '../constants';
import { CircuitState, NodeData, NodeType, Wire, Point, WiringState } from '../types';
import { GateShape } from './GateShapes';
import { getNodeDimensions, getInputPorts, getOutputPorts } from '../utils/componentUtils';
import { AlertTriangle, Info, X, Settings2 } from 'lucide-react';
import { useTheme } from './ThemeContext';

interface CircuitCanvasProps {
    circuit: CircuitState;
    onUpdateCircuit: (nodes: NodeData[], wires: Wire[]) => void;
    onCommit: () => void;
    selectedId: string | null;
    setSelectedId: (id: string | null) => void;
    pendingComponent: NodeType | null;
    setPendingComponent: (type: NodeType | null) => void;
    toolMode: 'move' | 'interact' | 'junction';
    wireMode: 'manhattan' | 'bezier';
    isSimulating: boolean;
    validationResult: {
        valid: boolean;
        messages: string[];
        invalidNodeIds: string[];
        floatingInputs: { nodeId: string; index: number }[];
    } | null;
    setValidationResult: (res: any) => void;
    onOpenProperties?: () => void;
    intersectionLogicEnabled: boolean;
}

const getIntersection = (p1: Point, p2: Point, p3: Point, p4: Point): Point | null => {
    const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
    if (denom === 0) return null; 
    const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
    const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;
    if (ua > 0.01 && ua < 0.99 && ub > 0.01 && ub < 0.99) {
        return {
            x: p1.x + ua * (p2.x - p1.x),
            y: p1.y + ua * (p2.y - p1.y)
        };
    }
    return null;
};

export const CircuitCanvas: React.FC<CircuitCanvasProps> = ({ 
    circuit, onUpdateCircuit, onCommit,
    selectedId, setSelectedId,
    pendingComponent, setPendingComponent,
    toolMode, wireMode, isSimulating,
    validationResult, setValidationResult,
    onOpenProperties,
    intersectionLogicEnabled
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [wiring, setWiring] = useState<WiringState | null>(null);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });

  const getManhattanPoints = (x1: number, y1: number, x2: number, y2: number): Point[] => {
    const dx = x2 - x1;
    if (dx > 20) {
        const midX = (x1 + x2) / 2;
        return [{x: x1, y: y1}, {x: midX, y: y1}, {x: midX, y: y2}, {x: x2, y: y2}];
    }
    const stub = 20;
    const midY = (y1 + y2) / 2;
    return [{x: x1, y: y1}, {x: x1 + stub, y: y1}, {x: x1 + stub, y: midY}, {x: x2 - stub, y: midY}, {x: x2 - stub, y: y2}, {x: x2, y: y2}];
  };

  const wireIntersections = useMemo(() => {
    if (!intersectionLogicEnabled || wireMode !== 'manhattan') return [];
    
    const results: { point: Point, wire1: Wire, wire2: Wire }[] = [];
    const wires = circuit.wires;
    
    for (let i = 0; i < wires.length; i++) {
        for (let j = i + 1; j < wires.length; j++) {
            const w1 = wires[i];
            const w2 = wires[j];
            const s1 = circuit.nodes.find(n => n.id === w1.sourceNodeId);
            const t1 = circuit.nodes.find(n => n.id === w1.targetNodeId);
            const s2 = circuit.nodes.find(n => n.id === w2.sourceNodeId);
            const t2 = circuit.nodes.find(n => n.id === w2.targetNodeId);
            if (!s1 || !t1 || !s2 || !t2) continue;

            const p1 = s1.position.x + getOutputPorts(s1)[w1.sourceOutputIndex].x;
            const q1 = s1.position.y + getOutputPorts(s1)[w1.sourceOutputIndex].y;
            const p2 = t1.position.x + getInputPorts(t1)[w1.targetInputIndex].x;
            const q2 = t1.position.y + getInputPorts(t1)[w1.targetInputIndex].y;

            const p3 = s2.position.x + getOutputPorts(s2)[w2.sourceOutputIndex].x;
            const q3 = s2.position.y + getOutputPorts(s2)[w2.sourceOutputIndex].y;
            const p4 = t2.position.x + getInputPorts(t2)[w2.targetInputIndex].x;
            const q4 = t2.position.y + getInputPorts(t2)[w2.targetInputIndex].y;

            const pts1 = getManhattanPoints(p1, q1, p2, q2);
            const pts2 = getManhattanPoints(p3, q3, p4, q4);

            for (let a = 0; a < pts1.length - 1; a++) {
                for (let b = 0; b < pts2.length - 1; b++) {
                    const intersect = getIntersection(pts1[a], pts1[a+1], pts2[b], pts2[b+1]);
                    if (intersect) {
                        const alreadyJunctioned = circuit.nodes.some(n => 
                            n.type === 'JUNCTION' && 
                            Math.abs(n.position.x + 5 - intersect.x) < 2 && 
                            Math.abs(n.position.y + 5 - intersect.y) < 2
                        );
                        if (!alreadyJunctioned) {
                            results.push({ point: intersect, wire1: w1, wire2: w2 });
                        }
                    }
                }
            }
        }
    }
    return results;
  }, [circuit, intersectionLogicEnabled, wireMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            if (pendingComponent) setPendingComponent(null);
            if (wiring) setWiring(null);
            if (selectedId) setSelectedId(null);
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingComponent, wiring, selectedId, setPendingComponent, setSelectedId]);

  const addNode = (type: NodeType, x: number, y: number) => {
    onCommit();
    const def = NODE_DEFINITIONS[type];
    const snapX = Math.round(x / GRID_SIZE) * GRID_SIZE;
    const snapY = Math.round(y / GRID_SIZE) * GRID_SIZE;
    
    const newNode: NodeData = {
      id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      position: { x: snapX, y: snapY },
      inputs: Array(def.inputs).fill(false),
      outputs: Array(def.outputs).fill(false),
      internalState: {},
      properties: { label: '', labelPosition: 'Top', inputCount: def.inputs, propagationDelay: 0, initialState: false, romValue: false, interval: type === 'CLOCK' ? 20 : 0 }
    };

    onUpdateCircuit([...circuit.nodes, newNode], circuit.wires);
    setSelectedId(newNode.id);
  };

  const handlePointerDown = (e: React.PointerEvent, id: string) => {
    if (e.button !== 0) return; 
    e.stopPropagation();
    setSelectedId(id);
    
    if (wiring || pendingComponent) return; 

    const node = circuit.nodes.find(n => n.id === id);
    if (!node) return;

    const isInteractive = ['SWITCH', 'BUTTON', 'INPUT_2BIT', 'INPUT_4BIT', 'INPUT_8BIT', 'INPUT_16BIT'].includes(node.type);
    
    // DISTINCT INTERACT MODE: Only allow interaction if explicitly in interact mode or simulation is running
    if (toolMode === 'interact' || isSimulating) {
        if (isInteractive) {
            if (!isSimulating) onCommit();
            let toggledNodes = circuit.nodes;

            if (node.type.startsWith('INPUT_')) {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                const relY = e.clientY - rect.top; 
                const relX = e.clientX - rect.left;
                const { width, height } = getNodeDimensions(node);
                const bitCount = node.outputs.length;

                if (relY < 25) {
                    const inputVal = window.prompt(`Set Value for ${bitCount}-bit Input:`);
                    if (inputVal !== null) {
                        let val = parseInt(inputVal);
                        if (!isNaN(val)) {
                            const newOutputs = [];
                            for(let i=0; i<bitCount; i++) { newOutputs.push(!!((val >> i) & 1)); }
                            toggledNodes = circuit.nodes.map(n => n.id === id ? { ...n, outputs: newOutputs } : n);
                            onUpdateCircuit(toggledNodes, circuit.wires);
                        }
                    }
                    return;
                }

                let bitIndexToCheck = -1;
                if (relY > height - 30) {
                    const bitWidth = 10;
                    const bitSpacing = 2;
                    const nibbleGap = 6;
                    const totalWidth = bitCount * bitWidth + (bitCount - 1) * bitSpacing + Math.floor((bitCount - 1) / 4) * nibbleGap;
                    const startX = (width - totalWidth) / 2 + bitWidth / 2;
                    for (let i = 0; i < bitCount; i++) {
                        const nibblesBefore = Math.floor(i / 4);
                        const xPos = startX + i * (bitWidth + bitSpacing) + nibblesBefore * nibbleGap;
                        if (Math.abs(relX - xPos) < 10) { bitIndexToCheck = bitCount - 1 - i; break; }
                    }
                } else {
                    const rowIdx = Math.floor((relY - 25) / 20);
                    if (rowIdx >= 0 && rowIdx < bitCount) bitIndexToCheck = rowIdx;
                }
                
                if (bitIndexToCheck >= 0 && bitIndexToCheck < bitCount) {
                    toggledNodes = circuit.nodes.map(n => {
                        if (n.id === id) {
                            const newOutputs = [...n.outputs];
                            newOutputs[bitIndexToCheck] = !newOutputs[bitIndexToCheck];
                            return { ...n, outputs: newOutputs };
                        }
                        return n;
                    });
                }
            } else {
                toggledNodes = circuit.nodes.map(n => n.id === id ? { ...n, outputs: [!n.outputs[0]] } : n);
            }
            onUpdateCircuit(toggledNodes, circuit.wires);
            return;
        }
        
        // If in interact mode but not an interactive component, do nothing (prevent accidental drag)
        if (toolMode === 'interact') return;
    }

    // DISTINCT MOVE MODE: Only allow dragging if in move or junction mode
    if (toolMode === 'move' || toolMode === 'junction') {
        onCommit();
        setDraggingNodeId(id);
        const rect = containerRef.current!.getBoundingClientRect();
        setDragOffset({ x: e.clientX - rect.left - node.position.x, y: e.clientY - rect.top - node.position.y });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    if (draggingNodeId) {
        const snapX = Math.round((x - dragOffset.x) / GRID_SIZE) * GRID_SIZE;
        const snapY = Math.round((y - dragOffset.y) / GRID_SIZE) * GRID_SIZE;
        const updatedNodes = circuit.nodes.map(n => n.id === draggingNodeId ? { ...n, position: { x: snapX, y: snapY } } : n);
        onUpdateCircuit(updatedNodes, circuit.wires);
    }
  };

  const handlePointerUp = () => {
    setDraggingNodeId(null);
    setWiring(null);
  };

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      setSelectedId(id);
      if (onOpenProperties) onOpenProperties();
  };

  const startWiring = (e: React.PointerEvent, nodeId: string, outputIndex: number) => {
    e.stopPropagation();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setWiring({ sourceNodeId: nodeId, sourceOutputIndex: outputIndex, startPoint: { x: e.clientX - rect.left, y: e.clientY - rect.top }, active: true });
  };

  const completeWiring = (e: React.PointerEvent, targetNodeId: string, inputIndex: number) => {
    e.stopPropagation();
    if (!wiring || wiring.sourceNodeId === targetNodeId) { setWiring(null); return; }
    onCommit();
    const exists = circuit.wires.some(w => w.targetNodeId === targetNodeId && w.targetInputIndex === inputIndex);
    let newWires = exists ? circuit.wires.filter(w => !(w.targetNodeId === targetNodeId && w.targetInputIndex === inputIndex)) : [...circuit.wires];
    newWires.push({ id: `wire-${Date.now()}`, sourceNodeId: wiring.sourceNodeId, sourceOutputIndex: wiring.sourceOutputIndex, targetNodeId: targetNodeId, targetInputIndex: inputIndex, state: false });
    onUpdateCircuit(circuit.nodes, newWires);
    setWiring(null);
  };

  const handleWireClick = (e: React.PointerEvent, wire: Wire) => {
    e.stopPropagation();
    setSelectedId(wire.id);
    if (toolMode === 'junction') {
        const rect = containerRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        onCommit();
        createJunctionAtPoint({ x, y }, wire);
    }
  };

  const createJunctionAtPoint = (point: Point, wire1: Wire, wire2?: Wire) => {
    const snapX = Math.round(point.x / GRID_SIZE) * GRID_SIZE;
    const snapY = Math.round(point.y / GRID_SIZE) * GRID_SIZE;
    const junctionId = `node-${Date.now()}-junction`;
    const newJunction: NodeData = { id: junctionId, type: 'JUNCTION', position: { x: snapX - 5, y: snapY - 5 }, inputs: [false], outputs: [false], properties: { label: '' } };
    
    const wire1_1: Wire = { id: `wire-${Date.now()}-1a`, sourceNodeId: wire1.sourceNodeId, sourceOutputIndex: wire1.sourceOutputIndex, targetNodeId: junctionId, targetInputIndex: 0, state: wire1.state };
    const wire1_2: Wire = { id: `wire-${Date.now()}-1b`, sourceNodeId: junctionId, sourceOutputIndex: 0, targetNodeId: wire1.targetNodeId, targetInputIndex: wire1.targetInputIndex, state: wire1.state };
    
    let newWires = circuit.wires.filter(w => w.id !== wire1.id).concat([wire1_1, wire1_2]);
    
    if (wire2) {
        const wire2_1: Wire = { id: `wire-${Date.now()}-2a`, sourceNodeId: wire2.sourceNodeId, sourceOutputIndex: wire2.sourceOutputIndex, targetNodeId: junctionId, targetInputIndex: 0, state: wire2.state };
        const wire2_2: Wire = { id: `wire-${Date.now()}-2b`, sourceNodeId: junctionId, sourceOutputIndex: 0, targetNodeId: wire2.targetNodeId, targetInputIndex: wire2.targetInputIndex, state: wire2.state };
        newWires = newWires.filter(w => w.id !== wire2.id).concat([wire2_1, wire2_2]);
    }

    onUpdateCircuit([...circuit.nodes, newJunction], newWires);
    setSelectedId(junctionId);
  };

  const handleCanvasClick = (e: React.PointerEvent) => {
      if (e.button !== 0) return; 
      if (pendingComponent && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        addNode(pendingComponent, e.clientX - rect.left, e.clientY - rect.top);
        setPendingComponent(null);
        return;
      }
      setSelectedId(null);
      if (validationResult?.valid) setValidationResult(null);
  };

  const getWirePath = (x1: number, y1: number, x2: number, y2: number) => {
    if (wireMode === 'bezier') {
        const dist = Math.abs(x2 - x1);
        const controlPointOffset = Math.max(dist * 0.5, 50);
        return `M ${x1} ${y1} C ${x1 + controlPointOffset} ${y1}, ${x2 - controlPointOffset} ${y2}, ${x2} ${y2}`;
    }
    const dx = x2 - x1;
    if (dx > 20) {
        const midX = (x1 + x2) / 2;
        return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
    }
    const stub = 20;
    const midY = (y1 + y2) / 2;
    return `M ${x1} ${y1} L ${x1 + stub} ${y1} L ${x1 + stub} ${midY} L ${x2 - stub} ${midY} L ${x2 - stub} ${y2} L ${x2} ${y2}`;
  };

  const getLabelStyle = (pos: string | undefined): React.CSSProperties => {
      switch (pos) {
          case 'Bottom': return { top: '100%', left: '50%', transform: 'translate(-50%, 8px)' };
          case 'Left': return { top: '50%', right: '100%', transform: 'translate(-8px, -50%)' };
          case 'Right': return { top: '50%', left: '100%', transform: 'translate(8px, -50%)' };
          case 'Top': default: return { bottom: '100%', left: '50%', transform: 'translate(-50%, -8px)' };
      }
  };

  const ghostSnapX = Math.round(mousePos.x / GRID_SIZE) * GRID_SIZE;
  const ghostSnapY = Math.round(mousePos.y / GRID_SIZE) * GRID_SIZE;
  const pendingDef = pendingComponent ? NODE_DEFINITIONS[pendingComponent] : null;

  return (
    <div 
        ref={containerRef}
        className={`flex-1 relative w-full h-full overflow-hidden bg-zinc-50 dark:bg-zinc-950 touch-none
            ${isSimulating || toolMode === 'interact' ? 'cursor-default' : pendingComponent ? 'cursor-cell' : 'cursor-crosshair'}`}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerDown={handleCanvasClick}
        onContextMenu={(e) => e.preventDefault()}
    >
        <svg className="absolute inset-0 pointer-events-none w-full h-full opacity-20 dark:opacity-20">
            <defs>
                <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="1" className="fill-zinc-400 dark:fill-zinc-500" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        <svg className="absolute inset-0 pointer-events-none w-full h-full overflow-visible">
            {circuit.wires.map(wire => {
                const sourceNode = circuit.nodes.find(n => n.id === wire.sourceNodeId);
                const targetNode = circuit.nodes.find(n => n.id === wire.targetNodeId);
                if (!sourceNode || !targetNode) return null;
                const sourcePorts = getOutputPorts(sourceNode);
                const targetPorts = getInputPorts(targetNode);
                const outputOffset = sourcePorts[wire.sourceOutputIndex] || { x: 0, y: 0 };
                const inputOffset = targetPorts[wire.targetInputIndex] || { x: 0, y: 0 };
                const startX = sourceNode.position.x + outputOffset.x;
                const startY = sourceNode.position.y + outputOffset.y;
                const endX = targetNode.position.x + inputOffset.x;
                const endY = targetNode.position.y + inputOffset.y;
                const isSelected = selectedId === wire.id;
                const pathData = getWirePath(startX, startY, endX, endY);
                const inactiveColor = wire.color || (theme === 'dark' ? "#52525b" : "#a1a1aa");
                const activeColor = wire.activeColor || "#22d3ee";
                const thickness = wire.thickness || 2;
                const strokeColor = wire.state ? activeColor : (isSelected ? activeColor : inactiveColor);

                return (
                    <g 
                      key={wire.id} 
                      onPointerDown={(e) => handleWireClick(e, wire)} 
                      onContextMenu={(e) => handleContextMenu(e, wire.id)}
                      className={`pointer-events-auto cursor-pointer group`}
                    >
                        <path d={pathData} stroke="transparent" strokeWidth={Math.max(16, thickness + 12)} fill="none" />
                        {wire.state && <path d={pathData} stroke={activeColor} strokeWidth={thickness + 2} fill="none" opacity="0.3" filter="blur(2px)" />}
                        <path d={pathData} stroke={strokeColor} strokeWidth={isSelected ? thickness + 1 : thickness} fill="none" className="transition-all duration-150" strokeDasharray={isSelected ? "4" : "0"} strokeLinejoin="round" strokeLinecap="round" />
                    </g>
                );
            })}

            {wireIntersections.map((intersect, idx) => (
                <g 
                    key={`intersect-${idx}`}
                    className="pointer-events-auto cursor-pointer transition-all hover:scale-125"
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        onCommit();
                        createJunctionAtPoint(intersect.point, intersect.wire1, intersect.wire2);
                    }}
                >
                    <circle 
                        cx={intersect.point.x} 
                        cy={intersect.point.y} 
                        r="12" 
                        fill="transparent" 
                    />
                    <circle 
                        cx={intersect.point.x} 
                        cy={intersect.point.y} 
                        r="4" 
                        fill="none" 
                        stroke="#22d3ee" 
                        strokeWidth="1.5"
                        strokeDasharray="2"
                        className="animate-spin-slow"
                    />
                </g>
            ))}

            {wiring && <path d={getWirePath(wiring.startPoint.x, wiring.startPoint.y, mousePos.x, mousePos.y)} stroke="#fbbf24" strokeWidth="2" fill="none" strokeDasharray="4" className="animate-pulse" strokeLinejoin="round" />}
        </svg>

        {circuit.nodes.map(node => {
            const { width, height } = getNodeDimensions(node);
            const isSelected = selectedId === node.id;
            const isInvalid = validationResult?.invalidNodeIds?.includes(node.id);
            const inputPorts = getInputPorts(node);
            const outputPorts = getOutputPorts(node);
            const def = NODE_DEFINITIONS[node.type];
            const canInteract = ['SWITCH', 'BUTTON', 'INPUT_2BIT', 'INPUT_4BIT', 'INPUT_8BIT', 'INPUT_16BIT'].includes(node.type);
            
            // CURSOR LOGIC: Distinct visual feedback for Move vs Interact
            const cursorClass = (toolMode === 'interact' || isSimulating) 
                ? (canInteract ? 'cursor-pointer' : 'cursor-default') 
                : (toolMode === 'move' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default');

            return (
                <div key={node.id} className={`absolute group select-none transition-transform duration-75 ${isSelected ? 'scale-[1.02]' : ''}`}
                    style={{ left: node.position.x, top: node.position.y, width: width, height: height, pointerEvents: 'none', zIndex: isSelected ? 50 : 10 }}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    <div className={`absolute inset-0 pointer-events-auto transition-all duration-200 
                            ${isSelected ? 'drop-shadow-[0_0_12px_rgba(34,211,238,0.7)]' : ''} 
                            ${isInvalid ? 'drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : ''} ${cursorClass}`}
                        onPointerDown={(e) => handlePointerDown(e, node.id)}
                        onContextMenu={(e) => handleContextMenu(e, node.id)}
                    >
                        <svg width={width} height={height} className="overflow-visible">
                            <GateShape node={node} />
                        </svg>
                    </div>

                    {isSelected && (
                      <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-1 shadow-xl pointer-events-auto z-[70] animate-in zoom-in-95">
                        <button 
                          onClick={(e) => { e.stopPropagation(); onOpenProperties?.(); }}
                          className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-cyan-600 rounded-md transition-colors"
                          title="Open Properties"
                        >
                          <Settings2 size={16} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); (window as any).deleteSelection?.(); }}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950 text-red-500 rounded-md transition-colors"
                          title="Delete Node"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}

                    {isInvalid && (
                        <div className="absolute -top-3 -right-3 text-red-500 bg-white dark:bg-zinc-950 rounded-full p-1 shadow-md border border-red-200 dark:border-red-900 animate-bounce z-50">
                            <AlertTriangle size={16} />
                        </div>
                    )}

                    {inputPorts.map((offset, idx) => {
                        const isFloating = validationResult?.floatingInputs?.some(fi => fi.nodeId === node.id && fi.index === idx);
                        return (
                        <div key={`input-${idx}`}
                            className="absolute w-10 h-10 -ml-5 -mt-5 rounded-full pointer-events-auto flex items-center justify-center hover:scale-125 transition-transform z-10 cursor-crosshair"
                            style={{ left: offset.x, top: offset.y }}
                            onPointerUp={(e) => !isSimulating && completeWiring(e, node.id, idx)}
                        >
                            <div className={`w-3.5 h-3.5 rounded-full bg-white dark:bg-zinc-900 border-2 transition-all duration-300 ${
                                isFloating ? 'border-red-500 bg-red-500/30 ring-4 ring-red-500/20 animate-pulse' : 
                                node.inputs[idx] ? 'border-cyan-400 bg-cyan-100 dark:bg-cyan-900' : 'border-zinc-400 dark:border-zinc-500'
                            }`} />
                        </div>
                        );
                    })}

                    {outputPorts.map((offset, idx) => (
                        <div key={`output-${idx}`}
                            className="absolute w-10 h-10 -ml-5 -mt-5 rounded-full pointer-events-auto flex items-center justify-center hover:scale-125 transition-transform z-10 cursor-crosshair"
                            style={{ left: offset.x, top: offset.y }}
                            onPointerDown={(e) => !isSimulating && startWiring(e, node.id, idx)}
                        >
                            <div className={`w-3.5 h-3.5 rounded-full bg-white dark:bg-zinc-900 border-2 ${node.outputs[idx] ? 'border-cyan-400 bg-cyan-500' : 'border-zinc-400 dark:border-zinc-500 group-hover:border-zinc-600 dark:group-hover:border-zinc-300'}`} />
                        </div>
                    ))}
                    
                    {(isSelected || node.properties?.label) && node.type !== 'JUNCTION' && (
                        <div className={`absolute bg-white/95 dark:bg-zinc-900/95 text-zinc-800 dark:text-zinc-100 text-[10px] px-2 py-0.5 rounded border whitespace-nowrap shadow-md pointer-events-none backdrop-blur-sm z-[60] transition-colors
                            ${isSelected ? 'border-cyan-500 font-bold' : 'border-zinc-200 dark:border-zinc-700'}`}
                            style={getLabelStyle(node.properties?.labelPosition)}
                        >
                            {node.properties?.label || def.name}
                        </div>
                    )}
                </div>
            );
        })}

        {pendingComponent && pendingDef && (
            <div className="absolute pointer-events-none opacity-50 z-50"
                style={{ left: ghostSnapX, top: ghostSnapY, width: pendingDef.width, height: pendingDef.height }}>
                <svg width={pendingDef.width} height={pendingDef.height} className="overflow-visible">
                        <GateShape node={{ id: 'ghost', type: pendingComponent, position: {x: 0, y: 0}, inputs: Array(pendingDef.inputs).fill(false), outputs: Array(pendingDef.outputs).fill(false), properties: { inputCount: pendingDef.inputs } }} />
                </svg>
            </div>
        )}

        <style>{`
            @keyframes spin-slow {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
            .animate-spin-slow {
                animation: spin-slow 8s linear infinite;
                transform-origin: center;
            }
        `}</style>
    </div>
  );
};

const ShieldCheck = ({ size, className }: { size: number, className: string }) => <Info size={size} className={className} />;
const ShieldAlert = ({ size, className }: { size: number, className: string }) => <AlertTriangle size={size} className={className} />;
