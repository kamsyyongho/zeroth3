import {createStyles, makeStyles} from '@material-ui/core/styles';
import React from 'reactn';
import {CustomTheme} from '../../../theme/index';
import {MemoizedSegmentBlockHeadV2} from './SegmentBlockHeadV2';
import {Segment, WordAlignment} from "../../../types";
import WordAlignmentBlock from './WordAlignmentBlock';
import {EDITOR_CONTROLS} from './EditorControls';

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
    segmentIndex: number;
    editorCommand?: EDITOR_CONTROLS;
    assignSpeakerForSegment: (segmentIndex: string) => void;
    onUpdateUndoRedoStack: (canUndo: boolean, canRedo: boolean) => void;
    updateCaretLocation: (segmentIndex: number, wordIndex: number) => void;
    updateChange: (segmentIndex: number, wordIndex: number, word: string) => void;
    updateSegment: (segmentId:string, wordAlignments: WordAlignment[], transcript: string, segmentIndex: number) => void;
    findWordAlignmentIndexToPrevSegment: (segmentIndex: number, currentLocation: number) => void;
    getLastAlignmentIndexInSegment: (segmentIndex: number) => void;
    readOnly?: boolean;
    removeHighRiskValueFromSegment: (segmentId: string) => void;
}

let isFocused = false;

const SegmentBlockV2 = (props: SegmentBlockProps) => {
    const classes = useStyles();
    const {
        segment,
        segmentIndex,
        assignSpeakerForSegment,
        editorCommand,
        onUpdateUndoRedoStack,
        updateCaretLocation,
        updateChange,
        updateSegment,
        readOnly,
        removeHighRiskValueFromSegment,
        findWordAlignmentIndexToPrevSegment,
        getLastAlignmentIndexInSegment } = props;
    // const [undoRedoData, setUndoRedoData] = useGlobal('undoRedoData');
    const [lengthBeforeBlockArray, setLengthBeforeBlockArray] = React.useState<number[]>([]);
    const [localSegment, setLocalSegment] = React.useState<Segment>(segment);
    const [isChanged, setIsChanged] = React.useState(false);
    // const [isFocused, setIsFocused] = React.useState(false);
    const [editorCommandForWordBlock, setEditorCommandForWordBlock] = React.useState<EDITOR_CONTROLS>();
    const [undoRedoData, setUndoRedoData] = React.useState({location: [], undoStack: [], redoStack: []});

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

    const handleUndoCommand = () => {
        if(undoRedoData.undoStack.length) {
            const undoStack: string[] = undoRedoData.undoStack;
            const previousText: any = undoStack.pop();
            const updateWordAlignment = localSegment;
            const [segmentIndex, wordIndex] = undoRedoData.location
            updateWordAlignment.wordAlignments[wordIndex].word = previousText;
            setLocalSegment(updateWordAlignment);
            setUndoRedoData({
                location: undoRedoData.location,
                undoStack: undoStack,
                redoStack: [...undoRedoData.redoStack, previousText],
            });
            console.log('editorCommand in WordAlignmentBlock : ', undoRedoData);
        }
    };

    const handleRedoCommand = () => {
        if(undoRedoData.redoStack.length) {
            const redoStack = undoRedoData.redoStack;
            const undidState = undoRedoData.redoStack.pop();
            setUndoRedoData({
                location: undoRedoData.location,
                undoStack: [...undoRedoData.undoStack, undidState],
                redoStack: redoStack,
            });
        }
    };

    const handleFocus = () => {
        console.log('focus detected in segment block');
        isFocused = true
        console.log('isFocused : ', isFocused);

    };

    const handleBlur = async () => {
        console.log('isChanged on segmentBlock blur : ', isChanged);
        if(isChanged) {
            await updateSegment(segment.id, localSegment.wordAlignments, localSegment.transcript, segmentIndex);
            setIsChanged(false);
        }
        isFocused = false;
    };

    React.useEffect(() => {
        setLengthBeforeEachBlockArray();
        console.log('localSegment in segment block : ', localSegment);
    }, []);

    React.useEffect(() => {
        if(undoRedoData.location.length && segmentIndex == undoRedoData.location[0]) {
            console.log('=======isFocused editorCOmmand : ', editorCommand, undoRedoData);
            if(editorCommand === EDITOR_CONTROLS.undo) handleUndoCommand();
            if(editorCommand === EDITOR_CONTROLS.redo) handleRedoCommand();
            setEditorCommandForWordBlock(editorCommand);
        }
    },[editorCommand])

    return (
        <div className={classes.root} onFocus={handleFocus} onBlur={handleBlur}>
            <MemoizedSegmentBlockHeadV2
                readOnly={readOnly}
                assignSpeakerForSegment={assignSpeakerForSegment}
                removeHighRiskValueFromSegment={removeHighRiskValueFromSegment}
                segment={segment}
            />
            {localSegment.wordAlignments.map((word: WordAlignment, index: number) => {
                return (
                    <WordAlignmentBlock
                        key={`word-alignment-${segmentIndex}-${index}`}
                        findWordAlignmentIndexToPrevSegment={findWordAlignmentIndexToPrevSegment}
                        setUndoRedoData={setUndoRedoData}
                        getLastAlignmentIndexInSegment={getLastAlignmentIndexInSegment}
                        onUpdateUndoRedoStack={onUpdateUndoRedoStack}
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

export const MemoizedSegmentBlock = React.memo(SegmentBlockV2);
