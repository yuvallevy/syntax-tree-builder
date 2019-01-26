import React, { Component } from 'react';
import { SENTENCE } from './examples';
import './Editor.css';

class Editor extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sentence: SENTENCE
    };
  }

  onInputChanged = (event) => {
    this.setState({sentence: event.target.value});
  }

  renderInput = () => {
    return (
      <input type="text" value={this.state.sentence} onInput={this.onInputChanged} />
    );
  }

  render() {
    return (
      <div className="Editor">
        {this.renderInput()}
      </div>
    )
  }
}

export default Editor;
