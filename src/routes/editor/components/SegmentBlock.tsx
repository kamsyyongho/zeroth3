import { createStyles, makeStyles } from '@material-ui/core/styles';
import { ContentBlock, EditorBlock } from 'draft-js';
import React from 'reactn';
import { CustomTheme } from '../../../theme/index';
import { MemoizedSegmentBlockHead } from './SegmentBlockHead';

const useStyles = makeStyles((theme: CustomTheme) =>
  createStyles({
    root: {
      margin: theme.spacing(1),
    },
    block: {
      marginLeft: theme.spacing(1),
    },
  }),
);
let blockCount = 0;

export interface SegmentBlockSubProps {
  readOnly?: boolean;
  /** opens the assign speaker dialog for the segment */
  assignSpeakerForSegment: (segmentId: string) => void;
  /** deletes high-risk segment value */
  removeHighRiskValueFromSegment: (segmentId: string) => void;
}

interface SegmentBlockProps extends EditorBlock {
  block: ContentBlock,
  blockProps: SegmentBlockSubProps,
}

export const SegmentBlock = (props: SegmentBlockProps) => {
  const classes = useStyles();
  const { blockProps, block } = props;

  React.useEffect(() => {
    console.log(`blockProps number ${blockCount} in SegmentBlock : `, blockProps);
    console.log(`block number ${blockCount} SegmentBlock : `, block);
    blockCount++;
  });

  return (<div
    className={classes.root}
  >
    <MemoizedSegmentBlockHead
      block={block}
      showEditorPopups={false}
      {...blockProps}
    />
    <div className={classes.block} >
      <EditorBlock {...props} />
    </div>
  </div >);
};
