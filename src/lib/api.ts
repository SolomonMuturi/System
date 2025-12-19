// /lib/api.js
export async function fetchCarrierPerformance() {
  const res = await fetch('/api/carrier/performance');
  if (!res.ok) throw new Error('Failed to fetch carrier performance');
  return res.json();
}

export async function fetchColdRoomStats() {
  const res = await fetch('/api/cold-room?action=stats');
  if (!res.ok) throw new Error('Failed to fetch cold room stats');
  return res.json();
}

export async function fetchUtilityReadings() {
  const res = await fetch('/api/utility-readings?limit=30');
  if (!res.ok) throw new Error('Failed to fetch utility readings');
  return res.json();
}

export async function fetchCountingStats() {
  const res = await fetch('/api/counting?action=stats');
  if (!res.ok) throw new Error('Failed to fetch counting stats');
  return res.json();
}

export async function fetchRejectionStats() {
  const res = await fetch('/api/rejections');
  if (!res.ok) throw new Error('Failed to fetch rejection stats');
  return res.json();
}

export async function fetchLoadingSheetStats() {
  const res = await fetch('/api/loading-sheets?limit=10');
  if (!res.ok) throw new Error('Failed to fetch loading sheets');
  return res.json();
}

export async function fetchWeightStats() {
  const res = await fetch('/api/weights?limit=1');
  if (!res.ok) throw new Error('Failed to fetch weight stats');
  return res.json();
}

export async function fetchVisitorStats() {
  const res = await fetch('/api/visitors');
  if (!res.ok) throw new Error('Failed to fetch visitor stats');
  return res.json();
}

export async function fetchEmployeeStats() {
  const res = await fetch('/api/employees');
  if (!res.ok) throw new Error('Failed to fetch employee stats');
  return res.json();
}

export async function fetchAttendanceStats() {
  const res = await fetch('/api/attendance?date=' + new Date().toISOString().split('T')[0]);
  if (!res.ok) throw new Error('Failed to fetch attendance stats');
  return res.json();
}