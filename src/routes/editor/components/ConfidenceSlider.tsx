import { CardContent, CardHeader } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import Grid from '@material-ui/core/Grid';
import Input from '@material-ui/core/Input';
import Slider from '@material-ui/core/Slider';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import React from 'reactn';
import { I18nContext } from '../../../hooks/i18n/I18nContext';

let timeoutId: NodeJS.Timeout | undefined;

const useStyles = makeStyles((theme) =>
  createStyles({
    root: {
      minWidth: 250,
    },
    input: {
      width: 42,
    },
  }),
);

interface ConfidenceSliderProps {
  wordConfidenceThreshold: number;
  onThresholdChange: (threshold: number) => void;
  setSliderOpen: (open: boolean) => void;
  isOpen: boolean;
}

export function ConfidenceSlider(props: ConfidenceSliderProps) {
  const {
    wordConfidenceThreshold,
    onThresholdChange,
    setSliderOpen,
    isOpen,
  } = props;
  const { translate } = React.useContext(I18nContext);
  const classes = useStyles();
  const [value, setValue] = React.useState<number>(wordConfidenceThreshold * 100);

  const handleSliderChange = (event: any, newValue: number | number[]) => {
    const updateValue = typeof newValue === 'number' ? newValue : newValue[0];
    setValue(updateValue);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    let value = event.target.value === '' ? 0 : Number(event.target.value);
    if (value < 0) {
      value = 0;
    } else if (value > 100) {
      value = 100;
    }
    setValue(value);
  };

  // update the parent value when the slider is hidden
  React.useEffect(() => {
    if (!isOpen) {
      const adjustedValue = value / 100;
      onThresholdChange(adjustedValue);
    }
  }, [isOpen]);


  // update the parent once we mount and dismount
  React.useEffect(() => {
    // to account for the initial calling of the clickAwayListener
    // gets run on mount
    timeoutId = setTimeout(() => {
      setSliderOpen(true);
    }, 50);

    // gets run on dismount
    return () => {
      setSliderOpen(false);
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    };
  }, []);


  return (
    <Card className={classes.root}>
      <CardHeader
        title={translate('editor.setWordConfidence')}
      />
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs>
            <Slider
              value={typeof value === 'number' ? value : 0}
              onChange={handleSliderChange}
              aria-labelledby="input-slider"
            />
          </Grid>
          <Grid item>
            <Input
              className={classes.input}
              value={value}
              margin="dense"
              onChange={handleInputChange}
              inputProps={{
                step: 1,
                min: 0,
                max: 100,
                type: 'number',
                'aria-labelledby': 'input-slider',
              }}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
