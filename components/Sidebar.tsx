import React from 'react';
import { NodeType } from '../types';
import { 
  SquareActivity, ToggleLeft, Lightbulb, 
  Combine, GitBranch, ArrowRightFromLine, AlertCircle, 
  BoxSelect, Cpu, Calculator, Watch, Power, Disc, Grid3X3
} from 'lucide-react';

const SidebarItem = ({ type, icon: Icon, label }: { type: NodeType; icon: any; label: string }) => {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/react-circuit-node', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="flex flex-col items-center justify-center p-3 mb-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg cursor-grab hover:bg-zinc-50 dark:hover:bg-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-500 transition-all shadow-sm group w-full h-full min-h-[80px]"
    >
      <div className="text-zinc-500 dark:text-zinc-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors mb-2 shrink-0">
        <Icon size={24} />
      </div>
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300 text-center leading-tight w-full break-words">{label}</span>
    </div>
  );
};

export const Sidebar: React.FC = () => {
  return (
    <div className="w-64 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col p-4 h-full select-none z-10 shadow-xl overflow-y-auto transition-colors duration-300">
      <div className="mb-6 flex flex-col items-center">
         <div className="w-10 h-10 bg-cyan-500 rounded-md flex items-center justify-center mb-2 shadow-lg shadow-cyan-500/20">
            <SquareActivity size={24} className="text-white" />
         </div>
         <span className="text-xs font-bold tracking-wider text-zinc-500 uppercase">LogicLab Ultra</span>
      </div>

      <div className="space-y-1 pb-4">
        <div className="text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-wide">Input/Output</div>
        <div className="grid grid-cols-2 gap-3">
            <SidebarItem type="SWITCH" icon={ToggleLeft} label="Switch" />
            <SidebarItem type="BUTTON" icon={Disc} label="Button" />
            <SidebarItem type="CLOCK" icon={Watch} label="Clock" />
            <SidebarItem type="BULB" icon={Lightbulb} label="Bulb" />
            <SidebarItem type="HEX_DISPLAY" icon={BoxSelect} label="Hex Display" />
            <SidebarItem type="SEVEN_SEGMENT" icon={BoxSelect} label="7-Segment" />
            <SidebarItem type="CONSTANT_1" icon={Power} label="Const 1" />
            <SidebarItem type="CONSTANT_0" icon={Power} label="Const 0" />
        </div>
        
        <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-4" />

        <div className="text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-wide">Multi-Bit I/O</div>
        <div className="grid grid-cols-2 gap-3">
            <SidebarItem type="INPUT_4BIT" icon={ToggleLeft} label="In 4-bit" />
            <SidebarItem type="OUTPUT_4BIT" icon={Lightbulb} label="Out 4-bit" />
            <SidebarItem type="INPUT_8BIT" icon={ToggleLeft} label="In 8-bit" />
            <SidebarItem type="OUTPUT_8BIT" icon={Lightbulb} label="Out 8-bit" />
            <SidebarItem type="INPUT_16BIT" icon={ToggleLeft} label="In 16-bit" />
            <SidebarItem type="OUTPUT_16BIT" icon={Lightbulb} label="Out 16-bit" />
        </div>

        <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-4" />
        
        <div className="text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-wide">Gates</div>
        <div className="grid grid-cols-2 gap-3">
            <SidebarItem type="AND" icon={Combine} label="AND" />
            <SidebarItem type="OR" icon={GitBranch} label="OR" />
            <SidebarItem type="NOT" icon={ArrowRightFromLine} label="NOT" />
            <SidebarItem type="NAND" icon={Combine} label="NAND" />
            <SidebarItem type="NOR" icon={GitBranch} label="NOR" />
            <SidebarItem type="XOR" icon={AlertCircle} label="XOR" />
            <SidebarItem type="XNOR" icon={AlertCircle} label="XNOR" />
            <SidebarItem type="BUFFER" icon={ArrowRightFromLine} label="Buffer" />
        </div>

        <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-4" />

        <div className="text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-wide">Arithmetic</div>
        <div className="grid grid-cols-2 gap-3">
            <SidebarItem type="HALF_ADDER" icon={Calculator} label="Half Adder" />
            <SidebarItem type="FULL_ADDER" icon={Calculator} label="Full Adder" />
            <SidebarItem type="SUBTRACTOR" icon={Calculator} label="Subtractor" />
            <SidebarItem type="COMPARATOR_1BIT" icon={Calculator} label="Comparator" />
        </div>

        <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-4" />

        <div className="text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-wide">Memory & Logic</div>
        <div className="grid grid-cols-2 gap-3">
            <SidebarItem type="D_LATCH" icon={Cpu} label="D Latch" />
            <SidebarItem type="D_FF" icon={Cpu} label="D Flip-Flop" />
            <SidebarItem type="T_FF" icon={Cpu} label="T Flip-Flop" />
            <SidebarItem type="JK_FF" icon={Cpu} label="JK Flip-Flop" />
            <SidebarItem type="SR_FF" icon={Cpu} label="SR Flip-Flop" />
            <SidebarItem type="GATED_SR_LATCH" icon={Cpu} label="Gated SR" />
            <SidebarItem type="JK_MASTER_SLAVE" icon={Cpu} label="JK M-S" />
            <SidebarItem type="RAM_1BIT" icon={Cpu} label="RAM 1-Bit" />
            <SidebarItem type="RAM_4BIT" icon={Grid3X3} label="RAM 16x4" />
            <SidebarItem type="RAM_8BIT" icon={Grid3X3} label="RAM 16x8" />
            <SidebarItem type="RAM_16BIT" icon={Grid3X3} label="RAM 16x16" />
            <SidebarItem type="ROM_1BIT" icon={Cpu} label="ROM 1-Bit" />
            <SidebarItem type="SHIFT_REGISTER_4BIT" icon={Cpu} label="Shift Reg 4b" />
        </div>

        <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-4" />

        <div className="text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-wide">Plexers</div>
        <div className="grid grid-cols-2 gap-3">
            <SidebarItem type="MUX_2_1" icon={BoxSelect} label="Mux 2:1" />
            <SidebarItem type="MUX_4_1" icon={BoxSelect} label="Mux 4:1" />
            <SidebarItem type="DEMUX_1_2" icon={BoxSelect} label="Demux 1:2" />
            <SidebarItem type="DEMUX_1_4" icon={BoxSelect} label="Demux 1:4" />
            <SidebarItem type="DECODER_2_4" icon={BoxSelect} label="Decoder 2:4" />
            <SidebarItem type="PRIORITY_ENCODER_4_2" icon={BoxSelect} label="Prio Encoder" />
        </div>
      </div>
    </div>
  );
};
