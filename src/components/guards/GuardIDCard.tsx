import React, { useRef } from "react";
import { User, Download } from "lucide-react";
import jsPDF from "jspdf";
import toast from "react-hot-toast";
import { Button } from "../common";
import type { Guard } from "../../features/guards/guardSlice";
// import { calculateAge } from "../../lib/utils";
import CompanyTitle from "../common/CompanyTitle";
import {
  COMPANY_ADDRESS,
  COMPANY_EMAIL,
  COMPANY_PHONE,
  COMPANY_WEBSITE,
} from "../../constants/company.constants";

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

// ─── Card size tuning (ISO ID-1 base: 85.6mm × 54mm) ─────────────────────────
const BASE_CW = 85.6;
const BASE_CH = 54;

// Adjust these to tune the ID card output (PDF + on-screen preview)
const CARD_SCALE = 1.2; // card height & vertical spacing
const CARD_WIDTH_SCALE = 1.08; // card width
const FONT_SCALE = 1.35; // all font sizes — increase/decrease text across the card

/** On-screen preview font sizes (base px × FONT_SCALE) */
const previewFont = (basePx: number) => `${basePx * FONT_SCALE}px`;
const CW = BASE_CW * CARD_WIDTH_SCALE;
const PDF_TOP_MARGIN = 15;
const PDF_CARD_GAP = 1;
const PREVIEW_BASE_W = 370;
const PREVIEW_BASE_H = 255;
const PHOTO_PREVIEW_W = 70; // preview px width (+10 from original 65)
const PHOTO_BASE_W = 19.6; // PDF mm width (proportional to preview)
const PHOTO_BASE_INNER_W = 18.7; // photo image inside border

const cardCoords = (ox: number, oy: number) => {
  const uw = (v: number) => v * CARD_WIDTH_SCALE;
  const uh = (v: number) => v * CARD_SCALE;
  const ur = (v: number) => (uw(v) + uh(v)) / 2;
  return {
    uw,
    uh,
    ur,
    x: (v: number) => ox + uw(v),
    y: (v: number) => oy + uh(v),
    fs: (size: number) => size * FONT_SCALE,
    lw: (width: number) => width * ur(1),
  };
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;

const getValidUntil = (guard: Guard): Date => {
  if (guard.expiryDate) return new Date(guard.expiryDate);
  const d = new Date(guard.joiningDate);
  d.setFullYear(d.getFullYear() + 1);
  return d;
};

const formatGuardId = (guardId?: number) =>
  guardId != null ? `EESS${guardId}` : "N/A";

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
  rRect: (
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    c: RGB,
    stroke = false,
  ) => {
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
  const c = cardCoords(ox, oy);

  // Card background + border
  p.fill(WHITE);
  p.draw([229, 231, 235]);
  pdf.setLineWidth(c.lw(0.2));
  pdf.rect(c.x(0), c.y(0), c.uw(BASE_CW), c.uh(BASE_CH), "FD");

  // Blue top bar
  p.rect(c.x(0), c.y(0), c.uw(BASE_CW), c.uh(1.5), BLUE_RGB);

  // ── Header ──────────────────────────────────────────────────────────────────
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(c.fs(11));
  p.text(RED_RGB);
  pdf.text("EAGLE EYE", c.x(3), c.y(7));

  pdf.setFontSize(c.fs(7));
  p.text(BLUE_RGB);
  pdf.text("SECURITY SERVICE", c.x(3), c.y(10.2));

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(c.fs(4.5));
  p.text(GRAY_RGB);
  pdf.text("ALWAYS VIGILANT", c.x(3), c.y(12.5));

  // Logo
  try {
    const logoData = await imgToDataURL("/logo.png");
    pdf.addImage(logoData, "JPEG", c.x(BASE_CW - 12), c.y(3), c.uw(9), c.uh(9));
  } catch {
    /* skip if logo unavailable */
  }

  // Divider
  pdf.setLineWidth(c.lw(0.2));
  p.line(c.x(3), c.y(14), c.x(BASE_CW - 3), c.y(14), [229, 231, 235]);

  // ── Guard ID above photo ────────────────────────────────────────────────────
  const photoX = c.x(3);
  const photoW = c.uw(PHOTO_BASE_W);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(c.fs(5));
  p.text(BLUE_RGB);
  pdf.text(formatGuardId(guard.guardId), photoX, c.y(16.8));

  // ── Photo box ───────────────────────────────────────────────────────────────
  p.fill(LIGHT);
  p.draw(RED_RGB);
  pdf.setLineWidth(c.lw(0.5));
  pdf.roundedRect(photoX, c.y(18), photoW, c.uh(21), c.ur(1), c.ur(1), "FD");

  if (guard.photo) {
    try {
      const photoData = await imgToDataURL(guard.photo);
      pdf.addImage(
        photoData,
        "JPEG",
        photoX + c.uw(0.4),
        c.y(18.5),
        c.uw(PHOTO_BASE_INNER_W),
        c.uh(20.2),
      );
    } catch {
      /* no photo */
    }
  }

  // ── Detail rows ─────────────────────────────────────────────────────────────
  const rows: [string, string][] = [
    ["Name", `${guard.firstName} ${guard.lastName}`],
    ["Designation", `${guard.designation || "N/A"}`],
    ["D.O.B", guard.dateOfBirth ? fmtDate(new Date(guard.dateOfBirth)) : "N/A"],
    ["Gender", guard.gender || "N/A"],
    ["D.O.J", fmtDate(new Date(guard.joiningDate))],
    ["Valid Upto", fmtDate(getValidUntil(guard))],
  ];

  let rowY = c.y(19.5);
  rows.forEach(([label, value]) => {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(c.fs(6));
    p.text(MID);
    pdf.text(label, c.x(32), rowY);
    pdf.text(":", c.x(50), rowY);
    pdf.setFont("helvetica", "bold");
    p.text(DARK);
    pdf.text(value, c.x(54), rowY);
    rowY += c.uh(4.2);
  });

  // ── Bottom designation strip ────────────────────────────────────────────────────────
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(c.fs(5.5));
  p.text(MID);
  pdf.text("For Eagle Eye Security Service", c.x(3), c.y(BASE_CH - 9));
  pdf.text("Authorised Signatory", c.x(3), c.y(BASE_CH - 2));
};

// ─── Draw back card using vector ops ──────────────────────────────────────────
const drawBack = async (pdf: jsPDF, ox: number, oy: number) => {
  const p = pdfHelpers(pdf);
  const c = cardCoords(ox, oy);

  // Card background + border
  p.fill(WHITE);
  p.draw([229, 231, 235]);
  pdf.setLineWidth(c.lw(0.2));
  pdf.roundedRect(
    c.x(0),
    c.y(0),
    c.uw(BASE_CW),
    c.uh(BASE_CH),
    c.ur(2),
    c.ur(2),
    "FD",
  );

  // Blue top bar
  p.rect(c.x(0), c.y(0), c.uw(BASE_CW), c.uh(1.5), BLUE_RGB);

  // ── Left column ─────────────────────────────────────────────────────────────
  try {
    const logoData = await imgToDataURL("/logo.png");
    pdf.addImage(logoData, "JPEG", c.x(3), c.y(3), c.uw(9), c.uh(9));
  } catch {
    /* skip */
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(c.fs(11));
  p.text(RED_RGB);
  pdf.text("EAGLE EYE", c.x(13), c.y(6));

  pdf.setFontSize(c.fs(7));
  p.text(BLUE_RGB);
  pdf.text("SECURITY SERVICE", c.x(13), c.y(9));

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(c.fs(4.5));
  p.text(GRAY_RGB);
  pdf.text("ALWAYS VIGILANT", c.x(13), c.y(11.5));

  pdf.setLineWidth(c.lw(0.2));
  p.line(c.x(3), c.y(14), c.x(57), c.y(14), [229, 231, 235]);

  const contacts: [string, string][] = [
    ["Addr.", COMPANY_ADDRESS],
    ["Tel.", COMPANY_PHONE],
    ["Email", COMPANY_EMAIL],
    ["Web", COMPANY_WEBSITE],
  ];
  let cy = c.y(18);
  contacts.forEach(([label, text]) => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(c.fs(6));
    p.text(BLUE_RGB);
    pdf.text(`${label}`, c.x(3), cy);
    pdf.setFont("helvetica", "normal");
    p.text(MID);
    const textLines = pdf.splitTextToSize(text, c.uw(44));
    pdf.text(textLines, c.x(11), cy);
    cy += c.uh(3.5) * textLines.length;
  });

  pdf.setLineWidth(c.lw(0.2));
  p.line(c.x(58), c.y(2), c.x(58), c.y(BASE_CH - 9), [229, 231, 235]);

  const EP_X = c.x(60);
  const EP_W = c.uw(BASE_CW - 62);
  const headerH = c.uh(5);
  const rowH = c.uh(5.5);
  const r = c.ur(1);
  let currentY = c.y(3);

  pdf.setFillColor(...RED_RGB);
  pdf.rect(EP_X, currentY + r, EP_W, headerH - r, "F");
  pdf.rect(EP_X + r, currentY, EP_W - 2 * r, r, "F");
  pdf.circle(EP_X + r, currentY + r, r, "F");
  pdf.circle(EP_X + EP_W - r, currentY + r, r, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(c.fs(4.8));
  p.text(WHITE);
  pdf.text("EMERGENCY", EP_X + EP_W / 2, currentY + c.uh(3.5), {
    align: "center",
  });

  currentY += headerH;

  const emergency = [
    ["Ambulance", "108"],
    ["Police", "100 / 112"],
    ["Fire Brigade", "101"],
  ];

  emergency.forEach(([label, num], index) => {
    pdf.setFillColor(255, 248, 248);
    pdf.rect(EP_X, currentY, EP_W, rowH, "F");

    if (index !== emergency.length - 1) {
      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(c.lw(0.1));
      pdf.line(EP_X, currentY + rowH, EP_X + EP_W, currentY + rowH);
    }

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(c.fs(4.5));
    p.text(MID);
    pdf.text(label, EP_X + c.uw(1.5), currentY + c.uh(3.5));

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(c.fs(6));
    p.text(RED_RGB);
    pdf.text(num, EP_X + EP_W - c.uw(1.5), currentY + c.uh(3.5), {
      align: "right",
    });

    currentY += rowH;
  });

  const bottomRadius = c.ur(1.5);
  const footerHeight = c.uh(5);

  pdf.setFillColor(...BLUE_RGB);
  pdf.rect(EP_X, currentY, EP_W, footerHeight - bottomRadius, "F");
  pdf.rect(
    EP_X + bottomRadius,
    currentY + footerHeight - bottomRadius,
    EP_W - 2 * bottomRadius,
    bottomRadius,
    "F",
  );
  pdf.circle(
    EP_X + bottomRadius,
    currentY + footerHeight - bottomRadius,
    bottomRadius,
    "F",
  );
  pdf.circle(
    EP_X + EP_W - bottomRadius,
    currentY + footerHeight - bottomRadius,
    bottomRadius,
    "F",
  );

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(c.fs(3.6));
  pdf.setTextColor(200, 210, 225);

  const textY = currentY + footerHeight / 2 - c.uh(0.5);

  pdf.text("In case of emergency, call immediately", EP_X + EP_W / 2, textY, {
    align: "center",
    maxWidth: EP_W - c.uw(4),
    lineHeightFactor: 1.2,
  });

  p.rect(c.x(0), c.y(BASE_CH - 8), c.uw(BASE_CW), c.uh(8), BLUE_RGB);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(c.fs(5));
  p.text([190, 200, 220]);
  pdf.text(
    "Note \u2014 This card is only valid on site and for company's internal purpose",
    c.x(BASE_CW / 2),
    c.y(BASE_CH - 3.5),
    { align: "center" },
  );
};

// ─── Front Card React component ───────────────────────────────────────────────
interface IDCardFrontProps {
  guard: Guard;
  cardRef: React.RefObject<HTMLDivElement | null>;
}

export const IDCardFront: React.FC<IDCardFrontProps> = ({ guard, cardRef }) => {
  // const joiningDate = new Date(guard.joiningDate);
  const validUntil = getValidUntil(guard);

  const rows: [string, string][] = [
    ["Name", `${guard.firstName} ${guard.lastName}`],
    ["Designation", `${guard.designation || "N/A"}`],
    // ["Emp. Code", `${padToThreeDigits(guard.guardId || 0)}`],
    ["D.O.B", guard.dateOfBirth ? fmtDate(new Date(guard.dateOfBirth)) : "N/A"],
    ["Gender", guard.gender || "N/A"],
    ["D.O.J", fmtDate(new Date(guard.joiningDate))],
    ["Valid Upto", fmtDate(validUntil)],
  ];

  const sw = CARD_WIDTH_SCALE;
  const sh = CARD_SCALE;

  return (
    <div
      ref={cardRef}
      style={{
        width: `${Math.round(PREVIEW_BASE_W * sw)}px`,
        height: `${Math.round(PREVIEW_BASE_H * sh)}px`,
        backgroundColor: "#ffffff",
        borderRadius: `${10 * sh}px`,
        overflow: "hidden",
        position: "relative",
        fontFamily: "Arial, sans-serif",
        boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{ backgroundColor: BLUE, height: `${6 * sh}px`, width: "100%" }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: `${8 * sh}px ${12 * sw}px ${4 * sh}px`,
        }}
      >
        <CompanyTitle scale={FONT_SCALE} />
        <img
          src="/logo.png"
          alt="logo"
          style={{
            width: `${36 * sw}px`,
            height: `${36 * sh}px`,
            objectFit: "contain",
          }}
        />
      </div>
      <div
        style={{
          height: "1px",
          backgroundColor: "#e5e7eb",
          margin: `0 ${12 * sw}px`,
        }}
      />
      <div
        style={{
          display: "flex",
          gap: `${14 * sw}px`,
          padding: `${8 * sh}px ${12 * sw}px ${5 * sh}px`,
        }}
      >
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: `${3 * sh}px`,
          }}
        >
          <span
            style={{
              fontSize: previewFont(8),
              fontWeight: 700,
              color: BLUE,
              letterSpacing: "0.5px",
              textAlign: "left",
            }}
          >
            {formatGuardId(guard.guardId)}
          </span>
          <div
            style={{
              width: `${PHOTO_PREVIEW_W * sw}px`,
              height: `${80 * sh}px`,
              border: `${2 * sh}px solid ${RED}`,
              borderRadius: `${5 * sh}px`,
              overflow: "hidden",
              backgroundColor: "#f3f4f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {guard.photo ? (
              <img
                src={guard.photo}
                alt="guard"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <User
                style={{
                  width: `${32 * sw}px`,
                  height: `${32 * sh}px`,
                  color: "#9ca3af",
                }}
              />
            )}
          </div>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: `${4 * sh}px`,
          }}
        >
          {rows.map(([label, value]) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: `${4 * sw}px`,
              }}
            >
              <span
                style={{
                  fontSize: previewFont(9),
                  color: "#374151",
                  fontWeight: "600",
                  minWidth: `${75 * sw}px`,
                }}
              >
                {label}
              </span>
              <span style={{ fontSize: previewFont(9), color: "#374151" }}>
                :
              </span>
              <span
                style={{
                  fontSize: previewFont(9),
                  color: "#111827",
                  fontWeight: "700",
                }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          paddingLeft: `${12 * sw}px`,
          marginTop: `${4 * sh}px`,
          display: "flex",
          flexDirection: "column",
          gap: `${20 * sh}px`,
        }}
      >
        <p style={{ fontSize: previewFont(8), color: "#374151", margin: 0 }}>
          For Eagle Eye Security Service
        </p>
        <p style={{ fontSize: previewFont(8), color: "#374151", margin: 0 }}>
          Authorised Signatory
        </p>
      </div>
    </div>
  );
};

// ─── Back Card React component ────────────────────────────────────────────────
interface IDCardBackProps {
  backRef: React.RefObject<HTMLDivElement | null>;
}

export const IDCardBack: React.FC<IDCardBackProps> = ({ backRef }) => {
  const sw = CARD_WIDTH_SCALE;
  const sh = CARD_SCALE;

  return (
    <div
      ref={backRef}
      style={{
        width: `${Math.round(PREVIEW_BASE_W * sw)}px`,
        height: `${Math.round(PREVIEW_BASE_H * sh)}px`,
        backgroundColor: "#ffffff",
        borderRadius: `${10 * sh}px`,
        overflow: "hidden",
        position: "relative",
        fontFamily: "Arial, sans-serif",
        boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{ backgroundColor: BLUE, height: `${6 * sh}px`, width: "100%" }}
      />
      <div
        style={{
          position: "absolute",
          right: `${-30 * sw}px`,
          top: 0,
          width: `${100 * sw}px`,
          height: `${210 * sh}px`,
          backgroundColor: BLUE,
          transform: "skewX(-8deg)",
          opacity: 0.06,
        }}
      />
      <div
        style={{
          padding: `${10 * sh}px ${14 * sw}px`,
          display: "flex",
          gap: `${10 * sw}px`,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: `${6 * sw}px`,
              marginBottom: `${5 * sh}px`,
            }}
          >
            <img
              src="/logo.png"
              alt="logo"
              style={{
                width: `${36 * sw}px`,
                height: `${36 * sh}px`,
                objectFit: "contain",
              }}
            />
            <CompanyTitle scale={FONT_SCALE} />
          </div>
          <div
            style={{
              height: "1px",
              backgroundColor: "#e5e7eb",
              marginBottom: `${10 * sh}px`,
            }}
          />
          {(
            [
              ["📍", COMPANY_ADDRESS],
              ["📞", COMPANY_PHONE],
              ["✉️", COMPANY_EMAIL],
              ["🌐", COMPANY_WEBSITE],
            ] as [string, string][]
          ).map(([icon, text]) => (
            <div
              key={text}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: `${4 * sw}px`,
                marginBottom: `${5 * sh}px`,
              }}
            >
              <span style={{ fontSize: previewFont(7.5), lineHeight: 1.4 }}>
                {icon}
              </span>
              <span
                style={{
                  fontSize: previewFont(7.5),
                  color: "#374151",
                  lineHeight: 1.4,
                }}
              >
                {text}
              </span>
            </div>
          ))}
        </div>
        <div
          style={{ width: "1px", backgroundColor: "#e5e7eb", flexShrink: 0 }}
        />
        <div style={{ width: `${100 * sw}px`, flexShrink: 0 }}>
          <div
            style={{
              backgroundColor: RED,
              borderRadius: `${4 * sh}px ${4 * sh}px 0 0`,
              padding: `${3 * sh}px ${6 * sw}px`,
            }}
          >
            <div
              style={{
                fontSize: previewFont(7),
                fontWeight: "900",
                color: "#fff",
                textAlign: "center",
                letterSpacing: "0.5px",
              }}
            >
              🚨 EMERGENCY
            </div>
          </div>
          {(
            [
              ["🚑", "Ambulance", "108"],
              ["👮", "Police", "100 / 112"],
              ["🚒", "Fire Brigade", "101"],
            ] as [string, string, string][]
          ).map(([icon, label, num]) => (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: `${4 * sh}px ${6 * sw}px`,
                borderBottom: "1px solid #f3f4f6",
                backgroundColor: "#fff8f8",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: `${3 * sw}px`,
                }}
              >
                <span style={{ fontSize: previewFont(9) }}>{icon}</span>
                <span
                  style={{
                    fontSize: previewFont(7),
                    color: "#374151",
                    fontWeight: "600",
                  }}
                >
                  {label}
                </span>
              </div>
              <span
                style={{
                  fontSize: previewFont(8),
                  fontWeight: "900",
                  color: RED,
                }}
              >
                {num}
              </span>
            </div>
          ))}
          <div
            style={{
              backgroundColor: BLUE,
              borderRadius: `0 0 ${4 * sh}px ${4 * sh}px`,
              padding: `${3 * sh}px ${6 * sw}px`,
            }}
          >
            <div
              style={{
                fontSize: previewFont(6),
                color: "rgba(255,255,255,0.8)",
                textAlign: "center",
              }}
            >
              In case of emergency, call immediately
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: BLUE,
          padding: `${5 * sh}px ${12 * sw}px`,
        }}
      >
        <div
          style={{
            fontSize: previewFont(7),
            color: "rgba(255,255,255,0.75)",
            textAlign: "center",
          }}
        >
          Note — This card is only valid on site and for company's internal
          purpose
        </div>
      </div>
    </div>
  );
};

// ─── Self-contained section with vector PDF download ──────────────────────────
interface GuardIDCardSectionProps {
  guard: Guard;
}

export const GuardIDCardSection: React.FC<GuardIDCardSectionProps> = ({
  guard,
}) => {
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    try {
      toast.loading("Generating PDF...", { id: "pdf-download" });

      // Landscape A4: 297mm × 210mm
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });
      const pageW = pdf.internal.pageSize.getWidth();

      // Top-center, side-by-side with generous gap for print padding
      const totalCardsW = CW * 2 + PDF_CARD_GAP;
      const x0 = (pageW - totalCardsW) / 2;
      const y0 = PDF_TOP_MARGIN;

      await drawFront(pdf, guard, x0, y0);
      await drawBack(pdf, x0 + CW + PDF_CARD_GAP, y0);

      pdf.save(`${guard.firstName}_${guard.lastName}_ID_Card.pdf`);
      toast.success("PDF downloaded!", { id: "pdf-download" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate PDF.", { id: "pdf-download" });
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-5">
        Identity Card
      </h3>
      <div className="flex flex-wrap gap-6 justify-center mb-5">
        <div>
          <p className="text-xs text-center text-gray-500 mb-2 uppercase tracking-wider font-medium">
            Front
          </p>
          <IDCardFront guard={guard} cardRef={frontRef} />
        </div>
        <div>
          <p className="text-xs text-center text-gray-500 mb-2 uppercase tracking-wider font-medium">
            Back
          </p>
          <IDCardBack backRef={backRef} />
        </div>
      </div>
      <div className="flex justify-center">
        <Button
          onClick={downloadPDF}
          className="bg-blue-600 text-white hover:bg-blue-700 px-8 py-2"
        >
          <Download className="h-4 w-4 mr-2" />
          Download ID Card (Front &amp; Back)
        </Button>
      </div>
    </div>
  );
};
