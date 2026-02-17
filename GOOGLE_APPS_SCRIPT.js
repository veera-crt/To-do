/**
 * GLOBAL SYNC SCRIPT v5.0 (Debug Mode)
 * Handles addition, updates, deletion, and PENDING TASK EMAILS.
 */

// CONFIGURATION
var RECIPIENT_EMAIL = "veeranpandian62@gmail.com";
var SHEET_GID = "1457070184"; // Your specific tab ID

function doGet(e) {
    try {
        if (!e.parameter.payload) {
            return ContentService.createTextOutput("API is live! No data received yet.")
                .setMimeType(ContentService.MimeType.TEXT);
        }

        var payload = JSON.parse(e.parameter.payload);
        var action = payload.action;
        var ss = SpreadsheetApp.getActiveSpreadsheet();
        var sheet = getSheetByGid(ss, SHEET_GID) || ss.getSheets()[0];

        if (action === 'delete') {
            var rowIndex = parseInt(payload.index);
            if (!isNaN(rowIndex) && rowIndex > 0) {
                sheet.deleteRow(rowIndex);
                return sendResponse({ success: true, message: "Row " + rowIndex + " deleted!" });
            } else {
                return sendResponse({ success: false, error: "Invalid row index: " + payload.index });
            }
        }

        // Match data to column headers
        var data = payload.data;
        var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function (h) {
            return h.toString().trim();
        });

        var rowValues = headers.map(function (h) {
            return data[h] !== undefined ? data[h] : "";
        });

        if (action === 'add') {
            sheet.appendRow(rowValues);
        } else if (action === 'update') {
            sheet.getRange(payload.index, 1, 1, rowValues.length).setValues([rowValues]);
        }

        return sendResponse({ success: true, message: action + " successful!" });

    } catch (err) {
        return sendResponse({ success: false, error: err.toString() });
    }
}

/**
 * 📧 AUTOMATED EMAIL REMINDER FUNCTION (DEBUG MODE)
 * Run this function manually to test email delivery.
 */
function sendPendingReminders() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getSheetByGid(ss, SHEET_GID) || ss.getSheets()[0];
    var data = sheet.getDataRange().getValues();

    Logger.log("Total rows found: " + data.length);

    if (data.length < 2) {
        Logger.log("No data rows found.");
        return;
    }

    var headers = data[0];
    Logger.log("Headers found: " + headers.join(", "));

    var statusIdx = headers.indexOf("Status");
    var descIdx = headers.indexOf("Description");
    var timeIdx = headers.indexOf("Timing");
    var dateIdx = headers.indexOf("Date");

    if (statusIdx === -1 || descIdx === -1) {
        Logger.log("Error: 'Status' or 'Description' column not found.");
        return;
    }

    var pendingTasks = [];
    var pendingHtml = "<h3>Here are your pending tasks:</h3><ul>";

    for (var i = 1; i < data.length; i++) {
        var row = data[i];
        var status = row[statusIdx].toString().toLowerCase();

        // Check if task is NOT completed (Pending, In Progress, or empty)
        if (!status.includes("completed") && row[descIdx]) {
            pendingTasks.push(row);
            pendingHtml += "<li><strong>" + row[descIdx] + "</strong><br/>" +
                "<span style='color:#666; font-size:12px'>" + (row[dateIdx] || "") + " | " + (row[timeIdx] || "") + "</span></li><br/>";
        }
    }
    pendingHtml += "</ul>";

    Logger.log("Pending tasks found: " + pendingTasks.length);

    if (pendingTasks.length > 0) {
        MailApp.sendEmail({
            to: RECIPIENT_EMAIL,
            subject: "⏳ Pending Work Reminder (" + pendingTasks.length + " Tasks)",
            htmlBody: pendingHtml
        });
        Logger.log("Email sent to " + RECIPIENT_EMAIL);
    } else {
        // Fallback: Send email even if no pending tasks, to confirm system works
        Logger.log("No pending tasks found. Sending test email...");
        MailApp.sendEmail({
            to: RECIPIENT_EMAIL,
            subject: "✅ No Pending Tasks (Test Success)",
            body: "Great job! You have no pending tasks right now. This email confirms the reminder system is working."
        });
    }
}

function getSheetByGid(ss, gid) {
    var sheets = ss.getSheets();
    for (var i = 0; i < sheets.length; i++) {
        if (sheets[i].getSheetId().toString() === gid) return sheets[i];
    }
    return null;
}

function sendResponse(obj) {
    return ContentService.createTextOutput(JSON.stringify(obj))
        .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) { return doGet(e); }
