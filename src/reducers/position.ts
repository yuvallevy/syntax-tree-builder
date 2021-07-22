import { EditorState } from './interfaces';

export const moveNodes = (state: EditorState, dx: number, dy: number): EditorState => {
  if (!state.selectedNodes) {
    return state;
  }
  const selectedNodes = Array.from(state.selectedNodes);
  return {
    ...state,
    nodes: {
      ...state.nodes,
      ...Object.fromEntries(selectedNodes.map(nodeId => [nodeId, {
        ...state.nodes[nodeId],
        offsetX: state.nodes[nodeId].offsetX + dx,
        offsetY: state.nodes[nodeId].offsetY + dy
      }])),
    },
  };
};

export const resetNodePositions = (state: EditorState): EditorState => {
  if (!state.selectedNodes) {
    return state;
  }
  const selectedNodes = Array.from(state.selectedNodes);
  return {
    ...state,
    nodes: {
      ...state.nodes,
      ...Object.fromEntries(selectedNodes.map(nodeId => [nodeId, {
        ...state.nodes[nodeId],
        offsetX: 0,
        offsetY: 0
      }]))
    }
  };
};