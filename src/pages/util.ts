/** Hashmap */
export type typeHashmap<T> = { [key: string]: T };

/**
 * Transform array into hashmap getting the toKey from the toKey function
 * @param list
 * @param toKey function that returns toKey of this item
 */
export function toHashMap<T>(list: T[], toKey: (t: T) => string): typeHashmap<T> {
    return list.reduce((map: typeHashmap<T>, obj: T) => {
        map[toKey(obj)] = obj;
        return map;
    }, {})
}

/**
 * Format yyyy-MM-dd
 * @param d
 */
export function formatDate(d: Date): string;
/**
 * Format -> undefined
 * @param d
 */
export function formatDate(d: undefined): undefined;
/**
 * Format yyyy-MM-dd
 * @param d
 */
export function formatDate(d: Date | undefined): string | undefined;
/**
 * Format yyyy-MM-dd
 * @param d
 */
export function formatDate(d: Date | undefined): string | undefined {
    if (!d) return;
    return d.toISOString().substr(0, 10)
}


/**
 * Calculate the age from date and birthday
 * @param date
 * @param birthday
 */
export function age(date: Date, birthday: Date): number {
    let age = date.getFullYear() - birthday.getFullYear();
    if (date.getMonth() < birthday.getMonth()) {
        age--;
    } else if (date.getMonth() === birthday.getMonth() && date.getDate() < birthday.getDate()) {
        age--;
    }
    return age;
}