import React, { Component } from 'react';
import ViewSvg from './ViewSvg';
import './View.css';

class View extends Component {
  onInputChanged = event => {
    this.props.onSentenceChanged(event.target.value);
  }

  onTextSelected = event => {
    this.props.onTextSelected(event.target.selectionStart, event.target.selectionEnd);
  }

  renderInput = () => {
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
