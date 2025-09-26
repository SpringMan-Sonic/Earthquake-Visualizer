import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);
function MagnitudeChart({ earthquakes }) {
  const bins = ["<2", "2-2.9", "3-3.9", "4-4.9", "5-5.9", "6+"];
  const magCounts = {
    "<2": 0,
    "2-2.9": 0,
    "3-3.9": 0,
    "4-4.9": 0,
    "5-5.9": 0,
    "6+": 0,
  };

  earthquakes.forEach((eq) => {
    const mag = eq.properties.mag || 0;
    if (mag < 2) magCounts["<2"]++;
    else if (mag < 3) magCounts["2-2.9"]++;
    else if (mag < 4) magCounts["3-3.9"]++;
    else if (mag < 5) magCounts["4-4.9"]++;
    else if (mag < 6) magCounts["5-5.9"]++;
    else magCounts["6+"]++;
  });

  const data = {
    labels: bins,
    datasets: [
      {
        label: "Number of Earthquakes",
        data: bins.map((b) => magCounts[b]),
        backgroundColor: bins.map((b) => {
          if (b === "<2" || b === "2-2.9") return "green";
          if (b === "3-3.9" || b === "4-4.9") return "orange";
          return "red";
        }),
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: "#FFD700" } },
      title: {
        display: true,
        text: "Magnitude Distribution",
        color: "#FFD700",
      },
    },
    scales: {
      x: { ticks: { color: "#FFD700" }, grid: { color: "#444" } },
      y: { ticks: { color: "#FFD700" }, grid: { color: "#444" } },
    },
  };

  return (
    <div className="h-[300px] sm:h-[350px] md:h-[400px]">
      <Bar data={data} options={options} />
    </div>
  );
}

export default function App() {
  const [earthquakes, setEarthquakes] = useState([]);
  const [timeRange, setTimeRange] = useState("all_day");
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const feedMap = {
          all_day: "all_day",
          all_week: "all_week",
          all_month: "all_month",
        };

        const feedName = feedMap[timeRange];
        const url = `https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/${feedName}.geojson`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch ");

        const data = await response.json();

        if (!data.features || data.features.length === 0) {
          setError("No earthquakes recorded in the selected time range.");
          setEarthquakes([]);
        } else {
          setEarthquakes(data.features);
          setError(null);
        }
      } catch (err) {
        setError(err.message);
        setEarthquakes([]);
      }
    }
    fetchData();
  }, [timeRange]);

  const getColor = (magnitude) => {
    if (magnitude < 3) return "green";
    if (magnitude < 5) return "orange";
    return "red";
  };

  const customIcon = (magnitude) => {
    const size = Math.max(magnitude * 4, 8);
    return L.divIcon({
      html: `<div style="background: ${getColor(
        magnitude
      )}; border: 2px solid gold; border-radius: 50%; width: ${size}px; height: ${size}px; opacity: 0.8;"></div>`,
      className: "",
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-gold">
      <header className="p-4 sm:p-6 bg-black border-b border-gold text-center">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">
          🌍 Earthquake Visualizer
        </h1>
        <p className="text-sm sm:text-base mt-1 sm:mt-2">
          Live data Extracted from USGS API !!!
        </p>
      </header>

      <div className="flex flex-col sm:flex-row justify-center gap-4 p-4 sm:p-6 bg-black border-b border-gold">
        <label className="font-semibold mb-2 sm:mb-0">
          Select the Time Range :{" "}
        </label>
        <select
          className="bg-black border border-gold text-gold rounded p-2"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <option value="all_day">Past Day</option>
          <option value="all_week">Past Week</option>
          <option value="all_month">Past Month</option>
        </select>
      </div>

      <main className="flex-1 flex flex-col gap-4 p-2 sm:p-4">
        {error ? (
          <div className="text-center text-red-500 p-4">{error}</div>
        ) : (
          <>
            <div className="h-[50vh] sm:h-[60vh] md:h-[70vh] w-full">
              <MapContainer center={[20, 0]} zoom={2} className="h-full w-full">
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />

                <MarkerClusterGroup>
                  {earthquakes.map((eq) => {
                    const [lon, lat, depth] = eq.geometry.coordinates;
                    const mag = eq.properties.mag || 1;
                    return (
                      <Marker
                        key={eq.id}
                        position={[lat, lon]}
                        icon={customIcon(mag)}
                      >
                        <Popup>
                          <div className="text-black">
                            <strong>Location:</strong> {eq.properties.place}
                            <br />
                            <strong>Magnitude:</strong> {mag}
                            <br />
                            <strong>Depth:</strong> {depth} km
                            <br />
                            <strong>Time:</strong>{" "}
                            {new Date(eq.properties.time).toLocaleString()}
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MarkerClusterGroup>
              </MapContainer>
            </div>

            <MagnitudeChart earthquakes={earthquakes} />
          </>
        )}
      </main>
    </div>
  );
}
