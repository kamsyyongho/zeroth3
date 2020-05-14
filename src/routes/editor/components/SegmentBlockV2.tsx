import {createStyles, makeStyles, useTheme} from '@material-ui/core/styles';
import { green, grey, pink, red } from '@material-ui/core/colors';
import React, { useGlobal } from 'reactn';
import {CustomTheme} from '../../../theme/index';
import {MemoizedSegmentBlockHeadV2} from './SegmentBlockHeadV2';
import {Segment, WordAlignment} from "../../../types";
import WordAlignmentBlock from './WordAlignmentBlock';
import {EDITOR_CONTROLS} from './EditorControls';
import { INLINE_STYLE_TYPE } from '../../../types';
import { buildStyleMap } from '../helpers/editor.helper';
import { checkLocationOnScreenAndScroll } from './helpers/entity-content.helper';
import { useWindowSize } from '../../../hooks/window/useWindowSize';

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
        editor: {
            playing: '#077db5',
            playingShadow: `0px 0px 0px 1px #077db5`,
            highlight: pink.A200,
            LowConfidence: '#ffe190',
            LowConfidenceGradient: `linear-gradient(to right, #000 0%, #ffe190 2.5%)`,
            entity: grey[200],
            entityGradient: `linear-gradient(to right, #000 0%, ${grey[200]} 2.5%)`,
            changes: green[400],
        },
    }),
);

interface SegmentBlockProps  {
    segment: Segment;
    segmentIndex: number;
    editorCommand?: EDITOR_CONTROLS;
    assignSpeakerForSegment: (segmentIndex: string) => void;
    onUpdateUndoRedoStack: (canUndo: boolean, canRedo: boolean) => void;
    onCommandHandled: () => void;
    updateCaretLocation: (segmentIndex: number, wordIndex: number) => void;
    updateChange: (segmentIndex: number, wordIndex: number, word: string) => void;
    updateSegment: (segmentId:string, wordAlignments: WordAlignment[], transcript: string, segmentIndex: number) => void;
    findWordAlignmentIndexToPrevSegment: (segmentIndex: number, currentLocation: number) => void;
    getLastAlignmentIndexInSegment: (segmentIndex: number) => void;
    readOnly?: boolean;
    removeHighRiskValueFromSegment: (segmentId: string) => void;
    playingLocation: any;
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
        onCommandHandled,
        updateCaretLocation,
        updateChange,
        updateSegment,
        readOnly,
        removeHighRiskValueFromSegment,
        findWordAlignmentIndexToPrevSegment,
        getLastAlignmentIndexInSegment,
        playingLocation } = props;
    // const [undoRedoData, setUndoRedoData] = useGlobal('undoRedoData');
    const [lengthBeforeBlockArray, setLengthBeforeBlockArray] = React.useState<number[]>([]);
    const theme: CustomTheme = useTheme();
    const [localSegment, setLocalSegment] = React.useState<Segment>(segment);
    const [isChanged, setIsChanged] = React.useState(false);
    // const [isFocused, setIsFocused] = React.useState(false);
    const [editorCommandForWordBlock, setEditorCommandForWordBlock] = React.useState<EDITOR_CONTROLS>();
    const [undoRedoData, setUndoRedoData] = React.useState({location: [], undoStack: [], redoStack: []});
    const editorElement = React.useMemo(() => document.querySelector('#scroll-container'), []);
    const segmentRef = React.useRef<HTMLButtonElement | null>(null);
    const [editorContentHeight, setEditorContentHeight] = useGlobal('editorContentHeight');
    const [editorAutoScrollDisabled, setEditorAutoScrollDisabled] = useGlobal('editorAutoScrollDisabled');
    const windowSize = useWindowSize();
    const windowHeight = windowSize.height;

    const styleMap = React.useMemo(() => {
        return buildStyleMap(theme);
    }, []);

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
            const updatedSegment = localSegment;
            setIsChanged(isChanged);
            updatedSegment.wordAlignments[wordIndex].word = word;
            setLocalSegment(updatedSegment);
    };

    // const handleUndoCommand = () => {
    //     if(undoRedoData.undoStack.length) {
    //         const undoStack: string[] = undoRedoData.undoStack;
    //         const previousText: any = undoStack.pop();
    //         const updateWordAlignment = localSegment;
    //         const [segmentIndex, wordIndex] = undoRedoData.location
    //         updateWordAlignment.wordAlignments[wordIndex].word = previousText;
    //         setLocalSegment(updateWordAlignment);
    //         setUndoRedoData({
    //             location: undoRedoData.location,
    //             undoStack: undoStack,
    //             redoStack: [...undoRedoData.redoStack, previousText],
    //         });
    //         onCommandHandled();
    //         console.log('editorCommand in WordAlignmentBlock : ', undoRedoData);
    //     }
    // };
    //
    // const handleRedoCommand = () => {
    //     if(undoRedoData.redoStack.length) {
    //         const redoStack = undoRedoData.redoStack;
    //         const undidState = undoRedoData.redoStack.pop();
    //         const updateWordAlignment = localSegment;
    //         const [segmentIndex, wordIndex] = undoRedoData.location
    //         updateWordAlignment.wordAlignments[wordIndex].word = undidState;
    //         setLocalSegment(updateWordAlignment);
    //         setUndoRedoData({
    //             location: undoRedoData.location,
    //             undoStack: [...undoRedoData.undoStack, undidState],
    //             redoStack: redoStack,
    //         });
    //         onCommandHandled();
    //     }
    // };

    const handleFocus = () => {
        console.log('===========focused segment : ', segment);
        isFocused = true
    };

    const handleBlur = async () => {
        console.log('isChanged on segmentBlock blur : ', isChanged);
        if(isChanged) {
            await updateSegment(segment.id, localSegment.wordAlignments, localSegment.transcript, segmentIndex);
            setIsChanged(false);
        }
        isFocused = false;
    };

    const resetState = () => {
      setUndoRedoData({location: [], undoStack: [], redoStack: []});
        setIsChanged(false);
    };


    React.useEffect(() => {
        return () => {
            resetState();
        }
    }, []);

    React.useEffect(() => {
        setLocalSegment(segment);
        setLengthBeforeEachBlockArray();
        console.log('localSegment in segment block : ', localSegment);
        return () => {
            resetState();
        }
    }, [segment]);

    // React.useEffect(() => {
    //     checkLocationOnScreenAndScroll(segmentRef.current, editorElement, editorContentHeight, windowHeight, editorAutoScrollDisabled);
    // }, playingLocation)

    React.useEffect(() => {
        if(undoRedoData.location.length && segmentIndex == undoRedoData.location[0]) {
            // if(editorCommand === EDITOR_CONTROLS.undo) handleUndoCommand();
            // if(editorCommand === EDITOR_CONTROLS.redo) handleRedoCommand();
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
                        styleMap={styleMap}
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
                        editorCommand={editorCommand}
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
