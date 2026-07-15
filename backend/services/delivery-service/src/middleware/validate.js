import joi from "joi";
import ResponseUtil from "../utils/response.js";

const schema={
    createDeliverySchema:joi.object({
        order_id:joi.string().uuid().optional(),
        delivery_partner_id:joi.string().uuid().optional(),
        delivery_slot_id:joi.string().uuid().optional(),
        assignment_source:joi.string().optional(),
        assigned_by:joi.string().uuid().optional(),
        assigned_at:joi.date().optional(),
        status:joi.string().optional()
    }).min(1),
    updateDeliverySchema:joi.object({
        order_id:joi.string().uuid().optional(),
        delivery_partner_id:joi.string().uuid().optional(),
        delivery_slot_id:joi.string().uuid().optional(),
        assignment_source:joi.string().optional(),
        assigned_by:joi.string().uuid().optional(),
        assigned_at:joi.date().optional(),
        status:joi.string().optional()
    }).min(1),
    createDeliveryPartnerSchema:joi.object({
        vehicle_type:joi.string().required(),
        vehicle_number:joi.string().required(),
        max_active_orders:joi.number().integer().min(1).required(),
        current_latitude:joi.number().optional(),
        current_longitude:joi.number().optional()
    }).and("current_latitude", "current_longitude"),
    updateDeliveryPartnerSchema:joi.object({
        vehicle_type:joi.string().optional(),
        vehicle_number:joi.string().optional(),
        max_active_orders:joi.number().integer().min(1).optional(),
        status:joi.string().optional()
    }).min(1),
    updateDeliveryPartnerLocationSchema:joi.object({
        current_latitude:joi.number().required(),
        current_longitude:joi.number().required()
    }),
    createDeliveryZoneSchema:joi.object({
        code:joi.string().max(50).required(),
        name:joi.string().max(150).required(),
        city:joi.string().max(100).required(),
        state:joi.string().max(100).optional(),
        country:joi.string().max(100).optional(),
        postal_codes:joi.string().optional(),
        latitude:joi.number().min(-90).max(90).optional(),
        longitude:joi.number().min(-180).max(180).optional(),
        radius_km:joi.number().min(0).precision(2).optional(),
        delivery_fee:joi.number().min(0).precision(2).optional(),
        minimum_order_amount:joi.number().min(0).precision(2).optional(),
        estimated_delivery_time:joi.number().integer().min(0).optional(),
        is_active:joi.boolean().optional()
    }),
    updateDeliveryZoneSchema:joi.object({
        code:joi.string().max(50).optional(),
        name:joi.string().max(150).optional(),
        city:joi.string().max(100).optional(),
        state:joi.string().max(100).optional(),
        country:joi.string().max(100).optional(),
        postal_codes:joi.string().optional(),
        latitude:joi.number().min(-90).max(90).optional(),
        longitude:joi.number().min(-180).max(180).optional(),
        radius_km:joi.number().min(0).precision(2).optional(),
        delivery_fee:joi.number().min(0).precision(2).optional(),
        minimum_order_amount:joi.number().min(0).precision(2).optional(),
        estimated_delivery_time:joi.number().integer().min(0).optional(),
        is_active:joi.boolean().optional()
    }).min(1),
    createDeliveryPartnerZoneSchema:joi.object({
        delivery_partner_id:joi.string().uuid().required(),
        zone_id:joi.number().integer().positive().required(),
        is_primary:joi.boolean().optional()
    }),
    updateDeliveryPartnerZoneSchema:joi.object({
        delivery_partner_id:joi.string().uuid().optional(),
        zone_id:joi.number().integer().positive().optional(),
        is_primary:joi.boolean().optional()
    }).min(1),
    assignOrderSchema:joi.object({
        order_id:joi.string().uuid().required(),
        delivery_partner_id:joi.string().uuid().required(),
        delivery_slot_id:joi.string().uuid().required(),
        assignment_source:joi.string().optional()
    })

}

const validate = (schemaName) => {
    return (req, res, next) => {
        if (!schema[schemaName]) {
            return ResponseUtil.error(res, "Validation schema not found", 500);
        }

        const { error, value } = schema[schemaName].validate(req.body);
        if (error) {
            return ResponseUtil.error(res, error.details[0].message, 400);
        }
        req.body = value;
        next();
    };
};

export default validate;
