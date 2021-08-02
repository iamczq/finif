export namespace com.czq {
  export class ArrayUtil<T> {

    public * arrayToGenerator(array: T[]): Generator<T, T, unknown> {
      for (let i = 0; i < array.length - 1; i++) {
        yield array[i];
      }

      return array[array.length - 1];
    }
  }
}