export const UserRole = {
  Admin: 'admin',
  ExamStaff: 'exam_staff',
  Proctor: 'proctor',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const ProctorType = {
  Opener: 'opener',
  Regular: 'regular',
} as const;
export type ProctorType = (typeof ProctorType)[keyof typeof ProctorType];

export const ExamPeriodStatus = {
  Open: 'open',
  Closed: 'closed',
  Scheduled: 'scheduled',
  Sent: 'sent',
} as const;
export type ExamPeriodStatus = (typeof ExamPeriodStatus)[keyof typeof ExamPeriodStatus];

export const NotificationChannel = {
  Email: 'email',
  Sms: 'sms',
} as const;
export type NotificationChannel = (typeof NotificationChannel)[keyof typeof NotificationChannel];

export const NotificationStatus = {
  Pending: 'pending',
  Sent: 'sent',
  Failed: 'failed',
} as const;
export type NotificationStatus = (typeof NotificationStatus)[keyof typeof NotificationStatus];
