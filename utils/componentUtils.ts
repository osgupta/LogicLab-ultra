import { NODE_DEFINITIONS } from '../constants';
import { NodeData, NodeType } from '../types';

export const VARIABLE_INPUT_GATES: NodeType[] = ['AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR'];

export const getNodeDimensions = (node: NodeData) => {
  const def = NODE_DEFINITIONS[node.type];
  if (!def) return { width: 40, height: 40 };

  if (VARIABLE_INPUT_GATES.includes(node.type)) {
    const count = node.properties?.inputCount || def.inputs;
    // Base height 60. For > 3 inputs, expand height
    const height = Math.max(60, count * 20); 
    return { width: def.width, height };
  }
  return { width: def.width, height: def.height };
};

export const getInputPorts = (node: NodeData): { x: number, y: number, label?: string }[] => {
  const def = NODE_DEFINITIONS[node.type];
  if (!def) return [];

  if (VARIABLE_INPUT_GATES.includes(node.type)) {
    const count = node.properties?.inputCount || def.inputs;
    const { height } = getNodeDimensions(node);
    const ports = [];
    // Distribute ports evenly along the left edge
    const step = height / (count + 1); 
    for (let i = 0; i < count; i++) {
        ports.push({ x: 0, y: (i + 1) * step });
    }
    return ports;
  }
  return def.inputOffsets;
};

export const getOutputPorts = (node: NodeData): { x: number, y: number, label?: string }[] => {
    const def = NODE_DEFINITIONS[node.type];
    if (!def) return [];

    if (VARIABLE_INPUT_GATES.includes(node.type)) {
        const { width, height } = getNodeDimensions(node);
        return [{ x: width, y: height / 2 }];
    }
    return def.outputOffsets;
};
