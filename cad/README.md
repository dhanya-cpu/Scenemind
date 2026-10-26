# SceneMind Robot CAD Model

## Design in Autodesk Fusion 360

### Components to Model

1. **Base Chassis** - 400mm x 300mm x 150mm aluminum frame
2. **Camera Mount** - Adjustable RGB camera bracket (front-top)
3. **Lidar Tower** - 360° 2D lidar mount (center-top)
4. **Depth Camera** - Stereo/depth sensor (front, angled 25°)
5. **Wheel Assemblies** - 160mm diameter differential drive wheels
6. **IMU Module** - Center-mounted 9-DOF inertial unit
7. **Battery Compartment** - 12V LiPo housing (rear)
8. **Compute Bay** - Jetson/NUC mounting plate

### Export for Isaac Sim

```
File → Export → STEP (.step) or FBX (.fbx)
Save to: cad/exports/scenemind_robot.step
```

### Import to NVIDIA Isaac Sim

1. Open Isaac Sim
2. Content Browser → Import → Select `.step` or `.fbx`
3. Add physics colliders to base and wheels
4. Attach sensors:
   - Camera → `camera_link`
   - Lidar → `lidar_link`
   - IMU → `imu_link`
5. Configure ROS2 bridge for topic publishing

### Sensor Positions (from URDF)

| Sensor | Position (x, y, z) | Orientation |
|--------|-------------------|-------------|
| RGB Camera | (0.15, 0, 0.1) | pitch 17° |
| Depth Camera | (0.15, 0.05, 0.08) | pitch 23° |
| Lidar | (0, 0, 0.12) | level |
| IMU | (0, 0, 0) | level |

### Materials

- Chassis: Anodized aluminum (#C0C0C0)
- Wheels: Rubber (#2D2D2D)
- Sensors: Matte black (#1A1A1A)
- Battery: Green accent (#1A9A33)
