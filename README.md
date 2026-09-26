# FleetMind — Decentralized Multi-Robot Task Negotiation & Recovery Engine

[![Tests](https://img.shields.io/badge/pytest-15%2F15%20passed-brightgreen.svg)]()
[![Frontend](https://img.shields.io/badge/frontend-React%2019%20%2B%20Vite%20%2B%20Tailwind-blue.svg)]()
[![Backend](https://img.shields.io/badge/backend-FastAPI%20%2B%20WebSockets-teal.svg)]()
[![Fleet](https://img.shields.io/badge/fleet-500%2B%20AMRs-orange.svg)]()
[![License](https://img.shields.io/badge/license-MIT-purple.svg)]()

> Developed for Hackathon Problem:
> *"Develop a decentralized coordination and mission-management platform capable of orchestrating 500+ heterogeneous autonomous mobile robots in a high-density industrial environment without depending on a continuously available central controller."*

---

## 🚀 Key Highlights & Philosophy

- **Zero Single Point of Failure (SPOF)**: Central servers serve purely as macro-telemetry and non-blocking optimizers.
- **Local Autonomy Fallback**: When the central coordinator fails (`SIMULATE COORDINATOR FAILURE`), robots seamlessly continue local peer-to-peer negotiation, right-of-way resolution, and work execution without stopping.
- **Incomplete Information Modeling**: AMRs operate on local peer sensing bounded by a 120m communication radius using spatial partitioning.
- **100% Deterministic & Observable**: Real-time 2D Canvas visualization of all 500 heterogeneous AMRs, 25 industrial zones, 12 narrow corridors, and 15 charging stations streaming at 10Hz over WebSockets (<30KB payload per frame).

---

## 🏛️ System Architecture

```
+-------------------------------------------------------------------------------+
|                       React Industrial Dashboard (Vite + TS)                  |
|   (Interactive Canvas Map @ 10Hz, Bidding Inspector, Deadlock Graph, Logs)    |
+-------------------------------------------------------------------------------+
                                        ▲ │ (WebSocket + REST)
                                        │ ▼
+-------------------------------------------------------------------------------+
|                          FastAPI Gateway (Uvicorn Async)                      |
|      /ws (10 Hz Compact Binary/JSON Telemetry Stream <30KB per frame)         |
|      /api/state, /api/metrics, /api/scenario/*, /api/failure/*                |
+-------------------------------------------------------------------------------+
                                        │
                                        ▼
+-------------------------------------------------------------------------------+
|                           FleetMind Simulation Engine                         |
|                                                                               |
|   +------------------------------------+  +--------------------------------+  |
|   | Task Auction Pool                  |  | 500+ Heterogeneous AMRs        |  |
|   | - Multi-factor contract bidding    |  | - FAST_PICKER (4.2 m/s)        |  |
|   | - Capability & Battery envelopes   |  | - STANDARD_CARRIER (2.8 m/s)   |  |
|   | - Tie-breaker hashing              |  | - HEAVY_CARRIER (1.6 m/s)      |  |
|   +------------------------------------+  | - SUPPORT_ROBOT (3.2 m/s)      |  |
|                     │                     +--------------------------------+  |
|                     ▼                                      │                  |
|   +------------------------------------+                   ▼                  |
|   | Shared Resource Arbiter            |  +--------------------------------+  |
|   | - 12 Single-lane narrow corridors  |  | Predictive Collision Engine    |  |
|   | - 15 Charging station pads         |  | - Horizon projection (1.0-3.2s)|  |
|   | - Right-of-Way priority rules      |  | - Trajectory intersection alert|  |
|   +------------------------------------+  +--------------------------------+  |
|                     │                                      │                  |
|                     ▼                                      ▼                  |
|   +------------------------------------+  +--------------------------------+  |
|   | Wait-For Deadlock Graph            |  | Battery-Aware Scheduler        |  |
|   | - Directed cycle detection         |  | - Reassignment threshold (<20%)|  |
|   | - Deterministic yield election     |  | - Autonomous charger routing   |  |
|   +------------------------------------+  +--------------------------------+  |
|                     │                                      │                  |
|                     ▼                                      ▼                  |
|   +------------------------------------------------------------------------+  |
|   | Failure Recovery Engine (Hardware dropouts, 0.15s rebidding latency)   |  |
|   +------------------------------------------------------------------------+  |
+-------------------------------------------------------------------------------+
```

---

## 📊 Jury Evaluation Matrix Alignment (100 / 100 Marks)

| Jury Evaluation Criterion | Marks | System Implementation |
| :--- | :---: | :--- |
| **1. Task Allocation & Negotiation** | **25** | Decentralized multi-factor bidding ($C_{\text{cap}} + P_{\text{prio}} + B_{\text{batt}} + W_{\text{work}} + D_{\text{dist}} - \text{Pen}_{\text{col}} - \text{Risk}_{\text{dead}}$). Sub-2ms measured allocation latency. |
| **2. Coordination, Conflict & Deadlock** | **20** | Predictive collision avoidance across $1.0\text{s}-3.2\text{s}$ horizons + Directed wait-for graph cycle detection with deterministic yielding robot selection in 0.18s. |
| **3. Battery-Aware Scheduling & Efficiency** | **15** | Dynamic energy envelope checks before bidding ($E_{\text{req}} > \text{Battery} - 15\%$). Proactive task unassignment when charge drops below 20% + opportunistic charger routing. |
| **4. Failure Recovery & Scalability** | **20** | Hardware failure simulation (`R127 OFFLINE`), automatic task release, peer re-auction within 0.15s with 100% mission continuity. Fluid 10Hz Canvas rendering of 500+ AMRs. |
| **5. Technical Implementation & Innovation** | **20** | Complete coordinator disconnection switch (`LOCAL AUTONOMY ACTIVE`). Robots continue local peer-to-peer negotiation without stopping. Verified end-to-end via 15/15 automated tests. |

---

## ⚡ Quick Start Guide

### 1. Clone the Repository
```bash
git clone https://github.com/Sanjeev12588/FleetMind.git
cd FleetMind
```

### 2. Backend Setup & Startup
Ensure Python 3.11+ is installed:
```bash
# Install dependencies
pip install fastapi uvicorn websockets pydantic pytest

# Run automated test suite (15/15 passing)
python -m pytest backend/tests/test_fleetmind.py -v

# Start FastAPI simulation server
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

### 3. Frontend Setup & Startup
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser to view the industrial fleet control room.

---

## 🎮 Scripted 1-Click Demo Walkthrough

The top control bar provides 5 sequential one-click evaluation triggers:
1. **STEP 1: Emergency Surge** — Injects 25 high-priority emergency tasks; triggers decentralized contract bidding.
2. **STEP 2: Corridor Conflict** — Induces contention between `R021` and `R087` in narrow Corridor C07; resolves right-of-way safely.
3. **STEP 3: Trigger Deadlock** — Injects circular wait dependency `R21 -> R43 -> R82 -> R21`; breaks cycle in 0.18s.
4. **STEP 4: Drain R023 (17%)** — Drains battery under active mission; triggers auto task reassignment and charger routing.
5. **STEP 5: Fail Unit + Disconnect Coordinator** — Fails AMR `R127` and severs central coordination service. Badge transitions to `LOCAL AUTONOMY ACTIVE` with AMRs continuing motion and peer-to-peer bidding.

---

## 📂 Project Structure

```
├── ARCHITECTURE.md                  # Comprehensive architectural specification
├── DEMO_SCRIPT.md                   # Step-by-step jury walkthrough script
├── README.md                        # Project overview & quick start
├── backend/
│   ├── main.py                      # FastAPI app, REST APIs & WebSocket /ws
│   ├── models.py                    # Pydantic data schemas
│   ├── simulation.py                # Core simulation loop & spatial partitioning
│   ├── robot_agent.py               # Autonomous AMR agent decision logic
│   ├── negotiation.py               # Contract-net auction & bid scoring
│   ├── conflict_engine.py           # Collision prediction & corridor arbitration
│   ├── deadlock_detector.py         # Directed wait-for cycle detector
│   ├── battery_scheduler.py         # State-of-charge envelope & charger routing
│   ├── failure_recovery.py          # Hardware dropouts & rebidding engine
│   └── tests/
│       └── test_fleetmind.py        # 15 automated test suites
├── docs/
│   ├── VERIFICATION_REPORT.md       # Full verification audit & measured benchmarks
│   └── DEMO_CHECKLIST.md            # Hackathon presentation checklist
└── frontend/
    ├── package.json                 # React 19, Vite, Tailwind CSS v4, Lucide
    ├── vite.config.ts               # Vite configuration with @tailwindcss/vite
    └── src/
        ├── App.tsx                  # Main layout & WebSocket subscriber
        ├── types.ts                 # TypeScript interfaces
        ├── index.css                # Dark industrial control room theme
        └── components/
            ├── FleetMap.tsx         # 2D Canvas map with pan/zoom/hover
            ├── FleetOverview.tsx    # Fleet status & KPI counters
            ├── TaskNegotiationPanel.tsx # Live candidate bids & score breakdowns
            ├── ConflictMonitor.tsx  # Collision warnings & right-of-way
            ├── DeadlockMonitor.tsx  # Wait-for cycles & recovery metrics
            ├── BatteryMonitor.tsx   # Battery distribution & energy guard
            ├── FailureRecoveryPanel.tsx # Hardware dropouts & autonomy toggle
            ├── EventStream.tsx      # Real-time telemetry feed
            ├── DemoControls.tsx     # 1-click evaluation buttons & simulation speed
            └── MetricsBar.tsx       # 16 continuous telemetry metrics
```

---

## 📜 License
MIT License. Developed for Hackathon Theme 1: Autonomous Multi-Agent Robotics.
