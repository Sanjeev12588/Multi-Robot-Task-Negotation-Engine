# FleetMind Demo Script & Hackathon Presentation Guide
## "Warehouse Emergency Surge" Live Evaluation Walkthrough

This script provides step-by-step instructions for demonstrating FleetMind to the hackathon jury, directly covering the 5 evaluation criteria (100 marks total).

---

### Jury Evaluation Matrix Alignment
1. **Task Allocation & Negotiation (25 Marks)**: Steps 1 & 2 (Auction broadcasts, multi-factor bid scoring, capability matching, live bidding logs).
2. **Coordination, Conflict & Deadlock Handling (20 Marks)**: Steps 3 & 4 (Corridor reservation, predictive collision warning, right-of-way resolution, wait-for cycle detection, deterministic yield).
3. **Battery-Aware Scheduling & Efficiency (15 Marks)**: Step 5 (Energy safety envelopes, task rejection due to insufficient charge, opportunistic routing to chargers).
4. **Failure Recovery & Scalability (20 Marks)**: Steps 6 & 7 (Injecting robot hardware failure, instantaneous task rebidding in <2s, 100% mission continuity, 500+ AMR map scalability).
5. **Technical Implementation, Simulation & Innovation (20 Marks)**: Step 8 (Central Coordinator disconnection, seamless local autonomy failover without stopping the fleet).

---

### Step-by-Step Demo Flow

#### Phase 1: Fleet Initialization & Visual Map (Baseline)
1. **Action**: Launch application and observe the industrial dashboard.
2. **Talking Point**:
   > *"Welcome to FleetMind. We are running an active warehouse floor with 500 heterogeneous autonomous mobile robots — Fast Pickers, Standard Carriers, Heavy Carriers, and Support Units. Notice the real-time Canvas map rendering all 500 units, 25 high-density zones, 12 narrow corridors, and 15 charging stations at 10 Hz over WebSockets."*
3. **Metric to Highlight**: Total Robots: 500, Active Tasks: 120+, Zero central choke point.

#### Phase 2: Decentralized Task Negotiation & Live Bidding
1. **Action**: Click the **"Broadcast Surge Tasks"** button (or trigger Priority Task T84).
2. **Talking Point**:
   > *"Notice how tasks aren't assigned naively by shortest distance. Instead, task metadata is broadcasted to eligible robots. In the Task Negotiation Panel, inspect Task T84: robots evaluate distance, battery margin, payload capacity, and route congestion to compute independent bid scores. Robot R021 wins with 92.4 points due to superior battery envelope and capability match."*
3. **Panel Focus**: "Task Negotiation Panel" showing live bids, scores, and clear reason breakdown.

#### Phase 3: Shared Resource Conflict & Predictive Collision Avoidance
1. **Action**: Click **"Inject Corridor Conflict"**.
2. **Talking Point**:
   > *"Two robots (R21 and R87) are heading toward the narrow single-lane Corridor C7. FleetMind's predictive collision engine projects their vectors 3.4 seconds ahead. Instead of an emergency stop on impact, it predicts the conflict, evaluates right-of-way based on task priority and carrier weight, signals R87 to wait outside the corridor, and lets R21 proceed safely."*
3. **Panel Focus**: "Conflict Monitor" showing `COLLISION_PREDICTED` -> `Action: R87 WAIT` -> `RESOLVED`.

#### Phase 4: Deadlock Cycle Detection & Autonomous Recovery
1. **Action**: Click **"Trigger Circular Deadlock"**.
2. **Talking Point**:
   > *"In dense facilities, cyclic wait conditions occur: R21 waits for R43, R43 waits for R82, and R82 waits for R21. FleetMind maintains an active directed wait-for graph. The Deadlock Detector identifies the cycle in 40ms, elects R43 to yield based on lowest task completion progress, reroutes it to a siding, and breaks the deadlock in 1.8 seconds without human intervention."*
3. **Panel Focus**: "Deadlock Monitor" showing cycle participants, resolution node, and recovery timer.

#### Phase 5: Battery-Aware Task Rejection & Charger Scheduling
1. **Action**: Click **"Drain Active Robot Battery"** on Robot R23.
2. **Talking Point**:
   > *"Robot R23 drops to 17% battery while holding a high-payload task requiring 24% energy. Watch the autonomous battery guard: R23 detects the energy deficit, immediately unassigns the task for rebidding by healthy peers, and re-routes itself to Charging Station S04."*
3. **Panel Focus**: "Battery Monitor" and Event Stream showing `T_REASSIGN: insufficient energy margin`.

#### Phase 6: Unexpected Robot Failure & Resilient Recovery
1. **Action**: Click **"Simulate Robot Failure"** (fails active carrier R127).
2. **Talking Point**:
   > *"A drive motor fails on R127 carrying critical packages. The system immediately marks R127 as FAILED, isolates the unit, re-broadcasts its 3 active tasks to local peers, bids them out, and reassigns them in 1.7 seconds, preserving 100% mission continuity."*
3. **Panel Focus**: "Failure Recovery Panel" showing Affected Tasks: 3, Recovered: 3/3, Latency: 1.7s.

#### Phase 7: Central Coordinator Disconnection (Local Autonomy Demo)
1. **Action**: Click **"Simulate Coordinator Failure"**.
2. **Talking Point**:
   > *"Now for the ultimate resilience test: the central coordination service is severed completely. Watch the status switch to 'CENTRAL COORDINATOR OFFLINE — LOCAL AUTONOMY ACTIVE'. The 500 robots do not freeze! They fall back to peer-to-peer gossip tokens, negotiate right-of-way locally, and complete ongoing tasks safely. Central servers in FleetMind are an optimization layer, not a single point of failure."*
3. **Panel Focus**: Coordinator Status badge turning Amber/Red (`LOCAL AUTONOMY ACTIVE`), active throughput counters continuing unabated.

#### Phase 8: Final Summary & Metrics Wrap-up
1. **Action**: Inspect the comprehensive bottom Metrics Bar.
2. **Key Metrics Review**:
   - Task Allocation Success: **99.4%**
   - Allocation Latency: **82ms**
   - Collision Predictions Resolved: **100%**
   - Deadlocks Resolved: **100% (Avg recovery 1.8s)**
   - Mission Continuity: **100%**
