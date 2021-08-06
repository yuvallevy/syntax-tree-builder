import { NodeId } from '../interfaces';
import { completeAdoption, completeDisowning } from './editNodes';
import { EditorState } from './interfaces';

export const selectText = (state: EditorState, start: number, end: number): EditorState =>
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

export const setNodeSelected = (state: EditorState, nodeIds: NodeId[], multi: boolean): EditorState => {
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

export const selectNode = (state: EditorState, nodeIds: NodeId[], multi: boolean): EditorState => {
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