import React, { Component } from 'react';
import { measureText } from './measureText';
import { avg } from './utils';
import { flatMap } from 'lodash';
import deepEqual from 'deep-equal';
import { NodeTree, NodeData, NodeId } from './interfaces';
import './ViewSvg.scss';

interface ViewSvgProps {
  nodes: NodeTree;
  sentence: string;
  selectedNodes: Set<NodeId> | null;
  editingNode: NodeId | null;
  onNodeSelected: (nodeId: NodeId, multi: boolean) => void;
  onNodeLabelChanged: (nodeId: NodeId, newValue: string) => void;
}

interface PositionedNodeData extends NodeData {
  x: number;
  y: number;
}

interface PositionedNodeTree {
  [nodeId: string]: PositionedNodeData;
}

interface PositionCache {
  [nodeId: string]: number;
}

interface ViewSvgState {
  positionedNodes: PositionedNodeTree
}

class ViewSvg extends Component<ViewSvgProps, ViewSvgState> {
  state: ViewSvgState = {
    positionedNodes: {}
  };

  xCache: PositionCache = {};
  yCache: PositionCache = {};

  /**
   * Calculates the X position of a leaf node corresponding to the given sentence slice.
   * @param  {number} start Start position of the slice (inclusive).
   * @param  {number} end   End position of the slice (exclusive).
   * @return {number}       Node's target X position.
   */
  computeXBySlice = (start: number, end: number): number => measureText(this.props.sentence.slice(0, start)) +
    (measureText(this.props.sentence.slice(start, end)) / 2);

  /**
   * Calculates the X position of a node with the given children.
   * @param  {NodeId[]} children List of children.
   * @return {number}            Node's target X position.
   */
  computeXByChildren = (children: NodeId[]) => avg(children.map(childId => this.getNodeX(this.props.nodes[childId])));

  /**
   * Calculates the X position of the given node.
   * @param  {NodeData} node Node to position.
   * @return {number}        Node's target X position.
   */
  computeNodeX = (node: NodeData) => node.slice ? this.computeXBySlice(...node.slice)
    : node.children ? this.computeXByChildren(node.children)
      : 0;

  /**
   * Calculates the Y position of a node with the given children.
   * @param  {NodeId[]} children List of children.
   * @return {number}            Node's target Y position.
   */
  computeYByChildren = (children: NodeId[]) =>
    Math.min(...children.map(childId => this.getNodeY(this.props.nodes[childId]))) - 40;

  /**
   * Calculates the Y position of the given node.
   * @param  {NodeData} node Node to position.
   * @return {number}        Node's target Y position.
   */
  computeNodeY = (node: NodeData) => node.slice ? 178
    : node.children ? this.computeYByChildren(node.children)
      : 0;

  /**
   * Returns the X position of the given node and caches the result, or retrieves it if it is already cached.
   * @param  {NodeData} node Node to position.
   * @return {number}        Node's target X position.
   */
  getNodeX = (node: NodeData) => {
    if (!this.xCache[node.id]) {
      this.xCache[node.id] = this.computeNodeX(node);
    }
    return this.xCache[node.id];
  };

  /**
   * Returns the Y position of the given node and caches the result, or retrieves it if it is already cached.
   * @param  {NodeData} node Node to position.
   * @return {number}        Node's target Y position.
   */
  getNodeY = (node: NodeData) => {
    if (!this.yCache[node.id]) {
      this.yCache[node.id] = this.computeNodeY(node);
    }
    return this.yCache[node.id];
  };

  computeNodePositions = (): PositionedNodeTree => {
    this.xCache = {};
    this.yCache = {};
    return Object.entries(this.props.nodes).reduce((positionedNodes, [id, node]) => ({
      ...positionedNodes,
      [id]: {
        ...node,
        x: this.getNodeX(node),
        y: this.getNodeY(node)
      }
    }), {});
  }

  /**
   * Sets a node as selected.
   * @param event Event that triggered the selection.
   */
  selectNode = (event: React.MouseEvent<SVGElement> | React.TouchEvent<SVGElement>) => {
    const { nodeId } = event.currentTarget.dataset;
    if (nodeId) {
      this.props.onNodeSelected(nodeId, event.ctrlKey);
    }
  };
  
  /**
   * Sets a node's label.
   * @param event Event that triggered the update.
   */
  setNodeLabel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { nodeId } = event.currentTarget.dataset;
    if (nodeId) {
      this.props.onNodeLabelChanged(nodeId, event.target.value);
    }
  }

  renderNodes = () => Object.entries(this.state.positionedNodes).map(
    ([nodeId, node]) => (
      <g
        key={nodeId}
        className={this.props.selectedNodes && this.props.selectedNodes.has(nodeId) ? 'node selected' : 'node'}
      >
        <rect
          x={Math.round(node.x - 14)} y={Math.round(node.y)}
          data-node-id={nodeId}
          width={28} height={22}
          onMouseDown={this.selectNode}
          onTouchStart={this.selectNode}
        />
        <text
          x={node.x} y={node.y}
          data-node-id={nodeId}
          onMouseDown={this.selectNode}
          onTouchStart={this.selectNode}
        >
          {node.label}
        </text>
      </g>
    )
  );

  renderEditingNode = (): React.ReactNode => {
    const node: PositionedNodeData | null =
      this.props.editingNode ? this.state.positionedNodes[this.props.editingNode] : null;
    return node && <input
      type="text"
      className="node-edit-box"
      data-node-id={node.id}
      value={node.label}
      style={{
        left: node.x - 16,
        top: node.y,
        width: 32
      }}
      onChange={this.setNodeLabel}
      autoFocus={true}
    />;
  }

  renderLinks = () => flatMap(Object.values(this.state.positionedNodes),
    (node: PositionedNodeData) => node.children ? node.children.map(childId => {
      const child: PositionedNodeData = this.state.positionedNodes[childId];
      return <line
        key={childId}
        className="tree-link"
        x1={node.x}
        y1={node.y + 22}
        x2={child.x}
        y2={child.y}
      />;
    }) : []
  );

  updateNodePositions = (): void => {
    this.setState({positionedNodes: this.computeNodePositions()});
  }

  componentDidMount() {
    this.updateNodePositions();
  }

  componentDidUpdate(prevProps: ViewSvgProps) {
    if (!deepEqual(prevProps.nodes, this.props.nodes)) {
      this.updateNodePositions();
    }
  }

  render() {
    return (
      <div className="ViewSvg">
        <svg width={measureText(this.props.sentence)} height={200}>
          {this.renderNodes()}
          {this.renderLinks()}
        </svg>
        {this.props.editingNode && this.renderEditingNode()}
      </div>
    )
  }
}

export default ViewSvg;
