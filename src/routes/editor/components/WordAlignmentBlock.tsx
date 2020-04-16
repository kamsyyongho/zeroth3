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
    classes: any,
    start: number,
    length: number,
    word: string,
    confidence: number,
    totalLength: number,
}

// export const WordAlignmentBlock = (props: WordAlignmentProp) => {
//     const classes = useStyles();
//     const { start, length, word, confidence, totalLength } = props;
//     const [isEditMode, setIsEditMode] = React.useState(false);
//     const [wordAlignment, setWordAlignment] = React.useState(word);
//
//     React.useEffect(() => {
//         console.log(`word length = ${word.length} and word : `, word)
//         console.log('total word length : ', totalLength);
//     });
//
//     const handleChange = (event: Event) => {
//         console.log('event inside onChange : ', event)
//     }
//
//     const handleClick = () => {
//         setIsEditMode(true);
//     };
//
//     return (
//         // <Input className={classes.wordAlignment}
//         //        defaultValue={word}
//         //        disabled={!isEditMode}
//         //        style={{ width: `${word.length / totalLength * 100}%` }}
//         //        fullWidth={true}
//         //        onClick={handleClick} />
//         <span contentEditable={true} className={classes.wordAlignment}
//               onChange={handleChange}>
//             {wordAlignment}
//         </span>
//
//     );
// };

class WordAlignmentBlock extends React.Component <WordAlignmentProp>{
    constructor(props: any) {
        super();
        this.state = {
            index: props.index,
            text: props.word,
        }
    }

    handleChange = (event: SyntheticEvent) => {
        const text: string = event?.target?.value;
        console.log('handle change by ContentEditable : ', event);
        this.setState({ text: text })
    };

    render() {
        const { classes } = this.props;
        const { text } = this.state;
        return (
            <ContentEditable className={classes.wordAlignment}
                             onChange={this.handleChange}
                             html={text}
                             disabled={false} />
        )
    }
}

export default withStyles(styles)(WordAlignmentBlock);