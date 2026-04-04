import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
);

const TICK_COLOR = "rgba(186, 201, 224, 0.85)";
const GRID_COLOR = "rgba(120, 138, 164, 0.18)";
const LEGEND_COLOR = "rgba(213, 225, 242, 0.95)";
const TOOLTIP_BG = "rgba(7, 11, 23, 0.95)";
const TOOLTIP_BORDER = "rgba(106, 133, 171, 0.4)";

function buildLegend() {
  return {
    display: true,
    position: "bottom",
    labels: {
      color: LEGEND_COLOR,
      boxWidth: 12,
      boxHeight: 12,
      padding: 14,
      font: { size: 11 },
    },
  };
}

function buildTooltip() {
  return {
    backgroundColor: TOOLTIP_BG,
    borderColor: TOOLTIP_BORDER,
    borderWidth: 1,
    titleColor: "#e2ecff",
    bodyColor: "#d0def6",
    padding: 10,
    displayColors: true,
  };
}

function buildAxesOptions({ beginAtZero = true } = {}) {
  return {
    x: {
      grid: { color: GRID_COLOR, drawBorder: false },
      ticks: { color: TICK_COLOR, maxRotation: 0, autoSkip: true },
    },
    y: {
      beginAtZero,
      grid: { color: GRID_COLOR, drawBorder: false },
      ticks: { color: TICK_COLOR },
    },
  };
}

export function ModeDistributionChart({ labels, values }) {
  const data = {
    labels,
    datasets: [
      {
        label: "Sessions",
        data: values,
        backgroundColor: ["rgba(16, 185, 129, 0.8)", "rgba(239, 68, 68, 0.82)"],
        borderColor: ["rgba(16, 185, 129, 1)", "rgba(248, 113, 113, 1)"],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "62%",
    plugins: {
      legend: buildLegend(),
      tooltip: buildTooltip(),
    },
  };

  return <Doughnut data={data} options={options} />;
}

export function RiskDistributionChart({ labels, values }) {
  const data = {
    labels,
    datasets: [
      {
        label: "Sessions",
        data: values,
        backgroundColor: "rgba(251, 191, 36, 0.75)",
        borderColor: "rgba(251, 191, 36, 1)",
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: buildTooltip(),
    },
    scales: buildAxesOptions(),
  };

  return <Bar data={data} options={options} />;
}

export function EventsTrendChart({ labels, values }) {
  const data = {
    labels,
    datasets: [
      {
        label: "Events",
        data: values,
        borderColor: "rgba(34, 211, 238, 1)",
        backgroundColor: "rgba(34, 211, 238, 0.18)",
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: buildTooltip(),
    },
    scales: buildAxesOptions(),
    interaction: { mode: "index", intersect: false },
  };

  return <Line data={data} options={options} />;
}

export function ActionDistributionChart({ labels, values }) {
  const palette = [
    "rgba(59, 130, 246, 0.82)",
    "rgba(6, 182, 212, 0.82)",
    "rgba(139, 92, 246, 0.82)",
    "rgba(16, 185, 129, 0.82)",
    "rgba(245, 158, 11, 0.82)",
    "rgba(244, 63, 94, 0.82)",
    "rgba(148, 163, 184, 0.82)",
  ];

  const data = {
    labels,
    datasets: [
      {
        label: "Events",
        data: values,
        backgroundColor: labels.map((_, i) => palette[i % palette.length]),
        borderColor: labels.map((_, i) => palette[i % palette.length].replace("0.82", "1")),
        borderWidth: 1,
        borderRadius: 5,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: buildTooltip(),
    },
    scales: buildAxesOptions(),
  };

  return <Bar data={data} options={options} />;
}

/**
 * LIVE SESSION GRAPH
 * Line chart showing active sessions over time with smooth line and green gradient.
 */
export function LiveSessionGraph({ labels, values }) {
  const data = {
    labels,
    datasets: [
      {
        label: "Online Sessions",
        data: values,
        borderColor: "rgba(34, 197, 94, 1)", // Green
        backgroundColor: (context) => {
          const { ctx, chartArea } = context.chart;
          if (!chartArea) return "rgba(34, 197, 94, 0.1)";
          const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, "rgba(34, 197, 94, 0)");
          gradient.addColorStop(1, "rgba(34, 197, 94, 0.25)");
          return gradient;
        },
        fill: true,
        tension: 0.4, // Smooth line
        pointRadius: 4,
        pointBackgroundColor: "rgba(34, 197, 94, 1)",
        pointBorderColor: "rgba(255, 255, 255, 0.1)",
        pointHoverRadius: 6,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: buildTooltip(),
    },
    scales: buildAxesOptions(),
    interaction: { mode: "index", intersect: false },
  };

  return <Line data={data} options={options} />;
}
