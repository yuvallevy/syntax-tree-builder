import React, { Component } from 'react';
import './View.css';

class View extends Component {
  onInputChanged = event => {
    this.props.onSentenceChanged(event.target.value);
  }

  onSelectionChanged = event => {
    this.props.onSelectionChanged(event.target.selectionStart, event.target.selectionEnd);
  }
  
  renderInput = () => {
    return (
      <input
        type="text" value={this.props.sentence}
        onInput={this.onInputChanged}
        onSelect={this.onSelectionChanged}
      />
    );
  }

  render() {
    return (
      <div className="View">
        {this.renderInput()}
      </div>
    );
  }
}

export default View;