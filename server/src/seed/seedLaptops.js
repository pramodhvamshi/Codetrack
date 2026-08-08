const mongoose = require('mongoose');
const LaptopInventory = require('../models/Service/LaptopInventory');
const config = require('../config/env');

const initialLaptopsData = [
  { sNo: 1, laptopNumber: "MCT LAPTOP 228", serviceTag: "SPF5RV15D", mssId: "MSS2022034", studentName: "chandradeep", college: "nit calicut", hostel: "nit calicut", status: "Verified", remarks: "Verified on 02/08/2023" },
  { sNo: 2, laptopNumber: "MCT LAPTOP 229", serviceTag: "SPF5RTY7H", mssId: "MSS2022093", studentName: "L Santhosh", college: "VNR", hostel: "Kukatpally", status: "Verified", remarks: "No issue" },
  { sNo: 3, laptopNumber: "MCT LAPTOP 230", serviceTag: "SPF5RS8XH", mssId: "MSS2021030", studentName: "kalyan ram", college: "mvsr", hostel: "mvsr", status: "Verified", remarks: "No issue" },
  { sNo: 4, laptopNumber: "MCT LAPTOP 231", serviceTag: "SPF5RQJPH", mssId: "MSS2020038", studentName: "G.Maneesh Kumar", college: "mvsr", hostel: "mvsr", status: "Verified", remarks: "No issue" },
  { sNo: 5, laptopNumber: "MCT LAPTOP 232", serviceTag: "SPF5RKV68", mssId: "MSS2023114", studentName: "Shivani.B", college: "VNR", hostel: "Kukatpally", status: "Verified", remarks: "No issue" },
  { sNo: 6, laptopNumber: "MCT LAPTOP 233", serviceTag: "SPF5RL8RW", mssId: "MSS2021047", studentName: "Naveen Gantyala", college: "VNR", hostel: "Kukatpally", status: "Verified", remarks: "No issue" },
  { sNo: 7, laptopNumber: "MCT LAPTOP 234", serviceTag: "SPF5RVBP1", mssId: "MSS2023100", studentName: "Sangeetha.B", college: "VNR", hostel: "Kukatpally", status: "Verified", remarks: "No issue" },
  { sNo: 8, laptopNumber: "MCT LAPTOP 235", serviceTag: "SPF5RPRVY", mssId: "MSS2023139", studentName: "Thrinay.G", college: "CBIT", hostel: "Mehdipatnam", status: "Verified", remarks: "No issue" },
  { sNo: 9, laptopNumber: "MCT LAPTOP 236", serviceTag: "SPF5RY96J", mssId: "MSS2023085", studentName: "Rishitha.T", college: "GRIET", hostel: "Kukatpally", status: "Verified", remarks: "No issue" },
  { sNo: 10, laptopNumber: "MCT LAPTOP 237", serviceTag: "SPF5RV79Q", mssId: "MSS2023006", studentName: "R Akshay", college: "VNR", hostel: "Kukatpally", status: "Verified", remarks: "No issue" },
  { sNo: 11, laptopNumber: "MCT LAPTOP 238", serviceTag: "SPF5RTY0M", mssId: "MSS2022006", studentName: "Adithya Vemula", college: "VNR", hostel: "Kukatpally", status: "Verified", remarks: "No issue" },
  { sNo: 12, laptopNumber: "MCT LAPTOP 239", serviceTag: "SPF5RVBSH", mssId: "MSS2020025", studentName: "T Karthik", college: "VNR", hostel: "Kukatpally", status: "Verified", remarks: "No issue" },
  { sNo: 13, laptopNumber: "MCT LAPTOP 240", serviceTag: "SPF5RSPRK", mssId: "MSS2021073", studentName: "Ch.Srilatha", college: "CBIT", hostel: "Mehdipatnam", status: "At Office - No Issues", remarks: "Office spare" },
  { sNo: 14, laptopNumber: "MCT LAPTOP 241", serviceTag: "SPF5RJKF9", mssId: "MSS2023092", studentName: "Sai archana.J", college: "CBIT", hostel: "Mehdipatnam", status: "Verified", remarks: "No issue" },
  { sNo: 15, laptopNumber: "MCT LAPTOP 242", serviceTag: "SPF5RV49B", mssId: "MSS2023123", studentName: "Sreeja.K", college: "VNR", hostel: "Kukatpally", status: "Verified", remarks: "No issue" },
  { sNo: 16, laptopNumber: "MCT LAPTOP 243", serviceTag: "SPF5RL073", mssId: "MSS2020005", studentName: "Ajay Kumar Gorakanti", college: "GRIET", hostel: "Kukatpally", status: "Verified", remarks: "No issue" },
  { sNo: 17, laptopNumber: "MCT LAPTOP 244", serviceTag: "SPF5RVF2F", mssId: "MSS2022083", studentName: "D Rushik", college: "GRIET", hostel: "Kucatpally", status: "Verified", remarks: "No issue" },
  { sNo: 18, laptopNumber: "MCT LAPTOP 245", serviceTag: "SPF5RQ9ZJ", mssId: "MSS2022095", studentName: "Satwik.N", college: "VMEG", hostel: "Narkhuda", status: "Verified", remarks: "No issue" },
  { sNo: 19, laptopNumber: "MCT LAPTOP 246", serviceTag: "SPF5RQ0H9", mssId: "MSS2022060", studentName: "S Manasa", college: "BVRIT", hostel: "Kukatpally", status: "Verified", remarks: "No issue" },
  { sNo: 20, laptopNumber: "MCT LAPTOP 247", serviceTag: "SPF5RM1T0", mssId: "MSS2023063", studentName: "A. Mokshitha", college: "BVRIT", hostel: "Kukatpally", status: "Verified", remarks: "No issue" },
  { sNo: 21, laptopNumber: "MCT LAPTOP 248", serviceTag: "SPF5RQYNF", mssId: "MSS2020083", studentName: "Swamy Boya", college: "GRIET", hostel: "Kukatpally", status: "Verified", remarks: "No issue" },
  { sNo: 22, laptopNumber: "MCT LAPTOP 249", serviceTag: "SPF5RPNCQ", mssId: "MSS2020030", studentName: "T. Laxmi", college: "Vasavi", hostel: "Mehdipatnam", status: "At Office - No Issues", remarks: "Office spare" },
  { sNo: 23, laptopNumber: "MCT LAPTOP 250", serviceTag: "SPF5RQ0M7", mssId: "OFFICE", studentName: "Office", college: "Office", hostel: "Office", status: "At Office - Need to send to R&D", remarks: "Charging pin & fan issue" },
  { sNo: 24, laptopNumber: "MCT LAPTOP 251", serviceTag: "SPF5RLWT1", mssId: "MSS2022010", studentName: "Akhsaya.k", college: "VMEG", hostel: "Narkhuda", status: "Verified", remarks: "No issue" },
  { sNo: 25, laptopNumber: "MCT LAPTOP 252", serviceTag: "SPF5RRZAP", mssId: "MSS2020070", studentName: "shirish.S", college: "GRIET", hostel: "Kukatpally", status: "Verified", remarks: "No issue" },
  { sNo: 26, laptopNumber: "MCT LAPTOP 253", serviceTag: "SPF5RJR6G", mssId: "MSS2023105", studentName: "Seetharam", college: "GRIET", hostel: "Kukatpally", status: "Verified", remarks: "No issue" },
  { sNo: 27, laptopNumber: "MCT LAPTOP 254", serviceTag: "SPF5RPNBS", mssId: "MSS2023075", studentName: "Rahul.M", college: "GRIET", hostel: "Kukatpally", status: "Verified", remarks: "No issue" },
  { sNo: 28, laptopNumber: "MCT LAPTOP 255", serviceTag: "SPF5RJD7M", mssId: "OFFICE", studentName: "Office", college: "Office", hostel: "Office", status: "At Office - Need to send to R&D", remarks: "R&D repair pending" },
  { sNo: 29, laptopNumber: "MCT LAPTOP 256", serviceTag: "SPF5RVQ6Y", mssId: "MSS2022014", studentName: "P Akshitha", college: "VNR", hostel: "Kukatpally", status: "Verified", remarks: "No issue" },
  { sNo: 30, laptopNumber: "MCT LAPTOP 257", serviceTag: "SPF5RVMM5", mssId: "MSS2020085", studentName: "Swetha Aleti", college: "Vasavi", hostel: "Mehdipatnam", status: "Verified", remarks: "No issue" },
];

async function seedLaptops() {
  try {
    const mongoUri = config.mongoUri;
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for laptop seeding...');

    for (const item of initialLaptopsData) {
      await LaptopInventory.findOneAndUpdate(
        { laptopNumber: item.laptopNumber },
        item,
        { upsert: true, new: true }
      );
    }
    console.log(`Successfully seeded ${initialLaptopsData.length} laptop inventory records!`);
  } catch (err) {
    console.error('Failed to seed laptops:', err);
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  seedLaptops();
}

module.exports = seedLaptops;
