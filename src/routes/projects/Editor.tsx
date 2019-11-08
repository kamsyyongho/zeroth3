import { Container } from '@material-ui/core';
import ListItem from '@material-ui/core/ListItem';
import { createStyles, makeStyles, Theme, useTheme } from '@material-ui/core/styles';
import React from "react";
import { BulletList } from 'react-content-loader';
import AutosizeInput from 'react-input-autosize';
import { RouteComponentProps } from "react-router";
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
  }),
);

const cache = new CellMeasurerCache({
  fixedWidth: true,
  defaultHeight: 50,
});
const list = Array(50).fill(1).map(() => Math.floor(Math.random() * 100));

export function Editor({ match }: RouteComponentProps<EditorProps>) {
  const { projectId, dataId } = match.params;
  const projectIdNumber = Number(projectId);
  const dataIdNumber = Number(dataId);
  const { translate } = React.useContext(I18nContext);
  const windowSize = useWindowSize();
  const api = React.useContext(ApiContext);
  const [segmentsLoading, setSegmentsLoading] = React.useState(false);
  const [segments, setSegments] = React.useState<Segment[]>([]);

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

  const renderWords = (segment: Segment, segmentIndex: number) => {
    const words = segment.wordAlignments.map((wordAlignment, index) => {
      const key = `${segmentIndex}-${index}`;
        return <AutosizeInput
          key={key}
          name={key}
          value={wordAlignment.word}
          minWidth={5}
          inputStyle={{
            ...theme.typography.body1,
            borderColor: wordAlignment.confidence < 50 ? 'orange' : undefined,
            margin: theme.spacing(0.25),
          }}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
            setSegments(prevSegments => {
              const updatedWord: WordAlignment = {
                ...wordAlignment,
                word: event.target.value,
              };
              const updatedWordAlignments = [...segment.wordAlignments];
              updatedWordAlignments.splice(index, 1, updatedWord);
              
              const updatedSegment = {
                ...segment,
                wordAlignments: updatedWordAlignments,
              };
              const updatedSegments = [...prevSegments];
              updatedSegments.splice(segmentIndex, 1, updatedSegment);
              
              return updatedSegments;
            })
          }}
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
        cache={cache}
        columnIndex={0}
        rowIndex={index}
      >
        <ListItem divider style={{ ...style, display: 'inline-flex' }}>
          {renderWords(segments[index], index)}
        </ListItem>
      </CellMeasurer>
    );
  }

  return (
    <Container maxWidth={false} className={classes.container} >
      {segmentsLoading ? <BulletList /> :
        <div style={{ height: windowSize.height && (windowSize.height * 0.8), minHeight: 500 }}>
          <AutoSizer>
            {({ height, width }) => {
              return (
                <List
                  height={height}
                  rowCount={segments.length}
                  rowHeight={40}
                  rowRenderer={rowRenderer}
                  width={width}
                  deferredMeasurementCache={cache}
                />
              );
            }}
          </AutoSizer>
        </div>
      }
    </Container >
  );
}
