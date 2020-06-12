import { Button, Typography } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import React from 'reactn';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { CustomTheme } from '../../../../theme';
import { CONTENT_STATUS, VoiceData, VoiceDataResults, DataSet, SubSetCountResults } from '../../../../types';
import { SUB_SET_TYPES } from '../../../../constants'
import { ApiContext } from '../../../../hooks/api/ApiContext';


const useStyles = makeStyles((theme: CustomTheme) =>
    createStyles({
        card: {
        },
        cardContent: {
            padding: 0,
        },
        cardHeader: {
            padding: 0,
        },
        row: {
            borderWidth: 0,
            borderRightWidth: 2,
            borderLeftWidth: 5,
            borderColor: theme.table.border,
            border: 'solid',
            borderCollapse: undefined,
            width: '30%',
        },
        cell: {
            backgroundColor: theme.palette.background.default,
            borderColor: theme.table.border,
            borderRightWidth: 2,
            margin: '5%',
        },
        category: {
            marginRight: theme.spacing(1),
        },
        memo: {
            paddingTop: '0 !important',
        },
        italic: {
            fontStyle: 'italic',
        },
    }),
);

interface SetDetailProps {
    setDetailLoading: boolean;
    projectId: string;
    displaySubSetInTDP: (setId: string, subSetType: string) => void;
    dataSetId: string;
}

export function SetDetail(props: SetDetailProps) {
    const classes = useStyles();
    const { translate, formatDate } = React.useContext(I18nContext);
    const api = React.useContext(ApiContext);
    const [testSet, setTestSet] = React.useState<VoiceDataResults>({} as VoiceDataResults);
    const [validationSet, setValidationSet] = React.useState<VoiceDataResults>({} as VoiceDataResults);
    const [trainingSet, setTrainingSet] = React.useState<VoiceDataResults>({} as VoiceDataResults);
    const [subSetCount, setSubSetCount] = React.useState<SubSetCountResults>({} as SubSetCountResults);

    const {
        // row,
        projectId,
        setDetailLoading,
        displaySubSetInTDP,
        dataSetId,
    } = props;


    return (<TableRow
        className={classes.row}
    >
        <TableCell
            colSpan={7}
            className={classes.cell}
        >
            <Grid container spacing={3}>
                <Grid
                    container
                    item
                    xs={12}
                    wrap='nowrap'
                    direction='row'
                    alignContent='space-around'
                    alignItems='flex-start'
                    justify='center'
                >
                    <Grid
                        container
                        item
                        xs={4}
                        direction='row'
                        justify='center'
                        alignContent='space-between'
                        spacing={2}>
                        <Grid item>
                            <Button
                                color='primary'
                                variant='outlined'
                                onClick={() => displaySubSetInTDP(dataSetId, SUB_SET_TYPES.test)}
                            >
                                {'Test'}
                            </Button>
                        </Grid>
                        <Grid item>
                            <Typography>{`Record Count : ${!!subSetCount.testCount ? subSetCount.testCount : 0}`}</Typography>
                        </Grid>
                    </Grid>
                    <Grid
                        container
                        item
                        xs={4}
                        direction='row'
                        justify='center'
                        alignContent='space-between'
                        spacing={2}>
                        <Grid item>
                            <Button
                                color='primary'
                                variant='outlined'
                                onClick={() => displaySubSetInTDP(dataSetId, SUB_SET_TYPES.validation)}
                            >
                                {'Validation'}
                            </Button>
                        </Grid>
                        <Grid item>
                            <Typography>{`Record Count : ${!!subSetCount.validationCount ? subSetCount.validationCount : 0}`}</Typography>
                        </Grid>
                    </Grid>
                    <Grid
                        container
                        item
                        xs={4}
                        direction='row'
                        justify='center'
                        alignContent='space-between'
                        spacing={2}>
                        <Grid item>
                            <Button
                                color='primary'
                                variant='outlined'
                                onClick={() => displaySubSetInTDP(dataSetId, SUB_SET_TYPES.training)}
                            >
                                {'Train'}
                            </Button>
                        </Grid>
                        <Grid item>
                            <Typography>{`Record Count : ${!!subSetCount.trainCount ? subSetCount.trainCount : 0}`}</Typography>
                        </Grid>
                    </Grid>
                </Grid>

            </Grid>
        </TableCell>
    </TableRow>);
}