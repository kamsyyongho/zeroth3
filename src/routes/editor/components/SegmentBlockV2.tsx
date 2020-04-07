import { createStyles, makeStyles } from '@material-ui/core/styles';
import { ContentBlock, EditorBlock } from 'draft-js';
import React from 'reactn';
import { CustomTheme } from '../../../theme/index';
import { MemoizedSegmentBlockHead } from './SegmentBlockHead';
import { WordAlignmentBlock } from './WordAlignmentBlock';
import { Segment } from "../../../types";

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

interface SegmentBlockProps  {
    segment: Segment
}

export const SegmentBlockV2 = (props: SegmentBlockProps) => {
    const classes = useStyles();
    const { id, length, number, start, transcript, decoderTranscript, speaker, highRisk, wordAlignments } = props.segment;
    return (<div
        className={classes.root}
    >
        {/*<MemoizedSegmentBlockHead*/}
        {/*    block={block}*/}
        {/*    showEditorPopups={false}*/}
        {/*    {...blockProps}*/}
        {/*/>*/}
        <div className={classes.block} >
            {/*<EditorBlock {...props} />*/}
            {wordAlignments.map((word, index: number) => {
                return <WordAlignmentBlock
                    key={`word-alignment-${index}`}
                    start={word.start}
                    length={word.length}
                    word={word.word}
                    confidence={word.confidence} />
            })}
        </div>
    </div >);
};
