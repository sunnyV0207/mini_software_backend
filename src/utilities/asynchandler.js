const asynchandler = (fn) => {
    return (req,res,next) => {
        Promise.resolve(fn(req,res,next)).catch((err)=>{
            console.log(err);
            res.status(500).json({
                success: false,
                message: "Internal Server Error"
            });
        });
    }
}

export default asynchandler;