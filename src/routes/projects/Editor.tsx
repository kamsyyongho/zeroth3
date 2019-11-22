import { Button, Container, Grid } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import { createStyles, makeStyles, Theme, useTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import CallSplitIcon from '@material-ui/icons/CallSplit';
import LockIcon from '@material-ui/icons/Lock';
import LockOpenIcon from '@material-ui/icons/LockOpen';
import MergeTypeIcon from '@material-ui/icons/MergeType';
import PublishIcon from '@material-ui/icons/Publish';
import SaveIcon from '@material-ui/icons/Save';
import { useSnackbar } from 'notistack';
import React from "react";
import { BulletList } from 'react-content-loader';
import { FaEdit, FaGripLinesVertical } from 'react-icons/fa';
import { FiScissors } from 'react-icons/fi';
import AutosizeInput from 'react-input-autosize';
import { RouteComponentProps } from "react-router";
import { useHistory } from 'react-router-dom';
import MoonLoader from 'react-spinners/MoonLoader';
import { AutoSizer, CellMeasurer, CellMeasurerCache, List, ListRowProps } from 'react-virtualized';
import { ApiContext } from '../../hooks/api/ApiContext';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { NavigationPropsContext } from '../../hooks/navigation-props/NavigationPropsContext';
import { useWindowSize } from '../../hooks/window/useWindowSize';
import { CONTENT_STATUS, ModelConfig, Segment, VoiceData, WordAlignment } from '../../types';
import { PATHS } from '../../types/path.types';
import { SnackbarError } from '../../types/snackbar.types';
import log from '../../util/log/logger';
import { AudioPlayer } from '../shared/AudioPlayer';
import { ConfirmationDialog } from '../shared/ConfirmationDialog';
import { DualLabelSwitch } from '../shared/DualLabelSwitch';
import { Breadcrumb, HeaderBreadcrumbs } from '../shared/HeaderBreadcrumbs';
import { StarRating } from '../shared/StarRating';
import { SvgIconWrapper } from '../shared/SvgIconWrapper';


interface EditorProps {
  projectId: string;
  dataId: string;
}

export interface ModelConfigsById {
  [x: number]: ModelConfig;
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      flex: 1,
      padding: 0,
      height: '100%',
    },
    list: {
      outline: 'none', // removes the focus outline
    },
    segment: {
      padding: 10,
    },
    segmentTime: {
      color: '#939393',
    },
  }),
);

const virtualListCache = new CellMeasurerCache({
  fixedWidth: true,
  defaultHeight: 50,
});

/**
 * reference used to reset focus to the first input 
 * when tabbing should wrap around to the beginning
 */
let firstLCWordReference: HTMLInputElement | null = null;

/**
 * reference used to reset focus to the last input 
 * when shift-tabbing should wrap around to the end
 */
let lastLCWordReference: HTMLInputElement | null = null;

/**
 * ensures that the selected word will be correctly
 * highlighted when setting the audio player seek 
 * from a text input focus
 */
const SEEK_SLOP = 0.01;

const DEFAULT_LC_THRESHOLD = 0.5;

const WORD_KEY_SEPARATOR = '-';

const parseWordKey = (key: string) => {
  const [segmentIndex, wordIndex] = key.split(WORD_KEY_SEPARATOR);
  return { segmentIndex: Number(segmentIndex), wordIndex: Number(wordIndex) };
};

const generateWordKey = (segmentIndex: number, wordIndex: number) => {
  const key = `${segmentIndex}${WORD_KEY_SEPARATOR}${wordIndex}`;
  return key;
};

const formatSecondsDuration = (seconds: number) => {
  const milliseconds = 1000 * seconds;
  const tempDateString = new Date(milliseconds).toISOString();
  let timeStartIndex = 14; // MM:SS
  const HH = tempDateString.substr(timeStartIndex, 2); // HH
  let timeStringLength = 5; //MM:SS
  if (Number(HH) > 0) {
    timeStringLength = 8; // HH:MM:SS
    timeStartIndex = 11; // HH:MM:SS
  }
  return tempDateString.substr(timeStartIndex, timeStringLength);
};

interface SegmentWordProperties {
  [x: number]: {
    [x: number]: {
      edited?: boolean,
      focussed?: boolean;
    };
  };
}

interface SegmentSplitLocation {
  segmentId: number;
  segmentIndex: number;
  splitIndex: number;
}

export function Editor({ match }: RouteComponentProps<EditorProps>) {
  const { projectId, dataId } = match.params;
  const projectIdNumber = Number(projectId);
  const dataIdNumber = Number(dataId);
  const { translate } = React.useContext(I18nContext);
  const windowSize = useWindowSize();
  const history = useHistory();
  const api = React.useContext(ApiContext);
  const { getProps, clearProps } = React.useContext(NavigationPropsContext);
  const { enqueueSnackbar } = useSnackbar();
  const [canPlayAudio, setCanPlayAudio] = React.useState(false);
  const [playbackTime, setPlaybackTime] = React.useState(0);
  const [timeToSeekTo, setTimeToSeekTo] = React.useState<number | undefined>();
  const [splitLocation, setSplitLocation] = React.useState<SegmentSplitLocation | undefined>();
  const [isSegmentEdit, setIsSegmentEdit] = React.useState(false);
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);
  // to force a state change that will rerender the segment buttons
  const [numberOfSegmentsSelected, setNumberOfSegmentsSelected] = React.useState(0);
  const [isSegmentSplitMode, setIsSegmentSplitMode] = React.useState(false);
  const [HCEditable, setHCEditable] = React.useState(false);
  const [segmentsLoading, setSegmentsLoading] = React.useState(true);
  const [saveSegmentsLoading, setSaveSegmentsLoading] = React.useState(false);
  const [confirmSegmentsLoading, setConfirmSegmentsLoading] = React.useState(false);
  const [segments, setSegments] = React.useState<Segment[]>([]);
  const [initialSegments, setInitialSegments] = React.useState<Segment[]>([]);
  const [segmentWordProperties, setSegmentWordProperties] = React.useState<SegmentWordProperties>({});

  const theme = useTheme();
  const classes = useStyles();

  interface NavigationPropsToGet {
    projectName: string;
    voiceData: VoiceData;
  }

  const { projectName, voiceData } = getProps<NavigationPropsToGet>(['projectName', 'voiceData']);

  /**
   * used to keep track of which segments to send when updating
   */
  const editedSegmentIndexes = React.useMemo(() => new Set<number>(), []);

  /**
   * used to keep track of which segments are selected for merging
   */
  const segmentMergeIndexes = React.useMemo(() => new Set<number>(), []);

  /**
   * Only `CONFIRMED` data can be rated, so we won't show if not
   */
  const alreadyConfirmed = React.useMemo(() => voiceData && voiceData.status === CONTENT_STATUS.CONFIRMED, []);

  /**
   * navigates to the TDP page after confirming data
   */
  const handleNavigateAway = () => {
    PATHS.TDP.function && history.push(PATHS.TDP.function(projectIdNumber));
  };

  // to navigate away if we didn't navigate here from the TDP page
  if (!projectName || !voiceData) {
    handleNavigateAway();
  }

  // to clear any stored navigation props on component dismount
  React.useEffect(() => {
    return () => {
      clearProps();
    };
  }, []);

  // to keep track of word focus and to reset the loop while tabbing through
  let firstLCWordLocation: [number, number] = React.useMemo(() => [0, 0], []);
  let lastLCWordLocation: [number, number] = React.useMemo(() => [0, 0], []);
  let wordTabIndex = React.useMemo(() => 1, []);
  let firstLCWordTabIndex = React.useMemo<undefined | number>(() => undefined, []);
  let lastLCWordTabIndex = React.useMemo<undefined | number>(() => undefined, []);

  //!
  //TODO
  //* IMMEDIATELY REDIRECT IF USER DOESN'T HAVE THE CORRECT ROLES

  const openConfirmation = () => setConfirmationOpen(true);
  const closeConfirmation = () => setConfirmationOpen(false);

  const toggleSegmentEditMode = () => {
    setIsSegmentEdit(!isSegmentEdit);
    if (isSegmentEdit) {
      // to reset selected segments
      segmentMergeIndexes.clear();
      setIsSegmentSplitMode(false);
    }
  };

  const discardWordChanges = () => {
    setSegments(initialSegments);
    editedSegmentIndexes.clear();
    toggleSegmentEditMode();
    closeConfirmation();
  };

  const handleEditModeChange = () => {
    if (!isSegmentEdit && editedSegmentIndexes.size) {
      openConfirmation();
    } else {
      toggleSegmentEditMode();
    }
  };

  const handleSegmentToMergeClick = (segmentIndex: number) => {
    if (segmentMergeIndexes.has(segmentIndex)) {
      segmentMergeIndexes.delete(segmentIndex);
    } else if ((segmentMergeIndexes.size === 0) ||
      // to only select segments that are next to each other
      (Math.abs(segmentIndex - Array.from(segmentMergeIndexes)[0]) === 1)) {
      segmentMergeIndexes.add(segmentIndex);
    }
    setNumberOfSegmentsSelected(segmentMergeIndexes.size);
  };

  React.useEffect(() => {
    const getSegments = async () => {
      if (api && api.voiceData) {
        setSegmentsLoading(true);
        const response = await api.voiceData.getSegments(projectIdNumber, dataIdNumber);
        if (response.kind === 'ok') {
          setInitialSegments(response.segments);
          setSegments(response.segments);
        } else {
          log({
            file: `Editor.tsx`,
            caller: `getSegments - failed to get segments`,
            value: response,
            important: true,
          });
        }
        setSegmentsLoading(false);
      }
    };
    getSegments();
  }, [api, dataIdNumber, projectIdNumber]);

  const confirmData = async () => {
    if (api && api.voiceData && !alreadyConfirmed) {
      setConfirmSegmentsLoading(true);
      const response = await api.voiceData.confirmData(projectIdNumber, dataIdNumber);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: 'success' });
        // to allow the message to be displayed shortly before navigating away
        setTimeout(() => {
          handleNavigateAway();
        }, 1500);
      } else {
        log({
          file: `Editor.tsx`,
          caller: `confirmData - failed to confirm segments`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      snackbarError && snackbarError.isError && enqueueSnackbar(snackbarError.errorText, { variant: 'error' });
      setConfirmSegmentsLoading(false);
    }
  };

  const submitSegmentUpdates = async () => {
    if (api && api.voiceData && !alreadyConfirmed) {
      setSaveSegmentsLoading(true);

      // to build which segments to send
      const editedSegmentsToUpdate: Segment[] = [];
      editedSegmentIndexes.forEach(segmentIndex => editedSegmentsToUpdate.push(segments[segmentIndex]));

      const response = await api.voiceData.updateSegments(projectIdNumber, dataIdNumber, editedSegmentsToUpdate);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: 'success' });
        // to reset our list
        editedSegmentIndexes.clear();
        // reset our new default baseline
        setInitialSegments(segments);
      } else {
        log({
          file: `Editor.tsx`,
          caller: `submitSegmentUpdates - failed to update segments`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      snackbarError && snackbarError.isError && enqueueSnackbar(snackbarError.errorText, { variant: 'error' });
      setSaveSegmentsLoading(false);
    }
  };

  const submitSegmentMerge = async () => {
    if (numberOfSegmentsSelected !== 2) {
      return;
    }
    if (api && api.voiceData && segments.length && !alreadyConfirmed) {
      setSaveSegmentsLoading(true);

      const segmentIndexesToMerge: number[] = Array.from(segmentMergeIndexes);
      let firstSegmentIndex = 0;
      let secondSegmentIndex = 0;
      if (segmentIndexesToMerge[0] < segmentIndexesToMerge[1]) {
        firstSegmentIndex = segmentIndexesToMerge[0];
        secondSegmentIndex = segmentIndexesToMerge[1];
      } else {
        firstSegmentIndex = segmentIndexesToMerge[1];
        secondSegmentIndex = segmentIndexesToMerge[0];
      }

      const firstSegmentId = segments[firstSegmentIndex].id;
      const secondSegmentId = segments[secondSegmentIndex].id;

      const response = await api.voiceData.mergeTwoSegments(projectIdNumber, dataIdNumber, firstSegmentId, secondSegmentId);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: 'success' });
        // to reset our list
        segmentMergeIndexes.clear();
        setNumberOfSegmentsSelected(0);

        //cut out and replace the old segments
        const mergedSegments = [...segments];
        mergedSegments.splice(firstSegmentIndex, 2, response.segment);

        // reset our new default baseline
        setSegments(mergedSegments);
        setInitialSegments(mergedSegments);
        setIsSegmentEdit(false);
      } else {
        log({
          file: `Editor.tsx`,
          caller: `submitSegmentMerge - failed to merge segments`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      snackbarError && snackbarError.isError && enqueueSnackbar(snackbarError.errorText, { variant: 'error' });
      setSaveSegmentsLoading(false);
    }
  };

  const submitSegmentSplit = async () => {
    if (!splitLocation) return;
    if (api && api.voiceData && !alreadyConfirmed) {
      setSaveSegmentsLoading(true);
      const { segmentId, segmentIndex, splitIndex } = splitLocation;
      const response = await api.voiceData.splitSegment(projectIdNumber, dataIdNumber, segmentId, splitIndex);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === 'ok') {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: 'success' });

        // to reset our selected segment
        setSplitLocation(undefined);

        //cut out and replace the old segment
        const splitSegments = [...segments];
        const [firstSegment, secondSegment] = response.segments;
        splitSegments.splice(segmentIndex, 2, firstSegment, secondSegment);

        // reset our new default baseline
        setSegments(splitSegments);
        setInitialSegments(splitSegments);
        setIsSegmentEdit(false);
      } else {
        log({
          file: `Editor.tsx`,
          caller: `submitSegmentSplit - failed to split segment`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      snackbarError && snackbarError.isError && enqueueSnackbar(snackbarError.errorText, { variant: 'error' });
      setSaveSegmentsLoading(false);
    }
  };

  const handleSavePress = () => {
    if (isSegmentEdit) {
      if (isSegmentSplitMode) {
        submitSegmentSplit();
      }
      submitSegmentMerge();
    } else {
      submitSegmentUpdates();
    }
  };

  const calculateWordTime = (segmentIndex: number, wordIndex: number) => {
    const segment = segments[segmentIndex];
    const word = segment.wordAlignments[wordIndex];
    const segmentTime = segment.start;
    const wordTime = word.start;
    const totalTime = segmentTime + wordTime;
    return totalTime;
  };

  const calculateIsPlaying = (segmentIndex: number, wordIndex: number) => {
    if (!canPlayAudio) return false;

    const totalTime = calculateWordTime(segmentIndex, wordIndex);
    if (playbackTime < totalTime) {
      return false;
    }
    const isLastWord = !(wordIndex < segments[segmentIndex].wordAlignments.length - 1);
    const isLastSegment = !(segmentIndex < segments.length - 1);
    if (isLastWord && isLastSegment) {
      return true;
    }

    let nextTotalTime = totalTime;
    if (!isLastWord) {
      nextTotalTime = calculateWordTime(segmentIndex, wordIndex + 1);
    } else if (!isLastSegment) {
      nextTotalTime = calculateWordTime(segmentIndex + 1, 0);
    }
    if (playbackTime < nextTotalTime) {
      return true;
    }
    return false;
  };

  const updateSegmentsOnChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    segment: Segment,
    wordAlignment: WordAlignment,
    segmentIndex: number,
    wordIndex: number,
  ) => {
    // to allow us to use the original synthetic event multiple times
    // prevents a react error
    // See https://fb.me/react-event-pooling for more information. 
    event.persist();

    // to track which segments have been edited
    editedSegmentIndexes.add(segmentIndex);

    // update all segment values
    setSegments(prevSegments => {
      const updatedWord: WordAlignment = {
        ...wordAlignment,
        word: event.target.value,
      };
      const updatedWordAlignments = [...segment.wordAlignments];
      updatedWordAlignments.splice(wordIndex, 1, updatedWord);

      const updatedSegment = {
        ...segment,
        wordAlignments: updatedWordAlignments,
      };
      const updatedSegments = [...prevSegments];
      updatedSegments.splice(segmentIndex, 1, updatedSegment);

      return updatedSegments;
    });
  };

  const getWordFocussed = (segmentIndex: number, wordIndex: number) => {
    let focussed = false;
    if (segmentWordProperties && segmentWordProperties[segmentIndex] && segmentWordProperties[segmentIndex][wordIndex]) {
      focussed = !!segmentWordProperties[segmentIndex][wordIndex].focussed;
    }
    return focussed;
  };

  const getWordStyle = (focussed: boolean, isLC: boolean, isPlaying: boolean) => {
    let wordStyle: React.CSSProperties = {};
    const LC_COLOR = '#ffe369';
    if (!isLC) {
      wordStyle = {
        outline: 'none',
        border: 0,
      };
    } else {
      wordStyle = {
        boxShadow: 'none',
        borderColor: theme.palette.background.default,
        background: LC_COLOR,
      };
      if (focussed) {
        wordStyle = {
          borderColor: LC_COLOR,
          outlineColor: LC_COLOR, // remove the blue focus outline
          background: '#fafafa',
        };
      }
    }
    if (isPlaying) {
      wordStyle.background = 'red';
      wordStyle.color = isLC ? LC_COLOR : 'white';
    }
    return wordStyle;
  };


  // let maxTabIndex = React.useMemo(() => 0, []);

  /**
   * Determines if an input field can be accessed via tabbing
   * - Negative tab indexes are skipped when tabbing through fields
   * @param segmentIndex 
   * @param wordIndex 
   * @param isLC 
   */
  const getTabIndex = (segmentIndex: number, wordIndex: number, isLC: boolean) => {
    if (!isLC) {
      return -1;
    }
    const [maxSegmentIndex, maxWordIndex] = lastLCWordLocation;
    wordTabIndex++;
    if (segmentIndex > maxSegmentIndex) {
      lastLCWordLocation = [segmentIndex, wordIndex];
    } else if (segmentIndex === maxSegmentIndex && wordIndex > maxWordIndex) {
      lastLCWordLocation = [segmentIndex, wordIndex];
      if (lastLCWordTabIndex === undefined || lastLCWordTabIndex < wordTabIndex) {
        lastLCWordTabIndex = wordTabIndex;
      }
    }
    if (firstLCWordTabIndex === undefined) {
      firstLCWordTabIndex = wordTabIndex;
      firstLCWordLocation = [segmentIndex, wordIndex];
    }
    return wordTabIndex;
  };


  /**
   * Sets the the focus state of the the word based on its location in the segments
   * @param isFocussed - the focus state of the word
   */
  const setFocus = (segmentIndex: number, wordIndex: number, isFocussed = true) => {
    setSegmentWordProperties((prevValue) => {
      if (prevValue && prevValue[segmentIndex]) {
        if (prevValue[segmentIndex][wordIndex]) {
          prevValue[segmentIndex][wordIndex].focussed = isFocussed;
        } else {
          prevValue[segmentIndex][wordIndex] = {
            focussed: isFocussed,
          };
        }
      } else {
        prevValue[segmentIndex] = {
          [wordIndex]: {
            focussed: isFocussed,
          }
        };
      }
      return prevValue;
    });
  };

  const handleTabKeyCatch = (
    event: React.KeyboardEvent<HTMLInputElement>,
    segmentIndex: number,
    wordIndex: number,
  ) => {
    const [firstSegmentIndex, firstWordIndex] = firstLCWordLocation;
    const [lastSegmentIndex, lastWordIndex] = lastLCWordLocation;
    const isLast = segmentIndex === lastSegmentIndex && wordIndex === lastWordIndex;
    const isFirst = segmentIndex === firstSegmentIndex && wordIndex === firstWordIndex;
    if (isLast && !event.shiftKey && event.key === 'Tab') {
      event.preventDefault();
      firstLCWordReference && firstLCWordReference.focus();
    } else if (isFirst && event.shiftKey && event.key === 'Tab') {
      event.preventDefault();
      lastLCWordReference && lastLCWordReference.focus();
    }
  };

  /**
   * - sets the seek time in the audio player
   */
  const handleWordClick = (
    segmentIndex: number,
    wordIndex: number,
  ) => {
    const wordTime = calculateWordTime(segmentIndex, wordIndex);
    setTimeToSeekTo(wordTime + SEEK_SLOP);
  };

  /**
   * - sets which word is focussed
   * - refreshes all segments to force them to rerender
   * - sets the seek time in the audio player
   */
  const handleFocus = (
    segmentIndex: number,
    wordIndex: number,
  ) => {
    setFocus(segmentIndex, wordIndex);
    setSegments(prevSegments => ([...prevSegments]));
    handleWordClick(segmentIndex, wordIndex);
  };

  const handleBlur = (
    segmentIndex: number,
    wordIndex: number,
  ) => {
    setFocus(segmentIndex, wordIndex, false);
    setTimeToSeekTo(undefined);
    setSegments(prevSegments => ([...prevSegments]));
  };

  const handlePlayerRendered = () => setCanPlayAudio(true);

  const handleSplitLocationPress = (segmentId: number, segmentIndex: number, splitIndex: number) => {
    if (splitLocation && (
      (segmentId === (splitLocation.segmentId)) &&
      (segmentIndex === (splitLocation.segmentIndex)) &&
      (splitIndex === (splitLocation.splitIndex))
    )) {
      setSplitLocation(undefined);
    } else {
      setSplitLocation({
        segmentId,
        segmentIndex,
        splitIndex,
      });
    }
  };

  const renderWords = (segment: Segment, segmentIndex: number) => {
    const words = segment.wordAlignments.map((wordAlignment, wordIndex) => {
      const key = generateWordKey(segmentIndex, wordIndex);
      const isFocussed = getWordFocussed(segmentIndex, wordIndex);
      const isLC = wordAlignment.confidence < DEFAULT_LC_THRESHOLD;
      const isPlaying = calculateIsPlaying(segmentIndex, wordIndex);
      const wordStyle = getWordStyle(isFocussed, isLC, isPlaying);
      const tabIndex = getTabIndex(segmentIndex, wordIndex, isLC);

      const isFirst = firstLCWordTabIndex === tabIndex;
      const isLast = lastLCWordTabIndex === tabIndex;

      let isSplitSelected = false;
      if (splitLocation &&
        splitLocation.segmentId === segment.id &&
        splitLocation.segmentIndex === segmentIndex &&
        splitLocation.splitIndex === wordIndex) {
        isSplitSelected = true;
      }

      return (<React.Fragment key={key}>
        {isSegmentSplitMode && !!wordIndex && (
          <IconButton
            aria-label="split-button"
            size="small"
            color={isSplitSelected ? 'secondary' : 'primary'}
            onClick={() => handleSplitLocationPress(segment.id, segmentIndex, wordIndex)}
          >
            <SvgIconWrapper fontSize='inherit' >
              <FaGripLinesVertical />
            </SvgIconWrapper>
          </IconButton>
        )}
        <AutosizeInput
          inputRef={
            isFirst ?
              ((inputRef) => firstLCWordReference = inputRef) :
              (isLast ?
                ((inputRef) => lastLCWordReference = inputRef) : undefined)}
          disabled={isSegmentEdit || (!HCEditable && !isLC)}
          tabIndex={tabIndex}
          key={key}
          name={key}
          value={wordAlignment.word}
          minWidth={5}
          inputStyle={{
            ...theme.typography.body1, // font styling
            ...wordStyle,
            margin: theme.spacing(0.25),
          }}
          autoFocus={isFocussed}
          onClick={(event) => handleWordClick(segmentIndex, wordIndex)}
          onFocus={(event) => handleFocus(segmentIndex, wordIndex)}
          onBlur={(event) => handleBlur(segmentIndex, wordIndex)}
          onKeyDown={(event) => handleTabKeyCatch(event, segmentIndex, wordIndex)}
          onChange={(event) =>
            updateSegmentsOnChange(event, segment, wordAlignment, segmentIndex, wordIndex)
          }
        />
      </React.Fragment>);
    });
    return words;
  };

  function rowRenderer({ key, index, style, parent }: ListRowProps) {
    const rowContent = (<><Grid item>
      <Typography className={classes.segmentTime} >{formatSecondsDuration(segments[index].start)}</Typography>
    </Grid>
      <Grid item xs={12} sm container>
        {renderWords(segments[index], index)}
      </Grid></>);

    const isRowSelected = segmentMergeIndexes.has(index);

    return (
      segments[index] && <CellMeasurer
        key={key}
        style={style}
        parent={parent}
        cache={virtualListCache}
        columnIndex={0}
        rowIndex={index}
      >
        <Grid container spacing={2} className={classes.segment} >
          {(isSegmentEdit && !isSegmentSplitMode) ? <Button color={isRowSelected ? 'secondary' : 'primary'} variant='outlined' onClick={() => handleSegmentToMergeClick(index)} >
            {rowContent}
          </Button> : rowContent}
        </Grid>
      </CellMeasurer>
    );
  }

  const breadcrumbs: Breadcrumb[] = [
    PATHS.projects,
    {
      to: PATHS.project.function && PATHS.project.function(projectId),
      rawTitle: projectName,
    },
    {
      to: PATHS.TDP.function && PATHS.TDP.function(projectId),
      rawTitle: `${translate('TDP.TDP')}`,
    },
    {
      rawTitle: `${translate('editor.editor')}`,
    },
  ];

  const handlePlaybackTimeChange = (time: number) => {
    setPlaybackTime(time);
    // to allow us to continue to force seeking the same word during playback
    setTimeToSeekTo(undefined);
  };

  // to not display anything if we weren't passed props between pages
  if (!projectName || !voiceData) {
    return null;
  }

  return (
    <Container maxWidth={false} className={classes.container} >
      <HeaderBreadcrumbs breadcrumbs={breadcrumbs} />
      {segmentsLoading ? <BulletList /> :
        <div style={{ height: windowSize.height && (windowSize.height * 0.5), minHeight: 250 }}>
          <Typography>{voiceData.status}</Typography>
          {alreadyConfirmed ? (<StarRating
            voiceData={voiceData}
            projectId={projectIdNumber}
          />) :
            (<>
              <Button
                disabled={saveSegmentsLoading || confirmSegmentsLoading}
                variant="outlined"
                color="primary"
                onClick={handleSavePress}
                startIcon={saveSegmentsLoading ? <MoonLoader
                  sizeUnit={"px"}
                  size={15}
                  color={theme.palette.primary.main}
                  loading={true}
                /> : <SaveIcon />}
              >
                {translate('common.save')}
              </Button>
              <Button
                disabled={saveSegmentsLoading || confirmSegmentsLoading}
                variant="outlined"
                color="secondary"
                onClick={confirmData}
                startIcon={confirmSegmentsLoading ? <MoonLoader
                  sizeUnit={"px"}
                  size={15}
                  color={theme.palette.secondary.main}
                  loading={true}
                /> : <PublishIcon />}
              >
                {'TEST CONFIRM DATA'}
              </Button>
              <DualLabelSwitch
                    startLabel={'WORD'}
                    endLabel={'CUT'}
                    startIcon={<SvgIconWrapper ><FaEdit /></SvgIconWrapper>}
                    endIcon={<SvgIconWrapper ><FiScissors /></SvgIconWrapper>}
                    switchProps={{
                      checked: isSegmentEdit,
                      value: isSegmentEdit,
                      onChange: handleEditModeChange,
                    }}
                    labelProps={{
                      label: 'TEST EDIT MODE',
                      labelPlacement: 'top',
                    }}
                  />
              {isSegmentEdit ? (
                <DualLabelSwitch
                    startLabel={'TEST MERGE'}
                    endLabel={'TEST SPLIT'}
                    startIcon={<MergeTypeIcon />}
                    endIcon={<CallSplitIcon />}
                    switchProps={{
                      checked: isSegmentSplitMode,
                      value: isSegmentSplitMode,
                      onChange: () => setIsSegmentSplitMode(!isSegmentSplitMode),
                    }}
                    labelProps={{
                      label: 'TEST CUT MODE',
                      labelPlacement: 'top',
                    }}
                  />) : (
                  <DualLabelSwitch
                    startLabel={'TEST OFF'}
                    endLabel={'TEST ON'}
                    startIcon={<LockIcon />}
                    endIcon={<LockOpenIcon />}
                    switchProps={{
                      checked: HCEditable,
                      value: HCEditable,
                      onChange: () => setHCEditable(!HCEditable),
                    }}
                    labelProps={{
                      label: 'TEST LC EDIT',
                      labelPlacement: 'top',
                    }}
                  />
                )}
            </>)}
          <AutoSizer>
            {({ height, width }) => {
              return (
                <List
                  className={classes.list}
                  height={height}
                  rowCount={segments.length}
                  rowHeight={virtualListCache.rowHeight}
                  rowRenderer={rowRenderer}
                  width={width}
                  deferredMeasurementCache={virtualListCache}
                />
              );
            }}
          </AutoSizer>
        </div>
      }
      <AudioPlayer
        url={voiceData.audioUrl}
        timeToSeekTo={timeToSeekTo}
        onTimeChange={handlePlaybackTimeChange}
        onReady={handlePlayerRendered}
      />
      <ConfirmationDialog
        destructive
        titleText={`TEST DISCARD CHANGES?`}
        submitText={translate('common.discard')}
        open={confirmationOpen}
        onSubmit={discardWordChanges}
        onCancel={closeConfirmation}
      />
    </Container >
  );
}
