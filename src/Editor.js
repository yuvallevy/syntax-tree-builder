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
      nodes: {
        0: {
          label: 'Adj',
          slice: [0, 9]
        },
        1: {
          label: 'Adj',
          slice: [10, 15]
        },
        2: {
          label: 'N',
          slice: [16, 21]
        },
        3: {
          label: 'V',
          slice: [22, 27]
        },
        4: {
          label: 'Adv',
          slice: [28, 37]
        },
        5: {
          label: 'NP',
          children: [1, 2]
        },
        6: {
          label: 'NP',
          children: [0, 5]
        },
        7: {
          label: 'VP',
          children: [3, 4]
        },
        8: {
          label: 'S',
          children: [6, 7]
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
        nodes: {
          ...this.state.nodes,
          [generateId()]: {
            label: 'P',
            slice: this.state.selectedRange
          }
        }
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
