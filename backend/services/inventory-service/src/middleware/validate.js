import joi from "joi";


const schemas={
    createInventorySchema:joi.object({
        variant_id:joi.number().integer().required(),
        current_stock:joi.number().integer().required(),
        warehouse_id:joi.number().integer().required(),
        reserved_stock:joi.number().integer().optional(),
        low_stock_threshold:joi.number().integer().optional(),
        last_stock_update_at:joi.date().optional(),
    }),
    updateInventorySchema:joi.object({
        variant_id:joi.number().integer().required(),
        current_stock:joi.number().integer().optional(),
        reserved_stock:joi.number().integer().optional(),
        low_stock_threshold:joi.number().integer().optional(),
        last_stock_update_at:joi.date().optional(),
        warehouse_id:joi.number().integer().required()
    }),
    deleteInventorySchema:joi.object({
        id:joi.number().integer().required(),
    }),
    createStockMovementSchema:joi.object({
        variant_id:joi.number().integer().required(),
        warehouse_id:joi.number().integer().required(),
        movement_type:joi.string().valid("STOCK_IN","SALE","ADJUSTMENT","DAMAGE","RETURN").required(),
        quantity:joi.number().integer().positive().required(),
        after_stock:joi.when("movement_type", {
            is: "ADJUSTMENT",
            then: joi.number().integer().min(0).required(),
            otherwise: joi.number().integer().min(0).optional(),
        }),
        reason:joi.string().trim().allow("").optional(),
        created_by:joi.number().integer().optional(),
    }),
    createStockReservationSchema:joi.object({
        order_id:joi.number().integer().required(),
        variant_id:joi.number().integer().required(),
        warehouse_id:joi.number().integer().required(),
        quantity:joi.number().integer().positive().required(),
        expires_at:joi.date().optional(),
    }),
    createWarehouseSchema:joi.object({
        code:joi.string().required(),
        name:joi.string().required(),
        address:joi.string(),
        city:joi.string(),
        state:joi.string(),
        country:joi.string(),
        zone_id:joi.number(),
        latitude:joi.string().required(),
        longitude:joi.string().required(),
        contact_person:joi.string(),
        contact_phone:joi.string(),
        is_active:joi.string()



    }),
    updateWarehouseSchema:joi.object({
        code:joi.string().optional(),
        name:joi.string().optional(),
        address:joi.string().optional(),
        city:joi.string().optional(),
        state:joi.string().optional(),
        country:joi.string().optional(),
        zone_id:joi.number().optional(),
        latitude:joi.string().optional(),
        longitude:joi.string().optional(),
        contact_person:joi.string().optional(),
        contact_phone:joi.string().optional(),
        is_active:joi.boolean().optional()
    })
    
};

export function validate(schema){
    return (req,res,next)=>{
        if(!schemas[schema]){
            return res.status(500).json({error:`Validation schema ${schema} not found`});
        }
        const {error}=schemas[schema].validate(req.body);
        if(error){
            return res.status(400).json({error:error.details[0].message});
        }
        next();
    }
}
