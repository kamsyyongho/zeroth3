import { createStyles, makeStyles } from '@material-ui/core/styles';
import React from 'reactn';
import { CustomTheme } from '../../../theme/index';
import { MemoizedSegmentBlockHeadV2 } from './SegmentBlockHeadV2';
import {Segment, WordAlignment} from "../../../types";
import WordAlignmentBlock from './WordAlignmentBlock';

const useStyles = makeStyles((theme: CustomTheme) =>
    createStyles({
        root: {
            margin: theme.spacing(1),
            minWidth: 0,
            maxWidth: '1076px'
        },
        block: {
            marginLeft: theme.spacing(1),
            minWidth: 0,
            maxWidth: '100%',
        },

    }),
);

interface SegmentBlockProps  {
    segment: Segment;
    segmentIndex: number,
    assignSpeakerForSegment: (segmentIndex: string) => void;
    updateCaretLocation: (segmentIndex: number, wordIndex: number) => void;
    updateChange: (segmentIndex: number, wordIndex: number, word: string) => void;
    findWordAlignmentIndexToPrevSegment: (segmentIndex: number, currentLocation: number) => void;
    getLastAlignmentIndexInSegment: (segmentIndex: number) => void;
    readOnly?: boolean;
    removeHighRiskValueFromSegment: (segmentId: string) => void;
}

export const SegmentBlockV2 = (props: SegmentBlockProps) => {
    const classes = useStyles();
    const {
        segment,
        segmentIndex,
        assignSpeakerForSegment,
        updateCaretLocation,
        updateChange,
        readOnly,
        removeHighRiskValueFromSegment,
        findWordAlignmentIndexToPrevSegment,
        getLastAlignmentIndexInSegment } = props;
    const [lengthBeforeBlockArray, setLengthBeforeBlockArray] = React.useState<number[]>([]);

    const setLengthBeforeEachBlockArray = () => {
        const result = [0];
        let count = 0;
        for(let i = 1; i < segment.wordAlignments.length; i ++) {
            const alignment = segment.wordAlignments[i];
            count += alignment.word.length;
            result.push(count);
        }
        setLengthBeforeBlockArray(result);
    };

    React.useEffect(() => {
        setLengthBeforeEachBlockArray();
    }, []);

    return (
        <div className={classes.root}>
            <MemoizedSegmentBlockHeadV2
                readOnly={readOnly}
                assignSpeakerForSegment={assignSpeakerForSegment}
                removeHighRiskValueFromSegment={removeHighRiskValueFromSegment}
                segment={segment}
            />
            {segment.wordAlignments.map((word: WordAlignment, index: number) => {
                return (
                    <WordAlignmentBlock
                        key={`word-alignment-${segmentIndex}-${index}`}
                        findWordAlignmentIndexToPrevSegment={findWordAlignmentIndexToPrevSegment}
                        getLastAlignmentIndexInSegment={getLastAlignmentIndexInSegment}
                        updateCaretLocation={updateCaretLocation}
                        updateChange={updateChange}
                        segmentIndex={segmentIndex}
                        wordAlignmentIndex={index}
                        wordAlignmentsLength={segment.wordAlignments.length}
                        lengthBeforeBlock={lengthBeforeBlockArray[index]}
                        start={word.start}
                        length={word.length}
                        word={word.word}
                        confidence={word.confidence} />
                )
            })}
        </div>
    );
};
