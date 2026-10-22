import joi from "joi";
import ResponseUtil from "../utils/response.js";
import {
    ACTIVITY_GROUPS, ACTIVITY_HOURS, DOC_TYPES, FIELD_ITEMS, LISTED_STATUSES, MAX_ORDERS, REASON_CODES, VEHICLE_TYPES,
} from "../modules/partnerApplication/partnerApplicationRules.js";
import { FAILURE_REASONS } from "../constants/deliveryFailure.js";

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
    // A pincode, a point, or both. lat and lng only come as a pair.
    serviceabilityQuerySchema:joi.object({
        pincode:joi.string().trim().pattern(/^\d{6}$/).messages({ "string.pattern.base": "pincode must be 6 digits" }),
        lat:joi.number().min(-90).max(90),
        lng:joi.number().min(-180).max(180)
    }).and("lat","lng").or("pincode","lat").messages({ "object.missing": "Send a pincode or lat and lng", "object.and": "Send lat and lng together" }),
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
    // Partner app ("me" routes). Query of the assignment list: ACTIVE is open work, HISTORY is anything finished.
    partnerAssignmentsQuerySchema:joi.object({
        status:joi.string().valid("ACTIVE","HISTORY","COMPLETED","FAILED","TRANSFERRED","CANCELLED").default("ACTIVE"),
        date:joi.string().valid("today").optional(),
        from:dateOnly.optional(),
        to:dateOnly.optional(),
        search:joi.string().trim().max(50).allow(""),
        page:joi.number().integer().min(1).default(1),
        limit:joi.number().integer().min(1).max(50).default(20)
    }),
    // The only moves a partner makes themselves. A failed drop needs a reason from the list (a note is required for OTHER,
    // optional otherwise); nothing else takes either.
    partnerAssignmentStatusSchema:joi.object({
        status:joi.string().valid("PICKED_UP","OUT_FOR_DELIVERY","DELIVERED","DELIVERY_FAILED").required(),
        reason_code:joi.string().valid(...Object.keys(FAILURE_REASONS))
            .when("status", { is:"DELIVERY_FAILED", then:joi.required(), otherwise:joi.forbidden() }),
        note:joi.string().trim().max(200).allow("")
            .when("reason_code", { is:"OTHER", then:joi.string().min(3).required() })
            .when("status", { not:"DELIVERY_FAILED", then:joi.forbidden() })
    }),
    // An explicit state, never a flip, so a retry or a double tap lands in the same place. strict: a real boolean, not "true".
    partnerOnlineSchema:joi.object({
        online:joi.boolean().strict().required()
    }),
    // Partner-to-partner handover, request step. order_id is never sent: it comes from the assignment. lowercase, so the
    // "same partner" check cannot be dodged with an upper-case uuid.
    handOverSchema:joi.object({
        new_delivery_partner_id:joi.string().uuid().lowercase().required(),
        reason:joi.string().trim().min(3).max(255).required(),
        handover_latitude:joi.number().min(-90).max(90),
        handover_longitude:joi.number().min(-180).max(180)
    }),
    // Both confirm steps: the first partner may add where it happened, the second a note. All optional.
    handoverConfirmSchema:joi.object({
        handover_latitude:joi.number().min(-90).max(90),
        handover_longitude:joi.number().min(-180).max(180),
        reason:joi.string().trim().min(3).max(255)
    }),
    // Partner app Handover screen: "in" = handed to me, "out" = handed on by me.
    partnerHandoversQuerySchema:joi.object({
        dir:joi.string().valid("in","out").required()
    }),
    handoverCandidatesQuerySchema:joi.object({
        assignment_id:joi.string().uuid().required()
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
    // Staff add someone: the phone comes in the body (nobody has verified it yet). The name limit matches auth-service's.
    createOnBehalfSchema:joi.object({
        phone:joi.string().pattern(/^[6-9]\d{9}$/).required().messages({ "string.pattern.base": "Enter a 10-digit mobile number" }),
        name:joi.string().trim().min(2).max(50).required(),
        email:joi.string().trim().email().max(150).allow(null,"").optional(),
        preferred_zone_id:joi.number().integer().positive().optional(),
        vehicle_type:joi.string().valid(...VEHICLE_TYPES).required(),
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
    // Staff submitting a draft they created say the applicant agreed (P3-1); it is kept on the SUBMITTED event.
    submitOnBehalfSchema:joi.object({
        consent_attested:joi.valid(true).required()
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
    // Query string of the Activity log's Onboarding tab (admins only).
    partnerActivityQuerySchema:joi.object({
        group:joi.string().valid(...Object.keys(ACTIVITY_GROUPS)).optional(),
        hours:joi.number().valid(...ACTIVITY_HOURS).default(24),
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
