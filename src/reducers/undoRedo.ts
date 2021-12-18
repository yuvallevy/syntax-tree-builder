import { difference, omit } from 'lodash';
import { NodeUndoRedoHistoryEntry, SentenceUndoRedoHistoryEntry } from '../undoRedoHistory';
import { EditorState } from './interfaces';
import { NodeTree, NodeData } from '../interfaces';

export const applyUndo = (state: EditorState): EditorState => {
  const actionToUndo = state.undoRedoHistory.present;
  let stateToRestore: EditorState;
  if (actionToUndo instanceof NodeUndoRedoHistoryEntry) {
    const nodeIdsToRemove = Object.entries(actionToUndo.changedNodes).filter(([_, change]) => !change.before).map(([nodeId, _]) => nodeId);
    const nodeIdsToKeep = difference(Object.keys(actionToUndo.changedNodes), nodeIdsToRemove);
    const undoneStateNodes: NodeTree = nodeIdsToKeep.reduce((accum, nodeId) => ({
      ...accum,
      [nodeId]: actionToUndo.changedNodes[nodeId].before as NodeData,
    }), {});
    stateToRestore = {
      ...state,
      nodes: {
        ...omit(state.nodes, nodeIdsToRemove),
        ...undoneStateNodes,
      },
      selectedNodes: nodeIdsToRemove.length > 0 ? null : state.selectedNodes,
    };
  } else if (actionToUndo instanceof SentenceUndoRedoHistoryEntry) {
    stateToRestore = {
      ...state,
      sentence: actionToUndo.before || '',
    };
  } else {
    stateToRestore = state;
  }
  return {
    ...stateToRestore,
    undoRedoHistory: state.undoRedoHistory.undo(),
  };
};

export const applyRedo = (state: EditorState): EditorState => {
  const actionToRedo = state.undoRedoHistory.future[0];
  let stateToRestore: EditorState;
  if (actionToRedo instanceof NodeUndoRedoHistoryEntry) {
    const nodeIdsToRemove = Object.entries(actionToRedo.changedNodes).filter(([_, change]) => !change.after).map(([nodeId, _]) => nodeId);
    const nodeIdsToKeep = difference(Object.keys(actionToRedo.changedNodes), nodeIdsToRemove);
    const redoneStateNodes: NodeTree = nodeIdsToKeep.reduce((accum, nodeId) => ({
      ...accum,
      [nodeId]: actionToRedo.changedNodes[nodeId].after as NodeData,
    }), {});
    stateToRestore = {
      ...state,
      nodes: {
        ...omit(state.nodes, nodeIdsToRemove),
        ...redoneStateNodes,
      },
    };
  } else if (actionToRedo instanceof SentenceUndoRedoHistoryEntry) {
    stateToRestore = {
      ...state,
      sentence: actionToRedo.after,
    };
  } else {
    stateToRestore = state;
  };
  return {
    ...stateToRestore,
    undoRedoHistory: state.undoRedoHistory.redo(),
  };
};
