# SceneMind Robot Platform
# ROS2 Humble differential drive robot with sensors

## Robot Specifications

| Component | Model | Interface |
|-----------|-------|-----------|
| Camera | RGB Camera | ROS2 Image topic |
| Depth Camera | Intel RealSense (sim) | depth/image_raw |
| Lidar | 2D Lidar | scan |
| IMU | 9-DOF IMU | imu/data |
| Wheels | Differential Drive | cmd_vel |
| Battery | LiPo 12V | battery_state |

## ROS2 Package Structure

```
robot/
├── scenemind_bringup/     # Launch files
├── scenemind_description/ # URDF/Xacro robot model
├── scenemind_navigation/  # Nav2 configuration
├── scenemind_perception/  # Vision node bridges
└── scenemind_teleop/      # Teleoperation
```

## Quick Start (Ubuntu 24.04 + ROS2 Humble)

```bash
# Source ROS2
source /opt/ros/humble/setup.bash

# Build packages
cd robot && colcon build && source install/setup.bash

# Launch full stack
ros2 launch scenemind_bringup robot.launch.py
```

## Isaac Sim Integration

1. Import CAD model from `cad/exports/` into Isaac Sim
2. Configure ROS2 bridge extension
3. Set `ISAAC_SIM_HOST` in `.env`
4. Launch with `simulation_mode=true`

## Topics

| Topic | Type | Description |
|-------|------|-------------|
| /scenemind/camera/image_raw | sensor_msgs/Image | RGB camera feed |
| /scenemind/scan | sensor_msgs/LaserScan | Lidar data |
| /scenemind/odom | nav_msgs/Odometry | Robot odometry |
| /scenemind/cmd_vel | geometry_msgs/Twist | Velocity commands |
| /scenemind/map | nav_msgs/OccupancyGrid | SLAM map |
