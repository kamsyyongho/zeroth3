import { createStyles, makeStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField'
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
    }),
);

export interface WordAlignmentProp {
    start: number,
    length: number,
    word: string,
    confidence: number,
}

export const SegmentBlock = (props: WordAlignmentProp) => {
    const classes = useStyles();
    const { start, length, word, confidence } = props;
    return (
        <div className={classes.root}>
            <TextField />
        </div >
    );
};
