import React from "react";
import { Card } from "../common";
import { Building, Calendar, Users } from "lucide-react";

export type ShiftType = "Full Day" | "Full Night" | "Half Day" | "Half Night";

export interface GuardAssignment {
  guardId: string;
  guardName?: string;
  startDate: string;
  endDate?: string | null;
  shiftType: ShiftType;
  monthlyRate: number;
  assignedDate?: string;
  assignedBy?: string;
  isActive: boolean;
}

export interface ProjectItem {
  _id: string;
  projectId: number;
  projectName: string;
  siteId: {
    _id: string;
    name: string;
    address?: string;
    city?: string;
  };
  status: "Active" | "Closed" | "On Hold";
  guardAssignments: GuardAssignment[];
}

const getShiftColor = (shiftType: ShiftType): string => {
  switch (shiftType) {
    case "Full Day":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Full Night":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "Half Day":
      return "bg-green-100 text-green-800 border-green-200";
    case "Half Night":
      return "bg-orange-100 text-orange-800 border-orange-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export const GuardProjectsList: React.FC<{
  projects: ProjectItem[];
  guardId: string;
}> = ({ projects, guardId }) => {
  if (!projects || projects.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Projects</h3>
        <p className="text-gray-600">No associated projects found.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Projects</h3>
      <div className="space-y-3">
        {projects.map((project) => {
          const myAssignments = project.guardAssignments.filter(
            (a) => a.guardId === guardId && a.isActive !== false
          );
          const totalRate = myAssignments.reduce(
            (s, a) => s + (a.monthlyRate || 0),
            0
          );
          return (
            <div
              key={project._id}
              className="border border-gray-200 rounded-lg p-4 bg-white"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {project.projectName}
                    </span>
                    <span className="text-xs text-gray-500">
                      ID: {project.projectId}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Building className="h-3.5 w-3.5" />
                    <span>
                      {project.siteId?.name}
                      {project.siteId?.city ? `, ${project.siteId.city}` : ""}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500">Monthly Total</div>
                  <div className="text-sm font-semibold text-gray-900">
                    ₹{totalRate.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2">
                {myAssignments.map((a, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 px-3 py-2"
                  >
                    <div className="flex items-center gap-2 text-xs text-gray-700">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full border ${getShiftColor(
                          a.shiftType
                        )}`}
                      >
                        {a.shiftType}
                      </span>
                      <Users className="h-3.5 w-3.5 text-gray-400" />
                      <span>₹{a.monthlyRate.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {new Date(a.startDate).toLocaleDateString()} -{" "}
                        {a.endDate
                          ? new Date(a.endDate).toLocaleDateString()
                          : "Ongoing"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default GuardProjectsList;
