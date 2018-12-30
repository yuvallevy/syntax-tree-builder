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

class Tree extends Component {
  sliceWidth = (sentence, start, end) => measureText(sentence.slice(start, end));

  sliceX = (sentence, start) => this.sliceWidth(sentence, 0, start);

  determinePositions = (sentence, tree) => {
    // If this is a leaf node, just determine its position
    if (tree.slice) {
      return {
        cat: tree.cat,
        x: this.sliceX(sentence, tree.slice[0]) + this.sliceWidth(sentence, tree.slice[0], tree.slice[1]) / 2
      };
    }

    // Otherwise, determine the children's positions first then use them to determine the current node's position
    const positionedTree = {
      cat: tree.cat,
      children: tree.children.map(child => this.determinePositions(sentence, child))
    };
    positionedTree.x =
      positionedTree.children.reduce((sum, child) => sum + child.x, 0) / positionedTree.children.length;
    return positionedTree;
  };

  renderTree = (positionedTree, group = null) => {
    group = group || [];
    group.push(<text x={positionedTree.x} y={380} height={20} style={{textAnchor: 'middle', fontSize: '80%'}}>{positionedTree.cat}</text>);
    if (positionedTree.children) {
      for (const child of positionedTree.children) {
        this.renderTree(child, group);
      }
    }
    return group;
  }

  renderSvg = (sentence, tree) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={500} height={500}>
      {this.renderTree(this.determinePositions(sentence, tree))}
      <text x={0} y={400}>{sentence}</text>
    </svg>
  )

  render() {
    return (
      <div className="tree">
        {this.renderSvg(SENTENCE, TREE)}
      </div>
    );
  }
}

export default Tree;
