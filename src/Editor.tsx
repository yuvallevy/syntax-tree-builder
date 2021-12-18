import React, { useReducer } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import View from './View';
import Controls from './Controls';
import { NodeId } from './interfaces';
import './Editor.scss';
import { reducer, initialState } from './reducers/editorReducer';

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
  const onToggleDisownMode = () => dispatch({ type: 'toggleDisownMode' });
  const onNodesDeleted = () => dispatch({ type: 'deleteNodes' })
  const onTriangleToggled = (newValue: boolean) => dispatch({ type: 'toggleTriangle', newValue })
  const onNodeLabelChanged = (newValue: string) => dispatch({ type: 'setLabel', newValue });
  const onNodesMoved = (dx: number, dy: number) => dispatch({ type: 'moveNodes', dx, dy });
  const onNodePositionsReset = () => dispatch({ type: 'resetNodePositions' });
  const onUndoClicked = () => dispatch({ type: 'undo' });
  const onRedoClicked = () => dispatch({ type: 'redo' });

  useHotkeys('ctrl+up,f2,enter,delete,backspace,ctrl+z,ctrl+y', (event, handler) => {
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
      case 'ctrl+z':
        if ((event.target as Element).tagName !== 'INPUT') {
          event.preventDefault();
          onUndoClicked();
        }
        break;
      case 'ctrl+y':
        if ((event.target as Element).tagName !== 'INPUT') {
          event.preventDefault();
          onRedoClicked();
        }
        break;
      default:
        // pass
    }
  }, {
    filter: () => true,
    enableOnTags: ['INPUT']
  });

  return (
    <div className="Editor">
      <Controls
        nodes={state.nodes}
        sentence={state.sentence}
        selectedRange={state.selectedRange}
        selectedNodes={state.selectedNodes}
        adoptingNode={state.adoptingNode}
        disowningNode={state.disowningNode}
        undoRedoHistory={state.undoRedoHistory}
        onNodeAdded={onNodeAdded}
        onToggleEditMode={onToggleEditMode}
        onNodesDeleted={onNodesDeleted}
        onTriangleToggled={onTriangleToggled}
        onNodePositionsReset={onNodePositionsReset}
        onToggleAdoptMode={onToggleAdoptMode}
        onToggleDisownMode={onToggleDisownMode}
        onUndoClicked={onUndoClicked}
        onRedoClicked={onRedoClicked}
      />
      <View
        nodes={state.nodes}
        sentence={state.sentence}
        selectedNodes={state.selectedNodes}
        unselectableNodes={state.unselectableNodes}
        editingNode={state.editingNode}
        adoptingNode={state.adoptingNode}
        disowningNode={state.disowningNode}
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
