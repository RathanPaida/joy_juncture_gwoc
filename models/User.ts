import mongoose, { Schema, Model, HydratedDocument } from 'mongoose';
import bcrypt from 'bcryptjs';

/* =========================
   User Interface
========================= */
export interface IUser {
  firebaseUid?: string;
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer' | 'user';
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
    firebaseUid: { type: String },
    email: {
      type: String,
      required: false, // not required if using firebaseUid only
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters'],
      required: false, // not required if using firebaseUid only
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'editor', 'viewer', 'user'],
      default: 'user',
    },
    avatar: String,
    lastLogin: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
    // walletCoins: {
    //   type: Number,
    //   default: 0,
    // },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/* =========================
   Pre-save: Hash Password
========================= */
UserSchema.pre('save', async function () {
  const user = this as HydratedDocument<IUser>;

  if (user.password && user.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
  }
});

/* =========================
   Instance Methods
========================= */
UserSchema.methods.comparePassword = async function (
  this: HydratedDocument<IUser>,
  candidatePassword: string
): Promise<boolean> {
  if (!this.password) return false;
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

