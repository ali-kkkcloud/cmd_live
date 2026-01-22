import React, { useState, useEffect } from 'react';
import { Calendar, Users, AlertCircle, CheckCircle, Activity } from 'lucide-react';

const EMPLOYEES = ["Mahesh", "Shashi", "Nesia", "GUNASAGARI", "Ritanjali", "BRINDA", "Rakesh", "Naveen", "KIRAN", "HARI", "Sunil", "RISHI", "MANTU", "CHANDAN"];

const SHEET_ID_1 = '1GPDqOSURZNALalPzfHNbMft0HQ1c_fIkgfu_V3fSroY';
const SHEET_ID_2 = '1DzW-6Q7hTNn2hSJbEHOkSrbalOmbDIftdjw4I_PhEdA';

const App = () => {
  const [activeTab, setActiveTab] = useState('schedule');
  const [scheduleData, setScheduleData] = useState(null);
  const [issuesData, setIssuesData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [error, setError] = useState('');

  const fetchScheduleData = async (date) => {
    setLoading(true);
    setError('');
    try {
      const sheetName = `Schedule_${date}`;
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID_1}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
      
      const response = await fetch(url);
      const text = await response.text();
      const json = JSON.parse(text.substring(47).slice(0, -2));
      
      const rows = json.table.rows;
      const employeeData = {};
      let liveCount = 0;
      
      const headerRow = rows[0];
      const employeeColumns = {};
      
      headerRow.c.forEach((cell, idx) => {
        if (cell && cell.v) {
          const empName = EMPLOYEES.find(e => cell.v.includes(e));
          if (empName) {
            employeeColumns[empName] = idx;
          }
        }
      });
      
      rows.forEach((row, rowIdx) => {
        if (rowIdx === 0) return;
        
        const cells = row.c || [];
        const firstCell = cells[0]?.v || '';
        
        if (firstCell.includes('WEEK OFF') || firstCell.includes('INACTIVE') || firstCell.includes('Call')) {
          return;
        }
        
        cells.forEach(cell => {
          if (cell?.v && typeof cell.v === 'string' && cell.v.includes('Live')) {
            liveCount++;
          }
        });
        
        Object.entries(employeeColumns).forEach(([empName, colIdx]) => {
          if (!employeeData[empName]) {
            employeeData[empName] = { pending: 0, completed: 0, clients: [] };
          }
          
          const clientCell = cells[colIdx]?.v;
          const nextCell = cells[colIdx + 1]?.v;
          
          if (clientCell && clientCell.trim() !== '' && clientCell.trim() !== '-') {
            const client = {
              name: clientCell,
              timeSlot: cells[0]?.v || '',
              status: nextCell && nextCell.trim() !== '' && nextCell.trim() !== '-' ? 'Completed' : 'Pending'
            };
            
            employeeData[empName].clients.push(client);
            
            if (client.status === 'Pending') {
              employeeData[empName].pending++;
            } else {
              employeeData[empName].completed++;
            }
          }
        });
      });
      
      setScheduleData({
        date,
        employees: employeeData,
        liveCount
      });
      
    } catch (err) {
      setError('Failed to fetch schedule data. Make sure the sheet name exists.');
      console.error(err);
    }
    setLoading(false);
  };

  const fetchIssuesData = async () => {
    setLoading(true);
    setError('');
    try {
      const sheetName = 'Issues- Realtime';
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID_2}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
      
      const response = await fetch(url);
      const text = await response.text();
      const json = JSON.parse(text.substring(47).slice(0, -2));
      
      const rows = json.table.rows;
      const headerRow = rows[0];
      
      const colIndices = {};
      const requiredCols = ['Sub-request', 'Resolved Y/N', 'Raised by', 'Timestamp Issues Raised', 'Clients', 'Vehicle Number', 'Issue Details', 'Date - Current Status'];
      
      headerRow.c.forEach((cell, idx) => {
        if (cell && cell.v) {
          requiredCols.forEach(col => {
            if (cell.v.includes(col)) {
              colIndices[col] = idx;
            }
          });
        }
      });
      
      const issues = [];
      
      rows.forEach((row, rowIdx) => {
        if (rowIdx === 0) return;
        
        const cells = row.c || [];
        const subRequest = cells[colIndices['Sub-request']]?.v || '';
        const resolved = cells[colIndices['Resolved Y/N']]?.v || '';
        
        if (subRequest.includes('Customer request for video') && resolved.toLowerCase() === 'no') {
          issues.push({
            raisedBy: cells[colIndices['Raised by']]?.v || '',
            timestamp: cells[colIndices['Timestamp Issues Raised']]?.f || cells[colIndices['Timestamp Issues Raised']]?.v || '',
            client: cells[colIndices['Clients']]?.v || '',
            vehicleNumber: cells[colIndices['Vehicle Number']]?.v || '',
            issueDetails: cells[colIndices['Issue Details']]?.v || '',
            currentStatus: cells[colIndices['Date - Current Status']]?.v || ''
          });
        }
      });
      
      setIssuesData(issues);
      
    } catch (err) {
      setError('Failed to fetch issues data.');
      console.error(err);
    }
    setLoading(false);
  };

  const handleDateSubmit = () => {
    if (selectedDate) {
      fetchScheduleData(selectedDate);
    }
  };

  useEffect(() => {
    if (activeTab === 'issues') {
      fetchIssuesData();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 flex items-center gap-3">
          <Activity className="text-blue-600" />
          Vehicle Tracking Dashboard
        </h1>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'schedule'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Calendar className="inline mr-2" size={20} />
            Schedule Tracking
          </button>
          <button
            onClick={() => setActiveTab('issues')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'issues'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <AlertCircle className="inline mr-2" size={20} />
            Video Request Issues
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date (format: 19-12-2025)
                  </label>
                  <input
                    type="text"
                    placeholder="DD-MM-YYYY"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleDateSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {loading ? 'Loading...' : 'Fetch Data'}
                </button>
              </div>
            </div>

            {scheduleData && (
              <>
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    Live Vehicles Count: <span className="text-green-600">{scheduleData.liveCount}</span>
                  </h2>
                  <p className="text-gray-600">Date: {scheduleData.date}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(scheduleData.employees).map(([empName, data]) => (
                    <div key={empName} className="bg-white p-6 rounded-lg shadow-lg">
                      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Users size={20} className="text-blue-600" />
                        {empName}
                      </h3>
                      
                      <div className="flex gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="text-green-600" size={20} />
                          <span className="font-semibold">{data.completed}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="text-orange-600" size={20} />
                          <span className="font-semibold">{data.pending}</span>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {data.clients.map((client, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded border-l-4 ${
                              client.status === 'Completed'
                                ? 'bg-green-50 border-green-500'
                                : 'bg-orange-50 border-orange-500'
                            }`}
                          >
                            <div className="font-semibold text-sm">{client.name}</div>
                            <div className="text-xs text-gray-600">{client.timeSlot}</div>
                            <div className={`text-xs font-semibold mt-1 ${
                              client.status === 'Completed' ? 'text-green-700' : 'text-orange-700'
                            }`}>
                              {client.status}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Pending Video Request Issues
              </h2>
              
              {loading ? (
                <p className="text-gray-600">Loading...</p>
              ) : issuesData && issuesData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Raised By</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle Number</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Details</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {issuesData.map((issue, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{issue.timestamp}</td>
                          <td className="px-4 py-3 text-sm font-medium">{issue.raisedBy}</td>
                          <td className="px-4 py-3 text-sm">{issue.client}</td>
                          <td className="px-4 py-3 text-sm">{issue.vehicleNumber}</td>
                          <td className="px-4 py-3 text-sm">{issue.issueDetails}</td>
                          <td className="px-4 py-3 text-sm">{issue.currentStatus}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600">No pending video request issues found.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
