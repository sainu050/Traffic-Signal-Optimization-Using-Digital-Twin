import os
import sys
import math
import random

if "SUMO_HOME" in os.environ:
    sys.path.append(os.path.join(os.environ["SUMO_HOME"], "tools"))
import traci

# ============================================================
# PEDESTRIAN SIMULATION CONFIGURATION (STAGE 1)
# ============================================================
PEDESTRIAN_ENABLED = True
PEDESTRIAN_MIN_SPAWN_INTERVAL = 10.0   # Minimum seconds between pedestrian group spawns
PEDESTRIAN_MAX_SPAWN_INTERVAL = 25.0   # Maximum seconds between pedestrian group spawns
PEDESTRIAN_MAX_GROUP_SIZE = 4          # Max pedestrians in a single group
PEDESTRIAN_WALK_SPEED_MIN = 1.0        # Realistic min walking speed (m/s)
PEDESTRIAN_WALK_SPEED_MAX = 1.6        # Realistic max walking speed (m/s)

# ============================================================
# CROSSING INFRASTRUCTURE DEFINITIONS (SUMO Junction C)
# ============================================================
# Junction C is at (300, 300).
# Road width is 16m (lanes width 8m in each direction).
# Zebra crossings are placed at the approach boundaries:
# - North: y = 314.0, road spans x: 292 to 308 (curbs at x=290 and 310)
# - South: y = 286.0, road spans x: 292 to 308 (curbs at x=290 and 310)
# - East:  x = 314.0, road spans y: 292 to 308 (curbs at y=290 and 310)
# - West:  x = 286.0, road spans y: 292 to 308 (curbs at y=290 and 310)
PEDESTRIAN_CROSSINGS = {
    "north": {
        "signal_arm": "north",
        "edge_id": "N2C",
        "axis": "horizontal",
        "fixed_coord": 314.0,
        "curb_start": 290.0,
        "curb_end": 310.0,
        "angle_forward": 90.0,    # West to East
        "angle_backward": 270.0   # East to West
    },
    "south": {
        "signal_arm": "south",
        "edge_id": "S2C",
        "axis": "horizontal",
        "fixed_coord": 286.0,
        "curb_start": 290.0,
        "curb_end": 310.0,
        "angle_forward": 90.0,    # West to East
        "angle_backward": 270.0   # East to West
    },
    "east": {
        "signal_arm": "east",
        "edge_id": "E2C",
        "axis": "vertical",
        "fixed_coord": 314.0,
        "curb_start": 290.0,
        "curb_end": 310.0,
        "angle_forward": 0.0,     # South to North
        "angle_backward": 180.0   # North to South
    },
    "west": {
        "signal_arm": "west",
        "edge_id": "W2C",
        "axis": "vertical",
        "fixed_coord": 286.0,
        "curb_start": 290.0,
        "curb_end": 310.0,
        "angle_forward": 0.0,     # South to North
        "angle_backward": 180.0   # North to South
    }
}


class Pedestrian:
    def __init__(self, ped_id: str, crossing_name: str, direction: str,
                 start_x: float, start_y: float, dest_x: float, dest_y: float,
                 speed: float, angle: float, edge_id: str):
        self.id = ped_id
        self.crossing = crossing_name
        self.direction = direction
        self.edge_id = edge_id
        self.x = start_x
        self.y = start_y
        self.start_x = start_x
        self.start_y = start_y
        self.dest_x = dest_x
        self.dest_y = dest_y
        self.speed = speed
        self.angle = angle
        self.state = "WAITING"  # WAITING -> CROSSING -> COMPLETED
        
        # Calculate unit direction vector
        dx = dest_x - start_x
        dy = dest_y - start_y
        dist = math.hypot(dx, dy)
        self.dx = dx / dist if dist > 0 else 0
        self.dy = dy / dist if dist > 0 else 0
        self.total_dist = dist

    def to_dict(self):
        return {
            "id": self.id,
            "crossing": self.crossing,
            "direction": self.direction,
            "x": round(self.x, 2),
            "y": round(self.y, 2),
            "speed": round(self.speed, 2),
            "angle": self.angle,
            "state": self.state
        }


class PedestrianManager:
    def __init__(self):
        self.pedestrians: dict[str, Pedestrian] = {}
        self.ped_counter = 0
        self.completed_count = 0
        # Schedule first spawn shortly after startup (3 to 6 seconds)
        self.time_to_next_spawn = random.uniform(3.0, 6.0)

    def reset(self):
        """Cleans up all active pedestrians when simulation restarts or reloads."""
        for ped_id in list(self.pedestrians.keys()):
            try:
                traci.person.remove(ped_id)
            except Exception:
                pass
        self.pedestrians.clear()
        self.completed_count = 0
        self.time_to_next_spawn = random.uniform(3.0, 6.0)

    def spawn_group(self, current_signals: dict):
        """Spawns an occasional realistic pedestrian or small group (1-4)."""
        crossing_keys = list(PEDESTRIAN_CROSSINGS.keys())
        crossing_name = random.choice(crossing_keys)
        crossing_cfg = PEDESTRIAN_CROSSINGS[crossing_name]

        # Determine realistic group size:
        # Most occurrences: 1 pedestrian (55%)
        # Sometimes: 2 pedestrians (25%)
        # Occasionally: 3 pedestrians (12%) or 4 pedestrians (8%)
        group_size = random.choices([1, 2, 3, 4], weights=[0.55, 0.25, 0.12, 0.08])[0]
        group_size = min(group_size, PEDESTRIAN_MAX_GROUP_SIZE)

        # Randomize crossing direction (forward or backward)
        direction_forward = random.choice([True, False])

        axis = crossing_cfg["axis"]
        fixed = crossing_cfg["fixed_coord"]
        curb_start = crossing_cfg["curb_start"] if direction_forward else crossing_cfg["curb_end"]
        curb_dest = crossing_cfg["curb_end"] if direction_forward else crossing_cfg["curb_start"]
        angle = crossing_cfg["angle_forward"] if direction_forward else crossing_cfg["angle_backward"]
        direction_label = "forward" if direction_forward else "backward"

        for i in range(group_size):
            self.ped_counter += 1
            ped_id = f"ped_{self.ped_counter:03d}"
            speed = round(random.uniform(PEDESTRIAN_WALK_SPEED_MIN, PEDESTRIAN_WALK_SPEED_MAX), 2)

            # Lateral offset across the crossing width (so pedestrians don't overlap)
            lateral_offset = (i - (group_size - 1) / 2.0) * 1.0 + random.uniform(-0.2, 0.2)
            longitudinal_offset = random.uniform(-0.3, 0.3)

            if axis == "horizontal":
                # Crossing North/South arms: fixed coord is Y, walking along X
                start_x = curb_start + longitudinal_offset
                start_y = fixed + lateral_offset
                dest_x = curb_dest
                dest_y = fixed + lateral_offset
            else:
                # Crossing East/West arms: fixed coord is X, walking along Y
                start_x = fixed + lateral_offset
                start_y = curb_start + longitudinal_offset
                dest_x = fixed + lateral_offset
                dest_y = curb_dest

            ped = Pedestrian(
                ped_id=ped_id,
                crossing_name=crossing_name,
                direction=direction_label,
                start_x=start_x,
                start_y=start_y,
                dest_x=dest_x,
                dest_y=dest_y,
                speed=speed,
                angle=angle,
                edge_id=crossing_cfg["edge_id"]
            )

            # Add to SUMO via TraCI
            try:
                traci.person.add(ped.id, ped.edge_id, 0.0)
                traci.person.appendWaitingStage(ped.id, duration=10000.0)
                traci.person.moveToXY(ped.id, ped.edge_id, ped.x, ped.y, ped.angle, keepRoute=2)
                self.pedestrians[ped.id] = ped
                print(f"[PEDESTRIAN] Spawned {ped.id} at {crossing_name} crossing (group of {group_size})")
                
                # Log initial waiting state with current signal
                signal = current_signals.get(crossing_name, "unknown")
                print(f"[PEDESTRIAN] {ped.id} waiting at {crossing_name} — signal {signal.upper()}")
            except Exception as e:
                # Graceful fail-safe if TraCI is unavailable
                pass

    def step(self, signals: dict, dt: float = 0.08):
        """
        Simulation step called once per TraCI tick BEFORE simulationStep().
        1. Checks signal status for waiting pedestrians (GREEN = WAIT, RED = CROSS).
        2. Advances crossing pedestrians toward the destination curb.
        3. Spawns new pedestrians when spawn timer expires.
        """
        if not PEDESTRIAN_ENABLED:
            return

        # 1. Decrement spawn timer and spawn when ready
        self.time_to_next_spawn -= dt
        if self.time_to_next_spawn <= 0:
            self.spawn_group(signals)
            self.time_to_next_spawn = random.uniform(
                PEDESTRIAN_MIN_SPAWN_INTERVAL, PEDESTRIAN_MAX_SPAWN_INTERVAL
            )

        completed_peds = []

        # 2. Update all active pedestrians
        for ped in self.pedestrians.values():
            if ped.state == "WAITING":
                # Check current vehicle traffic signal for this crossing
                signal_state = signals.get(ped.crossing, "unknown").lower()

                # STRICT SAFETY RULE:
                # GREEN = PEDESTRIAN WAITS
                # RED = PEDESTRIAN MAY CROSS
                # UNKNOWN/YELLOW = PEDESTRIAN WAITS (Safe Fallback)
                if signal_state == "red":
                    ped.state = "CROSSING"
                    print(f"[PEDESTRIAN] {ped.id} allowed to cross — signal RED")
                    print(f"[PEDESTRIAN] {ped.id} started crossing at {ped.crossing}")
                else:
                    # Keep at waiting curb position in SUMO
                    try:
                        traci.person.moveToXY(ped.id, ped.edge_id, ped.x, ped.y, ped.angle, keepRoute=2)
                    except Exception:
                        pass

            elif ped.state == "CROSSING":
                # Advance pedestrian across the crosswalk
                step_dist = ped.speed * dt
                remaining_dist = math.hypot(ped.dest_x - ped.x, ped.dest_y - ped.y)

                if remaining_dist <= step_dist:
                    # Destination reached
                    ped.x = ped.dest_x
                    ped.y = ped.dest_y
                    ped.state = "COMPLETED"
                    completed_peds.append(ped.id)
                    print(f"[PEDESTRIAN] {ped.id} completed crossing at {ped.crossing}")
                else:
                    ped.x += ped.dx * step_dist
                    ped.y += ped.dy * step_dist

                # Update SUMO position via TraCI
                try:
                    traci.person.moveToXY(ped.id, ped.edge_id, ped.x, ped.y, ped.angle, keepRoute=2)
                except Exception:
                    pass

        # 3. Cleanly remove completed pedestrians from SUMO and active registry
        for ped_id in completed_peds:
            try:
                traci.person.remove(ped_id)
            except Exception:
                pass
            if ped_id in self.pedestrians:
                del self.pedestrians[ped_id]
                self.completed_count += 1

    def get_pedestrians_data(self) -> list[dict]:
        """Returns JSON-serializable list of active pedestrians for WebSocket telemetry."""
        return [ped.to_dict() for ped in self.pedestrians.values()]

    def get_metrics(self) -> dict:
        """Returns pedestrian KPIs for dashboard and telemetry."""
        waiting = sum(1 for p in self.pedestrians.values() if p.state == "WAITING")
        crossing = sum(1 for p in self.pedestrians.values() if p.state == "CROSSING")
        return {
            "active_pedestrians": len(self.pedestrians),
            "pedestrians_waiting": waiting,
            "pedestrians_crossing": crossing,
            "pedestrians_completed": self.completed_count
        }
