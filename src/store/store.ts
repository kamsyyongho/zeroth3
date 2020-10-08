import { createStore, applyMiddleware } from 'redux';
import ReduxThunk from 'redux-thunk';
import modules from './modules/index';
import { composeWithDevTools } from  'redux-devtools-extension';

// enable trace to limit of 25 to trace errors in initial setup (delete later if debugging trigger log is not needed)
const composeEnhancers = composeWithDevTools({ trace: true, traceLimit: 25 });
export default createStore(
    modules,
    composeEnhancers(),
);
