import React from "react";
import { User } from "lucide-react";
import type { Guard } from "../../features/guards/guardSlice";

// ─── Brand colors ─────────────────────────────────────────────────────────────
const RED = "#d12525";
const BLUE = "#152c56";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${d.getFullYear()}`;

// ─── Front Card ───────────────────────────────────────────────────────────────
interface IDCardFrontProps {
  guard: Guard;
  cardRef: React.RefObject<HTMLDivElement | null>;
}

export const IDCardFront: React.FC<IDCardFrontProps> = ({ guard, cardRef }) => {
  const joiningDate = new Date(guard.joiningDate);
  const validUntil = guard.expiryDate
    ? new Date(guard.expiryDate)
    : (() => {
      const d = new Date(joiningDate);
      d.setFullYear(d.getFullYear() + 1);
      return d;
    })();

  const rows: [string, string][] = [
    ["Employee Code", `EES-${guard.guardId || "N/A"}`],
    ["D.O.B", guard.dateOfBirth ? fmtDate(new Date(guard.dateOfBirth)) : "N/A"],
    ["Joining Date", fmtDate(joiningDate)],
    ["Valid Upto", fmtDate(validUntil)],
  ];

  return (
    <div
      ref={cardRef}
      style={{
        width: "340px",
        height: "210px",
        backgroundColor: "#ffffff",
        borderRadius: "10px",
        overflow: "hidden",
        position: "relative",
        fontFamily: "Arial, sans-serif",
        boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
        border: "1px solid #e5e7eb",
      }}
    >
      {/* Top accent bar — blue */}
      <div style={{ backgroundColor: BLUE, height: "6px", width: "100%" }} />

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px 4px",
        }}
      >
        {/* Brand */}
        <div>
          <div
            style={{
              fontSize: "15px",
              fontWeight: "900",
              color: RED,
              letterSpacing: "0.5px",
              lineHeight: 1,
            }}
          >
            EAGLEEYE
          </div>
          <div
            style={{
              fontSize: "10px",
              fontWeight: "700",
              color: BLUE,
              letterSpacing: "2px",
            }}
          >
            SECURITY
          </div>
          <div
            style={{ fontSize: "7px", color: "#6b7280", letterSpacing: "0.5px" }}
          >
            SAFETY FIRST · ALWAYS
          </div>
        </div>

        {/* Logo */}
        <img
          src="/logo.png"
          alt="EagleEye Security"
          style={{ width: "36px", height: "36px", objectFit: "contain" }}
        />
      </div>

      {/* Divider */}
      <div
        style={{ height: "1px", backgroundColor: "#e5e7eb", margin: "0 12px" }}
      />

      {/* Body */}
      <div
        style={{ display: "flex", gap: "10px", padding: "8px 12px", flex: 1 }}
      >
        {/* Photo */}
        <div
          style={{
            width: "72px",
            height: "90px",
            border: `2px solid ${RED}`,
            borderRadius: "5px",
            overflow: "hidden",
            flexShrink: 0,
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
            <User style={{ width: "32px", height: "32px", color: "#9ca3af" }} />
          )}
        </div>

        {/* Details */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "5px",
          }}
        >
          {rows.map(([label, value]) => (
            <div
              key={label}
              style={{ display: "flex", alignItems: "baseline", gap: "4px" }}
            >
              <span
                style={{
                  fontSize: "9px",
                  color: "#374151",
                  fontWeight: "600",
                  minWidth: "82px",
                }}
              >
                {label}
              </span>
              <span style={{ fontSize: "9px", color: "#374151" }}>:</span>
              <span
                style={{ fontSize: "9px", color: "#111827", fontWeight: "700" }}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Name strip — blue */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: BLUE,
          padding: "5px 12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "11px",
              fontWeight: "900",
              color: "#fff",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {guard.firstName} {guard.lastName}
          </div>
          <div
            style={{
              fontSize: "8px",
              color: "rgba(255,255,255,0.85)",
              letterSpacing: "0.5px",
            }}
          >
            DESIGNATION : SECURITY GUARD
          </div>
        </div>
        {guard.gender && (
          <div
            style={{
              fontSize: "8px",
              color: "rgba(255,255,255,0.85)",
              fontWeight: "600",
            }}
          >
            {guard.gender.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Back Card ────────────────────────────────────────────────────────────────
interface IDCardBackProps {
  backRef: React.RefObject<HTMLDivElement | null>;
}

export const IDCardBack: React.FC<IDCardBackProps> = ({ backRef }) => (
  <div
    ref={backRef}
    style={{
      width: "340px",
      height: "210px",
      backgroundColor: "#ffffff",
      borderRadius: "10px",
      overflow: "hidden",
      position: "relative",
      fontFamily: "Arial, sans-serif",
      boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
      border: "1px solid #e5e7eb",
    }}
  >
    {/* Top accent bar — blue */}
    <div style={{ backgroundColor: BLUE, height: "6px", width: "100%" }} />

    {/* Subtle diagonal blue accent */}
    <div
      style={{
        position: "absolute",
        right: "-30px",
        top: 0,
        width: "100px",
        height: "210px",
        backgroundColor: BLUE,
        transform: "skewX(-8deg)",
        opacity: 0.06,
      }}
    />

    <div style={{ padding: "10px 14px", display: "flex", gap: "10px" }}>
      {/* Left — company info */}
      <div style={{ flex: 1 }}>
        {/* Logo + brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "5px" }}>
          <img
            src="/logo.png"
            alt="EagleEye Security"
            style={{ width: "26px", height: "26px", objectFit: "contain" }}
          />
          <div>
            <div style={{ fontSize: "12px", fontWeight: "900", lineHeight: 1 }}>
              <span style={{ color: RED }}>EAGLEEYE </span>
              <span style={{ color: BLUE }}>SECURITY</span>
            </div>
            <div style={{ fontSize: "6.5px", color: "#6b7280", letterSpacing: "0.5px" }}>
              SAFETY FIRST · SAFETY ALWAYS
            </div>
          </div>
        </div>

        <div style={{ fontSize: "7.5px", fontWeight: "700", color: BLUE, marginBottom: "1px" }}>
          PREMIUM SECURITY SERVICES
        </div>
        <div style={{ fontSize: "7px", color: "#374151", marginBottom: "6px" }}>
          INDUSTRIAL | COMMERCIAL | RESIDENTIAL
        </div>

        <div style={{ height: "1px", backgroundColor: "#e5e7eb", marginBottom: "6px" }} />

        {(
          [
            ["📍", "H.O. 1207, Satyamev Elite, Bopal-Ambli Junction, Ahmedabad"],
            ["📞", "1800-309-7890"],
            ["✉", "info@eagleeye-security.com"],
            ["🌐", "www.eagleeye-security.com"],
          ] as [string, string][]
        ).map(([icon, text]) => (
          <div key={text} style={{ display: "flex", alignItems: "flex-start", gap: "4px", marginBottom: "2.5px" }}>
            <span style={{ fontSize: "7.5px", lineHeight: 1.4 }}>{icon}</span>
            <span style={{ fontSize: "7.5px", color: "#374151", lineHeight: 1.4 }}>{text}</span>
          </div>
        ))}
      </div>

      {/* Vertical divider */}
      <div style={{ width: "1px", backgroundColor: "#e5e7eb", flexShrink: 0 }} />

      {/* Right — emergency numbers */}
      <div style={{ width: "90px", flexShrink: 0 }}>
        <div style={{
          backgroundColor: RED,
          borderRadius: "4px 4px 0 0",
          padding: "3px 6px",
          marginBottom: "0",
        }}>
          <div style={{ fontSize: "7px", fontWeight: "900", color: "#fff", textAlign: "center", letterSpacing: "0.5px" }}>
            🚨 EMERGENCY
          </div>
        </div>

        {(
          [
            ["🚑", "Ambulance", "108"],
            ["👮", "Police", "100"],
            ["🚒", "Fire Brigade", "101"],
          ] as [string, string, string][]
        ).map(([icon, label, num]) => (
          <div key={label} style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "4px 6px",
            borderBottom: "1px solid #f3f4f6",
            backgroundColor: "#fff8f8",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
              <span style={{ fontSize: "9px" }}>{icon}</span>
              <span style={{ fontSize: "7px", color: "#374151", fontWeight: "600" }}>{label}</span>
            </div>
            <span style={{ fontSize: "8px", fontWeight: "900", color: RED }}>{num}</span>
          </div>
        ))}

        <div style={{
          backgroundColor: BLUE,
          borderRadius: "0 0 4px 4px",
          padding: "3px 6px",
        }}>
          <div style={{ fontSize: "6px", color: "rgba(255,255,255,0.8)", textAlign: "center" }}>
            In case of emergency, call immediately
          </div>
        </div>
      </div>
    </div>

    {/* Bottom note — dark blue */}
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: BLUE,
        padding: "4px 12px",
      }}
    >
      <div
        style={{
          fontSize: "7px",
          color: "rgba(255,255,255,0.75)",
          textAlign: "center",
        }}
      >
        Note — This card is only valid on site and for company's internal purpose
      </div>
    </div>
  </div>
);
