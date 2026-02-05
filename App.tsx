import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { CircuitCanvas } from './components/CircuitCanvas';
import { Header } from './components/Header';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ThemeProvider, useTheme } from './components/ThemeContext';
import { CircuitState, NodeData, NodeType, Wire } from './types';
import { evaluateCircuit } from './utils/circuitLogic';
import { NODE_DEFINITIONS } from './constants';

const MAX_HISTORY = 50;
const STORAGE_KEY = 'logiclab-ultra-autosave';
const NAME_STORAGE_KEY = 'logiclab-ultra-name';

const AppContent: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  
  const [circuit, setCircuit] = useState<CircuitState>({ nodes: [], wires: [] });
  const [circuitName, setCircuitName] = useState('Untitled Circuit');
  const [past, setPast] = useState<CircuitState[]>([]);
  const [future, setFuture] = useState<CircuitState[]>([]);
  const [simHistory, setSimHistory] = useState<CircuitState[]>([]);
  
  const [pendingComponent, setPendingComponent] = useState<NodeType | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [toolMode, setToolMode] = useState<'move' | 'interact' | 'junction'>('move');
  const [wireMode, setWireMode] = useState<'manhattan' | 'bezier'>('manhattan');
  const [intersectionLogicEnabled, setIntersectionLogicEnabled] = useState(false);

  const [isSimulating, setIsSimulating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile); 
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const [validationResult, setValidationResult] = useState<{
      valid: boolean; 
      messages: string[]; 
      invalidNodeIds: string[];
      floatingInputs: { nodeId: string; index: number }[];
  } | null>(null);

  // -- Persistence Logic --

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    const savedName = localStorage.getItem(NAME_STORAGE_KEY);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as CircuitState;
        if (parsed.nodes && parsed.wires) {
          setCircuit(parsed);
        }
      } catch (e) {
        console.error("Failed to load autosave", e);
      }
    }
    
    if (savedName) {
      setCircuitName(savedName);
    }
  }, []);

  // Autosave to local storage on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(circuit));
    localStorage.setItem(NAME_STORAGE_KEY, circuitName);
  }, [circuit, circuitName]);

  const handleExport = useCallback(() => {
    const dataStr = JSON.stringify(circuit, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const sanitizedName = circuitName.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'logiclab-circuit';
    const exportFileDefaultName = `${sanitizedName}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [circuit, circuitName]);

  const handleImport = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content) as CircuitState;
        if (parsed.nodes && parsed.wires) {
          snapshot(); // Save current state to history before replacing
          setCircuit(parsed);
          
          // Try to set name from filename if appropriate
          const fileName = file.name.replace(/\.[^/.]+$/, "").replace(/-/g, ' ');
          setCircuitName(fileName.charAt(0).toUpperCase() + fileName.slice(1));
          
          setSelectedId(null);
          setValidationResult(null);
        } else {
          alert("Invalid circuit file format.");
        }
      } catch (err) {
        alert("Failed to parse circuit file.");
      }
    };
    reader.readAsText(file);
  }, [circuit]);

  // -- Simulation & Circuit Logic --

  useEffect(() => {
    const handleResize = () => {
        const mobile = window.innerWidth < 1024;
        setIsMobile(mobile);
        if (!mobile && !isPanelOpen) setIsSidebarOpen(true);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isPanelOpen]);

  const snapshot = useCallback(() => {
    setPast(prev => {
        const last = prev[prev.length - 1];
        if (last && JSON.stringify(last) === JSON.stringify(circuit)) return prev;
        return [...prev, circuit].slice(-MAX_HISTORY);
    });
    setFuture([]);
  }, [circuit]);

  const undo = useCallback(() => {
      if (past.length === 0) return;
      const previous = past[past.length - 1];
      setFuture(prev => [circuit, ...prev]);
      setPast(past.slice(0, -1));
      setCircuit(previous);
      if (isSimulating) { setIsSimulating(false); setSimHistory([]); }
      setValidationResult(null);
  }, [past, circuit, isSimulating]);

  const redo = useCallback(() => {
      if (future.length === 0) return;
      const next = future[0];
      setPast(prev => [...prev, circuit]);
      setFuture(future.slice(1));
      setCircuit(next);
      if (isSimulating) { setIsSimulating(false); setSimHistory([]); }
      setValidationResult(null);
  }, [future, circuit, isSimulating]);

  const tick = useCallback(() => {
    setCircuit(prev => {
        setSimHistory(h => [...h, prev].slice(-MAX_HISTORY));
        const nextNodes = prev.nodes.map(n => {
            if (n.type === 'CLOCK') {
                const speed = n.properties?.interval || 20; 
                const currentCount = (n.internalState?.tickCount || 0) + 1;
                if (currentCount >= speed) {
                     return { ...n, outputs: [!n.outputs[0]], internalState: { ...n.internalState, tickCount: 0 } };
                } else {
                    return { ...n, internalState: { ...n.internalState, tickCount: currentCount } };
                }
            }
            return n;
        });
        return evaluateCircuit(nextNodes, prev.wires);
    });
  }, []);

  useEffect(() => {
    let interval: number;
    if (isSimulating && !isPaused) { interval = window.setInterval(tick, 50); }
    return () => clearInterval(interval);
  }, [isSimulating, isPaused, tick]);

  const validateCircuit = useCallback(() => {
      const messages: string[] = [];
      const invalidNodeIds: string[] = [];
      const floatingInputs: { nodeId: string; index: number }[] = [];
      let valid = true;
      if (circuit.nodes.length === 0) return { valid: false, messages: ["Circuit is empty."], invalidNodeIds: [], floatingInputs: [] };

      circuit.nodes.forEach(node => {
          if (['SWITCH', 'CLOCK', 'BUTTON', 'CONSTANT_1', 'CONSTANT_0', 'JUNCTION', 'INPUT_2BIT', 'INPUT_4BIT', 'INPUT_8BIT', 'INPUT_16BIT'].includes(node.type)) return;
          const inputCount = node.inputs.length;
          let nodeHasFloatingInput = false;
          for(let i=0; i<inputCount; i++) {
              const isConnected = circuit.wires.some(w => w.targetNodeId === node.id && w.targetInputIndex === i);
              if (!isConnected) { 
                  valid = false; nodeHasFloatingInput = true; 
                  floatingInputs.push({ nodeId: node.id, index: i }); 
              }
          }
          if (nodeHasFloatingInput) {
              const label = node.properties?.label || NODE_DEFINITIONS[node.type]?.name || node.type;
              messages.push(`${label}: Missing input connections.`);
              invalidNodeIds.push(node.id);
          }
      });
      return { valid, messages: valid ? ["All components are correctly connected."] : messages, invalidNodeIds, floatingInputs };
  }, [circuit]);

  const toggleSimulation = () => {
    if (isSimulating) {
        setIsSimulating(false); setIsPaused(false); setSimHistory([]); setValidationResult(null);
    } else {
        const result = validateCircuit();
        setValidationResult(result);
        if (!result.valid) return;
        setIsSimulating(true); setToolMode('interact'); setSimHistory([circuit]);
    }
  };

  const handleUpdateCircuit = (nodes: NodeData[], wires: Wire[]) => {
      const evaluated = evaluateCircuit(nodes, wires);
      setCircuit(evaluated);
  };

  const handleDeleteSelection = useCallback(() => {
    if (!selectedId) return;
    snapshot();
    const isWire = circuit.wires.find(w => w.id === selectedId);
    if (isWire) {
        handleUpdateCircuit(circuit.nodes, circuit.wires.filter(w => w.id !== selectedId));
        setSelectedId(null);
        return;
    }
    const newWires = circuit.wires.filter(w => w.sourceNodeId !== selectedId && w.targetNodeId !== selectedId);
    const newNodes = circuit.nodes.filter(n => n.id !== selectedId);
    handleUpdateCircuit(newNodes, newWires);
    setSelectedId(null);
  }, [selectedId, circuit, snapshot]);

  useEffect(() => {
    (window as any).deleteSelection = handleDeleteSelection;
  }, [handleDeleteSelection]);

  const handleNodeUpdate = (id: string, updates: Partial<NodeData>) => {
    snapshot();
    const newNodes = circuit.nodes.map(n => {
        if (n.id === id) {
            let updatedNode = { ...n, ...updates };
            if (updates.type && updates.type !== n.type) {
                 const def = NODE_DEFINITIONS[updates.type];
                 if (def) {
                     updatedNode.inputs = Array(def.inputs).fill(false);
                     updatedNode.outputs = Array(def.outputs).fill(false);
                 }
            }
            return updatedNode;
        }
        return n;
    });
    handleUpdateCircuit(newNodes, circuit.wires);
  };

  const handleWireUpdate = (id: string, updates: Partial<Wire>) => {
        snapshot();
        setCircuit(prev => ({ ...prev, wires: prev.wires.map(w => w.id === id ? { ...w, ...updates } : w) }));
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingSidebar) setSidebarWidth(Math.max(180, Math.min(450, e.clientX)));
    };
    const handleMouseUp = () => setIsResizingSidebar(false);
    if (isResizingSidebar) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
    } else { document.body.style.cursor = ''; }
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [isResizingSidebar]);

  const selectedNode = circuit.nodes.find(n => n.id === selectedId) || null;
  const selectedWire = circuit.wires.find(w => w.id === selectedId) || null;

  return (
    <div className={`${theme} h-screen w-screen overflow-hidden flex flex-col`}>
      <Header 
        onSave={handleExport} onLoad={handleImport}
        circuitName={circuitName} setCircuitName={setCircuitName}
        toolMode={toolMode} setToolMode={setToolMode}
        wireMode={wireMode} setWireMode={setWireMode}
        isSimulating={isSimulating} toggleSimulation={toggleSimulation}
        isPaused={isPaused} setIsPaused={setIsPaused}
        stepBackward={undo} stepForward={() => tick()}
        checkCompatibility={() => setValidationResult(validateCircuit())}
        theme={theme} toggleTheme={toggleTheme}
        onClear={() => { snapshot(); setCircuit({nodes:[], wires:[]}); }}
        selectedId={selectedId} deleteSelection={handleDeleteSelection}
        hasHistory={simHistory.length > 0} onUndo={undo} onRedo={redo}
        canUndo={past.length > 0} canRedo={future.length > 0}
        isMobile={isMobile} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        togglePanel={() => setIsPanelOpen(!isPanelOpen)} isPanelOpen={isPanelOpen}
        hasErrors={validationResult !== null && !validationResult.valid}
        intersectionLogicEnabled={intersectionLogicEnabled}
        setIntersectionLogicEnabled={setIntersectionLogicEnabled}
      />

      <div className="flex flex-1 w-full bg-zinc-50 dark:bg-black font-sans transition-colors duration-300 overflow-hidden relative">
        {isPanelOpen ? (
          <div className="flex-1 bg-white dark:bg-zinc-950 flex justify-center animate-in fade-in duration-300 z-50">
            <PropertiesPanel 
              node={selectedNode} wire={selectedWire} 
              onUpdate={handleNodeUpdate} onUpdateWire={handleWireUpdate} 
              width="100%" onClose={() => setIsPanelOpen(false)} isMobile={isMobile}
            />
          </div>
        ) : (
          <>
            {!isMobile && isSidebarOpen && (
              <>
                <div className="h-full flex flex-shrink-0 relative" style={{ width: sidebarWidth }}>
                  <Sidebar 
                    onSelectComponent={(type) => setPendingComponent(type)} 
                    selectedComponent={pendingComponent} 
                    width={sidebarWidth} onClose={() => setIsSidebarOpen(false)} isMobile={false}
                  />
                </div>
                <div className="w-1 cursor-col-resize hover:bg-cyan-500 transition-colors z-20 bg-zinc-200 dark:bg-zinc-800 flex-shrink-0" onMouseDown={() => setIsResizingSidebar(true)} />
              </>
            )}

            {isMobile && isSidebarOpen && (
              <div className="absolute inset-0 z-[60] flex">
                <div className="w-3/4 max-w-sm h-full shadow-2xl animate-in slide-in-from-left duration-200">
                  <Sidebar 
                    onSelectComponent={(type) => { setPendingComponent(type); setIsSidebarOpen(false); }} 
                    selectedComponent={pendingComponent} 
                    width="100%" onClose={() => setIsSidebarOpen(false)} isMobile={true}
                  />
                </div>
                <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
              </div>
            )}

            <CircuitCanvas 
              circuit={circuit} onUpdateCircuit={handleUpdateCircuit} onCommit={snapshot}
              selectedId={selectedId} setSelectedId={setSelectedId}
              pendingComponent={pendingComponent} setPendingComponent={setPendingComponent}
              toolMode={toolMode} wireMode={wireMode} isSimulating={isSimulating}
              validationResult={validationResult} setValidationResult={setValidationResult}
              onOpenProperties={() => setIsPanelOpen(true)}
              intersectionLogicEnabled={intersectionLogicEnabled}
            />
          </>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => <ThemeProvider><AppContent /></ThemeProvider>;
export default App;
