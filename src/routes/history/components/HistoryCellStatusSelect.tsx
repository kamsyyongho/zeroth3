import FormControl from '@material-ui/core/FormControl';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import ListItemText from '@material-ui/core/ListItemText';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import CheckIcon from '@material-ui/icons/Check';
import { useSnackbar } from 'notistack';
import MoonLoader from 'react-spinners/MoonLoader';
import { CellProps } from 'react-table';
import React from 'reactn';
import { ApiContext } from '../../../hooks/api/ApiContext';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { CONTENT_STATUS, CONTENT_STATUS_VALUES, SnackbarError, SNACKBAR_VARIANTS, VoiceData } from '../../../types';
import log from '../../../util/log/logger';

const useStyles = makeStyles((theme) =>
    createStyles({
        formControl: {
            minWidth: 80,
            maxWidth: 300,
        },
        hidden: {
            visibility: 'hidden',
        },
    }),
);

export const allStatus = 'all'

interface HistoryCellStatusSelectProps {
    handleStatusChange: (status: any) => void;
}

export function HistoryCellStatusSelect(props: HistoryCellStatusSelectProps) {
    const { handleStatusChange } = props;
    const api = React.useContext(ApiContext);
    const { translate } = React.useContext(I18nContext);
    const { enqueueSnackbar } = useSnackbar();

    const [status, setStatus] = React.useState<string>(allStatus);

    const classes = useStyles();
    const theme = useTheme();


    const handleChange = (event: any) => {
        const value = event.target.value;
        setStatus(value);
        handleStatusChange(value);
    };

    return (
        <Grid
            container
            wrap='nowrap'
            direction='row'
            alignContent='center'
            alignItems='center'
            justify='flex-start'
        >
            <FormControl className={classes.formControl} >
                <InputLabel>{translate('forms.status')}</InputLabel>
                <Select
                    value={status}
                    onChange={handleChange}
                >
                    <MenuItem value={allStatus}>
                        <ListItemText primary={translate('common.all')} />
                    </MenuItem>
                    {
                        CONTENT_STATUS_VALUES.map((status) => {
                            return (<MenuItem value={status}>
                                <ListItemText primary={status} />
                            </MenuItem>)
                        })
                    }
                    {/*<MenuItem value={isCompletedStatus.inComplete}>*/}
                    {/*    <ListItemText primary={`status: ${isCompletedStatus.inComplete}`} />*/}
                    {/*</MenuItem>*/}
                    {/*<MenuItem value={isCompletedStatus.completed}>*/}
                    {/*    <ListItemText primary={`status: ${isCompletedStatus.completed}`} />*/}
                    {/*</MenuItem>*/}
                </Select>
            </FormControl>
        </Grid>
    );
}