import React, { Component } from 'react';
import ViewSvg from './ViewSvg';
import { NodeTree, NodeId } from './interfaces';
import './View.scss';

interface ViewProps {
  nodes: NodeTree;
  sentence: string;
  selectedNodes: Set<NodeId> | null;
  editingNode: NodeId | null;
  onSentenceChanged: (newSentence: string) => void;
  onTextSelected: (start: number, end: number) => void;
  onNodeSelected: (nodeId: NodeId, multi: boolean) => void;
  onNodeLabelChanged: (nodeId: NodeId, newValue: string) => void;
}

class View extends Component<ViewProps, {}> {
  onInputChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.props.onSentenceChanged(event.target.value);
  }

  onTextSelected = (event: React.SyntheticEvent<HTMLInputElement>): void => {
    const { selectionStart, selectionEnd } = event.currentTarget;
    if (selectionStart && selectionEnd) {
      this.props.onTextSelected(selectionStart, selectionEnd);
    }
  }

  renderInput = (): React.ReactNode => {
    return (
      <input
        type="text" value={this.props.sentence}
        onChange={this.onInputChanged}
        onSelect={this.onTextSelected}
      />
    );
  }

  render() {
    return (
      <div className="View">
        <ViewSvg
          nodes={this.props.nodes}
          sentence={this.props.sentence}
          selectedNodes={this.props.selectedNodes}
          editingNode={this.props.editingNode}
          onNodeSelected={this.props.onNodeSelected}
          onNodeLabelChanged={this.props.onNodeLabelChanged}
        />
        {this.renderInput()}
      </div>
    );
  }
}

export default View;
