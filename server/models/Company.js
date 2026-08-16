import mongoose from "mongoose";

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    logo: { type: String, default: "" },
    industry: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Company", companySchema);
