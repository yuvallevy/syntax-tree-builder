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

  renderSvg = (sentence, tree) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={500} height={500}>
      <rect x={this.sliceX(sentence, 22)} y={380} width={this.sliceWidth(sentence, 22, 27)} height={40} fill="lightgreen" />
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
