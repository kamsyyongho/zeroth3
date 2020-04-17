import { createStyles, makeStyles, withStyles } from '@material-ui/core/styles';
import Input from '@material-ui/core/Input'
import React from 'reactn';
import { CustomTheme } from '../../../theme/index';
import ContentEditable from "react-contenteditable";

const useStyles = makeStyles((theme: CustomTheme) =>
    createStyles({
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
    }),
);
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
    classes: any,
    start: number,
    length: number,
    word: string,
    confidence: number,
    totalLength: number,
}

class WordAlignmentBlock extends React.Component <WordAlignmentProp>{
    constructor(props: any) {
        super();
        this.state = {
            text: props.word,
        }
    }

    handleChange = (event: SyntheticEvent) => {
        const text: string = event?.target?.value;
        const node = document.getElementById
        (`word-alignment-${this.props.segmentIndex}-${this.props.wordAlignmentIndex}`);
        console.log('handle change by ContentEditable : ', event);
        this.setState({ text: text });
        const selected = window.getSelection();
        console.log('window.getSelection : ', selected);
        selected?.setPosition(node, 0);
    };

    render() {
        const { segmentIndex, wordAlignmentIndex, classes } = this.props;
        const { text } = this.state;
        return (
            <ContentEditable id={`word-alignment-${segmentIndex}-${wordAlignmentIndex}`}
                             className={classes.wordAlignment}
                             onChange={this.handleChange}
                             html={text}
                             disabled={false} />
        )
    }
}

export default withStyles(styles)(WordAlignmentBlock);