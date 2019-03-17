import React, { Component } from 'react';
import ViewSvg from './ViewSvg';
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
        onChange={this.onInputChanged}
        onSelect={this.onSelectionChanged}
      />
    );
  }

  render() {
    return (
      <div className="View">
        <ViewSvg nodes={this.props.nodes} sentence={this.props.sentence} />
        {this.renderInput()}
      </div>
    );
  }
}

export default View;
