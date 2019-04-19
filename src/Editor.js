import React, { Component } from 'react';
import View from './View';
import Controls from './Controls';
import { SENTENCE } from './examples';
import { generateId } from './utils';
import './Editor.css';

class Editor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nodes: {},
      sentence: SENTENCE,
      selectedRange: null,
      selectedNodes: null
    };
  }

  onSentenceChanged = newSentence => {
    this.setState({sentence: newSentence});
  }

  onTextSelected = (start, end) => {
    this.setState({
      selectedRange: [start, end],
      selectedNodes: null
    });
  }

  onNodeSelected = (nodeId, multi) => {
    const curSelection = this.state.selectedNodes;
    let newSelection;
    if (multi && curSelection) {
      newSelection = new Set(curSelection);
      newSelection.delete(nodeId) || newSelection.add(nodeId);
    } else {
      newSelection = new Set([nodeId]);
    }
    this.setState({
      selectedRange: null,
      selectedNodes: newSelection,
      editingNode: null
    })
  }

  onNodeAdded = () => {
    if (this.state.selectedRange || this.state.selectedNodes) {
      const newNodeId = generateId();
      const nodeDefinition = this.state.selectedRange ? {
        slice: this.state.selectedRange
      } : {
        children: Array.from(this.state.selectedNodes)
      };
      this.setState({
        nodes: {
          ...this.state.nodes,
          [newNodeId]: {
            id: newNodeId,
            label: '',
            ...nodeDefinition
          }
        },
        selectedNodes: new Set([newNodeId]),
        editingNode: newNodeId
      });
    }
  }

  onNodeLabelChanged = (nodeId, newValue) => {
    this.setState({
      nodes: {
        ...this.state.nodes,
        [nodeId]: {
          ...this.state.nodes[nodeId],
          label: newValue
        }
      }
    })
  }

  render() {
    return (
      <div className="Editor">
        <View
          nodes={this.state.nodes}
          sentence={this.state.sentence}
          selectedNodes={this.state.selectedNodes}
          editingNode={this.state.editingNode}
          onSentenceChanged={this.onSentenceChanged}
          onTextSelected={this.onTextSelected}
          onNodeSelected={this.onNodeSelected}
          onNodeLabelChanged={this.onNodeLabelChanged}
        />
        <Controls
          sentence={this.state.sentence}
          onNodeAdded={this.onNodeAdded}
        />
      </div>
    )
  }
}

export default Editor;
