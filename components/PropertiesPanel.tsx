import React from 'react';
import { NodeData, Wire } from '../types';
import { Settings2, Type, Palette, Clock, X, Droplets, Zap, Power, Activity, ArrowLeft, Timer } from 'lucide-react';

interface PropertiesPanelProps {
  node: NodeData | null;
  wire: Wire | null;
  onUpdate: (id: string, updates: Partial<NodeData>) => void;
  onUpdateWire: (id: string, updates: Partial<Wire>) => void;
  width: number | string;
  onClose?: () => void;
  isMobile?: boolean;
}

const PRESET_COLORS = [
  { name: 'Default', off: '#52525b', on: '#22d3ee' },
  { name: 'Power', off: '#7f1d1d', on: '#ef4444' },
  { name: 'Logic', off: '#064e3b', on: '#22c55e' },
  { name: 'Clock', off: '#78350f', on: '#f59e0b' },
  { name: 'Bus', off: '#1e3a8a', on: '#3b82f6' },
  { name: 'Neutral', off: '#3f3f46', on: '#a1a1aa' },
];

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ node, wire, onUpdate, onUpdateWire, width, onClose, isMobile }) => {
  const renderSimpleRow = (label: string, icon: React.ReactNode, control: React.ReactNode) => (
    <div className="flex items-center justify-between py-4 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0">
        <div className="flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
            {icon}<span className="text-sm font-medium">{label}</span>
        </div>
        <div className="w-1/2 flex justify-end">{control}</div>
    </div>
  );

  const renderHeader = (title: string, Icon: any) => (
    <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-8 mb-4 flex items-center gap-1.5">
      <Icon size={14} className="text-zinc-400 dark:text-zinc-600" /> {title}
    </div>
  );

  if (!node && !wire) {
    return (
      <div style={{ width }} className="bg-white dark:bg-zinc-950 p-6 flex flex-col items-center justify-center text-zinc-400 h-full max-w-2xl mx-auto">
         <Settings2 size={48} className="mb-4 opacity-20" />
         <p className="text-lg font-medium text-zinc-500">No Selection</p>
         <p className="text-xs mt-2 text-center opacity-50 px-8 italic">Please select a component or wire in the circuit to edit its properties.</p>
         <button 
           onClick={onClose} 
           className="mt-8 flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-bold shadow-lg transition-all active:scale-95"
         >
           <ArrowLeft size={16} /> Back to Circuit
         </button>
      </div>
    );
  }

  // Determine if component supports propagation delay (Gates and FFs)
  const supportsDelay = node && [
    'AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR', 'XNOR', 'BUFFER',
    'D_LATCH', 'D_FF', 'JK_FF', 'T_FF', 'SR_FF', 'GATED_SR_LATCH', 'HALF_ADDER', 'FULL_ADDER'
  ].includes(node.type);

  // Determine if component supports initial state
  const supportsInitialState = node && [
    'SWITCH', 'D_LATCH', 'D_FF', 'JK_FF', 'T_FF', 'SR_FF', 'GATED_SR_LATCH', 'JK_MASTER_SLAVE'
  ].includes(node.type);

  // Frequency calculation: 
  // Base tick rate in App.tsx is 50ms (20 ticks/sec).
  // A clock toggles every 'interval' ticks. Full period = 2 * interval.
  // Freq = 1 / (2 * interval * 0.05s) = 10 / interval.
  const calculateFreq = (interval: number) => {
    if (!interval) return 0;
    return (10 / interval).toFixed(2);
  };

  const setClockByFreq = (freq: number) => {
    if (!node) return;
    const interval = Math.round(10 / freq);
    onUpdate(node.id, { properties: { ...node.properties, interval } });
  };

  return (
    <div style={{ width }} className="bg-white dark:bg-zinc-950 flex flex-col h-full overflow-hidden">
       {/* Focused Header */}
       <div className="h-16 flex items-center px-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
          <div className="flex items-center gap-4 max-w-4xl mx-auto w-full">
             <button 
               onClick={onClose} 
               className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500"
               title="Return to Workspace"
             >
               <ArrowLeft size={20} />
             </button>
             <div className="flex items-center gap-2">
                <Settings2 size={20} className="text-cyan-600" />
                <span className="font-bold text-base text-zinc-800 dark:text-zinc-200">Component Settings</span>
             </div>
             <div className="ml-auto flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono text-zinc-500">
               ID: {(wire || node)!.id.split('-').slice(-1)[0]}
             </div>
          </div>
       </div>
       
       <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-xl mx-auto px-6 py-8">
            {wire ? (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <div>
                      {renderHeader("Visual Appearance", Palette)}
                      
                      {renderSimpleRow("Default Color", <Droplets size={18} />, 
                        <input type="color" value={wire.color || '#52525b'} onChange={(e) => onUpdateWire(wire.id, { color: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border-2 border-zinc-200 dark:border-zinc-700 p-0 bg-transparent overflow-hidden"/>
                      )}
                      
                      {renderSimpleRow("Active Color (High)", <Droplets size={18} className="text-cyan-500" />, 
                        <input type="color" value={wire.activeColor || '#22d3ee'} onChange={(e) => onUpdateWire(wire.id, { activeColor: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border-2 border-zinc-200 dark:border-zinc-700 p-0 bg-transparent overflow-hidden"/>
                      )}

                      <div className="mt-6">
                        <div className="text-[10px] text-zinc-500 mb-3 font-bold uppercase tracking-widest">Theme Presets</div>
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                          {PRESET_COLORS.map((p) => (
                            <button 
                              key={p.name}
                              onClick={() => onUpdateWire(wire.id, { color: p.off, activeColor: p.on })}
                              title={p.name}
                              className="group relative flex flex-col items-center gap-1.5 transition-transform active:scale-90"
                            >
                              <div className="w-full aspect-square rounded-xl border-2 border-zinc-200 dark:border-zinc-700 overflow-hidden flex flex-col shadow-sm group-hover:border-cyan-500">
                                <div className="flex-1" style={{ backgroundColor: p.on }} />
                                <div className="flex-1" style={{ backgroundColor: p.off }} />
                              </div>
                              <span className="text-[9px] font-medium text-zinc-500">{p.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/50">
                        {renderHeader("Line Geometry", Zap)}
                        <div className="flex justify-between mb-3">
                          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Path Thickness</span>
                          <span className="text-sm font-mono text-cyan-600 dark:text-cyan-400">{wire.thickness || 2}px</span>
                        </div>
                        <input type="range" min="1" max="12" step="1" value={wire.thickness || 2} onChange={(e) => onUpdateWire(wire.id, { thickness: parseInt(e.target.value) })} className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"/>
                        <div className="flex justify-between mt-2 text-[10px] text-zinc-400 px-1">
                          <span>1px</span>
                          <span>6px (Default)</span>
                          <span>12px</span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    <div className="first:mt-0">
                      {renderHeader("Component Identity", Type)}
                      {renderSimpleRow("Friendly Name", <Type size={18} />, 
                        <input 
                          type="text" 
                          value={node!.properties?.label || ''} 
                          onChange={(e) => onUpdate(node!.id, { properties: { ...node!.properties, label: e.target.value } })} 
                          className="w-full max-w-[200px] bg-zinc-50 dark:bg-zinc-900 text-right text-sm focus:ring-2 focus:ring-cyan-500 rounded-lg px-3 py-2 border border-zinc-200 dark:border-zinc-700 outline-none transition-all" 
                          placeholder="e.g. Master Clock"
                        />
                      )}
                      {renderSimpleRow("Shell Color", <Palette size={18} />, 
                        <input type="color" value={node!.properties?.color || '#18181b'} onChange={(e) => onUpdate(node!.id, { properties: { ...node!.properties, color: e.target.value } })} className="w-10 h-10 rounded-lg cursor-pointer border-2 border-zinc-200 dark:border-zinc-700 p-0 bg-transparent overflow-hidden"/>
                      )}
                    </div>

                    {supportsInitialState && (
                      <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/50">
                        {renderHeader("Logic Behavior", Power)}
                        {renderSimpleRow("Power-On State", <Power size={18} className={node!.properties?.initialState ? "text-cyan-500" : "text-zinc-500"} />, 
                          <button 
                            onClick={() => onUpdate(node!.id, { properties: { ...node!.properties, initialState: !node!.properties?.initialState } })}
                            className={`w-14 h-7 rounded-full transition-all relative flex items-center px-1.5 shadow-inner ${node!.properties?.initialState ? 'bg-cyan-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                          >
                            <div className={`w-4.5 h-4.5 bg-white rounded-full shadow-md transition-transform ${node!.properties?.initialState ? 'translate-x-7' : 'translate-x-0'}`} />
                          </button>
                        )}
                        <p className="text-[11px] text-zinc-400 mt-3 leading-relaxed">
                          Determines the logical state when the circuit is first initialized or reset.
                        </p>
                      </div>
                    )}

                    {node!.type === 'CLOCK' && (
                        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/50">
                            {renderHeader("Signal Configuration", Activity)}
                            <div className="space-y-6">
                              <div>
                                <div className="flex justify-between items-end mb-3">
                                  <div className="space-y-1">
                                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Clock Frequency</span>
                                    <div className="text-2xl font-black text-amber-500 font-mono tracking-tight">
                                      {calculateFreq(node!.properties?.interval || 20)} <span className="text-xs uppercase text-zinc-500">Hz</span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase">Interval</span>
                                    <div className="text-sm font-mono text-zinc-400">{node!.properties?.interval || 20} ticks</div>
                                  </div>
                                </div>
                                <input 
                                  type="range" min="2" max="200" step="2" 
                                  value={node!.properties?.interval || 20} 
                                  onChange={(e) => onUpdate(node!.id, { properties: { ...node!.properties, interval: parseInt(e.target.value) } })} 
                                  className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-lg accent-amber-500 appearance-none cursor-pointer shadow-inner"
                                />
                              </div>

                              <div className="grid grid-cols-4 gap-2">
                                {[0.5, 1, 2, 5].map(hz => (
                                  <button 
                                    key={hz}
                                    onClick={() => setClockByFreq(hz)}
                                    className={`py-2 px-1 rounded-lg border text-[10px] font-black transition-all active:scale-95 ${
                                      calculateFreq(node!.properties?.interval || 20) === hz.toFixed(2)
                                        ? 'bg-amber-500 border-amber-500 text-white shadow-lg' 
                                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-amber-500'
                                    }`}
                                  >
                                    {hz} Hz
                                  </button>
                                ))}
                              </div>

                              <div className="text-[11px] text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 flex gap-3">
                                <Timer size={16} className="shrink-0 text-amber-500" />
                                <p className="leading-relaxed">
                                  Simulation runs at 20 ticks per second. A frequency of 1Hz toggles every 10 ticks.
                                </p>
                              </div>
                            </div>
                        </div>
                    )}

                    {supportsDelay && (
                      <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800/50">
                         {renderHeader("Timing & Performance", Zap)}
                         <div className="flex justify-between mb-3">
                          <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Propagation Delay</span>
                          <span className="text-sm font-mono text-cyan-500">{node!.properties?.propagationDelay || 0}ns</span>
                        </div>
                        <input 
                          type="range" min="0" max="250" step="5"
                          value={node!.properties?.propagationDelay || 0} 
                          onChange={(e) => onUpdate(node!.id, { properties: { ...node!.properties, propagationDelay: parseInt(e.target.value) } })} 
                          className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg accent-cyan-500 appearance-none cursor-pointer"
                        />
                        <div className="text-[11px] text-zinc-400 mt-4 leading-relaxed">
                          Simulates signal latency across the logic gate. In large circuits, high delays can cause race conditions or synchronization issues.
                        </div>
                      </div>
                    )}

                    <div className="pt-12 flex justify-center">
                       <button 
                         onClick={onClose}
                         className="px-8 py-3 bg-zinc-800 dark:bg-zinc-100 text-white dark:text-black rounded-xl font-bold text-sm shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                       >
                         Apply & Return <ArrowLeft size={16} className="rotate-180" />
                       </button>
                    </div>
                </div>
            )}
          </div>
       </div>
    </div>
  );
};