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
    classes: any,
    start: number,
    length: number,
    word: string,
    confidence: number,
    totalLength: number,
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
            wordAlignmentId: `word-alignment-${props.segmentIndex}-${props.wordAlignmentIndex}`
        };
    }

    handleChange = (event: SyntheticEvent) => {
        const text: string = event?.target?.value;
        const firstWordAlignment = document.getElementById('word-alignment-0-0');
        console.log('element getSelection : ', window.getSelection());
        console.log('first word alignment : ',firstWordAlignment);
        console.log('handle change by ContentEditable : ', event);
        this.setState({ text: text });
        // selected?.setPosition(this.state.node, 0);
    };

    // window.getSelection
//     Selection {anchorNode: text, anchorOffset: 4, focusNode: text, focusOffset: 4, isCollapsed: true, …}
// anchorNode: text
// anchorOffset: 4
// baseNode: text
// baseOffset: 4
// extentNode: text
// extentOffset: 4
// focusNode: text
// focusOffset: 4
// isCollapsed: true
// rangeCount: 1
// type: "Caret"
// __proto__: Selection
    handleArrowUp = () => {
        // const selection = window.getSelection();
        // const previousSegmentNode = document.getElementById
        // (`word-alignment=${this.props.segmentIndex - 1}-${selection?.anchorOffset}`);
        return;
    };

    handleArrowDown = () => {
      return;
    };


    handleArrowRight = () => {
        const selectCaretLocation = window.getSelection();
        const nextWordAlignmentBlock = document.getElementById
        (`word-alignment-${this.props.segmentIndex}-${this.props.wordAlignmentIndex + 1}`);
        const firstBlockNextSegment = document.getElementById
        (`word-alignment-${this.props.segmentIndex + 1}-0`);

        console.log('wordAlignmentIndex : ', this.props.wordAlignmentIndex);
        console.log('wordAlignmentsLength : ', this.props.wordAlignmentsLength);
        if(selectCaretLocation?.anchorOffset === selectCaretLocation?.anchorNode?.length) {
            selectCaretLocation?.setPosition(nextWordAlignmentBlock, 0);

            if(this.props.wordAlignmentIndex === this.props.wordAlignmentsLength - 1) {
                selectCaretLocation?.setPosition(firstBlockNextSegment, 0);
            }
        }
        return;
    };
    handleArrowLeft = () => {
        const selectCaretLocation = window.getSelection();
        const prevWordAlignmentBlock = document.getElementById
        (`word-alignment-${this.props.segmentIndex}-${this.props.wordAlignmentIndex - 1}`);
        const lastBlockPreviousSegment = document.getElementById
        (`word-alignment-${this.props.segmentIndex - 1}-0`);

        console.log('wordAlignmentIndex : ', this.props.wordAlignmentIndex);
        console.log('wordAlignmentsLength : ', this.props.wordAlignmentsLength);
        if(selectCaretLocation?.anchorOffset === selectCaretLocation?.anchorNode?.length) {
            selectCaretLocation?.setPosition(prevWordAlignmentBlock, 0);

            if(this.props.wordAlignmentIndex === this.props.wordAlignmentsLength - 1) {
                selectCaretLocation?.setPosition(lastBlockPreviousSegment, 0);
            }
        }
        return;
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

    componentDidMount = () => {
        // this.node = document.getElementById(this.state.wordAlignmentId);
        console.log('node, inside componenDidMount : ', this.state.element);
        // this.node?.addEventListener('keydown', this.handleKeyDown);
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
                             html={text}
                             disabled={false} />
        )
    }
}

export default withStyles(styles)(WordAlignmentBlock);