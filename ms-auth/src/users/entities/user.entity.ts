import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password?: string; // Optional for OAuth users in the future

  @Column({ type: 'text', array: true, default: ['user'] })
  roles: string[];

  @Column({ default: false })
  isTwoFactorEnabled: boolean;

  @Column({ nullable: true })
  twoFactorSecret?: string;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLogin?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
