import { computeNodePositions, computeTreeWidth, computeTreeHeight } from '../positioning';
import { NodeTree, PositionedNodeTree } from '../interfaces';

jest.mock('../measureText');

const sentence = 'Colorless green ideas sleep furiously.';

const nodeTree: NodeTree = {
  'KNICuEVF|knF': { id: 'KNICuEVF|knF', label: 'Adj', slice: [0, 9], triangle: false, offsetX: 0, offsetY: 0 },
  'M}E@bxcClTOC': { id: 'M}E@bxcClTOC', label: 'Adj', slice: [10, 15], triangle: false, offsetX: 0, offsetY: 0 },
  'qNC_Mmj}dExD': { id: 'qNC_Mmj}dExD', label: 'N', slice: [16, 21], triangle: false, offsetX: 0, offsetY: 0 },
  'h@a@YTJjySzv': { id: 'h@a@YTJjySzv', label: 'V', slice: [22, 27], triangle: false, offsetX: 0, offsetY: 0 },
  'jrleAVGiWcDd': { id: 'jrleAVGiWcDd', label: 'Adv', slice: [28, 37], triangle: false, offsetX: 0, offsetY: 0 },
  'VLO[qaqYRY{Q': { id: 'VLO[qaqYRY{Q', label: 'NP', children: ['M}E@bxcClTOC', 'qNC_Mmj}dExD'], offsetX: 0, offsetY: 0 },
  'OZZVyJJI|rrg': { id: 'OZZVyJJI|rrg', label: 'NP', children: ['KNICuEVF|knF', 'VLO[qaqYRY{Q'], offsetX: 0, offsetY: 0 },
  'o{[romK`VyJk': { id: 'o{[romK`VyJk', label: 'VP', children: ['h@a@YTJjySzv', 'jrleAVGiWcDd'], offsetX: 0, offsetY: 0 },
  'tKNDBviXDVwb': { id: 'tKNDBviXDVwb', label: 'S', children: ['OZZVyJJI|rrg', 'o{[romK`VyJk'], offsetX: 0, offsetY: 0 },
};

const positionedNodeTree: PositionedNodeTree = {
  'KNICuEVF|knF': { ...nodeTree['KNICuEVF|knF'], x: 31.96875, sliceXSpan: [0, 63.9375], y: -40 },
  'M}E@bxcClTOC': { ...nodeTree['M}E@bxcClTOC'], x: 88.7265625, sliceXSpan: [68.328125, 109.125], y: -40 },
  'qNC_Mmj}dExD': { ...nodeTree['qNC_Mmj}dExD'], x: 131.8203125, sliceXSpan: [113.515625, 150.125], y: -40 },
  'h@a@YTJjySzv': { ...nodeTree['h@a@YTJjySzv'], x: 172.9296875, sliceXSpan: [154.515625, 191.34375], y: -40 },
  'jrleAVGiWcDd': { ...nodeTree['jrleAVGiWcDd'], x: 225.921875, sliceXSpan: [195.734375, 256.109375], y: -40 },
  'VLO[qaqYRY{Q': { ...nodeTree['VLO[qaqYRY{Q'], x: 110.2734375, y: -80 },
  'OZZVyJJI|rrg': { ...nodeTree['OZZVyJJI|rrg'], x: 71.12109375, y: -120 },
  'o{[romK`VyJk': { ...nodeTree['o{[romK`VyJk'], x: 199.42578125, y: -80 },
  'tKNDBviXDVwb': { ...nodeTree['tKNDBviXDVwb'], x: 135.2734375, y: -160 },
};

const sentenceWithOffsets = 'John arrived.';

const nodeTreeWithOffsets: NodeTree = {
  'KNICuEVF|knF': { id: 'KNICuEVF|knF', label: 'N', slice: [0, 4], triangle: false, offsetX: 0, offsetY: 0 },
  'M}E@bxcClTOC': { id: 'M}E@bxcClTOC', label: 'V', slice: [5, 12], triangle: false, offsetX: 0, offsetY: 0 },
  'qNC_Mmj}dExD': { id: 'qNC_Mmj}dExD', label: 'NP', children: ['KNICuEVF|knF'], offsetX: 4, offsetY: 0 },
  'h@a@YTJjySzv': { id: 'h@a@YTJjySzv', label: 'VP', children: ['M}E@bxcClTOC'], offsetX: -4, offsetY: 0 },
  'jrleAVGiWcDd': { id: 'jrleAVGiWcDd', label: 'S', children: ['qNC_Mmj}dExD', 'h@a@YTJjySzv'], offsetX: 0, offsetY: 10 },
};

const positionedNodeTreeWithOffsets: PositionedNodeTree = {
  'KNICuEVF|knF': { ...nodeTreeWithOffsets['KNICuEVF|knF'], x: 16.609375, sliceXSpan: [0, 33.21875], y: -40 },
  'M}E@bxcClTOC': { ...nodeTreeWithOffsets['M}E@bxcClTOC'], x: 61.9140625, sliceXSpan: [37.609375, 86.21875], y: -40 },
  'qNC_Mmj}dExD': { ...nodeTreeWithOffsets['qNC_Mmj}dExD'], x: 20.609375, y: -80 },
  'h@a@YTJjySzv': { ...nodeTreeWithOffsets['h@a@YTJjySzv'], x: 57.9140625, y: -80 },
  'jrleAVGiWcDd': { ...nodeTreeWithOffsets['jrleAVGiWcDd'], x: 39.26171875, y: -110 },
};

describe('node positioning', () => {
  it('computes X and Y positions of nodes', () => {
    expect(computeNodePositions(nodeTree, sentence)).toMatchObject(positionedNodeTree);
  });

  it('computes X and Y positions of nodes with offsets', () => {
    expect(computeNodePositions(nodeTreeWithOffsets, sentenceWithOffsets))
      .toMatchObject(positionedNodeTreeWithOffsets);
  });
});

describe('tree dimensions', () => {
  it.each`
    string                   | width
    ${sentence.slice(0, 15)} | ${109}
    ${sentence.slice(0, 21)} | ${150}
    ${sentence}              | ${259.5}
  `('computes the width of the tree for "$string" as $width pixels', ({ string, width }) => {
    expect(computeTreeWidth(string)).toBeCloseTo(width, 0);
  });

  it(`computes the height of the tree for "${sentence}" as 160 pixels`, () => {
    expect(computeTreeHeight(positionedNodeTree)).toBe(160);
  });
});
