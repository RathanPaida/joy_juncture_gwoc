import mongoose, { Schema, Model, HydratedDocument } from 'mongoose';
import bcrypt from 'bcryptjs';

/* =========================
   User Interface
========================= */
export interface IUser {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  avatar?: string;
  lastLogin?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
}

/* =========================
   User Schema
========================= */
const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters']
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true
    },
    role: {
      type: String,
      enum: ['admin', 'editor', 'viewer'],
      default: 'viewer'
    },
    avatar: String,
    lastLogin: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/* =========================
   Pre-save: Hash Password
========================= */
UserSchema.pre('save', async function () {
  const user = this as HydratedDocument<IUser>;

  if (!user.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);
});

/* =========================
   Instance Methods
========================= */
UserSchema.methods.comparePassword = async function (
  this: HydratedDocument<IUser>,
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

/* =========================
   Hide Password in JSON
========================= */
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

/* =========================
   Model Export
========================= */
export type UserModel = Model<IUser>;

export const User =
  (mongoose.models.User as UserModel) ||
  mongoose.model<IUser, UserModel>('User', UserSchema);
