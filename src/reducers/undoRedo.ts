import { omit } from 'lodash';
import { NodeUndoRedoHistoryEntry, SentenceUndoRedoHistoryEntry } from '../undoRedoHistory';
import { EditorState } from './interfaces';

export const applyUndo = (state: EditorState): EditorState => {
  const actionToUndo = state.undoRedoHistory.present;
  let stateToRestore: EditorState;
  if (actionToUndo instanceof NodeUndoRedoHistoryEntry) {
    if (actionToUndo.before) {
      stateToRestore = {
        ...state,
        nodes: {
          ...state.nodes,
          [actionToUndo.nodeId]: actionToUndo.before
        },
      };
    } else {
      stateToRestore = {
        ...state,
        nodes: omit(state.nodes, actionToUndo.nodeId),
        selectedNodes: null,
      };
    }
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
    if (actionToRedo.after) {
      stateToRestore = {
        ...state,
        nodes: {
          ...state.nodes,
          [actionToRedo.nodeId]: actionToRedo.after
        },
      };
    } else {
      stateToRestore = {
        ...state,
        nodes: omit(state.nodes, actionToRedo.nodeId),
        selectedNodes: null,
      };
    }
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
