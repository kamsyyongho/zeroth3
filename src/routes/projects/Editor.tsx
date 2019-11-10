import { Button, Container } from '@material-ui/core';
import ListItem from '@material-ui/core/ListItem';
import { createStyles, makeStyles, Theme, useTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import EditIcon from '@material-ui/icons/Edit';
import React from "react";
import { BulletList } from 'react-content-loader';
import AutosizeInput from 'react-input-autosize';
import { RouteComponentProps } from "react-router";
import MoonLoader from 'react-spinners/MoonLoader';
import { AutoSizer, CellMeasurer, CellMeasurerCache, List, ListRowProps } from 'react-virtualized';
import { ApiContext } from '../../hooks/api/ApiContext';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { useWindowSize } from '../../hooks/window/useWindowSize';
import { ModelConfig, Segment, WordAlignment } from '../../types';
import log from '../../util/log/logger';


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
    segmentTime: {
      marginRight: 25,
      color: '#939393',
    }
  }),
);

const virtualListCache = new CellMeasurerCache({
  fixedWidth: true,
  defaultHeight: 50,
});

const WORD_KEY_SEPARATOR = '::';

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


export function Editor({ match }: RouteComponentProps<EditorProps>) {
  const { projectId, dataId } = match.params;
  const projectIdNumber = Number(projectId);
  const dataIdNumber = Number(dataId);
  const { translate } = React.useContext(I18nContext);
  const windowSize = useWindowSize();
  const api = React.useContext(ApiContext);
  const [segmentsLoading, setSegmentsLoading] = React.useState(false);
  const [segments, setSegments] = React.useState<Segment[]>([]);
  const [segmentWordProperties, setSegmentWordProperties] = React.useState<SegmentWordProperties>({});

  const theme = useTheme();

  //!
  //TODO
  //* IMMEDIATELY REDIRECT IF USER DOESN'T HAVE THE CORRECT ROLES

  const classes = useStyles();

  React.useEffect(() => {
    const getSegments = async () => {
      if (api && api.voiceData) {
        setSegmentsLoading(true);
        const response = await api.voiceData.getSegments(projectIdNumber, dataIdNumber);
        if (response.kind === 'ok') {
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

  const submitUpdates = async () => {
    if (api && api.voiceData) {
      // setSegmentsLoading(true);
      const segmentId = segments[0].id;
      const updatedWordAlignments = segments[0].wordAlignments;
      const response = await api.voiceData.updateSegment(projectIdNumber, dataIdNumber, segmentId, updatedWordAlignments);
      if (response.kind === 'ok') {
        //!
        //!
        //!
        //TODO
        //* ARRAY ORDER IS CHANGING AFTER UPDATE
        // VERIFY WHEN TO UPDATE (BUTTON / ON BLUR)
        console.log('response.segment', response.segment);
        //!
        //!
        //!
        // setSegments(response.segments);
      } else {
        log({
          file: `Editor.tsx`,
          caller: `getSegments - failed to get segments`,
          value: response,
          important: true,
        });
      }
      // setSegmentsLoading(false);
    }
  };

  const updateSegments = (
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

  const getWordStyle = (focussed: boolean, wordConfidence: number) => {
    const DEFAULT_LC_THRESHOLD = 50;
    if (wordConfidence > DEFAULT_LC_THRESHOLD) {
      return {};
    }
    const LC_COLOR = '#ffe369';
    let wordStyle: React.CSSProperties = {
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
    return wordStyle;
  };

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

  const handleFocus = (
    segmentIndex: number,
    wordIndex: number,
  ) => {
    setFocus(segmentIndex, wordIndex);
    setSegments(prevSegments => ([...prevSegments]));
  };

  const handleBlur = (
    segmentIndex: number,
    wordIndex: number,
  ) => {
    setFocus(segmentIndex, wordIndex, false);
    setSegments(prevSegments => ([...prevSegments]));
  };

  const renderWords = (segment: Segment, segmentIndex: number) => {
    const words = segment.wordAlignments.map((wordAlignment, wordIndex) => {
      const key = generateWordKey(segmentIndex, wordIndex);
      const isFocussed = getWordFocussed(segmentIndex, wordIndex);
      const wordStyle = getWordStyle(isFocussed, wordAlignment.confidence);
      return <AutosizeInput
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
        onFocus={(event) => handleFocus(segmentIndex, wordIndex)}
        onBlur={(event) => handleBlur(segmentIndex, wordIndex)}
        onChange={(event) =>
          updateSegments(event, segment, wordAlignment, segmentIndex, wordIndex)}
      />;
    });
    return words;
  };


  function rowRenderer({ key, index, style, parent }: ListRowProps) {
    return (
      segments[index] && <CellMeasurer
        key={key}
        style={style}
        parent={parent}
        cache={virtualListCache}
        columnIndex={0}
        rowIndex={index}
      >
        <ListItem divider style={style}>
          <Typography className={classes.segmentTime} >{formatSecondsDuration(segments[index].start)}</Typography>
          {renderWords(segments[index], index)}
        </ListItem>
      </CellMeasurer>
    );
  }

  return (
    <Container maxWidth={false} className={classes.container} >
      {segmentsLoading ? <BulletList /> :
        <div style={{ height: windowSize.height && (windowSize.height * 0.8), minHeight: 500 }}>
          <Button
            // disabled={!projectsToDelete.length}
            variant="contained"
            color="secondary"
            onClick={submitUpdates}
            startIcon={segmentsLoading ? <MoonLoader
              sizeUnit={"px"}
              size={15}
              color={"#ffff"}
              loading={true}
            /> : <EditIcon />}
          >
            {translate('common.edit')}
          </Button>
          <AutoSizer>
            {({ height, width }) => {
              return (
                <List
                  height={height}
                  rowCount={segments.length}
                  rowHeight={40}
                  rowRenderer={rowRenderer}
                  width={width}
                  deferredMeasurementCache={virtualListCache}
                />
              );
            }}
          </AutoSizer>
        </div>
      }
    </Container >
  );
}
