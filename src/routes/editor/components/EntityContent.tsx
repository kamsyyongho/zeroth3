import { Tooltip, Typography } from '@material-ui/core';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import { ContentState, DraftEntityMutability } from 'draft-js';
import React from 'react';
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
  }),
);

const styles: { [x: string]: React.CSSProperties; } = {
  editor: {
    border: '1px solid #ccc',
    cursor: 'text',
    minHeight: 80,
    padding: 10
  },
  button: {
    marginTop: 10,
    textAlign: 'center'
  },
  immutable: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: '2px 0'
  },
  mutable: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    // backgroundColor: 'rgba(204, 204, 255, 1.0)',
    padding: '2px 0'
  },
  segmented: {
    backgroundColor: 'rgba(248, 222, 126, 1.0)',
    padding: '2px 0'
  }
};

function getDecoratedStyle(mutability: DraftEntityMutability) {
  switch (mutability) {
    case MUTABILITY_TYPE.IMMUTABLE:
      return styles.immutable;
    case MUTABILITY_TYPE.MUTABLE:
      return styles.mutable;
    case MUTABILITY_TYPE.SEGMENTED:
      return styles.segmented;
    default:
      return null;
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
  const tokenEntity = contentState.getEntity(entityKey);
  const type = tokenEntity.getType();
  const mutability = tokenEntity.getMutability();
  const targetData: WordAlignmentEntityData = tokenEntity.getData();
  const { wordAlignment } = targetData;
  const confidence = wordAlignment?.confidence ?? 0;
  const LC = confidence < wordConfidenceThreshold;
  let style = getDecoratedStyle(mutability) ?? {};
  if (LC) {
    style = { ...style, backgroundColor: 'rgba(248, 222, 126, 1.0)' };
  }
  if (type === ENTITY_TYPE.TEMP) {
    style = { ...style, backgroundColor: 'red' };
  }


  if (debugMode) {
    const timeText = `start: ${wordAlignment?.start}, length: ${wordAlignment?.length}`;
    return <Tooltip
      placement='bottom'
      title={<Typography variant='body1' >{timeText}</Typography>}
      arrow={true}
      classes={{ tooltip: classes.tooltipContent }}
    >
      <span data-offset-key={offsetKey} style={style}>
        {props.children}
      </span>
    </Tooltip>;
  }

  return (
    <span data-offset-key={offsetKey} style={style}>
      {props.children}
    </span>
  );
};
