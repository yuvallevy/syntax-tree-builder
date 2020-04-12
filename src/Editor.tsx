import React, { useReducer } from 'react';
import View from './View';
import Controls from './Controls';
import { NodeId, NodeTree } from './interfaces';
import { SENTENCE, TREE } from './examples';
import { without, chain } from 'lodash';
import generateId from './generateId';
import './Editor.scss';

interface EditorState {
  nodes: NodeTree;
  sentence: string;
  selectedRange: [number, number] | null;
  selectedNodes: Set<NodeId> | null;
  editingNode: NodeId | null;
}

type EditorAction = { type: 'setSentence'; newSentence: string; }
  | { type: 'selectText'; start: number; end: number; }
  | { type: 'selectNode'; nodeIds: NodeId[]; multi: boolean; }
  | { type: 'clearSelection'; }
  | { type: 'addNode'; }
  | { type: 'editNode'; }
  | { type: 'deleteNodes'; }
  | { type: 'toggleTriangle'; newValue: boolean; }
  | { type: 'setLabel'; nodeId: NodeId; newValue: string; };

const initialState: EditorState = {
  nodes: TREE,
  sentence: SENTENCE,
  selectedRange: null,
  selectedNodes: null,
  editingNode: null
};

const reducer = (state: EditorState, action: EditorAction): EditorState => {
  console.log(action);
  switch (action.type) {
    case 'setSentence':
      return { ...state, sentence: action.newSentence };
    case 'selectText':
      return {
        ...state,
        selectedRange: [action.start, action.end],
        selectedNodes: null,
        editingNode: null
      };
    case 'selectNode':
      const curSelection: Set<NodeId> | null = state.selectedNodes;
      const { nodeIds, multi } = action;
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
    case 'clearSelection':
      return { ...state, selectedNodes: null, editingNode: null };
    case 'addNode':
      if (!state.selectedRange && !state.selectedNodes) {
        return state;
      }
      const newNodeId: string = generateId();
      const nodeDefinition = state.selectedRange ? {
        slice: state.selectedRange
      } : state.selectedNodes ? {
        children: Array.from(state.selectedNodes)
      }: {};
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [newNodeId]: {
            id: newNodeId,
            label: '',
            ...nodeDefinition
          }
        },
        selectedNodes: new Set([newNodeId]),
        editingNode: newNodeId
      }
    case 'editNode':
      if (!state.selectedNodes) {
        return state;
      }
      return {
        ...state,
        editingNode: Array.from(state.selectedNodes).pop() || null
      }
    case 'deleteNodes':
      if (!state.selectedNodes) {
        return state;
      }
      const nodesToDelete = Array.from(state.selectedNodes);
      return {
        ...state,
        selectedNodes: null,
        nodes: chain(state.nodes)
          .omit(nodesToDelete)
          .toPairs()
          .map(([nodeId, node]) => [nodeId, node.children ? ({
            ...node,
            children: without(node.children, ...nodesToDelete)
          }) : node])
          .fromPairs().value()
      }
    case 'toggleTriangle':
      if (!state.selectedNodes) {
        return state;
      }
      const nodesToToggleTriangle = Array.from(state.selectedNodes);
      return {
        ...state,
        nodes: {
          ...state.nodes,
          ...Object.fromEntries(nodesToToggleTriangle.map(nodeId => [nodeId, {
            ...state.nodes[nodeId],
            triangle: action.newValue
          }]))
        }
      }
    case 'setLabel':
      return {
        ...state,
        nodes: {
          ...state.nodes,
          [action.nodeId]: {
            ...state.nodes[action.nodeId],
            label: action.newValue
          }
        }
      }
    default:
      return state;
  }
};

const Editor: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  console.log(state);

  const onSentenceChanged = (newSentence: string) => dispatch({ type: 'setSentence', newSentence });
  const onTextSelected = (start: number, end: number) => dispatch({ type: 'selectText', start, end });
  const onNodesSelected = (nodeIds: NodeId[], multi: boolean) => dispatch({ type: 'selectNode', nodeIds, multi });
  const onSelectionCleared = () => dispatch({ type: 'clearSelection' });
  const onNodeAdded = () => dispatch({ type: 'addNode' });
  const onEnterEditMode = () => dispatch({ type: 'editNode' });
  const onNodesDeleted = () => dispatch({ type: 'deleteNodes' })
  const onTriangleToggled = (newValue: boolean) => dispatch({ type: 'toggleTriangle', newValue })
  const onNodeLabelChanged = (nodeId: NodeId, newValue: string) => dispatch({ type: 'setLabel', nodeId, newValue });

  return (
    <div className="Editor">
      <View
        nodes={state.nodes}
        sentence={state.sentence}
        selectedNodes={state.selectedNodes}
        editingNode={state.editingNode}
        onSentenceChanged={onSentenceChanged}
        onTextSelected={onTextSelected}
        onNodesSelected={onNodesSelected}
        onSelectionCleared={onSelectionCleared}
        onNodeLabelChanged={onNodeLabelChanged}
      />
      <Controls
        nodes={state.nodes}
        sentence={state.sentence}
        selectedNodes={state.selectedNodes}
        onNodeAdded={onNodeAdded}
        onEnterEditMode={onEnterEditMode}
        onNodesDeleted={onNodesDeleted}
        onTriangleToggled={onTriangleToggled}
      />
    </div>
  )
};

export default Editor;
