import React, { useRef, useState, useEffect, useCallback } from 'react';
import { GRID_SIZE, NODE_DEFINITIONS } from '../constants';
import { CircuitState, NodeData, NodeType, Wire, Point, WiringState } from '../types';
import { GateShape } from './GateShapes';
import { evaluateCircuit } from '../utils/circuitLogic';
import { getNodeDimensions, getInputPorts, getOutputPorts } from '../utils/componentUtils';
import { PropertiesPanel } from './PropertiesPanel';
import { useTheme } from './ThemeContext';
import { 
    X, Trash2, MousePointer2, Hand, Move, Cable, Circle, 
    Play, Pause, SkipForward, SkipBack, CheckCircle2, RotateCcw, AlertTriangle, Sun, Moon 
} from 'lucide-react';

export const CircuitCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [circuit, setCircuit] = useState<CircuitState>({ nodes: [], wires: [] });
  const { theme, toggleTheme } = useTheme();
  
  // Interaction State
  const [toolMode, setToolMode] = useState<'select' | 'interact' | 'junction'>('select');
  const [wireMode, setWireMode] = useState<'manhattan' | 'bezier'>('manhattan');
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [wiring, setWiring] = useState<WiringState | null>(null);
  const [mousePos, setMousePos] = useState<Point>({ x: 0, y: 0 });
  const [selectedId, setSelectedId] = useState<string | null>(null); 

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [history, setHistory] = useState<CircuitState[]>([]);
  const MAX_HISTORY = 50;

  // Validation State
  const [validationResult, setValidationResult] = useState<{valid: boolean, messages: string[]} | null>(null);

  // --- Simulation Logic ---

  const tick = useCallback(() => {
    setCircuit(prev => {
        // Save history before tick for Step Back
        setHistory(h => {
            const newHistory = [...h, prev];
            if (newHistory.length > MAX_HISTORY) return newHistory.slice(1);
            return newHistory;
        });

        const hasClock = prev.nodes.some(n => n.type === 'CLOCK');
        let nextNodes = [...prev.nodes];
        
        // Toggle Clocks on tick
        if (hasClock) {
            nextNodes = nextNodes.map(n => {
                if (n.type === 'CLOCK') {
                    return { ...n, outputs: [!n.outputs[0]] };
                }
                return n;
            });
        }

        // Evaluate Logic
        return evaluateCircuit(nextNodes, prev.wires);
    });
  }, []);

  // Auto-Run Clock
  useEffect(() => {
    let interval: number;
    if (isSimulating && !isPaused) {
        interval = window.setInterval(tick, 1000);
    }
    return () => clearInterval(interval);
  }, [isSimulating, isPaused, tick]);

  // Compatibility Check
  const checkCompatibility = () => {
      const messages: string[] = [];
      let valid = true;

      if (circuit.nodes.length === 0) {
          setValidationResult({ valid: false, messages: ["Circuit is empty."] });
          return;
      }

      circuit.nodes.forEach(node => {
          // Check for floating inputs on Logic Gates and Arithmetic components
          const inputCount = node.inputs.length;
          // Skip sources that don't have inputs usually
          if (['SWITCH', 'CLOCK', 'BUTTON', 'CONSTANT_1', 'CONSTANT_0', 'INPUT_2BIT', 'INPUT_4BIT', 'INPUT_8BIT', 'INPUT_16BIT'].includes(node.type)) return;

          for(let i=0; i<inputCount; i++) {
              const isConnected = circuit.wires.some(w => w.targetNodeId === node.id && w.targetInputIndex === i);
              if (!isConnected) {
                  const label = node.properties?.label || node.type;
                  messages.push(`${label} (ID: ${node.id.slice(-4)}): Input ${i+1} is floating/disconnected.`);
                  valid = false;
              }
          }
      });

      if (valid) {
          setValidationResult({ valid: true, messages: ["Circuit is compatible and valid."] });
      } else {
          setValidationResult({ valid: false, messages });
      }

      // Auto-hide success message
      if (valid) {
          setTimeout(() => setValidationResult(null), 3000);
      }
  };

  const toggleSimulation = () => {
      if (isSimulating) {
          // Stop
          setIsSimulating(false);
          setIsPaused(false);
          setHistory([]); 
          setToolMode('select');
      } else {
          // Start
          // Run check first? Optional. Let's allow running even if broken, but maybe warn.
          setIsSimulating(true);
          setToolMode('interact'); 
          setHistory([circuit]);
      }
  };

  const stepForward = () => {
      if (!isSimulating) return;
      setIsPaused(true); 
      tick();
  };

  const stepBackward = () => {
      if (!isSimulating || history.length === 0) return;
      setIsPaused(true);
      const prev = history[history.length - 1];
      setCircuit(prev);
      setHistory(h => h.slice(0, -1));
  };

  // --- Logic Helpers ---
  const updateCircuit = (newNodes: NodeData[], newWires: Wire[]) => {
    // If simulating, we just update state directly, effectively "injecting" changes live
    // But usually you stop sim to edit. We'll allow live editing.
    const evaluated = evaluateCircuit(newNodes, newWires);
    setCircuit(evaluated);
  };

  const handleNodeUpdate = (id: string, updates: Partial<NodeData>) => {
    setCircuit(prev => {
        const newNodes = prev.nodes.map(n => {
            if (n.id === id) {
                let updatedNode = { ...n, ...updates };
                
                // Handle changing Node Type (e.g., resizing multi-bit IO)
                if (updates.type && updates.type !== n.type) {
                     const def = NODE_DEFINITIONS[updates.type];
                     if (def) {
                         // Resize inputs
                         const currentInputs = updatedNode.inputs;
                         if (def.inputs > currentInputs.length) {
                             updatedNode.inputs = [...currentInputs, ...Array(def.inputs - currentInputs.length).fill(false)];
                         } else {
                             updatedNode.inputs = currentInputs.slice(0, def.inputs);
                         }

                         // Resize outputs
                         const currentOutputs = updatedNode.outputs;
                         if (def.outputs > currentOutputs.length) {
                             updatedNode.outputs = [...currentOutputs, ...Array(def.outputs - currentOutputs.length).fill(false)];
                         } else {
                             updatedNode.outputs = currentOutputs.slice(0, def.outputs);
                         }
                     }
                }

                // Handle resizing inputs for Variable Gates
                if (updates.properties?.inputCount) {
                    const count = updates.properties.inputCount;
                    if (count > updatedNode.inputs.length) {
                        updatedNode.inputs = [...updatedNode.inputs, ...Array(count - updatedNode.inputs.length).fill(false)];
                    } else if (count < updatedNode.inputs.length) {
                        updatedNode.inputs = updatedNode.inputs.slice(0, count);
                    }
                }

                if (updates.properties?.initialState !== undefined) {
                    if (['SWITCH', 'CONSTANT_1', 'CONSTANT_0'].includes(updatedNode.type)) {
                         updatedNode.outputs = [!!updates.properties.initialState];
                    }
                    if (['D_FF', 'T_FF', 'JK_FF', 'SR_FF', 'D_LATCH'].includes(updatedNode.type)) {
                        updatedNode.internalState = {
                            ...updatedNode.internalState,
                            storedValue: !!updates.properties.initialState
                        };
                        updatedNode.outputs = [!!updates.properties.initialState, !updates.properties.initialState];
                    }
                }

                return updatedNode;
            }
            return n;
        });

        // Cleanup disconnected wires if ports were removed
        const validWires = prev.wires.filter(w => {
            const source = newNodes.find(n => n.id === w.sourceNodeId);
            const target = newNodes.find(n => n.id === w.targetNodeId);
            if (!source || !target) return false;
            if (w.sourceOutputIndex >= source.outputs.length) return false;
            if (w.targetInputIndex >= target.inputs.length) return false;
            return true;
        });
        
        return evaluateCircuit(newNodes, validWires);
    });
  };

  const addNode = (type: NodeType, x: number, y: number) => {
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
      properties: {
          label: '',
          inputCount: def.inputs,
          propagationDelay: 0,
          initialState: false,
          romValue: false
      }
    };

    updateCircuit([...circuit.nodes, newNode], circuit.wires);
    setSelectedId(newNode.id);
    if (type !== 'JUNCTION') {
        setToolMode('select'); 
    }
  };

  const deleteSelection = () => {
    if (!selectedId) return;
    
    const isWire = circuit.wires.find(w => w.id === selectedId);
    if (isWire) {
      updateCircuit(circuit.nodes, circuit.wires.filter(w => w.id !== selectedId));
      setSelectedId(null);
      return;
    }

    const newWires = circuit.wires.filter(w => w.sourceNodeId !== selectedId && w.targetNodeId !== selectedId);
    const newNodes = circuit.nodes.filter(n => n.id !== selectedId);
    updateCircuit(newNodes, newWires);
    setSelectedId(null);
  };

  // --- Interaction Handlers ---

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/react-circuit-node') as NodeType;
    
    if (!type || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    addNode(type, x, y);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (wiring) return;

    setSelectedId(id);
    const node = circuit.nodes.find(n => n.id === id);
    if (!node) return;

    const isInteractive = ['SWITCH', 'BUTTON', 'INPUT_2BIT', 'INPUT_4BIT', 'INPUT_8BIT', 'INPUT_16BIT'].includes(node.type);
    
    if ((toolMode === 'interact' || isSimulating) && isInteractive) {
        let toggledNodes = circuit.nodes;

        // Special handling for Multi-bit inputs
        if (node.type.startsWith('INPUT_')) {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            // Relative Y position inside the node
            const relY = e.clientY - rect.top; 
            // Calculate which bit was clicked (each bit is 20px high, starting at y=25)
            // Header is 25px
            const bitIndex = Math.floor((relY - 25) / 20);
            
            if (bitIndex >= 0 && bitIndex < node.outputs.length) {
                toggledNodes = circuit.nodes.map(n => {
                    if (n.id === id) {
                        const newOutputs = [...n.outputs];
                        newOutputs[bitIndex] = !newOutputs[bitIndex];
                        return { ...n, outputs: newOutputs };
                    }
                    return n;
                });
            }
        } else {
            // Standard single toggle
            toggledNodes = circuit.nodes.map(n => {
                if (n.id === id) {
                    const newState = !n.outputs[0];
                    return { ...n, outputs: [newState] };
                }
                return n;
            });
        }
        
        updateCircuit(toggledNodes, circuit.wires);
        return; 
    }

    if (toolMode === 'select' || toolMode === 'junction') {
        setDraggingNodeId(id);
        const rect = containerRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        setDragOffset({
            x: mouseX - node.position.x,
            y: mouseY - node.position.y
        });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    if (draggingNodeId) {
        const snapX = Math.round((x - dragOffset.x) / GRID_SIZE) * GRID_SIZE;
        const snapY = Math.round((y - dragOffset.y) / GRID_SIZE) * GRID_SIZE;

        const updatedNodes = circuit.nodes.map(n => {
            if (n.id === draggingNodeId) {
                return { ...n, position: { x: snapX, y: snapY }};
            }
            return n;
        });
        setCircuit(prev => ({ ...prev, nodes: updatedNodes }));
    }
  };

  const handleMouseUp = () => {
    if (draggingNodeId) {
        setDraggingNodeId(null);
        updateCircuit(circuit.nodes, circuit.wires); 
    }
    if (wiring) {
        setWiring(null);
    }
  };

  const startWiring = (e: React.MouseEvent, nodeId: string, outputIndex: number) => {
    e.stopPropagation();
    e.preventDefault();
    if (toolMode === 'interact' && !isSimulating) return; 

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setWiring({
        sourceNodeId: nodeId,
        sourceOutputIndex: outputIndex,
        startPoint: { x, y },
        active: true
    });
  };

  const completeWiring = (e: React.MouseEvent, targetNodeId: string, inputIndex: number) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!wiring) return;

    if (wiring.sourceNodeId === targetNodeId) {
        setWiring(null);
        return;
    }

    const exists = circuit.wires.some(w => 
        w.targetNodeId === targetNodeId && w.targetInputIndex === inputIndex
    );
    
    let newWires = exists 
        ? circuit.wires.filter(w => !(w.targetNodeId === targetNodeId && w.targetInputIndex === inputIndex))
        : [...circuit.wires];

    newWires.push({
        id: `wire-${Date.now()}`,
        sourceNodeId: wiring.sourceNodeId,
        sourceOutputIndex: wiring.sourceOutputIndex,
        targetNodeId: targetNodeId,
        targetInputIndex: inputIndex,
        state: false
    });

    updateCircuit(circuit.nodes, newWires);
    setWiring(null);
  };

  const handleWireClick = (e: React.MouseEvent, wire: Wire, x: number, y: number) => {
    if (toolMode !== 'junction') {
        e.stopPropagation();
        setSelectedId(wire.id);
        return;
    }

    e.stopPropagation();
    
    // Create Junction at clicked location
    const snapX = Math.round(x / GRID_SIZE) * GRID_SIZE;
    const snapY = Math.round(y / GRID_SIZE) * GRID_SIZE;

    const junctionId = `node-${Date.now()}-junction`;
    
    const newJunction: NodeData = {
        id: junctionId,
        type: 'JUNCTION',
        position: { x: snapX - 5, y: snapY - 5 }, // Center it (10px wide)
        inputs: [false],
        outputs: [false],
        properties: { label: '' }
    };

    const wire1: Wire = {
        id: `wire-${Date.now()}-1`,
        sourceNodeId: wire.sourceNodeId,
        sourceOutputIndex: wire.sourceOutputIndex,
        targetNodeId: junctionId,
        targetInputIndex: 0,
        state: wire.state
    };

    const wire2: Wire = {
        id: `wire-${Date.now()}-2`,
        sourceNodeId: junctionId,
        sourceOutputIndex: 0,
        targetNodeId: wire.targetNodeId,
        targetInputIndex: wire.targetInputIndex,
        state: wire.state
    };

    const newWires = circuit.wires.filter(w => w.id !== wire.id).concat([wire1, wire2]);
    const newNodes = [...circuit.nodes, newJunction];

    updateCircuit(newNodes, newWires);
    setSelectedId(junctionId);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
      // Junction creation on empty canvas is disabled.
      // Users can only create junctions by clicking on existing wires.
      
      setSelectedId(null);
      if (validationResult?.valid) setValidationResult(null); // Clear success message on click
  };

  // --- Render Helpers ---
  const getWirePath = (x1: number, y1: number, x2: number, y2: number) => {
    if (wireMode === 'bezier') {
        const dist = Math.abs(x2 - x1);
        const controlPointOffset = Math.max(dist * 0.5, 50);
        return `M ${x1} ${y1} C ${x1 + controlPointOffset} ${y1}, ${x2 - controlPointOffset} ${y2}, ${x2} ${y2}`;
    }

    const dx = x2 - x1;
    // Simple Manhattan
    if (dx > 20) {
        const midX = (x1 + x2) / 2;
        return `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
    }
    const stub = 20;
    const midY = (y1 + y2) / 2;
    return `M ${x1} ${y1} L ${x1 + stub} ${y1} L ${x1 + stub} ${midY} L ${x2 - stub} ${midY} L ${x2 - stub} ${y2} L ${x2} ${y2}`;
  };

  const selectedNode = circuit.nodes.find(n => n.id === selectedId) || null;

  return (
    <div className="flex-1 h-full relative bg-zinc-50 dark:bg-zinc-950 flex flex-row overflow-hidden transition-colors duration-300">
        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col relative h-full overflow-hidden">
             {/* Toolbar */}
            <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/50 flex items-center px-4 justify-between z-20 backdrop-blur-sm shrink-0 gap-4 transition-colors duration-300">
                
                {/* Left: Tools */}
                <div className="flex items-center space-x-2">
                     <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-md p-0.5 border border-zinc-200 dark:border-zinc-700">
                        <button 
                            onClick={() => { setToolMode('select'); setIsSimulating(false); }}
                            className={`flex items-center space-x-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${toolMode === 'select' ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover: