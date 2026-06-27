// Local Receipt Generator & Printer Simulation
export const generateReceipt = (transaction) => {
  const receiptId = `SV-${Math.floor(100000 + Math.random() * 900000)}`;
  const date = new Date().toLocaleString();

  return {
    receiptId,
    timestamp: date,
    kioskId: "K-BLR-04",
    location: "Indiranagar Metro Station Kiosk, Bangalore",
    serviceName: transaction.serviceName || "Civic Complaint",
    refNumber: transaction.refNumber || `COMP-${Math.floor(1000000 + Math.random() * 9000000)}`,
    citizenName: transaction.citizenName || "Guest User",
    details: transaction.details || {},
    status: transaction.status || "Submitted",
    footerMessage: "Thank you for using SUVIDHA. Keep this receipt for tracking. Helpline: 1800-425-XXXX"
  };
};

export const printReceipt = (receipt) => {
  // Try printing via standard window print or output a simulated dialog
  console.log("Printing receipt...", receipt);
  
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) {
    alert("Popup blocker active. Please allow popups to print receipt.");
    return false;
  }

  const html = `
    <html>
      <head>
        <title>SUVIDHA Receipt - ${receipt.receiptId}</title>
        <style>
          body {
            font-family: monospace;
            padding: 20px;
            color: #333;
            font-size: 14px;
            max-width: 350px;
            margin: auto;
          }
          .header {
            text-align: center;
            border-bottom: 1px dashed #333;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          .title {
            font-size: 18px;
            font-weight: bold;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
          }
          .divider {
            border-top: 1px dashed #333;
            margin: 15px 0;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            margin-top: 20px;
            border-top: 1px dashed #333;
            padding-top: 10px;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">SUVIDHA HELPDESK</div>
          <div>Smart Civic Service Kiosk</div>
          <div>Location: ${receipt.location}</div>
          <div>Kiosk ID: ${receipt.kioskId}</div>
        </div>
        <div class="row">
          <span>Receipt ID:</span>
          <span><b>${receipt.receiptId}</b></span>
        </div>
        <div class="row">
          <span>Date:</span>
          <span>${receipt.timestamp}</span>
        </div>
        <div class="row">
          <span>Citizen Name:</span>
          <span>${receipt.citizenName}</span>
        </div>
        <div class="divider"></div>
        <div class="row">
          <span><b>Service:</b></span>
          <span><b>${receipt.serviceName}</b></span>
        </div>
        <div class="row">
          <span>Ref No:</span>
          <span>${receipt.refNumber}</span>
        </div>
        <div class="row">
          <span>Status:</span>
          <span>${receipt.status}</span>
        </div>
        
        <div class="divider"></div>
        <div><b>Transaction Details:</b></div>
        ${Object.entries(receipt.details).map(([key, value]) => `
          <div class="row" style="font-size: 12px; padding-left: 10px;">
            <span>${key}:</span>
            <span>${value}</span>
          </div>
        `).join('')}
        
        <div class="footer">
          <p>${receipt.footerMessage}</p>
          <p>Scan OR code on tracking screen for updates</p>
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          }
        </script>
      </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
  return true;
};
