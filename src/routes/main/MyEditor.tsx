import { Button, Card } from '@material-ui/core';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import CardContent from '@material-ui/core/CardContent';
import FormatBoldIcon from '@material-ui/icons/FormatBold';
import FormatItalicIcon from '@material-ui/icons/FormatItalic';
import { convertToRaw, Editor, EditorState, RichUtils } from 'draft-js';
import React from 'react';
import log from '../../util/log/logger';



export function MyEditor() {
  const [editorState, setEditorState] = React.useState(
    EditorState.createEmpty()
  );

  const editorRef = React.useRef<Editor | null>(null);

  const focusEditor = () => {
    editorRef !== null && editorRef.current && editorRef.current.focus();
  };

  React.useEffect(() => {
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

  const handleKeyCommand = (command: string, editorState: EditorState) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      setEditorState(newState);
      return 'handled';
    }
    return 'not-handled';
  };

  const _onBoldClick = () => {
    setEditorState(RichUtils.toggleInlineStyle(editorState, 'BOLD'));
    focusEditor();
  };

  return (
    <div>
      <ButtonGroup size="small" aria-label="small outlined button group">
        <Button
          onClick={_onBoldClick}
        >
          <FormatBoldIcon />
        </Button>
        <Button>
          <FormatItalicIcon />
        </Button>
      </ButtonGroup>
      <Card raised>
        <CardContent>
          <Editor
            ref={editorRef}
            editorState={editorState}
            onChange={setEditorState}
            handleKeyCommand={handleKeyCommand}
          />
        </CardContent>
      </Card>
    </div>
  );
}