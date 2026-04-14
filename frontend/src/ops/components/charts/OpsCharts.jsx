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

export function ActionDistributionChart({ actions = [] }) {
  const categoryColors = {
    Browsing: "rgba(59, 130, 246, 0.82)",
    Search: "rgba(37, 99, 235, 0.82)",
    "Cart actions": "rgba(6, 182, 212, 0.82)",
    "Wishlist actions": "rgba(244, 63, 94, 0.82)",
    "Login/Signup": "rgba(16, 185, 129, 0.82)",
    Checkout: "rgba(245, 158, 11, 0.82)",
    "Security checks": "rgba(139, 92, 246, 0.82)",
    "Suspicious behavior": "rgba(239, 68, 68, 0.82)",
  };

  const labels = actions.map((a) => a.label);
  const categories = [...new Set(actions.map((a) => a.category || "Browsing"))];
  const datasets = categories.map((category) => ({
    label: category,
    data: actions.map((a) => (a.category === category ? a.count : 0)),
    backgroundColor: categoryColors[category] || "rgba(148, 163, 184, 0.82)",
    borderColor: (categoryColors[category] || "rgba(148, 163, 184, 0.82)").replace("0.82", "1"),
    borderWidth: 1,
    borderRadius: 6,
  }));

  const data = { labels, datasets };
  const axes = buildAxesOptions();

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: buildLegend(),
      tooltip: {
        ...buildTooltip(),
        callbacks: {
          title: (context) => labels[context[0].dataIndex] || "Action",
          afterTitle: (context) => {
            const item = actions[context[0].dataIndex];
            return item?.category ? `Category: ${item.category}` : undefined;
          },
          beforeBody: (context) => {
            const item = actions[context[0].dataIndex];
            if (!item) return undefined;
            return `${item.description}\nRaw event: ${item.action}`;
          },
          afterBody: (context) => {
            const item = actions[context[0].dataIndex];
            if (!item) return undefined;
            return item.suspicious
              ? "Why it matters: marked as suspicious behavior."
              : "Why it matters: normal customer behavior.";
          },
        },
      },
    },
    scales: {
      ...axes,
      x: {
        ...axes.x,
        title: {
          display: true,
          text: "Visitor action (plain language)",
          color: TICK_COLOR,
        },
      },
      y: {
        ...axes.y,
        title: {
          display: true,
          text: "Event count in live forensic window",
          color: TICK_COLOR,
        },
      },
    },
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
