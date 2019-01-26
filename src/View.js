import React, { Component } from 'react';
import './View.css';

class View extends Component {
  onInputChanged = (event) => {
    this.props.onSentenceChanged(event.target.value);
  }

  renderInput = () => {
    return (
      <input type="text" value={this.props.sentence} onInput={this.onInputChanged} />
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
