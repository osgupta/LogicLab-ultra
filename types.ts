
export type NodeType = 
  | 'AND' | 'OR' | 'NOT' | 'XOR' | 'NAND' | 'NOR' | 'XNOR' | 'BUFFER'
  | 'SWITCH' | 'BULB' | 'CLOCK' | 'BUTTON' | 'CONSTANT_1' | 'CONSTANT_0'
  | 'INPUT_2BIT' | 'INPUT_4BIT' | 'INPUT_8BIT' | 'INPUT_16BIT'
  | 'OUTPUT_2BIT' | 'OUTPUT_4BIT' | 'OUTPUT_8BIT' | 'OUTPUT_16BIT'
  | 'HALF_ADDER' | 'FULL_ADDER' | 'SUBTRACTOR' | 'COMPARATOR_1BIT'
  | 'D_LATCH' | 'D_FF' | 'JK_FF' | 'T_FF' | 'SR_FF'
  | 'GATED_SR_LATCH' | 'JK_MASTER_SLAVE' | 'RAM_1BIT' | 'ROM_1BIT' | 'SHIFT_REGISTER_4BIT'
  | 'RAM_4BIT' | 'RAM_8BIT' | 'RAM_16BIT'
  | 'MUX_2_1' | 'MUX_4_1' | 'DEMUX_1_2' | 'DEMUX_1_4'
  | 'DECODER_2_4' | 'PRIORITY_ENCODER_4_2'
  | 'HEX_DISPLAY' | 'SEVEN_SEGMENT'
  | 'JUNCTION';

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
  // Used for stateful components like Flip-Flops to detect edges
  internalState?: {
    lastClock?: boolean;
    storedValue?: boolean;
    masterValue?: boolean; // For Master-Slave
    register?: boolean[]; // For Shift Register
    memory?: number[]; // For RAM arrays
    [key: string]: any;
  };
  // Customizable properties
  properties?: {
    label?: string;
    inputCount?: number;
    propagationDelay?: number;
    initialState?: boolean;
    romValue?: boolean; // For ROM
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
