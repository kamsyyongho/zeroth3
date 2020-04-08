import { createStyles, makeStyles } from '@material-ui/core/styles';
import Input from '@material-ui/core/Input'
import React from 'reactn';
import { CustomTheme } from '../../../theme/index';

const useStyles = makeStyles((theme: CustomTheme) =>
    createStyles({
        root: {
            margin: theme.spacing(1),
        },
        block: {
            marginLeft: theme.spacing(1),
        },
        wordAlignment: {
            width: '300px',
        }
    }),
);

export interface WordAlignmentProp {
    start: number,
    length: number,
    word: string,
    confidence: number,
}

export const WordAlignmentBlock = (props: WordAlignmentProp) => {
    const classes = useStyles();
    const { start, length, word, confidence } = props;
    const [isEditMode, setIsEditMode] = React.useState(false);

    const handleClick = () => {
        setIsEditMode(!isEditMode);
    };

    return (
        <div>
            <Input style={{width: 100}}
                   className={classes.wordAlignment}
                   defaultValue={word}
                   disabled={!isEditMode}
                   onClick={handleClick} />
        </div >
    );
};
