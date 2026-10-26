"""Path planning with A*, Dijkstra, and RRT algorithms."""

import math
import random
from dataclasses import dataclass
from typing import List, Tuple

import networkx as nx

from backend.logging_config import get_logger
from backend.models.schemas import NavGoal

logger = get_logger(__name__)


@dataclass
class PlanResult:
    path: List[NavGoal]
    distance: float
    planner: str


class PathPlanner:
    """Multi-algorithm path planner for autonomous navigation."""

    def __init__(self, grid_size: int = 50) -> None:
        self.grid_size = grid_size
        self._obstacles: set[Tuple[int, int]] = set()

    def plan(self, start: NavGoal, goal: NavGoal, planner: str = "astar") -> PlanResult:
        planners = {
            "astar": self._astar,
            "dijkstra": self._dijkstra,
            "rrt": self._rrt,
        }
        plan_fn = planners.get(planner, self._astar)
        grid_start = self._to_grid(start.x, start.y)
        grid_goal = self._to_grid(goal.x, goal.y)
        grid_path = plan_fn(grid_start, grid_goal)
        world_path = [NavGoal(x=self._from_grid(gx), y=self._from_grid(gy), theta=0.0) for gx, gy in grid_path]
        distance = self._path_length(world_path)
        return PlanResult(path=world_path, distance=distance, planner=planner)

    def _to_grid(self, coord: float) -> int:
        return int(coord / 0.5) + self.grid_size // 2

    def _from_grid(self, grid: int) -> float:
        return (grid - self.grid_size // 2) * 0.5

    def _build_graph(self) -> nx.Graph:
        G = nx.grid_2d_graph(self.grid_size, self.grid_size)
        for node in list(G.nodes):
            if node in self._obstacles:
                G.remove_node(node)
        return G

    def _astar(self, start: Tuple[int, int], goal: Tuple[int, int]) -> List[Tuple[int, int]]:
        G = self._build_graph()
        try:
            path = nx.astar_path(G, start, goal, heuristic=lambda a, b: abs(a[0] - b[0]) + abs(a[1] - b[1]))
            return list(path)
        except nx.NetworkXNoPath:
            return self._fallback_path(start, goal)

    def _dijkstra(self, start: Tuple[int, int], goal: Tuple[int, int]) -> List[Tuple[int, int]]:
        G = self._build_graph()
        try:
            path = nx.dijkstra_path(G, start, goal)
            return list(path)
        except nx.NetworkXNoPath:
            return self._fallback_path(start, goal)

    def _rrt(self, start: Tuple[int, int], goal: Tuple[int, int], max_iter: int = 500) -> List[Tuple[int, int]]:
        tree = {start: None}
        rng = random.Random(42)

        for _ in range(max_iter):
            if rng.random() < 0.1:
                sample = goal
            else:
                sample = (rng.randint(0, self.grid_size - 1), rng.randint(0, self.grid_size - 1))

            nearest = min(tree.keys(), key=lambda n: math.hypot(n[0] - sample[0], n[1] - sample[1]))
            dx = sample[0] - nearest[0]
            dy = sample[1] - nearest[1]
            dist = math.hypot(dx, dy)
            if dist > 3:
                dx, dy = dx / dist * 3, dy / dist * 3
            new_node = (int(nearest[0] + dx), int(nearest[1] + dy))
            new_node = (max(0, min(self.grid_size - 1, new_node[0])), max(0, min(self.grid_size - 1, new_node[1])))

            if new_node not in self._obstacles:
                tree[new_node] = nearest

            if math.hypot(new_node[0] - goal[0], new_node[1] - goal[1]) < 2:
                tree[goal] = new_node
                break

        # Reconstruct path
        path = []
        node = goal
        while node is not None:
            path.append(node)
            node = tree.get(node)
        return list(reversed(path)) if path else self._fallback_path(start, goal)

    def _fallback_path(self, start: Tuple[int, int], goal: Tuple[int, int]) -> List[Tuple[int, int]]:
        steps = max(abs(goal[0] - start[0]), abs(goal[1] - start[1]), 1)
        path = []
        for i in range(steps + 1):
            t = i / steps
            x = int(start[0] + t * (goal[0] - start[0]))
            y = int(start[1] + t * (goal[1] - start[1]))
            path.append((x, y))
        return path

    @staticmethod
    def _path_length(path: List[NavGoal]) -> float:
        total = 0.0
        for i in range(1, len(path)):
            dx = path[i].x - path[i - 1].x
            dy = path[i].y - path[i - 1].y
            total += math.hypot(dx, dy)
        return total
