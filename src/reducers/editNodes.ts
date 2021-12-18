import { difference, flatMap, intersection, omit } from 'lodash';
import generateId from '../generateId';
import { NodeData, NodeId, NodeTree } from '../interfaces';
import { NodeUndoRedoHistoryEntry } from '../undoRedoHistory';
import { EditorState } from './interfaces';
import { deriveNodeDefinition } from './smartNodeDef';

/**
 * Returns the IDs of all nodes that are descendants of other nodes (i.e. not roots).
 */
const getNodesWithParents = (nodes: NodeTree): NodeId[] =>
  flatMap(Object.values(nodes), (nodeData: NodeData) => nodeData.children || []);

/**
 * Returns whether the node with ID childId is a child (one level down) of the node with ID parentId.
 */
const isChild = (nodes: NodeTree, parentId: NodeId, childId: NodeId): boolean =>
  !!nodes[parentId].children?.includes(childId);

/**
 * Returns whether the node with ID descendantId is a descendant of the node with ID parentId.
 */
const isDescendant = (nodes: NodeTree, ancestorId: NodeId, descendantId: NodeId): boolean =>
  isChild(nodes, ancestorId, descendantId)
    || !!(nodes[ancestorId].children?.filter(childId => isDescendant(nodes, childId, descendantId)).length);

/**
 * Returns the IDs of all nodes that are ancestors of the node with ID descendantId.
 */
const getAncestors = (nodes: NodeTree, descendantId: NodeId): NodeId[] =>
  Object.keys(nodes).filter(nodeId => isDescendant(nodes, nodeId, descendantId));

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
  const historyEntry = new NodeUndoRedoHistoryEntry({
    [newNodeId]: {
      before: null,
      after: newNode
    }
  });
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
  const historyEntry = new NodeUndoRedoHistoryEntry({ [editingNode]: { before: state.nodes[editingNode], after: newNode } });
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
  const newNodes = Object.fromEntries(selectedNodes.map(nodeId => [nodeId, {
    ...state.nodes[nodeId],
    triangle: newValue,
  }]));
  const historyEntry = new NodeUndoRedoHistoryEntry(Object.fromEntries(selectedNodes.map(nodeId => [nodeId, {
    before: state.nodes[nodeId],
    after: newNodes[nodeId],
  }])));
  return {
    ...state,
    nodes: {
      ...state.nodes,
      ...newNodes,
    },
    undoRedoHistory: state.undoRedoHistory.register(historyEntry),
  };
};

export const deleteNodes = (state: EditorState): EditorState => {
  if (!state.selectedNodes) {
    return state;
  }
  const selectedNodes = Array.from(state.selectedNodes);
  const newParentNodes = Object.entries(state.nodes)
    // find the nodes that need to change (because they were parents of the deleted nodes)
    .filter(([_, node]) => node.children && intersection(node.children, selectedNodes).length)
    // update the children
    .map(([nodeId, node]) => [nodeId, { ...node, children: difference(node.children, selectedNodes) }] as [NodeId, NodeData])
    // convert back into an object
    .reduce((accum, [nodeId, node]) => ({ ...accum, [nodeId]: node }), {}) as NodeTree;
  const historyEntry = new NodeUndoRedoHistoryEntry(selectedNodes.reduce((accum, nodeId) => ({
    ...accum,
    [nodeId]: { before: state.nodes[nodeId], after: null },
  }), Object.entries(newParentNodes).reduce((accum, [nodeId, node]) => ({
    ...accum,
    [nodeId]: { before: state.nodes[nodeId], after: node }
  }), {})));
  return {
    ...state,
    selectedNodes: null,
    nodes: {
      ...omit(state.nodes, selectedNodes),
      ...newParentNodes,
    },
    undoRedoHistory: state.undoRedoHistory.register(historyEntry),
  };
};

export const startAdoption = (state: EditorState): EditorState => {
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

export const startDisowning = (state: EditorState): EditorState => {
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

export const stopAdoption = (state: EditorState): EditorState => ({ ...state, unselectableNodes: null, adoptingNode: null });

export const stopDisowning = (state: EditorState): EditorState => ({ ...state, unselectableNodes: null, disowningNode: null });

export const completeAdoption = (state: EditorState, nodeIds: NodeId[] | null, range: [number, number] | null): EditorState => {
  const adoptingNode = state.adoptingNode as string;
  const newNodeDef = deriveNodeDefinition(state.sentence, nodeIds && new Set(nodeIds), range);
  if (newNodeDef.children && state.nodes[adoptingNode].children) {
    newNodeDef.children = state.nodes[adoptingNode].children!.concat(newNodeDef.children)
  }
  const newNode: NodeData = {
    ...state.nodes[adoptingNode],
    ...newNodeDef
  }
  const historyEntry = new NodeUndoRedoHistoryEntry({
    [adoptingNode]: {
      before: state.nodes[adoptingNode],
      after: newNode
    }
  });
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

export const completeDisowning = (state: EditorState, nodeIds: NodeId[] | null): EditorState => {
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
  const historyEntry = new NodeUndoRedoHistoryEntry({
    [disowningNode]: {
      before: state.nodes[disowningNode],
      after: newNode
    }
  });
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

export const toggleEditMode = (state: EditorState): EditorState => {
  if (!state.selectedNodes) {
    return state;
  }
  const newEditingNode = Array.from(state.selectedNodes).pop() || null;
  return {
    ...state,
    editingNode: state.editingNode === newEditingNode ? null : newEditingNode
  };
};

export const toggleAdoptMode = (state: EditorState): EditorState =>
  state.adoptingNode ? stopAdoption(state) : startAdoption(state);

export const toggleDisownMode = (state: EditorState): EditorState =>
  state.disowningNode ? stopDisowning(state) : startDisowning(state);
