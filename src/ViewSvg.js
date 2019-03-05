import React, { Component } from 'react';
import { measureText } from './measureText';
import { avg } from './utils';

class ViewSvg extends Component {
  state = {
    positionedNodes: null
  };

  computeXBySlice = (start, end) => measureText(this.props.sentence.slice(0, start)) +
    (measureText(this.props.sentence.slice(start, end)) / 2);

  computeXByChildren = (children) => avg(children.map(childId => this.computeNodeX(this.props.nodes[childId])));

  computeNodeX = (node) => node.slice ? this.computeXBySlice(...node.slice) : this.computeXByChildren(node.children);

  computeNodeY = (node) => 190;

  computeNodePositions = () => Object.entries(this.props.nodes).map(([id, node]) => ({
    ...node,
    x: this.computeNodeX(node),
    y: this.computeNodeY(node)
  }));

  renderNodes = () => Object.values(this.state.positionedNodes || {}).map(
    node => (
      <text x={node.x} y={node.y} textAnchor="middle">
        {node.label}
      </text>
    )
  );

  componentDidMount() {
    this.setState({positionedNodes: this.computeNodePositions()});
  }

  render() {
    return (
      <svg width={measureText(this.props.sentence)} height={200}>
        {this.renderNodes()}
      </svg>
    )
  }
}

export default ViewSvg;
