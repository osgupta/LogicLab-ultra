import React from 'react';
import { NodeData, NodeType } from '../types';
import { Settings2 } from 'lucide-react';
import { VARIABLE_INPUT_GATES } from '../utils/componentUtils';

interface PropertiesPanelProps {
  node: NodeData | null;
  onUpdate: (id: string, updates: Partial<NodeData>) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ node, onUpdate }) => {
  if (!node) {
    return (
      <div className="w-64 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 p-6 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-500 h-full select-none transition-colors duration-300">
         <Settings2 size={32} className="mb-3 opacity-50" />
         <p className="text-sm font-medium">Select a component</p>
         <p className="text-xs text-zinc-500 dark:text-zinc-600 text-center mt-1">Click on any component on the canvas to view and edit its properties.</p>
      </div>
    );
  }

  const isGate = VARIABLE_INPUT_GATES.includes(node.type) || ['BUFFER', 'NOT'].includes(node.type);
  const isStateful = ['D_FF', 'T_FF', 'JK_FF', 'SR_FF', 'D_LATCH'].includes(node.type);
  const isSwitch = ['SWITCH'].includes(node.type);
  const isROM = node.type === 'ROM_1BIT';
  
  // Helpers for multi-bit IO
  const isMultiBitInput = node.type.startsWith('INPUT_') && node.type.includes('BIT');
  const isMultiBitOutput = node.type.startsWith('OUTPUT_') && node.type.includes('BIT');
  const isMultiBit = isMultiBitInput || isMultiBitOutput;

  const getBitWidth = (type: NodeType) => {
      if (type.includes('2BIT')) return 2;
      if (type.includes('4BIT')) return 4;
      if (type.includes('8BIT')) return 8;
      if (type.includes('16BIT')) return 16;
      return 0;
  };

  const currentBitWidth = isMultiBit ? getBitWidth(node.type) : 0;

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdate(node.id, { properties: { ...node.properties, label: e.target.value } });
  };

  const handleInputCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const count = parseInt(e.target.value, 10);
      onUpdate(node.id, { 
          properties: { ...node.properties, inputCount: count }
      });
  };

  const handleBitWidthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const width = parseInt(e.target.value);
      let newType = node.type;
      
      if (isMultiBitInput) newType = `INPUT_${width}BIT` as NodeType;
      else if (isMultiBitOutput) newType = `OUTPUT_${width}BIT` as NodeType;
      
      if (newType !== node.type) {
          onUpdate(node.id, { type: newType });
      }
  };

  const handleDelayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const delay = Math.max(0, parseInt(e.target.value, 10) || 0);
      onUpdate(node.id, {
          properties: { ...node.properties, propagationDelay: delay }
      });
  };

  const handleInitialStateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdate(node.id, {
          properties: { ...node.properties, initialState: e.target.checked }
      });
  };

  const handleROMValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate(node.id, {
        properties: { ...node.properties, romValue: e.target.checked }
    });
};

  return (
    <div className="w-64 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 flex flex-col h-full shadow-xl transition-colors duration-300">
       <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center space-x-2">
          <div className="w-6 h-6 rounded bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center">
             <Settings2 size={14} className="text-cyan-600 dark:text-cyan-400" />
          </div>
          <span className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">Component Properties</span>
       </div>
       
       <div className="p-4 space-y-6 overflow-y-auto flex-1">
          {/* General Section */}
          <div className="space-y-3">
             <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">General</div>
             
             <div className="space-y-1">
                <label className="text-xs text-zinc-500 dark:text-zinc-400">Type</label>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 font-mono">
                    {node.type}
                </div>
             </div>

             <div className="space-y-1">
                <label className="text-xs text-zinc-500 dark:text-zinc-400">Label</label>
                <input 
                    type="text" 
                    value={node.properties?.label || ''} 
                    onChange={handleLabelChange}
                    placeholder="Component Name..."
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:border-cyan-500 focus:outline-none transition-colors"
                />
             </div>
          </div>

          <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

          {/* Attributes Section */}
          <div className="space-y-3">
             <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Attributes</div>

             {/* Dynamic Inputs for Gates */}
             {VARIABLE_INPUT_GATES.includes(node.type) && (
                 <div className="space-y-1">
                    <label className="text-xs text-zinc-500 dark:text-zinc-400">Number of Inputs</label>
                    <select 
                        value={node.properties?.inputCount || 2}
                        onChange={handleInputCountChange}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:border-cyan-500 focus:outline-none"
                    >
                        {[2,3,4,5,6,8].map(n => (
                            <option key={n} value={n}>{n} Inputs</option>
                        ))}
                    </select>
                 </div>
             )}

             {/* Bit Width for Multi-Bit IO */}
             {isMultiBit && (
                 <div className="space-y-1">
                     <label className="text-xs text-zinc-500 dark:text-zinc-400">Bit Width</label>
                     <select 
                        value={currentBitWidth}
                        onChange={handleBitWidthChange}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:border-cyan-500 focus:outline-none"
                    >
                        {[2,4,8,16].map(n => (
                            <option key={n} value={n}>{n}-Bit</option>
                        ))}
                    </select>
                 </div>
             )}

             {/* Propagation Delay for Logic Gates */}
             {isGate && (
                 <div className="space-y-1">
                     <label className="text-xs text-zinc-500 dark:text-zinc-400">Propagation Delay (ms)</label>
                     <input 
                        type="number"
                        value={node.properties?.propagationDelay || 0}
                        onChange={handleDelayChange}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:border-cyan-500 focus:outline-none"
                     />
                     <p className="text-[10px] text-zinc-500 dark:text-zinc-600">Simulated logic delay.</p>
                 </div>
             )}

             {/* Initial State for Switches or Flip Flops */}
             {(isStateful || isSwitch) && (
                 <div className="flex items-center justify-between bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded px-3 py-2">
                     <label className="text-xs text-zinc-500 dark:text-zinc-400">Initial State (High)</label>
                     <input 
                        type="checkbox"
                        checked={!!node.properties?.initialState}
                        onChange={handleInitialStateChange}
                        className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-cyan-500 focus:ring-0 focus:ring-offset-0"
                     />
                 </div>
             )}

             {/* ROM Value Configuration */}
             {isROM && (
                 <div className="flex items-center justify-between bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 rounded px-3 py-2">
                     <label className="text-xs text-zinc-500 dark:text-zinc-400">Stored Value (1)</label>
                     <input 
                        type="checkbox"
                        checked={!!node.properties?.romValue}
                        onChange={handleROMValueChange}
                        className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-800 text-cyan-500 focus:ring-0 focus:ring-offset-0"
                     />
                 </div>
             )}

             {!isGate && !isStateful && !isSwitch && !isROM && !isMultiBit && (
                <div className="text-xs text-zinc-400 dark:text-zinc-600 italic">
                    No configurable attributes.
                </div>
             )}
          </div>
       </div>

       <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400 dark:text-zinc-600 text-center">
           ID: <span className="font-mono text-zinc-500 dark:text-zinc-700">{node.id.split('-')[1]}...</span>
       </div>
    </div>
  );
};
