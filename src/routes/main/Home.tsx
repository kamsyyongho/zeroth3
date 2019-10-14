import React, { useContext, useState } from "react";
import { I18nContext } from '../../hooks/i18n/I18nContext';

export function Home() {
  const [counter, setCounter] = useState(0)
  return (
    <div>
      <div>{counter}</div>
      <button onClick={() => setCounter(counter + 1)}>
        plus
      </button>
      <button onClick={() => setCounter(counter - 1)}>
        minus
      </button>
      <button onClick={() => setCounter(0)}>
        zero
      </button>
    </div>
  )
}
