
export type NodeType = 
  | 'AND' | 'OR' | 'NOT' | 'XOR' | 'NAND' | 'NOR' | 'XNOR' | 'BUFFER' | 'TRI_STATE_BUFFER'
  | 'TOGGLE_SWITCH' | 'LED' | 'CLOCK' | 'PUSH_BUTTON' | 'VCC' | 'GND'
  | 'INPUT_2BIT' | 'INPUT_4BIT' | 'INPUT_8BIT' | 'INPUT_16BIT'
  | 'OUTPUT_2BIT' | 'OUTPUT_4BIT' | 'OUTPUT_8BIT' | 'OUTPUT_16BIT'
  | 'HALF_ADDER' | 'FULL_ADDER' | 'SUBTRACTOR' | 'COMPARATOR_1BIT'
  | 'ALU_4BIT' | 'COUNTER_4BIT' | 'REG_4BIT'
  | 'D_LATCH' | 'D_FF' | 'JK_FF' | 'T_FF' | 'SR_FF'
  | 'GATED_SR_LATCH' | 'JK_MASTER_SLAVE' | 'MEMORY_CELL' | 'ROM_1BIT' | 'SHIFT_REGISTER_4BIT'
  | 'RAM_4BIT' | 'RAM_8BIT' | 'RAM_16BIT' | 'RAM_64_8' | 'RAM_256_8'
  | 'RAM_64BIT' | 'RAM_128BIT' | 'RAM_256BIT'
  | 'ROM_4BIT' | 'ROM_8BIT'
  | 'MUX_2_1' | 'MUX_4_1' | 'MUX_8_1' | 'DEMUX_1_2' | 'DEMUX_1_4' | 'DEMUX_1_8' | 'DEMUX_1_16'
  | 'DECODER_2_4' | 'DECODER_3_8' | 'PRIORITY_ENCODER_4_2'
  | 'HEX_DIGIT' | 'SEVEN_SEGMENT'
  // Corrected typo from JUNITION to JUNCTION
  | 'JUNCTION'
  | 'LOGIC_PROBE'
  | 'BINARY_MONITOR_4BIT'
  | 'BINARY_MONITOR_8BIT';

export interface Point {
  x: number;
  y: number;
}

export interface Port {
  id: string;
  type: 'input' | 'output';
  offset: Point;
  label?: string;
}

export interface NodeData {
  id: string;
  type: NodeType;
  position: Point;
  inputs: boolean[];
  outputs: boolean[];
  internalState?: {
    lastClock?: boolean;
    storedValue?: boolean;
    masterValue?: boolean; 
    register?: boolean[]; 
    memory?: number[]; 
    counterValue?: number;
    [key: string]: any;
  };
  properties?: {
    label?: string;
    inputCount?: number;
    propagationDelay?: number;
    initialState?: boolean;
    romValue?: boolean; 
    romData?: number[]; 
    [key: string]: any;
  };
}

export interface Wire {
  id: string;
  sourceNodeId: string;
  sourceOutputIndex: number;
  targetNodeId: string;
  targetInputIndex: number;
  state: boolean;
  color?: string; 
  activeColor?: string; 
  thickness?: number; 
}

export interface CircuitState {
  nodes: NodeData[];
  wires: Wire[];
}

export interface WiringState {
  sourceNodeId: string;
  sourceOutputIndex: number;
  startPoint: Point;
  active: boolean;
}