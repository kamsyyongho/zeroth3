import { Button, Grid, TextField } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import CheckIcon from '@material-ui/icons/Check';
import DeleteIcon from '@material-ui/icons/Delete';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
//@ts-ignore
import Highlightable from 'highlightable';
import { useSnackbar } from 'notistack';
import React from 'react';
import ScaleLoader from 'react-spinners/ScaleLoader';
import { ApiContext } from '../../../hooks/api/ApiContext';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { Segment, SnackbarError, WordsbyRangeStartAndEndIndexes } from '../../../types';
import { Word } from '../../../types/editor.types';
import log from '../../../util/log/logger';
import { getRandomColor } from '../../../util/misc';
import { HighRiskSegmentWordPopper } from './HighRiskSegmentWordPopper';

const useStyles = makeStyles((theme) =>
  createStyles({
    root: {
      minHeight: '100vh',
    },
    spacing: {
      marginTop: 25,
    },
    hidden: {
      visibility: 'hidden',
    },
  }),
);

interface HighRiskSegmentEditProps {
  segment: Segment;
  createWordTimeSection: (wordToAddTimeTo: Word, timeToCreateAt: number, wordKey: string) => void;
  deleteWordTimeSection: (segmentIdToDelete: string) => void;
  updateWordTimeSection: (wordToAddTimeTo: Word, startTime: number, endTime: number, wordKey: string) => void;
  onWordOpen: (openWordKey: string) => void;
  projectId: string;
  dataId: string;
  onReset: () => void;
  onWordClose: () => void;
  onClose: () => void;
  updateWords: (newWordValues: WordsbyRangeStartAndEndIndexes) => void;
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
    createWordTimeSection,
    deleteWordTimeSection,
    updateWordTimeSection,
    onWordOpen,
    onReset,
    onWordClose,
    onClose,
    words,
    segment,
    projectId,
    dataId,
  } = props;
  const { translate } = React.useContext(I18nContext);
  const api = React.useContext(ApiContext);
  const { enqueueSnackbar } = useSnackbar();
  const [ranges, setRanges] = React.useState<Range[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [isSubmitLoading, setIsSubmitLoading] = React.useState(false);
  const [isError, setIsError] = React.useState(false);
  const [text, setText] = React.useState('|현대중공업도|동향이|보도가|난');
  // const [text, setText] = React.useState(segment.decoderTranscript || '');
  const [isTextLocked, setIsTextLocked] = React.useState(false);
  const [popperWord, setPopperWord] = React.useState<Word | undefined>();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  React.useEffect(() => {
    return () => {
      setAnchorEl(null);
    };
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
    return wordsArray.every(word => (word.time?.start && word.time?.end));
  };

  const getWithinSegmentTimes = (absoluteTime: number): number => {
    const adjustedTime = absoluteTime - segment.start;
    return adjustedTime;
  };

  const classes = useStyles();
  const theme = useTheme();

  const setFreeText = async () => {
    if (api?.voiceData && !isSubmitLoading && text.trim().length) {
      setIsSubmitLoading(true);
      setIsError(false);
      const response = await api.voiceData.setFreeTextTranscript(projectId, dataId, segment.id, text.trim());
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: 'success' });
        // onSuccess(response.modelConfig, isEdit);
        // handleClose();
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

  // const mergeWords = async () => {
  //   if (api?.voiceData && !isSubmitLoading) {
  //     setIsSubmitLoading(true);
  //     setIsError(false);
  //     const response = await api.voiceData.mergeWordsInSegment(projectId, dataId, segment.id, , );
  //     let snackbarError: SnackbarError | undefined = {} as SnackbarError;
  //     if (response.kind === 'ok') {
  //       snackbarError = undefined;
  //       enqueueSnackbar(translate('common.success'), { variant: 'success' });
  //       // onSuccess(response.modelConfig, isEdit);
  //       // handleClose();
  //     } else {
  //       log({
  //         file: `HighRiskSegmentEdit.tsx`,
  //         caller: `setFreeText - failed to set free text`,
  //         value: response,
  //         important: true,
  //       });
  //       snackbarError.isError = true;
  //       setIsError(true);
  //       const { serverError } = response;
  //       if (serverError) {
  //         snackbarError.errorText = serverError.message || "";
  //       }
  //     }
  //     snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: 'error' });
  //     setIsSubmitLoading(false);
  //   }
  // };

  console.log('internalWordsTracker', internalWordsTracker);
  console.log('checkIfAllWordsHaveTimes(sortSelectedWords(internalWordsTracker))', checkIfAllWordsHaveTimes(sortSelectedWords(internalWordsTracker)));

  const splitWord = async () => {
    if (api?.voiceData && !isSubmitLoading) {
      const sortedWords = sortSelectedWords(internalWordsTracker);
      if (!sortedWords.length) {
        return;
      }
      const allWordsHaveTimes = checkIfAllWordsHaveTimes(sortedWords);
      if (!allWordsHaveTimes) {
        //!
        //TODO
        //* DISPLAY SOME MESSAGE HERE
        //TODO
        //!
        return;
      }
      setIsSubmitLoading(true);
      setIsError(false);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
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
          // onSuccess(response.modelConfig, isEdit);
          // handleClose();
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
          break;
        }
      }
      if (snackbarError?.isError) {
        enqueueSnackbar(snackbarError.errorText, { variant: 'error' });
      } else {
        enqueueSnackbar(translate('common.success'), { variant: 'success' });
      }
      setIsSubmitLoading(false);
    }
  };

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

  const trimRangeContent = (rangeToTrim: Range): Range | null => {
    const { text, start, end } = rangeToTrim;
    const trimmedText = text.trim();
    if (!trimmedText.length) {
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
    // the highlight text library does not deselct text if we trim
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

  // function tooltipRenderer(lettersNode: any, range: any, rangeIndex: any, onMouseOverHighlightedWord: any) {
  //   rangeRenderer(lettersNode, range, rangeIndex, onMouseOverHighlightedWord);
  //   return (<Tooltip key={`${range.data.id}-${rangeIndex}`}
  //     // onVisibleChange={onMouseOverHighlightedWord}
  //     placement="top"
  //     trigger={'hover'}
  //     overlay={<Button onClick={() => removeRange(rangeIndex)} >{range.text}</Button>}
  //     defaultVisible={false}
  //     animation="zoom">
  //     <span>{lettersNode}</span>
  //   </Tooltip>);
  // }

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
      setIsTextLocked(true);
    }
    setText(text.trim());
  };

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
          item
          onClick={handleAnchorClick}
          onDoubleClick={handleAnchorClick}
        >
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

        </Grid>
        <Grid
          container
          item
          wrap='nowrap'
          direction='row'
          alignContent='center'
          alignItems='center'
          justify='center'
          className={classes.spacing}
        >
          <TextField
            id="high-risk-segment-free-type-text-field"
            // label="Read Only"
            fullWidth={false}
            style={{ minWidth: 200 }}
            disabled={isTextLocked}
            value={text}
            onChange={(event) => setText(event.target.value)}
          // InputProps={{
          //   readOnly: isTextLocked,
          // }}
          />
          <IconButton
            // className={memo !== rawMemo ? undefined : classes.hidden}
            // disabled={loading}
            color={isTextLocked ? 'secondary' : 'primary'}
            size='small'
            aria-label="lock-text"
            onClick={isTextLocked ? resetWords : lockText}
          >
            {isTextLocked ? <DeleteIcon /> : <CheckIcon />}
          </IconButton>
        </Grid>
        <Grid
          container
          item
          spacing={2}
          alignContent='center'
          alignItems='center'
          justify='center'
        >
          <Button onClick={handleClose} >Cancel</Button>
          <Button onClick={splitWord} >Submit</Button>
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
