# ⚔️ EYE OF KARTIKEYA

**Sovereign Intelligence Command Platform**

EYE OF KARTIKEYA is a high-performance, real-time global intelligence and OSINT (Open Source Intelligence) dashboard. Built with Next.js, it aggregates live data from over 20 global feeds into a unified 3D geospatial interface, providing unparalleled situational awareness across multiple domains.

---

## 👁️ Features

- **Live 3D Geospatial Engine**: Real-time rendering of the global theater.
- **Kartikeya AI Oracle**: An integrated, intelligence-aware AI chatbot powered by OpenRouter's Nemotron models. The Oracle ingests live feed context to provide instant tactical analysis.
- **Aviation & Maritime**: Live ADS-B aircraft tracking and AIS vessel monitoring.
- **Geophysical Intelligence**: Live USGS seismic data (earthquakes/tsunamis) and NASA FIRMS active wildfire hotspots.
- **Cyber & Conflict**: Real-time CVE alerts, GDELT conflict news, and malware tracking.
- **Space & Weather**: Space weather events, solar storms, and severe terrestrial weather alerts.
- **Market Recon**: Live tracking of defense stocks and global commodity indices.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Styling & Animation**: Tailwind CSS, Framer Motion
- **Geospatial Mapping**: Deck.gl / Mapbox
- **AI Integration**: [OpenRouter API](https://openrouter.ai/) (Nemotron Nano 9B)

---

## 🚀 Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/aravindp1807/EYE_of_Kartikeya-.git
   cd EYE_of_Kartikeya-
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy the `.env.example` file to create a new `.env` file. You will need to provide an OpenRouter API key for the AI Oracle to function.
   ```bash
   OPENROUTER_API_KEY=your_api_key_here
   OPENROUTER_MODEL=nvidia/nemotron-nano-9b-v2:free
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to access the command core.

---

*C2 ENGINE: SOVEREIGN COMMAND CORE · NET: VEL NETWORK*
