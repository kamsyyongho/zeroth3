import { Button, Grid } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import TextareaAutosize from '@material-ui/core/TextareaAutosize';
import CheckIcon from '@material-ui/icons/Check';
import DeleteIcon from '@material-ui/icons/Delete';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
//@ts-ignore
import Highlightable from 'highlightable';
import { useSnackbar } from 'notistack';
import React from 'react';
import ScaleLoader from 'react-spinners/ScaleLoader';
import { VALIDATION } from '../../../constants';
import { ApiContext } from '../../../hooks/api/ApiContext';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { Segment, SnackbarError, Time, Word, WordsbyRangeStartAndEndIndexes } from '../../../types';
import log from '../../../util/log/logger';
import { getRandomColor } from '../../../util/misc';
import { HighRiskSegmentWordPopper } from './HighRiskSegmentWordPopper';

const useStyles = makeStyles((theme) =>
  createStyles({
    spacing: {
      marginTop: 25,
    },
    textArea: { 
      minWidth: 400,
      fontSize: 16,
    },
  }),
);

interface HighRiskSegmentEditProps {
  segments: Segment[];
  segmentIndex: number;
  totalLength: number;
  createWordTimeSection: (wordToAddTimeTo: Word, timeToCreateAt: number, wordKey: string) => void;
  deleteWordTimeSection: (segmentIdToDelete: string) => void;
  updateWordTimeSection: (wordToAddTimeTo: Word, startTime: number, endTime: number, wordKey: string) => void;
  onWordOpen: (openWordKey: string) => void;
  projectId: string;
  dataId: string;
  onReset: () => void;
  onWordClose: () => void;
  onClose: () => void;
  onSuccess: (updatedSegment: Segment, segmentIndex: number) => void;
  updateWords: (newWordValues: WordsbyRangeStartAndEndIndexes) => void;
  setDisabledTimes: (disabledTimes: Time[]) => void;
  words: WordsbyRangeStartAndEndIndexes;
}

interface Range {
  start: number;
  end: number; // this value used as rangeIndex
  text: string;
  data?: unknown; // the parent component props
}

/** used to prevent the popper from opening after rerendering the ranges after deletion */
let wasDeleted = false;

/** the animation time for the word popper */
const DEFAULT_FADE_TIME = 350;

/** how much to change the time when pressing the popper buttons */
const DEFAULT_TIME_INCREMENT = 0.01;

/** 
 * Keeps track of the most up-to-date word values from the parent
 * - gets around issues with the state update lifecycle
 */
let internalWordsTracker: WordsbyRangeStartAndEndIndexes = {};

export function HighRiskSegmentEdit(props: HighRiskSegmentEditProps) {
  const {
    updateWords,
    setDisabledTimes,
    createWordTimeSection,
    deleteWordTimeSection,
    updateWordTimeSection,
    onWordOpen,
    onReset,
    onWordClose,
    onClose,
    onSuccess,
    words,
    segments,
    segmentIndex,
    totalLength,
    projectId,
    dataId,
  } = props;
  const segment = segments[segmentIndex];
  const { translate } = React.useContext(I18nContext);
  const api = React.useContext(ApiContext);
  const { enqueueSnackbar } = useSnackbar();
  const [ranges, setRanges] = React.useState<Range[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = React.useState(false);
  const [isError, setIsError] = React.useState(false);
  const [text, setText] = React.useState(segment.transcript || '');
  const [isTextLocked, setIsTextLocked] = React.useState(false);
  const [popperWord, setPopperWord] = React.useState<Word | undefined>();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  // to remove the anchor on unmount
  React.useEffect(() => {
    return () => {
      setAnchorEl(null);
    };
  }, []);

  /**
   * gets any time that is not part of the current segment 
   * - used to set the unplayable areas of the audio
   */
  const getInvalidAudioTimes = () => {
    const disabledTimes: Time[] = [];
    let isLastSegment = false;
    while (!isLastSegment && disabledTimes.length < 2) {
      isLastSegment = segmentIndex === segments.length - 1;
      let start = 0;
      let end = segment.start;
      if (disabledTimes.length) {
        start = segments[segmentIndex + 1].start;
        end = totalLength;
      }
      const time = {
        start,
        end,
      };
      disabledTimes.push(time);
    }
    return disabledTimes;
  };

  // to limit the audio boundaries to be within the segment
  React.useEffect(() => {
    const disabledTimes = getInvalidAudioTimes();
    setDisabledTimes(disabledTimes);
  }, []);

  React.useEffect(() => {
    internalWordsTracker = { ...words };
  }, [words]);

  const handleClose = () => {
    setLoading(true);
    // to allow the loading indicator to be displayed
    setTimeout(() => {
      onClose();
    }, 1);
  };

  const handleAnchorClick = (event: React.MouseEvent<HTMLElement>) => {
    wasDeleted = false;
    if (!anchorEl) {
      setAnchorEl(event.currentTarget);
    }
  };

  const openPopper = () => setIsOpen(true);
  const closePopper = () => setIsOpen(false);

  const handlePopperClose = () => {
    closePopper();
    // to account for the popper fade time
    setTimeout(() => {
      setPopperWord(undefined);
    }, DEFAULT_FADE_TIME);
    onWordClose();
  };

  const getWordKey = (range: Range) => {
    const wordKey = `${range.start}-${range.end}`;
    return wordKey;
  };

  const getWordFromId = (range: Range): Word | undefined => {
    const wordKey = getWordKey(range);
    return internalWordsTracker[wordKey];
  };

  const preparePopper = (word: Word) => {
    setPopperWord(word);
    openPopper();
    const wordKey = getWordKey(word.range);
    onWordOpen(wordKey);
  };

  const handleRangeClick = (range: Range) => {
    const word = getWordFromId(range);
    if (word) {
      preparePopper(word);
    }
  };

  const handleAutoPopperOpen = (range: Range) => {
    if (!wasDeleted) {
      handleRangeClick(range);
    }
  };

  const sortSelectedWords = (words: WordsbyRangeStartAndEndIndexes): Word[] => {
    const wordsArray: Word[] = Object.keys(words).map(key => words[key]);
    wordsArray.sort((a, b) => (a.range.start < b.range.start) ? -1 : 1);
    return wordsArray;
  };

  const checkIfAllWordsHaveTimes = (wordsArray: Word[]): boolean => {
    // to remove any non-words in case they end up in the array
    const filteredArray = wordsArray.filter(word => !!word);
    return filteredArray.every(word => {
      if (word && typeof word.time?.start === 'number' && typeof word.time?.end === 'number') {
        return true;
      }
      return false;
    });
  };

  const getWithinSegmentTimes = (absoluteTime: number): number => {
    const adjustedTime = absoluteTime - segment.start;
    return adjustedTime;
  };

  const classes = useStyles();
  const theme = useTheme();

  const setFreeText = async () => {
    if (api?.voiceData && !isError && !isSubmitLoading && text.trim().length) {
      setIsSubmitLoading(true);
      setIsError(false);
      const response = await api.voiceData.setFreeTextTranscript(projectId, dataId, segment.id, text.trim());
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        onSuccess(response.segment, segmentIndex);
        const { wordAlignments } = response.segment;
        const text = wordAlignments[0].word || '';
        setText(text);
        setIsTextLocked(true);
      } else {
        log({
          file: `HighRiskSegmentEdit.tsx`,
          caller: `setFreeText - failed to set free text`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        setIsError(true);
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: 'error' });
      setIsSubmitLoading(false);
    }
  };

  const mergeWords = async () => {
    if (api?.voiceData && !isSubmitLoading) {
      setIsSubmitLoading(true);
      setIsError(false);
      const response = await api.voiceData.mergeWordsInSegment(projectId, dataId, segment.id, 0, 1);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: 'success' });
        //!
        //TODO
        //* DO SOMETHING
      } else {
        log({
          file: `HighRiskSegmentEdit.tsx`,
          caller: `mergeWords - failed to merge words`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        setIsError(true);
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: 'error' });
      setIsSubmitLoading(false);
    }
  };

  const splitWord = async () => {
    if (api?.voiceData && !isSubmitLoading) {
      const sortedWords = sortSelectedWords(internalWordsTracker);
      if (!sortedWords.length) {
        return;
      }
      const allWordsHaveTimes = checkIfAllWordsHaveTimes(sortedWords);
      if (!allWordsHaveTimes) {
        enqueueSnackbar(translate('editor.validation.missingTimes'), { variant: 'error' });
        return;
      }
      setIsSubmitLoading(true);
      setIsError(false);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      let returnedSegment: Segment | undefined;
      for (let i = sortedWords.length - 1; i >= 0; i--) {
        const word = sortedWords[i];
        const splitCharacterIndex = word.range.start;
        const splitTime = getWithinSegmentTimes(word.time?.start as number);
        // because we're going from the last word to the first,
        // the main word group to break off from will the the first
        const wordAlignmentIndex = 0;
        const response = await api.voiceData.splitWordInSegment(projectId, dataId, segment.id, splitCharacterIndex, splitTime, wordAlignmentIndex);
        snackbarError = {} as SnackbarError;
        if (response.kind === 'ok') {
          snackbarError = undefined;
          returnedSegment = response.segment;
        } else {
          log({
            file: `HighRiskSegmentEdit.tsx`,
            caller: `splitWord - failed to split word`,
            value: response,
            important: true,
          });
          returnedSegment = undefined;
          snackbarError.isError = true;
          setIsError(true);
          const { serverError } = response;
          if (serverError) {
            snackbarError.errorText = serverError.message || "";
          }
          break;
        }
      }
      if (snackbarError?.isError) {
        enqueueSnackbar(snackbarError.errorText, { variant: 'error' });
      } else {
        enqueueSnackbar(translate('common.success'), { variant: 'success' });
        if (returnedSegment) {
          onSuccess(returnedSegment, segmentIndex);
          handleClose();
        }
      }
      setIsSubmitLoading(false);
    }
  };

  /**
   * Unselects any selected text
   * - the highlight text library does not deselct text if we trim
   */
  const deselectAllText = () => window.getSelection()?.removeAllRanges();

  const removeRange = (rangeToRemove: Range) => {
    wasDeleted = true;
    setRanges((prevRange) => {
      const newRange = [...prevRange];
      for (let i = 0; i < newRange.length; i++) {
        const range = newRange[i];
        if (range.end === rangeToRemove.end &&
          range.start === rangeToRemove.start) {
          newRange.splice(i, 1);
          break;
        }
      }
      return newRange;
    });
    const wordKey = getWordKey(rangeToRemove);
    const wordsCopy = { ...internalWordsTracker } || {};
    const newWords = { ...wordsCopy };
    delete newWords[wordKey];
    updateWords(newWords);
    deleteWordTimeSection(wordKey);
  };

  /**
   * trims any space characters from the range and
   * adjusts the start and end positions accordingly
   * @param rangeToTrim 
   * @returns `null` if the range is empty after trimming
   */
  const trimRangeContent = (rangeToTrim: Range): Range | null => {
    const { text, start, end } = rangeToTrim;
    const trimmedText = text.trim();
    if (!trimmedText.length) {
      deselectAllText();
      return null;
    }
    if (text.length === trimmedText.length) {
      return rangeToTrim;
    }
    let startCounter = 0;
    let endCounter = 0;
    for (let i = 0; i < text.length; i++) {
      const character = text[i];
      if (character === ' ') {
        startCounter++;
      } else {
        break;
      }
    }
    for (let i = text.length - 1; i >= 0; i--) {
      const character = text[i];
      if (character === ' ') {
        endCounter++;
      } else {
        break;
      }
    }
    const updatedStart = start + startCounter;
    const updatedEnd = end - endCounter;
    const updatedRange = {
      ...rangeToTrim,
      start: updatedStart,
      end: updatedEnd,
      text: trimmedText,
    };
    deselectAllText();
    return updatedRange;
  };


  const rangeAlreadyExistsCheck = (rangeToCheck: Range) => {
    if (!ranges.length) return false;
    const { start, end } = rangeToCheck;
    const alreadyExists = ranges.some(range => {
      // to prevent overlapping with an existing range
      if (
        (start === range.start) ||
        (end === range.end) ||
        (start >= range.start && start <= range.end) ||
        (end >= range.start && end <= range.end) ||
        (start <= range.start && !(end <= range.start)) ||
        (start <= range.end && !(end <= range.end))
      ) {
        return true;
      }
      return false;
    });
    return alreadyExists;
  };

  const onTextHighlighted = (range: Range) => {
    wasDeleted = false;
    if (isNaN(range.start) || isNaN(range.end)) {
      enqueueSnackbar(translate('editor.validation.invalidRange'), { variant: 'error' });
      deselectAllText();
      return;
    }
    const trimmedRange = trimRangeContent(range);
    if (trimmedRange === null) {
      return;
    }
    if (rangeAlreadyExistsCheck(trimmedRange)) {
      return;
    }
    setRanges((prevRange) => {
      const newRange = [...prevRange];
      newRange.push(trimmedRange);
      return newRange;
    });
    const wordKey = getWordKey(trimmedRange);
    const color = getRandomColor();
    const newWord: Word = {
      range: trimmedRange,
      color,
    };
    const wordsCopy = { ...internalWordsTracker } || {};
    const newWords = { ...wordsCopy, [wordKey]: newWord };
    updateWords(newWords);
    preparePopper(newWord);
  };

  const getRangeHighlightColor = (range: Range) => {
    const wordKey = `${range.start}-${range.end}`;
    const word = words[wordKey];
    let color: string | undefined = undefined;
    if (words) {
      color = word.color;
    }
    return color;
  };

  const deleteWord = () => {
    handlePopperClose();
    if (popperWord?.range) {
      removeRange(popperWord.range);
    }
  };


  const onMouseOverHighlightedWord = (range: Range) => {
    console.log('onMouseOverHighlightedWord', range);
  };

  const onMouseOverHighlightedWordCallback = () => {
    console.log('onMouseOverHighlightedWordCallback');
  };

  const rangeRenderer = (currentRenderedNodes: any, currentRenderedRange: any, currentRenderedIndex: any, onMouseOverHighlightedWord: any) => {
    console.log('currentRenderedNodes', currentRenderedNodes);
    console.log('currentRenderedRange', currentRenderedRange);
    console.log('currentRenderedIndex', currentRenderedIndex);
    console.log('onMouseOverHighlightedWord', onMouseOverHighlightedWord);
  };


  const tooltipRenderer = (lettersNode: any, range: any, rangeIndex: any, onMouseOverHighlightedWord: any) => {
    // rangeRenderer(lettersNode, range, rangeIndex, onMouseOverHighlightedWord);
    handleAutoPopperOpen(range);
    return (<span
      key={`${range.data.id}-${rangeIndex}`}
      onClick={() => handleRangeClick(range)}
      onMouseEnter={() => handleRangeClick(range)}
    >
      {lettersNode}
    </span>
    );
  };

  function customRenderer(currentRenderedNodes: any, currentRenderedRange: any, currentRenderedIndex: any, onMouseOverHighlightedWord: any, ) {
    return tooltipRenderer(currentRenderedNodes, currentRenderedRange, currentRenderedIndex, onMouseOverHighlightedWord);
  }

  const createSegment = () => {
    if (!popperWord) return;
    const wordKey = getWordKey(popperWord.range);
    createWordTimeSection(popperWord, segment.start, wordKey);
  };

  const changeSegmentTime = (isStartTime: boolean, increment: boolean) => {
    if (!popperWord) return;
    let start = popperWord?.time?.start as number;
    let end = popperWord?.time?.end as number;
    if (typeof start !== 'number' || typeof end !== 'number') return;
    if (isStartTime) {
      start = start + (DEFAULT_TIME_INCREMENT * (increment ? 1 : -1));
      start = Number(start.toFixed(2));
    } else {
      end = end + (DEFAULT_TIME_INCREMENT * (increment ? 1 : -1));
      end = Number(end.toFixed(2));
    }
    const wordKey = getWordKey(popperWord.range);
    updateWordTimeSection(popperWord, start, end, wordKey);
  };

  const resetWords = () => {
    handlePopperClose();
    setText('');
    setIsTextLocked(!isTextLocked);
    setRanges([]);
    onReset();
  };

  const lockText = () => {
    if (text.trim().length) {
      setFreeText();
    }
    setText('');
  };

  const onTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const incomingText = event.target.value;
    if(incomingText.trim().length > VALIDATION.EDITOR.freeText.max){
      setIsError(true);
      enqueueSnackbar(
        translate('forms.validation.lessEqualTo',
        {target: translate('forms.length') , value: VALIDATION.EDITOR.freeText.max}),
        { variant: 'error', preventDuplicate: true });
    } else {
      setIsError(false);
      setText(incomingText);
    }
  }

  return (<Grid
    container
    spacing={3}
    direction="column"
    alignItems="center"
    justify="flex-start"
    alignContent='center'
    className={classes.spacing}
  >
    {loading ? <ScaleLoader
      height={50}
      width={10}
      radius={20}
      color={theme.palette.primary.main}
      loading={true}
    /> :
      (<>
        <Grid
          container
          item
          wrap='nowrap'
          direction='row'
          alignContent='center'
          alignItems='center'
          justify='center'
          spacing={3}
          className={classes.spacing}
          onClick={handleAnchorClick}
          onDoubleClick={handleAnchorClick}
        >
          <Grid item>
            {isTextLocked ? (
              <Highlightable ranges={ranges}
                enabled={isTextLocked}
                onTextHighlighted={onTextHighlighted}
                id={segment.id}
                // onMouseOverHighlightedWord={onMouseOverHighlightedWordCallback}
                // onMouseOverHighlightedWord={onMouseOverHighlightedWord}
                highlightStyle={{
                  backgroundColor: '#ffcc80'
                }}
                rangeRenderer={customRenderer}
                text={text}
              />
            ) : (
                <TextareaAutosize
                  id="high-risk-segment-free-type-text-area"
                  rowsMin={1}
                  rowsMax={10}
                  className={classes.textArea}
                  value={text}
                  onChange={onTextChange}
                />
              )}
          </Grid>
          <Grid item>
            <IconButton
              color={isTextLocked ? 'secondary' : 'primary'}
              size='small'
              aria-label="lock-text"
              disabled={isSubmitLoading || (!isTextLocked && isError)}
              onClick={isTextLocked ? resetWords : lockText}
            >
              {isTextLocked ? <DeleteIcon /> : <CheckIcon />}
            </IconButton>
          </Grid>
        </Grid>
        <Grid
          container
          item
          spacing={1}
          alignContent='center'
          alignItems='center'
          justify='center'
          className={classes.spacing}
        >
          <Grid item >
            <Button
              color='primary'
              variant='outlined'
              onClick={handleClose}
            >
              {translate('common.back')}
            </Button>
          </Grid>
          <Grid item >
            <Button
              color='primary'
              variant='contained'
              onClick={splitWord}
              disabled={!isTextLocked || isError || isSubmitLoading}
            >
              {translate('common.submit')}
            </Button>
          </Grid>
        </Grid>
      </>)
    }
    {popperWord &&
      <HighRiskSegmentWordPopper
        isOpen={isOpen}
        word={popperWord}
        anchorEl={anchorEl}
        timeout={DEFAULT_FADE_TIME}
        createSegment={createSegment}
        deleteWord={deleteWord}
        changeSegmentTime={changeSegmentTime}
        handlePopperClose={handlePopperClose}
      />
    }
  </Grid>);
}
