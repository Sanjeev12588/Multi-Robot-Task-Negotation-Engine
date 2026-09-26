import time
import hashlib
from typing import List, Dict, Tuple, Optional
from .models import Task, TaskStatus, BidDetail, SystemEvent, RobotStatus
from .robot_agent import RobotAgent

class TaskNegotiationEngine:
    """
    Decentralized Task Auction & Negotiation Engine.
    Simulates local broadcast, peer bidding, score reconciliation,
    and deterministic claim/release arbitration.
    """

    def __init__(self):
        self.auction_history: List[BidDetail] = []
        self.completed_auctions_count: int = 0
        self.total_attempted_auctions: int = 0
        self.total_latency_ms: float = 0.0

    def get_success_rate(self) -> float:
        if self.total_attempted_auctions == 0:
            return 100.0
        return round((self.completed_auctions_count / self.total_attempted_auctions) * 100.0, 1)

    def conduct_auction(
        self,
        task: Task,
        agents: List[RobotAgent],
        sim_time: float,
        is_coordinator_online: bool = True
    ) -> Tuple[Optional[RobotAgent], List[BidDetail], Optional[SystemEvent]]:
        """
        Executes a distributed auction round for a given task.
        Works in both Centralized and Local Autonomy modes.
        """
        start_time_real = time.perf_counter()
        self.total_attempted_auctions += 1
        task.status = TaskStatus.NEGOTIATING
        collected_bids: List[BidDetail] = []

        # 1. Broadcast & Local Bid Calculation
        for agent in agents:
            # Under incomplete information / local autonomy, filter if outside comm radius
            if not is_coordinator_online:
                dist_to_task = ((agent.data.x - task.pickup_x)**2 + (agent.data.y - task.pickup_y)**2)**0.5
                if dist_to_task > agent.comm_radius * 1.5:
                    continue  # Out of local peer broadcast range

            bid = agent.calculate_bid(task, sim_time)
            if bid is not None:
                collected_bids.append(bid)
                task.bids[agent.data.id] = bid.score
                task.bid_reasons[agent.data.id] = bid.reason

        if not collected_bids:
            task.status = TaskStatus.QUEUED
            event = SystemEvent(
                id=f"evt_bid_fail_{task.id}_{int(sim_time)}",
                timestamp=sim_time,
                category="AUCTION",
                message=f"Task {task.id} auction yielded no eligible bids (re-queued)",
                severity="WARNING",
                entity_id=task.id
            )
            return None, [], event

        # 2. Bid Comparison & Deterministic Winner Selection
        # Tie-breaker: deterministic hash based on (robot_id, task_id)
        def sort_key(b: BidDetail):
            h = int(hashlib.md5(f"{b.robot_id}_{b.task_id}".encode()).hexdigest()[:6], 16) / 1e7
            return (b.score + h)

        collected_bids.sort(key=sort_key, reverse=True)
        winner_bid = collected_bids[0]
        
        # Find winning agent
        winning_agent = next(a for a in agents if a.data.id == winner_bid.robot_id)

        # 3. Task Claim & Other Robots Release
        task.owner_robot_id = winning_agent.data.id
        task.status = TaskStatus.ASSIGNED
        task.assigned_at = sim_time
        task.winning_bid = winner_bid.score
        
        winner_reason = (
            f"{winning_agent.data.id} won with score {winner_bid.score:.1f} "
            f"({winning_agent.data.robot_type}, Batt {winning_agent.data.battery:.1f}%, CapMatch)"
        )
        task.winning_reason = winner_reason

        # Update winning agent state
        winning_agent.data.current_task = task.id
        winning_agent.data.status = RobotStatus.ASSIGNED
        winning_agent.data.workload += 1
        winning_agent.assigned_task_obj = task
        winning_agent.plan_path_to(task.pickup_x, task.pickup_y)

        # Metrics bookkeeping
        latency_ms = (time.perf_counter() - start_time_real) * 1000.0 + (len(collected_bids) * 0.8)
        self.total_latency_ms += latency_ms
        self.completed_auctions_count += 1
        self.auction_history.extend(collected_bids[:5])  # keep top bids for display

        event = SystemEvent(
            id=f"evt_win_{task.id}_{winning_agent.data.id}",
            timestamp=sim_time,
            category="AUCTION",
            message=f"Task {task.id} assigned to {winning_agent.data.id} (Score: {winner_bid.score:.1f})",
            severity="SUCCESS",
            entity_id=task.id
        )

        return winning_agent, collected_bids, event
