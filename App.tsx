
import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { CircuitCanvas } from './components/CircuitCanvas';
import { Header } from './components/Header';
import { PropertiesPanel } from './components/PropertiesPanel';
import { SettingsModal } from './components/SettingsModal';
import { OnboardingTutorial } from './components/OnboardingTutorial';
import { ThemeProvider, useTheme } from './components/ThemeContext';
import { CircuitState, NodeData, NodeType, Wire, Point } from './types';
import { evaluateCircuit } from './utils/circuitLogic';
import { NODE_DEFINITIONS } from './constants';
import { getNodeDimensions, getOutputPorts, getInputPorts } from './utils/componentUtils';

const MAX_HISTORY = 50;
const AUTOSAVE_KEY = 'logiclab-ultra-autosave';
const PROJECTS_KEY = 'logiclab-ultra-projects-library';
const NAME_STORAGE_KEY = 'logiclab-ultra-name';
const TUTORIAL_STORAGE_KEY = 'logiclab-ultra-tutorial-completed';

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
  const [defaultWireThickness, setDefaultWireThickness] = useState(2);
  const [intersectionLogicEnabled, setIntersectionLogicEnabled] = useState(false);

  const [isSimulating, setIsSimulating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile); 
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  const [validationResult, setValidationResult] = useState<{
      valid: boolean; 
      messages: string[]; 
      invalidNodeIds: string[];
      floatingInputs: { nodeId: string; index: number }[];
  } | null>(null);

  const [localProjects, setLocalProjects] = useState<Record<string, CircuitState>>({});

  // -- Persistence Logic --

  useEffect(() => {
    const savedAutosave = localStorage.getItem(AUTOSAVE_KEY);
    const savedName = localStorage.getItem(NAME_STORAGE_KEY);
    const savedLibrary = localStorage.getItem(PROJECTS_KEY);
    const tutorialCompleted = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    
    if (savedAutosave) {
      try {
        const parsed = JSON.parse(savedAutosave) as CircuitState;
        if (parsed.nodes && parsed.wires) {
          setCircuit(parsed);
        }
      } catch (e) {
        console.error("Failed to load autosave", e);
      }
    }
    
    if (savedName) setCircuitName(savedName);

    if (savedLibrary) {
      try {
        setLocalProjects(JSON.parse(savedLibrary));
      } catch (e) {
        console.error("Failed to load project library", e);
      }
    }

    if (!tutorialCompleted) {
      setShowTutorial(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(circuit));
    localStorage.setItem(NAME_STORAGE_KEY, circuitName);
  }, [circuit, circuitName]);

  const saveLocalProject = useCallback((name?: string) => {
    const projName = name || window.prompt("Enter a name for this project:", circuitName);
    if (!projName) return;

    const trimmedName = projName.trim();
    const updatedLibrary = { ...localProjects, [trimmedName]: circuit };
    setLocalProjects(updatedLibrary);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(updatedLibrary));
    setCircuitName(trimmedName);
  }, [circuit, localProjects, circuitName]);

  const loadLocalProject = useCallback((name: string) => {
    const targetProject = localProjects[name];
    if (targetProject) {
      snapshot();
      setCircuit(targetProject);
      setCircuitName(name);
      setSelectedId(null);
      setValidationResult(null);
    }
  }, [localProjects, circuit]);

  const deleteLocalProject = useCallback((name: string) => {
    if (!window.confirm(`Delete project "${name}" from browser storage?`)) return;
    const { [name]: removed, ...remaining } = localProjects;
    setLocalProjects(remaining);
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(remaining));
  }, [localProjects]);

  const handleExport = useCallback(() => {
    const finalName = circuitName || 'Untitled Circuit';
    try {
        const dataStr = JSON.stringify(circuit, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const sanitizedName = finalName.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'logiclab-circuit';
        const filename = `${sanitizedName}.json`;
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Export failed:", err);
        alert("Failed to export circuit.");
    }
  }, [circuit, circuitName]);

  const handleExportSchematic = useCallback(() => {
    if (circuit.nodes.length === 0) {
      alert("Canvas is empty. Add some components first!");
      return;
    }

    // 1. Calculate Bounding Box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    circuit.nodes.forEach(node => {
      const { width, height } = getNodeDimensions(node);
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + width);
      maxY = Math.max(maxY, node.position.y + height);
    });

    const padding = 50;
    const viewWidth = (maxX - minX) + padding * 2;
    const viewHeight = (maxY - minY) + padding * 2;
    const offsetX = minX - padding;
    const offsetY = minY - padding;

    // 2. Build SVG Content
    const isDark = theme === 'dark';
    const bgColor = isDark ? '#09090b' : '#fafafa';
    const textColor = isDark ? '#e4e4e7' : '#27272a';
    const wireBaseColor = isDark ? '#52525b' : '#a1a1aa';
    const activeColor = '#22d3ee';

    let svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="${viewWidth}" height="${viewHeight}" viewBox="${offsetX} ${offsetY} ${viewWidth} ${viewHeight}">`;
    
    // Background
    svgStr += `<rect x="${offsetX}" y="${offsetY}" width="${viewWidth}" height="${viewHeight}" fill="${bgColor}" />`;
    
    // Grid (optional but looks nice)
    svgStr += `<defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="${isDark ? '#27272a' : '#e5e5e5'}" /></pattern></defs>`;
    svgStr += `<rect x="${offsetX}" y="${offsetY}" width="${viewWidth}" height="${viewHeight}" fill="url(#grid)" />`;

    // Wires
    circuit.wires.forEach(wire => {
      const s = circuit.nodes.find(n => n.id === wire.sourceNodeId);
      const t = circuit.nodes.find(n => n.id === wire.targetNodeId);
      if (!s || !t) return;
      const sP = getOutputPorts(s)[wire.sourceOutputIndex];
      const tP = getInputPorts(t)[wire.targetInputIndex];
      const x1 = s.position.x + sP.x;
      const y1 = s.position.y + sP.y;
      const x2 = t.position.x + tP.x;
      const y2 = t.position.y + tP.y;
      
      let path = '';
      if (wireMode === 'bezier') {
        const dx = Math.abs(x2 - x1);
        const cpO = Math.min(Math.max(dx * 0.45, 30), 120);
        path = `M ${x1} ${y1} C ${x1 + cpO} ${y1}, ${x2 - cpO} ${y2}, ${x2} ${y2}`;
      } else {
        const dx = x2 - x1;
        if (dx > 20) {
          const midX = (x1 + x2) / 2;
          path = `M ${x1} ${y1} L ${midX} ${y1} L ${midX} ${y2} L ${x2} ${y2}`;
        } else {
          const stub = 20; const midY = (y1 + y2) / 2;
          path = `M ${x1} ${y1} L ${x1 + stub} ${y1} L ${x1 + stub} ${midY} L ${x2 - stub} ${midY} L ${x2 - stub} ${y2} L ${x2} ${y2}`;
        }
      }
      
      const stroke = wire.state ? activeColor : wireBaseColor;
      const thick = wire.thickness || 2;
      svgStr += `<path d="${path}" fill="none" stroke="${stroke}" stroke-width="${thick}" stroke-linecap="round" />`;
    });

    // Nodes (simplified rects for the export to avoid full SVG serialization complexity)
    circuit.nodes.forEach(node => {
      if (node.type === 'JUNCTION') {
        svgStr += `<circle cx="${node.position.x + 5}" cy="${node.position.y + 5}" r="4" fill="${node.outputs[0] ? activeColor : wireBaseColor}" />`;
        return;
      }

      const { width, height } = getNodeDimensions(node);
      const nodeDef = NODE_DEFINITIONS[node.type];
      const fill = isDark ? '#18181b' : '#ffffff';
      const stroke = isDark ? '#3f3f46' : '#d4d4d8';
      
      svgStr += `<rect x="${node.position.x}" y="${node.position.y}" width="${width}" height="${height}" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="2" />`;
      
      // Label
      const labelText = node.properties?.label || nodeDef.name;
      svgStr += `<text x="${node.position.x + width/2}" y="${node.position.y - 12}" fill="${textColor}" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">${labelText}</text>`;
      
      // Type identifier inside node
      svgStr += `<text x="${node.position.x + width/2}" y="${node.position.y + height/2}" fill="${isDark ? '#71717a' : '#a1a1aa'}" font-family="sans-serif" font-size="9" font-weight="bold" text-anchor="middle">${node.type}</text>`;
    });

    svgStr += `</svg>`;

    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${circuitName.toLowerCase().replace(/\s+/g, '-')}-schematic.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }, [circuit, circuitName, theme, wireMode]);

  const handleImport = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content) as CircuitState;
        if (parsed.nodes && parsed.wires) {
          snapshot();
          setCircuit(parsed);
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

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
  };

  const selectedNode = circuit.nodes.find(n => n.id === selectedId) || null;
  const selectedWire = circuit.wires.find(w => w.id === selectedId) || null;

  return (
    <div className={`${theme} h-screen w-screen overflow-hidden flex flex-col`}>
      <Header 
        toolMode={toolMode} setToolMode={setToolMode}
        isSimulating={isSimulating} toggleSimulation={toggleSimulation}
        isPaused={isPaused} setIsPaused={setIsPaused}
        stepForward={() => tick()}
        checkCompatibility={() => setValidationResult(validateCircuit())}
        selectedId={selectedId} deleteSelection={handleDeleteSelection}
        onUndo={undo} onRedo={redo}
        canUndo={past.length > 0} canRedo={future.length > 0}
        isMobile={isMobile} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        togglePanel={() => setIsPanelOpen(!isPanelOpen)} isPanelOpen={isPanelOpen}
        hasErrors={validationResult !== null && !validationResult.valid}
        openSettings={() => setIsSettingsOpen(true)}
      />

      <div className="flex-1 w-full bg-zinc-50 dark:bg-black font-sans transition-colors duration-300 overflow-hidden relative">
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
              defaultWireThickness={defaultWireThickness}
            />
          </>
        )}
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        toggleTheme={toggleTheme}
        wireMode={wireMode}
        setWireMode={setWireMode}
        defaultWireThickness={defaultWireThickness}
        setDefaultWireThickness={setDefaultWireThickness}
        intersectionLogicEnabled={intersectionLogicEnabled}
        setIntersectionLogicEnabled={setIntersectionLogicEnabled}
        onShowTutorial={() => { setIsSettingsOpen(false); setShowTutorial(true); }}
        onSave={handleExport}
        onLoad={handleImport}
        onClear={() => { snapshot(); setCircuit({nodes:[], wires:[]}); }}
        localProjects={localProjects}
        onSaveLocal={saveLocalProject}
        onLoadLocal={loadLocalProject}
        onDeleteLocal={deleteLocalProject}
        onExportSchematic={handleExportSchematic}
      />

      <OnboardingTutorial 
        isOpen={showTutorial}
        onClose={closeTutorial}
      />
    </div>
  );
};

const App: React.FC = () => <ThemeProvider><AppContent /></ThemeProvider>;
export default App;
