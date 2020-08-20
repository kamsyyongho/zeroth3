import {createStyles, makeStyles, useTheme} from '@material-ui/core/styles';
import React, {useRef} from 'reactn';
import {CustomTheme} from '../../../theme/index';
import {green, pink} from '@material-ui/core/colors';
import {Segment, UndoRedoStack, WordAlignment} from "../../../types";
import {EDITOR_CONTROLS} from './EditorControls';
import {ApiContext} from '../../../hooks/api/ApiContext';
import {getSegmentAndWordIndex, isInputKey} from '../helpers/editor.helper';

const useStyles = makeStyles((theme: CustomTheme) =>
    createStyles({
        segment: {
            display: 'flex',
            flexDirection: 'row',
            flexFlow: 'column wrap',
            width: 'fit-content',
            maxWidth: '100%',
            caretStyle: 'block',
            caretColor: 'white',
            textShadow: '0 0 4x #888',
            WebkiTextFillColor: 'transparent',
            whiteSpace: 'pre-wrap',
            // -webkit-text-fill-color: 'transparent'
        },
        highlight: {
            backgroundColor: '#a8d0e3'
        },
        playingSegment: {
          backgroundColor: green[200],
        },
        playingWord: {
            backgroundColor: pink[200],
        },
        caret: {
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid #000000',
        },
    }),
);

interface SelectedIndex {
    indexFrom: number;
    indexTo: number;
}

interface EditWordAlignmentBlockProps  {
    editorCommand?: EDITOR_CONTROLS;
    segment: Segment;
    segmentIndex: number;
    isAbleToComment: boolean;
    isDiff: boolean;
    isCommentEnabled: boolean;
    isShowComment: boolean;
    readOnly?: boolean;
    playingLocation: any;
    findWordAlignmentIndexToPrevSegment: (segmentIndex: number, currenLocation: number) => any,
    onUpdateUndoRedoStack: (canUndo: boolean, canRedo: boolean) => void;
    updateCaretLocation: (segmentIndex: number, wordIndex: number) => void;
    updateSegment: (segmentId:string, wordAlignments: WordAlignment[], transcript: string, segmentIndex: number) => void;
    handleTextSelection: (segmentId: string, indexFrom: number, indexTo: number) => void;
    lengthBeforeBlock: number[],
}

let isFocused = false;
let localWordForLengthComparison = '';

export function EditWordAlignmentBlock(props: EditWordAlignmentBlockProps)  {
    const classes = useStyles();
    const {
        editorCommand,
        segment,
        segmentIndex,
        isAbleToComment,
        isCommentEnabled,
        isShowComment,
        readOnly,
        playingLocation,
        findWordAlignmentIndexToPrevSegment,
        onUpdateUndoRedoStack,
        updateSegment,
        updateCaretLocation,
        handleTextSelection,
        lengthBeforeBlock, } = props;
    const api = React.useContext(ApiContext);
    const theme: CustomTheme = useTheme();
    const [isMouseDown, setIsMouseDown] = React.useState<boolean>(false);
    const [isSelected, setIsSelected] = React.useState<boolean>(false);
    const [selectedIndex, setSelectedIndex] = React.useState<SelectedIndex>();
    const [transcriptToRender, setTranscriptToRender] = React.useState<any>();
    const element = useRef<HTMLDivElement>(null);
    const [wordAlignments, setWordAlignments] = React.useState<WordAlignment[]>([] as WordAlignment[]);
    const [isChanged, setIsChanged] = React.useState<boolean>(false);
    const [undoStack, setUndoStack] = React.useState<UndoRedoStack>([] as UndoRedoStack);
    const [redoStack, setRedoStack] = React.useState<UndoRedoStack>([] as UndoRedoStack);

    const initTranscriptToRender = () => {
        const inititalTranscript = (<span>{segment.transcript}</span>)
        setTranscriptToRender(inititalTranscript);
    };

    const handleArrowKeyDown = () => {
        const playingLocation = getSegmentAndWordIndex();
        if(playingLocation) {
            updateCaretLocation(playingLocation.segmentIndex, playingLocation.wordIndex);
            return;
        }
    };
    const setRange = (node: HTMLElement, collapse: boolean) => {
        const range = document.createRange();
        const selection = window.getSelection();
        const currentNode = element;

        range.selectNodeContents(node);
        range.collapse(collapse);
        selection?.removeAllRanges();
        selection?.addRange(range);
        node.focus();
    };

    const handleArrowUp = () => {
        const selection = window.getSelection();
        if (!selection) return;
        const currentLocation = selection ?.anchorOffset;
        const playingLocation = getSegmentAndWordIndex() || [0,0];
        const wordAlignmentIndex = segmentIndex > 0 ? findWordAlignmentIndexToPrevSegment
        (segmentIndex - 1, currentLocation + lengthBeforeBlock[playingLocation.wordIndex]) : null;
        const previousSegmentNode = document.getElementById
        (`word-${segmentIndex - 1}-${wordAlignmentIndex}`) || null;
        const range = document.createRange();

        if (!previousSegmentNode) { return; }
        setRange(previousSegmentNode, false);
        updateCaretLocation(segmentIndex - 1, wordAlignmentIndex);
    };

    const handleArrowUpInSegment = () => {

    };

    const handleArrowDown = () => {
        const selection = window.getSelection();
        if (!selection) return;
        const currentLocation = selection?.anchorOffset;
        const playingLocation = getSegmentAndWordIndex() || [0,0];
        const wordAlignmentIndex = findWordAlignmentIndexToPrevSegment
        (segmentIndex + 1, currentLocation + lengthBeforeBlock[playingLocation.wordIndex]);
        const nextSegmentNode = document.getElementById
        (`word-${segmentIndex + 1}-${wordAlignmentIndex}`);
        const currentNode = element;
        selection ?.removeAllRanges();
        const range = document.createRange();

        if (!nextSegmentNode) { return; }
        // currentNode.current.blur();
        setRange(nextSegmentNode, false);
        updateCaretLocation(segmentIndex + 1, wordAlignmentIndex);
    };

    const hightlightSelectionAfterBlur = (indexFrom: number, indexTo: number) => {
       const beforeSelected: string = indexFrom === 0 ? '' : segment.transcript.slice(0,indexFrom);
       const afterSelected: string = indexTo === segment.transcript.length - 1 ? ''
           : segment.transcript.slice(indexTo + 1, segment.transcript.length - 1);
       const selected: string = segment.transcript.slice(indexFrom, indexTo + 1);
       const highlightedSpan = (<span>{beforeSelected}<span className={classes.highlight}>{selected}</span>{afterSelected}</span>);
       setTranscriptToRender(highlightedSpan);
       if(element?.current) {element.current.blur();}
    };

    const highlightRejectReason = () => {
        let styledWords: any[] = [];
        segment.wordAlignments.forEach((word) => {
            const processedWord = word.word.replace('|', ' ');
            if(!word.rejectReason) {
                styledWords.push(<span>{processedWord}</span>);
            } else {
                styledWords.push(<span className={classes.highlight}>{processedWord}</span>);
            }
        })
        let transcript = <span>{styledWords.map(word => word)}</span>
        setTranscriptToRender(transcript);
    };

    const handleSelectionChange = (event: React.KeyboardEvent) => {
        return;
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        const location = getSegmentAndWordIndex();
        switch (event.key) {
            case "ArrowUp":
                handleArrowUp();
                break;
            case "ArrowDown":
                handleArrowDown();
                break;
            case "ArrowLeft":
            case "ArrowRight":
                handleArrowKeyDown();
                break;
            default:
                if(readOnly || isMouseDown) {
                    event.preventDefault();
                } else {
                    if(isInputKey(event.nativeEvent)) {
                        const word = document.getElementById(`word-${segmentIndex}-${location.segmentIndex}`);
                        const updateUndoStack = undoStack.slice(0);
                        if(localWordForLengthComparison.length === 0) {
                            localWordForLengthComparison = wordAlignments[location.segmentIndex]['word'];
                        }
                        setIsChanged(true);
                        if(localWordForLengthComparison.length !== word?.innerText.length) {
                            updateUndoStack.push({ wordIndex: location.wordIndex, word: word?.innerText || '' });
                            localWordForLengthComparison = word?.innerText || '';
                            onUpdateUndoRedoStack(true, false);
                            setUndoStack(updateUndoStack);
                        }
                    }
                }
                return;
        }
    };

    const handleMouseDown = (event: React.MouseEvent) => {
        // handleArrowKeyDown();
        if(!isCommentEnabled) return;
        if(isSelected) {
            event.preventDefault();
            return;
        }
        setIsMouseDown(true);
    }

    const handleMouseUp = (event: React.MouseEvent) => {
        const selection = window.getSelection();
        const commentField = document.getElementById('comment-text-field');
        let indexFrom;
        let indexTo;
        if(selection) {
            if(selection?.anchorOffset === selection?.focusOffset) {
                // setIsMouseDown(false);
                return;
            }
            if(selection.anchorOffset > selection.focusOffset) {
                indexFrom = selection.focusOffset;
                indexTo = selection.anchorOffset;
            } else {
                indexFrom = selection.anchorOffset;
                indexTo = selection.focusOffset;
            }
            setIsSelected(true);
            hightlightSelectionAfterBlur(indexFrom, indexTo);
            handleTextSelection(segment.id, indexFrom, indexTo);
        }
    };

    const handleBlur = () => {
        const copySegment = JSON.parse(JSON.stringify(segment));
        const wordsInSegment: HTMLCollection = document.getElementsByClassName(`segment-${segmentIndex}`);
        let transcript = '';
        if(isChanged && playingLocation.segmentIndex !== segmentIndex) {
            Array.from(wordsInSegment).forEach((wordEl: Element, index: number) => {
                transcript += wordEl.innerHTML;
                copySegment.wordAlignments[index].word = wordEl.innerHTML;
            });
            updateSegment(segment.id, copySegment.wordAlignments, segment.transcript, segmentIndex);
            setIsChanged(false);
        }
    };

    const handleUndo = () => {
        if(undoStack.length > 0) {
            const updateUndoStack = undoStack.slice();
            const updateRedoStack = redoStack.slice();
            const updateWordAlignments = wordAlignments.slice();
            const undoData = updateUndoStack.pop();

            if(!!undoData?.wordIndex) {
                const wordNode = document.getElementById(`word-${segmentIndex}-${undoData.wordIndex}`);
                if(wordNode) wordNode.innerHTML = undoData.word;
                setWordAlignments(updateWordAlignments);
                setUndoStack(updateUndoStack);
                setRedoStack([...redoStack, undoData]);
                onUpdateUndoRedoStack(updateUndoStack.length > 0, true);
            }
        }
    };

    const handleRedo = () => {
        if(redoStack.length > 0) {
            const updateUndoStack = undoStack.slice();
            const updateRedoStack = redoStack.slice();
            const updateWordAlignments = wordAlignments.slice();
            const redoData = updateRedoStack.pop();

            if(!!redoData?.wordIndex) {
                const wordNode = document.getElementById(`word-${segmentIndex}-${redoData.wordIndex}`);
                if(wordNode) wordNode.innerHTML = redoData.word;
                setWordAlignments(updateWordAlignments);
                setRedoStack(updateRedoStack);
                setUndoStack([...redoStack, redoData]);
                onUpdateUndoRedoStack(true, updateRedoStack.length > 0);
            }
        }
    }

    React.useEffect(() => {
        if(undoStack.length > 0 && editorCommand === EDITOR_CONTROLS.undo) {
            handleUndo();
        };
        if(redoStack.length > 0 && editorCommand === EDITOR_CONTROLS.redo) {
            handleRedo();
        }
        // if(undoRedoData && undoRedoData.location.length && segmentIndex == undoRedoData.location[0]) {
        //     if(editorCommand === EDITOR_CONTROLS.undo) handleUndoCommand();
        //     if(editorCommand === EDITOR_CONTROLS.redo) handleRedoCommand();
        //     onUpdateUndoRedoStack(getUndoStack().length > 0, getRedoStack().length > 0)
        //     setEditorCommandForWordBlock(editorCommand);
        // }
    },[editorCommand]);

    React.useEffect(() => {
        if(!isSelected) initTranscriptToRender();
    }, [])

    React.useEffect(() => {
        setWordAlignments(segment.wordAlignments);
    }, [segment])

    React.useEffect(() => {
        if(!isAbleToComment && isMouseDown) {
            setIsMouseDown(false);
        }
    }, [isAbleToComment])

    React.useEffect(() => {
        if(!isCommentEnabled) {
            if(isMouseDown) {
                setIsMouseDown(false);
                setIsSelected(false);
                initTranscriptToRender();
            }
        }
    }, [isCommentEnabled]);

    React.useEffect(() => {
        if(isShowComment) {
            highlightRejectReason();
            setIsMouseDown(true);
        }
        return () => {
            setIsMouseDown(false);
        }
    }, [isShowComment]);

    return (

        <div
            contentEditable
            id={`segment-${segmentIndex}`}
            className={playingLocation.segmentIndex === segmentIndex ? `${classes.segment} ${classes.playingSegment}` : classes.segment}
            ref={element}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}>
            {
                isMouseDown ?
                    <div>
                        {transcriptToRender}
                    </div>
                    :
                    wordAlignments && wordAlignments.map((wordAlignment: WordAlignment, index: number) => {
                        const text = wordAlignment.word.replace('|', ' ');
                        return (
                            <div id={`word-${segmentIndex}-${index}`}
                                 className={playingLocation.segmentIndex === segmentIndex && playingLocation.wordIndex === index
                                     ? `word segment-${segmentIndex} ${classes.playingWord}` : `word segment-${segmentIndex}`}>
                                {text}
                            </div>
                        )
                    })

            }
        </div>
    );
};
