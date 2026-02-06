
import React from 'react';
import { NodeData } from '../types';
import { getNodeDimensions } from '../utils/componentUtils';
import { MB_START_Y, MB_SPACING } from '../constants';

interface GateShapeProps {
  node: NodeData;
}

interface TextProps {
  x: number;
  y: number;
  children?: React.ReactNode;
  fill?: string;
  fontSize?: string;
  fontFamily?: string;
}

const GateText = ({ x, y, children, fill="#71717a", fontSize="10", fontFamily }: TextProps) => (
  <text 
    x={x} y={y} 
    textAnchor="middle" dominantBaseline="middle" 
    fill={fill} fontSize={fontSize} fontFamily={fontFamily}
    fontWeight="bold" className="pointer-events-none select-none"
  >
    {children}
  </text>
);

const boolsToVal = (bools: boolean[]) => bools.reduce((acc, b, i) => acc + (b ? Math.pow(2, i) : 0), 0);
const boolsToHex = (bools: boolean[]) => `0x${boolsToVal(bools).toString(16).toUpperCase().padStart(Math.ceil(bools.length / 4), '0')}`;

export const GateShape: React.FC<GateShapeProps> = ({ node }) => {
  const type = node.type;
  const active = node.outputs[0]; 
  const strokeColor = active ? "#22d3ee" : "#71717a"; 
  const fillColor = node.properties?.color || "#18181b"; 
  const activeFill = active ? "#0ea5e9" : fillColor; 
  const { width, height } = getNodeDimensions(node);

  const getGatePath = (gateType: 'AND' | 'OR' | 'NAND' | 'NOR' | 'XOR' | 'XNOR') => {
     switch (gateType) {
         case 'AND': case 'NAND': return `M 0 0 L ${width/2} 0 A ${height/2} ${height/2} 0 0 1 ${width/2} ${height} L 0 ${height} Z`;
         case 'OR': case 'NOR': return `M 0 0 Q ${width*0.25} ${height/2} 0 ${height} Q ${width*0.8} ${height} ${width} ${height/2} Q ${width*0.8} 0 0 0 Z`;
         case 'XOR': case 'XNOR': return `M 10 0 Q ${width*0.35} ${height/2} 10 ${height} Q ${width*0.9} ${height} ${width} ${height/2} Q ${width*0.9} 0 10 0 Z`;
     }
  };

  const renderBinaryFooter = (bitCount: number, values: boolean[]) => {
      const bitWidth = 8; const bitSpacing = 1; const nibbleGap = 4;
      const totalWidth = bitCount * bitWidth + (bitCount - 1) * bitSpacing + Math.floor((bitCount - 1) / 4) * nibbleGap;
      const startX = (width - totalWidth) / 2 + bitWidth / 2;
      return (
        <g transform={`translate(0, ${height - 35})`}>
            <rect x="5" y="0" width={width - 10} height="24" rx="4" fill="#000" stroke="#3f3f46" />
            {Array.from({length: bitCount}).map((_, i) => {
                const bitIndex = bitCount - 1 - i; const bitVal = values[bitIndex]; const nibblesBefore = Math.floor(i / 4);
                const xPos = startX + i * (bitWidth + bitSpacing) + nibblesBefore * nibbleGap;
                return (
                    <text key={bitIndex} x={xPos} y="12" textAnchor="middle" dominantBaseline="middle" fill={bitVal ? "#22d3ee" : "#27272a"} fontSize="10" fontFamily="monospace" fontWeight="bold">
                        {bitVal ? "1" : "0"}
                    </text>
                );
            })}
        </g>
      );
  };

  switch (true) {
    case type === 'AND': return <path d={getGatePath('AND')} fill={fillColor} stroke={strokeColor} strokeWidth="2" />;
    case type === 'NAND': return (
        <g>
          <path d={getGatePath('NAND')} fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <circle cx={width} cy={height/2} r="5" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
        </g>
      );
    case type === 'OR': return <path d={getGatePath('OR')} fill={fillColor} stroke={strokeColor} strokeWidth="2" />;
    case type === 'NOR': return (
        <g>
          <path d={getGatePath('OR')} fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <circle cx={width} cy={height/2} r="5" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
        </g>
      );
    case type === 'XOR': return (
        <g>
          <path d={getGatePath('XOR')} fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <path d={`M -5 0 Q ${width*0.20} ${height/2} -5 ${height}`} fill="none" stroke={strokeColor} strokeWidth="2" />
        </g>
      );
    case type === 'XNOR': return (
        <g>
          <path d={getGatePath('XOR')} fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <circle cx={width} cy={height/2} r="5" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <path d={`M -5 0 Q ${width*0.20} ${height/2} -5 ${height}`} fill="none" stroke={strokeColor} strokeWidth="2" />
        </g>
      );
    case type === 'NOT': return (
        <g>
          <path d="M 0 0 L 35 20 L 0 40 Z" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <circle cx="40" cy="20" r="5" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
        </g>
      );
    case type === 'BUFFER': return <path d="M 0 0 L 30 20 L 0 40 Z" fill={fillColor} stroke={strokeColor} strokeWidth="2" />;
    case type === 'TRI_STATE_BUFFER': return (
        <g>
            <path d="M 0 0 L 30 20 L 0 40 Z" fill={fillColor} stroke={strokeColor} strokeWidth="2" transform="translate(0, 20)"/>
            <line x1="25" y1="0" x2="25" y2="28" stroke={node.inputs[1] ? "#22d3ee" : "#71717a"} strokeWidth="2" />
        </g>
    );
    case type === 'VCC': return (
            <g>
                <rect x="0" y="0" width="30" height="30" rx="2" fill={fillColor} stroke="#22d3ee" strokeWidth="2" />
                <GateText x={15} y={15} fill="#22d3ee" fontSize="11">VCC</GateText>
            </g>
        );
    case type === 'GND': return (
            <g>
                <rect x="0" y="0" width="30" height="30" rx="2" fill={fillColor} stroke="#52525b" strokeWidth="2" />
                <GateText x={15} y={15} fill="#71717a" fontSize="11">GND</GateText>
            </g>
        );
    case type === 'JUNCTION': return <circle cx="5" cy="5" r="5" fill={active ? "#22d3ee" : "#71717a"} />;
    case type === 'TOGGLE_SWITCH': return (
        <g>
          <rect x="0" y="0" width="40" height="40" rx="4" fill={activeFill} stroke={strokeColor} strokeWidth="2" />
          <text x="20" y="25" textAnchor="middle" fill={active ? "#fff" : "#a1a1aa"} fontSize="12" fontWeight="bold">{active ? "1" : "0"}</text>
        </g>
      );
    case type === 'PUSH_BUTTON': return (
          <g>
            <circle cx="20" cy="20" r="15" fill={active ? "#22c55e" : "#3f3f46"} stroke={strokeColor} strokeWidth="2" />
            <circle cx="20" cy="20" r="10" fill={active ? "#16a34a" : "#18181b"} />
          </g>
        );
    case type === 'CLOCK': return (
            <g>
                <rect x="0" y="0" width="40" height="40" rx="4" fill="#18181b" stroke={active ? "#22d3ee" : "#52525b"} strokeWidth="2" />
                <path d="M 10 20 L 15 20 L 15 10 L 25 10 L 25 30 L 35 30" fill="none" stroke={active ? "#22d3ee" : "#52525b"} strokeWidth="2" />
            </g>
        );
    case type === 'LED': return (
        <g>
          <circle cx="20" cy="20" r="15" fill={node.inputs[0] ? "#ef4444" : "#27272a"} stroke={node.inputs[0] ? "#f87171" : "#52525b"} strokeWidth="2" style={{ filter: node.inputs[0] ? 'drop-shadow(0 0 8px #ef4444)' : 'none'}} />
          {node.inputs[0] && <circle cx="20" cy="20" r="5" fill="white" opacity="0.4" />}
        </g>
      );
    case type === 'HEX_DIGIT':
        const hVal = (node.inputs[0]?1:0) + (node.inputs[1]?2:0) + (node.inputs[2]?4:0) + (node.inputs[3]?8:0);
        return (
            <g>
                <rect x="0" y="0" width="60" height="80" fill="#000" stroke="#3f3f46" strokeWidth="4" />
                <text x="30" y="45" textAnchor="middle" dominantBaseline="middle" fill="#ef4444" fontSize="40" fontFamily="monospace" style={{ filter: 'drop-shadow(0 0 4px #ef4444)'}}>
                    {hVal.toString(16).toUpperCase()}
                </text>
            </g>
        );
    case type.startsWith('INPUT_'):
        const bitCount = node.outputs.length;
        return (
            <g>
                <rect x="0" y="0" width={width} height={height} rx="4" fill="#18181b" stroke="#52525b" strokeWidth="2" />
                <GateText x={width/2} y={15}>{`IN ${bitCount}b (${boolsToHex(node.outputs)})`}</GateText>
                {node.outputs.map((state, i) => (
                   <g key={i} transform={`translate(10, ${MB_START_Y + (i * MB_SPACING)})`}>
                       <rect x="0" y="2" width={width - 20} height="20" rx="2" fill="#27272a" stroke="none" />
                       <g transform="translate(5, 4)">
                           <rect x="0" y="0" width="24" height="12" rx="2" fill={state ? "#0ea5e9" : "#3f3f46"} stroke={state ? "#22d3ee" : "#52525b"} />
                           <circle cx={state ? 18 : 6} cy={6} r="4" fill="white" />
                       </g>
                       <text x={width - 35} y="12" textAnchor="end" dominantBaseline="middle" fill="#71717a" fontSize="11" fontFamily="monospace">{i.toString()}</text>
                   </g>
                ))}
                {renderBinaryFooter(bitCount, node.outputs)}
            </g>
        );
    case type.startsWith('OUTPUT_'):
        const outBits = node.inputs.length;
        return (
            <g>
                <rect x="0" y="0" width={width} height={height} rx="4" fill="#09090b" stroke="#52525b" strokeWidth="2" />
                <GateText x={width/2} y={15}>{`OUT ${outBits}b (${boolsToHex(node.inputs)})`}</GateText>
                {node.inputs.map((state, i) => (
                    <g key={i} transform={`translate(10, ${MB_START_Y + (i * MB_SPACING)})`}>
                         <rect x="0" y="2" width={width - 20} height="20" rx="2" fill="#18181b" stroke="none" />
                         <circle cx="12" cy="12" r="5" fill={state ? "#ef4444" : "#27272a"} stroke={state ? "#f87171" : "#3f3f46"} />
                         <text x="30" y="12" dominantBaseline="middle" fill="#71717a" fontSize="11" fontFamily="monospace">{i.toString()}</text>
                    </g>
                ))}
                 {renderBinaryFooter(outBits, node.inputs)}
            </g>
        );
    case type === 'ALU_4BIT':
      return (
        <g>
          <path d="M 0 0 L 120 20 L 120 140 L 0 160 L 0 100 L 40 80 L 0 60 Z" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <GateText x={75} y={80} fill="#e4e4e7">ALU</GateText>
        </g>
      );
    case type === 'COUNTER_4BIT':
      const cVal = node.internalState?.counterValue || 0;
      return (
        <g>
          <rect x="0" y="0" width={width} height={height} rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <rect x="20" y="20" width="40" height="60" rx="4" fill="#000" />
          <GateText x={40} y={50} fill="#22d3ee" fontSize="24" fontFamily="monospace">{cVal}</GateText>
        </g>
      );
    case type.startsWith('RAM_') && type !== 'RAM_1BIT':
    case type.startsWith('MEMORY_CELL'): {
        // Find bit counts based on type suffix
        let aBits = 4; let dBits = 4;
        if (type === 'RAM_8BIT') { dBits = 8; }
        else if (type === 'RAM_16BIT') { dBits = 16; }
        else if (type === 'RAM_64_8') { aBits = 6; dBits = 8; }
        else if (type === 'RAM_256_8') { aBits = 8; dBits = 8; }
        else if (type === 'RAM_64BIT') { aBits = 3; dBits = 8; }
        else if (type === 'RAM_128BIT') { aBits = 4; dBits = 8; }
        else if (type === 'RAM_256BIT') { aBits = 5; dBits = 8; }

        let addrVal = 0;
        for(let i=0; i<aBits; i++) { if(node.inputs[i]) addrVal += Math.pow(2, i); }
        const CS = node.inputs[aBits + dBits + 1];
        const mem = node.internalState?.memory || [];
        const currentData = CS ? (mem[addrVal] || 0) : 0;

        return (
            <g>
                <rect x="0" y="0" width={width} height={height} rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                <GateText x={width/2} y={15} fill="#e4e4e7" fontSize="10">{node.type.replace(/_/g, ' ')}</GateText>
                
                {/* Visual Address/Data Monitor */}
                <rect x="15" y="30" width={width - 30} height="40" rx="4" fill="#000" stroke="#3f3f46" strokeWidth="1" />
                <GateText x={width/2} y={42} fontSize="8" fill="#52525b">ADDR: 0x{addrVal.toString(16).toUpperCase()}</GateText>
                <GateText x={width/2} y={58} fontSize="14" fill={CS ? "#22d3ee" : "#27272a"} fontFamily="monospace">
                    {currentData.toString(16).toUpperCase().padStart(dBits > 8 ? 4 : 2, '0')}
                </GateText>

                <GateText x={width/2} y={height - 20} fontSize="8" fill="#52525b">
                    {Math.pow(2, aBits)} WORDS x {dBits} BITS
                </GateText>
            </g>
        );
    }
    default:
        return (
            <g>
                <rect x="0" y="0" width={width} height={height} rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                <GateText x={width/2} y={height/2}>{type.replace(/_/g, ' ')}</GateText>
            </g>
        );
  }
};
