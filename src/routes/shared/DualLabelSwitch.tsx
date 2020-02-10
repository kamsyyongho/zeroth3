import { FormControlLabel, Grid, Switch, Typography } from '@material-ui/core';
import { FormControlLabelProps } from '@material-ui/core/FormControlLabel';
import { SwitchProps } from '@material-ui/core/Switch';
import { TypographyProps } from '@material-ui/core/Typography';
import React from 'reactn';

interface DualLabelSwitchProps {
  startIcon?: JSX.Element;
  endIcon?: JSX.Element;
  startLabel?: string;
  endLabel?: string;
  startTypographyProps?: TypographyProps;
  endTypographyProps?: TypographyProps;
  switchProps?: SwitchProps;
  labelProps?: Omit<FormControlLabelProps, 'control'>;
}

export function DualLabelSwitch(props: DualLabelSwitchProps) {
  const {
    startIcon,
    endIcon,
    startLabel = '',
    endLabel = '',
    startTypographyProps = {},
    endTypographyProps = {},
    switchProps = {},
    labelProps = {},
  } = props;

  const dualSwitch: JSX.Element = <Grid
    component="label"
    container
    alignItems="center"
    alignContent='center'
    justify='center'
    spacing={3}
    style={{ padding: 10 }}
  >
    <Grid item>
      <Grid
        container
        item
        alignItems="center"
        alignContent='center'
        justify='center'
        spacing={5}
      >
        {startIcon && startIcon}
        <Typography {...startTypographyProps}>
          {startLabel}
        </Typography>
      </Grid>
    </Grid>
    <Grid item>
      <Switch
        {...switchProps}
      />
    </Grid>
    <Grid item>
      <Grid
        container
        item
        alignItems="center"
        alignContent='center'
        justify='center'
        spacing={5}
      >
        {endIcon && endIcon}
        <Typography {...endTypographyProps}>
          {endLabel}
        </Typography>
      </Grid>
    </Grid>
  </Grid>;

  return (
    <FormControlLabel
      control={dualSwitch}
      label={''}
      labelPlacement='top'
      {...labelProps}
    />
  );
}
