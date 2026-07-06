import joi from "joi";


const schemas={
    createInventorySchema:joi.object({
        variant_id:joi.number().integer().required(),
        current_stock:joi.number().integer().required(),
        reserved_stock:joi.number().integer().optional(),
        low_stock_threshold:joi.number().integer().optional(),
        last_stock_update_at:joi.date().optional(),
    }),
    updateInventorySchema:joi.object({
        variant_id:joi.number().integer().required(),
        current_stock:joi.number().integer().required(),
        reserved_stock:joi.number().integer().required(),
        low_stock_threshold:joi.number().integer().optional(),
        last_stock_update_at:joi.date().optional(),
    }),
    deleteInventorySchema:joi.object({}),
    
};

export function validate(schema){
    return (req,res,next)=>{
        const {error}=joi.object(schema).validate(req.body);
        if(error){
            return res.status(400).json({error:error.details[0].message});
        }
        next();
    }
}