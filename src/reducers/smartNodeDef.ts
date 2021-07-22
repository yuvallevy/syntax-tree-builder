import { NodeId } from '../interfaces';

/**
 * Returns what the definition of a new node should be, taking into account the sentence and selection.
 * Used for some convenient shortcuts, such as trimming spaces within the selection or allowing the user to add a node
 * corresponding to a word without having to select the whole word.
 */
export const deriveNodeDefinition = (sentence: string, selectedNodes: Set<NodeId> | null, selectedRange: [number, number] | null) => {
  if (selectedNodes) {
    return {
      children: Array.from(selectedNodes),
      slice: undefined
    };
  }
  if (selectedRange) {
    // Do some magic to find out what the user actually wants:
    let desiredRange: [number, number];
    // 1. If there is only a cursor, treat the entire word as selected
    if (selectedRange[0] === selectedRange[1]) {
      desiredRange = [
        sentence.substring(0, selectedRange[0]).lastIndexOf(' ') + 1,
        sentence.substring(selectedRange[0]).includes(' ')
          ? sentence.indexOf(' ', selectedRange[0])
          : sentence.length
      ];
    } else {
      // 2. Otherwise, trim whitespace from both ends of the selection
      const originalSelectionText = sentence.substring(...selectedRange);
      const trimStartCount = originalSelectionText.length - originalSelectionText.trimStart().length;
      const trimEndCount = originalSelectionText.length - originalSelectionText.trimEnd().length;
      desiredRange = [
        selectedRange[0] + trimStartCount,
        selectedRange[1] - trimEndCount
      ];
    }
    return {
      slice: desiredRange,
      triangle: sentence.substring(...desiredRange).includes(' '),
      children: undefined
    };
  }
  return {
    slice: undefined,
    children: undefined
  };
};