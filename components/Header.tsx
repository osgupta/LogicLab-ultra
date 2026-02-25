
import React, { useState } from 'react';
import { 
    SquareActivity, Move, Circle, RotateCcw, Play, Pause, SkipForward, 
    Settings, Trash2, MousePointerClick, Menu, Info, ShieldCheck, ShieldAlert,
    Undo2, Redo2, User, LogOut
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { AuthModal } from './AuthModal';

interface HeaderProps {
    toolMode: 'move' | 'interact' | 'junction';
    setToolMode: (mode: 'move' | 'interact' | 'junction') => void;
    isSimulating: boolean;
    toggleSimulation: () => void;
    isPaused: boolean;
    setIsPaused: (paused: boolean) => void;
    stepForward: () => void;
    checkCompatibility: () => void;
    selectedId: string | null;
    deleteSelection: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    isMobile: boolean;
    toggleSidebar: () => void;
    togglePanel: () => void;
    isPanelOpen: boolean;
    hasErrors?: boolean;
    openSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    toolMode, setToolMode,
    isSimulating, toggleSimulation,
    isPaused, setIsPaused,
    stepForward,
    selectedId, deleteSelection,
    isMobile, toggleSidebar, togglePanel, isPanelOpen,
    checkCompatibility, hasErrors,
    onUndo, onRedo, canUndo, canRedo,
    openSettings
}) => {
    const { user, logout } = useAuth();
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    return (
        <div className="h-14 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between z-50 shrink-0 shadow-sm transition-colors duration-300 relative overflow-hidden">
            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
            {/* LEFT ANCHOR: Menu & Brand */}
            <div className="flex items-center space-x-1 lg:space-x-2 px-2 lg:px-4 shrink-0 bg-white dark:bg-zinc-900 z-10">
                <button 
                    onClick={toggleSidebar} 
                    className="p-2 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors shrink-0"
                    title="Toggle Sidebar"
                >
                    <Menu size={20} />
                </button>
                <div className="flex items-center space-x-2 shrink-0 pr-2 border-r border-zinc-200 dark:border-zinc-800 mr-1 lg:mr-2">
                    <div className="w-8 h-8 bg-cyan-500 rounded-md flex items-center justify-center shadow-lg shrink-0">
                        <SquareActivity size={18} className="text-white" />
                    </div>
                    {!isMobile && <span className="text-xs font-bold tracking-wider text-zinc-700 dark:text-zinc-200 uppercase ml-2">LogicLab Ultra</span>}
                </div>
            </div>

            {/* SCROLLABLE TOOL TRAY */}
            <div className="flex-1 flex items-center space-x-2 lg:space-x-4 px-2 lg:px-4 overflow-x-auto no-scrollbar scroll-smooth snap-x relative group">
                <button 
                    onClick={checkCompatibility}
                    className={`p-1.5 rounded-md transition-all flex items-center gap-2 shrink-0 snap-start ${hasErrors ? 'text-red-500 bg-red-50 dark:bg-red-500/10' : 'text-zinc-500 dark:text-zinc-400'}`}
                    title="Validate Circuit"
                >
                    {hasErrors ? <ShieldAlert size={18} /> : <ShieldCheck size={18} />}
                    <span className="text-[10px] font-bold uppercase hidden md:block">Validate</span>
                </button>

                <div className="flex items-center space-x-1 shrink-0 snap-start border-l border-zinc-200 dark:border-zinc-800 pl-2 lg:pl-4">
                    <button onClick={onUndo} disabled={!canUndo} className="p-2 text-zinc-500 dark:text-zinc-400 disabled:opacity-20" title="Undo">
                        <Undo2 size={18} />
                    </button>
                    <button onClick={onRedo} disabled={!canRedo} className="p-2 text-zinc-500 dark:text-zinc-400 disabled:opacity-20" title="Redo">
                        <Redo2 size={18} />
                    </button>
                </div>

                <div className="flex items-center space-x-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-700 shrink-0 snap-start">
                    <button onClick={toggleSimulation} className={`p-2 rounded-md transition-all ${isSimulating ? 'text-red-500 bg-red-50 dark:bg-red-500/10' : 'text-green-600 bg-green-50 dark:bg-green-500/10'}`} title={isSimulating ? "Stop Simulation" : "Start Simulation"}>
                        {isSimulating ? <RotateCcw size={16} /> : <Play size={16} />}
                    </button>
                    {isSimulating && (
                        <button onClick={() => setIsPaused(!isPaused)} className="p-2 text-zinc-500 dark:text-zinc-400">
                            {isPaused ? <Play size={16} /> : <Pause size={16} />}
                        </button>
                    )}
                    <button onClick={stepForward} className="p-2 text-zinc-500 dark:text-zinc-400" title="Step Forward">
                        <SkipForward size={16} />
                    </button>
                </div>

                <div className="flex items-center space-x-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-0.5 border border-zinc-200 dark:border-zinc-700 shrink-0 snap-start">
                    <button 
                        onClick={() => setToolMode('move')} 
                        className={`p-2 rounded-md flex items-center gap-1.5 transition-all ${toolMode === 'move' ? 'bg-white dark:bg-zinc-700 text-cyan-600 shadow-sm' : 'text-zinc-500'}`}
                        title="Move Mode"
                    >
                        <Move size={16} />
                        <span className="text-[10px] font-bold uppercase hidden lg:block">Move</span>
                    </button>
                    <button 
                        onClick={() => setToolMode('interact')} 
                        className={`p-2 rounded-md flex items-center gap-1.5 transition-all ${toolMode === 'interact' ? 'bg-white dark:bg-zinc-700 text-cyan-600 shadow-sm' : 'text-zinc-500'}`}
                        title="Interact Mode"
                    >
                        <MousePointerClick size={16} />
                        <span className="text-[10px] font-bold uppercase hidden lg:block">Interact</span>
                    </button>
                    <button 
                        onClick={() => setToolMode('junction')} 
                        className={`p-2 rounded-md ${toolMode === 'junction' ? 'bg-white dark:bg-zinc-700 text-cyan-600 shadow-sm' : 'text-zinc-500'}`}
                        title="Place Junction"
                    >
                        <Circle size={14} />
                    </button>
                </div>
            </div>

            {/* RIGHT ANCHOR: Utils */}
            <div className="flex items-center space-x-1 lg:space-x-3 shrink-0 px-2 lg:px-4 bg-white dark:bg-zinc-900 z-10 border-l border-zinc-100 dark:border-zinc-800">
                 {selectedId && (
                    <button onClick={deleteSelection} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md shrink-0" title="Delete Selection">
                        <Trash2 size={18} />
                    </button>
                )}
                <button onClick={openSettings} className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-cyan-500 transition-colors" title="Settings">
                    <Settings size={20} />
                </button>
                <button 
                  onClick={togglePanel} 
                  className={`p-2 rounded-md transition-colors shrink-0 ${isPanelOpen ? 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                  title="Selection Properties"
                >
                    <Info size={20} />
                </button>

                <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

                {user ? (
                    <div className="flex items-center gap-2">
                        {!isMobile && <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 max-w-[120px] truncate">{user.email}</span>}
                        <button 
                            onClick={() => logout()} 
                            className="p-2 text-zinc-500 hover:text-red-500 transition-colors"
                            title="Sign Out"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={() => setIsAuthModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold uppercase rounded-lg transition-all shadow-md"
                    >
                        <User size={16} />
                        {!isMobile && <span>Sign In</span>}
                    </button>
                )}
            </div>
        </div>
    );
};
