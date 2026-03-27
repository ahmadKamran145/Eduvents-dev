import mongoose, { Schema, model, models } from "mongoose";

export interface ISiteUser {
  _id?: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  subjectInterests: string[];
  role: "teacher" | "other";
  favourites: mongoose.Types.ObjectId[];
  bookedEvents: mongoose.Types.ObjectId[];
  resetToken?: string;
  resetTokenExpiry?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const SiteUserSchema = new Schema<ISiteUser>(
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
    subjectInterests: [{ type: String }],
    role: {
      type: String,
      enum: ["teacher", "other"],
      required: [true, "Required"],
    },
    favourites: [{ type: Schema.Types.ObjectId, ref: "Event" }],
    bookedEvents: [{ type: Schema.Types.ObjectId, ref: "Event" }],
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

const SiteUser =
  models.SiteUser || model<ISiteUser>("SiteUser", SiteUserSchema);

export default SiteUser;
