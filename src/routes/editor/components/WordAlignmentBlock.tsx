import { createStyles, makeStyles } from '@material-ui/core/styles';
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
            display: 'inline-block',
            width: 'fit-content',
            margin: 0,
            padding: 0,
            fontSize: '14px',
        }
    }),
);

export interface WordAlignmentProp {
    start: number,
    length: number,
    word: string,
    confidence: number,
    totalLength: number,
}

export const WordAlignmentBlock = (props: WordAlignmentProp) => {
    const classes = useStyles();
    const { start, length, word, confidence, totalLength } = props;
    const [isEditMode, setIsEditMode] = React.useState(false);

    React.useEffect(() => {
        console.log(`word length = ${word.length} and word : `, word)
        console.log('total word length : ', totalLength);
    });

    const handleClick = () => {
        setIsEditMode(true);
    };

    return (
        // <Input className={classes.wordAlignment}
        //        defaultValue={word}
        //        disabled={!isEditMode}
        //        style={{ width: `${word.length / totalLength * 100}%` }}
        //        fullWidth={true}
        //        onClick={handleClick} />
        <span contentEditable={true} className={classes.wordAlignment}>
            {word}
        </span>

    );
};
