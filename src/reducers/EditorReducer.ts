import { NodeId, NodeTree, NodeData } from '../interfaces';
import { SENTENCE, TREE } from '../examples';
import { flatMap, without, chain, difference, omit } from 'lodash';
import generateId from '../generateId';
import { NodeUndoRedoHistoryEntry, SentenceUndoRedoHistoryEntry, UndoRedoHistory } from '../undoRedoHistory';
import { EditorAction, EditorState } from './interfaces';
import { moveNodes, resetNodePositions } from './position';
import { deleteNodes, setNodeLabel, toggleTriangle } from './editNodes';
import { addNode } from './editNodes';
import { deriveNodeDefinition } from './smartNodeDef';

export const initialState: EditorState = {
  nodes: TREE,  // {},
  sentence: SENTENCE,  // '',
  selectedRange: null,
  selectedNodes: null,
  unselectableNodes: null,
  adoptingNode: null,
  disowningNode: null,
  editingNode: null,
  undoRedoHistory: new UndoRedoHistory(),
};

/**
 * Returns the IDs of all nodes that are descendants of other nodes (i.e. not roots).
 */
const getNodesWithParents = (nodes: NodeTree): NodeId[] =>
  flatMap(Object.values(nodes), (nodeData: NodeData) => nodeData.children || []);

const isChild = (nodes: NodeTree, parentId: NodeId, childId: NodeId): boolean =>
  !!nodes[parentId].children?.includes(childId)

const isDescendant = (nodes: NodeTree, ancestorId: NodeId, descendantId: NodeId): boolean =>
  isChild(nodes, ancestorId, descendantId)
    || !!(nodes[ancestorId].children?.filter(childId => isDescendant(nodes, childId, descendantId)).length);

const getAncestors = (nodes: NodeTree, descendantId: NodeId): NodeId[] =>
  Object.keys(nodes).filter(nodeId => isDescendant(nodes, nodeId, descendantId));

const startAdoption = (state: EditorState): EditorState => {
  if (!state.selectedNodes) {
    return state;
  }
  const adoptingNode = Array.from(state.selectedNodes).pop() || null;
  const nonAdoptableNodes = adoptingNode ?
    new Set(getNodesWithParents(state.nodes).concat(getAncestors(state.nodes, adoptingNode))) : null;
  return {
    ...state,
    selectedNodes: null,
    unselectableNodes: nonAdoptableNodes,
    adoptingNode,
    disowningNode: null,
    editingNode: null
  };
};

const startDisowning = (state: EditorState): EditorState => {
  if (!state.selectedNodes) {
    return state;
  }
  const disowningNode = Array.from(state.selectedNodes).pop() || null;
  const nonDisownableNodes = disowningNode
    ? new Set(difference(Object.keys(state.nodes), state.nodes[disowningNode].children || []))
    : null;
  return {
    ...state,
    selectedNodes: null,
    unselectableNodes: nonDisownableNodes,
    adoptingNode: null,
    disowningNode,
    editingNode: null
  };
};

const stopAdoption = (state: EditorState): EditorState => ({ ...state, unselectableNodes: null, adoptingNode: null });

const stopDisowning = (state: EditorState): EditorState => ({ ...state, unselectableNodes: null, disowningNode: null });

const completeAdoption = (state: EditorState, nodeIds: NodeId[] | null, range: [number, number] | null): EditorState => {
  const adoptingNode = state.adoptingNode as string;
  const newNodeDef = deriveNodeDefinition(state.sentence, nodeIds && new Set(nodeIds), range);
  if (newNodeDef.children && state.nodes[adoptingNode].children) {
    newNodeDef.children = state.nodes[adoptingNode].children!.concat(newNodeDef.children)
  }
  const newNode: NodeData = {
    ...state.nodes[adoptingNode],
    ...newNodeDef
  }
  const historyEntry = new NodeUndoRedoHistoryEntry(adoptingNode, state.nodes[adoptingNode], newNode);
  return {
    ...state,
    nodes: {
      ...state.nodes,
      [adoptingNode]: newNode
    },
    selectedNodes: null,
    unselectableNodes: null,
    adoptingNode: null,
    editingNode: null,
    undoRedoHistory: state.undoRedoHistory.register(historyEntry),
  };
}

const completeDisowning = (state: EditorState, nodeIds: NodeId[] | null): EditorState => {
  const disowningNode = state.disowningNode as string;
  const remainingChildren = nodeIds
    ? state.nodes[disowningNode].children?.filter(childId => !(nodeIds.includes(childId)))
    : state.nodes[disowningNode].children;
  const newNodeDef = deriveNodeDefinition(state.sentence,
    (remainingChildren && remainingChildren.length) ? new Set(remainingChildren) : null, null);
  const newNode: NodeData = {
    ...state.nodes[disowningNode],
    ...newNodeDef
  }
  const historyEntry = new NodeUndoRedoHistoryEntry(disowningNode, state.nodes[disowningNode], newNode);
  return {
    ...state,
    nodes: {
      ...state.nodes,
      [disowningNode]: newNode,
    },
    selectedNodes: null,
    unselectableNodes: null,
    disowningNode: null,
    editingNode: null,
    undoRedoHistory: state.undoRedoHistory.register(historyEntry),
  };
};

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

const setSentence = (state: EditorState, newSentence: string): EditorState => {
  const lengthDiff = newSentence.length - state.sentence.length;
  const cursorPosition = state.selectedRange?.[0];
  const newNodes: NodeTree = cursorPosition !== undefined
    ? Object.entries(state.nodes).reduce((acc, [nodeId, node]) => ({
      ...acc,
      [nodeId]: shiftNodeSlice(node, lengthDiff, cursorPosition)
    }), {})
    : state.nodes;
  const historyEntry = new SentenceUndoRedoHistoryEntry(state.sentence, newSentence);
  return {
    ...state,
    nodes: newNodes,
    sentence: newSentence,
    undoRedoHistory: state.undoRedoHistory.register(historyEntry),
  };
};

const selectText = (state: EditorState, start: number, end: number): EditorState =>
  state.adoptingNode
    ? completeAdoption(state, null, [start, end])
    : state.disowningNode
      ? completeDisowning(state, null)
      : ({
        ...state,
        selectedRange: state.sentence ? [start, end] : null,
        selectedNodes: null,
        editingNode: null
      });

const setNodeSelected = (state: EditorState, nodeIds: NodeId[], multi: boolean): EditorState => {
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
}

const selectNode = (state: EditorState, nodeIds: NodeId[], multi: boolean): EditorState => {
  const selectableNodeIds = nodeIds.filter(nodeId =>
    !(state.unselectableNodes?.has(nodeId) || state.adoptingNode === nodeId || state.disowningNode === nodeId));
  if (selectableNodeIds.length) {
    if (state.adoptingNode) {
      return completeAdoption(state, selectableNodeIds, null);
    }
    if (state.disowningNode) {
      return completeDisowning(state, selectableNodeIds);
    }
    return setNodeSelected(state, selectableNodeIds, multi);
  }
  return state;
}

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

const toggleAdoptMode = (state: EditorState): EditorState =>
  state.adoptingNode ? stopAdoption(state) : startAdoption(state);

const toggleDisownMode = (state: EditorState): EditorState =>
  state.disowningNode ? stopDisowning(state) : startDisowning(state);

const applyUndo = (state: EditorState): EditorState => {
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
}

const applyRedo = (state: EditorState): EditorState => {
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
}

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
