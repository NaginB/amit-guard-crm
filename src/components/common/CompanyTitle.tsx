const CompanyTitle = ({ scale = 1 }: { scale?: number }) => {
    const RED = "#d12525";
    const BLUE = "#152c56";

    return (
        <div>
            <div style={{ fontSize: `${15 * scale}px`, fontWeight: "900", color: RED, letterSpacing: "0.5px", lineHeight: 1 }}>EAGLE EYE</div>
            <div style={{ fontSize: `${10 * scale}px`, fontWeight: "700", color: BLUE, letterSpacing: "2px" }}>SECURITY SERVICE</div>
            <div style={{ fontSize: `${7 * scale}px`, color: "#6b7280", letterSpacing: "0.5px" }}>ALWAYS VIGILANT</div>
        </div>
    )
}

export default CompanyTitle