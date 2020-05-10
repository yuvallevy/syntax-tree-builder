import { NodeId, NodeTree } from '../interfaces';
import { SENTENCE, TREE } from '../examples';
import { without, chain } from 'lodash';
import generateId from '../generateId';

interface EditorState {
  nodes: NodeTree;
  sentence: string;
  selectedRange: [number, number] | null;
  selectedNodes: Set<NodeId> | null;
  adoptingNode: NodeId | null,
  editingNode: NodeId | null;
}

type EditorAction = { type: 'setSentence'; newSentence: string; }
  | { type: 'selectText'; start: number; end: number; }
  | { type: 'selectNode'; nodeIds: NodeId[]; multi: boolean; }
  | { type: 'clearSelection'; }
  | { type: 'addNode'; }
  | { type: 'toggleEditMode'; }
  | { type: 'toggleAdoptMode'; }
  | { type: 'deleteNodes'; }
  | { type: 'toggleTriangle'; newValue: boolean; }
  | { type: 'setLabel'; newValue: string; }
  | { type: 'moveNodes'; dx: number; dy: number; }
  | { type: 'resetNodePositions' };

export const initialState: EditorState = {
  nodes: TREE,
  sentence: SENTENCE,
  selectedRange: null,
  selectedNodes: null,
  adoptingNode: null,
  editingNode: null
};

/**
 * Returns what the definition of a new node should be, taking into account the sentence and selection.
 * Used for some convenient shortcuts, such as trimming spaces within the selection or allowing the user to add a node
 * corresponding to a word without having to select the whole word.
 */
const deriveNodeDefinition = (sentence: string, selectedNodes: Set<NodeId> | null, selectedRange: [number, number] | null) => {
  if (selectedNodes) {
    return {
      children: Array.from(selectedNodes)
    };
  }
  if (selectedRange) {
    // Do some magic to find out what the user actually wants:
    let desiredRange: [number, number];
    // 1. If there is only a cursor, treat the entire word as selected
    if (selectedRange[0] === selectedRange[1]) {
      desiredRange = [
        sentence.substring(0, selectedRange[0]).lastIndexOf(' ') + 1,
        sentence.substring(selectedRange[0]).includes(' ')
          ? sentence.indexOf(' ', selectedRange[0])
          : sentence.length
      ]
    } else {
      // 2. Otherwise, trim whitespace from both ends of the selection
      const originalSelectionText = sentence.substring(...selectedRange);
      const trimStartCount = originalSelectionText.length - originalSelectionText.trimStart().length;
      const trimEndCount = originalSelectionText.length - originalSelectionText.trimEnd().length;
      desiredRange = [
        selectedRange[0] + trimStartCount,
        selectedRange[1] - trimEndCount
      ];
    }
    return {
      slice: desiredRange,
      triangle: sentence.substring(...desiredRange).includes(' ')
    };
  }
  return {};
};

const selectText = (state: EditorState, start: number, end: number): EditorState => ({
  ...state,
  selectedRange: state.sentence ? [start, end] : null,
  selectedNodes: null,
  editingNode: null
});

const selectNode = (state: EditorState, nodeIds: NodeId[], multi: boolean): EditorState => {
  const curSelection: Set<NodeId> | null = state.selectedNodes;
  let newSelection;
  if (multi && curSelection) {
    newSelection = new Set(curSelection);
    for (const nodeId of nodeIds) {
      newSelection.delete(nodeId) || newSelection.add(nodeId);
    }
  } else {
    newSelection = new Set(nodeIds);
  }
  return {
    ...state,
    selectedRange: null,
    selectedNodes: newSelection,
    editingNode: null
  };
};

const addNode = (state: EditorState): EditorState => {
  if (!state.selectedRange && !state.selectedNodes) {
    return state;
  }
  const newNodeId: string = generateId();
  return {
    ...state,
    nodes: {
      ...state.nodes,
      [newNodeId]: {
        id: newNodeId,
        label: '',
        offsetX: 0,
        offsetY: 0,
        ...deriveNodeDefinition(state.sentence, state.selectedNodes, state.selectedRange)
      }
    },
    selectedNodes: new Set([newNodeId]),
    editingNode: newNodeId
  }
};

const toggleEditMode = (state: EditorState): EditorState => {
  if (!state.selectedNodes) {
    return state;
  }
  const newEditingNode = Array.from(state.selectedNodes).pop() || null;
  return {
    ...state,
    editingNode: state.editingNode === newEditingNode ? null : newEditingNode
  };
};

const toggleAdoptMode = (state: EditorState): EditorState => {
  if (!state.adoptingNode) {
    // starting adoption
    if (!state.selectedNodes) {
      return state;
    }
    return {
      ...state,
      selectedNodes: null,
      adoptingNode: Array.from(state.selectedNodes).pop() || null,
      editingNode: null
    };
  } else {
    // finished adoption
    const newNodeDef = deriveNodeDefinition(state.sentence, state.selectedNodes, state.selectedRange);
    if (newNodeDef.children && state.nodes[state.adoptingNode].children) {
      newNodeDef.children = state.nodes[state.adoptingNode].children!.concat(newNodeDef.children)
    }
    return {
      ...state,
      nodes: {
        ...state.nodes,
        [state.adoptingNode]: {
          ...state.nodes[state.adoptingNode],
          ...newNodeDef
        }
      },
      selectedNodes: null,
      adoptingNode: null,
      editingNode: null
    };
  }
};

const deleteNodes = (state: EditorState): EditorState => {
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

const toggleTriangle = (state: EditorState, newValue: boolean): EditorState => {
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

const setLabel = (state: EditorState, newValue: string): EditorState => ({
  ...state,
  nodes: {
    ...state.nodes,
    [state.editingNode as string]: {
      ...state.nodes[state.editingNode as string],
      label: newValue
    }
  }
});

const moveNodes = (state: EditorState, dx: number, dy: number): EditorState => {
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
      }]))
    }
  };
};

const resetNodePositions = (state: EditorState): EditorState => {
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

export const reducer = (state: EditorState, action: EditorAction): EditorState => {
  console.log(action);
  switch (action.type) {
    case 'setSentence': return { ...state, sentence: action.newSentence };
    case 'selectText': return selectText(state, action.start, action.end);
    case 'selectNode': return selectNode(state, action.nodeIds, action.multi);
    case 'clearSelection': return { ...state, selectedNodes: null, editingNode: null };
    case 'addNode': return addNode(state);
    case 'toggleEditMode': return toggleEditMode(state);
    case 'toggleAdoptMode': return toggleAdoptMode(state);
    case 'deleteNodes': return deleteNodes(state);
    case 'toggleTriangle': return toggleTriangle(state, action.newValue);
    case 'setLabel': return setLabel(state, action.newValue);
    case 'moveNodes': return moveNodes(state, action.dx, action.dy);
    case 'resetNodePositions': return resetNodePositions(state);
    default: return state;
  }
};
