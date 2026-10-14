import joi from "joi";
import ResponseUtil from "../utils/response.js";
import {
    DOC_TYPES, FIELD_ITEMS, LISTED_STATUSES, MAX_ORDERS, REASON_CODES, VEHICLE_TYPES,
} from "../modules/partnerApplication/partnerApplicationRules.js";

// A real calendar day as "YYYY-MM-DD". joi.date().iso() also lets 2026-02-31 and full timestamps through, and a DATEONLY
// column then fails with a 500.
const dateOnly = joi.string().custom((value, helpers) => {
    const time = /^\d{4}-\d{2}-\d{2}$/.test(value) ? Date.parse(`${value}T00:00:00Z`) : NaN;
    return !Number.isNaN(time) && new Date(time).toISOString().slice(0, 10) === value ? value : helpers.error("date.base");
}).messages({ "date.base": "{{#label}} must be a real date as YYYY-MM-DD" });

// Decisions carry the version the reviewer was looking at; a stale one is a 409.
const expectedVersion = joi.number().integer().min(0).required();

const schema={
    createDeliverySchema:joi.object({
        order_id:joi.number().integer().positive().optional(),
        delivery_partner_id:joi.string().uuid().optional(),
        delivery_slot_id:joi.string().uuid().optional(),
        assignment_source:joi.string().optional(),
        assigned_by:joi.number().integer().positive().optional(),
        assigned_at:joi.date().optional(),
        status:joi.string().optional()
    }).min(1),
    updateDeliverySchema:joi.object({
        order_id:joi.number().integer().positive().optional(),
        delivery_partner_id:joi.string().uuid().optional(),
        delivery_slot_id:joi.string().uuid().optional(),
        assignment_source:joi.string().optional(),
        assigned_by:joi.number().integer().positive().optional(),
        assigned_at:joi.date().optional(),
        status:joi.string().optional()
    }).min(1),
    createDeliveryPartnerSchema:joi.object({
        name:joi.string().trim().max(150).optional(),
        phone:joi.string().trim().max(20).optional(),
        vehicle_type:joi.string().required(),
        vehicle_number:joi.string().required(),
        max_active_orders:joi.number().integer().min(1).required(),
        current_latitude:joi.number().optional(),
        current_longitude:joi.number().optional()
    }).and("current_latitude", "current_longitude"),
    updateDeliveryPartnerSchema:joi.object({
        name:joi.string().trim().max(150).optional(),
        phone:joi.string().trim().max(20).optional(),
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
        order_id:joi.number().integer().positive().required(),
        delivery_partner_id:joi.string().uuid().required(),
        delivery_slot_id:joi.string().uuid().required(),
        assignment_source:joi.string().optional()
    }),
    // Partner onboarding. phone, user_id, status, source never come from the body, so unknown keys are refused.
    createPartnerApplicationSchema:joi.object({
        name:joi.string().trim().min(2).max(150).required(),
        email:joi.string().trim().email().max(150).allow(null,"").optional(),
        preferred_zone_id:joi.number().integer().positive().optional(),
        vehicle_type:joi.string().valid(...VEHICLE_TYPES).required(),
        // Required unless the vehicle is a cycle; the service enforces that with the merged state.
        vehicle_number:joi.string().trim().min(4).max(20).allow(null,"").optional()
    }),
    updatePartnerApplicationSchema:joi.object({
        name:joi.string().trim().min(2).max(150).optional(),
        email:joi.string().trim().email().max(150).allow(null,"").optional(),
        preferred_zone_id:joi.number().integer().positive().optional(),
        vehicle_type:joi.string().valid(...VEHICLE_TYPES).optional(),
        vehicle_number:joi.string().trim().min(4).max(20).allow(null,"").optional()
    }).min(1),
    // Text fields that ride along with the uploaded file (multipart), so every value arrives as a string.
    partnerDocumentSchema:joi.object({
        number:joi.string().trim().max(30).optional(),
        expiry_date:dateOnly.optional()
    }),
    submitPartnerApplicationSchema:joi.object({
        consent:joi.valid(true).required()
    }),
    // Review path (staff). Unknown keys are refused, as above.
    // Query string of the staff queue (validate(name, "query")). No status means the three open ones.
    partnerQueueQuerySchema:joi.object({
        status:joi.string().valid(...LISTED_STATUSES).optional(),
        zone_id:joi.number().integer().positive().optional(),
        source:joi.string().valid("SELF","ADMIN").optional(),
        search:joi.string().trim().max(100).allow("").optional(),
        page:joi.number().integer().min(1).default(1),
        limit:joi.number().integer().min(1).max(100).default(20)
    }),
    verifyPartnerDocumentSchema:joi.object({
        expiry_date:dateOnly.optional()
    }),
    reuploadPartnerDocumentSchema:joi.object({
        reason:joi.string().trim().min(3).max(500).required()
    }),
    partnerCheckSchema:joi.object({
        done:joi.boolean().required(),
        // BG_CHECK needs it when ticking (the service checks); the rest may leave it out.
        note:joi.string().trim().min(3).max(500).allow(null,"").optional()
    }),
    partnerNoteSchema:joi.object({
        text:joi.string().trim().min(1).max(2000).required()
    }),
    requestPartnerChangesSchema:joi.object({
        message:joi.string().trim().min(3).max(1000).required(),
        items:joi.array().items(joi.string().valid(...DOC_TYPES, ...FIELD_ITEMS)).unique().default([]),
        expected_version:expectedVersion
    }),
    rejectPartnerApplicationSchema:joi.object({
        reason_code:joi.string().valid(...REASON_CODES).required(),
        note:joi.string().trim().min(3).max(1000).required()
            .when("reason_code", { is:"OTHER", then:joi.string().min(10) }),
        expected_version:expectedVersion
    }),
    approvePartnerApplicationSchema:joi.object({
        zone_id:joi.number().integer().positive().required(),
        max_active_orders:joi.number().integer().min(MAX_ORDERS.min).max(MAX_ORDERS.max).required(),
        note:joi.string().trim().max(1000).allow(null,"").optional(),
        expected_version:expectedVersion
    })

}

// `source` is "body" (default) or "query". Express 5 makes req.query read-only, so the cleaned query goes on req.filters.
const validate = (schemaName, source = "body") => {
    return (req, res, next) => {
        if (!schema[schemaName]) {
            return ResponseUtil.error(res, "Validation schema not found", 500);
        }

        // Express 5 leaves req.body undefined when nothing was sent, and Joi accepts undefined for an object: without the
        // fallback a missing body would skip the required fields and reach the service.
        const { error, value } = schema[schemaName].validate(req[source] ?? {}, { abortEarly: false });
        if (error) {
            // `message` stays the first problem for existing callers; `errors` lists them all (backend/CLAUDE.md).
            const errors = error.details.map((d) => ({ field: d.path.join("."), message: d.message }));
            return ResponseUtil.error(res, error.details[0].message, 400, errors);
        }
        if (source === "query") req.filters = value;
        else req.body = value;
        next();
    };
};

// A malformed id gets the same 404 as one that does not exist; without this Postgres fails the uuid cast with a 500.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const uuidParam = (name = "id") => (req, res, next) =>
    UUID.test(req.params[name]) ? next() : ResponseUtil.notFound(res, "Not found");

export default validate;
