import React, { useState, useMemo } from 'react';
import { NodeType } from '../types';
import { 
  Combine, GitBranch, ArrowRightFromLine, AlertCircle, 
  BoxSelect, Cpu, Calculator, Watch, Power, Disc, Grid3X3, Binary, Activity, ToggleLeft, Lightbulb, X, Search
} from 'lucide-react';

interface SidebarProps {
  onSelectComponent: (type: NodeType | null) => void;
  selectedComponent: NodeType | null;
  width: number | string;
  onClose?: () => void;
  isMobile?: boolean;
}

const SidebarItem: React.FC<{ type: NodeType, icon: any, label: string, isActive: boolean, onClick: () => void }> = ({ type, icon: Icon, label, isActive, onClick }) => (
    <div 
        onClick={onClick} 
        className={`flex flex-col items-center justify-center p-3 border rounded-xl cursor-pointer transition-all shadow-sm min-h-[90px] w-full active:scale-95 touch-manipulation ${isActive ? 'bg-cyan-50 dark:bg-cyan-900/30 border-cyan-500 ring-2 ring-cyan-500 ring-opacity-20' : 'bg-white dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/50 hover:border-zinc-300 dark:hover:border-zinc-600'}`}
        role="button"
        aria-pressed={isActive}
    >
      <div className={`mb-2 shrink-0 transition-transform ${isActive ? 'text-cyan-600 dark:text-cyan-400 scale-110' : 'text-zinc-500 dark:text-zinc-400'}`}><Icon size={28} /></div>
      <span className={`text-[11px] font-bold text-center leading-tight break-words px-1 tracking-tight ${isActive ? 'text-cyan-700 dark:text-cyan-200' : 'text-zinc-600 dark:text-zinc-300'}`}>{label}</span>
    </div>
);

export const Sidebar: React.FC<SidebarProps> = ({ onSelectComponent, selectedComponent, width, onClose, isMobile }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const libraryData = useMemo(() => [
    {
      title: "I/O Controls",
      items: [
        {type: "SWITCH", icon: ToggleLeft, label: "Switch"}, 
        {type: "BUTTON", icon: Disc, label: "Button"},
        {type: "CLOCK", icon: Watch, label: "Clock"}, 
        {type: "LOGIC_PROBE", icon: Activity, label: "Probe"},
        {type: "BULB", icon: Lightbulb, label: "LED"}, 
        {type: "HEX_DISPLAY", icon: BoxSelect, label: "Hex Disp"},
        {type: "CONSTANT_1", icon: Power, label: "High"}, 
        {type: "CONSTANT_0", icon: Power, label: "Low"}
      ]
    },
    {
      title: "Monitoring",
      items: [
        {type: "BINARY_MONITOR_4BIT", icon: Binary, label: "Bin 4b"}, 
        {type: "BINARY_MONITOR_8BIT", icon: Binary, label: "Bin 8b"},
        {type: "OUTPUT_4BIT", icon: Lightbulb, label: "Bus 4b"}, 
        {type: "OUTPUT_8BIT", icon: Lightbulb, label: "Bus 8b"}
      ]
    },
    {
      title: "Combinational",
      items: [
        {type: "AND", icon: Combine, label: "AND Gate"}, 
        {type: "OR", icon: GitBranch, label: "OR Gate"},
        {type: "NOT", icon: ArrowRightFromLine, label: "Inverter"}, 
        {type: "NAND", icon: Combine, label: "NAND Gate"},
        {type: "NOR", icon: GitBranch, label: "NOR Gate"}, 
        {type: "XOR", icon: AlertCircle, label: "XOR Gate"}
      ]
    },
    {
      title: "Sequential",
      items: [
        {type: "D_FF", icon: Cpu, label: "D-FF"}, 
        {type: "T_FF", icon: Cpu, label: "T-FF"},
        {type: "JK_FF", icon: Cpu, label: "JK-FF"}, 
        {type: "RAM_1BIT", icon: Cpu, label: "RAM 1b"},
        {type: "RAM_4BIT", icon: Grid3X3, label: "RAM 16x4"}, 
        {type: "SHIFT_REGISTER_4BIT", icon: Cpu, label: "Shift Reg"}
      ]
    }
  ], []);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return libraryData;
    const query = searchQuery.toLowerCase();
    return libraryData.map(section => ({
      ...section,
      items: section.items.filter(item => 
        item.label.toLowerCase().includes(query) || 
        item.type.toLowerCase().includes(query)
      )
    })).filter(section => section.items.length > 0);
  }, [libraryData, searchQuery]);

  const handleItemClick = (type: NodeType) => selectedComponent === type ? onSelectComponent(null) : onSelectComponent(type);

  const renderSection = (title: string, items: {type: NodeType, icon: any, label: string}[]) => (
    <div className="mb-8" key={title}>
        <div className="flex items-center gap-2 mb-4">
            <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1" />
            <div className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">{title}</div>
            <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1" />
        </div>
        <div className="grid grid-cols-2 gap-3">
            {items.map(item => <SidebarItem key={item.type} type={item.type as NodeType} icon={item.icon} label={item.label} isActive={selectedComponent === item.type} onClick={() => handleItemClick(item.type as NodeType)} />)}
        </div>
    </div>
  );

  return (
    <div style={{ width }} className="bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full select-none z-50 shadow-xl transition-colors duration-300 overflow-hidden">
      <div className="sticky top-0 z-10 flex flex-col border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shrink-0 p-4 space-y-4">
          <div className="flex items-center">
            <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200 tracking-tight">Components</span>
            {isMobile && (
              <button 
                  onClick={onClose} 
                  className="ml-auto p-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
              >
                  <X size={22}/>
              </button>
            )}
          </div>
          
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400 group-focus-within:text-cyan-500 transition-colors">
              <Search size={16} />
            </div>
            <input 
              type="text"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-zinc-700 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 shadow-inner"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X size={16} />
              </button>
            )}
          </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar overscroll-contain pb-32">
        {filteredData.length > 0 ? (
          filteredData.map(section => renderSection(section.title, section.items))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-60">
            <Search size={32} className="text-zinc-400 mb-3" />
            <p className="text-sm font-bold text-zinc-600 dark:text-zinc-300">No results</p>
          </div>
        )}
      </div>
    </div>
  );
};