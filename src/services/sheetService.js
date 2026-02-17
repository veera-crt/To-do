const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1z01drUB4oa08cLlq_NggAQqicCdnVbb8wido-9-U9_I/export?format=csv&gid=1457070184';
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL || '';

export const fetchSheetData = async () => {
  try {
    const response = await fetch(SHEET_CSV_URL);
    const csvData = await response.text();
    return parseCSV(csvData);
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    return [];
  }
};

export const createSheetRow = async (rowData) => {
  if (!APPS_SCRIPT_URL) return { success: true, mock: true };
  try {
    const payload = encodeURIComponent(JSON.stringify({ action: 'add', data: rowData }));
    const url = `${APPS_SCRIPT_URL}${APPS_SCRIPT_URL.includes('?') ? '&' : '?'}payload=${payload}`;
    await fetch(url, { mode: 'no-cors' });
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

export const updateSheetRow = async (rowIndex, rowData) => {
  if (!APPS_SCRIPT_URL) return { success: true, mock: true };
  try {
    const payload = encodeURIComponent(JSON.stringify({ action: 'update', index: rowIndex, data: rowData }));
    const url = `${APPS_SCRIPT_URL}${APPS_SCRIPT_URL.includes('?') ? '&' : '?'}payload=${payload}`;
    await fetch(url, { mode: 'no-cors' });
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

export const deleteSheetRow = async (rowIndex) => {
  if (!APPS_SCRIPT_URL) return { success: true, mock: true };
  try {
    const payload = encodeURIComponent(JSON.stringify({ action: 'delete', index: rowIndex }));
    const url = `${APPS_SCRIPT_URL}${APPS_SCRIPT_URL.includes('?') ? '&' : '?'}payload=${payload}`;
    await fetch(url, { mode: 'no-cors' });
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

const parseCSV = (csv) => {
  const lines = csv.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const results = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]) continue;
    const currentLine = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
    const obj = {};
    headers.forEach((header, index) => {
      let val = currentLine[index] ? currentLine[index].trim().replace(/"/g, '') : '';
      obj[header] = val;
    });
    results.push(obj);
  }
  return results;
};
