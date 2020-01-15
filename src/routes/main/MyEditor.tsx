import { Button, Card } from '@material-ui/core';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import CardContent from '@material-ui/core/CardContent';
import FormatBoldIcon from '@material-ui/icons/FormatBold';
import FormatItalicIcon from '@material-ui/icons/FormatItalic';
import { CompositeDecorator, ContentBlock, ContentState, convertFromRaw, convertToRaw, DraftEntityMutability, Editor, EditorState, RawDraftEntity, RawDraftEntityRange, RichUtils, SelectionState } from 'draft-js';
import 'draft-js/dist/Draft.css';
import React from 'react';
import { Segment, WordAlignment } from '../../types/voice-data.types';
import log from '../../util/log/logger';
import { generateWordKey, parseWordKey } from '../../util/misc';
import { segments as hardSegments } from './segment';


interface WordAlignmentEntityData {
  wordKey: string;
  wordAlignment: WordAlignment;
}

interface EntityMap {
  [key: string]: RawDraftEntity<WordAlignmentEntityData>;
}

let entityMap: EntityMap = {};

interface EntityKeyToWordAlignmentKey {
  [x: number]: string;
}

interface WordAlignmentKeyToEntityKey {
  [x: string]: number;
}

const entityKeyMap: EntityKeyToWordAlignmentKey = {};
const wordAlignmentKeyMap: WordAlignmentKeyToEntityKey = {};

const getWordKeyFromEntityKey = (entityKey: number) => entityKeyMap[entityKey];

const getEntityKeyFromWordKey = (wordKey: string) => wordAlignmentKeyMap[wordKey];

interface TargetSelection {
  anchorOffset: number;
  focusOffset: number;
  anchorKey: string;
  focusKey: string;
}

let entityKeyCounter = 0;

let prevPlayingEntityKey = -1;

enum MUTABILITY_TYPE {
  "MUTABLE" = "MUTABLE",
  "IMMUTABLE" = "IMMUTABLE",
  "SEGMENTED" = "SEGMENTED",
}

enum ENTITY_TYPE {
  "LINK" = "LINK",
  "TOKEN" = "TOKEN",
  "PHOTO" = "PHOTO",
  "IMAGE" = "IMAGE",
}

const styles: { [x: string]: React.CSSProperties; } = {
  editor: {
    border: '1px solid #ccc',
    cursor: 'text',
    minHeight: 80,
    padding: 10
  },
  button: {
    marginTop: 10,
    textAlign: 'center'
  },
  immutable: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: '2px 0'
  },
  mutable: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    // backgroundColor: 'rgba(204, 204, 255, 1.0)',
    padding: '2px 0'
  },
  segmented: {
    backgroundColor: 'rgba(248, 222, 126, 1.0)',
    padding: '2px 0'
  }
};

function getDecoratedStyle(mutability: DraftEntityMutability) {
  switch (mutability) {
    case MUTABILITY_TYPE.IMMUTABLE:
      return styles.immutable;
    case MUTABILITY_TYPE.MUTABLE:
      return styles.mutable;
    case MUTABILITY_TYPE.SEGMENTED:
      return styles.segmented;
    default:
      return null;
  }
}

interface TokenSpanProps extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement> {
  contentState: ContentState,
  offsetkey: string,
  entityKey: string,
}

const TokenSpan = (props: TokenSpanProps) => {
  const tokenEntity = props.contentState.getEntity(props.entityKey);
  const mutability = tokenEntity.getMutability();
  const targetData: WordAlignmentEntityData = tokenEntity.getData();
  const { wordAlignment } = targetData;
  const { confidence } = wordAlignment;
  const LC = confidence < 0.8;
  let style = getDecoratedStyle(mutability) ?? {};
  if (LC) {
    style = { ...style, color: 'red' };
  }
  return (
    <span data-offset-key={props.offsetkey} style={style}>
      {props.children}
    </span>
  );
  // return (
  //   <Typography component={'span'} data-offset-key={props.offsetkey} style={style}>
  //     {props.children}
  //   </Typography>
  // );
};


function getEntityStrategy(mutability: DraftEntityMutability) {
  return function (contentBlock: ContentBlock, callback: (start: number, end: number) => void, contentState: ContentState) {
    contentBlock.findEntityRanges((character) => {
      const entityKey = character.getEntity();
      if (entityKey === null) {
        return false;
      }
      return contentState.getEntity(entityKey).getMutability() === mutability;
    }, callback);
  };
}


const decorators = new CompositeDecorator([
  {
    strategy: getEntityStrategy(MUTABILITY_TYPE.IMMUTABLE),
    component: TokenSpan
  }, {
    strategy: getEntityStrategy(MUTABILITY_TYPE.MUTABLE),
    component: TokenSpan
  }, {
    strategy: getEntityStrategy(MUTABILITY_TYPE.SEGMENTED),
    component: TokenSpan
  }
]);

interface MyEditorProps {
  segments?: Segment[];
  playingLocation?: string;
}

export function MyEditor(props: MyEditorProps) {
  const segments = props.segments || hardSegments;
  const playingLocation = props.playingLocation;
  const [editorState, setEditorState] = React.useState(
    // EditorState.createWithContent(convertedRawState)
    EditorState.createEmpty()
  );
  const [ready, setReady] = React.useState(false);

  const editorRef = React.useRef<Editor | null>(null);

  const focusEditor = () => {
    editorRef !== null && editorRef.current && editorRef.current.focus();
  };


  const createEntity = (wordAlignment: WordAlignment, wordKey: string, key: number) => {
    const data: WordAlignmentEntityData = {
      wordKey,
      wordAlignment,
    };
    const entity: RawDraftEntity = {
      type: ENTITY_TYPE.TOKEN,
      mutability: MUTABILITY_TYPE.MUTABLE,
      data,
    };
    const updatedMap = { ...entityMap, [key]: entity };
    entityMap = { ...updatedMap };
  };

  const generateStateFromSegments = () => {
    console.log('segments', segments);
    let textString = '';
    segments.forEach((segment: Segment, index: number) => {
      if (!index) {
        textString = JSON.stringify(segment);
      } else {
        textString = textString + `***${index}`;
      }
    });
    const content = ContentState.createFromText(textString, '***');
    const rawContent = convertToRaw(content);
    rawContent.blocks = rawContent.blocks.map((block, index) => {
      const segment = segments[index];
      const newBlock = { ...block };
      newBlock.type = 'blockquote';
      // newBlock.text = segment.transcript;
      newBlock.data = { segment, index };
      let transcript = segment.wordAlignments.map(wordAlignment => wordAlignment.word.replace('|', ' ')).join('*').trim();
      transcript = transcript.split("* ").join(' ').trim();
      newBlock.text = transcript;
      console.log('transcript', transcript);
      let offsetPosition = 0;
      const entityRanges: RawDraftEntityRange[] = segment.wordAlignments.map((wordAlignment, wordIndex) => {
        const wordKey = generateWordKey([index, wordIndex]);
        entityKeyMap[entityKeyCounter] = wordKey;
        wordAlignmentKeyMap[wordKey] = entityKeyCounter;
        createEntity(wordAlignment, wordKey, entityKeyCounter);
        const { word } = wordAlignment;
        const filteredWord = word.replace('|', '');
        const wordLength = filteredWord.length;
        const wordStartIndex = transcript.indexOf(filteredWord);
        const offset = offsetPosition + wordStartIndex;
        const wordOffset = wordStartIndex + wordLength - 1;
        offsetPosition = offsetPosition + wordOffset;
        transcript = transcript.slice(wordOffset);
        const entityRange: RawDraftEntityRange = {
          offset,
          length: wordLength,
          key: entityKeyCounter,
        };
        entityKeyCounter++;
        return entityRange;
      });
      newBlock.entityRanges = entityRanges;
      return newBlock;
    });
    rawContent.entityMap = { ...entityMap };
    const updatedContent = convertFromRaw(rawContent);
    const updatedEditorState = EditorState.createWithContent(updatedContent, decorators);
    console.log('convertToRaw(content)', convertToRaw(content));
    console.log('rawContent', rawContent);
    setEditorState(updatedEditorState);
    setReady(true);
  };

  React.useEffect(() => {
    generateStateFromSegments();
    focusEditor();
  }, []);


  React.useEffect(() => {
    log({
      file: `MyEditor.tsx`,
      caller: `convertToRaw(editorState)`,
      value: convertToRaw(editorState.getCurrentContent()),
      important: false,
      trace: false,
      error: false,
      warn: false,
    });
  }, [editorState]);

  const getTargetSelection = (wordKey: string, updatePrevLocation = true): TargetSelection | null => {
    const contentState = editorState.getCurrentContent();
    // to find the entinty within the correct segment
    const [segmentIndex, wordIndex] = parseWordKey(wordKey);
    const rawContent = convertToRaw(contentState);
    const targetBlock = rawContent.blocks[segmentIndex];
    // to get the target entity key 
    let targetEntityRange: RawDraftEntityRange | undefined;
    for (let i = 0; i < targetBlock.entityRanges.length; i++) {
      const entityRange = targetBlock.entityRanges[i];
      const entityWordLocation = getWordKeyFromEntityKey(entityRange.key);
      if (entityWordLocation === wordKey) {
        targetEntityRange = { ...entityRange };
        break;
      }
    }
    if (!targetEntityRange) {
      return null;
    }
    const { key, offset, length } = targetEntityRange;
    const end = offset + length;
    if (updatePrevLocation) {
      prevPlayingEntityKey = key;
    }

    const targetSelectionArea = {
      anchorOffset: offset,
      focusOffset: end,
      anchorKey: targetBlock.key,
      focusKey: targetBlock.key,
    };
    return targetSelectionArea;
  };

  const updateWordForCurrentPlayingLocation = (wordKey: string) => {
    const prevWordKey = getWordKeyFromEntityKey(prevPlayingEntityKey);
    let prevTargetSelectionArea: TargetSelection | null = null;
    // to get the previous are first because the counter 
    // will be changed when we get the current area
    if (prevWordKey) {
      prevTargetSelectionArea = getTargetSelection(prevWordKey, false);
    }
    const targetSelectionArea = getTargetSelection(wordKey);

    try {
      // to add the style for the current playing word
      if (targetSelectionArea) {
        const originalSelectionState = editorState.getSelection();
        // to prevent these next changes to be added to the undo stack
        const noUndoEditorState = EditorState.set(editorState, { allowUndo: false });
        const newSelection = originalSelectionState.merge(targetSelectionArea) as SelectionState;
        // select the target area and update style
        const editorStateWithNewTargetSelection = EditorState.forceSelection(noUndoEditorState, newSelection);
        const editorStateWithStyles = RichUtils.toggleInlineStyle(editorStateWithNewTargetSelection, 'BOLD');

        // to remove the style for the previous playing word
        if (prevTargetSelectionArea) {
          const newOriginalSelectionState = editorStateWithStyles.getSelection();
          const prevSelection = newOriginalSelectionState.merge(prevTargetSelectionArea) as SelectionState;
          // select the previous target area and update style
          const editorStateWithPrevTargetSelection = EditorState.forceSelection(editorStateWithStyles, prevSelection);
          const editorStateWithUpdatedPrevStyles = RichUtils.toggleInlineStyle(editorStateWithPrevTargetSelection, 'BOLD');

          // reset to the original selection
          const editorStateWithBothStylesAndOriginalSelection = EditorState.forceSelection(
            editorStateWithUpdatedPrevStyles,
            originalSelectionState
          );
          const undoableEditorStateWithBothStylesAndOriginalSelection = EditorState.set(editorStateWithBothStylesAndOriginalSelection, { allowUndo: true });
          setEditorState(undoableEditorStateWithBothStylesAndOriginalSelection);
        } else {
          // reset to the original selection
          const editorStateWithStylesAndOriginalSelection = EditorState.forceSelection(
            editorStateWithStyles,
            originalSelectionState
          );
          const undoableEditorStateWithStylesAndOriginalSelection = EditorState.set(editorStateWithStylesAndOriginalSelection, { allowUndo: true });
          setEditorState(undoableEditorStateWithStylesAndOriginalSelection);
        }
      }
    } catch (error) {
      log({
        file: `MyEditor.tsx`,
        caller: `updateWordForCurrentPlayingLocation`,
        value: error,
        important: true,
      });
    }
  };

  React.useEffect(() => {
    if (playingLocation && ready) {
      const entityKey = wordAlignmentKeyMap[playingLocation];
      if (typeof entityKey === 'number' && entityKey !== prevPlayingEntityKey) {
        updateWordForCurrentPlayingLocation(playingLocation);
      }
    }
  }, [playingLocation, ready]);

  const handleKeyCommand = (command: string, editorState: EditorState) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      setEditorState(newState);
      return 'handled';
    }
    return 'not-handled';
  };

  const _onBoldClick = () => {
    const boldState = RichUtils.toggleInlineStyle(editorState, 'BOLD');
    setEditorState(boldState);
    console.log('convertToRaw(boldState.getCurrentContent())', convertToRaw(boldState.getCurrentContent()));
    focusEditor();

    const contentState = editorState.getCurrentContent();
    console.log('contentState', contentState.toJS());
    console.log('rawState contentState', convertToRaw(contentState));
    // const newState = RichUtils.toggleBlockType(editorState, 'H1');
    // if (newState) {
    //   setEditorState(newState);
    // }
    // setNewState();
  };

  const _onItalicClick = () => {
    const contentState = editorState.getCurrentContent();
    const selectionState = editorState.getSelection();
    const selectionKey = selectionState.getStartKey();
    console.log('selectionState', selectionState);
    console.log('selectionKey', selectionKey);
    console.log('selectionState.toJS()', selectionState.toJS());
    // The block in which the selection starts
    const block = contentState.getBlockForKey(selectionKey);

    // Entity key at the start selection
    const entityKey = block.getEntityAt(selectionState.getStartOffset());
    if (entityKey) {
      // The actual entity instance
      const entityInstance = contentState.getEntity(entityKey);
      const entityInfo = {
        type: entityInstance.getType(),
        mutability: entityInstance.getMutability(),
        data: entityInstance.getData(),
      };
      console.log('entityInfo', entityInfo);
    };
  };

  // Custom overrides for "code" style.
  const styleMap = {
    CODE: {
      backgroundColor: 'blue',
      fontFamily: '"Inconsolata", "Menlo", "Consolas", monospace',
      fontSize: 16,
      padding: 2
    }
  };

  return (
    <div>
      <ButtonGroup size="small" aria-label="small outlined button group">
        <Button
          onClick={_onBoldClick}
        >
          <FormatBoldIcon />
        </Button>
        <Button
          onClick={_onItalicClick}
        >
          <FormatItalicIcon />
        </Button>
      </ButtonGroup>
      <Card raised>
        <CardContent>
          {ready &&
            <Editor
              ref={editorRef}
              editorState={editorState}
              customStyleMap={styleMap}
              onChange={setEditorState}
              handleKeyCommand={handleKeyCommand}
            />
          }
        </CardContent>
      </Card>
    </div>
  );
};