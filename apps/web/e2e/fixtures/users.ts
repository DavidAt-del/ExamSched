// Single source of truth for the E2E test fixtures. Specs import from here
// so a credential change is one line. National IDs all pass the Israeli ID
// check digit (validated by NationalId VO).

export interface TestUser {
  id: string;
  nationalId: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  password: string;
  role: 'admin' | 'exam_staff' | 'proctor';
  proctorType: 'opener' | 'regular' | null;
  mustChangePassword: boolean;
}

export const TEST_USERS: TestUser[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    nationalId: '000000018',
    firstName: 'Admin',
    lastName: 'Root',
    phone: null,
    email: 'admin@example.test',
    password: 'Admin1!23',
    role: 'admin',
    proctorType: null,
    mustChangePassword: false,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    nationalId: '000000026',
    firstName: 'Staff',
    lastName: 'Member',
    phone: null,
    email: 'staff@example.test',
    password: 'Staff1!23',
    role: 'exam_staff',
    proctorType: null,
    mustChangePassword: false,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    nationalId: '000000034',
    firstName: 'Dana',
    lastName: 'Cohen',
    phone: null,
    email: 'dana@example.test',
    // First-time login flow: must change password.
    password: '123456',
    role: 'proctor',
    proctorType: 'opener',
    mustChangePassword: true,
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    nationalId: '000000042',
    firstName: 'Yossi',
    lastName: 'Levi',
    phone: null,
    email: 'yossi@example.test',
    password: 'Pass1!23',
    role: 'proctor',
    proctorType: 'regular',
    mustChangePassword: false,
  },
];

export const ADMIN = TEST_USERS[0]!;
export const STAFF = TEST_USERS[1]!;
export const PROCTOR_OPENER_FIRST_LOGIN = TEST_USERS[2]!;
export const PROCTOR_REGULAR = TEST_USERS[3]!;

export const TEST_PERIOD = {
  id: '55555555-5555-5555-5555-555555555555',
  name: 'E2E Period',
  // 30 days into the future from setup time.
  deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  createdBy: ADMIN.id,
};

export const TEST_EXAM = {
  id: '66666666-6666-6666-6666-666666666666',
  periodId: TEST_PERIOD.id,
  // 14 days out — comfortably before the deadline.
  examDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10),
  startTime: '09:00:00',
  endTime: '12:00:00',
  classroomCount: 2,
};
