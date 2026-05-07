import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Download, Trash2, Edit, Eye, X } from "lucide-react";
import { Card, Button, Input } from "../components/common";
import ConfirmModal from "../components/common/ConfirmModal";
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

  const buildPDFDoc = (bill: any) => {
    const doc = new jsPDF();

    // Blue header bar
    doc.setFillColor(65, 105, 225);
    doc.rect(0, 10, 210, 15, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Eagle Eye Security", 14, 21);

    doc.setFontSize(16);
    doc.text("RECEIPT", 170, 21);

    // Company address
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const companyAddrLines = doc.splitTextToSize(
      "No. 418, Shivalik Satyamev, SP Ring Rd Junction, Ambli - Bopal Rd Ahmedabad, Gujarat - 380058",
      60
    );
    doc.text(companyAddrLines, 14, 35);

    // Bill To & Receipt Info
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Bill To", 14, 60);

    doc.setFont("helvetica", "normal");
    const billToLines = doc.splitTextToSize(bill.address, 60);
    doc.text(billToLines, 14, 65);

    // Receipt details on the right
    doc.setFont("helvetica", "bold");
    doc.text("Receipt #", 140, 60);
    doc.text("Receipt Date", 140, 65);

    doc.setFont("helvetica", "normal");
    doc.text(bill.billNumber || "N/A", 170, 60);
    doc.text(new Date(bill.createdAt).toLocaleDateString("en-GB"), 170, 65);

    // Table Header
    const startY = 85;
    doc.setFillColor(240, 240, 240);
    doc.rect(14, startY, 182, 10, "F");

    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("QTY (Days)", 20, startY + 7);
    doc.text("DESCRIPTION", 60, startY + 7);
    doc.text("UNIT PRICE (Per Day)", 130, startY + 7);
    doc.text("AMOUNT", 170, startY + 7);

    // Table Content
    doc.setFont("helvetica", "normal");
    doc.text(bill.totalDays.toString(), 25, startY + 17);
    doc.text("Security Services", 60, startY + 17);
    doc.text(`₹${bill.amountPerDay.toFixed(2)}`, 130, startY + 17);
    doc.text(`₹${bill.totalAmount.toFixed(2)}`, 170, startY + 17);

    // Table Borders
    doc.setDrawColor(220, 220, 220);
    doc.line(14, startY, 196, startY);
    doc.line(14, startY + 10, 196, startY + 10);
    doc.line(14, startY + 22, 196, startY + 22);
    doc.line(14, startY, 14, startY + 22);
    doc.line(196, startY, 196, startY + 22);

    // Totals
    const finalY = startY + 22 + 10;

    doc.setFont("helvetica", "bold");
    doc.text("Subtotal", 140, finalY);
    doc.setFont("helvetica", "normal");
    doc.text(`₹${bill.totalAmount.toFixed(2)}`, 170, finalY, { align: "left" });

    // Total Box
    doc.setFillColor(245, 245, 245);
    doc.rect(135, finalY + 5, 60, 10, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("TOTAL", 140, finalY + 12);
    doc.text(`₹${bill.totalAmount.toFixed(2)}`, 170, finalY + 12);

    // Terms
    doc.setFontSize(10);
    doc.text("Terms & Conditions", 14, finalY + 40);
    doc.setFont("helvetica", "normal");
    doc.text("Payment is due upon receipt.", 14, finalY + 45);

    return doc;
  };

  const downloadPDF = (bill: any) => {
    const doc = buildPDFDoc(bill);
    doc.save(`${bill.billNumber || "quick_bill"}.pdf`);
  };

  const previewPDF = (bill: any) => {
    setPreviewBill(bill);
  };

  const closePreview = () => {
    setPreviewBill(null);
  };

  const downloadFromPreview = () => {
    if (previewBill) downloadPDF(previewBill);
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
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 py-8 px-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            {/* Preview Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Bill Preview</h2>
              <div className="flex items-center gap-2">
                <Button onClick={downloadFromPreview} className="flex items-center gap-2 text-sm">
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
                <button
                  onClick={closePreview}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="p-6 font-sans text-sm">
              {/* Company Header */}
              <div className="bg-blue-700 text-white rounded-lg px-6 py-4 flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold">Eagle Eye Security</h3>
                  <p className="text-blue-200 text-xs mt-1">
                    No. 418, Shivalik Satyamev, SP Ring Rd Junction,<br />
                    Ambli - Bopal Rd, Ahmedabad, Gujarat - 380058
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold tracking-widest">RECEIPT</span>
                </div>
              </div>

              {/* Bill Meta */}
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Bill To</p>
                  <p className="text-gray-800 whitespace-pre-line">{previewBill.address}</p>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Receipt #</span>
                    <span className="font-medium text-gray-900">{previewBill.billNumber || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date</span>
                    <span className="font-medium text-gray-900">
                      {new Date(previewBill.createdAt).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Table */}
              <table className="w-full mb-6 border border-gray-200 rounded-lg overflow-hidden text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left text-gray-700 font-semibold">QTY (Days)</th>
                    <th className="px-4 py-2 text-left text-gray-700 font-semibold">Description</th>
                    <th className="px-4 py-2 text-right text-gray-700 font-semibold">Unit Price / Day</th>
                    <th className="px-4 py-2 text-right text-gray-700 font-semibold">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-gray-200">
                    <td className="px-4 py-3 text-gray-800">{previewBill.totalDays}</td>
                    <td className="px-4 py-3 text-gray-800">Security Services</td>
                    <td className="px-4 py-3 text-right text-gray-800">
                      ₹{previewBill.amountPerDay.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-800">
                      ₹{previewBill.totalAmount.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-56 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>₹{previewBill.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base bg-gray-100 rounded px-3 py-2">
                    <span>TOTAL</span>
                    <span>₹{previewBill.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Terms */}
              <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500">
                <p className="font-semibold text-gray-700 mb-1">Terms & Conditions</p>
                <p>Payment is due upon receipt.</p>
              </div>
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
