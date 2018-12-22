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
    if (tree.slice) {
      return {
        cat: tree.cat,
        x: this.sliceX(sentence, tree.slice[0]),
        width: this.sliceWidth(sentence, tree.slice[0], tree.slice[1])
      };
    }
    return {
      cat: tree.cat,
      children: tree.children.map(child => this.determinePositions(sentence, child))
    };
  };

  renderTree = (positionedTree, group = null) => {
    group = group || [];
    if (positionedTree.x !== undefined) {
      return [...group, <text x={positionedTree.x + positionedTree.width / 2} y={380} height={20} style={{textAnchor: 'middle', fontSize: '80%'}}>{positionedTree.cat}</text>];
    }
    return positionedTree.children.map(child => this.renderTree(child, group));
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
