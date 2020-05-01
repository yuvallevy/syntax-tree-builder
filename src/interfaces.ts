export type NodeId = string;

export interface NodeData {
  id: NodeId;
  label: string;
  slice?: [number, number];
  triangle?: boolean;
  children?: NodeId[];
  offsetX: number;
  offsetY: number;
}

export interface NodeTree {
  [nodeId: string]: NodeData;  // not using NodeId here because typescript is weird
}

export interface PositionedNodeData extends NodeData {
  x: number;
  y: number;
  naturalX: number;
  naturalY: number;
  sliceXSpan?: [number, number];
}

export interface PositionedNodeTree {
  [nodeId: string]: PositionedNodeData;
}
