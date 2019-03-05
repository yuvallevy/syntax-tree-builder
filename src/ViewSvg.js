import React, { Component } from 'react';
import { measureText } from './measureText';
import { avg } from './utils';

class ViewSvg extends Component {
  state = {
    positionedNodes: null
  };

  /**
   * Calculates the X position of a leaf node corresponding to the given sentence slice.
   * @param  {number} start Start position of the slice (inclusive).
   * @param  {number} end   End position of the slice (exclusive).
   * @return {number}       Node's target X position.
   */
  computeXBySlice = (start, end) => measureText(this.props.sentence.slice(0, start)) +
    (measureText(this.props.sentence.slice(start, end)) / 2);

  /**
   * Calculates the X position of a node with the given children.
   * @param  {Array}  children List of children.
   * @return {number}          Node's target X position.
   */
  computeXByChildren = (children) => avg(children.map(childId => this.computeNodeX(this.props.nodes[childId])));

  /**
   * Calculates the X position of the given node.
   * @param  {*}      node Node to position.
   * @return {number}      Node's target X position.
   */
  computeNodeX = (node) => node.slice ? this.computeXBySlice(...node.slice) : this.computeXByChildren(node.children);

  /**
   * Calculates the Y position of a node with the given children.
   * @param  {Array}  children List of children.
   * @return {number}          Node's target Y position.
   */
  computeYByChildren = (children) =>
    Math.min(...children.map(childId => this.computeNodeY(this.props.nodes[childId]))) - 40;

  /**
   * Calculates the Y position of the given node.
   * @param  {*}      node Node to position.
   * @return {number}      Node's target Y position.
   */
  computeNodeY = (node) => node.slice ? 190 : this.computeYByChildren(node.children);

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
