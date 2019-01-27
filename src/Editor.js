import React, { Component } from 'react';
import View from './View';
import Controls from './Controls';
import { SENTENCE } from './examples';
import './Editor.css';

class Editor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sentence: SENTENCE,
      selectedRange: null
    };
  }

  onSentenceChanged = (newSentence) => {
    this.setState({sentence: newSentence});
  }

  onSelectionChanged = (start, end) => {
    this.setState({selectedRange: [start, end]});
  }

  render() {
    return (
      <div className="Editor">
        <View
          sentence={this.state.sentence}
          onSentenceChanged={this.onSentenceChanged}
          onSelectionChanged={this.onSelectionChanged}
        />
        <Controls
          selectedRange={this.state.selectedRange}
        />
      </div>
    )
  }
}

export default Editor;
