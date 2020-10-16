import ReactDOM from 'react-dom';
import React, {setGlobal} from 'reactn';
import App from './App';
import './index.css';
import * as serviceWorker from './serviceWorker';
import {DEFAULT_SHORTCUTS} from './constants';
import {Provider} from 'react-redux';
import store from './store/store';

setGlobal({
    shortcuts: DEFAULT_SHORTCUTS,
    projectTdpDataShouldRefresh: false,
    showEditorPopups:false,
    editorAutoScrollDisabled: false,
    autoSeekDisabled: true,
    shouldSeek: true,
});

ReactDOM.render(
    <Provider store={store}>
        <App />
    </Provider>,
    document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
