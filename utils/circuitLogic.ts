
import { NodeData, Wire, NodeType } from '../types';

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
        case 'MUX_2_1': newOutputs = [node.inputs[2] ? node.inputs[1] : node.inputs[0]]; break;
        case 'MUX_4_1': {
            const s0 = node.inputs[4]; const s1 = node.inputs[5];
            const idx = (s0?1:0) + (s1?2:0);
            newOutputs = [node.inputs[idx]];
            break;
        }
        case 'MUX_8_1': {
            const s0 = node.inputs[8]; const s1 = node.inputs[9]; const s2 = node.inputs[10];
            const idx = (s0?1:0) + (s1?2:0) + (s2?4:0);
            newOutputs = [node.inputs[idx]];
            break;
        }
        case 'DEMUX_1_2': {
            const d = node.inputs[0]; const s = node.inputs[1];
            newOutputs = [!s ? d : false, s ? d : false];
            break;
        }
        case 'DEMUX_1_4': {
            const d = node.inputs[0]; const s0 = node.inputs[1]; const s1 = node.inputs[2];
            const idx = (s0?1:0) + (s1?2:0);
            newOutputs = [false, false, false, false];
            newOutputs[idx] = d;
            break;
        }
        case 'DEMUX_1_8': {
            const d = node.inputs[0]; const s0 = node.inputs[1]; const s1 = node.inputs[2]; const s2 = node.inputs[3];
            const idx = (s0?1:0) + (s1?2:0) + (s2?4:0);
            newOutputs = new Array(8).fill(false);
            newOutputs[idx] = d;
            break;
        }
        case 'DEMUX_1_16': {
            const d = node.inputs[0]; 
            const s0 = node.inputs[1]; const s1 = node.inputs[2]; 
            const s2 = node.inputs[3]; const s3 = node.inputs[4];
            const idx = (s0?1:0) + (s1?2:0) + (s2?4:0) + (s3?8:0);
            newOutputs = new Array(16).fill(false);
            newOutputs[idx] = d;
            break;
        }
        case 'DECODER_2_4': {
            const s0 = node.inputs[0]; const s1 = node.inputs[1];
            const idx = (s0?1:0) + (s1?2:0);
            newOutputs = [false, false, false, false];
            newOutputs[idx] = true;
            break;
        }
        case 'DECODER_3_8': {
            const s0 = node.inputs[0]; const s1 = node.inputs[1]; const s2 = node.inputs[2];
            const idx = (s0?1:0) + (s1?2:0) + (s2?4:0);
            newOutputs = new Array(8).fill(false);
            newOutputs[idx] = true;
            break;
        }
        case 'PRIORITY_ENCODER_4_2': {
            const i0 = node.inputs[0]; const i1 = node.inputs[1];
            const i2 = node.inputs[2]; const i3 = node.inputs[3];
            let a0 = false, a1 = false, v = false;
            if (i3) { a1=true; a0=true; v=true; }
            else if (i2) { a1=true; a0=false; v=true; }
            else if (i1) { a1=false; a0=true; v=true; }
            else if (i0) { a1=false; a0=false; v=true; }
            newOutputs = [a0, a1, v];
            break;
        }
        case 'D_LATCH': {
           const D = node.inputs[0]; const E = node.inputs[1];
           const Q = E ? D : oldOutputs[0];
           newOutputs = [Q, !Q];
           break;
        }
        case 'D_FF': {
           const D = node.inputs[0]; const Clk = node.inputs[1];
           const lastClk = node.internalState?.lastClock || false;
           let Q = oldOutputs[0];
           if (!lastClk && Clk) { Q = D; }
           newOutputs = [Q, !Q];
           node.internalState = { ...node.internalState, lastClock: Clk };
           break;
        }
        case 'T_FF': {
           const T = node.inputs[0]; const Clk = node.inputs[1];
           const lastClk = node.internalState?.lastClock || false;
           let Q = oldOutputs[0];
           if (!lastClk && Clk) { if (T) Q = !Q; }
           newOutputs = [Q, !Q];
           node.internalState = { ...node.internalState, lastClock: Clk };
           break;
        }
        case 'JK_FF': {
           const J = node.inputs[0]; const Clk = node.inputs[1]; const K = node.inputs[2];
           const lastClk = node.internalState?.lastClock || false;
           let Q = oldOutputs[0];
           if (!lastClk && Clk) {
               if (J && !K) Q = true;
               else if (!J && K) Q = false;
               else if (J && K) Q = !Q;
           }
           newOutputs = [Q, !Q];
           node.internalState = { ...node.internalState, lastClock: Clk };
           break;
        }
        case 'SR_FF': {
            const S = node.inputs[0]; const Clk = node.inputs[1]; const R = node.inputs[2];
            const lastClk = node.internalState?.lastClock || false;
            let Q = oldOutputs[0];
            if (!lastClk && Clk) { if (S && !R) Q = true; else if (!S && R) Q = false; }
            newOutputs = [Q, !Q];
            node.internalState = { ...node.internalState, lastClock: Clk };
            break;
        }
        case 'GATED_SR_LATCH': {
            const S = node.inputs[0]; const En = node.inputs[1]; const R = node.inputs[2];
            let Q = oldOutputs[0];
            if (En) { if (S && !R) Q = true; else if (!S && R) Q = false; }
            newOutputs = [Q, !Q];
            break;
        }
        case 'JK_MASTER_SLAVE': {
            const J = node.inputs[0]; const Clk = node.inputs[1]; const K = node.inputs[2];
            const lastClk = node.internalState?.lastClock || false;
            let Q = oldOutputs[0];
            if (lastClk && !Clk) { if (J && !K) Q = true; else if (!J && K) Q = false; else if (J && K) Q = !Q; }
            newOutputs = [Q, !Q];
            node.internalState = { ...node.internalState, lastClock: Clk };
            break;
        }
        case 'MEMORY_CELL': {
            const Data = node.inputs[0]; const Write = node.inputs[1]; const Sel = node.inputs[2];
            let stored = node.internalState?.storedValue || false;
            if (Sel && Write) { stored = Data; }
            newOutputs = [Sel ? stored : false];
            node.internalState = { ...node.internalState, storedValue: stored };
            break;
        }
        case 'ROM_1BIT': {
             const Sel = node.inputs[0];
             const val = node.properties?.romValue || false;
             newOutputs = [Sel ? val : false];
             break;
        }
        case 'SHIFT_REGISTER_4BIT': {
             const Data = node.inputs[0]; const Clk = node.inputs[1];
             const lastClk = node.internalState?.lastClock || false;
             let reg = node.internalState?.register || [false, false, false, false];
             if (!lastClk && Clk) { reg = [Data, reg[0], reg[1], reg[2]]; }
             newOutputs = [...reg];
             node.internalState = { ...node.internalState, lastClock: Clk, register: reg };
             break;
        }
        case 'ALU_4BIT': {
            let a = 0; for(let i=0; i<4; i++) { if(node.inputs[i]) a += Math.pow(2, i); }
            let b = 0; for(let i=4; i<8; i++) { if(node.inputs[i]) b += Math.pow(2, i-4); }
            const op = (node.inputs[8]?1:0) + (node.inputs[9]?2:0);
            let result = 0; let carry = false;
            switch(op) {
              case 0: result = a + b; carry = result > 15; break;
              case 1: result = a - b; carry = a < b; if(result < 0) result += 16; break;
              case 2: result = a & b; break;
              case 3: result = a | b; break;
            }
            newOutputs = [];
            for(let i=0; i<4; i++) { newOutputs.push(!!((result >> i) & 1)); }
            newOutputs.push(carry);
            newOutputs.push((result % 16) === 0);
            break;
        }
        case 'COUNTER_4BIT': {
          const clk = node.inputs[0]; const rst = node.inputs[1];
          const lastClk = node.internalState?.lastClock || false;
          let val = node.internalState?.counterValue || 0;
          if (rst) { val = 0; }
          else if (!lastClk && clk) { val = (val + 1) % 16; }
          newOutputs = [];
          for(let i=0; i<4; i++) { newOutputs.push(!!((val >> i) & 1)); }
          node.internalState = { ...node.internalState, lastClock: clk, counterValue: val };
          break;
        }
        case 'REG_4BIT': {
          const clk = node.inputs[4];
          const lastClk = node.internalState?.lastClock || false;
          let reg = node.internalState?.register || [false, false, false, false];
          if (!lastClk && clk) { reg = [node.inputs[0], node.inputs[1], node.inputs[2], node.inputs[3]]; }
          newOutputs = [...reg];
          node.internalState = { ...node.internalState, lastClock: clk, register: reg };
          break;
        }
        case 'RAM_4BIT':
        case 'RAM_8BIT':
        case 'RAM_16BIT':
        case 'RAM_64_8':
        case 'RAM_256_8':
        case 'RAM_64BIT':
        case 'RAM_128BIT':
        case 'RAM_256BIT': {
            let addrWidth = 4;
            let dataWidth = 4;
            
            if (node.type === 'RAM_4BIT') { addrWidth = 4; dataWidth = 4; }
            else if (node.type === 'RAM_8BIT') { addrWidth = 4; dataWidth = 8; }
            else if (node.type === 'RAM_16BIT') { addrWidth = 4; dataWidth = 16; }
            else if (node.type === 'RAM_64_8') { addrWidth = 6; dataWidth = 8; }
            else if (node.type === 'RAM_256_8') { addrWidth = 8; dataWidth = 8; }
            else if (node.type === 'RAM_64BIT') { addrWidth = 3; dataWidth = 8; }
            else if (node.type === 'RAM_128BIT') { addrWidth = 4; dataWidth = 8; }
            else if (node.type === 'RAM_256BIT') { addrWidth = 5; dataWidth = 8; }

            const totalWords = Math.pow(2, addrWidth);
            let address = 0;
            for(let i=0; i<addrWidth; i++) { if(node.inputs[i]) address += Math.pow(2, i); }
            
            let dataIn = 0;
            for(let i=0; i<dataWidth; i++) { if(node.inputs[addrWidth + i]) dataIn += Math.pow(2, i); }
            
            const WE = node.inputs[addrWidth + dataWidth];
            const CS = node.inputs[addrWidth + dataWidth + 1];
            
            let memory = node.internalState?.memory;
            if (!memory || !Array.isArray(memory)) { memory = new Array(totalWords).fill(0); }
            
            let val = 0;
            const nextMemory = [...memory];
            if (CS) { 
                if (WE) { nextMemory[address] = dataIn; } 
                val = nextMemory[address]; 
            }
            
            newOutputs = [];
            for(let i=0; i<dataWidth; i++) { newOutputs.push(CS ? !!((val >> i) & 1) : false); }
            node.internalState = { ...node.internalState, memory: nextMemory };
            break;
        }
        case 'ROM_4BIT':
        case 'ROM_8BIT': {
            const addrWidth = 4;
            const dataWidth = node.type === 'ROM_4BIT' ? 4 : 8;
            const totalWords = Math.pow(2, addrWidth);
            let address = 0;
            for(let i=0; i<addrWidth; i++) { if(node.inputs[i]) address += Math.pow(2, i); }
            const CS = node.inputs[addrWidth];
            let romData = node.properties?.romData;
            if (!romData || !Array.isArray(romData)) { romData = new Array(totalWords).fill(0); }
            const val = CS ? romData[address] : 0;
            newOutputs = [];
            for(let i=0; i<dataWidth; i++) { newOutputs.push(!!((val >> i) & 1)); }
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
