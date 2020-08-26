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
    const [isAbleToComment, setIsAbleToComment] = React.useState<boolean>(false);
    const editorElement = React.useMemo(() => document.querySelector('#scroll-container'), []);
    const segmentRef = React.useRef<HTMLDivElement | null>(null);
    const [editorContentHeight, setEditorContentHeight] = useGlobal('editorContentHeight');
    const [editorAutoScrollDisabled, setEditorAutoScrollDisabled] = useGlobal('editorAutoScrollDisabled');
    const [autoSeekDisabled, setAutoSeekDisabled] = useGlobal('autoSeekDisabled');
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

    const handleFocus = () => {
        isFocused = true
    };

    const handleBlur = async () => {
        if(isChanged) {
            await updateSegment(segment.id, localSegment.wordAlignments, localSegment.transcript, segmentIndex);
            setIsChanged(false);
        }
        if(!editorAutoScrollDisabled) {
            checkLocationOnScreenAndScroll(
                segmentRef.current,
                editorElement,
                editorContentHeight,
                windowHeight,
                editorAutoScrollDisabled);
        }
        isFocused = false;
    };

    const resetState = () => {
        setIsChanged(false);
    };

    React.useEffect(() => {
        if(!editorAutoScrollDisabled && isAudioPlaying && playingLocation.segmentIndex === segmentIndex) {
            checkLocationOnScreenAndScroll(
                segmentRef.current,
                editorElement,
                editorContentHeight,
                windowHeight,
                editorAutoScrollDisabled);
        }
    },[playingLocation]);

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
                onUpdateUndoRedoStack={onUpdateUndoRedoStack}
                updateCaretLocation={updateCaretLocation}
                updateSegment={updateSegment}
                handleTextSelection={handleTextSelection} />
        </div>
    );
};

export const MemoizedSegmentBlock = React.memo(SegmentBlockV2);
