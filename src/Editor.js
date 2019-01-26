import React, { Component } from 'react';
import View from './View';
import Controls from './Controls';
import { SENTENCE } from './examples';
import './Editor.css';

class Editor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sentence: SENTENCE
    };
  }

  onSentenceChanged = (newSentence) => {
    this.setState({sentence: newSentence});
  }

  render() {
    return (
      <div className="Editor">
        <View sentence={this.state.sentence} onSentenceChanged={this.onSentenceChanged} />
        <Controls />
      </div>
    )
  }
}

export default Editor;
