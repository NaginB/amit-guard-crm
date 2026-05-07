import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Download, Trash2, Edit } from "lucide-react";
import { Card, Button, Input } from "../components/common";
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

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this bill?")) {
      dispatch(deleteQuickBill(id))
        .unwrap()
        .then(() => {
          toast.success("Bill deleted successfully");
        });
    }
  };

  const downloadPDF = (bill: any) => {
    const doc = new jsPDF();

    // Blue header bar
    doc.setFillColor(65, 105, 225); // Royal Blue
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
    const addressLines = doc.splitTextToSize("No. 418, Shivalik Satyamev, SP Ring Rd Junction, Ambli - Bopal Rd Ahmedabad, Gujarat - 380058", 60);
    doc.text(addressLines, 14, 35);

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
    doc.line(14, startY, 196, startY); // top
    doc.line(14, startY + 10, 196, startY + 10); // header bottom
    doc.line(14, startY + 22, 196, startY + 22); // row bottom
    doc.line(14, startY, 14, startY + 22); // left border
    doc.line(196, startY, 196, startY + 22); // right border

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

    doc.save(`${bill.billNumber || 'quick_bill'}.pdf`);
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
                  <tr key={bill._id}>
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
                        onClick={() => handleDelete(bill._id)}
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

      {/* Modal */}
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
