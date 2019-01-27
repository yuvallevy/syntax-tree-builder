import React, { Component } from 'react';
import './Controls.css';

class Controls extends Component {
  render() {
    return (
      <div className="Controls">
        <button type="button" onClick={this.props.onNodeAdded}>
          New Node
        </button>
      </div>
    );
  }
}

export default Controls;
