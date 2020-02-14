import { ContentBlock, ContentState, convertToRaw } from 'draft-js';

export const getIndexOfBlock = (
  contentState: ContentState,
  block: ContentBlock
) => {
  const rawContent = convertToRaw(contentState);
  const { blocks } = rawContent;
  const blockKey = block.getKey();
  let blockIndex = 0;
  for (let i = 0; i < blocks.length; i++) {
    const contentBlock = blocks[i];
    if (contentBlock.key === blockKey) {
      blockIndex = i;
      break;
    }
  }
  return blockIndex;
};
