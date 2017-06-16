import {test} from 'ava';
import {createContainer, IDependencyParams} from "../lib/index";
import {Action} from "typescript-fsa";
const fsa = require('typescript-fsa');

const isType = fsa.isType;

const container = createContainer();
const createAction = fsa.default();
const plus = createAction('PLUS');
const minus = createAction('MINUS');
const multiply = createAction('MULTIPLY');

test('initial', t => {
    const plusOrMinusDependencyParams: IDependencyParams<number, any, any> = {
        dependencies: [plus, minus],
        reducerFn: (state = 0, action) => {
            if (isType(action, plus)) {
                return state + action.payload;
            } else if (isType(action, minus)) {
                return state - action.payload;
            }
            return state;
        },
        initialState: 0
    };
    const plusOrMinus = container.createDependency(plusOrMinusDependencyParams);

    const multiplyOrDivideDependencyParams: IDependencyParams<number, any, any> = {
        dependencies: [multiply],
        reducerFn: (state, action: Action<number>) => {
            return state * action.payload;
        },
        initialState: 1
    };
    const multiplyOrDivide = container.createDependency(multiplyOrDivideDependencyParams);

    const allOperatorsDependencyParams: IDependencyParams<number, any, any> = {
        dependencies: [plusOrMinus, multiplyOrDivide],
        reducerFn:  (state, action, plusOrMinusValue: number, multiplyOrDivideValue: number) => {
            if (state > 100) {
                throw Error();
            }
            if (isType(action, plus) || isType(action, minus)) {
                return state + plusOrMinusValue;
            } else if (isType(action, multiply)) {
                return state + multiplyOrDivideValue;
            }
            return state;
        },
        initialState: 0
    };
    const sumAllOperators = container.createDependency(allOperatorsDependencyParams);

    interface IState {
        plusOrMinus: number,
        multiplyOrDivide: number,
        sumAllOperators: number,
    }

    const reducer = container.combine({
        plusOrMinus,
        multiplyOrDivide,
        sumAllOperators,
    });

    const store = require('redux').createStore(reducer, {});

    store.dispatch(plus(5));
    t.is(store.getState().plusOrMinus, 5);
    store.dispatch(minus(1));
    t.is(store.getState().plusOrMinus, 4);
    store.dispatch(minus(1));
    t.is(store.getState().plusOrMinus, 3);
    store.dispatch(multiply(100));
    t.is(store.getState().multiplyOrDivide, 100);
    t.is(store.getState().sumAllOperators, 112);

    const prevState = store.getState();
    try {
        store.dispatch(plus(100));
    } catch (e) {
        // testing transactions
    }
    t.deepEqual(store.getState(), prevState);
    t.pass();
});
