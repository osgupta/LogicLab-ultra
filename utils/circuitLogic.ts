import { NodeData, Wire, NodeType } from '../types';

export const evaluateCircuit = (nodes: NodeData[], wires: Wire[]): { nodes: NodeData[], wires: Wire[] } => {
  // 1. Snapshot previous state (inputs/outputs) to detect edges or retain memory
  // We don't deep copy internalState here because we want to update it
  let nextNodes = nodes.map(n => ({ 
    ...n, 
    inputs: [...n.inputs], 
    outputs: [...n.outputs],
    internalState: { ...n.internalState },
    properties: { ...n.properties }
  }));
  let nextWires = wires.map(w => ({ ...w }));

  // Preserve the *initial* inputs of this frame for edge detection
  // This allows us to compare "What was the clock before this eval cycle?" vs "What is it now?"
  const initialNodesState = new Map(nodes.map(n => [n.id, n]));

  let stable = false;
  let iterations = 0;
  const MAX_ITERATIONS = 50; 

  while (!stable && iterations < MAX_ITERATIONS) {
    stable = true;
    iterations++;

    // --- Wire Propagation ---
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

    // --- Node Evaluation ---
    nextNodes.forEach(node => {
      // Skip input-only nodes (sources) but process CONSTANTs
      if (['SWITCH', 'CLOCK', 'BUTTON', 'INPUT_2BIT', 'INPUT_4BIT', 'INPUT_8BIT', 'INPUT_16BIT'].includes(node.type)) return;

      const oldOutputs = [...node.outputs];
      let newOutputs = [...oldOutputs];

      const prevNodeState = initialNodesState.get(node.id);
      
      switch (node.type) {
        // Gates (Dynamic Input Support)
        case 'AND': 
          newOutputs = [node.inputs.every(v => v === true)]; 
          break;
        case 'OR': 
          newOutputs = [node.inputs.some(v => v === true)]; 
          break;
        case 'NOT': 
          newOutputs = [!node.inputs[0]]; 
          break;
        case 'NAND': 
          newOutputs = [!node.inputs.every(v => v === true)]; 
          break;
        case 'NOR': 
          newOutputs = [!node.inputs.some(v => v === true)]; 
          break;
        case 'XOR': 
          // Odd number of 1s
          newOutputs = [node.inputs.filter(v => v).length % 2 === 1]; 
          break;
        case 'XNOR': 
           // Even number of 1s (for >2 inputs this is the definition usually used in parity)
           // For 2 inputs: !(A^B). For N inputs: !(OddParity).
          newOutputs = [node.inputs.filter(v => v).length % 2 === 0]; 
          break;
        case 'BUFFER': newOutputs = [node.inputs[0]]; break;
        case 'CONSTANT_1': newOutputs = [true]; break;
        case 'CONSTANT_0': newOutputs = [false]; break;
        
        // Junction acts as a pass-through buffer
        case 'JUNCTION':
            newOutputs = [node.inputs[0]];
            break;

        // Output Objects
        case 'BULB': case 'HEX_DISPLAY': case 'SEVEN_SEGMENT': 
        case 'OUTPUT_2BIT': case 'OUTPUT_4BIT': case 'OUTPUT_8BIT': case 'OUTPUT_16BIT':
            break; // No outputs

        // Arithmetic
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
            newOutputs = [a !== b, (!a && b)]; // Diff, Borrow
            break;
        }
        case 'COMPARATOR_1BIT': {
            const a = node.inputs[0]; const b = node.inputs[1];
            newOutputs = [
                a && !b, // >
                a === b, // =
                !a && b  // <
            ];
            break;
        }

        // Plexers
        case 'MUX_2_1':
           newOutputs = [node.inputs[2] ? node.inputs[1] : node.inputs[0]];
           break;
        case 'MUX_4_1': {
            const s0 = node.inputs[4]; const s1 = node.inputs[5];
            const idx = (s0?1:0) + (s1?2:0);
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
        case 'DECODER_2_4': {
            const s0 = node.inputs[0]; const s1 = node.inputs[1];
            const idx = (s0?1:0) + (s1?2:0);
            newOutputs = [false, false, false, false];
            newOutputs[idx] = true;
            break;
        }
        case 'PRIORITY_ENCODER_4_2': {
            // Priority 3 > 2 > 1 > 0
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

        // State / Memory
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
           
           if (!lastClk && Clk) { // Rising Edge
               Q = D;
           }
           newOutputs = [Q, !Q];
           node.internalState = { ...node.internalState, lastClock: Clk };
           break;
        }
        case 'T_FF': {
           const T = node.inputs[0]; const Clk = node.inputs[1];
           const lastClk = node.internalState?.lastClock || false;
           let Q = oldOutputs[0];

           if (!lastClk && Clk) { // Rising Edge
               if (T) Q = !Q;
           }
           newOutputs = [Q, !Q];
           node.internalState = { ...node.internalState, lastClock: Clk };
           break;
        }
        case 'JK_FF': {
           const J = node.inputs[0]; const Clk = node.inputs[1]; const K = node.inputs[2];
           const lastClk = node.internalState?.lastClock || false;
           let Q = oldOutputs[0];

           if (!lastClk && Clk) { // Rising Edge
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
 
            if (!lastClk && Clk) { // Rising Edge
                if (S && !R) Q = true;
                else if (!S && R) Q = false;
            }
            newOutputs = [Q, !Q];
            node.internalState = { ...node.internalState, lastClock: Clk };
            break;
        }
        case 'GATED_SR_LATCH': {
            const S = node.inputs[0]; const En = node.inputs[1]; const R = node.inputs[2];
            let Q = oldOutputs[0];
            if (En) {
                if (S && !R) Q = true;
                else if (!S && R) Q = false;
            }
            newOutputs = [Q, !Q];
            break;
        }
        case 'JK_MASTER_SLAVE': {
            // Functionally models a falling-edge triggered JK Flip-Flop
            const J = node.inputs[0]; const Clk = node.inputs[1]; const K = node.inputs[2];
            const lastClk = node.internalState?.lastClock || false;
            let Q = oldOutputs[0];

            if (lastClk && !Clk) { // Falling Edge
                if (J && !K) Q = true;
                else if (!J && K) Q = false;
                else if (J && K) Q = !Q;
            }
            newOutputs = [Q, !Q];
            node.internalState = { ...node.internalState, lastClock: Clk };
            break;
        }
        case 'RAM_1BIT': {
            const Data = node.inputs[0]; const Write = node.inputs[1]; const Sel = node.inputs[2];
            let stored = node.internalState?.storedValue || false;
            
            if (Sel && Write) {
                stored = Data;
            }
            
            newOutputs = [Sel ? stored : false];
            node.internalState = { ...node.internalState, storedValue: stored };
            break;
        }
        case 'ROM_1BIT': {
             const Sel = node.inputs[0];
             // Value is static property
             const val = node.properties?.romValue || false;
             newOutputs = [Sel ? val : false];
             break;
        }
        case 'SHIFT_REGISTER_4BIT': {
             const Data = node.inputs[0]; const Clk = node.inputs[1];
             const lastClk = node.internalState?.lastClock || false;
             let reg = node.internalState?.register || [false, false, false, false];

             if (!lastClk && Clk) { // Rising Edge
                 // Shift right: Q0 gets Data, Q1 gets Q0...
                 reg = [Data, reg[0], reg[1], reg[2]];
             }
             
             newOutputs = [...reg];
             node.internalState = { ...node.internalState, lastClock: Clk, register: reg };
             break;
        }
        case 'RAM_4BIT':
        case 'RAM_8BIT':
        case 'RAM_16BIT': {
            const dataWidth = node.type === 'RAM_4BIT' ? 4 : (node.type === 'RAM_8BIT' ? 8 : 16);
            const addrWidth = 4; // hardcoded for 16 words
            
            // Reconstruct Address
            let address = 0;
            for(let i=0; i<addrWidth; i++) {
                if(node.inputs[i]) address += Math.pow(2, i);
            }
            
            // Reconstruct Data In
            let dataIn = 0;
            for(let i=0; i<dataWidth; i++) {
                if(node.inputs[addrWidth + i]) dataIn += Math.pow(2, i);
            }

            const WE = node.inputs[addrWidth + dataWidth];
            const CS = node.inputs[addrWidth + dataWidth + 1];

            // Initialize memory if empty. 2^4 = 16 words.
            let memory = node.internalState?.memory;
            if (!memory || !Array.isArray(memory)) {
                memory = new Array(16).fill(0);
            }

            let val = 0;
            if (CS) {
                if (WE) {
                    // Write
                    memory[address] = dataIn;
                }
                // Read (always read current address if CS enabled, effectively)
                val = memory[address];
            }
            
            // Deconstruct output bits from val
            newOutputs = [];
            for(let i=0; i<dataWidth; i++) {
                newOutputs.push(!!((val >> i) & 1));
            }
            
            // Update state
            // Copy array to avoid direct mutation issues
            const nextMemory = [...memory];
            if (CS && WE) {
                nextMemory[address] = dataIn;
            }
            
            node.internalState = { ...node.internalState, memory: nextMemory };
            break;
        }
      }

      // Diff check
      let changed = false;
      if (newOutputs.length !== node.outputs.length) changed = true;
      else {
          for(let i=0; i<newOutputs.length; i++) {
              if (node.outputs[i] !== newOutputs[i]) {
                  changed = true;
                  break;
              }
          }
      }

      if (changed) {
          node.outputs = newOutputs;
          stable = false;
      }
    });
  }

  return { nodes: nextNodes, wires: nextWires };
};
