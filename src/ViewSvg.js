import React, { Component } from 'react';
import { measureText } from './measureText';

class ViewSvg extends Component {
  determineNodeX = (node) => {
    if (node.slice) {
      return measureText(this.props.sentence.slice(0, node.slice[0])) +
        (measureText(this.props.sentence.slice(...node.slice)) / 2);
    }
    return 0;
  }

  determineNodeY = (node) => {
    return 190;
  }

  renderNodes = () => this.props.nodes.map(
    node => (
      <text
        x={this.determineNodeX(node)}
        y={this.determineNodeY(node)}
        textAnchor="middle"
      >
        {node.label}
      </text>
    )
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
