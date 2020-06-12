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
        }
    }),
);

interface EditWordAlignmentBlockProps  {
    segment: Segment;
    segmentIndex: number;
    isAbleToComment: boolean;
    updateCaretLocation: (segmentIndex: number, wordIndex: number) => void;
    handleTextSelection: (segmentId: string, indexFrom: number, indexTo: number) => void;
}

let isFocused = false;

export function EditWordAlignmentBlock(props: EditWordAlignmentBlockProps)  {
    const classes = useStyles();
    const {  segment, segmentIndex, isAbleToComment, updateCaretLocation, handleTextSelection } = props;
    const api = React.useContext(ApiContext);
    const theme: CustomTheme = useTheme();
    const [isMouseDown, setIsMouseDown] = React.useState<boolean>(false);
    const element = useRef(null);


    const handleArrowKeyDown = () => {
        console.log('=====================caretlocation', getSegmentAndWordIndex());
        const playingLocation = getSegmentAndWordIndex();
        if(playingLocation) {
            updateCaretLocation(playingLocation[0], playingLocation[1]);
            return;
        }
    }

    const handleFocus = () => {

    }

    const handleSelectionChange = (event: React.KeyboardEvent) => {
        console.log(event);
        return;
    }

    const handleKeyDown = (event: React.KeyboardEvent) => {
        if(isMouseDown) event.preventDefault();
        console.log('event keydown : ', event.key);
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
        const selection = window.getSelection();
        setIsMouseDown(true)
        console.log('=========selection mouse Down : ', selection);
    }

    const handleMouseUp = (event: React.MouseEvent) => {
        const selection = window.getSelection();
        console.log('======-=======selectionMouseUP', selection);
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
            handleTextSelection(segment.id, indexFrom, indexTo);
        }
    }


    React.useEffect(() => {
    }, [])

    React.useEffect(() => {
        if(!isAbleToComment && isMouseDown) {
            setIsMouseDown(false);
        }
    }, [isAbleToComment])

    return (
        // <div dangerouslySetInnerHTML={{ __html: word }}>
        // </div>
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
                        {segment.transcript}
                    </div>
                    :
                    segment.wordAlignments.map((wordAlignment: WordAlignment, index: number) => {
                        return (
                            <div id={`word-${segmentIndex}-${index}`} onFocus={() => console.log('focus : ', wordAlignment)}>
                                {wordAlignment.word}
                            </div>
                        )
                    })

            }
            {/*{
                segment.wordAlignments.map((wordAlignment: WordAlignment, index: number) => {
                    return (
                        <div id={`word-${segmentIndex}-${index}`} onFocus={() => console.log('focus : ', wordAlignment)}>
                            {wordAlignment.word}
                        </div>
                    )
                })
            }*/}
        </div>
    );
};
