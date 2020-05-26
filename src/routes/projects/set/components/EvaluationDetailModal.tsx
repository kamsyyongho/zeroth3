import { Grid, Typography } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import SendIcon from '@material-ui/icons/Send';
import clsx from 'clsx';
import { useSnackbar } from 'notistack';
import { BulletList } from 'react-content-loader';
import MoonLoader from 'react-spinners/MoonLoader';
import React from 'reactn';
import { ApiContext } from '../../../../hooks/api/ApiContext';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { removeTranscriberFromDataSetResult } from '../../../../services/api/types';
import { DataSet, SnackbarError, SNACKBAR_VARIANTS, Transcriber, TranscriberStats } from '../../../../types';
import log from '../../../../util/log/logger';
import { differencesBetweenSets, isEqualSet } from '../../../../util/misc';
import { InviteFormDialog } from '../../../IAM/components/users/InviteFormDialog';
import { SearchBar } from '../../../shared/SearchBar';
import { TranscribersList } from './TranscribersList';


const useStyles = makeStyles((theme) =>
    createStyles({
        card: {
            minWidth: 550,
        },
        cardContent: {
            padding: 0,
        },
        cardHeader: {
            padding: 0,
            margin: 0,
        },
        hidden: {
            visibility: 'hidden',
        },
    }),
);

interface AddTranscriberDialogProps {
    dataSet: DataSet;
    open: boolean;
    closeEvaluationDetail: () => void;
}

export function EvaluationDetailModal(props: AddTranscriberDialogProps) {
    const {
        open,
        dataSet,
        closeEvaluationDetail,
    } = props;
    const api = React.useContext(ApiContext);
    const { translate } = React.useContext(I18nContext);
    const { enqueueSnackbar } = useSnackbar();
    const [filteredTranscribers, setfilteredTranscribers] = React.useState<TranscriberStats[]>([]);



    const classes = useStyles();
    const theme = useTheme();

    const fullScreen = useMediaQuery(theme.breakpoints.down('xs'));

    const handleClose = () => {
        closeEvaluationDetail();
    };

    return (<>
            <Dialog
                fullScreen={fullScreen}
                open={open}
                onClose={handleClose}
                aria-labelledby="transcribers-dialog"
                classes={{
                    // container: clsx(inviteOpen && classes.hidden)
                }}
            >
                <DialogTitle>
                    <Grid container direction='row' justify='space-between' wrap='nowrap' >
                        <Typography variant='h5' >
                            {translate("transcribers.header")}
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            // onClick={handleInviteOpen}
                            startIcon={<SendIcon />}
                        >{translate("IAM.invite")}
                        </Button>
                    </Grid>
                </DialogTitle>
                <DialogContent>
                    <Card elevation={0} className={classes.card}>
                        <CardHeader/>
                        <CardContent className={classes.cardContent} >
                        </CardContent>
                    </Card>
                </DialogContent>
                <DialogActions>
                    {/*<Typography>{translate('SET.transcribersToAssign', { count: selectedTranscriberIds.length })}</Typography>*/}
                    <Button
                        onClick={handleClose}
                        color="primary">
                        {translate('common.cancel')}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}