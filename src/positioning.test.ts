import { computeNodePositions, computeTreeWidth, computeTreeHeight } from './positioning';
import { NodeTree, PositionedNodeTree } from './interfaces';

jest.mock('./measureText');

const sentence = 'Colorless green ideas sleep furiously.';

const nodeTree: NodeTree = {
  'KNICuEVF|knF': { id: 'KNICuEVF|knF', label: 'Adj', slice: [0, 9], triangle: false },
  'M}E@bxcClTOC': { id: 'M}E@bxcClTOC', label: 'Adj', slice: [10, 15], triangle: false },
  'qNC_Mmj}dExD': { id: 'qNC_Mmj}dExD', label: 'N', slice: [16, 21], triangle: false },
  'h@a@YTJjySzv': { id: 'h@a@YTJjySzv', label: 'V', slice: [22, 27], triangle: false },
  'jrleAVGiWcDd': { id: 'jrleAVGiWcDd', label: 'Adv', slice: [28, 37], triangle: false },
  'VLO[qaqYRY{Q': { id: 'VLO[qaqYRY{Q', label: 'NP', children: ['M}E@bxcClTOC', 'qNC_Mmj}dExD'] },
  'OZZVyJJI|rrg': { id: 'OZZVyJJI|rrg', label: 'NP', children: ['KNICuEVF|knF', 'VLO[qaqYRY{Q'] },
  'o{[romK`VyJk': { id: 'o{[romK`VyJk', label: 'VP', children: ['h@a@YTJjySzv', 'jrleAVGiWcDd'] },
  'tKNDBviXDVwb': { id: 'tKNDBviXDVwb', label: 'S', children: ['OZZVyJJI|rrg', 'o{[romK`VyJk'] },
};

const positionedNodeTree: PositionedNodeTree = {
  'KNICuEVF|knF': { ...nodeTree['KNICuEVF|knF'], x: 31.96875, y: -40 },
  'M}E@bxcClTOC': { ...nodeTree['M}E@bxcClTOC'], x: 88.7265625, y: -40 },
  'qNC_Mmj}dExD': { ...nodeTree['qNC_Mmj}dExD'], x: 131.8203125, y: -40 },
  'h@a@YTJjySzv': { ...nodeTree['h@a@YTJjySzv'], x: 172.9296875, y: -40 },
  'jrleAVGiWcDd': { ...nodeTree['jrleAVGiWcDd'], x: 225.921875, y: -40 },
  'VLO[qaqYRY{Q': { ...nodeTree['VLO[qaqYRY{Q'], x: 110.2734375, y: -80 },
  'OZZVyJJI|rrg': { ...nodeTree['OZZVyJJI|rrg'], x: 71.12109375, y: -120 },
  'o{[romK`VyJk': { ...nodeTree['o{[romK`VyJk'], x: 199.42578125, y: -80 },
  'tKNDBviXDVwb': { ...nodeTree['tKNDBviXDVwb'], x: 135.2734375, y: -160 },
};

describe('node positioning', () => {
  it('computes X and Y positions of nodes', () => {
    expect(computeNodePositions(nodeTree, sentence)).toMatchObject(positionedNodeTree)
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