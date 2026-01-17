import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGallery extends Document {
    url: string;
    title: string;
    description: string;
    createdAt: Date;
}

const GallerySchema: Schema<IGallery> = new Schema(
    {
        url: {
            type: String,
            required: [true, "Please provide an image URL"],
        },
        title: {
            type: String,
            required: [true, "Please provide a title"],
        },
        description: {
            type: String,
            required: [true, "Please provide a description"],
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

export const Gallery: Model<IGallery> =
    mongoose.models.Gallery || mongoose.model<IGallery>("Gallery", GallerySchema);
