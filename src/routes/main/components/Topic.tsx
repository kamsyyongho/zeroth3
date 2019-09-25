import React from "react";
import { RouteComponentProps } from "react-router";

export function Topic({ match }: RouteComponentProps<{ topicId: string }>) {
  return (
    <div>
      <h3>{match.params.topicId}</h3>
    </div>
  );
}