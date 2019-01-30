import React, { Component } from 'react';
import { measureText } from './measureText';

class ViewSvg extends Component {
  renderNodes = () => this.props.nodes.map(
    node => <text x="100" y="100">{node.label}</text>
  );

  render() {
    return (
      <svg width={measureText(this.props.sentence)} height={200}>
        {this.renderNodes()}
      </svg>
    )
  }
}

export default ViewSvg;
