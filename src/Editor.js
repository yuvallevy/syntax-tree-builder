import React, { Component } from 'react';
import View from './View';
import Controls from './Controls';
import { SENTENCE } from './examples';
import './Editor.css';

class Editor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nodes: {
        0: {
          label: 'Adj',
          slice: [10, 15]
        },
        1: {
          label: 'N',
          slice: [16, 21]
        },
        2: {
          label: 'NP',
          children: [0, 1]
        }
      },
      sentence: SENTENCE,
      selectedRange: null,
      selectedNodes: null
    };
  }

  onSentenceChanged = newSentence => {
    this.setState({sentence: newSentence});
  }

  onSelectionChanged = (start, end) => {
    this.setState({
      selectedRange: [start, end],
      selectedNodes: null
    });
  }

  onNodeAdded = () => {
    if (this.state.selectedRange) {
      this.setState({
        nodes: [...this.state.nodes, {
          label: 'P',
          slice: this.state.selectedRange
        }]
      });
    }
  }

  render() {
    return (
      <div className="Editor">
        <View
          nodes={this.state.nodes}
          sentence={this.state.sentence}
          onSentenceChanged={this.onSentenceChanged}
          onSelectionChanged={this.onSelectionChanged}
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
