import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const RiskTrendChart = () => {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(29, 30, 38, 0.9)',
        titleColor: '#00ffaa',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 1.0,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.4)',
          stepSize: 0.2
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.4)',
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
  };

  const labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'];
  const data = {
    labels,
    datasets: [
      {
        fill: true,
        label: 'Average Risk Score',
        data: [0.1, 0.3, 0.2, 0.5, 0.8, 0.4, 0.2],
        borderColor: '#00ffaa',
        backgroundColor: 'rgba(0, 255, 170, 0.1)',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointBackgroundColor: '#00ffaa'
      },
    ],
  };

  return (
    <div className="h-full w-full min-h-[250px]">
      <Line options={options} data={data} />
    </div>
  );
};
