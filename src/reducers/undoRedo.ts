import { omit } from 'lodash';
import { EditorState } from './interfaces';

export const applyUndo = (state: EditorState): EditorState => {
  const actionToUndo = state.undoRedoHistory.present;
  let stateToRestore: EditorState;
  switch (actionToUndo?.type) {
    case 'editNode':
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
      break;
    case 'editSentence':
      stateToRestore = {
        ...state,
        sentence: actionToUndo.before,
      };
      break;
    default:
      stateToRestore = state;
  };
  return {
    ...stateToRestore,
    undoRedoHistory: state.undoRedoHistory.undo(),
  };
};

export const applyRedo = (state: EditorState): EditorState => {
  const actionToRedo = state.undoRedoHistory.future[0];
  let stateToRestore: EditorState;
  switch (actionToRedo?.type) {
    case 'editNode':
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
      break;
    case 'editSentence':
      stateToRestore = {
        ...state,
        sentence: actionToRedo.after,
      };
      break;
    default:
      stateToRestore = state;
  };
  return {
    ...stateToRestore,
    undoRedoHistory: state.undoRedoHistory.redo(),
  };
};
