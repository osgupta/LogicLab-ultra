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
  const [validationResult, setValidationResult] = useState<{valid: boolean, messages: string[], invalidNodeIds: string[]} | null>(null);

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
      const invalidNodeIds: string[] = [];
      let valid = true;

      if (circuit.nodes.length === 0) {
          setValidationResult({ valid: false, messages: ["Circuit is empty."], invalidNodeIds: [] });
          return;
      }

      circuit.nodes.forEach(node => {
          // Check for floating inputs on Logic Gates and Arithmetic components
          const inputCount = node.inputs.length;
          // Skip sources that don't have inputs
          if (['SWITCH', 'CLOCK', 'BUTTON', 'CONSTANT_1', 'CONSTANT_0', 'JUNCTION'].includes(node.type)) return;

          let nodeHasFloatingInput = false;
          for(let i=0; i<inputCount; i++) {
              const isConnected = circuit.wires.some(w => w.targetNodeId === node.id && w.targetInputIndex === i);
              if (!isConnected) {
                  const label = node.properties?.label || node.type;
                  messages.push(`${label} (ID: ${node.id.slice(-4)}): Input ${i+1} is floating/disconnected.`);
                  valid = false;
                  nodeHasFloatingInput = true;
              }
          }

          if (nodeHasFloatingInput) {
              invalidNodeIds.push(node.id);
          }
      });

      if (valid) {
          setValidationResult({ valid: true, messages: ["Circuit is compatible and valid."], invalidNodeIds: [] });
      } else {
          setValidationResult({ valid: false, messages, invalidNodeIds });
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
                            className={`flex items-center space-x-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${toolMode === 'select' ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
                            title="Select / Move Mode"
                        >
                            <Move size={14} />
                            <span>Select</span>
                        </button>
                        <button 
                            onClick={() => setToolMode(toolMode === 'junction' ? 'select' : 'junction')}
                            className={`flex items-center space-x-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${toolMode === 'junction' ? 'bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'}`}
                            title="Junction Tool"
                        >
                            <Circle size={14} />
                        </button>
                     </div>

                     <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700 mx-1"></div>

                     <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-md p-0.5 border border-zinc-200 dark:border-zinc-700">
                        <button 
                            onClick={() => setWireMode(wireMode === 'manhattan' ? 'bezier' : 'manhattan')}
                            className={`flex items-center space-x-2 px-3 py-1.5 rounded text-xs font-medium transition-colors text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200`}
                            title="Toggle Wire Style"
                        >
                            <Cable size={14} />
                        </button>
                     </div>
                </div>

                {/* Center: Simulation Controls */}
                <div className="flex items-center space-x-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-lg shadow-inner">
                    <button 
                        onClick={checkCompatibility}
                        className="p-1.5 rounded text-zinc-400 hover:text-green-500 dark:hover:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20 transition-colors"
                        title="Check Circuit Compatibility"
                    >
                        <CheckCircle2 size={16} />
                    </button>
                    <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800"></div>
                    
                    <button 
                        onClick={stepBackward}
                        disabled={!isSimulating || history.length === 0}
                        className="p-1.5 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Step Back"
                    >
                        <SkipBack size={16} />
                    </button>

                    <button 
                        onClick={toggleSimulation}
                        className={`flex items-center space-x-2 px-3 py-1.5 rounded text-xs font-bold transition-all ${
                            isSimulating 
                                ? 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-200 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:border-red-500/50' 
                                : 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-500 text-white shadow-lg shadow-green-500/20 dark:shadow-green-900/20'
                        }`}
                    >
                        {isSimulating ? <RotateCcw size={14} /> : <Play size={14} />}
                        <span>{isSimulating ? 'Stop' : 'Run'}</span>
                    </button>

                    {isSimulating && (
                         <button 
                            onClick={() => setIsPaused(!isPaused)}
                            className={`p-1.5 rounded transition-colors ${isPaused ? 'text-amber-500 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20' : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700'}`}
                            title={isPaused ? "Resume" : "Pause"}
                        >
                            {isPaused ? <Play size={14} /> : <Pause size={14} />}
                        </button>
                    )}

                    <button 
                        onClick={stepForward}
                        disabled={!isSimulating}
                        className="p-1.5 rounded text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                        title="Step Forward"
                    >
                        <SkipForward size={16} />
                    </button>
                </div>
                
                {/* Right: Actions */}
                <div className="flex items-center space-x-4">
                     <button 
                        onClick={toggleTheme}
                        className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                        title="Toggle Theme"
                     >
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                     </button>
                     {selectedId && (
                        <button 
                        onClick={deleteSelection}
                        className="flex items-center space-x-2 px-3 py-1.5 bg-red-50 text-red-500 dark:bg-red-500/10 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/30 rounded-md text-xs font-medium transition-colors"
                        >
                        <X size={14} />
                        <span>Delete</span>
                    </button>
                    )}
                    <button 
                        onClick={() => { setCircuit({ nodes: [], wires: [] }); setIsSimulating(false); }}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-red-500 dark:hover:text-red-400 rounded-md transition-colors"
                        title="Clear Canvas"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Canvas */}
            <div 
                ref={containerRef}
                className={`flex-1 relative w-full h-full overflow-hidden 
                    ${isSimulating ? 'cursor-default' : toolMode === 'junction' ? 'cursor-crosshair' : 'cursor-crosshair'}`}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onClick={handleCanvasClick}
                onContextMenu={(e) => e.preventDefault()}
            >
                {/* Validation Messages Overlay */}
                {validationResult && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none w-auto max-w-lg">
                        <div className={`p-4 rounded-lg shadow-xl backdrop-blur-md border animate-in slide-in-from-top-4 duration-200
                            ${validationResult.valid ? 'bg-green-50/90 dark:bg-green-950/80 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200' : 'bg-red-50/90 dark:bg-red-950/80 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'}`}
                        >
                            <div className="flex items-start gap-3">
                                {validationResult.valid ? <CheckCircle2 size={20} className="mt-0.5 text-green-600 dark:text-green-400" /> : <AlertTriangle size={20} className="mt-0.5 text-red-600 dark:text-red-400" />}
                                <div>
                                    <h4 className="font-bold text-sm mb-1">{validationResult.valid ? 'Circuit Valid' : 'Compatibility Issues Found'}</h4>
                                    <ul className="text-xs space-y-1 list-disc list-inside opacity-90">
                                        {validationResult.messages.map((m, i) => <li key={i}>{m}</li>)}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Grid Pattern */}
                <svg className="absolute inset-0 pointer-events-none w-full h-full opacity-20 dark:opacity-20">
                    <defs>
                        <pattern id="grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
                            <circle cx="1" cy="1" r="1" className="fill-zinc-400 dark:fill-zinc-500" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>

                {/* Connections */}
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

                        return (
                            <g 
                                key={wire.id} 
                                onClick={(e) => { 
                                    if (!containerRef.current) return;
                                    const rect = containerRef.current.getBoundingClientRect();
                                    handleWireClick(e, wire, e.clientX - rect.left, e.clientY - rect.top);
                                }} 
                                className={`pointer-events-auto cursor-pointer group`}
                            >
                                <path d={pathData} stroke="transparent" strokeWidth="16" fill="none" />
                                {wire.state && <path d={pathData} stroke="#22d3ee" strokeWidth="4" fill="none" opacity="0.3" filter="blur(2px)" />}
                                <path d={pathData} stroke={wire.state ? "#22d3ee" : (theme === 'dark' ? "#52525b" : "#a1a1aa")} strokeWidth={isSelected ? "3" : "2"} fill="none" className="transition-colors duration-150" strokeDasharray={isSelected ? "4" : "0"} strokeLinejoin="round" strokeLinecap="round" />
                            </g>
                        );
                    })}

                    {wiring && (
                        <path d={getWirePath(wiring.startPoint.x, wiring.startPoint.y, mousePos.x, mousePos.y)} stroke="#fbbf24" strokeWidth="2" fill="none" strokeDasharray="4" className="animate-pulse" strokeLinejoin="round" />
                    )}
                </svg>

                {/* Nodes */}
                {circuit.nodes.map(node => {
                    const { width, height } = getNodeDimensions(node);
                    const isSelected = selectedId === node.id;
                    const isInvalid = validationResult?.invalidNodeIds?.includes(node.id);
                    const inputPorts = getInputPorts(node);
                    const outputPorts = getOutputPorts(node);
                    const def = NODE_DEFINITIONS[node.type];
                    // Always allow interaction in sim mode for switches, buttons, and new inputs
                    const canInteract = ['SWITCH', 'BUTTON', 'INPUT_2BIT', 'INPUT_4BIT', 'INPUT_8BIT', 'INPUT_16BIT'].includes(node.type);

                    return (
                        <div
                            key={node.id}
                            className={`absolute group select-none`}
                            style={{
                                left: node.position.x,
                                top: node.position.y,
                                width: width,
                                height: height,
                                pointerEvents: 'none',
                                zIndex: isSelected ? 50 : 10 
                            }}
                        >
                            <div 
                                className={`absolute inset-0 pointer-events-auto transition-all duration-200 
                                    ${isSelected ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]' : ''} 
                                    ${isInvalid ? 'drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' : ''}
                                    ${(toolMode === 'interact' || isSimulating) && canInteract ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}
                                `}
                                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                            >
                                <svg width={width} height={height} className="overflow-visible">
                                    <GateShape node={node} />
                                </svg>
                            </div>

                            {/* Warning Icon for Invalid Nodes */}
                            {isInvalid && (
                                <div className="absolute -top-3 -right-3 text-red-500 bg-white dark:bg-zinc-950 rounded-full p-0.5 shadow-md border border-red-200 dark:border-red-900 animate-bounce z-50">
                                    <AlertTriangle size={14} fill="currentColor" className="text-red-100 dark:text-red-900" stroke="currentColor" />
                                </div>
                            )}

                            {inputPorts.map((offset, idx) => (
                                <div
                                    key={`input-${idx}`}
                                    className={`absolute w-4 h-4 -ml-2 -mt-2 rounded-full pointer-events-auto flex items-center justify-center hover:scale-150 transition-transform z-10 
                                    ${(toolMode === 'select' || toolMode === 'junction') && !isSimulating ? 'cursor-crosshair' : 'cursor-default'}`}
                                    style={{ left: offset.x, top: offset.y }}
                                    onMouseUp={(e) => !isSimulating && (toolMode === 'select' || toolMode === 'junction') && completeWiring(e, node.id, idx)}
                                    title={offset.label || "Input"}
                                >
                                    <div className={`w-2 h-2 rounded-full bg-white dark:bg-zinc-900 border ${node.inputs[idx] ? 'border-cyan-400 bg-cyan-100 dark:bg-cyan-900' : 'border-zinc-400 dark:border-zinc-500'}`} />
                                </div>
                            ))}

                            {outputPorts.map((offset, idx) => (
                                <div
                                    key={`output-${idx}`}
                                    className={`absolute w-4 h-4 -ml-2 -mt-2 rounded-full pointer-events-auto flex items-center justify-center hover:scale-150 transition-transform z-10 
                                    ${(toolMode === 'select' || toolMode === 'junction') && !isSimulating ? 'cursor-crosshair' : 'cursor-default'}`}
                                    style={{ left: offset.x, top: offset.y }}
                                    onMouseDown={(e) => !isSimulating && (toolMode === 'select' || toolMode === 'junction') && startWiring(e, node.id, idx)}
                                    title={offset.label || "Output"}
                                >
                                    <div className={`w-2 h-2 rounded-full bg-white dark:bg-zinc-900 border ${node.outputs[idx] ? 'border-cyan-400 bg-cyan-500' : 'border-zinc-400 dark:border-zinc-500 group-hover:border-zinc-600 dark:group-hover:border-zinc-300'}`} />
                                </div>
                            ))}
                            
                            {(isSelected || node.properties?.label) && node.type !== 'JUNCTION' && (
                                <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-zinc-900/90 text-zinc-800 dark:text-zinc-100 text-[10px] px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 whitespace-nowrap shadow-md pointer-events-none backdrop-blur-sm z-[60]">
                                    {node.properties?.label || def.name}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>

        {/* Properties Panel (Right Side) */}
        <PropertiesPanel node={selectedNode} onUpdate={handleNodeUpdate} />
    </div>
  );
};
