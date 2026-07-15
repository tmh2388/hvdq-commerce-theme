/** Cross-source audit stamping for direct Google Sheets edits. */
function onEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (sheet.getName() !== HVDQ.SHEETS.PRODUCTS || e.range.getRow() < 2) return;
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const lastUpdatedColumn = headers.indexOf('Last Updated') + 1;
  const updatedByColumn = headers.indexOf('Updated By') + 1;
  if (!lastUpdatedColumn || !updatedByColumn) return;
  if (e.range.getColumn() === lastUpdatedColumn || e.range.getColumn() === updatedByColumn) return;

  const actor = e.user && e.user.getEmail ? e.user.getEmail() : '';
  sheet.getRange(e.range.getRow(), lastUpdatedColumn).setValue(new Date());
  sheet.getRange(e.range.getRow(), updatedByColumn).setValue(actor || 'GOOGLE_SHEETS');
}

function getAutomationActor_() {
  const email = Session.getActiveUser().getEmail();
  return email || 'APPS_SCRIPT';
}
