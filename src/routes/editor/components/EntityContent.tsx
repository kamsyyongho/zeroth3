import { Tooltip, Typography } from '@material-ui/core';
import { createStyles, makeStyles, useTheme } from '@material-ui/core/styles';
import { ContentState, DraftEntityMutability } from 'draft-js';
import React from 'reactn';
import { CustomTheme } from '../../../theme/index';
import { ENTITY_TYPE, MUTABILITY_TYPE, WordAlignmentEntityData } from '../../../types';

const useStyles = makeStyles((theme: CustomTheme) =>
  createStyles({
    root: {
      margin: theme.spacing(1),
    },
    hiddenIcon: {
      color: theme.palette.background.paper,
    },
    button: {
      marginLeft: theme.spacing(2),
      textTransform: 'none',
    },
    outlineHidden: {
      borderColor: `${theme.palette.background.paper} !important`,
    },
    infoGrid: {
      marginBottom: theme.spacing(1),
    },
    block: {
      marginLeft: theme.spacing(1),
    },
    tooltipContent: {
      maxWidth: 'none',
    },
    mutable: {
      backgroundImage: theme.editor.entityGradient,
      padding: '2px 0',
    },
    mutableLongWord: {
      backgroundColor: theme.editor.entity,
      padding: '2px 0',
    },
  }),
);

function getEntityClassName(mutability: DraftEntityMutability, classes: any, isLongWord?: boolean) {
  switch (mutability) {
    case MUTABILITY_TYPE.IMMUTABLE:
      return classes.mutable;
    case MUTABILITY_TYPE.MUTABLE:
      if (isLongWord) {
        return classes.mutableLongWord;
      }
      return classes.mutable;
    case MUTABILITY_TYPE.SEGMENTED:
      return classes.mutable;
    default:
      return undefined;
  }
}

interface EntityContentProps extends React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement> {
  contentState: ContentState,
  offsetKey: string,
  entityKey: string,
  wordConfidenceThreshold: number;
  debugMode?: boolean;
}

export const EntityContent = (props: EntityContentProps) => {
  const { contentState, offsetKey, entityKey, wordConfidenceThreshold, debugMode } = props;
  const classes = useStyles();
  const theme: CustomTheme = useTheme();
  const tokenEntity = contentState.getEntity(entityKey);
  const type = tokenEntity.getType();
  const mutability = tokenEntity.getMutability();
  const targetData: WordAlignmentEntityData = tokenEntity.getData();
  const { wordAlignment } = targetData;
  const isLongWord = wordAlignment.word.length > 15;
  const confidence = wordAlignment?.confidence ?? 0;
  const LC = confidence < wordConfidenceThreshold;
  const entityClassName = getEntityClassName(mutability, classes, isLongWord);
  let style = {};
  if (LC) {
    style = { backgroundImage: theme.editor.LowConfidenceGradient };
  }
  if (type === ENTITY_TYPE.TEMP) {
    style = { ...style, backgroundColor: theme.editor.highlight };
  }


  if (debugMode) {
    const timeText = `start: ${wordAlignment?.start}, length: ${wordAlignment?.length}`;
    return <Tooltip
      placement='bottom'
      title={<Typography variant='body1' >{timeText}</Typography>}
      arrow={true}
      classes={{ tooltip: classes.tooltipContent }}
    >
      <span data-offset-key={offsetKey} className={entityClassName} style={style}>
        {props.children}
      </span>
    </Tooltip>;
  }

  return (
    <span data-offset-key={offsetKey} className={entityClassName} style={style}>
      {props.children}
    </span>
  );
};
