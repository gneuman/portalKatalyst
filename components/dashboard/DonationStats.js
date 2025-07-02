"use client";
import { useState, useEffect } from "react";
import { FaHeart, FaUsers, FaCalendarAlt, FaDollarSign } from "react-icons/fa";

export default function DonationStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDonationStats();
  }, []);

  const fetchDonationStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/donations/stats");

      if (!response.ok) {
        throw new Error("Error al cargar estadísticas");
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const statsCards = [
    {
      title: "Total de Donaciones",
      value: stats.totalDonations,
      icon: FaHeart,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "Monto Total",
      value: formatCurrency(stats.totalAmount),
      icon: FaDollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Donaciones Únicas",
      value: stats.oneTimeDonations,
      icon: FaHeart,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Donadores Recurrentes",
      value: stats.activeRecurring,
      icon: FaUsers,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${card.bgColor}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico de donaciones por mes */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Donaciones por Mes
        </h3>
        <div className="h-64 flex items-end justify-between space-x-2">
          {[...Array(6)].map((_, i) => {
            const month = new Date();
            month.setMonth(month.getMonth() - (5 - i));
            const monthName = month.toLocaleDateString("es-MX", {
              month: "short",
            });
            const height = Math.random() * 100; // Esto debería venir de datos reales

            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-gradient-to-t from-red-500 to-red-400 rounded-t"
                  style={{ height: `${height}%` }}
                ></div>
                <span className="text-xs text-gray-600 mt-2">{monthName}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resumen de donaciones recientes */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Donaciones Recientes
        </h3>
        <div className="space-y-3">
          {stats.recentDonations?.slice(0, 5).map((donation, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2 rounded-full ${
                    donation.donationType === "recurring"
                      ? "bg-purple-100"
                      : "bg-blue-100"
                  }`}
                >
                  {donation.donationType === "recurring" ? (
                    <FaCalendarAlt className="w-4 h-4 text-purple-600" />
                  ) : (
                    <FaHeart className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {donation.donorName}
                  </p>
                  <p className="text-sm text-gray-600">{donation.donorEmail}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  {formatCurrency(donation.amount)}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(donation.createdAt).toLocaleDateString("es-MX")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
