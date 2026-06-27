import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Request from './models/Request.js';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/suvidha';

const seedData = async () => {
  try {
    console.log(`Connecting to MongoDB for seeding: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('Connected! Dropping existing records...');

    // Clear old data
    await User.deleteMany();
    await Request.deleteMany();

    console.log('Seeding government-grade portal records...');

    // 1. Seed Super Admin
    const admin = await User.create({
      name: "Chief Admin Commissioner",
      email: "admin@suvidha.gov.in",
      password: "admin123",
      role: "admin",
      department: "General Administration"
    });
    console.log(`Seeded Admin: ${admin.email}`);

    // 2. Seed Departmental Officers
    const officers = [
      {
        name: "Amit Shah (EE)",
        email: "officer.elec@suvidha.gov.in",
        password: "officer123",
        role: "officer",
        department: "Electricity Department"
      },
      {
        name: "S. Krishnan (BWSSB)",
        email: "officer.water@suvidha.gov.in",
        password: "officer123",
        role: "officer",
        department: "Water Department"
      },
      {
        name: "Ramanathan K. (GAIL)",
        email: "officer.gas@suvidha.gov.in",
        password: "officer123",
        role: "officer",
        department: "Gas Department"
      },
      {
        name: "Vikram Seth (BBMP)",
        email: "officer.waste@suvidha.gov.in",
        password: "officer123",
        role: "officer",
        department: "Waste Management"
      },
      {
        name: "Priyanka Sen (Nodal Officer)",
        email: "officer.gen@suvidha.gov.in",
        password: "officer123",
        role: "officer",
        department: "General Administration"
      }
    ];

    for (const off of officers) {
      await User.create(off);
      console.log(`Seeded Officer: ${off.email} (${off.department})`);
    }

    // 3. Seed Citizens
    const citizen1 = await User.create({ name: "Amit Kumar", mobile: "9876543210", aadhaar: "982138294819", role: "citizen" });
    const citizen2 = await User.create({ name: "Saraswathi N.", mobile: "9876543211", aadhaar: "103948294810", role: "citizen" });
    const citizen3 = await User.create({ name: "Leela Devi", mobile: "9876543212", aadhaar: "482910293849", role: "citizen" });
    const citizen4 = await User.create({ name: "Vikram Seth", mobile: "9876543213", aadhaar: "302948392019", role: "citizen" });
    const citizen5 = await User.create({ name: "Priyanka Sen", mobile: "9876543214", aadhaar: "784019203849", role: "citizen" });
    console.log("Seeded 5 Citizens.");

    // 4. Seed Requests/Grievances
    const r1 = await Request.create({
      requestId: "REQ-2026-982739",
      citizenId: citizen1._id,
      serviceType: "electricity",
      subService: "New Connection Request",
      description: "Request for new residential electric meter connection at Plot 45, 12th Main Road, HAL Stage 2.",
      status: "Pending",
      assignedDepartment: "Electricity Department",
      priority: "Standard",
      documents: [
        { name: "Identity Proof", path: "/uploads/mock_id.pdf", verified: true, confidence: 0.98 },
        { name: "Land Sale Deed", path: "/uploads/mock_land.pdf", verified: true, confidence: 0.96 }
      ]
    });

    const r2 = await Request.create({
      requestId: "REQ-2026-103948",
      citizenId: citizen2._id,
      serviceType: "water",
      subService: "Mainline Leakage Complaint",
      description: "Major water main pipe leak observed outside Indiranagar Metro Station. Gallons of water wasting.",
      status: "In-Progress",
      assignedDepartment: "Water Department",
      assignedTeam: "BWSSB Water Grid Repair Crew Alpha",
      remarks: "Excavation and line checking started near Metro Pillar 84.",
      priority: "High",
      documents: [
        { name: "Identity Proof", path: "/uploads/mock_id.pdf", verified: true, confidence: 0.99 },
        { name: "Water Bill Copy", path: "/uploads/mock_bill.pdf", verified: true, confidence: 0.94 }
      ]
    });

    const r3 = await Request.create({
      requestId: "REQ-2026-482910",
      citizenId: citizen3._id,
      serviceType: "gas",
      subService: "PNG Meter Repair",
      description: "Slight smell of gas near the PNG meter valve inside kitchen. Urgently request safety inspection.",
      status: "Pending",
      assignedDepartment: "Gas Department",
      priority: "Critical",
      documents: [
        { name: "Identity Proof", path: "/uploads/mock_id.pdf", verified: true, confidence: 0.97 }
      ]
    });

    const r4 = await Request.create({
      requestId: "REQ-2026-302948",
      citizenId: citizen4._id,
      serviceType: "waste",
      subService: "Garbage Pile Removal",
      description: "Garbage collector vehicle has not visited 4th Cross Lane for 3 consecutive days. Trash piles building up.",
      status: "Completed",
      assignedDepartment: "Waste Management",
      assignedTeam: "BBMP Solid Waste Truck Route 4",
      remarks: "Debris cleared, trash collected, area washed and sanitized.",
      priority: "Standard",
      documents: [
        { name: "Identity Proof", path: "/uploads/mock_id.pdf", verified: true, confidence: 0.95 }
      ]
    });

    const r5 = await Request.create({
      requestId: "REQ-2026-784019",
      citizenId: citizen5._id,
      serviceType: "general",
      subService: "Streetlight Malfunction",
      description: "Streetlight pole SL-048 outside HAL Stage 2 block is offline. Lane is completely dark and unsafe at night.",
      status: "Pending",
      assignedDepartment: "General Administration",
      priority: "High",
      documents: [
        { name: "Identity Proof", path: "/uploads/mock_id.pdf", verified: true, confidence: 0.96 }
      ]
    });

    console.log("Seeded 5 Civic Request/Grievance Tickets.");
    console.log("Database seeding completed successfully.");
    mongoose.connection.close();
  } catch (error) {
    console.error(`Error during database seeding: ${error.message}`);
    process.exit(1);
  }
};

seedData();
