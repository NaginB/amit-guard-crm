import React, { useRef } from "react";
import { User, Download } from "lucide-react";
import jsPDF from "jspdf";
import toast from "react-hot-toast";
import { Button } from "../common";
import type { Guard } from "../../features/guards/guardSlice";

// ─── Brand colors ─────────────────────────────────────────────────────────────
const RED = "#d12525";
const BLUE = "#152c56";
const RED_RGB: [number, number, number] = [209, 37, 37];
const BLUE_RGB: [number, number, number] = [21, 44, 86];
const GRAY_RGB: [number, number, number] = [107, 114, 128];
const WHITE: [number, number, number] = [255, 255, 255];
const DARK: [number, number, number] = [17, 24, 39];
const MID: [number, number, number] = [55, 65, 81];
const LIGHT: [number, number, number] = [243, 244, 246];

// Card physical size (ISO ID-1)
const CW = 85.6;
const CH = 54;
const GAP = 8;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;

const getValidUntil = (guard: Guard): Date => {
  if (guard.expiryDate) return new Date(guard.expiryDate);
  const d = new Date(guard.joiningDate);
  d.setFullYear(d.getFullYear() + 1);
  return d;
};

const imgToDataURL = (url: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = img.width;
      c.height = img.height;
      c.getContext("2d")!.drawImage(img, 0, 0);
      resolve(c.toDataURL("image/jpeg", 0.95));
    };
    img.onerror = reject;
    img.src = url;
  });

// ─── PDF vector drawing helpers ───────────────────────────────────────────────
type RGB = [number, number, number];
const pdfHelpers = (pdf: jsPDF) => ({
  fill: (c: RGB) => pdf.setFillColor(...c),
  text: (c: RGB) => pdf.setTextColor(...c),
  draw: (c: RGB) => pdf.setDrawColor(...c),
  rect: (x: number, y: number, w: number, h: number, c: RGB) => {
    pdf.setFillColor(...c);
    pdf.rect(x, y, w, h, "F");
  },
  rRect: (x: number, y: number, w: number, h: number, r: number, c: RGB, stroke = false) => {
    pdf.setFillColor(...c);
    if (stroke) pdf.roundedRect(x, y, w, h, r, r, "FD");
    else pdf.roundedRect(x, y, w, h, r, r, "F");
  },
  line: (x1: number, y1: number, x2: number, y2: number, c: RGB) => {
    pdf.setDrawColor(...c);
    pdf.line(x1, y1, x2, y2);
  },
});

// ─── Draw front card using vector ops ─────────────────────────────────────────
const drawFront = async (pdf: jsPDF, guard: Guard, ox: number, oy: number) => {
  const p = pdfHelpers(pdf);

  // Card background + border
  p.fill(WHITE);
  p.draw([229, 231, 235]);
  pdf.setLineWidth(0.2);
  pdf.roundedRect(ox, oy, CW, CH, 2, 2, "FD");

  // Blue top bar
  p.rect(ox, oy, CW, 1.5, BLUE_RGB);

  // ── Header ──────────────────────────────────────────────────────────────────
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  p.text(RED_RGB);
  pdf.text("EAGLEEYE", ox + 3, oy + 7);

  pdf.setFontSize(7);
  p.text(BLUE_RGB);
  pdf.text("SECURITY", ox + 3, oy + 10.2);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(4.5);
  p.text(GRAY_RGB);
  pdf.text("SAFETY FIRST \u00B7 ALWAYS", ox + 3, oy + 12.5);

  // Logo
  try {
    const logoData = await imgToDataURL("/logo.png");
    pdf.addImage(logoData, "JPEG", ox + CW - 12, oy + 3, 9, 9);
  } catch (_) { /* skip if logo unavailable */ }

  // Divider
  pdf.setLineWidth(0.2);
  p.line(ox + 3, oy + 14, ox + CW - 3, oy + 14, [229, 231, 235]);

  // ── Photo box ───────────────────────────────────────────────────────────────
  p.fill(LIGHT);
  p.draw(RED_RGB);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(ox + 3, oy + 15, 19, 24, 1, 1, "FD");

  if (guard.photo) {
    try {
      const photoData = await imgToDataURL(guard.photo);
      pdf.addImage(photoData, "JPEG", ox + 3.4, oy + 15.4, 18.2, 23.2);
    } catch (_) { /* no photo */ }
  }

  // ── Detail rows ─────────────────────────────────────────────────────────────
  const rows: [string, string][] = [
    ["Name", `${guard.firstName} ${guard.lastName}`],
    ["Phone", guard.contactNumber || "N/A"],
    ["Emp. Code", `EES-${guard.guardId || "N/A"}`],
    ["D.O.B", guard.dateOfBirth ? fmtDate(new Date(guard.dateOfBirth)) : "N/A"],
    ["Joined", fmtDate(new Date(guard.joiningDate))],
    ["Valid Upto", fmtDate(getValidUntil(guard))],
  ];

  let rowY = oy + 17;
  rows.forEach(([label, value]) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(5.5);
    p.text(MID);
    pdf.text(label, ox + 25, rowY);
    pdf.text(":", ox + 41, rowY);
    pdf.setFont("helvetica", "bold");
    p.text(DARK);
    pdf.text(value, ox + 43, rowY);
    rowY += 4.2;
  });

  // ── Bottom designation strip ────────────────────────────────────────────────────────
  p.rect(ox, oy + CH - 6.5, CW, 6.5, BLUE_RGB);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(5.5);
  p.text(WHITE);
  pdf.text("DESIGNATION : SECURITY GUARD", ox + 3, oy + CH - 2.5);

  if (guard.gender) {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(5.5);
    p.text([200, 210, 225]);
    pdf.text(guard.gender.toUpperCase(), ox + CW - 3, oy + CH - 2.5, { align: "right" });
  }
};

// ─── Draw back card using vector ops ──────────────────────────────────────────
const drawBack = async (pdf: jsPDF, ox: number, oy: number) => {
  const p = pdfHelpers(pdf);

  // Card background + border
  p.fill(WHITE);
  p.draw([229, 231, 235]);
  pdf.setLineWidth(0.2);
  pdf.roundedRect(ox, oy, CW, CH, 2, 2, "FD");

  // Blue top bar
  p.rect(ox, oy, CW, 1.5, BLUE_RGB);

  // ── Left column ─────────────────────────────────────────────────────────────
  // Logo
  try {
    const logoData = await imgToDataURL("/logo.png");
    pdf.addImage(logoData, "JPEG", ox + 3, oy + 3, 7, 7);
  } catch (_) { /* skip */ }

  // Brand name
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  p.text(RED_RGB);
  const eagleW = pdf.getTextWidth("EAGLEEYE ");
  pdf.text("EAGLEEYE ", ox + 12, oy + 7);
  p.text(BLUE_RGB);
  pdf.text("SECURITY", ox + 12 + eagleW, oy + 7);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(4.5);
  p.text(GRAY_RGB);
  pdf.text("SAFETY FIRST \u00B7 SAFETY ALWAYS", ox + 12, oy + 9.5);

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(5.5);
  p.text(BLUE_RGB);
  pdf.text("PREMIUM SECURITY SERVICES", ox + 3, oy + 14);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(4.5);
  p.text(MID);
  pdf.text("INDUSTRIAL | COMMERCIAL | RESIDENTIAL", ox + 3, oy + 17);

  // Divider
  pdf.setLineWidth(0.2);
  p.line(ox + 3, oy + 18.5, ox + 57, oy + 18.5, [229, 231, 235]);

  // Contact rows
  const contacts: [string, string][] = [
    ["Addr.", "H.O. 1207, Satyamev Elite, Bopal-Ambli Jn., Ahd."],
    ["Tel.", "1800-309-7890"],
    ["Email", "info@eagleeye-security.com"],
    ["Web", "www.eagleeye-security.com"],
  ];
  let cy = oy + 21.5;
  contacts.forEach(([label, text]) => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(4.5);
    p.text(BLUE_RGB);
    pdf.text(`${label}`, ox + 3, cy);
    pdf.setFont("helvetica", "normal");
    p.text(MID);
    pdf.text(text, ox + 11, cy);
    cy += 3.5;
  });

  // ── Vertical divider ─────────────────────────────────────────────────────────
  pdf.setLineWidth(0.2);
  p.line(ox + 58, oy + 2, ox + 58, oy + CH - 9, [229, 231, 235]);

  // ── Emergency panel ──────────────────────────────────────────────────────────
  const EP_X = ox + 60;
  const EP_W = CW - 62;

  const headerH = 5;
  const rowH = 5.5;
  const r = 1;
  let currentY = oy + 3;

  // ================= HEADER (TOP ROUNDED) =================

  // Fill color
  pdf.setFillColor(...RED_RGB);

  // Main rectangle (without the top curved part)
  pdf.rect(EP_X, currentY + r, EP_W, headerH - r, "F");

  // Top middle rectangle
  pdf.rect(EP_X + r, currentY, EP_W - 2 * r, r, "F");

  // Top-left circle
  pdf.circle(EP_X + r, currentY + r, r, "F");

  // Top-right circle
  pdf.circle(EP_X + EP_W - r, currentY + r, r, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(4.8);
  p.text(WHITE);
  pdf.text("EMERGENCY", EP_X + EP_W / 2, currentY + 3.5, { align: "center" });

  currentY += headerH; // 👈 NO GAP

  // ================= ROWS (NO RADIUS, CONNECTED) =================
  const emergency = [
    ["Ambulance", "108"],
    ["Police", "100"],
    ["Fire Brigade", "101"],
  ];

  emergency.forEach(([label, num], index) => {
    // Fill row
    pdf.setFillColor(255, 248, 248);
    pdf.rect(EP_X, currentY, EP_W, rowH, "F");

    // Divider line (skip last row)
    if (index !== emergency.length - 1) {
      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.1);
      pdf.line(
        EP_X,
        currentY + rowH,
        EP_X + EP_W,
        currentY + rowH
      );
    }

    // Text
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(4.5);
    p.text(MID);
    pdf.text(label, EP_X + 1.5, currentY + 3.5);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(6);
    p.text(RED_RGB);
    pdf.text(num, EP_X + EP_W - 1.5, currentY + 3.5, { align: "right" });

    currentY += rowH; // 👈 perfectly stacked
  });

  // ================= FOOTER (BOTTOM ROUNDED) =================

  const bottomRadius = 1.5;     // smoother bottom corner radius
  const footerHeight = 5;     // footer block height

  // ===== SHAPE =====
  pdf.setFillColor(...BLUE_RGB);

  // Main body
  pdf.rect(EP_X, currentY, EP_W, footerHeight - bottomRadius, "F");

  // Bottom bridge
  pdf.rect(
    EP_X + bottomRadius,
    currentY + footerHeight - bottomRadius,
    EP_W - 2 * bottomRadius,
    bottomRadius,
    "F"
  );

  // Bottom-left curve
  pdf.circle(
    EP_X + bottomRadius,
    currentY + footerHeight - bottomRadius,
    bottomRadius,
    "F"
  );

  // Bottom-right curve
  pdf.circle(
    EP_X + EP_W - bottomRadius,
    currentY + footerHeight - bottomRadius,
    bottomRadius,
    "F"
  );

  // ===== TEXT =====
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(3.6);
  pdf.setTextColor(200, 210, 225);

  const textY = (currentY + (footerHeight / 2)) - 0.5;

  pdf.text(
    "In case of emergency, call immediately",
    EP_X + EP_W / 2,
    textY,
    {
      align: "center",
      maxWidth: EP_W - 4,
      lineHeightFactor: 1.2,
    }
  );


  // ── Bottom note strip ────────────────────────────────────────────────────────
  p.rect(ox, oy + CH - 8, CW, 8, BLUE_RGB);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(4);
  p.text([190, 200, 220]);
  pdf.text(
    "Note \u2014 This card is only valid on site and for company's internal purpose",
    ox + CW / 2, oy + CH - 3.5,
    { align: "center" }
  );
};

// ─── Front Card React component ───────────────────────────────────────────────
interface IDCardFrontProps {
  guard: Guard;
  cardRef: React.RefObject<HTMLDivElement | null>;
}

export const IDCardFront: React.FC<IDCardFrontProps> = ({ guard, cardRef }) => {
  const joiningDate = new Date(guard.joiningDate);
  const validUntil = getValidUntil(guard);

  const rows: [string, string][] = [
    ["Name", `${guard.firstName} ${guard.lastName}`],
    ["Phone", guard.contactNumber || "N/A"],
    ["Emp. Code", `EES-${guard.guardId || "N/A"}`],
    ["D.O.B", guard.dateOfBirth ? fmtDate(new Date(guard.dateOfBirth)) : "N/A"],
    ["Joined", fmtDate(joiningDate)],
    ["Valid Upto", fmtDate(validUntil)],
  ];

  return (
    <div ref={cardRef} style={{ width: "340px", height: "210px", backgroundColor: "#ffffff", borderRadius: "10px", overflow: "hidden", position: "relative", fontFamily: "Arial, sans-serif", boxShadow: "0 4px 16px rgba(0,0,0,0.18)", border: "1px solid #e5e7eb" }}>
      <div style={{ backgroundColor: BLUE, height: "6px", width: "100%" }} />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px 4px" }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: "900", color: RED, letterSpacing: "0.5px", lineHeight: 1 }}>EAGLEEYE</div>
          <div style={{ fontSize: "10px", fontWeight: "700", color: BLUE, letterSpacing: "2px" }}>SECURITY</div>
          <div style={{ fontSize: "7px", color: "#6b7280", letterSpacing: "0.5px" }}>SAFETY FIRST · ALWAYS</div>
        </div>
        <img src="/logo.png" alt="logo" style={{ width: "36px", height: "36px", objectFit: "contain" }} />
      </div>
      <div style={{ height: "1px", backgroundColor: "#e5e7eb", margin: "0 12px" }} />
      <div style={{ display: "flex", gap: "10px", padding: "8px 12px" }}>
        <div style={{ width: "72px", height: "90px", border: `2px solid ${RED}`, borderRadius: "5px", overflow: "hidden", flexShrink: 0, backgroundColor: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {guard.photo ? <img src={guard.photo} alt="guard" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User style={{ width: "32px", height: "32px", color: "#9ca3af" }} />}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "3px" }}>
          {rows.map(([label, value]) => (
            <div key={label} style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
              <span style={{ fontSize: "9px", color: "#374151", fontWeight: "600", minWidth: "70px" }}>{label}</span>
              <span style={{ fontSize: "9px", color: "#374151" }}>:</span>
              <span style={{ fontSize: "9px", color: "#111827", fontWeight: "700" }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: BLUE, padding: "6px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "9px", color: "#fff", letterSpacing: "0.5px" }}>DESIGNATION : {guard?.designation || 'Not Provided'}</div>
        {guard.gender && <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.85)", fontWeight: "600" }}>{guard.gender.toUpperCase()}</div>}
      </div>
    </div>
  );
};

// ─── Back Card React component ────────────────────────────────────────────────
interface IDCardBackProps {
  backRef: React.RefObject<HTMLDivElement | null>;
}

export const IDCardBack: React.FC<IDCardBackProps> = ({ backRef }) => (
  <div ref={backRef} style={{ width: "340px", height: "210px", backgroundColor: "#ffffff", borderRadius: "10px", overflow: "hidden", position: "relative", fontFamily: "Arial, sans-serif", boxShadow: "0 4px 16px rgba(0,0,0,0.18)", border: "1px solid #e5e7eb" }}>
    <div style={{ backgroundColor: BLUE, height: "6px", width: "100%" }} />
    <div style={{ position: "absolute", right: "-30px", top: 0, width: "100px", height: "210px", backgroundColor: BLUE, transform: "skewX(-8deg)", opacity: 0.06 }} />
    <div style={{ padding: "10px 14px", display: "flex", gap: "10px" }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
          <img src="/logo.png" alt="logo" style={{ width: "26px", height: "26px", objectFit: "contain" }} />
          <div>
            <div style={{ fontSize: "12px", fontWeight: "900", lineHeight: 1 }}>
              <span style={{ color: RED }}>EAGLEEYE </span><span style={{ color: BLUE }}>SECURITY</span>
            </div>
            <div style={{ fontSize: "6.5px", color: "#6b7280", letterSpacing: "0.5px" }}>SAFETY FIRST · SAFETY ALWAYS</div>
          </div>
        </div>
        <div style={{ fontSize: "7.5px", fontWeight: "700", color: BLUE, marginBottom: "1px" }}>PREMIUM SECURITY SERVICES</div>
        <div style={{ fontSize: "7px", color: "#374151", marginBottom: "6px" }}>INDUSTRIAL | COMMERCIAL | RESIDENTIAL</div>
        <div style={{ height: "1px", backgroundColor: "#e5e7eb", marginBottom: "6px" }} />
        {([["📍", "H.O. 1207, Satyamev Elite, Bopal-Ambli Junction, Ahmedabad"], ["📞", "1800-309-7890"], ["✉", "info@eagleeye-security.com"], ["🌐", "www.eagleeye-security.com"]] as [string, string][]).map(([icon, text]) => (
          <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: "4px", marginBottom: "2.5px" }}>
            <span style={{ fontSize: "7.5px", lineHeight: 1.4 }}>{icon}</span>
            <span style={{ fontSize: "7.5px", color: "#374151", lineHeight: 1.4 }}>{text}</span>
          </div>
        ))}
      </div>
      <div style={{ width: "1px", backgroundColor: "#e5e7eb", flexShrink: 0 }} />
      <div style={{ width: "90px", flexShrink: 0 }}>
        <div style={{ backgroundColor: RED, borderRadius: "4px 4px 0 0", padding: "3px 6px" }}>
          <div style={{ fontSize: "7px", fontWeight: "900", color: "#fff", textAlign: "center", letterSpacing: "0.5px" }}>🚨 EMERGENCY</div>
        </div>
        {([["🚑", "Ambulance", "108"], ["👮", "Police", "100"], ["🚒", "Fire Brigade", "101"]] as [string, string, string][]).map(([icon, label, num]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 6px", borderBottom: "1px solid #f3f4f6", backgroundColor: "#fff8f8" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
              <span style={{ fontSize: "9px" }}>{icon}</span>
              <span style={{ fontSize: "7px", color: "#374151", fontWeight: "600" }}>{label}</span>
            </div>
            <span style={{ fontSize: "8px", fontWeight: "900", color: RED }}>{num}</span>
          </div>
        ))}
        <div style={{ backgroundColor: BLUE, borderRadius: "0 0 4px 4px", padding: "3px 6px" }}>
          <div style={{ fontSize: "6px", color: "rgba(255,255,255,0.8)", textAlign: "center" }}>In case of emergency, call immediately</div>
        </div>
      </div>
    </div>
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: BLUE, padding: "4px 12px" }}>
      <div style={{ fontSize: "7px", color: "rgba(255,255,255,0.75)", textAlign: "center" }}>Note — This card is only valid on site and for company's internal purpose</div>
    </div>
  </div>
);

// ─── Self-contained section with vector PDF download ──────────────────────────
interface GuardIDCardSectionProps {
  guard: Guard;
}

export const GuardIDCardSection: React.FC<GuardIDCardSectionProps> = ({ guard }) => {
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    try {
      toast.loading("Generating PDF...", { id: "pdf-download" });

      const totalH = CH * 2 + GAP;
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();

      const x0 = (pageW - CW) / 2;
      const y0 = (pageH - totalH) / 2;

      await drawFront(pdf, guard, x0, y0);
      await drawBack(pdf, x0, y0 + CH + GAP);

      pdf.save(`${guard.firstName}_${guard.lastName}_ID_Card.pdf`);
      toast.success("PDF downloaded!", { id: "pdf-download" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF.", { id: "pdf-download" });
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-5">Identity Card</h3>
      <div className="flex flex-wrap gap-6 justify-center mb-5">
        <div>
          <p className="text-xs text-center text-gray-500 mb-2 uppercase tracking-wider font-medium">Front</p>
          <IDCardFront guard={guard} cardRef={frontRef} />
        </div>
        <div>
          <p className="text-xs text-center text-gray-500 mb-2 uppercase tracking-wider font-medium">Back</p>
          <IDCardBack backRef={backRef} />
        </div>
      </div>
      <div className="flex justify-center">
        <Button onClick={downloadPDF} className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-2">
          <Download className="h-4 w-4 mr-2" />
          Download ID Card (Front &amp; Back)
        </Button>
      </div>
    </div>
  );
};
