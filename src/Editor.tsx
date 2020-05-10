import React, { useReducer } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
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
  | { type: 'setLabel'; nodeId: NodeId; newValue: string; }
  | { type: 'moveNodes'; dx: number; dy: number; }
  | { type: 'resetNodePositions' };

const initialState: EditorState = {
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

const reducer = (state: EditorState, action: EditorAction): EditorState => {
  console.log(action);
  switch (action.type) {
    case 'setSentence':
      return { ...state, sentence: action.newSentence };
    case 'selectText':
      return {
        ...state,
        selectedRange: state.sentence ? [action.start, action.end] : null,
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
    case 'toggleEditMode':
      if (!state.selectedNodes) {
        return state;
      }
      const newEditingNode = Array.from(state.selectedNodes).pop() || null;
      return {
        ...state,
        editingNode: state.editingNode === newEditingNode ? null : newEditingNode
      };
    case 'toggleAdoptMode':
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
    case 'moveNodes':
      if (!state.selectedNodes) {
        return state;
      }
      const nodesToMove = Array.from(state.selectedNodes);
      return {
        ...state,
        nodes: {
          ...state.nodes,
          ...Object.fromEntries(nodesToMove.map(nodeId => [nodeId, {
            ...state.nodes[nodeId],
            offsetX: state.nodes[nodeId].offsetX + action.dx,
            offsetY: state.nodes[nodeId].offsetY + action.dy
          }]))
        }
      };
    case 'resetNodePositions':
      if (!state.selectedNodes) {
        return state;
      }
      const nodesToResetPos = Array.from(state.selectedNodes);
      return {
        ...state,
        nodes: {
          ...state.nodes,
          ...Object.fromEntries(nodesToResetPos.map(nodeId => [nodeId, {
            ...state.nodes[nodeId],
            offsetX: 0,
            offsetY: 0
          }]))
        }
      };
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
  const onToggleEditMode = () => dispatch({ type: 'toggleEditMode' });
  const onToggleAdoptMode = () => dispatch({ type: 'toggleAdoptMode' });
  const onNodesDeleted = () => dispatch({ type: 'deleteNodes' })
  const onTriangleToggled = (newValue: boolean) => dispatch({ type: 'toggleTriangle', newValue })
  const onNodeLabelChanged = (nodeId: NodeId, newValue: string) => dispatch({ type: 'setLabel', nodeId, newValue });
  const onNodesMoved = (dx: number, dy: number) => dispatch({ type: 'moveNodes', dx, dy });
  const onNodePositionsReset = () => dispatch({ type: 'resetNodePositions' });

  useHotkeys('ctrl+up,f2,enter,delete,backspace', (event, handler) => {
    switch (handler.key) {
      case 'ctrl+up':
        event.preventDefault();
        onNodeAdded();
        break;
      case 'f2':
      case 'enter':
        event.preventDefault();
        onToggleEditMode();
        break;
      case 'delete':
      case 'backspace':
        if ((event.target as Element).tagName !== 'INPUT') {
          event.preventDefault();
          onNodesDeleted();
        }
        break;
      default:
        // pass
    }
  }, {
    filter: () => true
  });

  return (
    <div className="Editor">
      <Controls
        nodes={state.nodes}
        sentence={state.sentence}
        selectedRange={state.selectedRange}
        selectedNodes={state.selectedNodes}
        adoptingNode={state.adoptingNode}
        onNodeAdded={onNodeAdded}
        onToggleEditMode={onToggleEditMode}
        onNodesDeleted={onNodesDeleted}
        onTriangleToggled={onTriangleToggled}
        onNodePositionsReset={onNodePositionsReset}
        onToggleAdoptMode={onToggleAdoptMode}
      />
      <View
        nodes={state.nodes}
        sentence={state.sentence}
        selectedNodes={state.selectedNodes}
        editingNode={state.editingNode}
        adoptingNode={state.adoptingNode}
        onSentenceChanged={onSentenceChanged}
        onTextSelected={onTextSelected}
        onNodesSelected={onNodesSelected}
        onSelectionCleared={onSelectionCleared}
        onToggleEditMode={onToggleEditMode}
        onNodeLabelChanged={onNodeLabelChanged}
        onNodesMoved={onNodesMoved}
      />
    </div>
  )
};

export default Editor;
