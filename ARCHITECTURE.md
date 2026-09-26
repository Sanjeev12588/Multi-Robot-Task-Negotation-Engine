# FleetMind Architecture Document
## Decentralized Multi-Robot Task Negotiation & Recovery Engine

### 1. System Philosophy & Decentralization Model
FleetMind is designed for high-density industrial facilities operating 500+ heterogeneous Autonomous Mobile Robots (AMRs). Unlike traditional Automated Guided Vehicle (AGV) systems that rely on a central monolithic scheduler as a single point of failure (SPOF), FleetMind implements **Local Decision Autonomy with Global Telemetry**.

- **Autonomous Agents**: Each robot is modeled as an independent agent (`RobotAgent`) executing its own decision loop:
  `observe()` -> `evaluate_task()` -> `calculate_bid()` -> `negotiate()` -> `reserve_resource()` -> `detect_conflict()` -> `replan()` -> `recover()`.
- **Incomplete Local Knowledge**: Robots maintain a localized world model bounded by a communication radius (default 120m). They do not query global databases during execution.
- **Central Coordinator as an Optional Layer**: The central service acts solely as an aggregation, telemetry, and non-blocking macro-objective broadcaster. When the coordinator fails (`SIMULATE COORDINATOR FAILURE`), robots seamlessly continue local peer-to-peer negotiation, right-of-way resolution, and work execution without disruption.

---

### 2. High-Level Architecture

```
+--------------------------------------------------------------------------+
|                       React Industrial Dashboard                         |
|  (Interactive Canvas Map, Bidding Inspector, Deadlock Graph, Event Log)  |
+--------------------------------------------------------------------------+
                                    ▲  │ (WebSocket + REST)
                                    │  ▼
+--------------------------------------------------------------------------+
|                           FastAPI Gateway                                |
|           /ws (Binary/JSON Telemetry Stream @ 10-20 Hz)                  |
|           /api/state, /api/scenario/*, /api/failure/*                    |
+--------------------------------------------------------------------------+
                                    │
                                    ▼
+--------------------------------------------------------------------------+
|                       FleetMind Simulation Engine                        |
|                                                                          |
|  +-------------------------+     +-----------------------------------+  |
|  | Task Auction Pool       |     | 500+ Heterogeneous Robot Agents   |  |
|  | - Broadcast & Filtering |     | - FAST_PICKER, STANDARD_CARRIER   |  |
|  | - Decentralized Bids    |     | - HEAVY_CARRIER, SUPPORT_ROBOT    |  |
|  +-------------------------+     +-----------------------------------+  |
|               │                                    │                     |
|               ▼                                    ▼                     |
|  +-------------------------+     +-----------------------------------+  |
|  | Shared Resource Arbiter |     | Predictive Collision Engine       |  |
|  | - Corridors, Chargers   |     | - Velocity & Path Projection      |  |
|  | - Token Reservation    |     | - Safety Radius Encroachment      |  |
|  +-------------------------+     +-----------------------------------+  |
|               │                                    │                     |
|               ▼                                    ▼                     |
|  +-------------------------+     +-----------------------------------+  |
|  | Deadlock Cycle Detector |     | Battery-Aware Scheduler           |  |
|  | - Directed Wait Graph   |     | - Dynamic Energy Margin Guard     |  |
|  | - Deterministic Yield   |     | - Autonomous Charger Deselection  |  |
|  +-------------------------+     +-----------------------------------+  |
|               │                                    │                     |
|               ▼                                    ▼                     |
|  +-------------------------------------------------------------------+  |
|  | Failure Recovery Engine (Rebidding, Continuity, Latency Tracking) |  |
|  +-------------------------------------------------------------------+  |
+--------------------------------------------------------------------------+
```

---

### 3. Core Component Subsystems

#### A. Heterogeneous Robot Model
- **FAST_PICKER**: High speed (4.2 m/s), low capacity (30 kg), low battery drain.
- **STANDARD_CARRIER**: Medium speed (2.8 m/s), medium capacity (150 kg), balanced battery.
- **HEAVY_CARRIER**: Low speed (1.6 m/s), high capacity (600 kg), higher battery drain, priority right-of-way.
- **SUPPORT_ROBOT**: Maintenance & mobile recharging, high maneuverability (3.2 m/s).

#### B. Decentralized Task Negotiation Protocol
When tasks enter the pool:
1. **Broadcast**: Task metadata (pickup, drop, payload, priority, deadline) is broadcasted within local radio ranges or multicast groups.
2. **Local Evaluation**: Robots evaluate eligibility based on required capability, available payload capacity, and battery envelope.
3. **Multi-Factor Bid Formulation**:
   $$\text{Bid} = w_c \cdot C + w_p \cdot P + w_b \cdot B + w_w \cdot W + w_d \cdot (1 - \hat{D}) - P_{\text{conflict}} - P_{\text{deadline}}$$
   - Distance to pickup & delivery
   - Battery reserve post-delivery
   - Current queue workload
   - Capability bonus
   - Priority urgency multiplier
4. **Decentralized Winner Selection**: Highest bid wins; ties broken deterministically by hash(robot_id, task_id). Live bidding scores and justification are streamed to UI.

#### C. Shared Resources & Right-of-Way Conflict Arbitration
- Resources: Narrow single-lane corridors ($C_1 \dots C_{12}$), charging pads ($S_1 \dots S_{15}$), loading docks ($L_1 \dots L_8$), high-density intersections.
- Conflict Resolution Rules:
  1. Priority level (CRITICAL > HIGH > NORMAL > LOW)
  2. Battery emergency status ($< 15\%$ has immediate right-of-way to charger)
  3. Robot capability weight (HEAVY_CARRIER braking inertia respected)
  4. Reservation timestamp (Earliest reservation wins)
  5. Deterministic tie-breaker: $\text{hash}(R_i) > \text{hash}(R_j)$

#### D. Predictive Collision Avoidance
- Ahead projection: $P(t + \Delta t) = P(t) + \vec{V} \cdot \Delta t$ across 0.5s, 1.5s, 3.0s horizons.
- If predicted inter-robot distance $d < D_{\text{safety}}$ (4.0m), a `COLLISION_PREDICTED` event is raised.
- Yielding robot decelerates or pauses outside the conflict sector, while the right-of-way robot maintains velocity.

#### E. Directed Wait-For Deadlock Graph
- Graph nodes: Robots $R_i$.
- Directed edge $R_i \to R_j$: Robot $R_i$ is waiting for a shared corridor/node occupied or reserved by $R_j$.
- Detection: Real-time Tarjan / cycle-detection algorithm running every tick.
- Deadlock Resolution: Deterministic election of the lowest-impact yielding robot (least progress, lower priority task, or higher maneuverability) which backs out to a siding waypoint, releasing the resource lock.

#### F. Battery-Aware Scheduling & Opportunistic Recharging
- Thresholds:
  - $> 40\%$: Normal operation.
  - $20\% - 40\%$: Low battery; restricted to low-payload, local tasks.
  - $< 20\%$: Critical; refuses new tasks, reassigns pending dropoffs if unfeasible.
  - $< 10\%$: Immediate emergency routing to nearest vacant charging station.
- Task Energy Calculation: $E_{\text{req}} = (d_{\text{pickup}} + d_{\text{drop}}) \times \text{drain\_rate}(\text{payload}, \text{type})$. If $E_{\text{req}} > \text{Battery} - 15\%$, bid is rejected with documented reason.

#### G. Failure Recovery & Coordinator Disconnection
- **Robot Failure**: Sudden hardware dropout marks robot `FAILED`. Active tasks are unassigned, broadcasted to surrounding robots, re-bid within 1.5–2.5 seconds, maintaining 100% mission continuity.
- **Central Coordinator Disconnection**: Simulates wide-area network partition. The UI toggles to "LOCAL AUTONOMY ACTIVE". Robots switch to distributed peer-to-peer gossiping and mutual exclusion tokens for shared corridors. No robot stops moving.

---

### 4. Metrics & Evaluation Mapping
- Task Allocation Success Rate: $\ge 98\%$
- Allocation Latency: $< 150\text{ms}$
- Conflict Resolution Rate: $100\%$ with zero simulated collisions
- Deadlock Recovery Time: $< 3.0\text{s}$
- Mission Continuity: $100\%$ under single and multi-robot failures
- Telemetry Throughput: 500 robots simulated at 10 ticks/second smoothly.
