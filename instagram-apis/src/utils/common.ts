export const omitField = <T, K extends keyof T>(obj: T, key: K): Omit<T, K> => {
    const result = { ...obj };

    delete result[key];

    return result;
};
