import { chain, without } from 'lodash';
import generateId from '../generateId';
import { NodeData } from '../interfaces';
import { NodeUndoRedoHistoryEntry } from '../undoRedoHistory';
import { EditorState } from './interfaces';
import { deriveNodeDefinition } from './smartNodeDef';

export const addNode = (state: EditorState): EditorState => {
  if (!state.selectedRange && !state.selectedNodes) {
    return state;
  }
  const newNodeId: string = generateId();
  const newNode: NodeData = {
    id: newNodeId,
    label: '',
    offsetX: 0,
    offsetY: 0,
    ...deriveNodeDefinition(state.sentence, state.selectedNodes, state.selectedRange)
  };
  const historyEntry = new NodeUndoRedoHistoryEntry(newNodeId, null, newNode);
  return {
    ...state,
    nodes: {
      ...state.nodes,
      [newNodeId]: newNode,
    },
    selectedNodes: new Set([newNodeId]),
    editingNode: newNodeId,
    undoRedoHistory: state.undoRedoHistory.register(historyEntry),
  }
};

export const setNodeLabel = (state: EditorState, newValue: string): EditorState => {
  const editingNode = state.editingNode as string;
  const newNode = {
    ...state.nodes[editingNode],
    label: newValue
  };
  const historyEntry = new NodeUndoRedoHistoryEntry(editingNode, state.nodes[editingNode], newNode);
  return {
    ...state,
    nodes: {
      ...state.nodes,
      [state.editingNode as string]: newNode,
    },
    undoRedoHistory: state.undoRedoHistory.register(historyEntry),
  };
};

export const toggleTriangle = (state: EditorState, newValue: boolean): EditorState => {
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
        triangle: newValue
      }]))
    }
  };
};

export const deleteNodes = (state: EditorState): EditorState => {
  if (!state.selectedNodes) {
    return state;
  }
  const selectedNodes = Array.from(state.selectedNodes);
  return {
    ...state,
    selectedNodes: null,
    nodes: chain(state.nodes)
      .omit(selectedNodes)
      .toPairs()
      .map(([nodeId, node]) => [nodeId, node.children ? ({
        ...node,
        children: without(node.children, ...selectedNodes)
      }) : node])
      .fromPairs().value()
  };
};
