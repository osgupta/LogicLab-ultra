import React from 'react';
import { NodeData } from '../types';
import { getNodeDimensions } from '../utils/componentUtils';

interface GateShapeProps {
  node: NodeData;
}

export const GateShape: React.FC<GateShapeProps> = ({ node }) => {
  const type = node.type;
  // Usually output[0] is the primary active state for coloring, but for complex nodes we stick to neutral unless specified.
  const active = node.outputs[0]; 
  const strokeColor = active ? "#22d3ee" : "#71717a"; 
  const fillColor = "#18181b"; 
  const activeFill = active ? "#0ea5e9" : "#18181b"; 
  const { width, height } = getNodeDimensions(node);

  const Text = ({ x, y, children, fill="#71717a", fontSize="10" }: { x: number, y: number, children: string, fill?: string, fontSize?: string }) => (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill={fill} fontSize={fontSize} fontWeight="bold" className="pointer-events-none select-none">
      {children}
    </text>
  );

  // Dynamic path generation for variable inputs
  const getGatePath = (gateType: 'AND' | 'OR' | 'NAND' | 'NOR' | 'XOR' | 'XNOR') => {
     // Control point offset for OR/XOR curves
     const curve = width * 0.6; 
     
     switch (gateType) {
         case 'AND': 
         case 'NAND':
             // Straight back, curved front
             return `M 0 0 L ${width/2} 0 A ${height/2} ${height/2} 0 0 1 ${width/2} ${height} L 0 ${height} Z`;
         
         case 'OR':
         case 'NOR':
             // Curved back, curved front (pointed)
             return `M 0 0 Q ${width*0.25} ${height/2} 0 ${height} Q ${width*0.8} ${height} ${width} ${height/2} Q ${width*0.8} 0 0 0 Z`;

         case 'XOR':
         case 'XNOR':
              // Similar to OR but with the extra back line (which we usually draw separately, but here we approximate the main body)
             return `M 10 0 Q ${width*0.35} ${height/2} 10 ${height} Q ${width*0.9} ${height} ${width} ${height/2} Q ${width*0.9} 0 10 0 Z`;
     }
  };

  switch (type) {
    // --- Dynamic Gates ---
    case 'AND':
      return <path d={getGatePath('AND')} fill={fillColor} stroke={strokeColor} strokeWidth="2" />;
    case 'NAND':
      return (
        <g>
          <path d={getGatePath('NAND')} fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <circle cx={width} cy={height/2} r="5" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
        </g>
      );
    case 'OR':
      return <path d={getGatePath('OR')} fill={fillColor} stroke={strokeColor} strokeWidth="2" />
    case 'NOR':
      return (
        <g>
          <path d={getGatePath('OR')} fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <circle cx={width} cy={height/2} r="5" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
        </g>
      );
    case 'XOR':
      return (
        <g>
          <path d={getGatePath('XOR')} fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <path d={`M -5 0 Q ${width*0.20} ${height/2} -5 ${height}`} fill="none" stroke={strokeColor} strokeWidth="2" />
        </g>
      );
    case 'XNOR':
      return (
        <g>
          <path d={getGatePath('XOR')} fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <path d={`M -5 0 Q ${width*0.20} ${height/2} -5 ${height}`} fill="none" stroke={strokeColor} strokeWidth="2" />
          <circle cx={width} cy={height/2} r="5" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
        </g>
      );

    case 'NOT':
      return (
        <g>
          <path d="M 0 0 L 35 20 L 0 40 Z" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <circle cx="40" cy="20" r="5" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
        </g>
      );
    case 'BUFFER':
        return <path d="M 0 0 L 30 20 L 0 40 Z" fill={fillColor} stroke={strokeColor} strokeWidth="2" />;
    
    // --- Constants ---
    case 'CONSTANT_1':
        return (
            <g>
                <rect x="0" y="0" width="30" height="30" rx="2" fill={fillColor} stroke="#22d3ee" strokeWidth="2" />
                <text x="15" y="15" textAnchor="middle" dominantBaseline="middle" fill="#22d3ee" fontSize="14" fontWeight="bold">1</text>
            </g>
        );
    case 'CONSTANT_0':
        return (
            <g>
                <rect x="0" y="0" width="30" height="30" rx="2" fill={fillColor} stroke="#52525b" strokeWidth="2" />
                <text x="15" y="15" textAnchor="middle" dominantBaseline="middle" fill="#71717a" fontSize="14" fontWeight="bold">0</text>
            </g>
        );
        
    // --- Logic ---
    case 'JUNCTION':
        return <circle cx="5" cy="5" r="5" fill={active ? "#22d3ee" : "#71717a"} />;

    // --- IO ---
    case 'SWITCH':
      return (
        <g>
          <rect x="0" y="0" width="40" height="40" rx="4" fill={activeFill} stroke={strokeColor} strokeWidth="2" />
          <text x="20" y="25" textAnchor="middle" fill={active ? "#fff" : "#a1a1aa"} fontSize="12" fontWeight="bold">{active ? "1" : "0"}</text>
        </g>
      );
    case 'BUTTON':
        return (
          <g>
            <circle cx="20" cy="20" r="15" fill={active ? "#22c55e" : "#3f3f46"} stroke={strokeColor} strokeWidth="2" />
            <circle cx="20" cy="20" r="10" fill={active ? "#16a34a" : "#18181b"} />
          </g>
        );
    case 'CLOCK':
        return (
            <g>
                <rect x="0" y="0" width="40" height="40" rx="4" fill="#18181b" stroke={active ? "#22d3ee" : "#52525b"} strokeWidth="2" />
                <path d="M 10 20 L 15 20 L 15 10 L 25 10 L 25 30 L 35 30" fill="none" stroke={active ? "#22d3ee" : "#52525b"} strokeWidth="2" />
            </g>
        );
    case 'BULB':
      return (
        <g>
          <circle cx="20" cy="20" r="15" fill={node.inputs[0] ? "#fbbf24" : "#27272a"} stroke={node.inputs[0] ? "#f59e0b" : "#52525b"} strokeWidth="2" style={{ filter: node.inputs[0] ? 'drop-shadow(0 0 8px #fbbf24)' : 'none'}} />
        </g>
      );
    case 'HEX_DISPLAY':
        // Decode 4 inputs to Hex char
        const val = (node.inputs[0]?1:0) + (node.inputs[1]?2:0) + (node.inputs[2]?4:0) + (node.inputs[3]?8:0);
        const hexChar = val.toString(16).toUpperCase();
        return (
            <g>
                <rect x="0" y="0" width="60" height="80" fill="#000" stroke="#3f3f46" strokeWidth="4" />
                <text x="30" y="45" textAnchor="middle" dominantBaseline="middle" fill="#ef4444" fontSize="40" fontFamily="monospace" style={{ filter: 'drop-shadow(0 0 4px #ef4444)'}}>
                    {hexChar}
                </text>
            </g>
        );
    case 'SEVEN_SEGMENT':
        // a,b,c,d,e,f,g,dp
        const [a, b, c, d, e, f, g, dp] = node.inputs;
        const segOn = "#ef4444";
        const segOff = "#27272a";
        const segStyle = (on: boolean) => ({ fill: on ? segOn : segOff, filter: on ? 'drop-shadow(0 0 2px #ef4444)' : 'none' });

        return (
            <g>
                <rect x="0" y="0" width="70" height="100" fill="#000" stroke="#3f3f46" strokeWidth="4" />
                
                {/* A */}
                <path d="M 15 10 L 55 10 L 50 15 L 20 15 Z" {...segStyle(a)} />
                {/* B */}
                <path d="M 55 10 L 60 15 L 60 45 L 55 50 L 50 45 L 50 15 Z" {...segStyle(b)} />
                {/* C */}
                <path d="M 55 50 L 60 55 L 60 85 L 55 90 L 50 85 L 50 55 Z" {...segStyle(c)} />
                {/* D */}
                <path d="M 15 90 L 55 90 L 50 85 L 20 85 Z" {...segStyle(d)} />
                {/* E */}
                <path d="M 15 50 L 20 55 L 20 85 L 15 90 L 10 85 L 10 55 Z" {...segStyle(e)} />
                {/* F */}
                <path d="M 15 10 L 20 15 L 20 45 L 15 50 L 10 45 L 10 15 Z" {...segStyle(f)} />
                {/* G */}
                <path d="M 15 50 L 20 45 L 50 45 L 55 50 L 50 55 L 20 55 Z" {...segStyle(g)} />
                {/* DP */}
                <circle cx="60" cy="90" r="3" {...segStyle(dp)} />
            </g>
        );
    
    // --- Multi-bit IO ---
    case 'INPUT_2BIT':
    case 'INPUT_4BIT':
    case 'INPUT_8BIT':
    case 'INPUT_16BIT':
        const bitCount = node.outputs.length;
        // Calculate decimal value for display
        const inVal = node.outputs.reduce((acc, val, idx) => acc + (val ? Math.pow(2, idx) : 0), 0);
        return (
            <g>
                <rect x="0" y="0" width={width} height={height} rx="4" fill="#18181b" stroke="#52525b" strokeWidth="2" />
                <Text x={width/2} y={12}>{`IN ${bitCount}b`}</Text>
                
                {/* Switches */}
                {/* Header is 25px. Rows are 20px. Start Y = 25. Centered at 25 + 10 = 35. */}
                {/* i*20 offset */}
                {node.outputs.map((state, i) => (
                   <g key={i} transform={`translate(10, ${25 + (i * 20)})`}>
                       {/* Row visual container (for hit area visualization mostly) */}
                       <rect x="0" y="2" width={width - 20} height="16" rx="2" fill="#27272a" stroke="none" />
                       
                       {/* Switch toggle */}
                       <g transform="translate(5, 4)">
                           <rect x="0" y="0" width="20" height="12" rx="2" fill={state ? "#0ea5e9" : "#3f3f46"} stroke={state ? "#22d3ee" : "#52525b"} />
                           <circle cx={state ? 16 : 4} cy={6} r="3" fill="white" />
                       </g>
                       
                       <text x="35" y="10" dominantBaseline="middle" fill="#71717a" fontSize="10" fontFamily="monospace">{i.toString()}</text>
                   </g>
                ))}

                {/* Footer Value Box */}
                <g transform={`translate(5, ${height - 30})`}>
                    <rect x="0" y="0" width={width - 10} height="25" rx="4" fill="#000" stroke="#3f3f46" />
                    <text x={(width - 10) / 2} y="12.5" textAnchor="middle" dominantBaseline="middle" fill="#22d3ee" fontSize="11" fontFamily="monospace">
                        {bitCount <= 8 
                            ? inVal.toString(2).padStart(bitCount, '0') 
                            : `0x${inVal.toString(16).toUpperCase().padStart(4, '0')}`
                        }
                    </text>
                </g>
            </g>
        );

    case 'OUTPUT_2BIT':
    case 'OUTPUT_4BIT':
    case 'OUTPUT_8BIT':
    case 'OUTPUT_16BIT':
        const outBits = node.inputs.length;
        const outVal = node.inputs.reduce((acc, val, idx) => acc + (val ? Math.pow(2, idx) : 0), 0);
        return (
            <g>
                <rect x="0" y="0" width={width} height={height} rx="4" fill="#09090b" stroke="#52525b" strokeWidth="2" />
                <Text x={width/2} y={12}>{`OUT ${outBits}b`}</Text>
                
                {/* Bits */}
                {node.inputs.map((state, i) => (
                    <g key={i} transform={`translate(10, ${25 + (i * 20)})`}>
                         {/* Row visual container */}
                         <rect x="0" y="2" width={width - 20} height="16" rx="2" fill="#18181b" stroke="none" />

                         <circle cx="10" cy="10" r="4" fill={state ? "#ef4444" : "#27272a"} stroke={state ? "#f87171" : "#3f3f46"} style={{ filter: state ? 'drop-shadow(0 0 2px #ef4444)' : 'none' }} />
                         <text x="25" y="10" dominantBaseline="middle" fill="#71717a" fontSize="10" fontFamily="monospace">{i.toString()}</text>
                    </g>
                ))}

                 {/* Footer Value Box */}
                 <g transform={`translate(5, ${height - 30})`}>
                    <rect x="0" y="0" width={width - 10} height="25" rx="4" fill="#000" stroke="#3f3f46" />
                    <text x={(width - 10) / 2} y="12.5" textAnchor="middle" dominantBaseline="middle" fill="#ef4444" fontSize="11" fontFamily="monospace">
                        {outBits <= 8 
                            ? outVal.toString(2).padStart(outBits, '0') 
                            : `0x${outVal.toString(16).toUpperCase().padStart(4, '0')}`
                        }
                    </text>
                </g>
            </g>
        );


    // --- Arithmetic ---
    case 'HALF_ADDER':
      return (
        <g>
            <rect x="0" y="0" width="80" height="80" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
            <Text x={40} y={40}>HALF ADDER</Text>
            <Text x={10} y={20}>A</Text> <Text x={10} y={60}>B</Text>
            <Text x={70} y={20}>S</Text> <Text x={70} y={60}>C</Text>
        </g>
      );
    case 'FULL_ADDER':
        return (
          <g>
              <rect x="0" y="0" width="80" height="100" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
              <Text x={40} y={50}>FULL ADDER</Text>
              <Text x={10} y={20}>A</Text> <Text x={10} y={40}>B</Text> <Text x={10} y={80}>Cin</Text>
              <Text x={70} y={20}>S</Text> <Text x={70} y={80}>Cout</Text>
          </g>
        );
    case 'SUBTRACTOR':
        return (
            <g>
                <rect x="0" y="0" width="80" height="100" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                <Text x={40} y={50}>SUBTRACTOR</Text>
                <Text x={10} y={20}>A</Text> <Text x={10} y={60}>B</Text>
                <Text x={70} y={20}>D</Text> <Text x={70} y={80}>Bo</Text>
            </g>
        );
    case 'COMPARATOR_1BIT':
        return (
            <g>
                <rect x="0" y="0" width="80" height="80" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                <Text x={40} y={40}>COMPARATOR</Text>
                <Text x={10} y={20}>A</Text> <Text x={10} y={60}>B</Text>
                <Text x={70} y={20}>&gt;</Text> <Text x={70} y={40}>=</Text> <Text x={70} y={60}>&lt;</Text>
            </g>
        );

    // --- Memory ---
    case 'D_LATCH':
        return (
          <g>
              <rect x="0" y="0" width="80" height="80" rx="4" fill={fillColor} stroke={active ? "#22d3ee" : "#52525b"} strokeWidth="2" />
              <Text x={40} y={25}>D-LATCH</Text>
              <Text x={10} y={20}>D</Text> <Text x={10} y={60}>En</Text>
              <Text x={70} y={20}>Q</Text> <Text x={70} y={60}>!Q</Text>
          </g>
        );
    case 'D_FF':
        return (
            <g>
                <rect x="0" y="0" width="80" height="80" rx="4" fill={fillColor} stroke={active ? "#22d3ee" : "#52525b"} strokeWidth="2" />
                <Text x={40} y={25}>D-FF</Text>
                <Text x={10} y={20}>D</Text> 
                <path d="M 0 55 L 10 60 L 0 65" fill="none" stroke="#71717a" />
                <Text x={70} y={20}>Q</Text> <Text x={70} y={60}>!Q</Text>
            </g>
        );
    case 'T_FF':
        return (
            <g>
                <rect x="0" y="0" width="80" height="80" rx="4" fill={fillColor} stroke={active ? "#22d3ee" : "#52525b"} strokeWidth="2" />
                <Text x={40} y={25}>T-FF</Text>
                <Text x={10} y={20}>T</Text> 
                <path d="M 0 55 L 10 60 L 0 65" fill="none" stroke="#71717a" />
                <Text x={70} y={20}>Q</Text> <Text x={70} y={60}>!Q</Text>
            </g>
        );
    case 'JK_FF':
        return (
            <g>
                <rect x="0" y="0" width="80" height="100" rx="4" fill={fillColor} stroke={active ? "#22d3ee" : "#52525b"} strokeWidth="2" />
                <Text x={40} y={25}>JK-FF</Text>
                <Text x={10} y={20}>J</Text> <Text x={10} y={80}>K</Text>
                <path d="M 0 45 L 10 50 L 0 55" fill="none" stroke="#71717a" />
                <Text x={70} y={20}>Q</Text> <Text x={70} y={80}>!Q</Text>
            </g>
        );
    case 'SR_FF':
        return (
            <g>
                <rect x="0" y="0" width="80" height="100" rx="4" fill={fillColor} stroke={active ? "#22d3ee" : "#52525b"} strokeWidth="2" />
                <Text x={40} y={25}>SR-FF</Text>
                <Text x={10} y={20}>S</Text> <Text x={10} y={80}>R</Text>
                <path d="M 0 45 L 10 50 L 0 55" fill="none" stroke="#71717a" />
                <Text x={70} y={20}>Q</Text> <Text x={70} y={80}>!Q</Text>
            </g>
        );
    
    // --- Advanced ---
    case 'GATED_SR_LATCH':
        return (
            <g>
                <rect x="0" y="0" width="80" height="100" rx="4" fill={fillColor} stroke={active ? "#22d3ee" : "#52525b"} strokeWidth="2" />
                <Text x={40} y={25}>Gated SR</Text>
                <Text x={10} y={20}>S</Text> <Text x={10} y={50}>En</Text> <Text x={10} y={80}>R</Text>
                <Text x={70} y={20}>Q</Text> <Text x={70} y={80}>!Q</Text>
            </g>
        );
    case 'JK_MASTER_SLAVE':
        return (
            <g>
                <rect x="0" y="0" width="90" height="100" rx="4" fill={fillColor} stroke={active ? "#22d3ee" : "#52525b"} strokeWidth="2" />
                <Text x={45} y={25}>JK M-S</Text>
                <Text x={10} y={20}>J</Text> <Text x={10} y={80}>K</Text>
                <path d="M 0 45 L 10 50 L 0 55" fill="none" stroke="#71717a" />
                <Text x={80} y={20}>Q</Text> <Text x={80} y={80}>!Q</Text>
            </g>
        );
    case 'RAM_1BIT':
        return (
            <g>
                <rect x="0" y="0" width="70" height="80" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                <Text x={35} y={20}>RAM 1b</Text>
                <Text x={10} y={20}>D</Text> <Text x={10} y={40}>W</Text> <Text x={10} y={60}>S</Text>
                <Text x={60} y={40}>Q</Text>
            </g>
        );
    case 'ROM_1BIT':
        return (
            <g>
                <rect x="0" y="0" width="60" height="60" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                <Text x={30} y={15}>ROM 1b</Text>
                <Text x={30} y={45}>{node.properties?.romValue ? '1' : '0'}</Text>
                <Text x={10} y={30}>S</Text>
                <Text x={50} y={30}>Q</Text>
            </g>
        );
    case 'SHIFT_REGISTER_4BIT':
        const reg = node.internalState?.register || [false, false, false, false];
        return (
            <g>
                <rect x="0" y="0" width="100" height="120" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                <Text x={50} y={15}>SHIFT REG 4b</Text>
                <Text x={10} y={30}>D</Text> 
                <path d="M 0 85 L 10 90 L 0 95" fill="none" stroke="#71717a" />
                
                {/* Visualizing bits */}
                <rect x="30" y="40" width="15" height="40" fill={reg[0] ? "#22d3ee" : "#27272a"} stroke="#3f3f46" />
                <rect x="45" y="40" width="15" height="40" fill={reg[1] ? "#22d3ee" : "#27272a"} stroke="#3f3f46" />
                <rect x="60" y="40" width="15" height="40" fill={reg[2] ? "#22d3ee" : "#27272a"} stroke="#3f3f46" />
                <rect x="75" y="40" width="15" height="40" fill={reg[3] ? "#22d3ee" : "#27272a"} stroke="#3f3f46" />

                <Text x={90} y={20}>Q0</Text> <Text x={90} y={50}>Q1</Text>
                <Text x={90} y={80}>Q2</Text> <Text x={90} y={110}>Q3</Text>
            </g>
        );

    // --- RAM BLOCKS ---
    case 'RAM_4BIT':
    case 'RAM_8BIT':
    case 'RAM_16BIT':
        const dataBits = type === 'RAM_4BIT' ? 4 : (type === 'RAM_8BIT' ? 8 : 16);
        const addrBits = 4;
        
        // Compute current state for display
        // Address
        let addr = 0;
        for(let i=0; i<addrBits; i++) {
            if (node.inputs[i]) addr += Math.pow(2, i);
        }
        
        // Data In (for visual reference only, if needed)
        
        // Controls
        const WE = node.inputs[addrBits + dataBits];
        const CS = node.inputs[addrBits + dataBits + 1];

        // Stored Value at current address
        const mem = node.internalState?.memory || [];
        const storedVal = mem[addr] || 0;
        
        // Status Text
        let status = "IDLE";
        if (CS) {
            status = WE ? "WRITE" : "READ";
        } else {
            status = "OFF";
        }

        return (
            <g>
                <rect x="0" y="0" width={width} height={height} rx="4" fill="#09090b" stroke="#52525b" strokeWidth="2" />
                <Text x={width/2} y={15} fill="#e4e4e7" fontSize="12">{type.replace('_', ' ')}</Text>
                
                {/* Internal Monitor Screen */}
                <rect x="40" y="30" width="60" height="40" rx="2" fill="#000" stroke="#3f3f46" />
                <Text x={70} y={42} fill="#71717a" fontSize="9">ADDR</Text>
                <Text x={70} y={58} fill="#22d3ee" fontSize="12" >{`0x${addr.toString(16).toUpperCase()}`}</Text>
                
                <rect x="40" y="75" width="60" height="40" rx="2" fill="#000" stroke="#3f3f46" />
                <Text x={70} y={87} fill="#71717a" fontSize="9">DATA</Text>
                <Text x={70} y={103} fill="#ef4444" fontSize="12">{`0x${storedVal.toString(16).toUpperCase().padStart(dataBits > 8 ? 4 : 2, '0')}`}</Text>

                {/* Status Indicator */}
                <rect x="40" y="125" width="60" height="16" rx="2" fill={CS ? (WE ? "#7f1d1d" : "#064e3b") : "#27272a"} />
                <Text x={70} y={133} fill={CS ? "#fff" : "#52525b"} fontSize="9">{status}</Text>

            </g>
        );

    // --- Plexers ---
    case 'MUX_2_1':
        return (
          <g>
              <path d="M 0 0 L 60 20 L 60 60 L 0 80 Z" fill={fillColor} stroke={active ? "#22d3ee" : "#52525b"} strokeWidth="2" />
              <Text x={30} y={40}>MUX</Text>
              <Text x={10} y={20}>0</Text> <Text x={10} y={60}>1</Text> <Text x={30} y={70}>S</Text>
              <Text x={50} y={40}>Y</Text>
          </g>
        );
    case 'MUX_4_1':
        return (
            <g>
                <path d="M 0 0 L 60 20 L 60 100 L 0 120 Z" fill={fillColor} stroke={active ? "#22d3ee" : "#52525b"} strokeWidth="2" />
                <Text x={30} y={60}>MUX 4</Text>
                <Text x={10} y={20}>0</Text> <Text x={10} y={40}>1</Text>
                <Text x={10} y={60}>2</Text> <Text x={10} y={80}>3</Text>
                <Text x={50} y={60}>Y</Text>
            </g>
        );
    case 'DEMUX_1_2':
        return (
          <g>
              <path d="M 0 20 L 60 0 L 60 80 L 0 60 Z" fill={fillColor} stroke={active ? "#22d3ee" : "#52525b"} strokeWidth="2" />
              <Text x={30} y={40}>DEMUX</Text>
              <Text x={10} y={40}>D</Text> 
              <Text x={50} y={20}>0</Text> <Text x={50} y={60}>1</Text>
          </g>
        );
    case 'DEMUX_1_4':
        return (
            <g>
                <path d="M 0 20 L 60 0 L 60 120 L 0 100 Z" fill={fillColor} stroke={active ? "#22d3ee" : "#52525b"} strokeWidth="2" />
                <Text x={30} y={60}>DEMUX 4</Text>
                <Text x={10} y={60}>D</Text> 
                <Text x={50} y={20}>0</Text> <Text x={50} y={40}>1</Text>
                <Text x={50} y={60}>2</Text> <Text x={50} y={80}>3</Text>
            </g>
        );
    case 'DECODER_2_4':
        return (
            <g>
                <rect x="0" y="0" width="60" height="100" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                <Text x={30} y={50}>DEC 2:4</Text>
                <Text x={10} y={80}>0</Text> <Text x={10} y={90}>1</Text>
                <Text x={50} y={20}>0</Text> <Text x={50} y={40}>1</Text>
                <Text x={50} y={60}>2</Text> <Text x={50} y={80}>3</Text>
            </g>
        );
    case 'PRIORITY_ENCODER_4_2':
        return (
            <g>
                <rect x="0" y="0" width="70" height="100" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                <Text x={35} y={10}>PRIO ENC</Text>
                <Text x={10} y={20}>0</Text> <Text x={10} y={40}>1</Text>
                <Text x={10} y={60}>2</Text> <Text x={10} y={80}>3</Text>
                <Text x={60} y={30}>A0</Text> <Text x={60} y={50}>A1</Text> <Text x={60} y={80}>V</Text>
            </g>
        );

    default:
      return <rect width="40" height="40" fill="red" />;
  }
};
