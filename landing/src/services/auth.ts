import { db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export type Role = 'Employee' | 'HR Coordinator' | 'HR Manager' | 'Admin' | 'Superadmin';

export interface Employee {
  employeeId: string;
  firstName: string;
  lastName: string;
  role: Role;
  department: string;
  email: string;
  phone?: string;
  position?: string;
  isActive: boolean;
  token?: string;
  tokenExpiresAt?: string;
  createdAt: string;
}

// Generate a random uppercase alphanumeric token
export function generateToken(length = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Seed the Superadmin account
export async function seedSuperadmin(employeeId: string, durationDays: number): Promise<string> {
  const empRef = doc(db, 'employees', employeeId);
  const snap = await getDoc(empRef);
  
  const token = generateToken(16);
  const tokenExpiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

  if (!snap.exists()) {
    // Create
    const sa: Employee = {
      employeeId,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'Superadmin',
      department: 'Executive',
      email: 'admin@jaxx.com',
      isActive: true,
      token,
      tokenExpiresAt,
      createdAt: new Date().toISOString()
    };
    await setDoc(empRef, sa);
  } else {
    // Update existing
    await updateDoc(empRef, {
      token,
      tokenExpiresAt,
      role: 'Superadmin',
      isActive: true
    });
  }
  return token;
}

// Check auth
export async function authenticate(employeeId: string, token: string): Promise<Employee | null> {
  const empRef = doc(db, 'employees', employeeId);
  const snap = await getDoc(empRef);
  
  if (!snap.exists()) return null;
  
  const emp = snap.data() as Employee;
  if (!emp.isActive) return null;
  if (emp.token !== token) return null;
  
  if (emp.tokenExpiresAt && new Date(emp.tokenExpiresAt) < new Date()) {
    return null; // expired
  }
  
  return emp;
}

export function saveSession(emp: Employee) {
  localStorage.setItem('jaxx_session_emp', JSON.stringify(emp));
}

export function getSession(): Employee | null {
  const data = localStorage.getItem('jaxx_session_emp');
  if (!data) return null;
  const emp = JSON.parse(data) as Employee;
  if (emp.tokenExpiresAt && new Date(emp.tokenExpiresAt) < new Date()) {
    localStorage.removeItem('jaxx_session_emp');
    return null;
  }
  return emp;
}

export function clearSession() {
  localStorage.removeItem('jaxx_session_emp');
}
