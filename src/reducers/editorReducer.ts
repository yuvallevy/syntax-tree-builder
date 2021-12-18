import { SENTENCE, TREE } from '../examples';
import { UndoRedoHistory } from '../undoRedoHistory';
import { EditorAction, EditorState } from './interfaces';
import { moveNodes, resetNodePositions } from './position';
import {
  deleteNodes,
  setNodeLabel,
  toggleAdoptMode,
  toggleDisownMode,
  toggleEditMode,
  toggleTriangle,
} from './editNodes';
import { addNode } from './editNodes';
import { setSentence } from './sentence';
import { selectNode, selectText } from './selection';
import { applyRedo, applyUndo } from './undoRedo';

export const initialState: EditorState = {
  nodes: {},
  sentence: '',
  selectedRange: null,
  selectedNodes: null,
  unselectableNodes: null,
  adoptingNode: null,
  disowningNode: null,
  editingNode: null,
  undoRedoHistory: new UndoRedoHistory(),
};

export const reducer = (state: EditorState, action: EditorAction): EditorState => {
  console.log(action);
  switch (action.type) {
    case 'setSentence': return setSentence(state, action.newSentence);
    case 'selectText': return selectText(state, action.start, action.end);
    case 'selectNode': return selectNode(state, action.nodeIds, action.multi);
    case 'clearSelection': return { ...state, selectedNodes: null, editingNode: null };
    case 'addNode': return addNode(state);
    case 'toggleEditMode': return toggleEditMode(state);
    case 'toggleAdoptMode': return toggleAdoptMode(state);
    case 'toggleDisownMode': return toggleDisownMode(state);
    case 'deleteNodes': return deleteNodes(state);
    case 'toggleTriangle': return toggleTriangle(state, action.newValue);
    case 'setLabel': return setNodeLabel(state, action.newValue);
    case 'moveNodes': return moveNodes(state, action.dx, action.dy);
    case 'resetNodePositions': return resetNodePositions(state);
    case 'undo': return applyUndo(state);
    case 'redo': return applyRedo(state);
    default: return state;
  }
};
