import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    donorName: {
      type: String,
      required: true,
    },
    donorEmail: {
      type: String,
      required: true,
    },
    donorMessage: {
      type: String,
      default: "",
    },
    donationType: {
      type: String,
      enum: ["one-time", "recurring"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed",
        "cancelled",
        "active",
        "payment_failed",
      ],
      default: "pending",
    },
    customerId: {
      type: String,
      required: false,
    },
    subscriptionId: {
      type: String,
      required: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    lastPaymentDate: {
      type: Date,
      required: false,
    },
    cancelledAt: {
      type: Date,
      required: false,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Índices para mejorar el rendimiento de las consultas
donationSchema.index({ donorEmail: 1 });
donationSchema.index({ status: 1 });
donationSchema.index({ donationType: 1 });
donationSchema.index({ createdAt: -1 });
donationSchema.index({ subscriptionId: 1 });

// Método para obtener estadísticas de donaciones
donationSchema.statics.getStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalDonations: { $sum: 1 },
        totalAmount: { $sum: "$amount" },
        oneTimeDonations: {
          $sum: { $cond: [{ $eq: ["$donationType", "one-time"] }, 1, 0] },
        },
        recurringDonations: {
          $sum: { $cond: [{ $eq: ["$donationType", "recurring"] }, 1, 0] },
        },
        activeRecurring: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$donationType", "recurring"] },
                  { $eq: ["$status", "active"] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  return (
    stats[0] || {
      totalDonations: 0,
      totalAmount: 0,
      oneTimeDonations: 0,
      recurringDonations: 0,
      activeRecurring: 0,
    }
  );
};

// Método para obtener donaciones por período
donationSchema.statics.getDonationsByPeriod = async function (
  startDate,
  endDate
) {
  return await this.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
  }).sort({ createdAt: -1 });
};

// Método para obtener donadores recurrentes activos
donationSchema.statics.getActiveRecurringDonors = async function () {
  return await this.find({
    donationType: "recurring",
    status: "active",
  }).distinct("donorEmail");
};

const Donation =
  mongoose.models.Donation || mongoose.model("Donation", donationSchema);

export default Donation;
