import {createStyles, makeStyles, useTheme} from '@material-ui/core/styles';
import React, { useGlobal, useRef, useMemo } from 'reactn';
import {CustomTheme} from '../../../theme/index';
import { green, grey, pink, red } from '@material-ui/core/colors';
import {MemoizedSegmentBlockHeadV2} from './SegmentBlockHeadV2';
import {Segment, WordAlignment, UndoRedoStack, EDITOR_CONTROLS} from "../../../types";
import WordAlignmentBlock from './WordAlignmentBlock';
import { ApiContext } from '../../../hooks/api/ApiContext';
import log from '../../../util/log/logger';
import {getSegmentAndWordIndex } from '../helpers/editor.helper';
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
    updateCaretLocation: (segmentIndex: number, wordIndex: number) => void;
    updateSegment: (segmentId:string, wordAlignments: WordAlignment[], transcript: string, segmentIndex: number) => void;
    handleTextSelection: (segmentId: string, indexFrom: number, indexTo: number) => void;
    lengthBeforeBlock: number[],
}

let isFocused = false;

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
    const [wordAlignments, setWordAlignments] = React.useState<string[]>([]);
    const [isChanged, setIsChanged] = React.useState<boolean>(false);
    const [undoStack, setUndoStack] = React.useState<UndoRedoStack>([] as UndoRedoStack);
    const [redoStack, setRedoStack] = React.useState<UndoRedoStack>([] as UndoRedoStack);


    const memoizedSegmentClassName = React.useMemo(() => playingLocation[0] === segmentIndex ? `${classes.segment} ${classes.playingSegment}` : classes.segment, playingLocation)
    const memoizedWordClassName = React.useMemo(() => playingLocation[1] === segmentIndex ? `${classes.playingWord}` : '', playingLocation)


    const initTranscriptToRender = () => {
        const inititalTranscript = (<span>{segment.transcript}</span>)
        setTranscriptToRender(inititalTranscript);
    };

    const handleArrowKeyDown = () => {
        const playingLocation = getSegmentAndWordIndex();
        if(playingLocation) {
            updateCaretLocation(playingLocation[0], playingLocation[1]);
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
        (segmentIndex - 1, currentLocation + lengthBeforeBlock[playingLocation[1]]) : null;
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
        (segmentIndex + 1, currentLocation + lengthBeforeBlock[playingLocation[1]]);
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

    const handleArrowDownInSegment = () => {

    };

    const handleFocus = () => {

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
                    setIsChanged(true);
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
        if(isChanged) {
            Array.from(wordsInSegment).forEach((wordEl: Element, index: number) => {
                transcript += wordEl.innerHTML;
                copySegment.wordAlignments[index].word = wordEl.innerHTML;
            });
            updateSegment(segment.id, copySegment.wordAlignments, segment.transcript, segmentIndex);
            setIsChanged(false);
        }
    };

    React.useEffect(() => {
        if(undoRedoData && undoRedoData.location.length && segmentIndex == undoRedoData.location[0]) {
            if(editorCommand === EDITOR_CONTROLS.undo) handleUndoCommand();
            if(editorCommand === EDITOR_CONTROLS.redo) handleRedoCommand();
            onUpdateUndoRedoStack(getUndoStack().length > 0, getRedoStack().length > 0)
            setEditorCommandForWordBlock(editorCommand);
        }
    },[editorCommand]);

    React.useEffect(() => {
        if(!isSelected) initTranscriptToRender();
    }, [])

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
        const segmentNode = document.getElementById((`segment-${segmentIndex}`));
        console.log('=============== segment innerText  :', segmentNode?.textContent);

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
            className={memoizedSegmentClassName}
            ref={element}
            onFocus={handleFocus}
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
                    segment && segment.wordAlignments.map((wordAlignment: WordAlignment, index: number) => {
                        const text = wordAlignment.word.replace('|', ' ');
                        return (
                            <div id={`word-${segmentIndex}-${index}`}
                                 className={playingLocation[0] === segmentIndex && playingLocation[1] === index
                                     ? `word segment-${segmentIndex} ${classes.playingWord}` : `word segment-${segmentIndex}`}>
                                {text}
                            </div>
                        )
                    })

            }
        </div>
    );
};
