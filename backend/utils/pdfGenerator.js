/**
 * pdfGenerator.js — Government-grade PDF Receipt Generator for SUVIDHA
 *
 * Generates an official downloadable acknowledgment receipt for civic complaints.
 * Uses pdfkit — no external APIs.
 *
 * @route GET /api/requests/:id/receipt
 */
import PDFDocument from 'pdfkit';
import Request from '../models/Request.js';
import mongoose from 'mongoose';

/**
 * Generate and stream a PDF receipt for a given request.
 */
export const generateReceipt = async (req, res) => {
  try {
    const { id } = req.params;

    // Resolve by requestId (REQ-...) or ObjectId
    let query = null;
    if (id.startsWith('REQ-')) {
      query = { requestId: id.toUpperCase() };
    } else if (mongoose.Types.ObjectId.isValid(id)) {
      query = { _id: id };
    } else {
      return res.status(400).json({ success: false, message: 'Invalid request ID format' });
    }

    const request = await Request.findOne(query).populate('citizenId', 'name mobile aadhaar');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    // ── Stream PDF to response ─────────────────────────────────────────────────
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="SUVIDHA_Receipt_${request.requestId}.pdf"`);
    doc.pipe(res);

    // ── Header bar ────────────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 80).fill('#1D4ED8');
    doc.fillColor('white').fontSize(20).font('Helvetica-Bold')
      .text('SUVIDHA — Smart Urban Helpdesk', 50, 22, { align: 'center' });
    doc.fontSize(10).font('Helvetica')
      .text('Government of India | Digital Public Infrastructure', 50, 48, { align: 'center' });
    doc.fillColor('#60A5FA').fontSize(9)
      .text('OFFICIAL ACKNOWLEDGMENT RECEIPT', 50, 62, { align: 'center' });

    // ── Sub-header ────────────────────────────────────────────────────────────
    doc.fillColor('#1D4ED8').rect(50, 90, doc.page.width - 100, 28).fill('#EFF6FF');
    doc.fillColor('#1D4ED8').fontSize(11).font('Helvetica-Bold')
      .text('CIVIC SERVICE REQUEST — REGISTERED ACKNOWLEDGMENT', 50, 98, { align: 'center' });

    // ── Reference box ────────────────────────────────────────────────────────
    doc.rect(50, 130, doc.page.width - 100, 50).stroke('#1D4ED8');
    doc.fillColor('#1D4ED8').fontSize(10).font('Helvetica-Bold')
      .text('Reference / Ticket ID:', 65, 143);
    doc.fillColor('#111827').fontSize(18).font('Helvetica-Bold')
      .text(request.requestId, 65, 158);
    doc.fillColor('#16A34A').fontSize(9).font('Helvetica-Bold')
      .text(`Status: ${request.status}`, 350, 143);
    doc.fillColor('#374151').fontSize(9).font('Helvetica')
      .text(`Priority: ${request.priority} (Score: ${request.priorityScore || 0})`, 350, 157);
    doc.text(`Filed: ${new Date(request.createdAt).toLocaleString('en-IN')}`, 350, 170);

    // ── Helper: section label ─────────────────────────────────────────────────
    const sectionLabel = (label, y) => {
      doc.rect(50, y, doc.page.width - 100, 20).fill('#F3F4F6');
      doc.fillColor('#374151').fontSize(9).font('Helvetica-Bold')
        .text(label.toUpperCase(), 55, y + 6);
      return y + 28;
    };

    const field = (label, value, x, y, w = 230) => {
      doc.fillColor('#6B7280').fontSize(8).font('Helvetica').text(label, x, y);
      doc.fillColor('#111827').fontSize(9).font('Helvetica-Bold').text(String(value || '—'), x, y + 10, { width: w });
    };

    let y = 195;

    // ── Citizen Info ───────────────────────────────────────────────────────────
    y = sectionLabel('CITIZEN INFORMATION', y);
    field('Full Name', request.citizenId?.name || 'Aadhaar User', 55, y);
    field('Mobile Number', `+91 ${request.citizenId?.mobile || '—'}`, 310, y);
    y += 35;

    // ── Complaint Details ─────────────────────────────────────────────────────
    y = sectionLabel('COMPLAINT / REQUEST DETAILS', y);
    field('Service Category', request.serviceType?.toUpperCase(), 55, y);
    field('Sub-Service', request.subService, 310, y);
    y += 35;
    field('Description', request.description, 55, y, doc.page.width - 110);
    y += Math.max(40, Math.ceil(request.description.length / 80) * 12 + 20);

    // ── AI Intelligence ───────────────────────────────────────────────────────
    y = sectionLabel('AI INTELLIGENCE REPORT', y);
    field('Priority', request.priority, 55, y);
    field('Priority Score', String(request.priorityScore || 0), 200, y);
    field('Emergency', request.isEmergency ? 'YES 🚨' : 'NO', 345, y);
    y += 35;
    field('AI Priority Reason', request.priorityReason, 55, y, doc.page.width - 110);
    y += 30;

    // ── Routing ────────────────────────────────────────────────────────────────
    y = sectionLabel('SMART ROUTING INFORMATION', y);
    field('Assigned Department', request.assignedDepartment, 55, y);
    field('Routing Confidence', `${Math.round((request.routingConfidence || 0.65) * 100)}%`, 310, y);
    y += 30;
    field('Routing Reason', request.routingReason || '—', 55, y, doc.page.width - 110);
    y += 30;
    field('Assigned Team', request.assignedTeam || 'Unassigned', 55, y);
    y += 35;

    // ── Evidence ───────────────────────────────────────────────────────────────
    if (request.documents?.length > 0) {
      y = sectionLabel(`EVIDENCE DOCUMENTS (${request.documents.length} file${request.documents.length !== 1 ? 's' : ''})`, y);
      request.documents.forEach((doc_item, i) => {
        const conf = Math.round((doc_item.confidence || 0) * 100);
        const evStatus = doc_item.flagged ? 'SUSPICIOUS' : doc_item.verified ? 'VERIFIED' : 'UNDER REVIEW';
        doc.fillColor('#111827').fontSize(8).font('Helvetica-Bold')
          .text(`${i + 1}. ${doc_item.name}`, 60, y);
        doc.fillColor('#6B7280').fontSize(8).font('Helvetica')
          .text(`AI Confidence: ${conf}% | Status: ${evStatus}`, 60, y + 10);
        y += 25;
      });
      y += 5;
    }

    // ── Emergency Audit Trail ────────────────────────────────────────────────
    if (request.isEmergency && request.emergencySource) {
      y = sectionLabel('EMERGENCY AUDIT TRAIL', y);
      field('Emergency Source', request.emergencySource, 55, y);
      field('Triggered At', request.emergencyTriggeredAt ? new Date(request.emergencyTriggeredAt).toLocaleString('en-IN') : '—', 310, y);
      y += 35;
    }

    // ── SLA Status ────────────────────────────────────────────────────────────
    y = sectionLabel('SLA STATUS', y);
    const ageHours = Math.floor((Date.now() - new Date(request.createdAt).getTime()) / (1000 * 60 * 60));
    field('SLA Status', request.slaStatus || 'Safe', 55, y);
    field('Complaint Age', `${ageHours} hours`, 310, y);
    y += 40;

    // ── Footer ─────────────────────────────────────────────────────────────────
    doc.rect(0, doc.page.height - 70, doc.page.width, 70).fill('#F3F4F6');
    doc.fillColor('#374151').fontSize(8).font('Helvetica')
      .text('This is an auto-generated official acknowledgment receipt. Retain this for your records.', 50, doc.page.height - 58, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleString('en-IN')} | SUVIDHA Digital Civic Infrastructure | Powered by AI Priority Engine v3.0`, 50, doc.page.height - 46, { align: 'center' });
    doc.fillColor('#1D4ED8').fontSize(9).font('Helvetica-Bold')
      .text('Track your complaint: Visit SUVIDHA Portal → Track Application → Enter Ticket ID', 50, doc.page.height - 30, { align: 'center' });

    doc.end();
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
