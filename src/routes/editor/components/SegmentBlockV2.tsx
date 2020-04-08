import { createStyles, makeStyles } from '@material-ui/core/styles';
import React from 'reactn';
import { CustomTheme } from '../../../theme/index';
import { MemoizedSegmentBlockHeadV2 } from './SegmentBlockHeadV2';
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
    removeHighRiskValueFromSegment: (segmenttId: string) => void;
};

interface SegmentBlockProps  {
    segment: Segment;
    assignSpeakerForSegment: (segmentIndex: string) => void;
    readOnly?: boolean;
    removeHighRiskValueFromSegment: (segmentId: string) => void;
};

export const SegmentBlockV2 = (props: SegmentBlockProps) => {
    const classes = useStyles();
    const { segment, assignSpeakerForSegment, readOnly, removeHighRiskValueFromSegment } = props;
    return (<div className={classes.root}>
        <MemoizedSegmentBlockHeadV2
            readOnly={readOnly}
            assignSpeakerForSegment={assignSpeakerForSegment}
            removeHighRiskValueFromSegment={removeHighRiskValueFromSegment}
            segment={segment}
        />
        <div className={classes.block} >
            {/*<EditorBlock {...props} />*/}
            {segment.wordAlignments.map((word, index: number) => {
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
