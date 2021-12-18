import { NodeData, NodeTree } from '../interfaces';
import { UndoRedoHistoryEntry } from '../undoRedoHistory';
import { EditorState } from './interfaces';

/**
 * Shifts the slice of a node, if present, to accommodate new characters inserted at a particular position.
 */
const shiftNodeSlice = (node: NodeData, insertedCount: number, insertedAt: number): NodeData => {
  if (node.slice) {
    const newNodeSlice: [number, number] = [
      node.slice[0] > insertedAt ? node.slice[0] + insertedCount : node.slice[0],
      node.slice[1] >= insertedAt ? node.slice[1] + insertedCount : node.slice[1]
    ];
    return {
      ...node,
      slice: newNodeSlice[1] > newNodeSlice[0] ? newNodeSlice : undefined
    };
  }
  return node;
};

export const setSentence = (state: EditorState, newSentence: string): EditorState => {
  const lengthDiff = newSentence.length - state.sentence.length;
  const cursorPosition = state.selectedRange?.[0];
  
  const newNodes: NodeTree = cursorPosition !== undefined
    ? Object.entries(state.nodes).reduce((acc, [nodeId, node]) => ({
      ...acc,
      [nodeId]: shiftNodeSlice(node, lengthDiff, cursorPosition)
    }), {})
    : state.nodes;
  const nodeChanges = cursorPosition !== undefined
    ? Object.entries(newNodes).reduce((acc, [nodeId, newNode]) => ({
      ...acc,
      ...(newNode.slice ? {
        [nodeId]: {
          before: state.nodes[nodeId],
          after: newNode,
        },
      } : {})
    }), {})
    : {};

  const sentenceChanges = {
    before: state.sentence,
    after: newSentence
  };

  const historyEntry = new UndoRedoHistoryEntry(nodeChanges, sentenceChanges);
  return {
    ...state,
    nodes: newNodes,
    sentence: newSentence,
    undoRedoHistory: state.undoRedoHistory.register(historyEntry),
  };
};
