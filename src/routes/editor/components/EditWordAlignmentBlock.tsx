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
        }
    }),
);

interface EditWordAlignmentBlockProps  {
    segment: Segment;
    segmentIndex: number;
    updateCaretLocation: (segmentIndex: number, wordIndex: number) => void;
}

let isFocused = false;

export function EditWordAlignmentBlock(props: EditWordAlignmentBlockProps)  {
    const classes = useStyles();
    const {  segment, segmentIndex, updateCaretLocation } = props;
    const api = React.useContext(ApiContext);
    const theme: CustomTheme = useTheme();
    const element = useRef(null);


    const handleArrowKeyDown = () => {
        console.log('', getSegmentAndWordIndex());
        const playingLocation = getSegmentAndWordIndex();
        if(playingLocation) {
            updateCaretLocation(playingLocation[0], playingLocation[1])
        }
    }

    const handleFocus = () => {

    }

    const handleKeyDown = (event: React.KeyboardEvent) => {
        console.log('event keydown : ', event.key);
        // switch (event.key) {
        //     case "ArrowUp":
        //     case "ArrowDown":
        //     case "ArrowLeft":
        //     case "ArrowRight":
        //         break;
        //     default:
        //         return;
        // }
    };

    const handleKeyUp = (event: React.KeyboardEvent) => {
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

    React.useEffect(() => {
        // element.addEventListener()
    }, [])

    return (
        // <div dangerouslySetInnerHTML={{ __html: word }}>
        // </div>
        <div contentEditable className={classes.segment} ref={element} onFocus={handleFocus} onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>
            {
                segment.wordAlignments.map((wordAlignment: WordAlignment, index: number) => {
                    return (
                        <div id={`word-${segmentIndex}-${index}`} onFocus={() => console.log('focus : ', wordAlignment)}>
                            {wordAlignment.word}
                        </div>
                    )
                })
            }
        </div>
    );
};
