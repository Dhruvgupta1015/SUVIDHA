// Registry of all Active Service Modules in SUVIDHA
export const servicesList = [
  {
    id: "electricity",
    titleKey: "electricity",
    path: "/electricity",
    icon: "Zap",
    color: "from-amber-400 to-yellow-600",
    bgAlpha: "rgba(234, 179, 8, 0.15)",
    department: "Electricity Distribution Board",
    inputs: [
      { id: "consumerNo", label: "Consumer Number (10 digits)", type: "text", required: true, pattern: "^\\d{10}$" },
      { id: "complaintType", label: "Complaint Type", type: "select", options: ["Power Cut", "Meter Issue", "Voltage Fluctuations", "Bill Dispute"], required: true },
      { id: "description", label: "Grievance Description", type: "textarea", required: true }
    ]
  },
  {
    id: "water",
    titleKey: "water",
    path: "/water",
    icon: "Droplet",
    color: "from-blue-400 to-sky-600",
    bgAlpha: "rgba(59, 130, 246, 0.15)",
    department: "Water Supply and Sewerage Board",
    inputs: [
      { id: "consumerNo", label: "RR Number / Service ID", type: "text", required: true },
      { id: "complaintType", label: "Complaint Type", type: "select", options: ["No Water Supply", "Water Leakage", "Contaminated Water", "New Connection Delay"], required: true },
      { id: "description", label: "Grievance Description", type: "textarea", required: true }
    ]
  },
  {
    id: "gas",
    titleKey: "gas",
    path: "/gas",
    icon: "Flame",
    color: "from-orange-500 to-red-600",
    bgAlpha: "rgba(249, 115, 22, 0.15)",
    department: "Natural Gas Grid",
    inputs: [
      { id: "consumerNo", label: "PNG Customer ID", type: "text", required: true },
      { id: "complaintType", label: "Complaint Type", type: "select", options: ["Gas Leakage (High Priority)", "Pressure Low", "Billing/Meter Issue", "Reconnection"], required: true },
      { id: "description", label: "Grievance Description", type: "textarea", required: true }
    ]
  },
  {
    id: "waste",
    titleKey: "waste",
    path: "/waste",
    icon: "Trash2",
    color: "from-emerald-400 to-teal-600",
    bgAlpha: "rgba(16, 185, 129, 0.15)",
    department: "Municipal Corporation Solid Waste Dept",
    inputs: [
      { id: "wardNo", label: "Ward Number / Locality Name", type: "text", required: true },
      { id: "complaintType", label: "Complaint Type", type: "select", options: ["Garbage Dump Clearance", "Dead Animal Removal", "Regular Sweeping Issue", "Drainage Blockage"], required: true },
      { id: "description", label: "Grievance Description", type: "textarea", required: true }
    ]
  },
  {
    id: "complaints",
    titleKey: "complaints",
    path: "/complaints",
    icon: "FileText",
    color: "from-indigo-400 to-violet-600",
    bgAlpha: "rgba(99, 102, 241, 0.15)",
    department: "Citizen Grievance & General Helpdesk",
    inputs: [
      { id: "fullName", label: "Citizen Name", type: "text", required: true },
      { id: "departmentName", label: "Target Department", type: "select", options: ["Roads & Potholes", "Streetlights", "Public Parks", "Stray Animal Welfare", "General Query"], required: true },
      { id: "description", label: "Detailed Request / Grievance", type: "textarea", required: true }
    ]
  }
];
