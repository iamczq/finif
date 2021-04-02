export namespace com.czq {
  export class ArrayUtil<T> {
    constructor() {
    }

    public * arrayToGenerator(array: T[]) {
      for (let i = 0; i < array.length - 1; i++) {
        yield array[i];
      }

      return array[array.length - 1];
    }
  }
}