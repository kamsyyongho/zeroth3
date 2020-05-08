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
    updateSegment: (segmentId:string, wordAlignments: WordAlignment[], transcript: string, segmentIndex: number) => void;
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
        updateSegment,
        readOnly,
        removeHighRiskValueFromSegment,
        findWordAlignmentIndexToPrevSegment,
        getLastAlignmentIndexInSegment } = props;
    const [lengthBeforeBlockArray, setLengthBeforeBlockArray] = React.useState<number[]>([]);
    const [localSegment, setLocalSegment] = React.useState<Segment>(segment);
    const [isChanged, setIsChanged] = React.useState(false);

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

    const updateWordAlignmentChange = (wordIndex: number, word: string, isChanged: boolean) => {
        if(isChanged) {
            const updatedSegment = localSegment;
            setIsChanged(isChanged);
            updatedSegment.wordAlignments[wordIndex].word = word;
            setLocalSegment(updatedSegment);
        }
    };

    const handleFocus = () => {
        console.log('focus detected in segment block');
    };

    const handleBlur = async () => {
        console.log('isChanged on segmentBlock blur : ', isChanged);
        if(isChanged) {
            await updateSegment(segment.id, localSegment.wordAlignments, localSegment.transcript, segmentIndex);
            setIsChanged(false);
        }
    };

    React.useEffect(() => {
        setLengthBeforeEachBlockArray();
        console.log('localSegment in segment block : ', localSegment);
    }, []);

    return (
        <div className={classes.root} onFocus={handleFocus} onBlur={handleBlur}>
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
                        updateWordAlignmentChange={updateWordAlignmentChange}
                        segmentIndex={segmentIndex}
                        wordAlignmentIndex={index}
                        wordAlignmentsLength={segment.wordAlignments.length}
                        lengthBeforeBlock={lengthBeforeBlockArray[index]}
                        start={word.start}
                        length={word.length}
                        word={word.word}
                        readOnly={readOnly}
                        confidence={word.confidence} />
                )
            })}
        </div>
    );
};
