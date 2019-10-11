import React, { useContext, useState } from "react";
import { I18nContext } from '../../hooks/i18n/I18nContext';

export function Home() {
  const [counter, setCounter] = useState(0)
  const { translate, i18n } = useContext(I18nContext);
  return (
    <div>
      <div>{translate("test")}</div>
      <div>{i18n.language}</div>
      <button onClick={() => i18n.changeLanguage(i18n.language === "en" ? "ko" : "en")}>
        CHANGE LANGUAGE
      </button>
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
