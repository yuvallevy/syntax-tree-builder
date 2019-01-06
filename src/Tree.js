import React, { Component } from 'react';
import { measureText } from './measureText';
import { SENTENCE, TREE } from './examples';

const SVG_MARGIN_TOP = 20;
const SVG_MARGIN_BOTTOM = 10;
const PART_OF_SPEECH_Y_OFFSET = -20;
const TREE_LEVEL_SPACING = 40;

class Tree extends Component {
  /**
   * Returns the width of the given sentence slice.
   */
  sliceWidth = (sentence, start, end) => measureText(sentence.slice(start, end));

  /**
   * Returns the X position of the given character position in the sentence.
   */
  sliceX = (sentence, start) => this.sliceWidth(sentence, 0, start);

  /**
   * Returns where on the Y axis the sentence should be located in order for the entire tree to be visible.
   */
  getTreeBaseY = (offsetTree) => {
    return -offsetTree.yOffset + SVG_MARGIN_TOP;
  };

  /**
   * Returns an "offset tree": a copy of the given tree for the given sentence, with position offsets indicating where
   * each node should be located relative to the sentence itself.
   * Traverses the entire tree in postorder.
   */
  determineOffsets = (sentence, tree) => {
    // If this node is fertile, determine the children's positions first then derive the current node's desired position
    if (tree.children) {
      const offsetTree = {
        cat: tree.cat,
        children: tree.children.map(child => this.determineOffsets(sentence, child))
      };
      offsetTree.xOffset = offsetTree.children.reduce((sum, child) => sum + child.xOffset, 0) / offsetTree.children.length;
      offsetTree.yOffset = Math.min(...offsetTree.children.map(child => child.yOffset)) - TREE_LEVEL_SPACING;
      return offsetTree;
    }

    // Otherwise (i.e. if this is a leaf node), just determine its position
    return {
      cat: tree.cat,
      xOffset: this.sliceX(sentence, tree.slice[0]) + this.sliceWidth(sentence, tree.slice[0], tree.slice[1]) / 2,
      yOffset: PART_OF_SPEECH_Y_OFFSET
    };
  };

  /**
   * Returns a "positioned tree": a copy of the given offset tree with absolute positions according to the given base.
   * If no base Y is given, it is calculated from the tree's Y offsets.
   * Traverses the entire tree in preorder.
   */
  determineAbsolutePositions = (offsetTree, baseY = null) => {
    baseY = baseY || this.getTreeBaseY(offsetTree);
    if (offsetTree.children) {
      return {
        cat: offsetTree.cat,
        x: offsetTree.xOffset,
        y: offsetTree.yOffset + baseY,
        children: offsetTree.children.map(child => this.determineAbsolutePositions(child, baseY))
      };
    }
    return {
      cat: offsetTree.cat,
      x: offsetTree.xOffset,
      y: offsetTree.yOffset + baseY
    };
  }

  /**
   * Returns an array of JSX elements representing the nodes of the given tree.
   */
  renderTree = (positionedTree, group = null) => {
    group = group || [];
    // TODO: key prop
    group.push(<text x={positionedTree.x} y={positionedTree.y} height={20} style={{textAnchor: 'middle', fontSize: '80%'}}>{positionedTree.cat}</text>);
    if (positionedTree.children) {
      for (const child of positionedTree.children) {
        this.renderTree(child, group);
        group.push(<line x1={positionedTree.x} y1={positionedTree.y + 3} x2={child.x} y2={child.y - 15} stroke="black" strokeLinecap="round" />);
      }
    }
    return group;
  };

  /**
   * Renders the entire tree for the given sentence.
   */
  renderSvg = (sentence, tree) => {
    const offsetTree = this.determineOffsets(sentence, tree);
    const positionedTree = this.determineAbsolutePositions(offsetTree);
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width={this.sliceWidth(sentence)} height={this.getTreeBaseY(offsetTree) + SVG_MARGIN_BOTTOM}>
        {this.renderTree(positionedTree)}
        <text x={0} y={this.getTreeBaseY(offsetTree)}>{sentence}</text>
      </svg>
    )
  };

  render() {
    return (
      <div className="tree">
        {this.renderSvg(SENTENCE, TREE)}
      </div>
    );
  }
}

export default Tree;
