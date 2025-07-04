import mongoose from "mongoose";

const podcastVideoSchema = new mongoose.Schema(
  {
    videoId: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    publishedAt: {
      type: Date,
      required: true,
    },
    thumbnail: {
      type: String,
      default: "",
    },
    duration: {
      type: String,
      default: "",
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    aiSummary: {
      type: String,
      default: "",
    },
    aiTitle: {
      type: String,
      default: "",
    },
    mondayItemId: {
      type: String,
      default: "",
    },
    isProcessed: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    lastSynced: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Índices para optimizar consultas
podcastVideoSchema.index({ videoId: 1 });
podcastVideoSchema.index({ publishedAt: -1 });
podcastVideoSchema.index({ isProcessed: 1 });
podcastVideoSchema.index({ isPublished: 1 });

const PodcastVideo =
  mongoose.models.PodcastVideo ||
  mongoose.model("PodcastVideo", podcastVideoSchema);

export default PodcastVideo;
