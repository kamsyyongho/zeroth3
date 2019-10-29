import { Container } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import MoreVertIcon from '@material-ui/icons/MoreVert';
import React from 'react';
import { I18nContext } from '../../../../hooks/i18n/I18nContext';
import { SubGraph } from '../../../../types/models.types';
import { SubgraphFormDialog } from '../SubgraphFormDialog';

const useStyles = makeStyles((theme: Theme) =>
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
  subGraphs: SubGraph[]
  handleSubGraphCreate: (subGraph: SubGraph) => void
}


export function SubGraphList(props: SubGraphListProps) {
  const { subGraphs, handleSubGraphCreate } = props;
  const { translate } = React.useContext(I18nContext);
  const [subOpen, setSubOpen] = React.useState(false)
  const [subGraphToEdit, setSubGraphToEdit] = React.useState<SubGraph | undefined>(undefined)

  const openEditDialog = (subGraphToEdit: SubGraph) => {
    setSubGraphToEdit(subGraphToEdit);
    setSubOpen(true);
  }

  const closeDialog = () => {
    setSubGraphToEdit(undefined);
    setSubOpen(false);
  }

  const openCreateDialog = () => setSubOpen(true);

  const classes = useStyles();

  const renderListItems = () => subGraphs.map(subGraph => (
    <ListItem key={subGraph.id}>
      <Card className={classes.card}>
        <CardHeader title={subGraph.name} titleTypographyProps={{ variant: 'body1' }} className={classes.text} action={
          <IconButton aria-label="edit" onClick={() => openEditDialog(subGraph)}>
            <MoreVertIcon />
          </IconButton>} />
      </Card>
    </ListItem>
  ))

  return (
    <Container maxWidth={false} className={classes.container} >
      <SubgraphFormDialog
        open={subOpen}
        subGraphToEdit={subGraphToEdit}
        onClose={closeDialog}
        onSuccess={handleSubGraphCreate}
      />
      <Card>
        <CardHeader
          title={translate("models.header")}
        />
        <CardContent className={classes.cardContent} >
          <List >
            {renderListItems()}
          </List>
        </CardContent>
        <CardActions>
          <Button
            color="primary"
            variant='contained'
            onClick={openCreateDialog}
            startIcon={<AddIcon />}
          >
            {translate('models.createSubGraph')}
          </Button>
        </CardActions>
      </Card>
    </Container>
  );
}