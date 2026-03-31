import mongoose, { Schema, model, models } from "mongoose";

export interface IAdmin {
  name: string;
  email: string;
  password: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    name: {
      type: String,
      required: [true, "Required"],
      maxlength: [50, "Name must be 50 characters or less"],
    },
    email: {
      type: String,
      required: [true, "Required"],
      unique: true,
      lowercase: true,
      match: [/@/, "Incorrect email format. Email must contain @"],
    },
    password: {
      type: String,
      required: [true, "Required"],
    },
    resetToken: { type: String },
    resetTokenExpiry: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret: any) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.resetToken;
        delete ret.resetTokenExpiry;
        return ret;
      },
    },
  },
);

const Admin = models.Admin || model<IAdmin>("Admin", AdminSchema);

export default Admin;
