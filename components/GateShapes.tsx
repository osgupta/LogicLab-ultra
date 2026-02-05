
import React from 'react';
import { NodeData } from '../types';
import { getNodeDimensions } from '../utils/componentUtils';

interface GateShapeProps {
  node: NodeData;
}

interface TextProps {
  x: number;
  y: number;
  children?: React.ReactNode;
  fill?: string;
  fontSize?: string;
}

const GateText = ({ x, y, children, fill="#71717a", fontSize="10" }: TextProps) => (
  <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fill={fill} fontSize={fontSize} fontWeight="bold" className="pointer-events-none select-none">
    {children}
  </text>
);

const boolsToVal = (bools: boolean[]) => {
    return bools.reduce((acc, b, i) => acc + (b ? Math.pow(2, i) : 0), 0);
};

const boolsToHex = (bools: boolean[]) => {
    const val = boolsToVal(bools);
    const hex = val.toString(16).toUpperCase();
    const pad = Math.ceil(bools.length / 4);
    return `0x${hex.padStart(pad, '0')}`;
};

export const GateShape: React.FC<GateShapeProps> = ({ node }) => {
  const type = node.type;
  const active = node.outputs[0]; 
  const strokeColor = active ? "#22d3ee" : "#71717a"; 
  const fillColor = node.properties?.color || "#18181b"; 
  const activeFill = active ? "#0ea5e9" : fillColor; 
  const { width, height } = getNodeDimensions(node);

  const getGatePath = (gateType: 'AND' | 'OR' | 'NAND' | 'NOR' | 'XOR' | 'XNOR') => {
     switch (gateType) {
         case 'AND': 
         case 'NAND':
             return `M 0 0 L ${width/2} 0 A ${height/2} ${height/2} 0 0 1 ${width/2} ${height} L 0 ${height} Z`;
         case 'OR':
         case 'NOR':
             return `M 0 0 Q ${width*0.25} ${height/2} 0 ${height} Q ${width*0.8} ${height} ${width} ${height/2} Q ${width*0.8} 0 0 0 Z`;
         case 'XOR':
         case 'XNOR':
             return `M 10 0 Q ${width*0.35} ${height/2} 10 ${height} Q ${width*0.9} ${height} ${width} ${height/2} Q ${width*0.9} 0 10 0 Z`;
     }
  };

  const renderBinaryFooter = (bitCount: number, values: boolean[]) => {
      const bitWidth = 10;
      const bitSpacing = 2;
      const nibbleGap = 6;
      const totalWidth = bitCount * bitWidth + (bitCount - 1) * bitSpacing + Math.floor((bitCount - 1) / 4) * nibbleGap;
      const startX = (width - totalWidth) / 2 + bitWidth / 2;
      
      // Adjusted binary footer vertical offset
      return (
        <g transform={`translate(0, ${height - 40})`}>
            <rect x="5" y="0" width={width - 10} height="28" rx="4" fill="#000" stroke="#3f3f46" />
            {Array.from({length: bitCount}).map((_, i) => {
                const bitIndex = bitCount - 1 - i;
                const bitVal = values[bitIndex];
                const nibblesBefore = Math.floor(i / 4);
                const xPos = startX + i * (bitWidth + bitSpacing) + nibblesBefore * nibbleGap;
                
                return (
                    <text 
                        key={bitIndex} 
                        x={xPos} 
                        y="14" 
                        textAnchor="middle" 
                        dominantBaseline="middle" 
                        fill={bitVal ? "#22d3ee" : "#52525b"} 
                        fontSize="12" 
                        fontFamily="monospace"
                        fontWeight="bold"
                    >
                        {bitVal ? "1" : "0"}
                    </text>
                );
            })}
        </g>
      );
  };

  switch (type) {
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
        
    case 'JUNCTION':
        return <circle cx="5" cy="5" r="5" fill={active ? "#22d3ee" : "#71717a"} />;

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
        const valVal = (node.inputs[0]?1:0) + (node.inputs[1]?2:0) + (node.inputs[2]?4:0) + (node.inputs[3]?8:0);
        const hexChar = valVal.toString(16).toUpperCase();
        return (
            <g>
                <rect x="0" y="0" width="60" height="80" fill="#000" stroke="#3f3f46" strokeWidth="4" />
                <text x="30" y="45" textAnchor="middle" dominantBaseline="middle" fill="#ef4444" fontSize="40" fontFamily="monospace" style={{ filter: 'drop-shadow(0 0 4px #ef4444)'}}>
                    {hexChar}
                </text>
            </g>
        );
    case 'SEVEN_SEGMENT':
        const [a, b, c, d, e, f, g, dp] = node.inputs;
        const segOn = "#ef4444";
        const segOff = "#27272a";
        const segStyle = (on: boolean) => ({ fill: on ? segOn : segOff, filter: on ? 'drop-shadow(0 0 2px #ef4444)' : 'none' });
        return (
            <g>
                <rect x="0" y="0" width="70" height="100" fill="#000" stroke="#3f3f46" strokeWidth="4" />
                <path d="M 15 10 L 55 10 L 50 15 L 20 15 Z" {...segStyle(a)} />
                <path d="M 55 10 L 60 15 L 60 45 L 55 50 L 50 45 L 50 15 Z" {...segStyle(b)} />
                <path d="M 55 50 L 60 55 L 60 85 L 55 90 L 50 85 L 50 55 Z" {...segStyle(c)} />
                <path d="M 15 90 L 55 90 L 50 85 L 20 85 Z" {...segStyle(d)} />
                <path d="M 15 50 L 20 55 L 20 85 L 15 90 L 10 85 L 10 55 Z" {...segStyle(e)} />
                <path d="M 15 10 L 20 15 L 20 45 L 15 50 L 10 45 L 10 15 Z" {...segStyle(f)} />
                <path d="M 15 50 L 20 45 L 50 45 L 55 50 L 50 55 L 20 55 Z" {...segStyle(g)} />
                <circle cx="60" cy="90" r="3" {...segStyle(dp)} />
            </g>
        );
    
    case 'INPUT_2BIT':
    case 'INPUT_4BIT':
    case 'INPUT_8BIT':
    case 'INPUT_16BIT':
        const bitCount = node.outputs.length;
        return (
            <g>
                <rect x="0" y="0" width={width} height={height} rx="4" fill="#18181b" stroke="#52525b" strokeWidth="2" />
                <GateText x={width/2} y={15}>{`IN ${bitCount}b (${boolsToHex(node.outputs)})`}</GateText>
                {node.outputs.map((state, i) => (
                   // Increased step from 20 to 28
                   <g key={i} transform={`translate(10, ${40 + (i * 28)})`}>
                       <rect x="0" y="2" width={width - 20} height="20" rx="2" fill="#27272a" stroke="none" />
                       <g transform="translate(5, 4)">
                           <rect x="0" y="0" width="24" height="12" rx="2" fill={state ? "#0ea5e9" : "#3f3f46"} stroke={state ? "#22d3ee" : "#52525b"} />
                           <circle cx={state ? 18 : 6} cy={6} r="4" fill="white" />
                       </g>
                       <text x="40" y="10" dominantBaseline="middle" fill="#71717a" fontSize="11" fontFamily="monospace">{i.toString()}</text>
                   </g>
                ))}
                {renderBinaryFooter(bitCount, node.outputs)}
            </g>
        );

    case 'OUTPUT_2BIT':
    case 'OUTPUT_4BIT':
    case 'OUTPUT_8BIT':
    case 'OUTPUT_16BIT':
        const outBits = node.inputs.length;
        return (
            <g>
                <rect x="0" y="0" width={width} height={height} rx="4" fill="#09090b" stroke="#52525b" strokeWidth="2" />
                <GateText x={width/2} y={15}>{`OUT ${outBits}b (${boolsToHex(node.inputs)})`}</GateText>
                {node.inputs.map((state, i) => (
                    // Increased step from 20 to 28
                    <g key={i} transform={`translate(10, ${40 + (i * 28)})`}>
                         <rect x="0" y="2" width={width - 20} height="20" rx="2" fill="#18181b" stroke="none" />
                         <circle cx="12" cy="10" r="5" fill={state ? "#ef4444" : "#27272a"} stroke={state ? "#f87171" : "#3f3f46"} style={{ filter: state ? 'drop-shadow(0 0 2px #ef4444)' : 'none' }} />
                         <text x="30" y="10" dominantBaseline="middle" fill="#71717a" fontSize="11" fontFamily="monospace">{i.toString()}</text>
                    </g>
                ))}
                 {renderBinaryFooter(outBits, node.inputs)}
            </g>
        );

    case 'LOGIC_PROBE':
        const probeOn = node.inputs[0];
        return (
            <g>
                <rect x="0" y="0" width="40" height="40" rx="4" fill="#000" stroke={probeOn ? "#22d3ee" : "#3f3f46"} strokeWidth="2" />
                <text x="20" y="20" textAnchor="middle" dominantBaseline="middle" fill={probeOn ? "#22d3ee" : "#3f3f46"} fontSize="24" fontFamily="monospace" fontWeight="bold" style={{ filter: probeOn ? 'drop-shadow(0 0 4px #22d3ee)' : 'none' }}>
                    {probeOn ? "1" : "0"}
                </text>
            </g>
        );

    case 'BINARY_MONITOR_4BIT':
    case 'BINARY_MONITOR_8BIT':
        const monitorBits = node.inputs.length;
        return (
            <g>
                <rect x="0" y="0" width={width} height={height} rx="4" fill="#000" stroke="#3f3f46" strokeWidth="2" />
                <rect x="5" y="5" width={width - 10} height={height - 10} rx="2" fill="#09090b" />
                {node.inputs.map((val, i) => {
                    const revIdx = monitorBits - 1 - i;
                    const xPos = 15 + i * ((width - 30) / (monitorBits - 1 || 1));
                    return (
                        <text key={i} x={xPos} y={height / 2} textAnchor="middle" dominantBaseline="middle" fill={val ? "#22d3ee" : "#27272a"} fontSize="16" fontFamily="monospace" fontWeight="bold" style={{ filter: val ? 'drop-shadow(0 0 2px #22d3ee)' : 'none' }}>
                            {val ? "1" : "0"}
                        </text>
                    );
                })}
            </g>
        );

    case 'HALF_ADDER':
      return (
        <g>
            <rect x="0" y="0" width="80" height="80" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
            <GateText x={40} y={40}>HALF ADDER</GateText>
            <GateText x={10} y={20}>A</GateText> <GateText x={10} y={60}>B</GateText>
            <GateText x={70} y={20}>S</GateText> <GateText x={70} y={60}>C</GateText>
        </g>
      );
    case 'FULL_ADDER':
        return (
          <g>
              <rect x="0" y="0" width="80" height="100" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
              <GateText x={40} y={50}>FULL ADDER</GateText>
              <GateText x={10} y={20}>A</GateText> <GateText x={10} y={40}>B</GateText> <GateText x={10} y={80}>Cin</GateText>
              <GateText x={70} y={20}>S</GateText> <GateText x={70} y={80}>Cout</GateText>
          </g>
        );
    case 'SUBTRACTOR':
        return (
            <g>
                <rect x="0" y="0" width="80" height="100" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                <GateText x={40} y={50}>SUBTRACTOR</GateText>
                <GateText x={10} y={20}>A</GateText> <GateText x={10} y={60}>B</GateText>
                <GateText x={70} y={20}>D</GateText> <GateText x={70} y={80}>Bo</GateText>
            </g>
        );
    case 'COMPARATOR_1BIT':
        return (
            <g>
                <rect x="0" y="0" width="80" height="80" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                <GateText x={40} y={40}>COMPARATOR</GateText>
                <GateText x={10} y={20}>A</GateText> <GateText x={10} y={60}>B</GateText>
                <GateText x={70} y={20}>&gt;</GateText> <GateText x={70} y={40}>=</GateText> <GateText x={70} y={60}>&lt;</GateText>
            </g>
        );

    case 'D_LATCH':
        return (
          <g>
              <rect x="0" y="0" width="80" height="80" rx="4" fill={fillColor} stroke={active ? "#22d3ee" : "#52525b"} strokeWidth="2" />
              <GateText x={40} y={25}>D-LATCH</GateText>
              <GateText x={10} y={20}>D</GateText> <GateText x={10} y={60}>En</GateText>
              <GateText x={70} y={20}>Q</GateText> <GateText x={70} y={60}>!Q</GateText>
          </g>
        );
    case 'D_FF':
        return (
            <g>
                <rect x="0" y="0" width="80" height="80" rx="4" fill={fillColor} stroke={active ? "#22d3ee" : "#52525b"} strokeWidth="2" />
                <GateText x={40} y={25}>D-FF</GateText>
                <GateText x={10} y={20}>D</GateText> 
                <path d="M 0 55 L 10 60 L 0 65" fill="none" stroke="#71717a" />
                <GateText x={70} y={20}>Q</GateText> <GateText x={70} y={60}>!Q</GateText>
            </g>
        );
    case 'T_FF':
        return (
            <g>
                <rect x="0" y="0" width="80" height="80" rx="4" fill={fillColor} stroke={active ? "#22d3ee" : "#52525b"} strokeWidth="2" />
                <GateText x={40} y={25}>T-FF</GateText>
                <GateText x={10} y={20}>T</GateText> 
                <path d="M 0 55 L 10 60 L 0 65" fill="none" stroke="#71717a" />
                <GateText x={70} y={20}>Q</GateText> <GateText x={70} y={60}>!Q</GateText>
            </g>
        );
    case 'JK_FF':
        return (
            <g>
                <rect x="0" y="0" width="80" height="100" rx="4" fill={fillColor} stroke={active ? "#22d3ee" : "#52525b"} strokeWidth="2" />
                <GateText x={40} y={25}>JK-FF</GateText>
                <GateText x={10} y={20}>J</GateText> <GateText x={10} y={80}>K</GateText>
                <path d="M 0 45 L 10 50 L 0 55" fill="none" stroke="#71717a" />
                <GateText x={70} y={20}>Q</GateText> <GateText x={70} y={80}>!Q</GateText>
            </g>
        );
    case 'SR_FF':
        return (
            <g>
                <rect x="0" y="0" width="80" height="100" rx="4" fill={fillColor} stroke={active ? "#22d3ee" : "#52525b"} strokeWidth="2" />
                <GateText x={40} y={25}>SR-FF</GateText>
                <GateText x={10} y={20}>S</GateText> <GateText x={10} y={80}>R</GateText>
                <path d="M 0 45 L 10 50 L 0 55" fill="none" stroke="#71717a" />
                <GateText x={70} y={20}>Q</GateText> <GateText x={70} y={80}>!Q</GateText>
            </g>
        );
    case 'GATED_SR_LATCH':
        return (
            <g>
                <rect x="0" y="0" width="80" height="100" rx="4" fill={fillColor} stroke={active ? "#22d3ee" : "#52525b"} strokeWidth="2" />
                <GateText x={40} y={25}>Gated SR</GateText>
                <GateText x={10} y={20}>S</GateText> <GateText x={10} y={50}>En</GateText> <GateText x={10} y={80}>R</GateText>
                <GateText x={70} y={20}>Q</GateText> <GateText x={70} y={80}>!Q</GateText>
            </g>
        );
    case 'JK_MASTER_SLAVE':
        return (
            <g>
                <rect x="0" y="0" width="90" height="100" rx="4" fill={fillColor} stroke={active ? "#22d3ee" : "#52525b"} strokeWidth="2" />
                <GateText x={45} y={25}>JK M-S</GateText>
                <GateText x={10} y={20}>J</GateText> <GateText x={10} y={80}>K</GateText>
                <path d="M 0 45 L 10 50 L 0 55" fill="none" stroke="#71717a" />
                <GateText x={80} y={20}>Q</GateText> <GateText x={80} y={80}>!Q</GateText>
            </g>
        );
    case 'RAM_1BIT':
        return (
            <g>
                <rect x="0" y="0" width="70" height="80" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                <GateText x={35} y={20}>RAM 1b</GateText>
                <GateText x={10} y={20}>D</GateText> <GateText x={10} y={40}>W</GateText> <GateText x={10} y={60}>S</GateText>
                <GateText x={60} y={40}>Q</GateText>
            </g>
        );
    case 'ROM_1BIT':
        return (
            <g>
                <rect x="0" y="0" width="60" height="60" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                <GateText x={30} y={15}>ROM 1b</GateText>
                <GateText x={30} y={45}>{node.properties?.romValue ? '1' : '0'}</GateText>
                <GateText x={10} y={30}>S</GateText>
                <GateText x={50} y={30}>Q</GateText>
            </g>
        );
    case 'SHIFT_REGISTER_4BIT':
        const regReg = node.internalState?.register || [false, false, false, false];
        return (
            <g>
                <rect x="0" y="0" width="100" height="120" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                <GateText x={50} y={15}>SHIFT REG 4b</GateText>
                <GateText x={10} y={30}>D</GateText> 
                <path d="M 0 85 L 10 90 L 0 95" fill="none" stroke="#71717a" />
                <rect x="30" y="40" width="15" height="40" fill={regReg[0] ? "#22d3ee" : "#27272a"} stroke="#3f3f46" />
                <rect x="45" y="40" width="15" height="40" fill={regReg[1] ? "#22d3ee" : "#27272a"} stroke="#3f3f46" />
                <rect x="60" y="40" width="15" height="40" fill={regReg[2] ? "#22d3ee" : "#27272a"} stroke="#3f3f46" />
                <rect x="75" y="40" width="15" height="40" fill={regReg[3] ? "#22d3ee" : "#27272a"} stroke="#3f3f46" />
                <GateText x={90} y={20}>Q0</GateText> <GateText x={90} y={50}>Q1</GateText>
                <GateText x={90} y={80}>Q2</GateText> <GateText x={90} y={110}>Q3</GateText>
            </g>
        );

    case 'RAM_4BIT':
    case 'RAM_8BIT':
    case 'RAM_16BIT':
        const dBits = type === 'RAM_4BIT' ? 4 : (type === 'RAM_8BIT' ? 8 : 16);
        const aBits = 4;
        let addrAddr = 0;
        for(let i=0; i<aBits; i++) {
            if (node.inputs[i]) addrAddr += Math.pow(2, i);
        }
        const WE_WE = node.inputs[aBits + dBits];
        const CS_CS = node.inputs[aBits + dBits + 1];
        const mem_mem = node.internalState?.memory || [];
        const sVal = mem_mem[addrAddr] || 0;
        let sStat = "IDLE";
        if (CS_CS) {
            sStat = WE_WE ? "WRITE" : "READ";
        } else {
            sStat = "OFF";
        }
        return (
            <g>
                <rect x="0" y="0" width={width} height={height} rx="4" fill="#09090b" stroke="#52525b" strokeWidth="2" />
                <GateText x={width/2} y={15} fill="#e4e4e7" fontSize="12">{type.replace('_', ' ')}</GateText>
                <rect x="40" y="35" width={width - 80} height="40" rx="2" fill="#000" stroke="#3f3f46" />
                <GateText x={width/2} y={47} fill="#71717a" fontSize="9">ADDR</GateText>
                <GateText x={width/2} y={63} fill="#22d3ee" fontSize="12" >{`0x${addrAddr.toString(16).toUpperCase()}`}</GateText>
                <rect x="40" y="80" width={width - 80} height="40" rx="2" fill="#000" stroke="#3f3f46" />
                <GateText x={width/2} y={92} fill="#71717a" fontSize="9">DATA</GateText>
                <GateText x={width/2} y={108} fill="#ef4444" fontSize="12">{`0x${sVal.toString(16).toUpperCase().padStart(dBits > 8 ? 4 : 2, '0')}`}</GateText>
                <rect x="40" y="125" width={width - 80} height="16" rx="2" fill={CS_CS ? (WE_WE ? "#7f1d1d" : "#064e3b") : "#27272a"} />
                <GateText x={width/2} y={133} fill={CS_CS ? "#fff" : "#52525b"} fontSize="9">{sStat}</GateText>
            </g>
        );

    case 'MUX_2_1':
        return (
          <g>
              <path d="M 0 0 L 60 20 L 60 60 L 0 80 Z" fill={fillColor} stroke={active ? "#22d3ee" : "#52525b"} strokeWidth="2" />
              <GateText x={30} y={40}>MUX</GateText>
              <GateText x={10} y={20}>0</GateText> <GateText x={10} y={60}>1</GateText> <GateText x={30} y={70}>S</GateText>
              <GateText x={50} y={40}>Y</GateText>
          </g>
        );
    case 'MUX_4_1':
        return (
            <g>
                <path d="M 0 0 L 60 20 L 60 100 L 0 120 Z" fill={fillColor} stroke={active ? "#22d3ee" : "#52525b"} strokeWidth="2" />
                <GateText x={30} y={60}>MUX 4</GateText>
                <GateText x={10} y={20}>0</GateText> <GateText x={10} y={40}>1</GateText>
                <GateText x={10} y={60}>2</GateText> <GateText x={10} y={80}>3</GateText>
                <GateText x={50} y={60}>Y</GateText>
            </g>
        );
    case 'DEMUX_1_2':
        return (
          <g>
              <path d="M 0 20 L 60 0 L 60 80 L 0 60 Z" fill={fillColor} stroke={active ? "#22d3ee" : "#52525b"} strokeWidth="2" />
              <GateText x={30} y={40}>DEMUX</GateText>
              <GateText x={10} y={40}>D</GateText> 
              <GateText x={50} y={20}>0</GateText> <GateText x={50} y={60}>1</GateText>
          </g>
        );
    case 'DEMUX_1_4':
        return (
            <g>
                <path d="M 0 20 L 60 0 L 60 120 L 0 100 Z" fill={fillColor} stroke={active ? "#22d3ee" : "#52525b"} strokeWidth="2" />
                <GateText x={30} y={60}>DEMUX 4</GateText>
                <GateText x={10} y={60}>D</GateText> 
                <GateText x={50} y={20}>0</GateText> <GateText x={50} y={40}>1</GateText>
                <GateText x={50} y={60}>2</GateText> <GateText x={50} y={80}>3</GateText>
            </g>
        );
    case 'DECODER_2_4':
        return (
            <g>
                <rect x="0" y="0" width="60" height="100" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                <GateText x={30} y={50}>DEC 2:4</GateText>
                <GateText x={10} y={80}>0</GateText> <GateText x={10} y={90}>1</GateText>
                <GateText x={50} y={20}>0</GateText> <GateText x={50} y={40}>1</GateText>
                <GateText x={50} y={60}>2</GateText> <GateText x={50} y={80}>3</GateText>
            </g>
        );
    case 'PRIORITY_ENCODER_4_2':
        return (
            <g>
                <rect x="0" y="0" width="70" height="100" rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                <GateText x={35} y={10}>PRIO ENC</GateText>
                <GateText x={10} y={20}>0</GateText> <GateText x={10} y={40}>1</GateText>
                <GateText x={10} y={60}>2</GateText> <GateText x={10} y={80}>3</GateText>
                <GateText x={60} y={30}>A0</GateText> <GateText x={60} y={50}>A1</GateText> <GateText x={60} y={80}>V</GateText>
            </g>
        );

    default:
      return <rect width="40" height="40" fill="red" />;
  }
};
