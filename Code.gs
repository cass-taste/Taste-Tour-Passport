// Copy and paste this code into the Google Apps Script Editor

const SHEET_NAME = 'Passport_Tracking';

// Setup function to create the sheet and headers if they don't exist
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['Timestamp', 'Operator Company', 'Attendee Name', 'Supplier Checked']);
    sheet.getRange("A1:D1").setFontWeight("bold").setBackground("#e0e0e0");
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 150);
    sheet.setColumnWidth(2, 200);
    sheet.setColumnWidth(3, 200);
    sheet.setColumnWidth(4, 250);
  }
}

// Handle GET requests (Options pre-flight and actual data payload)
function doGet(e) {
  // We need to return JSONP or allow CORS. For simple web apps, allowing CORS via ContentService is best.
  // However, simple GET requests with query params are easiest for offline queues to retry blindly.
  
  if (!e || !e.parameter) {
    return createJsonResponse({ status: 'error', message: 'No parameters provided' });
  }

  const action = e.parameter.action; // 'check' or 'uncheck'
  const company = e.parameter.company;
  const name = e.parameter.name || 'Unknown Name';
  const supplier = e.parameter.supplier;

  if (!company || !supplier || !action) {
    return createJsonResponse({ status: 'error', message: 'Missing required parameters' });
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    // Auto-setup if missing
    if (!sheet) {
      setup();
      sheet = ss.getSheetByName(SHEET_NAME);
    }

    const timestamp = new Date();
    const actionText = action === 'check' ? `Completed: ${supplier}` : `Removed: ${supplier}`;
    
    // Append the row
    sheet.appendRow([timestamp, company, name, actionText]);

    return createJsonResponse({ status: 'success', message: 'Recorded' });
    
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

// Handle POST requests just in case
function doPost(e) {
  return doGet(e);
}

// Helper to format output properly for CORS
function createJsonResponse(responseObject) {
  return ContentService.createTextOutput(JSON.stringify(responseObject))
    .setMimeType(ContentService.MimeType.JSON);
}
