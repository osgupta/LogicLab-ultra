import React, { useRef } from 'react';
import { 
    SquareActivity, Move, Circle, RotateCcw, Play, Pause, SkipForward, 
    Sun, Moon, Trash2, MousePointerClick, Menu, Info, ShieldCheck, ShieldAlert,
    Network, Undo2, Redo2, Save, FolderOpen
} from 'lucide-react';

interface HeaderProps {
    onSave: () => void;
    onLoad: (file: File) => void;
    circuitName: string;
    setCircuitName: (name: string) => void;
    toolMode: 'move' | 'interact' | 'junction';
    setToolMode: (mode: 'move' | 'interact' | 'junction') => void;
    wireMode: 'manhattan' | 'bezier';
    setWireMode: (mode: 'manhattan' | 'bezier') => void;
    isSimulating: boolean;
    toggleSimulation: () => void;
    isPaused: boolean;
    setIsPaused: (paused: boolean) => void;
    stepBackward: () => void;
    stepForward: () => void;
    checkCompatibility: () => void;
    theme: 'dark' | 'light';
    toggleTheme: () => void;
    onClear: () => void;
    selectedId: string | null;
    deleteSelection: () => void;
    hasHistory: boolean;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    isMobile: boolean;
    toggleSidebar: () => void;
    togglePanel: () => void;
    isPanelOpen: boolean;
    hasErrors?: boolean;
    intersectionLogicEnabled: boolean;
    setIntersectionLogicEnabled: (enabled: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
    onSave, onLoad,
    circuitName, setCircuitName,
    toolMode, setToolMode,
    isSimulating, toggleSimulation,
    isPaused, setIsPaused,
    stepForward,
    theme, toggleTheme,
    selectedId, deleteSelection,
    isMobile, toggleSidebar, togglePanel, isPanelOpen,
    checkCompatibility, hasErrors,
    intersectionLogicEnabled, setIntersectionLogicEnabled,
    onUndo, onRedo, canUndo, canRedo
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            onLoad(file);
            // Reset input so the same file can be uploaded again if needed
            e.target.value = '';
        }
    };

    const triggerLoad = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="h-14 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-2 lg:px-4 justify-between z-50 shrink-0 shadow-sm transition-colors duration-300">
            <div className="flex items-center space-x-2 shrink-0 overflow-hidden">
                <button 
                    onClick={toggleSidebar} 
                    className="p-2 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors shrink-0"
                    title="Toggle Sidebar"
                >
                    <Menu size={20} />
                </button>
                <div className="flex items-center space-x-2 pr-2 border-r border-zinc-200 dark:border-zinc-800 mr-2 shrink-0">
                    <div className="w-8 h-8 bg-cyan-500 rounded-md flex items-center justify-center shadow-lg shrink-0">
                        <SquareActivity size={18} className="text-white" />
                    </div>
                </div>

                <div className="flex items-center flex-1 min-w-[100px] mr-2">
                    <input 
                        type="text"
                        value={circuitName}
                        onChange={(e) => setCircuitName(e.target.value)}
                        className="bg-transparent border-none text-xs font-bold tracking-wider text-zinc-700 dark:text-zinc-200 uppercase focus:outline-none focus:ring-1 focus:ring-cyan-500/50 rounded px-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all w-full truncate"
                        placeholder="Untitled Circuit"
                        title="Click to rename circuit"
                    />
                </div>

                {/* File Operations */}
                <div className="flex items-center space-x-1 shrink-0">
                    <button 
                        onClick={onSave}
                        className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 rounded-md transition-all"
                        title="Export Circuit (.json)"
                    >
                        <Save size={18} />
                    </button>
                    <button 
                        onClick={triggerLoad}
                        className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 rounded-md transition-all"
                        title="Import Circuit"
                    >
                        <FolderOpen size={18} />
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept=".json" 
                        className="hidden" 
                    />
                </div>
            </div>

            <div className="flex items-center space-x-2 lg:space-x-4 overflow-x-auto no-scrollbar flex-1 px-4 scroll-smooth snap-x">
                <button 
                    onClick={checkCompatibility}
                    className={`p-2 rounded-md transition-all flex items-center gap-2 shrink-0 snap-start ${hasErrors ? 'text-red-500 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-900/50' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                >
                    {hasErrors ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                    <span className="text-[10px] font-bold uppercase hidden sm:block">Validate</span>
                </button>

                <div className="flex items-center space-x-1 shrink-0 snap-start">
                    <button onClick={onUndo} disabled={!canUndo} className="p-2 text-zinc-500 dark:text-zinc-400 disabled:opacity-30">
                        <Undo2 size={18} />
                    </button>
                    <button onClick={onRedo} disabled={!canRedo} className="p-2 text-zinc-500 dark:text-zinc-400 disabled:opacity-30">
                        <Redo2 size={18} />
                    </button>
                </div>

                <div className="flex items-center space-x-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-700 shrink-0 snap-start">
                    <button onClick={toggleSimulation} className={`p-2 rounded-md transition-all ${isSimulating ? 'text-red-500 bg-red-50 dark:bg-red-500/10' : 'text-green-600 bg-green-50 dark:bg-green-500/10'}`}>
                        {isSimulating ? <RotateCcw size={16} /> : <Play size={16} />}
                    </button>
                    {isSimulating && (
                        <button onClick={() => setIsPaused(!isPaused)} className="p-2 text-zinc-500 dark:text-zinc-400">
                            {isPaused ? <Play size={16} /> : <Pause size={16} />}
                        </button>
                    )}
                    <button onClick={stepForward} className="p-2 text-zinc-500 dark:text-zinc-400">
                        <SkipForward size={16} />
                    </button>
                </div>

                <button 
                    onClick={() => setIntersectionLogicEnabled(!intersectionLogicEnabled)} 
                    className={`p-2 rounded-md transition-all flex items-center gap-2 shrink-0 snap-start ${intersectionLogicEnabled ? 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950 border border-cyan-200 dark:border-cyan-800' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                    title="Toggle Intersection Logic"
                >
                    <Network size={18} />
                    <span className="text-[10px] font-bold uppercase hidden md:block">Intersections</span>
                </button>

                {/* INTERACTION MODES SECTION */}
                <div className="flex items-center space-x-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-700 shrink-0 snap-start">
                    <button 
                        onClick={() => setToolMode('move')} 
                        className={`p-2 rounded-md flex items-center gap-1.5 transition-all ${toolMode === 'move' ? 'bg-white dark:bg-zinc-700 text-cyan-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                        title="Move Mode (Drag Components)"
                    >
                        <Move size={16} />
                        <span className="text-[10px] font-bold uppercase hidden lg:block">Move</span>
                    </button>
                    <button 
                        onClick={() => setToolMode('interact')} 
                        className={`p-2 rounded-md flex items-center gap-1.5 transition-all ${toolMode === 'interact' ? 'bg-white dark:bg-zinc-700 text-cyan-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                        title="Interact Mode (Toggle Switches/Bits)"
                    >
                        <MousePointerClick size={16} />
                        <span className="text-[10px] font-bold uppercase hidden lg:block">Interact</span>
                    </button>
                    <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-600 mx-0.5" />
                    <button 
                        onClick={() => setToolMode('junction')} 
                        className={`p-2 rounded-md ${toolMode === 'junction' ? 'bg-white dark:bg-zinc-700 text-cyan-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
                        title="Place Junction Node"
                    >
                        <Circle size={14} />
                    </button>
                </div>
            </div>

            <div className="flex items-center space-x-1 lg:space-x-3 shrink-0 ml-2">
                 {selectedId && (
                    <button onClick={deleteSelection} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md" title="Delete Selection">
                        <Trash2 size={18} />
                    </button>
                )}
                <button onClick={toggleTheme} className="p-2 text-zinc-500 dark:text-zinc-400" title="Toggle Theme">
                    {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button 
                  onClick={togglePanel} 
                  className={`p-2 rounded-md transition-colors ${isPanelOpen ? 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                  title="Selection Properties"
                >
                    <Info size={20} />
                </button>
            </div>
        </div>
    );
};
