import {test} from 'ava';
import {createContainer, IDependencyParams} from "../lib/index";
import typescriptFsa, {Action, isType} from "typescript-fsa";

const actionCreator = typescriptFsa('TEST');
const plus = actionCreator<number>('PLUS');
const minus = actionCreator<number>('MINUS');
const multiply = actionCreator<number>('MULTIPLY');

test('initial', t => {
    const container = createContainer();

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
        reducerFn: (state, action, plusOrMinusValue: number, multiplyOrDivideValue: number) => {
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

test('preloadedState', t => {
    const container = createContainer();

    const emptyDependencyParams: IDependencyParams<number, any, any> = {
        dependencies: [plus, minus],
        reducerFn: (state = 0) => {
            return state;
        },
        initialState: 0
    };
    const empty = container.createDependency(emptyDependencyParams);

    const preloadedState = {
        empty: 9,
    };

    const reducer = container.combine({
        empty,
    }, preloadedState);

    const store = require('redux').createStore(reducer, {});

    store.dispatch(plus(5));

    t.deepEqual(store.getState(), preloadedState);

    t.pass();
});
