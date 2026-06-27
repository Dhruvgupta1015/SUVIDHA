// Local Edge AI Document Verification Simulation
export const verifyDocumentOnDevice = (file, docType) => {
  return new Promise((resolve) => {
    // Simulate Edge AI processing delay
    setTimeout(() => {
      const isAadhaar = docType === 'aadhaar' || file.name.toLowerCase().includes('aadhaar');
      const isUtilityBill = docType === 'bill' || file.name.toLowerCase().includes('bill') || file.name.toLowerCase().includes('receipt');

      // Random OCR text generation based on file name
      let extractedData = {};
      let verified = true;
      let reason = '';
      let confidence = 0.92 + Math.random() * 0.07; // 92-99%

      if (isAadhaar) {
        extractedData = {
          name: "Rohan Sharma",
          uid: "XXXX-XXXX-8942",
          dob: "12/08/1991",
          gender: "MALE",
          address: "Flat 402, Green Glen Layout, Outer Ring Road, Bangalore - 560103"
        };
      } else if (isUtilityBill) {
        extractedData = {
          consumerNo: "1028394819",
          billingUnit: "BESCOM Bangalore East",
          name: "Rohan Sharma",
          amountDue: "₹1,432.00",
          billDate: "15/06/2026"
        };
      } else {
        // Unrecognized doc
        verified = Math.random() > 0.3; // 70% chance of passing
        confidence = 0.65 + Math.random() * 0.2;
        
        if (verified) {
          extractedData = {
            detectedTitle: "Identity / Address Proof Document",
            primaryName: "Rohan Sharma",
            dateOfIssue: "10/01/2025"
          };
        } else {
          reason = "Document blurred or low contrast. Edge OCR engine failed confidence threshold (needs >80%).";
          confidence = 0.45;
        }
      }

      resolve({
        success: verified,
        confidence: parseFloat(confidence.toFixed(2)),
        docType: docType || (isAadhaar ? 'aadhaar' : isUtilityBill ? 'bill' : 'other'),
        extractedData,
        reason,
        processingTimeMs: 800 + Math.floor(Math.random() * 600),
        engine: "Qualcomm Snapdragon NPU Edge OCR v2.1"
      });
    }, 1500);
  });
};
