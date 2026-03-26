import mongoose, { Schema, model, models } from "mongoose";

export interface IOrganiser {
  _id?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  organisationName: string;
  resetToken?: string;
  resetTokenExpiry?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const OrganiserSchema = new Schema<IOrganiser>(
  {
    name: {
      type: String,
      required: [true, "Required"],
      maxlength: [100, "Name must be 100 characters or less"],
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
    organisationName: {
      type: String,
      required: [true, "Required"],
      maxlength: [50, "Organisation Name must be 50 characters or less"],
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
    toObject: {
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

const Organiser =
  models.Organiser || model<IOrganiser>("Organiser", OrganiserSchema);

export default Organiser;
