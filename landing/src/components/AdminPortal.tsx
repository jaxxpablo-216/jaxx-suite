import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Employee, Role, generateToken } from '../services/auth';
import { ShieldCheck, UserPlus, Key, Search, Clock, Save, Copy, Check } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';

export function AdminPortal() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Issue Token Modal State
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [tokenDuration, setTokenDuration] = useState<number>(90);
  const [generatedToken, setGeneratedToken] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Add User State
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newRole, setNewRole] = useState<Role>('Employee');

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'employees'));
      const list: Employee[] = [];
      snap.forEach(d => list.push(d.data() as Employee));
      setEmployees(list);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleIssueToken = async () => {
    if (!selectedEmp) return;
    const token = generateToken(16);
    const expiresAt = new Date(Date.now() + tokenDuration * 24 * 60 * 60 * 1000).toISOString();
    
    try {
      await setDoc(doc(db, 'employees', selectedEmp.employeeId), {
        ...selectedEmp,
        token,
        tokenExpiresAt: expiresAt
      });
      setGeneratedToken(token);
      fetchEmployees();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId || !newFirstName || !newLastName) return;

    try {
      const emp: Employee = {
        employeeId: newUserId,
        firstName: newFirstName,
        lastName: newLastName,
        role: newRole,
        department: 'Operations',
        email: `${newFirstName.toLowerCase()}.${newLastName.toLowerCase()}@jaxx.com`,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'employees', newUserId), emp);
      setShowAddUser(false);
      setNewUserId('');
      setNewFirstName('');
      setNewLastName('');
      fetchEmployees();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredEmployees = employees.filter(e => 
    e.employeeId.includes(searchTerm) || 
    e.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderTokenStatus = (emp: Employee) => {
    if (!emp.tokenExpiresAt) return <span className="text-neutral-500 font-mono text-[10px]">—</span>;
    const exp = new Date(emp.tokenExpiresAt);
    if (isPast(exp)) return <span className="text-red-400 font-mono text-[10px]">Expired</span>;
    return (
      <span className="text-blue-400 font-mono text-[10px]">
        {formatDistanceToNow(exp, { addSuffix: true })}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-500" />
            Superadmin Portal
          </h2>
          <p className="text-sm text-neutral-400 mt-1">Manage users and access tokens.</p>
        </div>
        <button
          onClick={() => setShowAddUser(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Search ID or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 text-sm placeholder:text-neutral-600 pl-10 pr-4 py-2 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-950/50 border-b border-neutral-800">
              <th className="px-6 py-3 text-[10px] uppercase font-mono tracking-wider text-neutral-500">Employee ID</th>
              <th className="px-6 py-3 text-[10px] uppercase font-mono tracking-wider text-neutral-500">Name</th>
              <th className="px-6 py-3 text-[10px] uppercase font-mono tracking-wider text-neutral-500">Role</th>
              <th className="px-6 py-3 text-[10px] uppercase font-mono tracking-wider text-neutral-500">Token Status</th>
              <th className="px-6 py-3 text-[10px] uppercase font-mono tracking-wider text-neutral-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-neutral-500">Loading...</td>
              </tr>
            ) : filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-neutral-500">No matching users found.</td>
              </tr>
            ) : (
              filteredEmployees.map((emp) => (
                <tr key={emp.employeeId} className="hover:bg-neutral-800/30 transition-colors">
                  <td className="px-6 py-4 text-xs font-mono text-neutral-300">{emp.employeeId}</td>
                  <td className="px-6 py-4 text-sm font-medium">{emp.firstName} {emp.lastName}</td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                      {emp.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {renderTokenStatus(emp)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => {
                        setSelectedEmp(emp);
                        setGeneratedToken('');
                        setShowTokenModal(true);
                      }}
                      className="text-xs font-medium text-blue-400 hover:text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 ml-auto"
                    >
                      <Key className="w-3.5 h-3.5" />
                      Issue Token
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-4">Add Employee</h3>
            <form onSubmit={handleAddUser} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Employee ID</label>
                <input required type="text" value={newUserId} onChange={e => setNewUserId(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">First Name</label>
                  <input required type="text" value={newFirstName} onChange={e => setNewFirstName(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1">Last Name</label>
                  <input required type="text" value={newLastName} onChange={e => setNewLastName(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1">Role</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value as any)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white">
                  <option value="Employee">Employee</option>
                  <option value="HR Coordinator">HR Coordinator</option>
                  <option value="HR Manager">HR Manager</option>
                  <option value="Admin">Admin</option>
                  <option value="Superadmin">Superadmin</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end mt-6">
                <button type="button" onClick={() => setShowAddUser(false)} className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold text-white flex items-center gap-1.5"><Save className="w-4 h-4"/> Save User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Token Modal */}
      {showTokenModal && selectedEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-lg font-bold mb-1">Issue Access Token</h3>
            <p className="text-sm text-neutral-400 mb-5">
              Generating token for {selectedEmp.firstName} {selectedEmp.lastName} <span className="font-mono text-xs opacity-75">({selectedEmp.employeeId})</span>
            </p>

            {generatedToken ? (
              <div className="space-y-4">
                <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl flex items-center justify-between">
                  <code className="text-lg text-blue-400 font-mono tracking-widest">{generatedToken}</code>
                  <button
                    onClick={handleCopy}
                    className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-neutral-400 text-center">
                  Copy this token now. It will not be shown again.
                </p>
                <button onClick={() => setShowTokenModal(false)} className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm font-medium">Done</button>
              </div>
            ) : (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-2">Token Duration</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[7, 30, 90].map(days => (
                      <button
                        key={days}
                        onClick={() => setTokenDuration(days)}
                        className={`py-2 rounded-lg text-xs font-medium border ${
                          tokenDuration === days 
                            ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' 
                            : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-600'
                        }`}
                      >
                        {days} Days
                      </button>
                    ))}
                  </div>
                  {/* Allow custom 9999 days for testing */}
                  <button onClick={() => setTokenDuration(9999)} className={`mt-2 w-full py-2 rounded-lg text-xs font-medium border ${tokenDuration === 9999 ? 'bg-blue-600/20 border-blue-500/50 text-blue-400' : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-600'}`}>
                    9999 Days (Permanent)
                  </button>
                </div>
                
                <div className="flex gap-2 justify-end mt-6">
                  <button onClick={() => setShowTokenModal(false)} className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white">Cancel</button>
                  <button onClick={handleIssueToken} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold text-white flex items-center gap-1.5"><Key className="w-4 h-4"/> Generate Token</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
