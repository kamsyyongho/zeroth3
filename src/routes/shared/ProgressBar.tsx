import { LinearProgress } from "@material-ui/core";
import React from "react";

interface ProgressBarProps {
  /** from `0` to `100` */
  value: number;
  maxWidth?: number;
  minWidth?: number;
}

export function ProgressBar(props: ProgressBarProps) {
  const { value, maxWidth, minWidth } = props;
  const style: React.CSSProperties = { borderRadius: 50 };
  if (minWidth) style.minWidth = minWidth;
  if (maxWidth) style.maxWidth = maxWidth;

  const sanitizedValue = isNaN(value) ? 0 : value;

  return (
    <LinearProgress variant="determinate" value={sanitizedValue} style={style} />
  );
}