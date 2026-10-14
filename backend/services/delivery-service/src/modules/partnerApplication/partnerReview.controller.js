import PartnerReviewService from "./partnerReview.service.js";
import ResponseUtil from "../../utils/response.js";
import { env } from "../../config/env.js";

// The dashboard (another origin from this API) embeds the file in an <img> or <iframe>.
const frameAncestors = (env.ALLOWED_ORIGINS?.split(",").map((o) => o.trim()).filter(Boolean) ?? []).join(" ") || "'self'";

class PartnerReviewController {
  async list(req, res, next) {
    try {
      const result = await PartnerReviewService.list(req.filters);

      return ResponseUtil.success(res, result, "Applications fetched");
    } catch (error) {
      next(error);
    }
  }

  async getDetail(req, res, next) {
    try {
      const result = await PartnerReviewService.getDetail(req.params.id, req.user);

      return ResponseUtil.success(res, result, "Application fetched");
    } catch (error) {
      next(error);
    }
  }

  async startReview(req, res, next) {
    try {
      const result = await PartnerReviewService.startReview(req.params.id, req.user);

      return ResponseUtil.success(res, result, "Review started");
    } catch (error) {
      next(error);
    }
  }

  async documentUrl(req, res, next) {
    try {
      const result = await PartnerReviewService.documentUrl(req.params.id, req.params.type, req.user);

      return ResponseUtil.success(res, result, "Document link created");
    } catch (error) {
      next(error);
    }
  }

  // No bearer token on this route: the signed token in the path is the credential.
  async streamFile(req, res, next) {
    try {
      const { bytes, mime } = await PartnerReviewService.openFile(req.params.token);

      // helmet's defaults (same-origin resource, no framing) would leave the dashboard's preview blank; relaxed on this route only.
      res.removeHeader("X-Frame-Options");
      res.set({
        "Content-Type": mime,
        // A plain name: without one the PDF viewer's title bar shows the signed token from the URL.
        "Content-Disposition": `inline; filename="document.${mime.split("/")[1]}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store",
        "Cross-Origin-Resource-Policy": "cross-origin",
        "Content-Security-Policy": `frame-ancestors ${frameAncestors}`,
      });
      return res.send(bytes);
    } catch (error) {
      next(error);
    }
  }

  async verifyDocument(req, res, next) {
    try {
      const result = await PartnerReviewService.verifyDocument(req.params.id, req.params.type, req.body, req.user);

      return ResponseUtil.success(res, result, "Document verified");
    } catch (error) {
      next(error);
    }
  }

  async requestReupload(req, res, next) {
    try {
      const result = await PartnerReviewService.requestReupload(req.params.id, req.params.type, req.body, req.user);

      return ResponseUtil.success(res, result, "Re-upload requested");
    } catch (error) {
      next(error);
    }
  }

  async setCheck(req, res, next) {
    try {
      const result = await PartnerReviewService.setCheck(req.params.id, req.params.key, req.body, req.user);

      return ResponseUtil.success(res, result, "Check updated");
    } catch (error) {
      next(error);
    }
  }

  async addNote(req, res, next) {
    try {
      const result = await PartnerReviewService.addNote(req.params.id, req.body, req.user);

      return ResponseUtil.success(res, result, "Note added", 201);
    } catch (error) {
      next(error);
    }
  }

  async requestChanges(req, res, next) {
    try {
      const result = await PartnerReviewService.requestChanges(req.params.id, req.body, req.user);

      return ResponseUtil.success(res, result, "Changes requested");
    } catch (error) {
      next(error);
    }
  }

  async reject(req, res, next) {
    try {
      const result = await PartnerReviewService.reject(req.params.id, req.body, req.user);

      return ResponseUtil.success(res, result, "Application rejected");
    } catch (error) {
      next(error);
    }
  }

  async approve(req, res, next) {
    try {
      const result = await PartnerReviewService.approve(req.params.id, req.body, req.user);

      return ResponseUtil.success(res, result, "Application approved", 201);
    } catch (error) {
      next(error);
    }
  }
}

export default new PartnerReviewController();
