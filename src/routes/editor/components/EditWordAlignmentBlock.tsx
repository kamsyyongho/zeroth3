import {createStyles, makeStyles, useTheme} from '@material-ui/core/styles';
import React, {useGlobal, useRef} from 'reactn';
import {CustomTheme} from '../../../theme/index';
import {green, pink} from '@material-ui/core/colors';
import {EDIT_TYPE, Segment, UndoRedoStack, WordAlignment} from "../../../types";
import {EDITOR_CONTROLS} from './EditorControls';
import {getSegmentAndWordIndex, isInputKey} from '../helpers/editor-page.helper';
import {useDispatch, useSelector} from 'react-redux';
import {setUndo} from '../../../store/modules/editor/actions';


const useStyles = makeStyles((theme: CustomTheme) =>
    createStyles({
        segment: {
            display: 'flex',
            flexDirection: 'row',
            flexFlow: 'column wrap',
            width: 'fit-content',
            maxWidth: '100%',
            caretStyle: 'block',
            // caretColor: 'white',
            textShadow: '0 0 4x #888',
            WebkiTextFillColor: 'transparent',
            whiteSpace: 'pre-wrap',
            paddingLeft: '5px',
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
    isDiff: boolean;
    isCommentEnabled: boolean;
    isShowComment: boolean;
    readOnly?: boolean;
    playingLocation: any;
    findWordAlignmentIndexToPrevSegment: (segmentIndex: number, currenLocation: number) => any,
    onUpdateUndoRedoStack: (canUndo: boolean, canRedo: boolean) => void;
    updateCaretLocation: (segmentIndex: number, wordIndex: number, isForce?: boolean) => void;
    updateSegment: (segmentId:string, wordAlignments: WordAlignment[], transcript: string, segmentIndex: number) => void;
    handleTextSelection: (segmentId: string, indexFrom: number, indexTo: number) => void;
    lengthBeforeBlock: number[],
}

let localWordForLengthComparison = '';

export function EditWordAlignmentBlock(props: EditWordAlignmentBlockProps)  {
    const classes = useStyles();
    const {
        editorCommand,
        segment,
        segmentIndex,
        isCommentEnabled,
        isDiff,
        isShowComment,
        readOnly,
        playingLocation,
        findWordAlignmentIndexToPrevSegment,
        onUpdateUndoRedoStack,
        updateSegment,
        updateCaretLocation,
        handleTextSelection,
        lengthBeforeBlock, } = props;
    const theme: CustomTheme = useTheme();
    const [autoSeekDisabled, setAutoSeekDisabled] = useGlobal('autoSeekDisabled');
    const [wordConfidenceThreshold, setWordConfidenceThreshold] = useGlobal('wordConfidenceThreshold');
    const [shouldSeek, setShouldSeek] = useGlobal('shouldSeek');
    const [isMouseDown, setIsMouseDown] = React.useState<boolean>(false);
    const [isSelected, setIsSelected] = React.useState<boolean>(false);
    const [selectedIndex, setSelectedIndex] = React.useState<SelectedIndex>();
    const [transcriptToRender, setTranscriptToRender] = React.useState<any>();
    const element = useRef<HTMLDivElement>(null);
    const [wordAlignments, setWordAlignments] = React.useState<WordAlignment[]>([] as WordAlignment[]);
    const [isChanged, setIsChanged] = React.useState<boolean>(false);
    const [undoStack, setUndoStack] = React.useState<UndoRedoStack>([] as UndoRedoStack);
    const [redoStack, setRedoStack] = React.useState<UndoRedoStack>([] as UndoRedoStack);
    const segments = useSelector((state: any) => state.editor.segments);
    const dispatch = useDispatch();

    const initTranscriptToRender = () => {
        const inititalTranscript = (<span>{segment.transcript}</span>)
        setTranscriptToRender(inititalTranscript);
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

        if(!autoSeekDisabled && node) {
            const playingLocation = node.id.split('-');
            updateCaretLocation(Number(playingLocation[1]), Number(playingLocation[2]));
        }
    };

    const handleArrowLeft = () => {
        const selection = window.getSelection();
        if (!selection) return;
        const currentLocation = selection?.anchorOffset;
        const caretLocation = getSegmentAndWordIndex() || {segmentIndex : 0, wordIndex: 0};
        const previousWordNode = document.getElementById
        (`word-${segmentIndex}-${caretLocation.wordIndex - 1}`) || null;
        if(previousWordNode && currentLocation === 1) {
            setRange(previousWordNode, false);
        }
    };

    const handleArrowRight = () => {
        const selection = window.getSelection();
        if (!selection) return;
        const currentLocation = selection?.anchorOffset;
        const caretLocation = getSegmentAndWordIndex() || {segmentIndex : 0, wordIndex: 0};
        const nextWordNode = document.getElementById
        (`word-${segmentIndex}-${caretLocation.wordIndex + 1}`) || null;
        if(nextWordNode &&currentLocation === segment.wordAlignments[caretLocation.wordIndex].word.length) {
            setRange(nextWordNode, true);
        }
    };

    const handleArrowUp = (event: React.KeyboardEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setTimeout(() => {
            const selection = window.getSelection();
            if (!selection) return;
            const currentLocation = selection?.anchorOffset;
            const playingLocation = getSegmentAndWordIndex() || {segmentIndex : 0, wordIndex: 0};
            const wordAlignmentIndex = segmentIndex > 0 ? findWordAlignmentIndexToPrevSegment
            (segmentIndex - 1, currentLocation + lengthBeforeBlock[playingLocation.wordIndex]) : null;
            const previousSegmentNode = document.getElementById
            (`word-${segmentIndex - 1}-${wordAlignmentIndex}`) || null;
            const currentWordElement = document.getElementById
            (`word-${segmentIndex}-${playingLocation.wordIndex}`)
            const segmentElementPosition = document.getElementById(`segment-${segmentIndex}`)?.getBoundingClientRect();
            const wordElementPosition = currentWordElement?.getBoundingClientRect();

            if (!previousSegmentNode) { return; }

            if(Math.floor(segmentElementPosition?.top || 0) === Math.floor(wordElementPosition?.top || 0)) {
                setRange(previousSegmentNode, false);
            } else {
                const wordsInSegment = document.getElementsByClassName(`segment-${segmentIndex}`);
                let previousDiff = Math.abs((wordElementPosition?.x || 0)
                    - wordsInSegment[0].getBoundingClientRect().x);

                for(let i = 1; i < wordsInSegment.length - 1; i++) {
                    const currentWordPosition = wordsInSegment[i].getBoundingClientRect();
                    const nextWordPosition = wordsInSegment[i+1].getBoundingClientRect();
                    const currentDiff = Math.abs((wordElementPosition?.x || 0) - currentWordPosition.x);
                    const nextDiff = Math.abs((wordElementPosition?.x || 0) - nextWordPosition.x);

                    if((wordElementPosition?.bottom || 0) > currentWordPosition.bottom) {
                        const prevSegment = wordsInSegment[i] as HTMLElement;
                        if(currentDiff < previousDiff && currentDiff < nextDiff) {
                            setRange(prevSegment, false);
                            return
                        } else if(i === wordsInSegment.length - 2) {
                            setRange(prevSegment, false);
                        } else {
                            previousDiff = currentDiff;
                        }
                    }
                }
            }
        }, 0);
    };

    const handleArrowDown = (event: React.KeyboardEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setTimeout(() => {
            const selection = window.getSelection();
            if (!selection) return;
            const currentLocation = selection?.anchorOffset;
            const playingLocation = getSegmentAndWordIndex() || {segmentIndex : 0, wordIndex: 0};
            const wordAlignmentIndex = findWordAlignmentIndexToPrevSegment
            (segmentIndex + 1, currentLocation + lengthBeforeBlock[playingLocation.wordIndex]);
            const nextSegmentNode = document.getElementById
            (`word-${segmentIndex + 1}-${wordAlignmentIndex}`);
            const currentNode = element;
            selection ?.removeAllRanges();
            const range = document.createRange();
            const currentWordElement = document.getElementById
            (`word-${segmentIndex}-${playingLocation.wordIndex}`)
            const segmentElementPosition = document.getElementById(`segment-${segmentIndex}`)?.getBoundingClientRect();
            const wordElementPosition = currentWordElement?.getBoundingClientRect();

            if (!nextSegmentNode) { return; }

            if(Math.floor(segmentElementPosition?.bottom || 0) === Math.floor(wordElementPosition?.bottom || 0)) {
                setRange(nextSegmentNode, false);
            } else {
                const wordsInSegment = document.getElementsByClassName(`segment-${segmentIndex}`);
                let previousDiff = Math.abs((wordElementPosition?.x || 0)
                    - wordsInSegment[0].getBoundingClientRect().x);

                for(let i = 1; i < wordsInSegment.length - 1; i++) {
                    const currentWordPosition = wordsInSegment[i].getBoundingClientRect();
                    const nextWordPosition = wordsInSegment[i+1].getBoundingClientRect();
                    const currentDiff = Math.abs((wordElementPosition?.x || 0) - currentWordPosition.x);
                    const nextDiff = Math.abs((wordElementPosition?.x || 0) - nextWordPosition.x);

                    if((wordElementPosition?.bottom || 0) < currentWordPosition.bottom) {
                        const nextSegment = wordsInSegment[i] as HTMLElement;

                        if(currentDiff < previousDiff && currentDiff < nextDiff) {
                            setRange(nextSegment, false);
                            return
                        } else if(i === wordsInSegment.length - 2) {
                            setRange(nextSegment, false);
                        } else {
                            previousDiff = currentDiff;
                        }
                    }

                }
            }
        }, 0);

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

    const handleKeyDown = (event: React.KeyboardEvent) => {
        const location = getSegmentAndWordIndex();
        if(readOnly || isDiff || isMouseDown) {
            event.preventDefault();
        } else {
            switch (event.key) {
                case "ArrowUp":
                    handleArrowUp(event);
                    break;
                case "ArrowDown":
                    handleArrowDown(event);
                    break;
                case "ArrowLeft":
                    handleArrowLeft();
                    break;
                case "ArrowRight":
                    handleArrowRight();
                    break;
                default:
                    if(isInputKey(event.nativeEvent)) {
                        const word = document.getElementById(`word-${segmentIndex}-${location.wordIndex}`);
                        const position = window.getSelection();

                        if(localWordForLengthComparison.length === 0) {
                            localWordForLengthComparison = wordAlignments[location.wordIndex]['word'];
                        }
                        setIsChanged(true);
                        if(localWordForLengthComparison.length !== word?.innerText.length) {
                            dispatch(setUndo(segmentIndex, location.wordIndex, position?.focusOffset || 0, EDIT_TYPE.text, word?.innerText || ''));
                            localWordForLengthComparison = word?.innerText || '';
                        }
                    }
                    return;
            }
        }
    };

    const handleMouseDown = (event: React.MouseEvent) => {
        if(isCommentEnabled || isSelected) {
            event.preventDefault();
            return;
        }
        if(isDiff) {
            updateCaretLocation(segmentIndex, 0);
            setIsMouseDown(true);
        }
    }

    const handleMouseUp = (event: React.MouseEvent) => {
        setAutoSeekDisabled(true);
        const selection = window.getSelection();
        let indexFrom;
        let indexTo;
        if(isCommentEnabled || !isDiff) return;
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

    const handleDoubleClick = () => {
        const caretLocation = getSegmentAndWordIndex() || {segmentIndex, wordIndex : 0};
        setAutoSeekDisabled(false);
        setShouldSeek(false);
        updateCaretLocation(caretLocation.segmentIndex, caretLocation.wordIndex, true);
    };

    const handleBlur = () => {
        const copySegment = JSON.parse(JSON.stringify(segment));
        const wordsInSegment = document.getElementsByClassName(`segment-${segmentIndex}`);
        if(isChanged && playingLocation.segmentIndex !== segmentIndex) {
            Array.from(wordsInSegment).forEach((wordEl: Element, index: number) => {
                const htmlWord = wordEl as HTMLElement;
                copySegment.wordAlignments[index].word = htmlWord.innerText;
            });
            updateSegment(segment.id, copySegment.wordAlignments, segment.transcript, segmentIndex);
            setIsChanged(false);
        }
    };

    const handleSegmentUpdate = () => {
        const copySegment = JSON.parse(JSON.stringify(segment));
        const wordsInSegment = document.getElementsByClassName(`segment-${segmentIndex}`);
        Array.from(wordsInSegment).forEach((wordEl: Element, index: number) => {
            const htmlWord = wordEl as HTMLElement;
            copySegment.wordAlignments[index].word = htmlWord.innerText;
        });
        updateSegment(segment.id, copySegment.wordAlignments, segment.transcript, segmentIndex);
        setIsChanged(false);
    };

    React.useEffect(() => {
        if(!isSelected) initTranscriptToRender();
    }, []);

    React.useEffect(() => {
        setWordAlignments(segment.wordAlignments);
    }, [segment]);


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
            suppressContentEditableWarning={true}
            id={`segment-${segmentIndex}`}
            className={playingLocation.segmentIndex === segmentIndex ? `${classes.segment} ${classes.playingSegment}` : classes.segment}
            ref={element}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onDoubleClick={handleDoubleClick}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}>
            {
                isDiff && isMouseDown ?
                    <div>
                        {transcriptToRender}
                    </div>
                    :
                    wordAlignments && wordAlignments.map((wordAlignment: WordAlignment, index: number) => {
                        const isLongWord = wordAlignment.word.length > 15;
                        const confidence = wordAlignment?.confidence ?? 0;
                        const LC = confidence < (wordConfidenceThreshold ?? 0.85);
                        let style: React.CSSProperties = {};
                        if (!isDiff && playingLocation.segmentIndex !== segmentIndex && LC) {
                            style = { backgroundImage: theme.editor.LowConfidenceGradient, border: 'none' };
                        }
                        return (
                            <div id={`word-${segmentIndex}-${index}`}
                                 key={`word-${index}`}
                                 style={style}
                                 className={playingLocation.segmentIndex === segmentIndex && playingLocation.wordIndex === index
                                     ? `word segment-${segmentIndex} ${classes.playingWord}` : `word segment-${segmentIndex}`}>
                                {wordAlignment.word}
                            </div>
                        )
                    })
            }
        </div>
    );
};
