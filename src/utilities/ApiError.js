class ApiError extends Error{
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ){
        super(message);
        this.statusCode = statusCode;
        this.message = message;
        this.data = null;
        this.errors = errors;
        this.stack = stack;
        this.success = false;

        if(!stack){
            Error.captureStackTrace(this, this.constructor);
        }else{
            this.stack = stack;
        }
    }
}

export default ApiError;