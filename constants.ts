
import { NodeType } from './types';

export const GRID_SIZE = 20;

// Helper to generate port offsets for multi-bit components
// Increased vertical spacing from 20 to 28 for better readability
const generatePorts = (count: number, x: number, startY: number = 40) => {
    return Array.from({ length: count }, (_, i) => ({
        x,
        y: startY + (i * 28),
        label: `${i}`
    }));
};

// Increased header (40) and footer (45) padding plus 28px per bit
const getMbHeight = (count: number) => 40 + (count * 28) + 45;

const ADDRESS_BITS = 4;
const getRamDefinition = (dataBits: number, name: string) => {
    const inputs = ADDRESS_BITS + dataBits + 2;
    const outputs = dataBits;
    const height = 30 + (ADDRESS_BITS * 20) + 10 + (dataBits * 20) + 10 + (2 * 20) + 20;
    const width = 140;

    const inputOffsets = [];
    let currentY = 40;
    for(let i=0; i<ADDRESS_BITS; i++) {
        inputOffsets.push({ x: 0, y: currentY, label: `A${i}` });
        currentY += 20;
    }
    currentY += 10;
    for(let i=0; i<dataBits; i++) {
        inputOffsets.push({ x: 0, y: currentY, label: `D${i}` });
        currentY += 20;
    }
    currentY += 10;
    inputOffsets.push({ x: 0, y: currentY, label: 'WE' });
    currentY += 20;
    inputOffsets.push({ x: 0, y: currentY, label: 'CS' });

    const outputOffsets = [];
    let outStartY = 30 + (ADDRESS_BITS * 20) + 10 + 10; 
    for(let i=0; i<dataBits; i++) {
        outputOffsets.push({ x: width, y: outStartY + (i*20), label: `Q${i}` });
    }

    return { width, height, inputs, outputs, inputOffsets, outputOffsets, name };
};

export const NODE_DEFINITIONS: Record<NodeType, {
  width: number;
  height: number;
  inputs: number;
  outputs: number;
  inputOffsets: { x: number, y: number, label?: string }[];
  outputOffsets: { x: number, y: number, label?: string }[];
  name: string;
}> = {
  AND: { width: 60, height: 60, inputs: 2, outputs: 1, inputOffsets: [{ x: 0, y: 15 }, { x: 0, y: 45 }], outputOffsets: [{ x: 60, y: 30 }], name: 'AND' },
  OR: { width: 60, height: 60, inputs: 2, outputs: 1, inputOffsets: [{ x: 0, y: 15 }, { x: 0, y: 45 }], outputOffsets: [{ x: 60, y: 30 }], name: 'OR' },
  XOR: { width: 60, height: 60, inputs: 2, outputs: 1, inputOffsets: [{ x: 0, y: 15 }, { x: 0, y: 45 }], outputOffsets: [{ x: 60, y: 30 }], name: 'XOR' },
  NAND: { width: 70, height: 60, inputs: 2, outputs: 1, inputOffsets: [{ x: 0, y: 15 }, { x: 0, y: 45 }], outputOffsets: [{ x: 70, y: 30 }], name: 'NAND' },
  NOR: { width: 70, height: 60, inputs: 2, outputs: 1, inputOffsets: [{ x: 0, y: 15 }, { x: 0, y: 45 }], outputOffsets: [{ x: 70, y: 30 }], name: 'NOR' },
  XNOR: { width: 70, height: 60, inputs: 2, outputs: 1, inputOffsets: [{ x: 0, y: 15 }, { x: 0, y: 45 }], outputOffsets: [{ x: 70, y: 30 }], name: 'XNOR' },
  NOT: { width: 50, height: 40, inputs: 1, outputs: 1, inputOffsets: [{ x: 0, y: 20 }], outputOffsets: [{ x: 50, y: 20 }], name: 'NOT' },
  BUFFER: { width: 40, height: 40, inputs: 1, outputs: 1, inputOffsets: [{ x: 0, y: 20 }], outputOffsets: [{ x: 40, y: 20 }], name: 'Buffer' },
  SWITCH: { width: 40, height: 40, inputs: 0, outputs: 1, inputOffsets: [], outputOffsets: [{ x: 40, y: 20 }], name: 'Switch' },
  BUTTON: { width: 40, height: 40, inputs: 0, outputs: 1, inputOffsets: [], outputOffsets: [{ x: 40, y: 20 }], name: 'Button' },
  BULB: { width: 40, height: 40, inputs: 1, outputs: 0, inputOffsets: [{ x: 0, y: 20 }], outputOffsets: [], name: 'LED' },
  CLOCK: { width: 40, height: 40, inputs: 0, outputs: 1, inputOffsets: [], outputOffsets: [{ x: 40, y: 20 }], name: 'Clock' },
  HEX_DISPLAY: { width: 60, height: 80, inputs: 4, outputs: 0, inputOffsets: [{ x: 0, y: 20, label: '1' }, { x: 0, y: 40, label: '2' }, { x: 0, y: 60, label: '4' }, { x: 30, y: 80, label: '8' }], outputOffsets: [], name: 'Hex Display' },
  SEVEN_SEGMENT: { width: 70, height: 100, inputs: 8, outputs: 0, inputOffsets: [{ x: 0, y: 10, label: 'a' }, { x: 0, y: 20, label: 'b' }, { x: 0, y: 30, label: 'c' }, { x: 0, y: 40, label: 'd' }, { x: 0, y: 50, label: 'e' }, { x: 0, y: 60, label: 'f' }, { x: 0, y: 70, label: 'g' }, { x: 0, y: 80, label: 'dp' }], outputOffsets: [], name: '7-Segment' },
  CONSTANT_1: { width: 30, height: 30, inputs: 0, outputs: 1, inputOffsets: [], outputOffsets: [{ x: 30, y: 15 }], name: 'Const 1' },
  CONSTANT_0: { width: 30, height: 30, inputs: 0, outputs: 1, inputOffsets: [], outputOffsets: [{ x: 30, y: 15 }], name: 'Const 0' },
  INPUT_2BIT: { width: 80, height: getMbHeight(2), inputs: 0, outputs: 2, inputOffsets: [], outputOffsets: generatePorts(2, 80, 40), name: 'Input 2-Bit' },
  INPUT_4BIT: { width: 90, height: getMbHeight(4), inputs: 0, outputs: 4, inputOffsets: [], outputOffsets: generatePorts(4, 90, 40), name: 'Input 4-Bit' },
  INPUT_8BIT: { width: 140, height: getMbHeight(8), inputs: 0, outputs: 8, inputOffsets: [], outputOffsets: generatePorts(8, 140, 40), name: 'Input 8-Bit' },
  INPUT_16BIT: { width: 240, height: getMbHeight(16), inputs: 0, outputs: 16, inputOffsets: [], outputOffsets: generatePorts(16, 240, 40), name: 'Input 16-Bit' },
  OUTPUT_2BIT: { width: 80, height: getMbHeight(2), inputs: 2, outputs: 0, inputOffsets: generatePorts(2, 0, 40), outputOffsets: [], name: 'Out 2-Bit' },
  OUTPUT_4BIT: { width: 90, height: getMbHeight(4), inputs: 4, outputs: 0, inputOffsets: generatePorts(4, 0, 40), outputOffsets: [], name: 'Out 4-Bit' },
  OUTPUT_8BIT: { width: 140, height: getMbHeight(8), inputs: 8, outputs: 0, inputOffsets: generatePorts(8, 0, 40), outputOffsets: [], name: 'Out 8-Bit' },
  OUTPUT_16BIT: { width: 240, height: getMbHeight(16), inputs: 16, outputs: 0, inputOffsets: generatePorts(16, 0, 40), outputOffsets: [], name: 'Out 16-Bit' },
  JUNCTION: { width: 10, height: 10, inputs: 1, outputs: 1, inputOffsets: [{ x: 5, y: 5 }], outputOffsets: [{ x: 5, y: 5 }], name: 'Junction' },
  HALF_ADDER: { width: 80, height: 80, inputs: 2, outputs: 2, inputOffsets: [{ x: 0, y: 20, label: 'A' }, { x: 0, y: 60, label: 'B' }], outputOffsets: [{ x: 80, y: 20, label: 'S' }, { x: 80, y: 60, label: 'C' }], name: 'Half Adder' },
  FULL_ADDER: { width: 80, height: 100, inputs: 3, outputs: 2, inputOffsets: [{ x: 0, y: 20, label: 'A' }, { x: 0, y: 40, label: 'B' }, { x: 0, y: 80, label: 'Cin' }], outputOffsets: [{ x: 80, y: 20, label: 'S' }, { x: 80, y: 80, label: 'Cout' }], name: 'Full Adder' },
  SUBTRACTOR: { width: 80, height: 100, inputs: 2, outputs: 2, inputOffsets: [{ x: 0, y: 20, label: 'A' }, { x: 0, y: 60, label: 'B' }], outputOffsets: [{ x: 80, y: 20, label: 'D' }, { x: 80, y: 80, label: 'Bo' }], name: 'Subtractor' },
  COMPARATOR_1BIT: { width: 80, height: 80, inputs: 2, outputs: 3, inputOffsets: [{ x: 0, y: 20, label: 'A' }, { x: 0, y: 60, label: 'B' }], outputOffsets: [{ x: 80, y: 20, label: '>' }, { x: 80, y: 40, label: '=' }, { x: 80, y: 60, label: '<' }], name: 'Comparator' },
  D_LATCH: { width: 80, height: 80, inputs: 2, outputs: 2, inputOffsets: [{ x: 0, y: 20, label: 'D' }, { x: 0, y: 60, label: 'En' }], outputOffsets: [{ x: 80, y: 20, label: 'Q' }, { x: 80, y: 60, label: "!Q" }], name: 'D-Latch' },
  D_FF: { width: 80, height: 80, inputs: 2, outputs: 2, inputOffsets: [{ x: 0, y: 20, label: 'D' }, { x: 0, y: 60, label: 'Clk' }], outputOffsets: [{ x: 80, y: 20, label: 'Q' }, { x: 80, y: 60, label: "!Q" }], name: 'D Flip-Flop' },
  T_FF: { width: 80, height: 80, inputs: 2, outputs: 2, inputOffsets: [{ x: 0, y: 20, label: 'T' }, { x: 0, y: 60, label: 'Clk' }], outputOffsets: [{ x: 80, y: 20, label: 'Q' }, { x: 80, y: 60, label: "!Q" }], name: 'T Flip-Flop' },
  JK_FF: { width: 80, height: 100, inputs: 3, outputs: 2, inputOffsets: [{ x: 0, y: 20, label: 'J' }, { x: 0, y: 50, label: 'Clk' }, { x: 0, y: 80, label: 'K' }], outputOffsets: [{ x: 80, y: 20, label: 'Q' }, { x: 80, y: 80, label: "!Q" }], name: 'J-K Flip-Flop' },
  SR_FF: { width: 80, height: 100, inputs: 3, outputs: 2, inputOffsets: [{ x: 0, y: 20, label: 'S' }, { x: 0, y: 50, label: 'Clk' }, { x: 0, y: 80, label: 'R' }], outputOffsets: [{ x: 80, y: 20, label: 'Q' }, { x: 80, y: 80, label: "!Q" }], name: 'S-R Flip-Flop' },
  GATED_SR_LATCH: { width: 80, height: 100, inputs: 3, outputs: 2, inputOffsets: [{ x: 0, y: 20, label: 'S' }, { x: 0, y: 50, label: 'En' }, { x: 0, y: 80, label: 'R' }], outputOffsets: [{ x: 80, y: 20, label: 'Q' }, { x: 80, y: 80, label: "!Q" }], name: 'Gated SR Latch' },
  JK_MASTER_SLAVE: { width: 90, height: 100, inputs: 3, outputs: 2, inputOffsets: [{ x: 0, y: 20, label: 'J' }, { x: 0, y: 50, label: 'Clk' }, { x: 0, y: 80, label: 'K' }], outputOffsets: [{ x: 90, y: 20, label: 'Q' }, { x: 90, y: 80, label: "!Q" }], name: 'JK Master-Slave' },
  RAM_1BIT: { width: 70, height: 80, inputs: 3, outputs: 1, inputOffsets: [{ x: 0, y: 20, label: 'D' }, { x: 0, y: 40, label: 'W' }, { x: 0, y: 60, label: 'Sel' }], outputOffsets: [{ x: 70, y: 40, label: 'Q' }], name: 'RAM 1-Bit' },
  ROM_1BIT: { width: 60, height: 60, inputs: 1, outputs: 1, inputOffsets: [{ x: 0, y: 30, label: 'Sel' }], outputOffsets: [{ x: 60, y: 30, label: 'Q' }], name: 'ROM 1-Bit' },
  SHIFT_REGISTER_4BIT: { width: 100, height: 120, inputs: 2, outputs: 4, inputOffsets: [{ x: 0, y: 30, label: 'D' }, { x: 0, y: 90, label: 'Clk' }], outputOffsets: [{ x: 100, y: 20, label: 'Q0' }, { x: 100, y: 50, label: 'Q1' }, { x: 100, y: 80, label: 'Q2' }, { x: 100, y: 110, label: 'Q3' }], name: 'Shift Reg 4-Bit' },
  RAM_4BIT: getRamDefinition(4, 'RAM 16x4'),
  RAM_8BIT: getRamDefinition(8, 'RAM 16x8'),
  RAM_16BIT: getRamDefinition(16, 'RAM 16x16'),
  MUX_2_1: { width: 60, height: 80, inputs: 3, outputs: 1, inputOffsets: [{ x: 0, y: 20, label: '0' }, { x: 0, y: 60, label: '1' }, { x: 30, y: 80, label: 'S' }], outputOffsets: [{ x: 60, y: 40, label: 'Y' }], name: 'Mux 2:1' },
  MUX_4_1: { width: 60, height: 120, inputs: 6, outputs: 1, inputOffsets: [{ x: 0, y: 20, label: '0' }, { x: 0, y: 40, label: '1' }, { x: 0, y: 60, label: '2' }, { x: 0, y: 80, label: '3' }, { x: 20, y: 120, label: 'S0' }, { x: 40, y: 120, label: 'S1' }], outputOffsets: [{ x: 60, y: 60, label: 'Y' }], name: 'Mux 4:1' },
  DEMUX_1_2: { width: 60, height: 80, inputs: 2, outputs: 2, inputOffsets: [{ x: 0, y: 40, label: 'D' }, { x: 30, y: 80, label: 'S' }], outputOffsets: [{ x: 60, y: 20, label: '0' }, { x: 60, y: 60, label: '1' }], name: 'Demux 1:2' },
  DEMUX_1_4: { width: 60, height: 120, inputs: 3, outputs: 4, inputOffsets: [{ x: 0, y: 60, label: 'D' }, { x: 20, y: 120, label: 'S0' }, { x: 40, y: 120, label: 'S1' }], outputOffsets: [{ x: 60, y: 20, label: '0' }, { x: 60, y: 40, label: '1' }, { x: 60, y: 60, label: '2' }, { x: 60, y: 80, label: '3' }], name: 'Demux 1:4' },
  DECODER_2_4: { width: 60, height: 100, inputs: 2, outputs: 4, inputOffsets: [{ x: 0, y: 80, label: 'S0' }, { x: 0, y: 100, label: 'S1' }], outputOffsets: [{ x: 60, y: 20, label: '0' }, { x: 60, y: 40, label: '1' }, { x: 60, y: 60, label: '2' }, { x: 60, y: 80, label: '3' }], name: 'Decoder 2:4' },
  PRIORITY_ENCODER_4_2: { width: 70, height: 100, inputs: 4, outputs: 3, inputOffsets: [{ x: 0, y: 20, label: '0' }, { x: 0, y: 40, label: '1' }, { x: 0, y: 60, label: '2' }, { x: 0, y: 80, label: '3' }], outputOffsets: [{ x: 70, y: 30, label: 'A0' }, { x: 70, y: 50, label: 'A1' }, { x: 70, y: 80, label: 'V' }], name: 'Prio Encoder' },
  LOGIC_PROBE: { 
      width: 40, height: 40, inputs: 1, outputs: 0, 
      inputOffsets: [{ x: 0, y: 20 }], outputOffsets: [], 
      name: 'Logic Probe' 
  },
  BINARY_MONITOR_4BIT: { 
      width: 100, height: 40, inputs: 4, outputs: 0, 
      inputOffsets: generatePorts(4, 0, 10), outputOffsets: [], 
      name: 'Bin Monitor 4b' 
  },
  BINARY_MONITOR_8BIT: { 
      width: 180, height: 40, inputs: 8, outputs: 0, 
      inputOffsets: generatePorts(8, 0, 10), outputOffsets: [], 
      name: 'Bin Monitor 8b' 
  }
};
