import { difference, omit } from 'lodash';
import { UndoRedoHistoryEntry } from '../undoRedoHistory';
import { EditorState } from './interfaces';
import { NodeTree, NodeData } from '../interfaces';

export const applyUndo = (state: EditorState): EditorState => {
  const actionToUndo = state.undoRedoHistory.present;
  let stateToRestore: EditorState;
  if (actionToUndo) {
    const nodeIdsToRemove = Object.entries(actionToUndo.changedNodes).filter(([_, change]) => !change.before).map(([nodeId, _]) => nodeId);
    const nodeIdsToKeep = difference(Object.keys(actionToUndo.changedNodes), nodeIdsToRemove);
    const undoneStateNodes: NodeTree = nodeIdsToKeep.reduce((accum, nodeId) => ({
      ...accum,
      [nodeId]: actionToUndo.changedNodes[nodeId].before as NodeData,
    }), {});
    const newSentence = actionToUndo.changedSentence?.before;
    stateToRestore = {
      ...state,
      nodes: {
        ...omit(state.nodes, nodeIdsToRemove),
        ...undoneStateNodes,
      },
      sentence: newSentence || state.sentence,
      selectedNodes: nodeIdsToRemove.length > 0 ? null : state.selectedNodes,
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
  if (actionToRedo) {
    const nodeIdsToRemove = Object.entries(actionToRedo.changedNodes).filter(([_, change]) => !change.after).map(([nodeId, _]) => nodeId);
    const nodeIdsToKeep = difference(Object.keys(actionToRedo.changedNodes), nodeIdsToRemove);
    const redoneStateNodes: NodeTree = nodeIdsToKeep.reduce((accum, nodeId) => ({
      ...accum,
      [nodeId]: actionToRedo.changedNodes[nodeId].after as NodeData,
    }), {});
    const newSentence = actionToRedo.changedSentence?.after;
    stateToRestore = {
      ...state,
      nodes: {
        ...omit(state.nodes, nodeIdsToRemove),
        ...redoneStateNodes,
      },
      sentence: newSentence || state.sentence,
      selectedNodes: nodeIdsToRemove.length > 0 ? null : state.selectedNodes,
    };
  } else {
    stateToRestore = state;
  };
  return {
    ...stateToRestore,
    undoRedoHistory: state.undoRedoHistory.redo(),
  };
};
