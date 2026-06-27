import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Request from './models/Request.js';
import Complaint from './models/Complaint.js';

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/suvidha';

const seedScenarios = async () => {
  try {
    console.log(`Connecting to MongoDB for seeding: ${mongoUri}`);
    await mongoose.connect(mongoUri);
    console.log('Connected! Dropping existing citizen records...');

    // Clear old data
    await User.deleteMany();
    await Request.deleteMany();
    await Complaint.deleteMany();

    console.log('Seeding 5 realistic Snapdragon Multiverse Kiosk scenarios...');

    // Scenario 1: New Electricity Connection
    const user1 = await User.create({ name: "Amit Kumar", mobile: "9876543210", aadhaar: "982138294819", role: "citizen" });
    const request1 = await Request.create({
      requestId: "REQ-2026-982739",
      citizenId: user1._id,
      serviceType: "electricity",
      status: "Pending",
      assignedDepartment: "BESCOM Indiranagar Sub-division Office",
      documents: [
        { name: "Identity Proof", path: "/uploads/idProof-amit.pdf", verified: true, confidence: 0.98 },
        { name: "Land Sale Deed", path: "/uploads/landDeed-amit.pdf", verified: true, confidence: 0.96 }
      ]
    });
    await Complaint.create({
      requestId: request1._id,
      complaintType: "New Connection",
      description: "Request for new residential connection at Plot 45, 12th Main Road, HAL Stage 2.",
      priority: "Standard"
    });

    // Scenario 2: Water Leakage Complaint
    const user2 = await User.create({ name: "Saraswathi N.", mobile: "9876543211", aadhaar: "103948294810", role: "citizen" });
    const request2 = await Request.create({
      requestId: "REQ-2026-103948",
      citizenId: user2._id,
      serviceType: "water",
      status: "In-Progress",
      assignedDepartment: "BWSSB Water Grid Nodal Wing Ward 84",
      documents: [
        { name: "Identity Proof", path: "/uploads/idProof-sara.pdf", verified: true, confidence: 0.99 },
        { name: "Water Bill Copy", path: "/uploads/waterBill-sara.pdf", verified: true, confidence: 0.94 }
      ]
    });
    await Complaint.create({
      requestId: request2._id,
      complaintType: "Leakage Complaint",
      description: "Major water main pipe leak observed outside Indiranagar Metro Station. Gallons of water wasting.",
      priority: "High"
    });

    // Scenario 3: Gas Maintenance Request
    const user3 = await User.create({ name: "Leela Devi", mobile: "9876543212", aadhaar: "482910293849", role: "citizen" });
    const request3 = await Request.create({
      requestId: "REQ-2026-482910",
      citizenId: user3._id,
      serviceType: "gas",
      status: "Escalated",
      assignedDepartment: "GAIL Gas Emergency Division",
      documents: [
        { name: "Identity Proof", path: "/uploads/idProof-leela.pdf", verified: true, confidence: 0.97 },
        { name: "Gas Agreement", path: "/uploads/gasAgreement-leela.pdf", verified: true, confidence: 0.95 }
      ]
    });
    await Complaint.create({
      requestId: request3._id,
      complaintType: "Maintenance Request",
      description: "Slight smell of gas near the PNG meter valve inside kitchen. Urgently request safety inspection.",
      priority: "Critical"
    });

    // Scenario 4: Waste Collection Complaint
    const user4 = await User.create({ name: "Vikram Seth", mobile: "9876543213", aadhaar: "302948392019", role: "citizen" });
    const request4 = await Request.create({
      requestId: "REQ-2026-302948",
      citizenId: user4._id,
      serviceType: "waste",
      status: "Completed",
      assignedDepartment: "BBMP Solid Waste Cell Ward 84",
      documents: [
        { name: "Identity Proof", path: "/uploads/idProof-vikram.pdf", verified: true, confidence: 0.95 }
      ]
    });
    await Complaint.create({
      requestId: request4._id,
      complaintType: "Garbage Collection Issue",
      description: "Garbage collector vehicle has not visited 4th Cross Lane for 3 consecutive days. Trash piles building up.",
      priority: "Standard"
    });

    // Scenario 5: Streetlight not working complaint
    const user5 = await User.create({ name: "Priyanka Sen", mobile: "9876543214", aadhaar: "784019203849", role: "citizen" });
    const request5 = await Request.create({
      requestId: "REQ-2026-784019",
      citizenId: user5._id,
      serviceType: "general",
      status: "Pending",
      assignedDepartment: "BBMP Streetlight Cell",
      documents: [
        { name: "Identity Proof", path: "/uploads/idProof-priya.pdf", verified: true, confidence: 0.96 }
      ]
    });
    await Complaint.create({
      requestId: request5._id,
      complaintType: "Streetlight issue",
      description: "Streetlight pole SL-048 outside HAL Stage 2 block is offline. Lane is completely dark and unsafe at night.",
      priority: "High"
    });

    console.log('Seeding complete! 5 scenarios successfully seeded to MongoDB.');
    mongoose.connection.close();
  } catch (error) {
    console.error(`Error during seeding: ${error.message}`);
    process.exit(1);
  }
};

seedScenarios();
