
import React, { useRef } from 'react';
import { X, Sun, Moon, Network, HelpCircle, Layers, Palette, Save, FolderOpen, Trash2, Maximize2, FileJson, PlayCircle, FileImage } from 'lucide-react';
import { CircuitState } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  wireMode: 'manhattan' | 'bezier';
  setWireMode: (mode: 'manhattan' | 'bezier') => void;
  defaultWireThickness: number;
  setDefaultWireThickness: (thickness: number) => void;
  intersectionLogicEnabled: boolean;
  setIntersectionLogicEnabled: (enabled: boolean) => void;
  onShowTutorial: () => void;
  onSave: () => void;
  onLoad: (file: File) => void;
  onClear: () => void;
  localProjects?: Record<string, CircuitState>;
  onSaveLocal?: (name?: string) => void;
  onLoadLocal?: (name: string) => void;
  onDeleteLocal?: (name: string) => void;
  onExportSchematic?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen, onClose, theme, toggleTheme, wireMode, setWireMode, 
  defaultWireThickness, setDefaultWireThickness,
  intersectionLogicEnabled, setIntersectionLogicEnabled, onShowTutorial,
  onSave, onLoad, onClear,
  localProjects = {}, onSaveLocal, onLoadLocal, onDeleteLocal,
  onExportSchematic
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoad(file);
      onClose();
    }
  };

  const projectNames = Object.keys(localProjects);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
            <Palette className="text-cyan-500" size={20} />
            Preferences & Library
          </h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          
          {/* Project Library Section */}
          <div className="space-y-4">
            <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex justify-between items-center">
              <span>Local Project Library (Browser Storage)</span>
              <button 
                onClick={() => onSaveLocal?.()}
                className="text-cyan-600 hover:text-cyan-500 font-black normal-case text-[11px] bg-cyan-500/10 px-2 py-0.5 rounded transition-colors"
              >
                + New Save
              </button>
            </div>
            
            <div className="space-y-2">
              {projectNames.length > 0 ? (
                projectNames.map(name => (
                  <div key={name} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-xl group hover:border-cyan-500/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-600">
                        <FileJson size={16} />
                      </div>
                      <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200 truncate max-w-[180px]">{name}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => { onLoadLocal?.(name); onClose(); }}
                        className="p-2 text-zinc-500 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg transition-all"
                        title="Load Project"
                      >
                        <PlayCircle size={18} />
                      </button>
                      <button 
                        onClick={() => onDeleteLocal?.(name)}
                        className="p-2 text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                        title="Delete Save"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                   <p className="text-xs text-zinc-400 font-medium">No named projects saved yet.</p>
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

          {/* Import/Export Section */}
          <div className="space-y-4">
            <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Hard Copy Management</div>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => { onSave(); onClose(); }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95 shadow-sm"
              >
                <Save size={18} className="text-cyan-500" />
                Export JSON
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95 shadow-sm"
              >
                <FolderOpen size={18} className="text-cyan-500" />
                Import File
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".json" 
                className="hidden" 
              />
            </div>
            
            <button 
              onClick={() => { onExportSchematic?.(); onClose(); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-95 border border-zinc-200 dark:border-zinc-700"
            >
              <FileImage size={18} className="text-cyan-500" />
              Download Schematic (SVG)
            </button>

            <button 
                onClick={() => { if(window.confirm("Clear entire workspace?")) { onClear(); onClose(); } }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl text-xs font-bold transition-all"
            >
                <Trash2 size={16} />
                Nuke Workspace
            </button>
          </div>

          <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

          {/* Visuals Section */}
          <div className="space-y-6">
            <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">Visual Appearance</div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
                  <Sun size={16} /> Color Theme
                </div>
                <div className="text-xs text-zinc-500">Workspace color palette.</div>
              </div>
              <button 
                onClick={toggleTheme}
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-lg text-sm font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2"
              >
                {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                {theme === 'dark' ? 'Dark' : 'Light'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
                  <Layers size={16} /> Wire Style
                </div>
                <div className="text-xs text-zinc-500">Routing geometry.</div>
              </div>
              <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
                <button 
                  onClick={() => setWireMode('manhattan')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${wireMode === 'manhattan' ? 'bg-white dark:bg-zinc-700 text-cyan-600 shadow-sm' : 'text-zinc-500'}`}
                >
                  Manhattan
                </button>
                <button 
                  onClick={() => setWireMode('bezier')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${wireMode === 'bezier' ? 'bg-white dark:bg-zinc-700 text-cyan-600 shadow-sm' : 'text-zinc-500'}`}
                >
                  Bezier
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
                    <Maximize2 size={16} /> Global Thickness
                  </div>
                  <div className="text-xs text-zinc-500">Base width for connections.</div>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-500">{defaultWireThickness}px</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="8" 
                step="1" 
                value={defaultWireThickness} 
                onChange={(e) => setDefaultWireThickness(parseInt(e.target.value))}
                className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-sm font-bold text-zinc-700 dark:text-zinc-200 flex items-center gap-2">
                  <Network size={16} /> Intersection Logic
                </div>
                <div className="text-xs text-zinc-500">Dynamic node splitting.</div>
              </div>
              <button 
                onClick={() => setIntersectionLogicEnabled(!intersectionLogicEnabled)}
                className={`w-12 h-6 rounded-full transition-all relative flex items-center px-1 shadow-inner ${intersectionLogicEnabled ? 'bg-cyan-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${intersectionLogicEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <button 
              onClick={onShowTutorial}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-600/10 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 rounded-xl text-sm font-bold hover:bg-cyan-600/20 dark:hover:bg-cyan-500/20 transition-colors"
            >
              <HelpCircle size={18} />
              Re-show Guided Tutorial
            </button>
          </div>
        </div>

        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 text-center">
          <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-widest">LogicLab Ultra v2.3</p>
        </div>
      </div>
    </div>
  );
};
