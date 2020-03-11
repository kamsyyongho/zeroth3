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
