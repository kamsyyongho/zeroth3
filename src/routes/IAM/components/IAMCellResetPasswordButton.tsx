import Button from '@material-ui/core/Button';
import { useTheme } from '@material-ui/core/styles';
import VpnKeyIcon from '@material-ui/icons/VpnKey';
import { useSnackbar } from 'notistack';
import React from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import { CellProps } from 'react-table';
import { ApiContext } from '../../../hooks/api/ApiContext';
import { I18nContext } from '../../../hooks/i18n/I18nContext';
import { User } from '../../../types';
import { SnackbarError } from '../../../types/snackbar.types';
import log from '../../../util/log/logger';
import { ConfirmationDialog } from '../../shared/ConfirmationDialog';

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
interface IAMCellResetPasswordButtonProps {
  cellData: CellProps<User>;
}

export function IAMCellResetPasswordButton(props: IAMCellResetPasswordButtonProps) {
  const { cellData } = props;
  const { translate } = React.useContext(I18nContext);
  const api = React.useContext(ApiContext);
  const { enqueueSnackbar } = useSnackbar();
  const [isLoading, setIsLoading] = React.useState(false);
  const [confirmationOpen, setConfirmationOpen] = React.useState(false);

  const user: User = cellData.cell.value;
  const index = cellData.cell.row.index;
  const key = `${index}-submit`;

  const theme = useTheme();

  const confirmReset = () => setConfirmationOpen(true);
  const closeConfirmation = () => setConfirmationOpen(false);

  const resetPassword = async () => {
    if (api && api.IAM) {
      closeConfirmation();
      setIsLoading(true);
      const response = await api.IAM.resetPasswordOfUser(user.id);
      let snackbarError: SnackbarError | undefined = {} as SnackbarError;
      if (response.kind === "ok") {
        snackbarError = undefined;
        enqueueSnackbar(translate('common.success'), { variant: 'success' });
      } else {
        log({
          file: `IAMCellResetPasswordButton.tsx`,
          caller: `resetPassword - failed to reset password`,
          value: response,
          error: true,
        });
        snackbarError.isError = true;
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      snackbarError && snackbarError.isError && enqueueSnackbar(snackbarError.errorText, { variant: 'error' });
      setIsLoading(false);
    }
  };

  return (
    <React.Fragment key={key}>
      <Button
        disabled={isLoading}
        onClick={confirmReset}
        variant="outlined"
        color="primary"
        startIcon={isLoading ?
          <MoonLoader
            sizeUnit={"px"}
            size={15}
            color={theme.palette.primary.main}
            loading={true}
          /> : <VpnKeyIcon />}
      >{translate("profile.resetPassword")}</Button>
      <ConfirmationDialog
        titleText={`${translate('IAM.resetUserPassword', { email: user.email })}?`}
        submitText={translate('common.reset')}
        open={confirmationOpen}
        onSubmit={resetPassword}
        onCancel={closeConfirmation}
      />
    </React.Fragment>
  );
}