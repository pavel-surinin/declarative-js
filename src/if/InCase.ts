import { Assert } from '../assert/Assert'
import { or } from './Or'

export type Predicate<T> = (val: T) => boolean

const tomap = <T, R>(
    {mapper, value, predicate}
    : {mapper: (value: T) => R, value: T, predicate: Predicate<T>}
) => ({
    map: <E>(chainMapper: (value: R) => E) => tomap({
        mapper: chainMapper,
        value: mapper(value),
        predicate: predicate(value) ? () => true : () => false
    }),
    get: () => {
        if (predicate(value)) {
            return mapper(value)
        }
        throw new Error('Value does not meet the condition')
    },
    or: or({mapper, value, predicate})
})

const then = <T>( assert: Predicate<T>, v: T) => {
    return {
        throw: (errMessage?: string) => {
            if (assert(v)) {
                throw new Error(errMessage)
            }
        },
        do: (callback: () => void) => {
            if (assert(v)) {
                callback()
            }
        },
        map: <R>(mapper: (value: T) => R) => tomap({
            mapper,
            predicate: assert,
            value: v
        })
    }
}
/**
 * Function that returns other functions that takes predicates, conditions and returns boolean as a result
 * @param v     value to check
 */
export const predict = <T>(v: T) => ({
    /**
     * Value must match all predicates to be {@code true}
     */
    all: (...predicates: Predicate<T>[]) => predicates.every(p => p(v)),
    /**
     * Value must match at least one predicate to be {@code true}
     */
    some: (...predicates: Predicate<T>[]) => predicates.some(p => p(v)),
    /**
     * Value must match none predicates to be {@code true}
     */
    none: (...predicates: Predicate<T>[]) => !predicates.every(p => p(v)),
    /**
     * Value to match one predicate to be {@code true}
     */
    only: (p: Predicate<T>) => p(v)
})

/**
 * Function that returns other functions that takes predicates, conditions and returns boolean as a result
 * @param v     value to check
 */
const meet = <T>(v: T) => ({
    all: (...predicates: Predicate<T>[]) => then(() => predicates.every(p => p(v)), v),
    some: (...predicates: Predicate<T>[]) => then(() => predicates.some(p => p(v)), v),
    none: (...predicates: Predicate<T>[]) => then(() => !predicates.every(p => p(v)), v),
    only: (p: Predicate<T>) => then(p, v)
})

export const inCase = <T>(value: T) => ({
    not: {
        undefined: then(v => !Assert.isUndefined(v), value),
        empty: then(v => !Assert.isEmpty(v), value),  
        typeof: (type: Assert.JSType) => then(v => !Assert.is(v).typeof(type), value),
        null: then(v => !Assert.isNull(v), value),
        // tslint:disable-next-line:no-any
        equals: (valueToComapre: any) => then(() => !Assert.isEqual(value)(valueToComapre), value),
        present: then(v => Assert.isNull(v) || Assert.isUndefined(v), value)
    },
    present: then(v => !Assert.isNull(v) && !Assert.isUndefined(v), value),
    empty: then(Assert.isEmpty, value),
    undefined: then(Assert.isUndefined, value), 
    typeof: (type: Assert.JSType) => then(v => Assert.is(v).typeof(type), value),
    null: then(Assert.isNull, value),    
    meets: meet(value),
    // tslint:disable-next-line:no-any
    equals: (valueToComapre: any) => then(() => Assert.isEqual(value)(valueToComapre), value),
})
