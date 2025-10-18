"use client";

import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface GenderChartProps {
  data: {
    male: number;
    female: number;
    other: number;
  };
}

export default function GenderChart({ data }: GenderChartProps) {
  const chartData = {
    labels: ["Male", "Female", "Other"],
    datasets: [
      {
        data: [data.male, data.female, data.other],
        backgroundColor: [
          "rgb(59, 130, 246)", // Blue
          "rgb(236, 72, 153)", // Pink
          "rgb(139, 92, 246)", // Purple
        ],
        borderColor: [
          "rgb(59, 130, 246)",
          "rgb(236, 72, 153)",
          "rgb(139, 92, 246)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
    },
  };

  return (
    <div className="h-[250px]">
      <Doughnut data={chartData} options={options} />
    </div>
  );
}

