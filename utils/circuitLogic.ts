
import { NodeData, Wire, NodeType } from '../types';

const bitsToInt = (bits: boolean[]) => bits.reduce((acc, b, i) => acc + (b ? Math.pow(2, i) : 0), 0);
const intToBits = (val: number, length: number) => Array.from({ length }, (_, i) => !!((val >> i) & 1));

export const evaluateCircuit = (nodes: NodeData[], wires: Wire[]): { nodes: NodeData[], wires: Wire[] } => {
  let nextNodes = nodes.map(n => ({ 
    ...n, 
    inputs: [...n.inputs], 
    outputs: [...n.outputs],
    internalState: { ...n.internalState },
    properties: { ...n.properties }
  }));
  let nextWires = wires.map(w => ({ ...w }));

  let stable = false;
  let iterations = 0;
  const MAX_ITERATIONS = 50; 

  while (!stable && iterations < MAX_ITERATIONS) {
    stable = true;
    iterations++;

    nextWires.forEach(wire => {
      const sourceNode = nextNodes.find(n => n.id === wire.sourceNodeId);
      if (sourceNode) {
        const val = sourceNode.outputs[wire.sourceOutputIndex] || false;
        if (wire.state !== val) {
          wire.state = val;
          stable = false;
        }
      }
    });

    nextWires.forEach(wire => {
      const targetNode = nextNodes.find(n => n.id === wire.targetNodeId);
      if (targetNode) {
        if (targetNode.inputs[wire.targetInputIndex] !== wire.state) {
          targetNode.inputs[wire.targetInputIndex] = wire.state;
          stable = false;
        }
      }
    });

    nextNodes.forEach(node => {
      if (['TOGGLE_SWITCH', 'CLOCK', 'PUSH_BUTTON', 'INPUT_2BIT', 'INPUT_4BIT', 'INPUT_8BIT', 'INPUT_16BIT', 'VCC', 'GND'].includes(node.type)) return;

      const oldOutputs = [...node.outputs];
      let newOutputs = [...oldOutputs];
      
      switch (node.type) {
        case 'AND': newOutputs = [node.inputs.every(v => v === true)]; break;
        case 'OR': newOutputs = [node.inputs.some(v => v === true)]; break;
        case 'NOT': newOutputs = [!node.inputs[0]]; break;
        case 'NAND': newOutputs = [!node.inputs.every(v => v === true)]; break;
        case 'NOR': newOutputs = [!node.inputs.some(v => v === true)]; break;
        case 'XOR': newOutputs = [node.inputs.filter(v => v).length % 2 === 1]; break;
        case 'XNOR': newOutputs = [node.inputs.filter(v => v).length % 2 === 0]; break;
        case 'BUFFER': newOutputs = [node.inputs[0]]; break;
        case 'TRI_STATE_BUFFER': newOutputs = [node.inputs[1] ? node.inputs[0] : false]; break;
        case 'ODD_PARITY': newOutputs = [node.inputs.filter(v => v).length % 2 === 1]; break;
        case 'EVEN_PARITY': newOutputs = [node.inputs.filter(v => v).length % 2 === 0]; break;
        case 'JUNCTION': newOutputs = [node.inputs[0]]; break;
        case 'HALF_ADDER': {
           const a = node.inputs[0]; const b = node.inputs[1];
           newOutputs = [a !== b, a && b]; 
           break;
        }
        case 'FULL_ADDER': {
            const a = node.inputs[0]; const b = node.inputs[1]; const cin = node.inputs[2];
            const sum = (a ? 1:0) + (b ? 1:0) + (cin ? 1:0);
            newOutputs = [sum % 2 === 1, sum >= 2];
            break;
        }
        case 'SUBTRACTOR': {
            const a = node.inputs[0]; const b = node.inputs[1];
            newOutputs = [a !== b, (!a && b)];
            break;
        }
        case 'COMPARATOR_1BIT': {
            const a = node.inputs[0]; const b = node.inputs[1];
            newOutputs = [a && !b, a === b, !a && b];
            break;
        }
        case 'COMPARATOR_8BIT': {
            const a = bitsToInt(node.inputs.slice(0, 8));
            const b = bitsToInt(node.inputs.slice(8, 16));
            newOutputs = [a > b, a === b, a < b];
            break;
        }
        case 'MULTIPLIER_4BIT': {
            const a = bitsToInt(node.inputs.slice(0, 4));
            const b = bitsToInt(node.inputs.slice(4, 8));
            newOutputs = intToBits(a * b, 4);
            break;
        }
        case 'MULTIPLIER_8BIT': {
            const a = bitsToInt(node.inputs.slice(0, 8));
            const b = bitsToInt(node.inputs.slice(8, 16));
            newOutputs = intToBits(a * b, 8);
            break;
        }
        case 'DIVIDER_4BIT': {
            const a = bitsToInt(node.inputs.slice(0, 4));
            const b = bitsToInt(node.inputs.slice(4, 8));
            if (b === 0) { newOutputs = new Array(8).fill(false); }
            else { newOutputs = [...intToBits(Math.floor(a / b), 4), ...intToBits(a % b, 4)]; }
            break;
        }
        case 'DIVIDER_8BIT': {
            const a = bitsToInt(node.inputs.slice(0, 8));
            const b = bitsToInt(node.inputs.slice(8, 16));
            if (b === 0) { newOutputs = new Array(16).fill(false); }
            else { newOutputs = [...intToBits(Math.floor(a / b), 8), ...intToBits(a % b, 8)]; }
            break;
        }
        case 'SHIFTER_8BIT': {
            const data = bitsToInt(node.inputs.slice(0, 8));
            const shift = bitsToInt(node.inputs.slice(8, 11));
            // Standard left shift for now
            newOutputs = intToBits(data << shift, 8);
            break;
        }
        case 'BIT_EXTENDER': {
            // Extends 4 bits to 8 (Zero extension)
            newOutputs = [...node.inputs.slice(0, 4), false, false, false, false];
            break;
        }
        case 'MUX_2_1': newOutputs = [node.inputs[2] ? node.inputs[1] : node.inputs[0]]; break;
        case 'MUX_4_1': {
            const s0 = node.inputs[4]; const s1 = node.inputs[5];
            newOutputs = [node.inputs[(s0?1:0) + (s1?2:0)]];
            break;
        }
        case 'MUX_8_1': {
            const idx = bitsToInt(node.inputs.slice(8, 11));
            newOutputs = [node.inputs[idx]];
            break;
        }
        case 'MUX_16_1': {
            const idx = bitsToInt(node.inputs.slice(16, 20));
            newOutputs = [node.inputs[idx]];
            break;
        }
        case 'DEMUX_1_2': {
            const d = node.inputs[0]; const s = node.inputs[1];
            newOutputs = [!s ? d : false, s ? d : false];
            break;
        }
        case 'DEMUX_1_4': {
            const idx = bitsToInt(node.inputs.slice(1, 3));
            newOutputs = new Array(4).fill(false);
            newOutputs[idx] = node.inputs[0];
            break;
        }
        case 'DEMUX_1_8': {
            const idx = bitsToInt(node.inputs.slice(1, 4));
            newOutputs = new Array(8).fill(false);
            newOutputs[idx] = node.inputs[0];
            break;
        }
        case 'DEMUX_1_16': {
            const idx = bitsToInt(node.inputs.slice(1, 5));
            newOutputs = new Array(16).fill(false);
            newOutputs[idx] = node.inputs[0];
            break;
        }
        case 'DECODER_2_4': {
            newOutputs = new Array(4).fill(false);
            newOutputs[bitsToInt(node.inputs)] = true;
            break;
        }
        case 'DECODER_3_8': {
            newOutputs = new Array(8).fill(false);
            newOutputs[bitsToInt(node.inputs)] = true;
            break;
        }
        case 'DECODER_4_16': {
            newOutputs = new Array(16).fill(false);
            newOutputs[bitsToInt(node.inputs)] = true;
            break;
        }
        case 'PRIORITY_ENCODER_4_2': {
            let a0=false, a1=false, v=false;
            if(node.inputs[3]){a1=true; a0=true; v=true;}
            else if(node.inputs[2]){a1=true; a0=false; v=true;}
            else if(node.inputs[1]){a1=false; a0=true; v=true;}
            else if(node.inputs[0]){a1=false; a0=false; v=true;}
            newOutputs = [a0, a1, v];
            break;
        }
        case 'ENCODER_8_3': {
            let v = false, res = 0;
            for(let i=7; i>=0; i--) { if(node.inputs[i]) { res = i; v = true; break; } }
            newOutputs = [...intToBits(res, 3), v];
            break;
        }
        case 'D_LATCH': {
           const Q = node.inputs[1] ? node.inputs[0] : oldOutputs[0];
           newOutputs = [Q, !Q];
           break;
        }
        case 'D_FF': {
           const lastClk = node.internalState?.lastClock || false;
           let Q = oldOutputs[0];
           if (!lastClk && node.inputs[1]) { Q = node.inputs[0]; }
           newOutputs = [Q, !Q];
           node.internalState = { ...node.internalState, lastClock: node.inputs[1] };
           break;
        }
        case 'JK_FF': {
           const lastClk = node.internalState?.lastClock || false;
           let Q = oldOutputs[0];
           if (!lastClk && node.inputs[1]) {
               const J=node.inputs[0], K=node.inputs[2];
               if(J && !K) Q=true; else if(!J && K) Q=false; else if(J && K) Q=!Q;
           }
           newOutputs = [Q, !Q];
           node.internalState = { ...node.internalState, lastClock: node.inputs[1] };
           break;
        }
        case 'REG_4BIT': {
           const lastClk = node.internalState?.lastClock || false;
           if (!lastClk && node.inputs[4]) { newOutputs = node.inputs.slice(0, 4); }
           node.internalState = { ...node.internalState, lastClock: node.inputs[4] };
           break;
        }
        case 'REG_8BIT': {
           const lastClk = node.internalState?.lastClock || false;
           if (!lastClk && node.inputs[8]) { newOutputs = node.inputs.slice(0, 8); }
           node.internalState = { ...node.internalState, lastClock: node.inputs[8] };
           break;
        }
        case 'COUNTER_4BIT': {
          const lastClk = node.internalState?.lastClock || false;
          let val = node.internalState?.counterValue || 0;
          if (node.inputs[1]) val = 0;
          else if (!lastClk && node.inputs[0]) val = (val + 1) % 16;
          newOutputs = intToBits(val, 4);
          node.internalState = { ...node.internalState, lastClock: node.inputs[0], counterValue: val };
          break;
        }
        case 'COUNTER_8BIT': {
          const lastClk = node.internalState?.lastClock || false;
          let val = node.internalState?.counterValue || 0;
          if (node.inputs[1]) val = 0;
          else if (!lastClk && node.inputs[0]) val = (val + 1) % 256;
          newOutputs = intToBits(val, 8);
          node.internalState = { ...node.internalState, lastClock: node.inputs[0], counterValue: val };
          break;
        }
        case 'RAM_4BIT': case 'RAM_8BIT': case 'RAM_16BIT': case 'RAM_64_8': case 'RAM_256_8':
        case 'RAM_64BIT': case 'RAM_128BIT': case 'RAM_256BIT': {
            let aW=4, dW=4;
            if(node.type==='RAM_8BIT')dW=8; else if(node.type==='RAM_16BIT')dW=16; 
            else if(node.type==='RAM_64_8'){aW=6;dW=8;} else if(node.type==='RAM_256_8'){aW=8;dW=8;}
            else if(node.type==='RAM_64BIT'){aW=3;dW=8;} else if(node.type==='RAM_128BIT'){aW=4;dW=8;}
            else if(node.type==='RAM_256BIT'){aW=5;dW=8;}
            const addr = bitsToInt(node.inputs.slice(0, aW));
            const dataIn = bitsToInt(node.inputs.slice(aW, aW + dW));
            const we = node.inputs[aW + dW], cs = node.inputs[aW + dW + 1];
            let mem = node.internalState?.memory || new Array(Math.pow(2, aW)).fill(0);
            let val = 0;
            if (cs) { if(we){ mem[addr] = dataIn; } val = mem[addr]; }
            newOutputs = intToBits(cs ? val : 0, dW);
            node.internalState = { ...node.internalState, memory: [...mem] };
            break;
        }
        case 'ROM_4BIT': case 'ROM_8BIT': {
            const aW=4, dW = node.type==='ROM_4BIT'?4:8;
            const addr = bitsToInt(node.inputs.slice(0, aW)), cs = node.inputs[aW];
            const data = node.properties?.romData || new Array(16).fill(0);
            newOutputs = intToBits(cs ? data[addr] : 0, dW);
            break;
        }
      }

      if (JSON.stringify(newOutputs) !== JSON.stringify(oldOutputs)) {
          node.outputs = newOutputs;
          stable = false;
      }
    });
  }

  return { nodes: nextNodes, wires: nextWires };
};
