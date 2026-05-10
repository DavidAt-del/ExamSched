import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { UserRole, ProctorType } from '@app/shared';

@Entity({ name: 'users' })
@Index('uq_users_national_id', ['nationalId'], { unique: true })
export class UserOrmEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('text', { name: 'national_id' })
  nationalId!: string;

  @Column('text', { name: 'first_name' })
  firstName!: string;

  @Column('text', { name: 'last_name' })
  lastName!: string;

  @Column('text', { nullable: true })
  phone!: string | null;

  @Column('text', { nullable: true })
  email!: string | null;

  @Column('text', { name: 'password_hash' })
  passwordHash!: string;

  @Column({
    type: 'enum',
    enum: [UserRole.Admin, UserRole.ExamStaff, UserRole.Proctor],
  })
  role!: UserRole;

  @Column({
    type: 'enum',
    name: 'proctor_type',
    enum: [ProctorType.Opener, ProctorType.Regular],
    nullable: true,
  })
  proctorType!: ProctorType | null;

  @Column('boolean', { name: 'must_change_password', default: true })
  mustChangePassword!: boolean;

  @Column('boolean', { default: true })
  active!: boolean;

  @Column('timestamptz', { name: 'created_at' })
  createdAt!: Date;

  @Column('timestamptz', { name: 'updated_at' })
  updatedAt!: Date;
}
