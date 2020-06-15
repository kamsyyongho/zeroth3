import {createStyles, makeStyles, useTheme} from '@material-ui/core/styles';
import React, { useGlobal, useRef } from 'reactn';
import {CustomTheme} from '../../../theme/index';
import {MemoizedSegmentBlockHeadV2} from './SegmentBlockHeadV2';
import {Segment, WordAlignment, UndoRedoData} from "../../../types";
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
            maxWidth: '100%',
            caretStyle: 'block',
            caretColor: 'red',
        },
        highlight: {
            backgroundColor: '#a8d0e3'
        }
    }),
);

interface SelectedIndex {
    indexFrom: number;
    indexTo: number;
}

interface EditWordAlignmentBlockProps  {
    segment: Segment;
    segmentIndex: number;
    isAbleToComment: boolean;
    isCommentEnabled: boolean;
    updateCaretLocation: (segmentIndex: number, wordIndex: number) => void;
    handleTextSelection: (segmentId: string, indexFrom: number, indexTo: number) => void;
}

let isFocused = false;

export function EditWordAlignmentBlock(props: EditWordAlignmentBlockProps)  {
    const classes = useStyles();
    const { segment, segmentIndex, isAbleToComment, isCommentEnabled, updateCaretLocation, handleTextSelection } = props;
    const api = React.useContext(ApiContext);
    const theme: CustomTheme = useTheme();
    const [isMouseDown, setIsMouseDown] = React.useState<boolean>(false);
    const [isSelected, setIsSelected] = React.useState<boolean>(false);
    const [selectedIndex, setSelectedIndex] = React.useState<SelectedIndex>();
    const [transcriptToRender, setTranscriptToRender] = React.useState<any>();
    const element = useRef<HTMLDivElement>(null);
    const [wordAlignments, setWordAlignments] = React.useState<string[]>([]);


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

    const handleSelectionChange = (event: React.KeyboardEvent) => {
        return;
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if(isMouseDown) event.preventDefault();
        switch (event.key) {
            case "ArrowUp":
            case "ArrowDown":
            case "ArrowLeft":
            case "ArrowRight":
                handleArrowKeyDown();
            default:
                return;
        }
    };

    const handleMouseDown = (event: React.MouseEvent) => {
        if(isSelected) {
            event.preventDefault()
            return;
        }
        const selection = window.getSelection();
        setIsMouseDown(true)
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

    return (

        <div
            contentEditable
            className={classes.segment}
            ref={element}
            onFocus={handleFocus}
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
                            <div id={`word-${segmentIndex}-${index}`}>
                                {text}
                            </div>
                        )
                    })

            }
        </div>
    );
};
