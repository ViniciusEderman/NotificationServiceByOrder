export class AppError {
    constructor(
        public readonly code: string, 
        public readonly message: string,
        public readonly details?: Record<string, any>
    ) {}
}

export class Result<T> {
    private constructor(
        public readonly isSuccess: boolean,
        private readonly _value?: T,
        private readonly _error?: AppError
    ) {}

    public getValue(): T {
        if (!this.isSuccess) {
            throw new Error("can't get the value of a failure result.");
        }
        return this._value as T;
    }

    public getError(): AppError {
        if (this.isSuccess) {
            throw new Error("can't get the error of a success result.");
        }
        return this._error as AppError;
    }

    public static ok<T>(value: T): Result<T> {
        return new Result(true, value);
    }

    public static fail<T>(error: AppError): Result<T> {
        return new Result<T>(false, undefined, error);
    }
}
