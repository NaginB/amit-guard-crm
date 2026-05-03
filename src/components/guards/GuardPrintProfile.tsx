import React from "react";
import { createPortal } from "react-dom";
import type { Guard } from "../../features/guards/guardSlice";

// ─── Print styles injected once ──────────────────────────────────────────────
const PRINT_STYLES = `
  @media print {
    @page { margin: 15mm; size: A4 portrait; }
    #root { display: none !important; }
    .gpp-wrapper {
      display: block !important;
      position: relative !important;
      width: 100%;
      background: #fff;
    }
  }
  @media screen {
    .gpp-wrapper { display: none !important; }
  }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (d?: string) =>
  d
    ? new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const val = (v?: string | number | null) =>
  v !== undefined && v !== null && v !== "" ? String(v) : "—";

// ─── Sub-components ───────────────────────────────────────────────────────────
const PrintField: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ marginBottom: "8px" }}>
    <div style={{ fontSize: "9px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "2px" }}>
      {label}
    </div>
    <div style={{ fontSize: "12px", color: "#111827", fontWeight: 500 }}>{value}</div>
  </div>
);

const PrintSection: React.FC<{ title: string; children: React.ReactNode; cols?: number }> = ({
  title,
  children,
  cols = 3,
}) => (
  <div style={{ marginBottom: "16px" }}>
    <div style={{
      fontSize: "10px", fontWeight: 700, color: "#152c56",
      textTransform: "uppercase", letterSpacing: "1px",
      borderBottom: "1.5px solid #152c56", paddingBottom: "4px", marginBottom: "10px",
    }}>
      {title}
    </div>
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: "8px 16px" }}>
      {children}
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
interface GuardPrintProfileProps {
  guard: Guard;
}

export const GuardPrintProfile: React.FC<GuardPrintProfileProps> = ({ guard }) => {
  const g = guard as Guard & Record<string, any>;

  const guardStatus =
    guard.expiryDate && new Date(guard.expiryDate).getTime() < Date.now()
      ? "Inactive"
      : "Active";

  const profileContent = (
    <div className="gpp-wrapper" style={{ fontFamily: "Arial, sans-serif", color: "#111827", backgroundColor: "#fff" }}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "3px solid #152c56", paddingBottom: "12px", marginBottom: "16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src="/logo.png" alt="EagleEye Security" style={{ width: "48px", height: "48px", objectFit: "contain" }} />
          <div>
            <div style={{ fontSize: "18px", fontWeight: 900, lineHeight: 1 }}>
              <span style={{ color: "#d12525" }}>EAGLEEYE </span>
              <span style={{ color: "#152c56" }}>SECURITY</span>
            </div>
            <div style={{ fontSize: "9px", color: "#6b7280", letterSpacing: "0.5px" }}>SAFETY FIRST · ALWAYS</div>
            <div style={{ fontSize: "8px", color: "#9ca3af", marginTop: "1px" }}>PREMIUM SECURITY SERVICES</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "16px", fontWeight: 700, color: "#152c56" }}>GUARD PROFILE</div>
          <div style={{ fontSize: "9px", color: "#6b7280", marginTop: "2px" }}>
            Generated: {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </div>
          <div style={{ fontSize: "9px", color: "#6b7280" }}>Guard ID: EES-{guard.guardId || "N/A"}</div>
        </div>
      </div>

      {/* ── Guard identity strip ──────────────────────────────────────── */}
      <div style={{
        display: "flex", gap: "16px", alignItems: "flex-start",
        backgroundColor: "#f8fafc", border: "1px solid #e5e7eb",
        borderRadius: "6px", padding: "12px", marginBottom: "16px",
      }}>
        {/* Photo */}
        <div style={{
          width: "80px", height: "100px", flexShrink: 0,
          border: "2px solid #152c56", borderRadius: "4px",
          overflow: "hidden", backgroundColor: "#e5e7eb",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {guard.photo
            ? <img src={guard.photo} alt={`${guard.firstName} ${guard.lastName}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            : <span style={{ fontSize: "28px", color: "#9ca3af" }}>👤</span>}
        </div>

        {/* Basic info */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "20px", fontWeight: 800, color: "#111827", marginBottom: "2px" }}>
            {guard.firstName} {guard.lastName}
          </div>
          <div style={{ fontSize: "11px", color: "#6b7280", marginBottom: "8px" }}>Security Guard</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px 12px" }}>
            <PrintField label="Status" value={guardStatus} />
            <PrintField label="Gender" value={val(guard.gender)} />
            <PrintField label="Date of Birth" value={fmt(guard.dateOfBirth)} />
            <PrintField label="Father's Name" value={val(g.fatherName)} />
            <PrintField label="Mother's Name" value={val(g.motherName)} />
            <PrintField label="Joining Date" value={fmt(guard.joiningDate)} />
          </div>
        </div>
      </div>

      {/* ── Contact Information ───────────────────────────────────────── */}
      <PrintSection title="Contact Information" cols={3}>
        <PrintField label="Primary Phone" value={val(guard.contactNumber)} />
        <PrintField label="Alternate Phone" value={val(g.alternateContactNumber)} />
        <PrintField label="Email" value={val(guard.email)} />
        <div style={{ gridColumn: "span 3" }}>
          <PrintField label="Present Address" value={val(guard.presentAddress)} />
        </div>
        <div style={{ gridColumn: "span 3" }}>
          <PrintField label="Permanent Address" value={val(g.permanentAddress)} />
        </div>
      </PrintSection>

      {/* ── Emergency Contact ─────────────────────────────────────────── */}
      <PrintSection title="Emergency Contact" cols={3}>
        <PrintField label="Contact Name" value={val(g.emergencyContactName)} />
        <PrintField label="Contact Number" value={val(guard.emergencyContactNumber)} />
        <PrintField label="Relation" value={val(g.emergencyContactRelation)} />
      </PrintSection>

      {/* ── KYC Documents ────────────────────────────────────────────── */}
      <PrintSection title="KYC Documents" cols={2}>
        <PrintField label="Aadhaar Number" value={val(guard.aadharNumber)} />
        <PrintField label="PAN Card Number" value={val(guard.panNumber)} />
      </PrintSection>

      {/* ── Children ─────────────────────────────────────────────────── */}
      {guard.children && guard.children.length > 0 && (
        <PrintSection title={`Children (${guard.children.length})`} cols={4}>
          {guard.children.map((child, i) => (
            <React.Fragment key={i}>
              <PrintField label="Name" value={val(child.name)} />
              <PrintField label="Age" value={val(child.age)} />
              <PrintField label="Gender" value={val(child.gender)} />
              <PrintField label="Phone" value={val(child.phoneNumber)} />
            </React.Fragment>
          ))}
        </PrintSection>
      )}

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div style={{
        borderTop: "3px solid #152c56", paddingTop: "10px", marginTop: "8px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <img src="/logo.png" alt="EagleEye Security" style={{ width: "28px", height: "28px", objectFit: "contain" }} />
          <div>
            <div style={{ fontSize: "10px", fontWeight: 700 }}>
              <span style={{ color: "#d12525" }}>EAGLEEYE </span>
              <span style={{ color: "#152c56" }}>SECURITY</span>
            </div>
            <div style={{ fontSize: "8px", color: "#9ca3af" }}>INDUSTRIAL · COMMERCIAL · RESIDENTIAL</div>
          </div>
        </div>
        <div style={{ fontSize: "8px", color: "#9ca3af", textAlign: "right" }}>
          <div>This document is confidential and for internal use only.</div>
          <div>Bank details and salary are excluded from this profile.</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_STYLES }} />
      {createPortal(profileContent, document.body)}
    </>
  );
};
