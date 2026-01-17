import mongoose from "mongoose";

const settingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true
    },
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    label: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    type: {
        type: String,
        enum: ["text", "number", "boolean", "email"],
        default: "text"
    },
    category: {
        type: String,
        default: "General"
    }
}, { timestamps: true });

export const Setting = mongoose.models.Setting || mongoose.model("Setting", settingSchema);
