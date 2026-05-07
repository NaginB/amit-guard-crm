import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Download, Trash2, Edit, Eye, X } from "lucide-react";
import { Card, Button, Input } from "../components/common";
import ConfirmModal from "../components/common/ConfirmModal";
import CompanyTitle from "../components/common/CompanyTitle";
import {
  fetchQuickBills,
  createQuickBill,
  deleteQuickBill,
} from "../features/quickBills/quickBillSlice";
import { apiService } from "../services/api";
import type { AppDispatch, RootState } from "../app/store";
import toast from "react-hot-toast";
import jsPDF from "jspdf";

export const QuickBillManagement: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { quickBills, loading } = useSelector(
    (state: RootState) => state.quickBills
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [amountPerDay, setAmountPerDay] = useState("");
  const [totalDays, setTotalDays] = useState("");

  // Edit states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Delete confirm modal
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Preview modal
  const [previewBill, setPreviewBill] = useState<any | null>(null);

  useEffect(() => {
    dispatch(fetchQuickBills());
  }, [dispatch]);

  const resetForm = () => {
    setAddress("");
    setAmountPerDay("");
    setTotalDays("");
    setIsEditMode(false);
    setEditId(null);
  };

  const handleOpenModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleEdit = (bill: any) => {
    setAddress(bill.address);
    setAmountPerDay(bill.amountPerDay.toString());
    setTotalDays(bill.totalDays.toString());
    setEditId(bill._id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !amountPerDay || !totalDays) {
      toast.error("Please fill all fields");
      return;
    }

    const payload = {
      address,
      amountPerDay: Number(amountPerDay),
      totalDays: Number(totalDays),
    };

    if (isEditMode && editId) {
      try {
        await apiService.updateQuickBill(editId, payload);
        toast.success("Quick bill updated successfully");
        dispatch(fetchQuickBills());
        handleCloseModal();
      } catch (error) {
        // error handled in apiService
      }
    } else {
      dispatch(createQuickBill(payload))
        .unwrap()
        .then(() => {
          toast.success("Quick bill created successfully");
          handleCloseModal();
        });
    }
  };

  // Delete flow using ConfirmModal
  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await dispatch(deleteQuickBill(deleteTargetId)).unwrap();
      toast.success("Bill deleted successfully");
    } finally {
      setIsDeleting(false);
      setDeleteTargetId(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteTargetId(null);
  };

  const buildPDFDoc = async (bill: any) => {
    const doc = new jsPDF();
    const RED: [number, number, number] = [209, 37, 37];
    const BLUE: [number, number, number] = [21, 44, 86];

    // ── BLUE header band ──────────────────────────────────
    doc.setFillColor(...BLUE);
    doc.rect(0, 0, 210, 32, "F");

    // RED accent stripe
    doc.setFillColor(...RED);
    doc.rect(0, 32, 210, 3, "F");

    // Logo image
    try {
      const logoRes = await fetch("/logo.png");
      const logoBlob = await logoRes.blob();
      const logoB64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(logoBlob);
      });
      doc.addImage(logoB64, "PNG", 14, 4, 22, 22);
    } catch (_) {
      // logo not available, skip
    }

    // Company name — shifted right to sit beside logo
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("EAGLE EYE", 40, 13);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 210, 230);
    doc.text("SECURITY SERVICE", 40, 20);
    doc.setFontSize(7);
    doc.text("ALWAYS VIGILANT", 40, 26);

    // RECEIPT label (right side)
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("RECEIPT", 196, 20, { align: "right" });

    // ── Company address ───────────────────────────────────
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    const addrLines = doc.splitTextToSize(
      "No. 418, Shivalik Satyamev, SP Ring Rd Junction, Ambli - Bopal Rd, Ahmedabad, Gujarat - 380058",
      90
    );
    doc.text(addrLines, 14, 40);

    // ── Bill To & Receipt meta ────────────────────────────
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BLUE);
    doc.text("BILL TO", 14, 58);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    const billToLines = doc.splitTextToSize(bill.address, 80);
    doc.text(billToLines, 14, 63);

    // Receipt # and date (right)
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BLUE);
    doc.text("Receipt #", 130, 58);
    doc.text("Receipt Date", 130, 64);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(50, 50, 50);
    doc.text(bill.billNumber || "N/A", 196, 58, { align: "right" });
    doc.text(new Date(bill.createdAt).toLocaleDateString("en-GB"), 196, 64, { align: "right" });

    // ── Table ─────────────────────────────────────────────
    const startY = 82;
    // Header bg
    doc.setFillColor(...BLUE);
    doc.rect(14, startY, 182, 9, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("QTY (Days)", 20, startY + 6);
    doc.text("DESCRIPTION", 60, startY + 6);
    doc.text("UNIT PRICE (Per Day)", 130, startY + 6);
    doc.text("AMOUNT", 192, startY + 6, { align: "right" });

    // Row
    doc.setFillColor(250, 250, 252);
    doc.rect(14, startY + 9, 182, 10, "F");
    doc.setFont("helvetica", "normal");
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(9);
    doc.text(bill.totalDays.toString(), 25, startY + 16);
    doc.text("Security Service", 60, startY + 16);
    doc.text(`Rs.${bill.amountPerDay.toFixed(2)}`, 130, startY + 16);
    doc.text(`Rs.${bill.totalAmount.toFixed(2)}`, 192, startY + 16, { align: "right" });

    // Borders
    doc.setDrawColor(200, 200, 210);
    doc.rect(14, startY, 182, 19, "S");
    doc.line(14, startY + 9, 196, startY + 9);

    // ── Totals ────────────────────────────────────────────
    const finalY = startY + 19 + 8;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Subtotal", 150, finalY);
    doc.text(`Rs.${bill.totalAmount.toFixed(2)}`, 196, finalY, { align: "right" });

    // Total box with RED accent
    doc.setFillColor(...RED);
    doc.rect(130, finalY + 4, 66, 10, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text("TOTAL", 135, finalY + 11);
    doc.text(`Rs.${bill.totalAmount.toFixed(2)}`, 194, finalY + 11, { align: "right" });

    // ── Terms ─────────────────────────────────────────────
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BLUE);
    doc.text("Terms & Conditions", 14, finalY + 28);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Payment is due upon receipt.", 14, finalY + 33);

    // ── Footer band ───────────────────────────────────────
    doc.setFillColor(...BLUE);
    doc.rect(0, 282, 210, 15, "F");
    doc.setFontSize(7);
    doc.setTextColor(180, 190, 210);
    doc.text("Eagle Eye Security Service — Always Vigilant", 105, 289, { align: "center" });

    return doc;
  };

  const downloadPDF = async (bill: any) => {
    const doc = await buildPDFDoc(bill);
    doc.save(`${bill.billNumber || "quick_bill"}.pdf`);
  };

  const previewPDF = (bill: any) => {
    setPreviewBill(bill);
  };

  const closePreview = () => {
    setPreviewBill(null);
  };

  const downloadFromPreview = async () => {
    if (previewBill) await downloadPDF(previewBill);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quick Bills</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and generate quick manual bills.
          </p>
        </div>
        <Button onClick={handleOpenModal} className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Create Bill
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bill Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : quickBills.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    No quick bills found.
                  </td>
                </tr>
              ) : (
                quickBills.map((bill) => (
                  <tr key={bill._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {bill.billNumber || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(bill.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="max-w-xs truncate">{bill.address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      ₹{bill.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => previewPDF(bill)}
                        className="text-purple-600 hover:text-purple-900 mx-2"
                        title="Preview Bill"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => downloadPDF(bill)}
                        className="text-blue-600 hover:text-blue-900 mx-2"
                        title="Download PDF"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(bill)}
                        className="text-indigo-600 hover:text-indigo-900 mx-2"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(bill._id)}
                        className="text-red-600 hover:text-red-900 mx-2"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteTargetId}
        title="Delete Quick Bill"
        message="Are you sure you want to delete this bill? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      {/* Bill Preview Modal */}
      {previewBill && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 py-8 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">

            {/* Toolbar */}
            <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b">
              <span className="text-sm font-semibold text-gray-700">Bill Preview</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadFromPreview}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                  style={{ backgroundColor: "#152c56" }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download PDF
                </button>
                <button onClick={closePreview} className="p-1 rounded-lg hover:bg-gray-200 transition-colors">
                  <X className="h-4 w-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* ── PDF-mirror body ── */}
            <div className="font-sans text-sm">

              {/* Header band — matches PDF BLUE rect */}
              <div style={{ backgroundColor: "#152c56", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <img src="/logo.png" alt="Logo" style={{ height: "48px", width: "48px", objectFit: "contain", backgroundColor: "white", borderRadius: "8px", padding: "4px" }} />
                  <div>
                    <div style={{ fontSize: "20px", fontWeight: 900, color: "white", letterSpacing: "0.5px", lineHeight: 1 }}>EAGLE EYE</div>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: "#c8d2e6", letterSpacing: "2px" }}>SECURITY SERVICE</div>
                    <div style={{ fontSize: "7px", color: "rgba(200,210,230,0.7)", letterSpacing: "0.5px" }}>ALWAYS VIGILANT</div>
                  </div>
                </div>
                <div style={{ fontSize: "18px", fontWeight: 900, color: "white", letterSpacing: "4px" }}>RECEIPT</div>
              </div>
              {/* RED accent stripe */}
              <div style={{ height: "3px", backgroundColor: "#d12525" }} />

              {/* Body padding */}
              <div style={{ padding: "20px 24px" }}>

                {/* Company address */}
                <p style={{ fontSize: "11px", color: "#888", marginBottom: "16px" }}>
                  No. 418, Shivalik Satyamev, SP Ring Rd Junction, Ambli - Bopal Rd, Ahmedabad, Gujarat - 380058
                </p>

                {/* Bill To / Receipt meta */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                  <div>
                    <p style={{ fontSize: "9px", fontWeight: 700, color: "#152c56", textTransform: "uppercase", marginBottom: "4px" }}>Bill To</p>
                    <p style={{ fontSize: "12px", color: "#333", whiteSpace: "pre-line", lineHeight: 1.5 }}>{previewBill.address}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span style={{ color: "#152c56", fontWeight: 700 }}>Receipt #</span>
                      <span style={{ fontWeight: 700, color: "#111" }}>{previewBill.billNumber || "N/A"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                      <span style={{ color: "#152c56", fontWeight: 700 }}>Receipt Date</span>
                      <span style={{ fontWeight: 700, color: "#111" }}>{new Date(previewBill.createdAt).toLocaleDateString("en-GB")}</span>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "16px", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#152c56" }}>
                      <th style={{ padding: "8px 12px", textAlign: "left", color: "white", fontWeight: 700 }}>QTY (Days)</th>
                      <th style={{ padding: "8px 12px", textAlign: "left", color: "white", fontWeight: 700 }}>Description</th>
                      <th style={{ padding: "8px 12px", textAlign: "right", color: "white", fontWeight: 700 }}>Unit Price (Per Day)</th>
                      <th style={{ padding: "8px 12px", textAlign: "right", color: "white", fontWeight: 700 }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ backgroundColor: "#fafafa", borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "10px 12px", color: "#333" }}>{previewBill.totalDays}</td>
                      <td style={{ padding: "10px 12px", color: "#333" }}>Security Services</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: "#333" }}>Rs.{previewBill.amountPerDay.toFixed(2)}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: "#333" }}>Rs.{previewBill.totalAmount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Totals */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "20px" }}>
                  <div style={{ width: "220px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#888", marginBottom: "6px" }}>
                      <span>Subtotal</span>
                      <span>Rs.{previewBill.totalAmount.toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", backgroundColor: "#d12525", color: "white", fontWeight: 700, fontSize: "13px", padding: "8px 12px", borderRadius: "4px" }}>
                      <span>TOTAL</span>
                      <span>Rs.{previewBill.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "12px", fontSize: "11px", color: "#888" }}>
                  <p style={{ fontWeight: 700, color: "#152c56", marginBottom: "2px" }}>Terms &amp; Conditions</p>
                  <p>Payment is due upon receipt.</p>
                </div>

              </div>{/* end body padding */}

            </div>{/* end pdf-mirror body */}

            {/* Footer band */}
            <div style={{ backgroundColor: "#152c56", padding: "8px 24px", textAlign: "center", fontSize: "10px", color: "rgba(180,190,210,0.9)" }}>
              Eagle Eye Security Service — Always Vigilant
            </div>

          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={handleCloseModal}></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                    {isEditMode ? "Edit Quick Bill" : "Create Quick Bill"}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address (Bill To)
                      </label>
                      <textarea
                        className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        rows={3}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Enter client name and address"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Amount Per Day (₹)
                        </label>
                        <Input
                          type="number"
                          value={amountPerDay}
                          onChange={(e) => setAmountPerDay(e.target.value)}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Total Days
                        </label>
                        <Input
                          type="number"
                          value={totalDays}
                          onChange={(e) => setTotalDays(e.target.value)}
                          placeholder="0"
                          min="1"
                          required
                        />
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium text-gray-500">Calculated Total:</span>
                        <span className="font-bold text-lg text-gray-900">
                          ₹{((Number(amountPerDay) || 0) * (Number(totalDays) || 0)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <Button type="submit" className="w-full sm:ml-3 sm:w-auto">
                    {isEditMode ? "Update" : "Save"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseModal}
                    className="mt-3 w-full sm:mt-0 sm:ml-3 sm:w-auto"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickBillManagement;
