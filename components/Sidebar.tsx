
import React, { useState, useMemo } from 'react';
import { NodeType } from '../types';
import { 
  Combine, GitBranch, ArrowRightFromLine, AlertCircle, 
  Cpu, Calculator, Watch, Power, Disc, Grid3X3, Binary, Activity, ToggleLeft, Lightbulb, X, Search,
  Hash, Layers, Split, ArrowDown01, Database, ListOrdered, Save, Shield, Box, Zap, Share2, Ruler, MousePointer2
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
        className={`flex flex-col items-center justify-center p-3 border rounded-xl cursor-pointer transition-all shadow-sm min-h-[90px] w-full active:scale-95 touch-manipulation ${isActive ? 'bg-cyan-50 dark:bg-cyan-900/40 border-cyan-500 ring-2 ring-cyan-500 ring-opacity-20' : 'bg-white dark:bg-zinc-800/40 border-zinc-200 dark:border-zinc-700/50 hover:border-zinc-300 dark:hover:border-zinc-600'}`}
        role="button"
        aria-pressed={isActive}
    >
      <div className={`mb-2 shrink-0 transition-transform ${isActive ? 'text-cyan-600 dark:text-cyan-400 scale-110' : 'text-zinc-500 dark:text-zinc-400'}`}><Icon size={22} /></div>
      <span className={`text-[9px] font-bold text-center leading-tight break-words px-1 tracking-tight ${isActive ? 'text-cyan-700 dark:text-cyan-200' : 'text-zinc-600 dark:text-zinc-300'}`}>{label}</span>
    </div>
);

export const Sidebar: React.FC<SidebarProps> = ({ onSelectComponent, selectedComponent, width, onClose, isMobile }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const libraryData = useMemo(() => [
    {
      title: "Wiring & Routing",
      items: [
        {type: "VCC", icon: Zap, label: "VCC (+5V)"}, 
        {type: "GND", icon: Power, label: "GND"},
        {type: "CLOCK", icon: Watch, label: "Clock"}, 
        {type: "JUNCTION", icon: Share2, label: "Junction"},
        {type: "TRI_STATE_BUFFER", icon: Shield, label: "Tri-State"},
        {type: "BIT_EXTENDER", icon: Ruler, label: "Bit Extender"},
        {type: "LOGIC_PROBE", icon: Activity, label: "Probe"},
        {type: "BINARY_MONITOR_4BIT", icon: Activity, label: "Monitor 4b"},
        {type: "BINARY_MONITOR_8BIT", icon: Activity, label: "Monitor 8b"}
      ]
    },
    {
      title: "Logic Gates",
      items: [
        {type: "AND", icon: Combine, label: "AND"}, 
        {type: "OR", icon: GitBranch, label: "OR"},
        {type: "NOT", icon: ArrowRightFromLine, label: "NOT"}, 
        {type: "NAND", icon: Combine, label: "NAND"},
        {type: "NOR", icon: GitBranch, label: "NOR"}, 
        {type: "XOR", icon: AlertCircle, label: "XOR"},
        {type: "XNOR", icon: AlertCircle, label: "XNOR"},
        {type: "BUFFER", icon: ArrowRightFromLine, label: "Buffer"},
        {type: "ODD_PARITY", icon: Activity, label: "Odd Parity"},
        {type: "EVEN_PARITY", icon: Activity, label: "Even Parity"}
      ]
    },
    {
      title: "Plexers",
      items: [
        {type: "MUX_2_1", icon: Split, label: "Mux 2:1"}, 
        {type: "MUX_4_1", icon: Split, label: "Mux 4:1"}, 
        {type: "MUX_8_1", icon: Split, label: "Mux 8:1"}, 
        {type: "MUX_16_1", icon: Split, label: "Mux 16:1"}, 
        {type: "DEMUX_1_2", icon: Split, label: "Demux 1:2"}, 
        {type: "DEMUX_1_8", icon: Split, label: "Demux 1:8"}, 
        {type: "DECODER_2_4", icon: ArrowDown01, label: "Dec 2:4"},
        {type: "DECODER_4_16", icon: ArrowDown01, label: "Dec 4:16"},
        {type: "PRIORITY_ENCODER_4_2", icon: ArrowDown01, label: "Prio Enc"},
        {type: "ENCODER_8_3", icon: ArrowDown01, label: "Enc 8:3"}
      ]
    },
    {
      title: "Arithmetic",
      items: [
        {type: "ALU_4BIT", icon: Cpu, label: "ALU 4-Bit"},
        {type: "HALF_ADDER", icon: Calculator, label: "Half Adder"}, 
        {type: "FULL_ADDER", icon: Calculator, label: "Full Adder"},
        {type: "MULTIPLIER_4BIT", icon: Box, label: "Mult 4b"},
        {type: "MULTIPLIER_8BIT", icon: Box, label: "Mult 8b"},
        {type: "DIVIDER_8BIT", icon: Box, label: "Div 8b"},
        {type: "COMPARATOR_1BIT", icon: Layers, label: "Comp 1b"},
        {type: "COMPARATOR_8BIT", icon: Layers, label: "Comp 8b"},
        {type: "SHIFTER_8BIT", icon: ListOrdered, label: "Shifter 8b"}
      ]
    },
    {
      title: "Memory & Storage",
      items: [
        {type: "REG_8BIT", icon: Save, label: "Reg 8b"},
        {type: "COUNTER_8BIT", icon: ListOrdered, label: "Count 8b"},
        {type: "D_FF", icon: Database, label: "D-FF"},
        {type: "JK_FF", icon: Database, label: "JK-FF"},
        {type: "SR_FF", icon: Database, label: "SR-FF"},
        {type: "T_FF", icon: Database, label: "T-FF"},
        {type: "MEMORY_CELL", icon: Database, label: "Mem Cell"},
        {type: "SHIFT_REGISTER_8BIT", icon: ListOrdered, label: "SReg 8b"},
        {type: "RAM_256_8", icon: Database, label: "RAM 256x8"},
        {type: "ROM_8BIT", icon: Database, label: "ROM 16x8"}
      ]
    },
    {
      title: "Input/Output",
      items: [
        {type: "TOGGLE_SWITCH", icon: ToggleLeft, label: "Switch"}, 
        {type: "PUSH_BUTTON", icon: Disc, label: "Button"},
        {type: "LED", icon: Lightbulb, label: "LED"},
        {type: "RGB_LED", icon: Lightbulb, label: "RGB LED"},
        {type: "LED_BAR_8BIT", icon: Activity, label: "LED Bar 8b"},
        {type: "HEX_DIGIT", icon: Hash, label: "Hex Digit"},
        {type: "SEVEN_SEGMENT", icon: Grid3X3, label: "7-Seg"}
      ]
    },
    {
        title: "Bus Controls",
        items: [
            {type: "INPUT_4BIT", icon: Binary, label: "Bus In 4b"},
            {type: "INPUT_8BIT", icon: Binary, label: "Bus In 8b"},
            {type: "INPUT_16BIT", icon: Binary, label: "Bus In 16b"},
            {type: "OUTPUT_8BIT", icon: Binary, label: "Bus Out 8b"},
            {type: "OUTPUT_16BIT", icon: Binary, label: "Bus Out 16b"}
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

  return (
    <div style={{ width }} className="bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col h-full select-none z-50 shadow-xl overflow-hidden">
      <div className="sticky top-0 z-10 flex flex-col border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-[11px] text-zinc-800 dark:text-zinc-200 tracking-wider uppercase">Circuit Components</span>
            {isMobile && <button onClick={onClose} className="p-2 -mr-2 text-zinc-400"><X size={20}/></button>}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-zinc-400" size={14} />
            <input 
              type="text" placeholder="Search components..." value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-32">
        {filteredData.length > 0 ? filteredData.map(section => (
          <div className="mb-8" key={section.title}>
            <div className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1" />
              {section.title}
              <div className="h-px bg-zinc-200 dark:bg-zinc-800 flex-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {section.items.map(item => (
                <SidebarItem 
                  key={item.type} type={item.type as NodeType} icon={item.icon} 
                  label={item.label} isActive={selectedComponent === item.type} 
                  onClick={() => handleItemClick(item.type as NodeType)} 
                />
              ))}
            </div>
          </div>
        )) : (
            <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                <Search size={32} className="mb-4 opacity-20" />
                <p className="text-xs font-medium">No components found</p>
            </div>
        )}
      </div>
    </div>
  );
};
