import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import Donation from "@/models/Donation";

export async function GET() {
  try {
    await connectMongo();

    // Obtener estadísticas generales
    const stats = await Donation.getStats();

    // Obtener donaciones recientes
    const recentDonations = await Donation.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select("donorName donorEmail amount donationType status createdAt");

    // Obtener donaciones por mes (últimos 6 meses)
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthDonations = await Donation.find({
        createdAt: {
          $gte: startOfMonth,
          $lte: endOfMonth,
        },
      });

      const monthTotal = monthDonations.reduce(
        (sum, donation) => sum + donation.amount,
        0
      );

      monthlyStats.push({
        month: date.toLocaleDateString("es-MX", {
          month: "short",
          year: "numeric",
        }),
        total: monthTotal,
        count: monthDonations.length,
      });
    }

    // Obtener donadores recurrentes activos
    const activeRecurringDonors = await Donation.getActiveRecurringDonors();

    // Obtener donaciones por tipo
    const typeStats = await Donation.aggregate([
      {
        $group: {
          _id: "$donationType",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    const response = {
      ...stats,
      recentDonations,
      monthlyStats,
      activeRecurringDonors: activeRecurringDonors.length,
      typeStats: typeStats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          totalAmount: stat.totalAmount,
        };
        return acc;
      }, {}),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error obteniendo estadísticas de donaciones:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
