export const SENTENCE = 'Colorless green ideas sleep furiously.';
export const TREE = {
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
};
