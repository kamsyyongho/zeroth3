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
import {DECODER_DIFF_CLASSNAME} from '../../../constants';

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
        highlight: {
            backgroundColor: '#ffe190',
        }
    }),
);

interface DecoderSegmentBlockProps  {
    segment: Segment;
    segmentIndex: number;
    editorCommand?: EDITOR_CONTROLS;
    readOnly?: boolean;
    removeHighRiskValueFromSegment: (segmentId: string) => void;
    assignSpeakerForSegment: (segmentIndex:string) => void;
    playingLocation: any;
}

let isFocused = false;

const DecoderSegmentBlock = (props: DecoderSegmentBlockProps) => {
    const classes = useStyles();
    const {
        segment,
        segmentIndex,
        editorCommand,
        readOnly,
        removeHighRiskValueFromSegment,
        assignSpeakerForSegment,
        playingLocation } = props;
    const api = React.useContext(ApiContext);
    const theme: CustomTheme = useTheme();
    const [localSegment, setLocalSegment] = React.useState<Segment>(segment);
    const editorElement = React.useMemo(() => document.querySelector('#scroll-container'), []);
    const segmentRef = React.useRef<HTMLDivElement | null>(null);
    const [editorContentHeight, setEditorContentHeight] = useGlobal('editorContentHeight');
    const [editorAutoScrollDisabled, setEditorAutoScrollDisabled] = useGlobal('editorAutoScrollDisabled');
    const [lengthBeforeBlockArray, setLengthBeforeBlockArray] = React.useState<number[]>([]);
    const [decoderTranscriptAnimated, setDecoderTranscriptAnimated] = React.useState([]);
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

    const handleFocus = () => {
        isFocused = true
    };

    const handleBlur = async () => {
        checkLocationOnScreenAndScroll(
            segmentRef.current,
            editorElement,
            editorContentHeight,
            windowHeight,
            editorAutoScrollDisabled);
        isFocused = false;
    };

    const renderAnimatedTranscript = () => {
      const decoderTranscriptArray = segment.decoderTranscript.split(' ');
      const transcriptArray = segment.transcript.split(' ');
      let animated = [];
      let letterStack = '';
      for(let i = 0; i < decoderTranscriptArray.length; i++) {
          if(segment.transcript.includes(decoderTranscriptArray[i])) {
              letterStack += decoderTranscriptArray[i];
              if(i !== decoderTranscriptArray.length - 1) {
                  letterStack += ' ';
              }
              animated.push(letterStack)
              letterStack = '';
          } else {
              const animatedText = (
                  <span key={`decoder-diff-span-${i}`} className={`${classes.highlight + ' ' +  DECODER_DIFF_CLASSNAME}`}>{decoderTranscriptArray[i]}</span>
              )
              animated.push(animatedText);
          }
      }
      return animated;
    };

    React.useEffect(() => {
        setLocalSegment(segment);
        setLengthBeforeEachBlockArray();
    }, [segment]);
    return (
        <div className={classes.root} ref={segmentRef} onFocus={handleFocus} onBlur={handleBlur}>
            <MemoizedSegmentBlockHeadV2
                readOnly={readOnly}
                isChanged={false}
                assignSpeakerForSegment={assignSpeakerForSegment}
                setIsShowComment={setIsShowComment}
                removeHighRiskValueFromSegment={removeHighRiskValueFromSegment}
                segment={localSegment}
            />
            <span>{renderAnimatedTranscript()}</span>
        </div>
    );
};

export const MemoizedDecoderSegmentBlock = React.memo(DecoderSegmentBlock);
