import React from "react";
import { Card } from "../common";
import { MapPin, Building } from "lucide-react";

export interface SiteItem {
  _id: string;
  name: string;
  address?: string;
  city?: string;
}

export const GuardSitesList: React.FC<{ sites: SiteItem[] }> = ({ sites }) => {
  if (!sites || sites.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Sites</h3>
        <p className="text-gray-600">No associated sites found.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Sites</h3>
      <div className="space-y-3">
        {sites.map((site) => (
          <div
            key={site._id}
            className="border border-gray-200 rounded-lg p-4 bg-white"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900 capitalize">
                  {site.name}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <MapPin className="h-3.5 w-3.5" />
                <span>
                  {site.city || ""}
                  {site.address ? ` • ${site.address}` : ""}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default GuardSitesList;
