
import { NodeType } from './types';

export const GRID_SIZE = 20;
export const MB_SPACING = 24;
export const MB_START_Y = 35;
export const MB_ROW_HEIGHT = 20;

const generatePorts = (count: number, x: number, startY: number = MB_START_Y, spacing: number = MB_SPACING) => {
    return Array.from({ length: count }, (_, i) => ({
        x,
        y: startY + (i * spacing) + (spacing / 2),
        label: `${i}`
    }));
};

const getMbHeight = (count: number) => MB_START_Y + (count * MB_SPACING) + 70;

const getRamDefinition = (addrBits: number, dataBits: number, name: string) => {
    const inputs = addrBits + dataBits + 2; 
    const outputs = dataBits;
    const maxPortCount = Math.max(addrBits + dataBits + 2, dataBits);
    const height = Math.max(160, maxPortCount * 18 + 60);
    const width = 180; // Slightly wider for better label visibility
    const inputOffsets = [];
    let currentY = 40;
    for(let i=0; i<addrBits; i++) { inputOffsets.push({ x: 0, y: currentY, label: `A${i}` }); currentY += 18; }
    currentY += 10;
    for(let i=0; i<dataBits; i++) { inputOffsets.push({ x: 0, y: currentY, label: `D${i}` }); currentY += 18; }
    currentY += 10;
    inputOffsets.push({ x: 0, y: currentY, label: 'WE' }); currentY += 18;
    inputOffsets.push({ x: 0, y: currentY, label: 'CS' });
    const outputOffsets = [];
    let outStartY = 40 + (addrBits * 18) + 10; 
    for(let i=0; i<dataBits; i++) { outputOffsets.push({ x: width, y: outStartY + (i*18), label: `Q${i}` }); }
    return { width, height, inputs, outputs, inputOffsets, outputOffsets, name };
};

const getRomDefinition = (addrBits: number, dataBits: number, name: string) => {
    const inputs = addrBits + 1; 
    const outputs = dataBits;
    const height = Math.max(120, Math.max(addrBits + 1, dataBits) * 20 + 40);
    const width = 140;
    const inputOffsets = [];
    for(let i=0; i<addrBits; i++) { inputOffsets.push({ x: 0, y: 40 + i * 20, label: `A${i}` }); }
    inputOffsets.push({ x: 0, y: 40 + addrBits * 20 + 10, label: 'CS' });
    const outputOffsets = [];
    for(let i=0; i<dataBits; i++) { outputOffsets.push({ x: width, y: 40 + i * 20, label: `Q${i}` }); }
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
  TRI_STATE_BUFFER: { width: 50, height: 60, inputs: 2, outputs: 1, inputOffsets: [{ x: 0, y: 20, label: 'D' }, { x: 25, y: 0, label: 'EN' }], outputOffsets: [{ x: 50, y: 20, label: 'Q' }], name: 'Tri-State' },
  TOGGLE_SWITCH: { width: 40, height: 40, inputs: 0, outputs: 1, inputOffsets: [], outputOffsets: [{ x: 40, y: 20 }], name: 'Switch' },
  PUSH_BUTTON: { width: 40, height: 40, inputs: 0, outputs: 1, inputOffsets: [], outputOffsets: [{ x: 40, y: 20 }], name: 'Button' },
  LED: { width: 40, height: 40, inputs: 1, outputs: 0, inputOffsets: [{ x: 0, y: 20 }], outputOffsets: [], name: 'LED' },
  CLOCK: { width: 40, height: 40, inputs: 0, outputs: 1, inputOffsets: [], outputOffsets: [{ x: 40, y: 20 }], name: 'Clock' },
  HEX_DIGIT: { width: 60, height: 80, inputs: 4, outputs: 0, inputOffsets: [{ x: 0, y: 20, label: '1' }, { x: 0, y: 40, label: '2' }, { x: 0, y: 60, label: '4' }, { x: 30, y: 80, label: '8' }], outputOffsets: [], name: 'Hex Digit' },
  SEVEN_SEGMENT: { width: 70, height: 100, inputs: 8, outputs: 0, inputOffsets: [{ x: 0, y: 10, label: 'a' }, { x: 0, y: 20, label: 'b' }, { x: 0, y: 30, label: 'c' }, { x: 0, y: 40, label: 'd' }, { x: 0, y: 50, label: 'e' }, { x: 0, y: 60, label: 'f' }, { x: 0, y: 70, label: 'g' }, { x: 0, y: 80, label: 'dp' }], outputOffsets: [], name: '7-Segment' },
  VCC: { width: 30, height: 30, inputs: 0, outputs: 1, inputOffsets: [], outputOffsets: [{ x: 30, y: 15 }], name: 'VCC (+5V)' },
  GND: { width: 30, height: 30, inputs: 0, outputs: 1, inputOffsets: [], outputOffsets: [{ x: 30, y: 15 }], name: 'GND' },
  INPUT_2BIT: { width: 140, height: getMbHeight(2), inputs: 0, outputs: 2, inputOffsets: [], outputOffsets: generatePorts(2, 140), name: 'Input 2-Bit' },
  INPUT_4BIT: { width: 160, height: getMbHeight(4), inputs: 0, outputs: 4, inputOffsets: [], outputOffsets: generatePorts(4, 160), name: 'Input 4-Bit' },
  INPUT_8BIT: { width: 180, height: getMbHeight(8), inputs: 0, outputs: 8, inputOffsets: [], outputOffsets: generatePorts(8, 180), name: 'Input 8-Bit' },
  INPUT_16BIT: { width: 240, height: getMbHeight(16), inputs: 0, outputs: 16, inputOffsets: [], outputOffsets: generatePorts(16, 240), name: 'Input 16-Bit' },
  OUTPUT_2BIT: { width: 140, height: getMbHeight(2), inputs: 2, outputs: 0, inputOffsets: generatePorts(2, 0), outputOffsets: [], name: 'Out 2-Bit' },
  OUTPUT_4BIT: { width: 160, height: getMbHeight(4), inputs: 4, outputs: 0, inputOffsets: generatePorts(4, 0), outputOffsets: [], name: 'Out 4-Bit' },
  OUTPUT_8BIT: { width: 180, height: getMbHeight(8), inputs: 8, outputs: 0, inputOffsets: generatePorts(8, 0), outputOffsets: [], name: 'Out 8-Bit' },
  OUTPUT_16BIT: { width: 240, height: getMbHeight(16), inputs: 16, outputs: 0, inputOffsets: generatePorts(16, 0), outputOffsets: [], name: 'Out 16-Bit' },
  JUNCTION: { width: 10, height: 10, inputs: 1, outputs: 1, inputOffsets: [{ x: 5, y: 5 }], outputOffsets: [{ x: 5, y: 5 }], name: 'Junction' },
  HALF_ADDER: { width: 80, height: 80, inputs: 2, outputs: 2, inputOffsets: [{ x: 0, y: 20, label: 'A' }, { x: 0, y: 60, label: 'B' }], outputOffsets: [{ x: 80, y: 20, label: 'S' }, { x: 80, y: 60, label: 'C' }], name: 'Half Adder' },
  FULL_ADDER: { width: 80, height: 100, inputs: 3, outputs: 2, inputOffsets: [{ x: 0, y: 20, label: 'A' }, { x: 0, y: 40, label: 'B' }, { x: 0, y: 80, label: 'Cin' }], outputOffsets: [{ x: 80, y: 20, label: 'S' }, { x: 80, y: 80, label: 'Cout' }], name: 'Full Adder' },
  SUBTRACTOR: { width: 80, height: 100, inputs: 2, outputs: 2, inputOffsets: [{ x: 0, y: 20, label: 'A' }, { x: 0, y: 60, label: 'B' }], outputOffsets: [{ x: 80, y: 20, label: 'D' }, { x: 80, y: 80, label: 'Bo' }], name: 'Subtractor' },
  COMPARATOR_1BIT: { width: 80, height: 80, inputs: 2, outputs: 3, inputOffsets: [{ x: 0, y: 20, label: 'A' }, { x: 0, y: 60, label: 'B' }], outputOffsets: [{ x: 80, y: 20, label: '>' }, { x: 80, y: 40, label: '=' }, { x: 80, y: 60, label: '<' }], name: 'Comparator' },
  ALU_4BIT: { 
    width: 120, height: 160, inputs: 10, outputs: 6,
    inputOffsets: [
      ...Array.from({length: 4}, (_, i) => ({ x: 0, y: 20 + i * 15, label: `A${i}` })),
      ...Array.from({length: 4}, (_, i) => ({ x: 0, y: 100 + i * 15, label: `B${i}` })),
      { x: 40, y: 160, label: 'Op0' }, { x: 80, y: 160, label: 'Op1' }
    ],
    outputOffsets: [
      ...Array.from({length: 4}, (_, i) => ({ x: 120, y: 40 + i * 15, label: `Y${i}` })),
      { x: 120, y: 120, label: 'Cy' }, { x: 120, y: 140, label: 'Zr' }
    ],
    name: 'ALU 4-Bit'
  },
  COUNTER_4BIT: { 
    width: 80, height: 100, inputs: 2, outputs: 4,
    inputOffsets: [{ x: 0, y: 40, label: 'Clk' }, { x: 0, y: 70, label: 'Rst' }],
    outputOffsets: Array.from({length: 4}, (_, i) => ({ x: 80, y: 20 + i * 20, label: `Q${i}` })),
    name: 'Counter 4-Bit'
  },
  REG_4BIT: { 
    width: 80, height: 120, inputs: 5, outputs: 4,
    inputOffsets: [...Array.from({length: 4}, (_, i) => ({ x: 0, y: 20 + i * 15, label: `D${i}` })), { x: 0, y: 100, label: 'Clk' }],
    outputOffsets: Array.from({length: 4}, (_, i) => ({ x: 80, y: 20 + i * 15, label: `Q${i}` })),
    name: 'Register 4-Bit'
  },
  D_LATCH: { width: 80, height: 80, inputs: 2, outputs: 2, inputOffsets: [{ x: 0, y: 20, label: 'D' }, { x: 0, y: 60, label: 'En' }], outputOffsets: [{ x: 80, y: 20, label: 'Q' }, { x: 80, y: 60, label: "!Q" }], name: 'D-Latch' },
  D_FF: { width: 80, height: 80, inputs: 2, outputs: 2, inputOffsets: [{ x: 0, y: 20, label: 'D' }, { x: 0, y: 60, label: 'Clk' }], outputOffsets: [{ x: 80, y: 20, label: 'Q' }, { x: 80, y: 60, label: "!Q" }], name: 'D Flip-Flop' },
  T_FF: { width: 80, height: 80, inputs: 2, outputs: 2, inputOffsets: [{ x: 0, y: 20, label: 'T' }, { x: 0, y: 60, label: 'Clk' }], outputOffsets: [{ x: 80, y: 20, label: 'Q' }, { x: 80, y: 60, label: "!Q" }], name: 'T Flip-Flop' },
  JK_FF: { width: 80, height: 100, inputs: 3, outputs: 2, inputOffsets: [{ x: 0, y: 20, label: 'J' }, { x: 0, y: 50, label: 'Clk' }, { x: 0, y: 80, label: 'K' }], outputOffsets: [{ x: 80, y: 20, label: 'Q' }, { x: 80, y: 80, label: "!Q" }], name: 'J-K Flip-Flop' },
  SR_FF: { width: 80, height: 100, inputs: 3, outputs: 2, inputOffsets: [{ x: 0, y: 20, label: 'S' }, { x: 0, y: 50, label: 'Clk' }, { x: 0, y: 80, label: 'R' }], outputOffsets: [{ x: 80, y: 20, label: 'Q' }, { x: 80, y: 80, label: "!Q" }], name: 'S-R Flip-Flop' },
  GATED_SR_LATCH: { width: 80, height: 100, inputs: 3, outputs: 2, inputOffsets: [{ x: 0, y: 20, label: 'S' }, { x: 0, y: 50, label: 'En' }, { x: 0, y: 80, label: 'R' }], outputOffsets: [{ x: 80, y: 20, label: 'Q' }, { x: 80, y: 80, label: "!Q" }], name: 'Gated SR Latch' },
  JK_MASTER_SLAVE: { width: 90, height: 100, inputs: 3, outputs: 2, inputOffsets: [{ x: 0, y: 20, label: 'J' }, { x: 0, y: 50, label: 'Clk' }, { x: 0, y: 80, label: 'K' }], outputOffsets: [{ x: 90, y: 20, label: 'Q' }, { x: 90, y: 80, label: "!Q" }], name: 'JK Master-Slave' },
  MEMORY_CELL: { width: 70, height: 80, inputs: 3, outputs: 1, inputOffsets: [{ x: 0, y: 20, label: 'D' }, { x: 0, y: 40, label: 'W' }, { x: 0, y: 60, label: 'Sel' }], outputOffsets: [{ x: 70, y: 40, label: 'Q' }], name: 'Memory Cell' },
  ROM_1BIT: { width: 60, height: 60, inputs: 1, outputs: 1, inputOffsets: [{ x: 0, y: 30, label: 'Sel' }], outputOffsets: [{ x: 60, y: 30, label: 'Q' }], name: 'ROM 1-Bit' },
  SHIFT_REGISTER_4BIT: { width: 100, height: 120, inputs: 2, outputs: 4, inputOffsets: [{ x: 0, y: 30, label: 'D' }, { x: 0, y: 90, label: 'Clk' }], outputOffsets: [{ x: 100, y: 20, label: 'Q0' }, { x: 100, y: 50, label: 'Q1' }, { x: 100, y: 80, label: 'Q2' }, { x: 100, y: 110, label: 'Q3' }], name: 'Shift Reg 4-Bit' },
  RAM_4BIT: getRamDefinition(4, 4, 'RAM 16x4'),
  RAM_8BIT: getRamDefinition(4, 8, 'RAM 16x8'),
  RAM_16BIT: getRamDefinition(4, 16, 'RAM 16x16'),
  RAM_64_8: getRamDefinition(6, 8, 'RAM 64x8'),
  RAM_256_8: getRamDefinition(8, 8, 'RAM 256x8'),
  RAM_64BIT: getRamDefinition(3, 8, 'RAM 64-bit (8x8)'),
  RAM_128BIT: getRamDefinition(4, 8, 'RAM 128-bit (16x8)'),
  RAM_256BIT: getRamDefinition(5, 8, 'RAM 256-bit (32x8)'),
  ROM_4BIT: getRomDefinition(4, 4, 'ROM 16x4'),
  ROM_8BIT: getRomDefinition(4, 8, 'ROM 16x8'),
  MUX_2_1: { width: 60, height: 80, inputs: 3, outputs: 1, inputOffsets: [{ x: 0, y: 20, label: '0' }, { x: 0, y: 60, label: '1' }, { x: 30, y: 80, label: 'S' }], outputOffsets: [{ x: 60, y: 40, label: 'Y' }], name: 'Mux 2:1' },
  MUX_4_1: { width: 60, height: 120, inputs: 6, outputs: 1, inputOffsets: [{ x: 0, y: 20, label: '0' }, { x: 0, y: 40, label: '1' }, { x: 0, y: 60, label: '2' }, { x: 0, y: 80, label: '3' }, { x: 20, y: 120, label: 'S0' }, { x: 40, y: 120, label: 'S1' }], outputOffsets: [{ x: 60, y: 60, label: 'Y' }], name: 'Mux 4:1' },
  MUX_8_1: { 
    width: 60, height: 220, inputs: 11, outputs: 1, 
    inputOffsets: [
        ...Array.from({length: 8}, (_, i) => ({ x: 0, y: 20 + i * 20, label: `${i}` })),
        { x: 10, y: 220, label: 'S0' }, { x: 30, y: 220, label: 'S1' }, { x: 50, y: 220, label: 'S2' }
    ], 
    outputOffsets: [{ x: 60, y: 110, label: 'Y' }], 
    name: 'Mux 8:1' 
  },
  DEMUX_1_2: { width: 60, height: 80, inputs: 2, outputs: 2, inputOffsets: [{ x: 0, y: 40, label: 'D' }, { x: 30, y: 80, label: 'S' }], outputOffsets: [{ x: 60, y: 20, label: '0' }, { x: 60, y: 60, label: '1' }], name: 'Demux 1:2' },
  DEMUX_1_4: { width: 60, height: 120, inputs: 3, outputs: 4, inputOffsets: [{ x: 0, y: 60, label: 'D' }, { x: 20, y: 120, label: 'S0' }, { x: 40, y: 120, label: 'S1' }], outputOffsets: [{ x: 60, y: 20, label: '0' }, { x: 60, y: 40, label: '1' }, { x: 60, y: 60, label: '2' }, { x: 60, y: 80, label: '3' }], name: 'Demux 1:4' },
  DEMUX_1_8: { 
    width: 60, height: 220, inputs: 4, outputs: 8, 
    inputOffsets: [
        { x: 0, y: 110, label: 'D' },
        { x: 10, y: 220, label: 'S0' }, { x: 30, y: 220, label: 'S1' }, { x: 50, y: 220, label: 'S2' }
    ], 
    outputOffsets: Array.from({length: 8}, (_, i) => ({ x: 60, y: 20 + i * 20, label: `${i}` })), 
    name: 'Demux 1:8' 
  },
  DEMUX_1_16: { 
    width: 60, height: 400, inputs: 5, outputs: 16, 
    inputOffsets: [
        { x: 0, y: 200, label: 'D' },
        { x: 5, y: 400, label: 'S0' }, { x: 20, y: 400, label: 'S1' }, { x: 40, y: 400, label: 'S2' }, { x: 55, y: 400, label: 'S3' }
    ], 
    outputOffsets: Array.from({length: 16}, (_, i) => ({ x: 60, y: 20 + i * 22, label: `${i}` })), 
    name: 'Demux 1:16' 
  },
  DECODER_2_4: { width: 60, height: 100, inputs: 2, outputs: 4, inputOffsets: [{ x: 0, y: 80, label: 'S0' }, { x: 0, y: 100, label: 'S1' }], outputOffsets: [{ x: 60, y: 20, label: '0' }, { x: 60, y: 40, label: '1' }, { x: 60, y: 60, label: '2' }, { x: 60, y: 80, label: '3' }], name: 'Decoder 2:4' },
  DECODER_3_8: { 
    width: 60, height: 200, inputs: 3, outputs: 8,
    inputOffsets: [{ x: 0, y: 140, label: 'S0' }, { x: 0, y: 160, label: 'S1' }, { x: 0, y: 180, label: 'S2' }],
    outputOffsets: Array.from({length: 8}, (_, i) => ({ x: 60, y: 20 + i * 20, label: `${i}` })),
    name: 'Decoder 3:8'
  },
  PRIORITY_ENCODER_4_2: { width: 70, height: 100, inputs: 4, outputs: 3, inputOffsets: [{ x: 0, y: 20, label: '0' }, { x: 0, y: 40, label: '1' }, { x: 0, y: 60, label: '2' }, { x: 0, y: 80, label: '3' }], outputOffsets: [{ x: 70, y: 30, label: 'A0' }, { x: 70, y: 50, label: 'A1' }, { x: 70, y: 80, label: 'V' }], name: 'Prio Encoder' },
  LOGIC_PROBE: { 
      width: 40, height: 40, inputs: 1, outputs: 0, 
      inputOffsets: [{ x: 0, y: 20 }], outputOffsets: [], 
      name: 'Logic Probe' 
  },
  BINARY_MONITOR_4BIT: { 
      width: 100, height: 40, inputs: 4, outputs: 0, 
      inputOffsets: Array.from({length: 4}, (_, i) => ({ x: 15 + i * 23.3, y: 20, label: `${i}` })), 
      outputOffsets: [], 
      name: 'Bin Monitor 4b' 
  },
  BINARY_MONITOR_8BIT: { 
      width: 180, height: 40, inputs: 8, outputs: 0, 
      inputOffsets: Array.from({length: 8}, (_, i) => ({ x: 15 + i * 21.4, y: 20, label: `${i}` })), 
      outputOffsets: [], 
      name: 'Bin Monitor 8b' 
  }
};
