import { createStore, applyMiddleware } from 'redux';
import ReduxThunk from 'redux-thunk';
import modules from './modules';

export default createStore(modules);
