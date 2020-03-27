import React, { useReducer } from 'react';
import View from './View';
import Controls from './Controls';
import { SENTENCE, TREE } from './examples';
import { generateId } from './utils';
import './Editor.css';

const initialState = {
  nodes: TREE,
  sentence: SENTENCE,
  selectedRange: null,
  selectedNodes: null,
  editingNode: null
};

const reducer = (state, action) => {
  console.log(action);
  switch(action.type) {
    case 'setSentence':
      return { ...state, sentence: action.newSentence };
    case 'selectText':
      return { ...state, selectedRange: [action.start, action.end], selectedNodes: null };
    case 'selectNode':
      const curSelection = state.selectedNodes;
      const { nodeId, multi } = action;
      let newSelection;
      if (multi && curSelection) {
        newSelection = new Set(curSelection);
        newSelection.delete(nodeId) || newSelection.add(nodeId);
      } else {
        newSelection = new Set([nodeId]);
      }
      return {
        ...state,
        selectedRange: null,
        selectedNodes: newSelection,
        editingNode: null
      };
    case 'addNode':
      if (!state.selectedRange && !state.selectedNodes) {
        return state;
      }
      const newNodeId = generateId();
      const nodeDefinition = state.selectedRange ? {
        slice: state.selectedRange
      } : {
        children: Array.from(state.selectedNodes)
      };
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

const Editor = () => {
  const [state, dispatch] = useReducer(reducer, initialState);
  console.log(state);

  const onSentenceChanged = (newSentence) => dispatch({ type: 'setSentence', newSentence });
  const onTextSelected = (start, end) => dispatch({ type: 'selectText', start, end });
  const onNodeSelected = (nodeId, multi) => dispatch({ type: 'selectNode', nodeId, multi });
  const onNodeAdded = () => dispatch({ type: 'addNode' });
  const onNodeLabelChanged = (nodeId, newValue) => dispatch({ type: 'setLabel', nodeId, newValue });

  return (
    <div className="Editor">
      <View
        nodes={state.nodes}
        sentence={state.sentence}
        selectedNodes={state.selectedNodes}
        editingNode={state.editingNode}
        onSentenceChanged={onSentenceChanged}
        onTextSelected={onTextSelected}
        onNodeSelected={onNodeSelected}
        onNodeLabelChanged={onNodeLabelChanged}
      />
      <Controls
        sentence={state.sentence}
        onNodeAdded={onNodeAdded}
      />
    </div>
  )
};

export default Editor;
