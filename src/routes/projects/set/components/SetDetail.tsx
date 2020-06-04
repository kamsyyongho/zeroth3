import { Button, Typography } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import React from 'reactn';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { CustomTheme } from '../../../../theme';
import { CONTENT_STATUS, VoiceData } from '../../../../types';
import { SUB_SET_TYPES } from '../../../../constants'


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
    // row: VoiceData;
    projectId: string;
}

export function SetDetail(props: SetDetailProps) {
    const classes = useStyles();
    const { translate, formatDate } = React.useContext(I18nContext);
    const {
        // row,
        projectId,
        setDetailLoading,
    } = props;
    // const {
    //     decodedAt,
    //     fetchedAt,
    //     confirmedAt,
    //     memo,
    //     originalFilename,
    //     modelConfigId,
    //     sessionId,
    //     ip,
    //     transcriber,
    //     wordCount,
    // } = row;

    // const startDate = new Date(decodedAt);
    // const fetchedDate = fetchedAt ? new Date(fetchedAt) : null;
    // const confirmedDate = confirmedAt ? new Date(confirmedAt) : null;

    const handleSubSetClick = (subSetType: string) => {
        console.log('========subSetType : ', subSetType);
    }

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
                    <Grid container xs={4} direction='row' justify='center' alignContent='space-between' spacing={2}>
                        <Grid item>
                            <Button
                                color='primary'
                                variant='outlined'
                                onClick={() => handleSubSetClick(SUB_SET_TYPES.test)}
                            >
                                {'Test'}
                            </Button>
                        </Grid>
                        <Grid item>
                            <Typography>wordcount : 99</Typography>
                        </Grid>
                    </Grid>
                    <Grid container xs={4} direction='row' justify='center' alignContent='space-between' spacing={2}>
                        <Grid item>
                            <Button
                                color='primary'
                                variant='outlined'
                                onClick={() => handleSubSetClick(SUB_SET_TYPES.validation)}
                            >
                                {'Validation'}
                            </Button>
                        </Grid>
                        <Grid item>
                            <Typography>wordcount : 99</Typography>
                        </Grid>
                    </Grid>
                    <Grid container xs={4} direction='row' justify='center' alignContent='space-between' spacing={2}>
                        <Grid item>
                            <Button
                                color='primary'
                                variant='outlined'
                                onClick={() => handleSubSetClick(SUB_SET_TYPES.train)}
                            >
                                {'Train'}
                            </Button>
                        </Grid>
                        <Grid item>
                            <Typography>wordcount : 99</Typography>
                        </Grid>f
                    </Grid>


                {/*    /!*<Grid*!/*/}
                {/*    /!*    container*!/*/}
                {/*    /!*    item*!/*/}
                {/*    /!*    wrap='nowrap'*!/*/}
                {/*    /!*    direction='row'*!/*/}
                {/*    /!*    alignContent='center'*!/*/}
                {/*    /!*    alignItems='center'*!/*/}
                {/*    /!*    justify='flex-start'*!/*/}
                {/*    /!*>*!/*/}
                {/*    /!*    <Typography*!/*/}
                {/*    /!*        className={classes.category}*!/*/}
                {/*    /!*        variant='subtitle2'*!/*/}
                {/*    /!*    >*!/*/}
                {/*    /!*        {`${translate('common.endAt')}:`}*!/*/}
                {/*    /!*    </Typography>*!/*/}
                {/*    /!*    <Typography>{formatDate(endDate)}</Typography>*!/*/}
                {/*    /!*</Grid>*!/*/}
                {/*    <Grid*/}
                {/*        container*/}
                {/*        item*/}
                {/*        wrap='nowrap'*/}
                {/*        direction='row'*/}
                {/*        alignContent='center'*/}
                {/*        alignItems='center'*/}
                {/*        justify='flex-start'*/}
                {/*    >*/}
                {/*        <Typography*/}
                {/*            className={classes.category}*/}
                {/*            variant='subtitle2'*/}
                {/*        >*/}
                {/*            {`${translate('TDP.sessionId')}:`}*/}
                {/*        </Typography>*/}
                {/*        <Typography>{sessionId ? sessionId : '-'}</Typography>*/}
                {/*    </Grid>*/}
                {/*    <Grid*/}
                {/*        container*/}
                {/*        item*/}
                {/*        wrap='nowrap'*/}
                {/*        direction='row'*/}
                {/*        alignContent='center'*/}
                {/*        alignItems='center'*/}
                {/*        justify='flex-start'*/}
                {/*    >*/}
                {/*        <Typography*/}
                {/*            className={classes.category}*/}
                {/*            variant='subtitle2'*/}
                {/*        >*/}
                {/*            {`${translate('TDP.ip')}:`}*/}
                {/*        </Typography>*/}
                {/*        <Typography>{ip ? ip : '-'}</Typography>*/}
                {/*    </Grid>*/}
                {/*    <Grid*/}
                {/*        container*/}
                {/*        item*/}
                {/*        wrap='nowrap'*/}
                {/*        direction='row'*/}
                {/*        alignContent='center'*/}
                {/*        alignItems='center'*/}
                {/*        justify='flex-start'*/}
                {/*    >*/}
                {/*        <Typography*/}
                {/*            className={classes.category}*/}
                {/*            variant='subtitle2'*/}
                {/*        >*/}
                {/*            {`${translate('common.fetchedAt')}:`}*/}
                {/*        </Typography>*/}
                {/*        <Typography>{fetchedDate ? formatDate(fetchedDate) : ''}</Typography>*/}
                {/*    </Grid>*/}
                {/*    <Grid*/}
                {/*        container*/}
                {/*        item*/}
                {/*        wrap='nowrap'*/}
                {/*        direction='row'*/}
                {/*        alignContent='center'*/}
                {/*        alignItems='center'*/}
                {/*        justify='flex-start'*/}
                {/*    >*/}
                {/*        <Typography*/}
                {/*            className={classes.category}*/}
                {/*            variant='subtitle2'*/}
                {/*        >*/}
                {/*            {`${translate('common.confirmedAt')}:`}*/}
                {/*        </Typography>*/}
                {/*        <Typography>{confirmedDate ? formatDate(confirmedDate) : ''}</Typography>*/}
                {/*    </Grid>*/}
                {/*</Grid>*/}
                {/*<Grid*/}
                {/*    container*/}
                {/*    item*/}
                {/*    xs={5}*/}
                {/*    wrap='nowrap'*/}
                {/*    direction='column'*/}
                {/*    alignContent='center'*/}
                {/*    alignItems='flex-start'*/}
                {/*    justify='flex-start'*/}
                {/*>*/}
                {/*    /!*<Grid*!/*/}
                {/*    /!*    container*!/*/}
                {/*    /!*    item*!/*/}
                {/*    /!*    wrap='nowrap'*!/*/}
                {/*    /!*    direction='row'*!/*/}
                {/*    /!*    alignContent='center'*!/*/}
                {/*    /!*    alignItems='center'*!/*/}
                {/*    /!*    justify='flex-start'*!/*/}
                {/*    /!*>*!/*/}
                {/*    /!*    <Typography*!/*/}
                {/*    /!*        className={classes.category}*!/*/}
                {/*    /!*        variant='subtitle2'*!/*/}
                {/*    /!*    >*!/*/}
                {/*    /!*        {`${translate('TDP.websocketCloseStatus')}:`}*!/*/}
                {/*    /!*    </Typography>*!/*/}
                {/*    /!*    <Typography>{webSocketCloseStatus}</Typography>*!/*/}
                {/*    /!*</Grid>*!/*/}
                {/*    /!*<Grid*!/*/}
                {/*    /!*    container*!/*/}
                {/*    /!*    item*!/*/}
                {/*    /!*    wrap='nowrap'*!/*/}
                {/*    /!*    direction='row'*!/*/}
                {/*    /!*    alignContent='center'*!/*/}
                {/*    /!*    alignItems='center'*!/*/}
                {/*    /!*    justify='flex-start'*!/*/}
                {/*    /!*>*!/*/}
                {/*    /!*    <Typography*!/*/}
                {/*    /!*        className={classes.category}*!/*/}
                {/*    /!*        variant='subtitle2'*!/*/}
                {/*    /!*    >*!/*/}
                {/*    /!*        {`${translate('TDP.websocketCloseReason')}:`}*!/*/}
                {/*    /!*    </Typography>*!/*/}
                {/*    /!*    <Typography>{webSocketCloseReason}</Typography>*!/*/}
                {/*    /!*</Grid>*!/*/}
                {/*    /!*<Grid*!/*/}
                {/*    /!*    container*!/*/}
                {/*    /!*    item*!/*/}
                {/*    /!*    wrap='nowrap'*!/*/}
                {/*    /!*    direction='row'*!/*/}
                {/*    /!*    alignContent='center'*!/*/}
                {/*    /!*    alignItems='center'*!/*/}
                {/*    /!*    justify='flex-start'*!/*/}
                {/*    /!*>*!/*/}
                {/*    /!*    <Typography*!/*/}
                {/*    /!*        className={classes.category}*!/*/}
                {/*    /!*        variant='subtitle2'*!/*/}
                {/*    /!*    >*!/*/}
                {/*    /!*        {`${translate('TDP.transferredBytes')}:`}*!/*/}
                {/*    /!*    </Typography>*!/*/}
                {/*    /!*    <Typography>{transferredBytes}</Typography>*!/*/}
                {/*    /!*</Grid>*!/*/}
                {/*    <Grid*/}
                {/*        container*/}
                {/*        item*/}
                {/*        wrap='nowrap'*/}
                {/*        direction='row'*/}
                {/*        alignContent='center'*/}
                {/*        alignItems='center'*/}
                {/*        justify='flex-start'*/}
                {/*    >*/}
                {/*        <Typography*/}
                {/*            className={classes.category}*/}
                {/*            variant='subtitle2'*/}
                {/*        >*/}
                {/*            {`${translate('TDP.wordCount')}:`}*/}
                {/*        </Typography>*/}
                {/*        <Typography>{wordCount}</Typography>*/}
                {/*    </Grid>*/}
                {/*    <Grid*/}
                {/*        container*/}
                {/*        item*/}
                {/*        wrap='nowrap'*/}
                {/*        direction='row'*/}
                {/*        alignContent='center'*/}
                {/*        alignItems='center'*/}
                {/*        justify='flex-start'*/}
                {/*    >*/}
                {/*        <Typography*/}
                {/*            className={classes.category}*/}
                {/*            variant='subtitle2'*/}
                {/*        >*/}
                {/*            {`${translate('TDP.originalFilename')}:`}*/}
                {/*        </Typography>*/}
                {/*        <Typography>{originalFilename ? originalFilename : '-'}</Typography>*/}
                {/*    </Grid>*/}
                {/*    <Grid*/}
                {/*        container*/}
                {/*        item*/}
                {/*        wrap='nowrap'*/}
                {/*        direction='row'*/}
                {/*        alignContent='center'*/}
                {/*        alignItems='center'*/}
                {/*        justify='flex-start'*/}
                {/*    >*/}
                {/*        <Typography*/}
                {/*            className={classes.category}*/}
                {/*            variant='subtitle2'*/}
                {/*        >*/}
                {/*            {`${translate('forms.transcriber')}:`}*/}
                {/*        </Typography>*/}
                {/*        <Typography className={!transcriber ? classes.italic : undefined}>{transcriber || translate('forms.none')}</Typography>*/}
                {/*    </Grid>*/}
                </Grid>

            </Grid>
        </TableCell>
    </TableRow>);
}