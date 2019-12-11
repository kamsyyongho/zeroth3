import { Container } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Checkbox from '@material-ui/core/Checkbox';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import EditIcon from '@material-ui/icons/Edit';
import React from 'react';
import { BulletList } from 'react-content-loader';
import MoonLoader from 'react-spinners/MoonLoader';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { SubGraph } from '../../../../types';
import { CheckedSubGraphById } from '../ModelTabs';
import { SubgraphFormDialog } from '../SubgraphFormDialog';

const useStyles = makeStyles((theme) =>
  createStyles({
    container: {
      padding: 0,
      marginHorizontal: 0,
      marginBottom: 0,
      marginTop: 20,
    },
    cardContent: {
      padding: 0,
    },
    card: {
      minWidth: 275,
    },
    text: {
      overflowWrap: 'break-word'
    }
  }),
);

export interface SubGraphListProps {
  canModify: boolean;
  subGraphsLoading: boolean;
  subGraphs: SubGraph[];
  checkedSubGraphs: CheckedSubGraphById;
  deleteLoading: boolean;
  canDelete: boolean;
  confirmDelete: () => void;
  handleSubGraphListUpdate: (subGraph: SubGraph, isEdit?: boolean) => void;
  handleSubGraphCheck: (subGraphId: string, value: boolean) => void;
}

export function SubGraphList(props: SubGraphListProps) {
  const {
    canModify,
    subGraphsLoading,
    subGraphs,
    checkedSubGraphs,
    deleteLoading,
    canDelete,
    confirmDelete,
    handleSubGraphListUpdate,
    handleSubGraphCheck,
  } = props;
  const { translate } = React.useContext(I18nContext);
  const [subOpen, setSubOpen] = React.useState(false);
  const [subGraphToEdit, setSubGraphToEdit] = React.useState<SubGraph | undefined>(undefined);

  const openEditDialog = (subGraphToEdit: SubGraph) => {
    setSubGraphToEdit(subGraphToEdit);
    setSubOpen(true);
  };

  const closeDialog = () => {
    setSubGraphToEdit(undefined);
    setSubOpen(false);
  };

  const openCreateDialog = () => setSubOpen(true);

  const classes = useStyles();
  const theme = useTheme();

  const renderListItems = () => subGraphs.map(subGraph => {
    let isChecked = false;
    if (checkedSubGraphs && typeof checkedSubGraphs[subGraph.id] === 'boolean') {
      isChecked = checkedSubGraphs[subGraph.id];
    }
    return (
      <ListItem key={subGraph.id}>
        <Card className={classes.card}>
          <CardHeader title={subGraph.name} titleTypographyProps={{ variant: 'body1' }} className={classes.text} action={(canModify && <>
            <Checkbox checked={isChecked} value="checkedB" color="secondary" onChange={(event) => handleSubGraphCheck(subGraph.id, event.target.checked)} />
            <IconButton aria-label="edit" onClick={() => openEditDialog(subGraph)}>
              <EditIcon />
            </IconButton></>)} />
        </Card>
      </ListItem>
    );
  });

  return (
    <Container maxWidth={false} className={classes.container} >
      <SubgraphFormDialog
        open={subOpen}
        subGraphToEdit={subGraphToEdit}
        onClose={closeDialog}
        onSuccess={handleSubGraphListUpdate}
      />
      <Card elevation={0}>
        <CardHeader
          title={translate("models.subGraphHeader")}
        />
        {subGraphsLoading ? <BulletList /> : (
          <>
            <CardContent className={classes.cardContent} >
              <List >
                {renderListItems()}
              </List>
            </CardContent>
            {canModify && <CardActions>
              {!!subGraphs.length && <Button
                disabled={!canDelete}
                variant="contained"
                color="secondary"
                onClick={confirmDelete}
                startIcon={deleteLoading ? <MoonLoader
                  sizeUnit={"px"}
                  size={15}
                  color={theme.palette.common.white}
                  loading={true}
                /> : <DeleteIcon />}
              >
                {translate('common.delete')}
              </Button>}
              <Button
                color="primary"
                variant='contained'
                onClick={openCreateDialog}
                startIcon={<AddIcon />}
              >
                {translate('models.createSubGraph')}
              </Button>
            </CardActions>}
          </>)}
      </Card>
    </Container>
  );
}