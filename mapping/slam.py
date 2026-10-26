"""SLAM and occupancy grid management."""

from backend.config import get_settings
from backend.models.schemas import OccupancyGrid, Position


class SLAMManager:
    """Manages SLAM maps and occupancy grids."""

    def __init__(self) -> None:
        self.settings = get_settings()
        self._width = 200
        self._height = 200
        self._resolution = self.settings.map_resolution

    def get_occupancy_grid(self) -> OccupancyGrid:
        """Return simulated occupancy grid for demo."""
        data = [0] * (self._width * self._height)

        # Add walls
        for x in range(self._width):
            data[x] = 100
            data[(self._height - 1) * self._width + x] = 100
        for y in range(self._height):
            data[y * self._width] = 100
            data[y * self._width + self._width - 1] = 100

        # Internal obstacles
        for x in range(60, 80):
            for y in range(40, 120):
                data[y * self._width + x] = 100

        for x in range(120, 140):
            for y in range(80, 160):
                data[y * self._width + x] = 100

        return OccupancyGrid(
            width=self._width,
            height=self._height,
            resolution=self._resolution,
            origin=Position(x=-5.0, y=-5.0, z=0.0),
            data=data,
        )
