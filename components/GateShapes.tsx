
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

  const renderHexDisplay = (val: number, bits: number) => (
    <g transform={`translate(${width/2 - 20}, ${height/2 - 10})`}>
        <rect width="40" height="20" rx="3" fill="#000" stroke="#3f3f46" strokeWidth="1" />
        <text x="20" y="11" textAnchor="middle" dominantBaseline="middle" fill="#22d3ee" fontSize="11" fontFamily="monospace">
            {val.toString(16).toUpperCase().padStart(Math.ceil(bits/4), '0')}
        </text>
    </g>
  );

  const renderBinaryFooter = (bitCount: number, values: boolean[]) => {
      const bitWidth = 8; const bitSpacing = 2; const nibbleGap = 6;
      const totalWidth = bitCount * bitWidth + (bitCount - 1) * bitSpacing + Math.floor((bitCount - 1) / 4) * nibbleGap;
      const startX = (width - totalWidth) / 2 + bitWidth / 2;
      return (
        <g transform={`translate(0, ${height - 40})`}>
            <rect x="10" y="0" width={width - 20} height="28" rx="6" fill="#000" stroke="#3f3f46" />
            {Array.from({length: bitCount}).map((_, i) => {
                const bitIndex = bitCount - 1 - i; const bitVal = values[bitIndex]; const nibblesBefore = Math.floor(i / 4);
                const xPos = startX + i * (bitWidth + bitSpacing) + nibblesBefore * nibbleGap;
                return (
                    <text key={bitIndex} x={xPos} y="14" textAnchor="middle" dominantBaseline="middle" fill={bitVal ? "#22d3ee" : "#27272a"} fontSize="11" fontFamily="monospace" fontWeight="black">
                        {bitVal ? "1" : "0"}
                    </text>
                );
            })}
            <text x={width/2} y="38" textAnchor="middle" fill="#3f3f46" fontSize="8" fontWeight="bold" uppercase tracking-widest>Terminal View</text>
        </g>
      );
  };

  switch (true) {
    case type === 'AND' || type === 'NAND' || type === 'OR' || type === 'NOR' || type === 'XOR' || type === 'XNOR': {
        const isNot = ['NAND', 'NOR', 'XNOR'].includes(type);
        return (
            <g>
                <rect x="0" y="0" width={width} height={height} rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                <GateText x={width/2} y={height/2} fill={strokeColor} fontSize="14">{type}</GateText>
                {isNot && <circle cx={width + 5} cy={height/2} r="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />}
            </g>
        );
    }
    case type === 'NOT': return (
        <g>
          <path d={`M 0 0 L ${width-10} ${height/2} L 0 ${height} Z`} fill={fillColor} stroke={strokeColor} strokeWidth="2" />
          <circle cx={width-5} cy={height/2} r="5" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
        </g>
      );
    case type === 'VCC': return (
            <g>
                <rect width="30" height="30" rx="2" fill={fillColor} stroke="#22d3ee" strokeWidth="2" />
                <GateText x={15} y={15} fill="#22d3ee" fontSize="11">VCC</GateText>
            </g>
        );
    case type === 'GND': return (
            <g>
                <rect width="30" height="30" rx="2" fill={fillColor} stroke="#52525b" strokeWidth="2" />
                <GateText x={15} y={15} fill="#71717a" fontSize="11">GND</GateText>
            </g>
        );
    case type === 'JUNCTION': return <circle cx="5" cy="5" r="5" fill={active ? "#22d3ee" : "#71717a"} />;
    case type === 'TOGGLE_SWITCH': return (
        <g>
          <rect width="40" height="40" rx="4" fill={activeFill} stroke={strokeColor} strokeWidth="2" />
          <text x="20" y="25" textAnchor="middle" fill={active ? "#fff" : "#a1a1aa"} fontSize="12" fontWeight="bold">{active ? "1" : "0"}</text>
        </g>
      );
    case type === 'RGB_LED': {
        const r = node.inputs[0], g = node.inputs[1], b = node.inputs[2];
        const color = `rgb(${r?255:0},${g?255:0},${b?255:0})`;
        return (
            <g>
                <circle cx="30" cy="30" r="25" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
                <circle cx="30" cy="30" r="18" fill={color} style={{ filter: (r||g||b) ? `drop-shadow(0 0 8px ${color})` : 'none' }} />
            </g>
        );
    }
    case type === 'LED': return (
        <g>
          <circle cx="20" cy="20" r="15" fill={node.inputs[0] ? "#ef4444" : "#27272a"} stroke={node.inputs[0] ? "#f87171" : "#52525b"} strokeWidth="2" style={{ filter: node.inputs[0] ? 'drop-shadow(0 0 8px #ef4444)' : 'none'}} />
        </g>
      );
    case type.startsWith('INPUT_'):
        const inBits = node.outputs.length;
        return (
            <g>
                <rect width={width} height={height} rx="8" fill="#18181b" stroke="#52525b" strokeWidth="2" />
                <GateText x={width/2} y={22} fill="#e4e4e7" fontSize="12">{`BUS IN ${inBits}b (${boolsToHex(node.outputs)})`}</GateText>
                {node.outputs.map((state, i) => (
                   <g key={i} transform={`translate(12, ${MB_START_Y + (i * MB_SPACING)})`}>
                       <rect x="0" y="2" width={width - 32} height={MB_SPACING - 4} rx="6" fill="#27272a" stroke="none" />
                       <g transform={`translate(8, ${(MB_SPACING - 16)/2})`}>
                           <rect x="0" y="0" width="28" height="14" rx="4" fill={state ? "#0ea5e9" : "#3f3f46"} stroke={state ? "#22d3ee" : "#52525b"} />
                           <circle cx={state ? 21 : 7} cy={7} r="5" fill="white" className="transition-all duration-200" />
                       </g>
                       <text x={width - 50} y={MB_SPACING/2} textAnchor="end" dominantBaseline="middle" fill={state ? "#e4e4e7" : "#71717a"} fontSize="11" fontFamily="monospace" fontWeight="black">{i.toString().padStart(2, '0')}</text>
                   </g>
                ))}
                {renderBinaryFooter(inBits, node.outputs)}
            </g>
        );
    case type.startsWith('OUTPUT_'):
        const outBits = node.inputs.length;
        return (
            <g>
                <rect width={width} height={height} rx="8" fill="#09090b" stroke="#52525b" strokeWidth="2" />
                <GateText x={width/2} y={22} fill="#e4e4e7" fontSize="12">{`BUS OUT ${outBits}b (${boolsToHex(node.inputs)})`}</GateText>
                {node.inputs.map((state, i) => (
                    <g key={i} transform={`translate(12, ${MB_START_Y + (i * MB_SPACING)})`}>
                         <rect x="0" y="2" width={width - 32} height={MB_SPACING - 4} rx="6" fill="#18181b" stroke="none" />
                         <circle cx="16" cy={MB_SPACING/2} r="6" fill={state ? "#ef4444" : "#27272a"} stroke={state ? "#f87171" : "#3f3f46"} style={{ filter: state ? 'drop-shadow(0 0 4px #ef4444)' : 'none' }} />
                         <text x="35" y={MB_SPACING/2} dominantBaseline="middle" fill={state ? "#e4e4e7" : "#71717a"} fontSize="11" fontFamily="monospace" fontWeight="black">{i.toString().padStart(2, '0')}</text>
                    </g>
                ))}
                 {renderBinaryFooter(outBits, node.inputs)}
            </g>
        );
    case type.startsWith('MULTIPLIER_') || type.startsWith('DIVIDER_'): {
        const valA = bitsToInt(node.inputs.slice(0, node.inputs.length/2));
        const valB = bitsToInt(node.inputs.slice(node.inputs.length/2));
        return (
            <g>
                <rect width={width} height={height} rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                <GateText x={width/2} y={15} fill="#e4e4e7">{type.replace('_', ' ')}</GateText>
                {renderHexDisplay(valA, node.inputs.length/2)}
                <GateText x={width/2} y={height-15} fill="#52525b" fontSize="8">{boolsToHex(node.outputs)}</GateText>
            </g>
        );
    }
    case type.startsWith('REG_') || type.startsWith('COUNTER_'): {
        const val = bitsToInt(node.outputs);
        return (
            <g>
                <rect width={width} height={height} rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                <GateText x={width/2} y={15} fill="#e4e4e7">{type.split('_')[0]}</GateText>
                {renderHexDisplay(val, node.outputs.length)}
            </g>
        );
    }
    case type.startsWith('BINARY_MONITOR_'): {
        const bitCount = type.includes('8BIT') ? 8 : 4;
        return (
            <g>
                <rect width={width} height={height} rx="6" fill="#09090b" stroke="#3f3f46" strokeWidth="2" />
                {Array.from({length: bitCount}).map((_, i) => (
                    <circle key={i} cx={15 + i * (width-30)/(bitCount-1)} cy={22} r="6" fill={node.inputs[i] ? "#22d3ee" : "#27272a"} />
                ))}
            </g>
        );
    }
    default:
        return (
            <g>
                <rect width={width} height={height} rx="4" fill={fillColor} stroke={strokeColor} strokeWidth="2" />
                <GateText x={width/2} y={height/2} fill="#e4e4e7">{type.replace(/_/g, ' ')}</GateText>
            </g>
        );
  }
};

const bitsToInt = (bits: boolean[]) => bits.reduce((acc, b, i) => acc + (b ? Math.pow(2, i) : 0), 0);
