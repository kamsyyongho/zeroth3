import { withStyles } from '@material-ui/core/styles';
import React from 'reactn';
import { CustomTheme } from '../../../theme/index';
import ContentEditable from "react-contenteditable";

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
    findWordAlignmentIndexToPrevSegment: (segmentIndex: number, currenLocation: number) => any,
    getLastAlignmentIndexInSegment: (segmentIndex: number) => any,
    updateCaretLocation: (segmentIndex: number, wordIndex: number) => void,
    updateChange: (segmentIndex:number, wordIndex: number, word: string) => void,
    classes: any,
    start: number,
    length: number,
    word: string,
    confidence: number,
    lengthBeforeBlock: number,
}

export interface State {
    text: string,
    wordAlignmentId: string,
    element: any,
}

class WordAlignmentBlock extends React.Component <WordAlignmentProp, State>{
    // node: HTMLElement | null = null;
    constructor(props: any) {
        super();
        this.state = {
            element: React.createRef(),
            text: props.word,
            wordAlignmentId: `word-${props.segmentIndex}-${props.wordAlignmentIndex}`
        };
    }

    handleChange = (event: SyntheticEvent) => {
        const text: string = event?.target?.value;
        const firstWordAlignment = document.getElementById('word-0-0');
        console.log('element getSelection : ', window.getSelection());
        console.log('first word alignment : ',firstWordAlignment);
        console.log('handle change by ContentEditable : ', event);
        this.setState({ text: text });
        // selected?.setPosition(this.state.node, 0);
    };

    handleArrowUp = () => {
        const selection = window.getSelection();
        const currentLocation = selection?.anchorOffset;
        const wordAlignmentIndex = this.props.segmentIndex > 0 ? this.props.findWordAlignmentIndexToPrevSegment
        (this.props.segmentIndex - 1, currentLocation + this.props.lengthBeforeBlock) : null;
        const previousSegmentNode = document.getElementById
        (`word-${this.props.segmentIndex - 1}-${wordAlignmentIndex}`) || null;
        const currentNode = this.state.element;
        const range = document.createRange();

        if(!previousSegmentNode) {return;}
        currentNode.current.blur();
        // range.setStart(previousSegmentNode, wordAlignmentIndex);
        range.selectNodeContents(previousSegmentNode);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
        // selection?.setPosition(previousSegmentNode, 0);
        this.props.updateCaretLocation(this.props.segmentIndex - 1, wordAlignmentIndex);
    };

    handleArrowDown = () => {
        const selection = window.getSelection();
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
        // range.setStart(nextSegmentNode, wordAlignmentIndex);
        range.selectNodeContents(nextSegmentNode);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
        // selection?.setPosition(nextSegmentNode, 0);
        console.log('wordAlignmentIndex in wordblock : ', wordAlignmentIndex);
        this.props.updateCaretLocation(this.props.segmentIndex + 1, wordAlignmentIndex);
    };


    handleArrowRight = () => {
        const selection = window.getSelection();
        const nextWordAlignmentBlock = document.getElementById
        (`word-${this.props.segmentIndex}-${this.props.wordAlignmentIndex + 1}`) || null;
        const firstBlockNextSegment = document.getElementById
        (`word-${this.props.segmentIndex + 1}-0`) || null;
        const range = document.createRange();

        console.log('selection arrow right : ', selection);
        console.log('nextWordAlignmentBlock : ', nextWordAlignmentBlock);
        console.log('firstBlockNextSegment : ', firstBlockNextSegment);

        if(selection?.anchorOffset === selection?.anchorNode['length']) {
            if(this.props.wordAlignmentIndex === this.props.wordAlignmentsLength - 1 && firstBlockNextSegment) {
                if(!firstBlockNextSegment){return;}
                // selection?.setPosition(firstBlockNextSegment, 0);
                // range.setStart(firstBlockNextSegment.childNodes[1], 0);
                range.selectNodeContents(firstBlockNextSegment);
                range.collapse(true);
                selection?.removeAllRanges();
                selection?.addRange(range);
                this.props.updateCaretLocation(this.props.segmentIndex, 0);
            } else {
                if(!nextWordAlignmentBlock){return;}
                // range.setStart(nextWordAlignmentBlock.childNodes[1], 0);
                range.selectNodeContents(nextWordAlignmentBlock);
                range.collapse(true);
                selection?.removeAllRanges();
                selection?.addRange(range);
                this.props.updateCaretLocation(this.props.segmentIndex, this.props.wordAlignmentIndex + 1);
                // selection?.setPosition(nextWordAlignmentBlock, 0);
            }
        }
    };

    handleArrowLeft = () => {
        const selection = document.getSelection();
        const lastWordPrevSegment = this.props.segmentIndex > 0
            ? this.props.getLastAlignmentIndexInSegment(this.props.segmentIndex - 1) : null;
        const prevWordAlignmentBlock = this.props.wordAlignmentIndex > 0 ? document.getElementById
        (`word-${this.props.segmentIndex}-${this.props.wordAlignmentIndex - 1}`) : null;
        const lastBlockPreviousSegment = lastWordPrevSegment ? document.getElementById
        (`word-${this.props.segmentIndex - 1}-${lastWordPrevSegment.index}`) : null;
        const range = document.createRange();

        console.log('lastWordPrevSegment : ', lastWordPrevSegment);
        console.log('selection : ', selection);

        if(selection?.anchorOffset === 0) {
            this.state.element.current.blur();
            if(this.props.wordAlignmentIndex === 0) {
                if(!lastBlockPreviousSegment) {return;}
                console.log('lastBlockPreviousSegment : ', lastBlockPreviousSegment);
                range.selectNodeContents(lastBlockPreviousSegment);
                range.collapse(false);
                selection?.removeAllRanges();
                selection?.addRange(range);
                // selection?.setPosition(lastBlockPreviousSegment, lastWordPrevSegment.word.length - 1);
                console.log('selection after collapse : ', selection);
            } else {
                if(!prevWordAlignmentBlock){return;}
                range.selectNodeContents(prevWordAlignmentBlock);
                range.collapse(false);
                selection?.removeAllRanges();
                selection?.addRange(range);
                // selection?.setPosition(prevWordAlignmentBlock, 0);
            }
        }
    };

    handleKeyDown = (event: KeyboardEvent) => {
        console.log('event in keydown event :', event);
        switch(event.code) {
            case "ArrowUp":
                this.handleArrowUp();
                break;
            case "ArrowDown":
                this.handleArrowDown();
                break;
            case "ArrowLeft":
                this.handleArrowLeft();
                break;
            case "ArrowRight":
                this.handleArrowRight();
                break;
            default:
                return;
        }
    };

    handleOnFocus = () => {
        console.log('what');
    };

    handleOnBlur = () => {
        console.log('does it get called?');
        document.removeEventListener('keydown', this.handleKeyDown);
    };

    componentDidMount = () => {
        console.log('node, inside componenDidMount : ', this.state.element);
        this.state.element.current.addEventListener('keydown', this.handleKeyDown);
    };

    render() {
        const { classes } = this.props;
        const { element, text, wordAlignmentId } = this.state;
        return (
            <ContentEditable id={wordAlignmentId}
                             innerRef={element}
                             className={classes.wordAlignment}
                             onChange={this.handleChange}
                             onBlur={this.handleOnBlur}
                             html={text}
                             disabled={false} />
        )
    }
}

export default withStyles(styles)(WordAlignmentBlock);