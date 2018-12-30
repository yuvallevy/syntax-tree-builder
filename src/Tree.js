import React, { Component } from 'react';
import { measureText } from './measureText';

const SENTENCE = 'Colorless green ideas sleep furiously.';
const TREE = {
  cat: 'S',
  children: [
    {
      cat: 'NP',
      children: [
        {
          cat: 'Adj',
          slice: [0, 9]
        },
        {
          cat: 'NP',
          children: [
            {
              cat: 'Adj',
              slice: [10, 15]
            },
            {
              cat: 'N',
              slice: [16, 21]
            }
          ]
        }
      ]
    },
    {
      cat: 'VP',
      children: [
        {
          cat: 'V',
          slice: [22, 27]
        },
        {
          cat: 'AdvP',
          children: [
            {
              cat: 'Adv',
              slice: [28, 37]
            }
          ]
        }
      ]
    }
  ]
}

const SVG_MARGIN_TOP = 20;
const SVG_MARGIN_BOTTOM = 10;

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
    // If this is a leaf node, just determine its position
    if (tree.slice) {
      return {
        cat: tree.cat,
        xOffset: this.sliceX(sentence, tree.slice[0]) + this.sliceWidth(sentence, tree.slice[0], tree.slice[1]) / 2,
        yOffset: -20
      };
    }

    // Otherwise, determine the children's positions first then use them to determine the current node's position
    const offsetTree = {
      cat: tree.cat,
      children: tree.children.map(child => this.determineOffsets(sentence, child))
    };
    offsetTree.xOffset = offsetTree.children.reduce((sum, child) => sum + child.xOffset, 0) / offsetTree.children.length;
    offsetTree.yOffset = Math.min(...offsetTree.children.map(child => child.yOffset)) - 40;
    return offsetTree;
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
