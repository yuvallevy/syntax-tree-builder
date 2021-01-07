import { NodeId, NodeTree, NodeData } from '../interfaces';
import { SENTENCE, TREE } from '../examples';
import { flatMap, without, chain, difference } from 'lodash';
import generateId from '../generateId';

interface EditorState {
  nodes: NodeTree;
  sentence: string;
  selectedRange: [number, number] | null;
  selectedNodes: Set<NodeId> | null;
  unselectableNodes: Set<NodeId> | null;
  adoptingNode: NodeId | null,
  disowningNode: NodeId | null,
  editingNode: NodeId | null;
}

type EditorAction = { type: 'setSentence'; newSentence: string; }
  | { type: 'selectText'; start: number; end: number; }
  | { type: 'selectNode'; nodeIds: NodeId[]; multi: boolean; }
  | { type: 'clearSelection'; }
  | { type: 'addNode'; }
  | { type: 'toggleEditMode'; }
  | { type: 'toggleAdoptMode'; }
  | { type: 'toggleDisownMode'; }
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
  unselectableNodes: null,
  adoptingNode: null,
  disowningNode: null,
  editingNode: null
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

/**
 * Returns what the definition of a new node should be, taking into account the sentence and selection.
 * Used for some convenient shortcuts, such as trimming spaces within the selection or allowing the user to add a node
 * corresponding to a word without having to select the whole word.
 */
const deriveNodeDefinition = (sentence: string, selectedNodes: Set<NodeId> | null, selectedRange: [number, number] | null) => {
  if (selectedNodes) {
    return {
      children: Array.from(selectedNodes),
      slice: undefined
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
      triangle: sentence.substring(...desiredRange).includes(' '),
      children: undefined
    };
  }
  return {
    slice: undefined,
    children: undefined
  };
};

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
  return {
    ...state,
    nodes: {
      ...state.nodes,
      [adoptingNode]: {
        ...state.nodes[adoptingNode],
        ...newNodeDef
      }
    },
    selectedNodes: null,
    unselectableNodes: null,
    adoptingNode: null,
    editingNode: null
  };
}

const completeDisowning = (state: EditorState, nodeIds: NodeId[] | null): EditorState => {
  const disowningNode = state.disowningNode as string;
  const remainingChildren = nodeIds
    ? state.nodes[disowningNode].children?.filter(childId => !(nodeIds.includes(childId)))
    : state.nodes[disowningNode].children;
  const newNodeDef = deriveNodeDefinition(state.sentence,
    (remainingChildren && remainingChildren.length) ? new Set(remainingChildren) : null, null);
  return {
    ...state,
    nodes: {
      ...state.nodes,
      [disowningNode]: {
        ...state.nodes[disowningNode],
        ...newNodeDef
      }
    },
    selectedNodes: null,
    unselectableNodes: null,
    disowningNode: null,
    editingNode: null
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
  return {
    ...state,
    nodes: newNodes,
    sentence: newSentence
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
    !(state.unselectableNodes?.has(nodeId) || state.adoptingNode == nodeId || state.disowningNode == nodeId));
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

const toggleAdoptMode = (state: EditorState): EditorState =>
  state.adoptingNode ? stopAdoption(state) : startAdoption(state);

const toggleDisownMode = (state: EditorState): EditorState =>
  state.disowningNode ? stopDisowning(state) : startDisowning(state);

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
    case 'setLabel': return setLabel(state, action.newValue);
    case 'moveNodes': return moveNodes(state, action.dx, action.dy);
    case 'resetNodePositions': return resetNodePositions(state);
    default: return state;
  }
};
