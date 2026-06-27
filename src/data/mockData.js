/**
 * Centralized SUVIDHA Indian Civic Service Mock Database
 * Pre-populated with realistic Indian citizen registrations, requests, complaints, kiosks, and departments.
 */

export const mockKiosks = [
  { id: "K-BLR-01", name: "Indiranagar Ward Office Kiosk", location: "100 Feet Rd, Indiranagar, Bengaluru", status: "Online", lastSync: "Just now" },
  { id: "K-BLR-02", name: "HAL Stage 2 Library Kiosk", location: "HAL 2nd Stage, Indiranagar, Bengaluru", status: "Online", lastSync: "2 mins ago" },
  { id: "K-BLR-03", name: "Koramangala Nodal Center Kiosk", location: "80 Feet Rd, Koramangala, Bengaluru", status: "Online", lastSync: "10 mins ago" },
  { id: "K-BLR-04", name: "Jayanagar 4th Block Metro Kiosk", location: "4th Block Jayanagar, Bengaluru", status: "Online", lastSync: "1 hour ago" },
  { id: "K-BLR-05", name: "Whitefield Ward Office Kiosk", location: "ECC Road, Whitefield, Bengaluru", status: "Offline", lastSync: "1 day ago" }
];

export const mockDepartments = [
  { id: "BESCOM", name: "Bangalore Electricity Supply Company", division: "Power Distribution Grid Wing" },
  { id: "BWSSB", name: "Bangalore Water Supply and Sewerage Board", division: "Water Supply & Leakage Cell" },
  { id: "GAIL", name: "GAIL Gas Limited", division: "PNG Emergency Safety Division" },
  { id: "BBMP-SWM", name: "Bruhat Bengaluru Mahanagara Palike - SWM", division: "Solid Waste Management Cell" },
  { id: "BBMP-CIVIL", name: "Bruhat Bengaluru Mahanagara Palike - Engineering", division: "Civic Road & Streetlight Cell" }
];

export const mockUsers = [
  { id: "U-101", name: "Rohan Sharma", mobile: "9876543210", aadhaar: "XXXX-XXXX-8942", role: "citizen" },
  { id: "U-102", name: "Saraswathi N.", mobile: "9876543211", aadhaar: "XXXX-XXXX-1039", role: "citizen" },
  { id: "U-103", name: "Leela Devi", mobile: "9876543212", aadhaar: "XXXX-XXXX-4829", role: "citizen" },
  { id: "U-104", name: "Vikram Seth", mobile: "9876543213", aadhaar: "XXXX-XXXX-3029", role: "citizen" },
  { id: "U-105", name: "Priyanka Sen", mobile: "9876543214", aadhaar: "XXXX-XXXX-7840", role: "citizen" },
  { id: "U-106", name: "Rajesh Patel", mobile: "9876543215", aadhaar: "XXXX-XXXX-5521", role: "citizen" },
  { id: "U-107", name: "Sunita Rao", mobile: "9876543216", aadhaar: "XXXX-XXXX-6729", role: "citizen" },
  { id: "U-108", name: "Ramesh Gowda", mobile: "9876543217", aadhaar: "XXXX-XXXX-2194", role: "citizen" }
];

export const mockAdmins = [
  { id: "A-501", name: "Officer K. Sandeep", role: "Nodal Desk Head", department: "BESCOM" },
  { id: "A-502", name: "Officer Meera Hegde", role: "Supervising Inspector", department: "BWSSB" },
  { id: "A-503", name: "Officer Anil Patil", role: "Field Emergency Officer", department: "GAIL" }
];

export const mockRequests = [
  {
    id: "REQ-2026-982739",
    citizenName: "Rohan Sharma",
    service: "ELECTRICITY",
    subService: "New Connection",
    status: "Pending",
    department: "BESCOM Power Grid Wing",
    time: "27/06/2026",
    description: "Request for new residential connection at Plot 45, 12th Main Road, HAL Stage 2.",
    priority: "Standard",
    sla: "48 Hours",
    kioskId: "K-BLR-01"
  },
  {
    id: "REQ-2026-103948",
    citizenName: "Saraswathi N.",
    service: "WATER",
    subService: "Leakage Complaint",
    status: "In-Progress",
    department: "BWSSB Water Leakage Cell",
    time: "25/06/2026",
    description: "Major water main pipe leak observed outside Indiranagar Metro Station. Gallons of water wasting.",
    priority: "High",
    sla: "12 Hours",
    kioskId: "K-BLR-01"
  },
  {
    id: "REQ-2026-482910",
    citizenName: "Leela Devi",
    service: "GAS",
    subService: "PNG Valve Smell",
    status: "Escalated",
    department: "GAIL Gas Emergency division",
    time: "24/06/2026",
    description: "Slight smell of gas near the PNG meter valve inside kitchen. Urgently request safety inspection.",
    priority: "Critical",
    sla: "2 Hours",
    kioskId: "K-BLR-02"
  },
  {
    id: "REQ-2026-302948",
    citizenName: "Vikram Seth",
    service: "WASTE",
    subService: "Garbage Dump Issue",
    status: "Completed",
    department: "BBMP Solid Waste Management Cell",
    time: "23/06/2026",
    description: "Garbage collector vehicle has not visited 4th Cross Lane for 3 consecutive days. Trash piles building up.",
    priority: "Standard",
    sla: "24 Hours",
    kioskId: "K-BLR-03"
  },
  {
    id: "REQ-2026-784019",
    citizenName: "Priyanka Sen",
    service: "CIVIC_GENERAL",
    subService: "Streetlight not working",
    status: "Pending",
    department: "BBMP Civic Road & Streetlight Cell",
    time: "22/06/2026",
    description: "Streetlight pole SL-048 outside HAL Stage 2 block is offline. Lane is completely dark and unsafe at night.",
    priority: "High",
    sla: "24 Hours",
    kioskId: "K-BLR-02"
  },
  {
    id: "REQ-2026-552194",
    citizenName: "Rajesh Patel",
    service: "ELECTRICITY",
    subService: "Power Cut Alert",
    status: "Completed",
    department: "BESCOM Power Grid Wing",
    time: "20/06/2026",
    description: "Entire layout has no power since morning. No response from local helpline.",
    priority: "High",
    sla: "6 Hours",
    kioskId: "K-BLR-04"
  },
  {
    id: "REQ-2026-672910",
    citizenName: "Sunita Rao",
    service: "WATER",
    subService: "New Connection",
    status: "Approved",
    department: "BWSSB Water Supply Cell",
    time: "18/06/2026",
    description: "New pipeline supply alignment request for newly built duplex house.",
    priority: "Standard",
    sla: "72 Hours",
    kioskId: "K-BLR-03"
  },
  {
    id: "REQ-2026-219403",
    citizenName: "Ramesh Gowda",
    service: "CIVIC_GENERAL",
    subService: "Road Pothole complaint",
    status: "In-Progress",
    department: "BBMP Civic Road & Streetlight Cell",
    time: "15/06/2026",
    description: "Deep pothole at the main junction of Koramangala 80 Feet Road causing vehicle accidents.",
    priority: "High",
    sla: "48 Hours",
    kioskId: "K-BLR-03"
  }
];

export default {
  kiosks: mockKiosks,
  departments: mockDepartments,
  users: mockUsers,
  admins: mockAdmins,
  requests: mockRequests
};
