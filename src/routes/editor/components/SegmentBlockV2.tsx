import {createStyles, makeStyles, useTheme} from '@material-ui/core/styles';
import { green, grey, pink, red } from '@material-ui/core/colors';
import React, { useGlobal } from 'reactn';
import {CustomTheme} from '../../../theme/index';
import {MemoizedSegmentBlockHeadV2} from './SegmentBlockHeadV2';
import {Segment, WordAlignment, UndoRedoData} from "../../../types";
import WordAlignmentBlock from './WordAlignmentBlock';
import {EDITOR_CONTROLS} from './EditorControls';
import { INLINE_STYLE_TYPE } from '../../../types';
import { buildStyleMap } from '../helpers/editor.helper';
import { checkLocationOnScreenAndScroll } from './helpers/entity-content.helper';
import { useWindowSize } from '../../../hooks/window/useWindowSize';
import { ApiContext } from '../../../hooks/api/ApiContext';
import log from '../../../util/log/logger';
import {EditWordAlignmentBlock} from './EditWordAlignmentBlock';

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
    isAudioPlaying: boolean;
    isDiff: boolean;
    isCommentEnabled: boolean;
    assignSpeakerForSegment: (segmentIndex: string) => void;
    onUpdateUndoRedoStack: (canUndo: boolean, canRedo: boolean) => void;
    onCommandHandled: () => void;
    updateCaretLocation: (segmentIndex: number, wordIndex: number) => void;
    updateChange: (segmentIndex: number, wordIndex: number, word: string) => void;
    updateSegment: (segmentId:string, wordAlignments: WordAlignment[], transcript: string, segmentIndex: number) => void;
    handleTextSelection: (segmentId: string, indexFrom: number, indexTo: number) => void;
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
        isAudioPlaying,
        isDiff,
        isCommentEnabled,
        onUpdateUndoRedoStack,
        onCommandHandled,
        updateCaretLocation,
        updateChange,
        updateSegment,
        handleTextSelection,
        readOnly,
        removeHighRiskValueFromSegment,
        findWordAlignmentIndexToPrevSegment,
        getLastAlignmentIndexInSegment,
        playingLocation } = props;
    const api = React.useContext(ApiContext);
    const [lengthBeforeBlockArray, setLengthBeforeBlockArray] = React.useState<number[]>([]);
    const theme: CustomTheme = useTheme();
    const [localSegment, setLocalSegment] = React.useState<Segment>(segment);
    const [isChanged, setIsChanged] = React.useState(false);
    const [editorCommandForWordBlock, setEditorCommandForWordBlock] = React.useState<EDITOR_CONTROLS>();
    const [undoRedoData, setUndoRedoData] = React.useState<UndoRedoData | undefined>();
    const [isAbleToComment, setIsAbleToComment] = React.useState<boolean>(false);
    const editorElement = React.useMemo(() => document.querySelector('#scroll-container'), []);
    const segmentRef = React.useRef<HTMLDivElement | null>(null);
    const [editorContentHeight, setEditorContentHeight] = useGlobal('editorContentHeight');
    const [editorAutoScrollDisabled, setEditorAutoScrollDisabled] = useGlobal('editorAutoScrollDisabled');
    const [isShowComment, setIsShowComment] = React.useState<boolean>(false);
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
            if(updatedSegment.highRisk) {
                updatedSegment.highRisk = false;
                removeHighRiskValueFromSegment(segment.id);
            }
            setIsChanged(isChanged);
            updatedSegment.wordAlignments[wordIndex].word = word;
            setLocalSegment(updatedSegment);
    };

    const getUndoStack = () => {
        if(!undoRedoData || !undoRedoData.undoStack || !undoRedoData.undoStack.length) {
            return [];
        } else {
            return undoRedoData.undoStack;
        }
    };

    const getRedoStack = () => {
        if(!undoRedoData || !undoRedoData.redoStack || !undoRedoData.redoStack.length) {
            return [];
        } else {
            return undoRedoData.redoStack;
        }
    }

    const handleUndoCommand = () => {
        const undoStack = getUndoStack();
        const redoStack = getRedoStack();
        if(undoStack.length) {
            const previousText: any = undoStack.pop();
            const updateWordAlignment = localSegment;
            // if(undoRedoData?.location){
            //     const [segmentIndex, wordIndex] = undoRedoData?.location;
            //     updateWordAlignment.wordAlignments[wordIndex].word = previousText;
            //     setLocalSegment(updateWordAlignment);
            //     setUndoRedoData({
            //         location: undoRedoData.location,
            //         undoStack: undoStack,
            //         redoStack: [...redoStack, previousText],
            //     });
            //     onCommandHandled();
            // }
        }
    };

    const handleRedoCommand = () => {
        const undoStack = getUndoStack();
        const redoStack = getRedoStack();
        if(redoStack.length){
            const undidState: any = redoStack.pop();
            const updateWordAlignment = localSegment;
            if(undoRedoData?.location) {
                // const [segmentIndex, wordIndex] = undoRedoData?.location
                // updateWordAlignment.wordAlignments[wordIndex].word = undidState;
                // setLocalSegment(updateWordAlignment);
                // setUndoRedoData({
                //     location: undoRedoData.location,
                //     undoStack: [...undoStack, undidState],
                //     redoStack: redoStack,
                // });
                onCommandHandled();
            }

        }
    };

    const handleFocus = () => {
        isFocused = true
    };

    const handleBlur = async () => {
        if(isChanged) {
            await updateSegment(segment.id, localSegment.wordAlignments, localSegment.transcript, segmentIndex);
            setIsChanged(false);
        }
        checkLocationOnScreenAndScroll(
            segmentRef.current,
            editorElement,
            editorContentHeight,
            windowHeight,
            editorAutoScrollDisabled);
        isFocused = false;
    };

    const resetState = () => {
      setUndoRedoData(undefined);
        setIsChanged(false);
    };



    React.useEffect(() => {
        return () => {
            resetState();
        }
    }, []);

    React.useEffect(() => {
        if(segment?.wordAlignments.length) {
            let copySegment = {...segment};
            for(let i = 0; i < copySegment.length -1; i++) {
                const wordAlignment = copySegment.wordAlignments[i];
                if(wordAlignment) {
                    copySegment.wordAlignments[i]['word'] = segment.wordAlignments[i]['word'].replace('|', ' ');
                }
            }
            setLocalSegment(copySegment);
            setLengthBeforeEachBlockArray();
        }
        return () => {
            resetState();
        }
    }, [segment]);

    React.useEffect(() => {
        if(undoRedoData && undoRedoData.location.length && segmentIndex == undoRedoData.location[0]) {
            if(editorCommand === EDITOR_CONTROLS.undo) handleUndoCommand();
            if(editorCommand === EDITOR_CONTROLS.redo) handleRedoCommand();
            onUpdateUndoRedoStack(getUndoStack().length > 0, getRedoStack().length > 0)
            setEditorCommandForWordBlock(editorCommand);
        }
    },[editorCommand]);

    return (
        <div className={classes.root} ref={segmentRef} onFocus={handleFocus} onBlur={handleBlur}>
            <MemoizedSegmentBlockHeadV2
                readOnly={readOnly}
                isChanged={isChanged}
                assignSpeakerForSegment={assignSpeakerForSegment}
                setIsShowComment={setIsShowComment}
                removeHighRiskValueFromSegment={removeHighRiskValueFromSegment}
                segment={localSegment}
            />
            {/*{
                !isDiff || isAudioPlaying ?
                    localSegment.wordAlignments.map((word: WordAlignment, index: number) => {
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
                        })
                    :
                    <div>
                        <EditWordAlignmentBlock
                            segment={localSegment}
                            segmentIndex={segmentIndex}
                            isAbleToComment={isAbleToComment}
                            isCommentEnabled={isCommentEnabled}
                            readOnly={readOnly}
                            playingLocation={playingLocation}
                            updateCaretLocation={updateCaretLocation}
                            handleTextSelection={handleTextSelection} />
                    </div>
            }*/}
            <EditWordAlignmentBlock
                editorCommand={editorCommand}
                segment={localSegment}
                segmentIndex={segmentIndex}
                isAbleToComment={isAbleToComment}
                isCommentEnabled={isCommentEnabled}
                isShowComment={isShowComment}
                readOnly={readOnly}
                playingLocation={playingLocation}
                lengthBeforeBlock={lengthBeforeBlockArray}
                isDiff={isDiff}
                findWordAlignmentIndexToPrevSegment={findWordAlignmentIndexToPrevSegment}
                updateCaretLocation={updateCaretLocation}
                updateSegment={updateSegment}
                handleTextSelection={handleTextSelection} />
        </div>
    );
};

export const MemoizedSegmentBlock = React.memo(SegmentBlockV2);
