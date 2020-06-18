import { withStyles } from '@material-ui/core/styles';
import React from 'reactn';
import { CustomTheme } from '../../../theme';
import ContentEditable from "react-contenteditable";
import localForage from 'localforage';
import { UNDO_SEGMENT_STACK, REDO_SEGMENT_STACK } from "../../../common/constants";
import { INLINE_STYLE_TYPE } from '../../../types';


const styles = (theme: CustomTheme) => ({
    root: {
        margin: theme.spacing(1),
    },
    block: {
        marginLeft: theme.spacing(1),
    },
    wordAlignment: {
        minWidth: 0,
        display: 'inline',
        width: 'fit-content',
        margin: 0,
        padding: 0,
        fontSize: '14px',
        caretStyle: 'block',
        caretColor: 'rgb(0, 200, 0)',
    },
    caret: {
        borderLeft: '8px solid transparent',
        borderRight: '8px solid transparent',
        borderTop: '8px solid #000000',
    },
    PLAYING: {
        color: 'rgb(7, 125, 181)',
        boxShadow: `0px 0px 0px 1px rgb(7, 125, 181)`,
    },
});

export interface WordAlignmentProp {
    segmentIndex: number,
    wordAlignmentIndex: number,
    wordAlignmentsLength: number,
    setUndoRedoData: any,
    findWordAlignmentIndexToPrevSegment: (segmentIndex: number, currenLocation: number) => any,
    getLastAlignmentIndexInSegment: (segmentIndex: number) => any,
    onUpdateUndoRedoStack: (canUndo: boolean, canRedo: boolean) => void,
    updateCaretLocation: (segmentIndex: number, wordIndex: number) => void,
    updateChange: (segmentIndex: number, wordIndex: number, word: string) => void,
    updateWordAlignmentChange: (wordIndex: number, word: string, isChanged: boolean) => void,
    classes: any,
    start: number,
    length: number,
    word: string,
    confidence: number,
    lengthBeforeBlock: number,
    readOnly?: boolean,
}

export interface State {
    text: string,
    wordAlignmentId: string,
    element: any,
    undoStack: string[],
    redoStack: string[],
    isChanged: boolean,
    isFocused: boolean,
}

class WordAlignmentBlock extends React.Component<WordAlignmentProp, State>{
    constructor(props: any) {
        super();
        this.state = {
            element: React.createRef(),
            isChanged: false,
            isFocused: false,
            text: props.word,
            undoStack: [],
            redoStack: [],
            wordAlignmentId: `word-${props.segmentIndex}-${props.wordAlignmentIndex}`
        };
    }

    setRange = (node: HTMLElement, collapse: boolean) => {
        const range = document.createRange();
        const selection = window.getSelection();
        const currentNode = this.state.element;

        range.selectNodeContents(node);
        range.collapse(collapse);
        selection ?.removeAllRanges();
        selection ?.addRange(range);
        node.focus();
    };

    handleArrowUp = () => {
        const selection = window.getSelection();
        if (!selection) return;
        const currentLocation = selection ?.anchorOffset;
        const wordAlignmentIndex = this.props.segmentIndex > 0 ? this.props.findWordAlignmentIndexToPrevSegment
            (this.props.segmentIndex - 1, currentLocation + this.props.lengthBeforeBlock) : null;
        const previousSegmentNode = document.getElementById
            (`word-${this.props.segmentIndex - 1}-${wordAlignmentIndex}`) || null;
        const range = document.createRange();

        if (!previousSegmentNode) { return; }
        this.setRange(previousSegmentNode, false);
        this.props.updateCaretLocation(this.props.segmentIndex - 1, wordAlignmentIndex);
    };

    handleArrowDown = () => {
        const selection = window.getSelection();
        if (!selection) return;
        const currentLocation = selection ?.anchorOffset;
        const wordAlignmentIndex = this.props.findWordAlignmentIndexToPrevSegment
            (this.props.segmentIndex + 1, currentLocation + this.props.lengthBeforeBlock);
        const nextSegmentNode = document.getElementById
            (`word-${this.props.segmentIndex + 1}-${wordAlignmentIndex}`);
        const currentNode = this.state.element;
        selection ?.removeAllRanges();
        const range = document.createRange();


        if (!nextSegmentNode) { return; }
        // currentNode.current.blur();
        this.setRange(nextSegmentNode, false);
        this.props.updateCaretLocation(this.props.segmentIndex + 1, wordAlignmentIndex);
    };


    handleArrowRight = () => {
        const selection = window.getSelection();
        const range = document.createRange();

        if (selection ?.anchorOffset === this.state.text.length) {
            if (this.props.wordAlignmentIndex === this.props.wordAlignmentsLength - 1) {
                const firstBlockNextSegment = document.getElementById
                    (`word-${this.props.segmentIndex + 1}-0`) || null;

                if (!firstBlockNextSegment) { return; }

                this.setRange(firstBlockNextSegment, true);
                this.props.updateCaretLocation(this.props.segmentIndex, 0);
            } else {
                const nextWordAlignmentBlock = document.getElementById
                    (`word-${this.props.segmentIndex}-${this.props.wordAlignmentIndex + 1}`) || null;

                if (!nextWordAlignmentBlock) { return; }

                this.setRange(nextWordAlignmentBlock, true);
                this.props.updateCaretLocation(this.props.segmentIndex, this.props.wordAlignmentIndex + 1);
            }
        }
    };

    handleArrowLeft = () => {
        const selection = document.getSelection();
        const range = document.createRange();

        if (selection ?.anchorOffset === 0) {
            this.state.element.current.blur();
            if (this.props.wordAlignmentIndex === 0) {
                const lastWordPrevSegment = this.props.segmentIndex > 0
                    ? this.props.getLastAlignmentIndexInSegment(this.props.segmentIndex - 1) : null;
                const lastBlockPreviousSegment = lastWordPrevSegment ? document.getElementById
                    (`word-${this.props.segmentIndex - 1}-${lastWordPrevSegment.index}`) : null;

                if (!lastBlockPreviousSegment) { return; }

                this.setRange(lastBlockPreviousSegment, false);
                this.props.updateCaretLocation(this.props.segmentIndex - 1, lastWordPrevSegment.index);
                // this.props.updateCaretLocation(this.props.segmentIndex - 1, lastWordPrevSegment.index);
            } else {
                const prevWordAlignmentBlock = this.props.wordAlignmentIndex > 0 ? document.getElementById
                    (`word-${this.props.segmentIndex}-${this.props.wordAlignmentIndex - 1}`) : null;

                if (!prevWordAlignmentBlock) { return; }

                this.setRange(prevWordAlignmentBlock, false);
                this.props.updateCaretLocation(this.props.segmentIndex, this.props.wordAlignmentIndex - 1);
            }
        }
    };

    handleKeyDown = (event: KeyboardEvent) => {
        switch (event.code) {
            case "ArrowUp":
                this.handleArrowUp();
                break;
            case "ArrowDown":
                event.preventDefault();
                this.handleArrowDown();
                break;
            case "ArrowLeft":
                // event.preventDefault();
                this.handleArrowLeft();
                break;
            case "ArrowRight":
                // event.preventDefault();
                this.handleArrowRight();
                break;
            default:
                if(this.props.readOnly) event.preventDefault();
                break;
        }
    };

    handleChange = (event: any) => {
        const text: string = event ?.target ?.value;
        if (text.length !== this.state.text.length) {
            this.setState({ text: text, isChanged: true, undoStack: [...this.state.undoStack, this.state.text] });
            this.props.updateWordAlignmentChange(this.props.wordAlignmentIndex, text, true);
            this.props.setUndoRedoData({
                location: [this.props.segmentIndex, this.props.wordAlignmentIndex],
                undoStack: [...this.state.undoStack],
                redoStack: this.state.redoStack,
            });
            this.props.onUpdateUndoRedoStack(this.state.undoStack.length > 0, this.state.redoStack.length > 0);
        }
    };

    handleOnFocus = () => {
        this.setState({ isFocused: true });
        this.state.element.current.addEventListener('keydown', this.handleKeyDown);
    };

    handleOnBlur = async () => {
        this.setState({ isFocused: false, undoStack: [], redoStack: [] });
        // await this.props.updateWordAlignmentChange(
        //     this.props.wordAlignmentIndex,
        //     this.state.text.replace(' ', '|'),
        //     this.state.isChanged);
        // this.setState({ isChanged: false });
        document.removeEventListener('keydown', this.handleKeyDown);
    };

    componentWillReceiveProp = () => {
        const replaceSpace = this.props.word.replace('|', ' ');
        if (this.props.word !== replaceSpace) {
            this.setState({ text: replaceSpace });
        }
    };

    componentDidMount = () => {
        this.setState({ text: this.props.word.replace('|', ' ') });
    };

    render() {
        const { classes, readOnly } = this.props;
        const { element, text, wordAlignmentId } = this.state;

        return (
            <ContentEditable id={wordAlignmentId}
                innerRef={element}
                className={[classes.wordAlignment, 'jss578'].join(' ')}
                onChange={this.handleChange}
                onFocus={this.handleOnFocus}
                onBlur={this.handleOnBlur}
                html={text} />
        )
    }
}

export default withStyles({
    wordAlignment: {
        minWidth: 0,
        display: 'inline',
        width: 'fit-content',
        margin: 0,
        padding: 0,
        fontSize: '14px',
        caretStyle: 'block',
        caretColor: 'red',
    },
    PLAYING: {
        color: 'rgb(7, 125, 181)',
        boxShadow: `0px 0px 0px 1px rgb(7, 125, 181)`,
    },
})(WordAlignmentBlock);