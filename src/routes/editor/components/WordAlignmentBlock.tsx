import {withStyles} from '@material-ui/core/styles';
import React from 'reactn';
import {CustomTheme} from '../../../theme/index';
import ContentEditable from "react-contenteditable";
import {EDITOR_CONTROLS} from './EditorControls';
import localForage from 'localforage';
import {UNDO_SEGMENT_STACK, REDO_SEGMENT_STACK} from "../../../common/constants";


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
    }
});

export interface WordAlignmentProp {
    segmentIndex: number,
    wordAlignmentIndex: number,
    wordAlignmentsLength:number,
    setUndoRedoData: any,
    editorCommand: EDITOR_CONTROLS,
    findWordAlignmentIndexToPrevSegment: (segmentIndex: number, currenLocation: number) => any,
    getLastAlignmentIndexInSegment: (segmentIndex: number) => any,
    onUpdateUndoRedoStack: (canUndo: boolean, canRedo:boolean) => void,
    updateCaretLocation: (segmentIndex: number, wordIndex: number) => void,
    updateChange: (segmentIndex:number, wordIndex: number, word: string) => void,
    updateWordAlignmentChange: (wordIndex: number, word: string, isChanged: boolean) => void,
    classes: any,
    start: number,
    length: number,
    word: string,
    confidence: number,
    lengthBeforeBlock: number,
    readOnly: boolean,
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

class WordAlignmentBlock extends React.Component <WordAlignmentProp, State>{
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

        currentNode.current.blur();
        range.selectNodeContents(node);
        range.collapse(collapse);
        selection?.removeAllRanges();
        selection?.addRange(range);
        this.props.updateChange(this.props.segmentIndex, this.props.wordAlignmentIndex, this.state.text);
    };

    handleArrowUp = () => {
        const selection = window.getSelection();
        if(!selection) return;
        const currentLocation = selection?.anchorOffset;
        const wordAlignmentIndex = this.props.segmentIndex > 0 ? this.props.findWordAlignmentIndexToPrevSegment
        (this.props.segmentIndex - 1, currentLocation + this.props.lengthBeforeBlock) : null;
        const previousSegmentNode = document.getElementById
        (`word-${this.props.segmentIndex - 1}-${wordAlignmentIndex}`) || null;
        const range = document.createRange();

        if(!previousSegmentNode) {return;}
        this.setRange(previousSegmentNode, false);
        this.props.updateCaretLocation(this.props.segmentIndex - 1, wordAlignmentIndex);
    };

    handleArrowDown = () => {
        const selection = window.getSelection();
        if(!selection) return;
        const currentLocation = selection?.anchorOffset;
        const wordAlignmentIndex = this.props.findWordAlignmentIndexToPrevSegment
        (this.props.segmentIndex + 1, currentLocation + this.props.lengthBeforeBlock);
        const nextSegmentNode = document.getElementById
        (`word-${this.props.segmentIndex + 1}-${wordAlignmentIndex}`);
        const currentNode = this.state.element;
        selection?.removeAllRanges();
        const range = document.createRange();

        if(!nextSegmentNode) {return;}
        currentNode.current.blur();
        this.setRange(nextSegmentNode, false);
        console.log('wordAlignmentIndex in wordblock : ', wordAlignmentIndex);
        this.props.updateCaretLocation(this.props.segmentIndex + 1, wordAlignmentIndex);
    };


    handleArrowRight = () => {
        const selection = window.getSelection();
        const range = document.createRange();

        console.log('selection arrow right : ', selection);

        if(selection?.anchorOffset === this.state.text.length) {
            if(this.props.wordAlignmentIndex === this.props.wordAlignmentsLength - 1) {
                const firstBlockNextSegment = document.getElementById
                (`word-${this.props.segmentIndex + 1}-0`) || null;

                if(!firstBlockNextSegment){return;}

                this.setRange(firstBlockNextSegment, true);
                this.props.updateCaretLocation(this.props.segmentIndex, 0);
            } else {
                const nextWordAlignmentBlock = document.getElementById
                (`word-${this.props.segmentIndex}-${this.props.wordAlignmentIndex + 1}`) || null;

                if(!nextWordAlignmentBlock){return;}

                this.setRange(nextWordAlignmentBlock, true);
                this.props.updateCaretLocation(this.props.segmentIndex, this.props.wordAlignmentIndex + 1);
            }
        }
    };

    handleArrowLeft = () => {
        const selection = document.getSelection();
        const range = document.createRange();

        if(selection?.anchorOffset === 0) {
            this.state.element.current.blur();
            if(this.props.wordAlignmentIndex === 0) {
                const lastWordPrevSegment = this.props.segmentIndex > 0
                    ? this.props.getLastAlignmentIndexInSegment(this.props.segmentIndex - 1) : null;
                const lastBlockPreviousSegment = lastWordPrevSegment ? document.getElementById
                (`word-${this.props.segmentIndex - 1}-${lastWordPrevSegment.index}`) : null;

                if(!lastBlockPreviousSegment) {return;}

                this.setRange(lastBlockPreviousSegment, false);
                // this.props.updateCaretLocation(this.props.segmentIndex - 1, lastWordPrevSegment.index);
            } else {
                const prevWordAlignmentBlock = this.props.wordAlignmentIndex > 0 ? document.getElementById
                (`word-${this.props.segmentIndex}-${this.props.wordAlignmentIndex - 1}`) : null;

                if(!prevWordAlignmentBlock){return;}

                this.setRange(prevWordAlignmentBlock, false);
                this.props.updateCaretLocation(this.props.segmentIndex, this.props.wordAlignmentIndex - 1);
            }
        }
    };

    handleKeyDown = (event: KeyboardEvent) => {
        console.log('event in keydown event :', event);
        switch(event.code) {
            case "ArrowUp":
                event.preventDefault();
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
                return;
        }
    };

    handleChange = (event: any) => {
        const text: string = event?.target?.value;
        this.setState({ text: text, isChanged: true, undoStack: [ ...this.state.undoStack, text] });
        this.props.setUndoRedoData({
            location: [this.props.segmentIndex, this.props.wordAlignmentIndex],
            undoStack: [ ...this.state.undoStack, text ],
            redoStack: this.state.redoStack,
        });
        this.props.onUpdateUndoRedoStack(this.state.undoStack.length > 0, this.state.redoStack.length > 0);
        console.log('undoStack in wordAlignmentBlock : ', this.state.undoStack);
        // selected?.setPosition(this.state.node, 0);
    };

    handleOnFocus = () => {
        console.log('what');
        this.setState({ isFocused: true });
        this.state.element.current.addEventListener('keydown', this.handleKeyDown);
    };

    handleOnBlur = async () => {
        this.setState({ isFocused: false });
        await this.props.updateWordAlignmentChange(
            this.props.wordAlignmentIndex,
            this.state.text,
            this.state.isChanged);
        this.setState({ isChanged: false });
        document.removeEventListener('keydown', this.handleKeyDown);
    };
    //
    componentWillReceiveProps = () => {
        if(this.props.editorCommand && this.props.word !== this.state.text) {
            console.log('word in wordALignmentBlock props : ', this.props.word);
            this.setState({ text: this.props.word });
        }
    }
    //
    // componentDidMount = () => {
    // }

    render() {
        const { classes, readOnly } = this.props;
        const { element, text, wordAlignmentId } = this.state;
        return (
            <ContentEditable id={wordAlignmentId}
                             innerRef={element}
                             className={classes.wordAlignment}
                             onChange={this.handleChange}
                             onFocus={this.handleOnFocus}
                             onBlur={this.handleOnBlur}
                             html={text}
                             disabled={readOnly} />
        )
    }
}

export default withStyles(styles)(WordAlignmentBlock);