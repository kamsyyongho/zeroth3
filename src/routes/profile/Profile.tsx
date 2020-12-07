import { Box, Button, CardHeader, Container } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import Grid from '@material-ui/core/Grid';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import EditIcon from '@material-ui/icons/Edit';
import CheckIcon from '@material-ui/icons/Check';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import VpnKeyIcon from '@material-ui/icons/VpnKey';
import { useSnackbar } from 'notistack';
import { List } from 'react-content-loader';
import MoonLoader from 'react-spinners/MoonLoader';
import React, { useGlobal } from 'reactn';
import { PERMISSIONS } from '../../constants';
import { ApiContext } from '../../hooks/api/ApiContext';
import { I18nContext } from '../../hooks/i18n/I18nContext';
import { KeycloakContext } from '../../hooks/keycloak/KeycloakContext';
import { LOCAL_STORAGE_KEYS } from '../../types';
import { CustomTheme } from '../../theme';
import { ICONS } from '../../theme/icons';
import { Organization, SnackbarError, SNACKBAR_VARIANTS, User } from '../../types';
import log from '../../util/log/logger';
import { setPageTitle } from '../../util/misc';
import { ConfirmationDialog } from '../shared/ConfirmationDialog';
import { RenameOrganizationDialog } from '../shared/RenameOrganizationDialog';
import { OrganizationPickerDialog } from './components/OrganizationPickerDialog';
import { UsersCellPlainText } from '../IAM/components/users/UsersCellPlainText'
import Textfield from '@material-ui/core/TextField';
import {useDispatch, useSelector} from 'react-redux';
import {
  setOrganizations,
  setCurrentOrganization,
} from '../../store/modules/common/actions';

const useStyles = makeStyles((theme: CustomTheme) =>
  createStyles({
    card: {
      backgroundColor: theme.palette.background.default,
    },
    cardContent: {
      padding: 0,
    },
    userCard: {
      marginTop: theme.spacing(1),
      marginBottom: theme.spacing(1),
      backgroundColor: theme.palette.background.paper,
    },
    organizationCard: {
      backgroundColor: theme.palette.background.paper,
    },
    organizationLoader: {
      paddingTop: theme.spacing(3),
      paddingLeft: theme.spacing(3),
      backgroundColor: theme.palette.background.paper,
    },
    pageTitle: {
      fontFamily: 'Muli',
      fontWeight: 'bold',
      color: theme.header.lightBlue,
    },
    cardTitle: {
      fontFamily: 'Muli',
      fontWeight: 'bold',
      color: theme.palette.primary.main,
    },
    hidden: {
      visibility: 'hidden',
    },
  }),
);

export function Profile() {
  const { user, hasPermission, roles } = React.useContext(KeycloakContext);
  const { translate } = React.useContext(I18nContext);
  // const [currentOrganization, setCurrentOrganization] = useGlobal('currentOrganization');
  const api = React.useContext(ApiContext);
  const { enqueueSnackbar } = useSnackbar();
  const [resetConfirmationOpen, setResetConfirmationOpen] = React.useState(false);
  const [organizationsLoading, setOrganizationsLoading] = React.useState(false);
  const [passwordResetLoading, setPasswordResetLoading] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const [pickOrganizationOpen, setPickOrganizationOpen] = React.useState(false);
  const [organization, setOrganization] = React.useState<Organization | undefined>();
  const [profile, setProfile] = React.useState<User>();
  const [isNoteDisabled, setIsNoteDisabled] = React.useState(true);
  const [isPhoneDisabled, setIsPhoneDisabled] = React.useState(true);
  const [isChanged, setIsChanged] = React.useState(false);
  const [phone, setPhone] = React.useState('');
  const [isUpdatePhoneConfirmationOpen, setIsUpdatePhoneConfirmationOpen] = React.useState<boolean>(false);
  const organizations = useSelector((state: any) => state.CommonReducer.organizations);
  const currentOrganization = useSelector((state: any) => state.CommonReducer.currentOrganization);
  const dispatch = useDispatch();

  const theme: CustomTheme = useTheme();
  const classes = useStyles();

  const showDialog = () => {
    setIsOpen(true);
  };
  const hideDialog = () => {
    setIsOpen(false);
  };
  const showOrganizationPicker = () => {
    setPickOrganizationOpen(true);
  };
  const hideOrganizationPicker = () => {
    setPickOrganizationOpen(false);
  };
  const confirmReset = () => setResetConfirmationOpen(true);
  const confirmUpdatePhone = () => setIsUpdatePhoneConfirmationOpen(true);
  const closeResetConfirmation = () => setResetConfirmationOpen(false);

  const hasRenamePermissions = hasPermission(roles, PERMISSIONS.profile.renameOrganization);

  const { givenName, familyName, preferredUsername, email, currentOrganizationId } = user;

  const getOrganizations = async () => {
    if (api?.organizations) {
      setOrganizationsLoading(true);
      const response = await api.organizations.getOrganizations();
      if (response.kind === 'ok') {
        dispatch(setOrganizations(response.organizations))
      } else {
        log({
          file: `Profile.tsx`,
          caller: `getOrganizations - failed to get organizations`,
          value: response,
          important: true,
        });
      }
      setOrganizationsLoading(false);
    }
  };

  const getUserProfile = async () => {
    if (api?.user && user?.name) {
      setPasswordResetLoading(true);
      const response = await api.user.getProfile(user.name);
      if (response.kind === 'ok') {
        setProfile(response.user);
        setPhone(response.user.phone);
      } else {
        log({
          file: `Profile.tsx`,
          caller: `getOrganizations - failed to get organizations`,
          value: response,
          important: true,
        });
      }
      setPasswordResetLoading(false);
    }
  };

  const updatePhone = async () => {
    if (api?.user) {
      closeResetConfirmation();
      const response = await api.user.updatePhone(phone);
      const snackbarError: SnackbarError = {} as SnackbarError;
      if (response.kind === 'ok') {
        setProfile(response.user);
      } else {
        log({
          file: `UserProfile.tsx`,
          caller: `resetPassword - failed to reset password`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: SNACKBAR_VARIANTS.error });
      setIsUpdatePhoneConfirmationOpen(false);
    }
  };

  const handleBlur = () => {
    const updatedProfile = profile;
    const changedProfile = {phone}
    Object.assign(updatedProfile, changedProfile);
    setProfile(updatedProfile);
    setIsChanged(true);
    setIsPhoneDisabled(true)
  };

  const handleChange = (changedData: any) => {
    const updateProfile = profile;
    Object.assign(updateProfile, changedData);
    setProfile(updateProfile);
    setIsChanged(true);
  };

  const resetPassword = async () => {
    if (api?.user) {
      closeResetConfirmation();
      setPasswordResetLoading(true);
      const response = await api.user.resetPassword();
      const snackbarError: SnackbarError = {} as SnackbarError;
      if (response.kind === 'ok') {
        api.logout();
      } else {
        log({
          file: `UserProfile.tsx`,
          caller: `resetPassword - failed to reset password`,
          value: response,
          important: true,
        });
        snackbarError.isError = true;
        const { serverError } = response;
        if (serverError) {
          snackbarError.errorText = serverError.message || "";
        }
      }
      snackbarError?.isError && enqueueSnackbar(snackbarError.errorText, { variant: SNACKBAR_VARIANTS.error });
      setPasswordResetLoading(false);
    }
  };

  const handleOrganizationChange = (pickedOrganization: Organization) => {
    let shouldUpdate = false;
    if (!organization ||pickedOrganization.id !== organization.id) {
      shouldUpdate = true;
    }
    if (shouldUpdate) {
      localStorage.setItem(LOCAL_STORAGE_KEYS.ORGANIZATION_ID, pickedOrganization.id);
      setOrganization(pickedOrganization);
      dispatch(setCurrentOrganization(pickedOrganization));
    }
  };

  React.useEffect(() => {
    setPageTitle(translate('menu.profile'));
    if (currentOrganizationId && !organizations) {
      getOrganizations();
    }
    if(!profile) {
      getUserProfile();
    }
  }, []);

  // to get the currently selected organization's info
  React.useEffect(() => {
    if (organizations && organizations.length && currentOrganizationId) {
      for (let i = 0; i < organizations.length; i++) {
        const organization = organizations[i];
        if (organization.id === currentOrganizationId) {
          setOrganization(organization);
          break;
        }
      }
    }
  }, [organizations]);

  const renderUserCard = () => <Grid item xs component={Card} elevation={0} >
    <CardHeader
      title={translate('profile.user')}
      titleTypographyProps={{
        variant: 'h6',
        className: classes.cardTitle,
      }}
    />
    <CardContent>
      <Grid
        container
        direction='row'
        justify='flex-start'
        alignItems='center'
        alignContent='center'
        spacing={2}
      >
        <Grid item >
          <ICONS.Profile style={{ color: theme.header.lightBlue }} fontSize='large' />
        </Grid>
        <Grid item >
          <Typography color="textPrimary" gutterBottom >
            {translate('profile.fullName', { family: profile?.lastName || '', given: profile?.firstName || '' })}
          </Typography>
          <Typography color="textSecondary" style={{ marginBottom: "15px" }} >
            {`${preferredUsername}  •  ${profile?.email}`}
          </Typography>
          <Grid
              xs={8}
              container
              direction='column'
              justify='flex-start'
              alignItems='center'
              alignContent='center'
              spacing={2}
              style={{ marginTop: '5px;'  }}
          >
            <Textfield
                inputProps={{ style: {textAlign: 'center', width: 'fitContent'} }}
                placeholder={phone ? phone : '-'}
                value={phone ? phone : ''}
                color="secondary"
                onClick={() => setIsPhoneDisabled(false)}
                onBlur={handleBlur}
                disabled={isPhoneDisabled}
                label={translate("forms.phone")}
                onChange={(event) => setPhone(event.target.value)} />
          </Grid>
        </Grid>
      </Grid>
    </CardContent>
    <CardActions>
      <Button
        variant='contained'
        color='secondary'
        size="small"
        onClick={confirmReset}
        disabled={passwordResetLoading}
        startIcon={passwordResetLoading ?
          <MoonLoader
            sizeUnit={"px"}
            size={15}
            color={theme.palette.secondary.main}
            loading={true}
          /> : <VpnKeyIcon />}
      >
        {translate('profile.resetPassword')}
      </Button>
      <Button
          variant='contained'
          color='secondary'
          size="small"
          onClick={() => setIsUpdatePhoneConfirmationOpen(true)}
          disabled={!isChanged}
          startIcon={<CheckIcon />}
      >
        {translate("common.submit")}
      </Button>
    </CardActions>
  </Grid>;

  const renderOrganizationCard = () => <Grid item xs component={Card} elevation={0} >
    <CardHeader
      title={translate('profile.organization')}
      titleTypographyProps={{
        variant: 'h6',
        className: classes.cardTitle,
      }}
    />
    <Box borderLeft={1} borderColor={theme.table.border} className={classes.organizationCard} >
      <CardContent>
        <Grid
          container
          direction='row'
          justify='flex-start'
          alignItems='center'
          alignContent='center'
          spacing={2}
        >
          <Grid item >
            <ICONS.Organization style={{ color: theme.header.lightBlue }} fontSize='large' />
          </Grid>
          <Grid item >
            <Typography color="textPrimary" gutterBottom >
              {organization?.name}
            </Typography>
            <Typography color="textSecondary" >
              {organization?.id}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Box>
    <CardActions>
      {hasRenamePermissions && <Button
        variant='contained'
        color='primary'
        size="small"
        onClick={showDialog}
        startIcon={<EditIcon />}
      >{translate('organization.rename')}</Button>}
      {organizations && organizations.length > 1 && <Button
        variant='outlined'
        color='primary'
        size="small"
        onClick={showOrganizationPicker}
        startIcon={<ExpandMoreIcon />}
      >{translate('profile.changeOrganization')}</Button>}
    </CardActions>
  </Grid>;

  return (
    <Container >
      <Card elevation={0} className={classes.card} >
        <CardHeader title={translate('menu.profile')}
          titleTypographyProps={{
            className: classes.pageTitle,
          }} />
        <CardContent className={classes.cardContent} >
          <Box border={1} borderColor={theme.table.border} className={classes.userCard} >
            <Grid
              container
              direction='row'
              justify='center'
              alignItems='flex-start'
              alignContent='center'
            >
              {renderUserCard()}
              {(organizationsLoading || !organization) ? (
                <Grid item xs className={classes.organizationLoader} >
                  <List />
                </Grid>
              ) :
                renderOrganizationCard()}
            </Grid>
          </Box>
        </CardContent>
      </Card>
      <RenameOrganizationDialog
        name={(organization && organization.name) ? organization.name : ''}
        open={isOpen}
        onSuccess={getOrganizations}
        onClose={hideDialog}
      />
      <ConfirmationDialog
        destructive
        titleText={`${translate('profile.resetPassword')}?`}
        submitText={translate('common.reset')}
        open={resetConfirmationOpen}
        onSubmit={resetPassword}
        onCancel={closeResetConfirmation}
      />
      <ConfirmationDialog
          destructive
          titleText={`${translate('profile.updatePhoneTitle')}`}
          submitText={translate('profile.updatePhoneText')}
          open={isUpdatePhoneConfirmationOpen}
          onSubmit={updatePhone}
          onCancel={() => setIsUpdatePhoneConfirmationOpen(false)}
      />
      {organizations && organizations.length > 1 &&
        <OrganizationPickerDialog
          open={pickOrganizationOpen}
          organizations={organizations}
          currentOrganizationId={currentOrganizationId}
          onClose={hideOrganizationPicker}
          onSuccess={handleOrganizationChange}
        />}
    </Container>
  );
}
